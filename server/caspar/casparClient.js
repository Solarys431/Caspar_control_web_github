/**
 * Client per la comunicazione con il server CasparCG (AMCP)
 * Versione ottimizzata per stabilità, parsing risposte e gestione latenza.
 */
const net = require('net');
const EventEmitter = require('events');

class CasparClient extends EventEmitter {
    constructor(options = {}) {
        super();
        this.host = options.host || 'localhost';
        this.port = options.port || 5250;
        this.connectionTimeout = options.timeout || 15000;
        this.commandTimeout = options.commandTimeout || 10000; // Timeout per risposta a singolo comando
        this.autoReconnect = options.autoReconnect !== undefined ? options.autoReconnect : true;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.keepAliveInterval = options.keepAliveInterval || 8000;

        this.connected = false;
        this.socket = null;
        this.buffer = '';
        this.commandQueue = [];
        this.currentCommand = null; // { command, resolve, reject, timeoutId, isMultiline, linesBuffer: [], statusReceived: false, dataLinesStarted: false }

        this.reconnectAttemptsCount = 0;
        this.reconnectTimerId = null;
        this.keepAliveTimerId = null;
        this.isManuallyDisconnected = false;
        this.isConnecting = false;

        this._log(`Client CasparCG istanziato per ${this.host}:${this.port}. CommandTimeout: ${this.commandTimeout}ms`);
    }

    _log(message, level = 'info') {
        this.emit('log', `[CasparClient] [${level.toUpperCase()}] ${message}`);
    }

    connect() {
        if (this.isConnecting) {
            this._log('Tentativo di connessione ignorato: connessione già in corso.');
            return Promise.reject(new Error('Connessione già in corso.'));
        }
        if (this.connected && this.socket && !this.socket.destroyed) {
            this._log('Già connesso.');
            return Promise.resolve('Già connesso.');
        }

        this._log(`Tentativo di connessione a ${this.host}:${this.port}...`);
        this.isConnecting = true;
        this.isManuallyDisconnected = false;

        return new Promise((resolve, reject) => {
            this.cleanupSocket();

            this.socket = new net.Socket();

            const connTimeoutId = setTimeout(() => {
                this._log(`Timeout connessione a ${this.host}:${this.port} dopo ${this.connectionTimeout}ms.`, 'error');
                if (this.socket) this.socket.destroy();
                reject(new Error('Timeout durante il tentativo di connessione'));
            }, this.connectionTimeout);

            this.socket.once('connect', () => {
                clearTimeout(connTimeoutId);
                this.isConnecting = false;
                this.connected = true;
                this.reconnectAttemptsCount = 0;
                this._log(`Connesso con successo a ${this.host}:${this.port}.`);
                this.emit('connected');
                this.startKeepAlive();
                this.processCommandQueue();
                resolve('Connesso a CasparCG');
            });

            this.socket.on('data', (data) => {
                this.buffer += data.toString('utf8');
                this._log(`Dati grezzi ricevuti (${data.length} bytes). Buffer: "${this.buffer.replace(/\r\n/g, '\\r\\n').substring(0, 150)}..."`, 'trace');
                this.tryProcessBuffer();
            });

            this.socket.once('close', (hadError) => {
                clearTimeout(connTimeoutId);
                const wasConnected = this.connected;
                this.isConnecting = false;
                this._log(`Socket TCP chiuso.${hadError ? ' Causa: errore.' : ''}`, wasConnected && !hadError ? 'warning' : 'info');
                this.handleDisconnect(hadError ? new Error('Socket TCP chiuso con errore') : null);
                if (!wasConnected && typeof reject === 'function' && connTimeoutId && !connTimeoutId._destroyed ) {
                    reject(new Error('Socket chiuso durante tentativo connessione'));
                }
            });

            this.socket.once('error', (err) => {
                clearTimeout(connTimeoutId);
                this.isConnecting = false;
                this._log(`Errore socket TCP: ${err.message}`, 'error');
                if (this.socket && !this.socket.destroyed) this.socket.destroy();
                else this.handleDisconnect(err);

                if (!this.connected && typeof reject === 'function' && connTimeoutId && !connTimeoutId._destroyed) reject(err);
            });

            this.socket.connect({ port: this.port, host: this.host });
        });
    }

    handleDisconnect(errorContext = null) {
        const wasConnected = this.connected;
        this._log(`Gestione disconnessione. Era connesso: ${wasConnected}. Errore: ${errorContext ? errorContext.message : 'N/A'}`, 'debug');

        this.isConnecting = false;
        this.connected = false;
        this.stopKeepAlive();
        this.cleanupSocket();

        if (this.currentCommand) {
            this._log(`Comando corrente "${this.currentCommand.command}" fallito causa disconnessione.`, 'warning');
            clearTimeout(this.currentCommand.timeoutId);
            this.currentCommand.reject(errorContext || new Error('Disconnesso da CasparCG'));
            this.currentCommand = null;
        }
        this.commandQueue.forEach(cmd => {
            clearTimeout(cmd.timeoutId);
            cmd.reject(errorContext || new Error('Disconnesso da CasparCG prima dell\'esecuzione'));
        });
        this.commandQueue = [];

        if (wasConnected) {
            this.emit('disconnected', { reason: errorContext ? errorContext.message : 'Disconnessione generica' });
        }

        if (this.autoReconnect && !this.isManuallyDisconnected) {
            this.scheduleReconnect();
        }
    }

    cleanupSocket() {
        if (this.socket) {
            this._log('Pulizia e distruzione del socket TCP esistente.', 'debug');
            this.socket.removeAllListeners();
            this.socket.destroy();
            this.socket = null;
        }
    }

    tryProcessBuffer() {
        let eolIndex;
        while ((eolIndex = this.buffer.indexOf('\r\n')) !== -1) {
            const line = this.buffer.substring(0, eolIndex);
            this.buffer = this.buffer.substring(eolIndex + 2);

            const trimmedLine = line.trim();
            this._log(`Linea da buffer: "${line}" (Trimmed: "${trimmedLine}")`, 'trace');

            if (!this.currentCommand) {
                this._log(`Dati ("${trimmedLine}") ricevuti senza comando in attesa.`, 'debug');
                if (trimmedLine.startsWith("INFO") || trimmedLine.match(/^\d{3}\s+INFO/i)) {
                    this.emit('info', trimmedLine);
                }
                continue;
            }

            const { resolve, reject, command, isMultiline, timeoutId } = this.currentCommand;
            this.currentCommand.linesBuffer = this.currentCommand.linesBuffer || [];

            let statusCode = 0;
            const matchStatus = trimmedLine.match(/^(\d{3})/);
            if (matchStatus) {
                statusCode = parseInt(matchStatus[1], 10);
            }

            if (statusCode >= 400) { // Gestione errore immediata
                this._log(`Comando "${command}": Ricevuto errore ${statusCode}: "${trimmedLine}"`, 'error');
                clearTimeout(timeoutId);
                this.currentCommand.linesBuffer.push(line); // Includi linea di errore
                reject(new Error(this.currentCommand.linesBuffer.join('\r\n')));
                this.currentCommand = null;
                this.processCommandQueue();
                continue;
            }

            if (isMultiline) {
                if (!this.currentCommand.statusReceived) { // In attesa della prima linea di stato OK
                    if ((statusCode === 200 || statusCode === 201) && trimmedLine.includes("OK")) {
                        this.currentCommand.statusReceived = true;
                        this.currentCommand.linesBuffer.push(line); // Conserva la linea di stato originale
                        this._log(`Comando "${command}": Ricevuto stato iniziale OK (${statusCode}): "${trimmedLine}"`, 'debug');

                        // *** INIZIO CORREZIONE SPECIFICA PER VERSION (se è l'unica linea di stato OK) ***
                        if (command === "VERSION" && statusCode === 201 && this.currentCommand.linesBuffer.length === 1 && this.buffer.indexOf('\r\n') === -1 && this.buffer.length > 0) {
                            // Caso speciale: "201 VERSION OK" è arrivato, e il buffer contiene solo la stringa versione senza \r\n finale
                            // Questo è improbabile se CasparCG segue sempre \r\n, ma per sicurezza.
                            // La logica principale sotto gestirà il caso standard.
                        } else if (command !== "VERSION" && this.buffer.trim() === '' && (command === 'CLS' || command === 'TLS')) {
                             // Se dopo lo stato OK il buffer è vuoto, la lista è vuota.
                             this._log(`Comando "${command}": Lista vuota (solo stato OK e buffer vuoto). Risolvo.`, 'debug');
                             clearTimeout(timeoutId);
                             resolve(this.currentCommand.linesBuffer.join('\r\n')); // Risolve con solo la linea di stato
                             this.currentCommand = null;
                             this.processCommandQueue();
                             continue;
                        }
                        // Altrimenti, continua ad aspettare altre linee per comandi multilinea
                    } else if (line.length > 0 && statusCode === 0) { // Dati prima dello stato OK (es. per INFO senza codice iniziale)
                         this.currentCommand.linesBuffer.push(line);
                         this.currentCommand.dataLinesStarted = true;
                         this._log(`Comando "${command}": Ricevuta linea dati ("${line}") prima dello stato OK. Accumulo.`, 'debug');
                    } else if (line.length > 0) {
                        this._log(`Comando "${command}": Ricevuta linea inattesa ("${line}") prima dello stato OK. Accumulo.`, 'warning');
                        this.currentCommand.linesBuffer.push(line);
                    }
                } else { // statusReceived è true (abbiamo già la linea 20x OK iniziale)
                    if (command === "VERSION") {
                        // Dopo "201 VERSION OK", la prossima linea non vuota è la stringa della versione.
                        if (trimmedLine.length > 0) {
                            this.currentCommand.linesBuffer.push(line); // Aggiungi la stringa della versione
                            this._log(`Comando "VERSION": Ricevuta stringa versione: "${trimmedLine}"`, 'debug');
                            clearTimeout(timeoutId);
                            resolve(this.currentCommand.linesBuffer.join('\r\n')); // Risolve con "201 OK\r\nVERSION_STRING"
                            this.currentCommand = null;
                            this.processCommandQueue();
                            continue; // IMPORTANTE: esci dal while per questo comando
                        }
                        // Se la linea è vuota dopo "201 VERSION OK", è inaspettato, ma la logica sopra ha già risolto.
                        // Non dovrebbe arrivare qui se la linea precedente era la stringa della versione.
                    } else if (trimmedLine === '' && (command === 'CLS' || command === 'TLS' || command.startsWith('INFO'))) {
                        // Linea vuota dopo i dati per CLS/TLS/INFO -> fine della lista dati
                        this._log(`Comando "${command}": Ricevuta linea vuota dopo dati. Considero risposta completa.`, 'debug');
                        clearTimeout(timeoutId);
                        resolve(this.currentCommand.linesBuffer.join('\r\n'));
                        this.currentCommand = null;
                        this.processCommandQueue();
                        continue;
                    } else if (statusCode === 201 && trimmedLine.includes("OK") && command.startsWith("INFO")) { // Codice di stato finale OK per INFO
                        this.currentCommand.linesBuffer.push(line);
                        clearTimeout(timeoutId);
                        resolve(this.currentCommand.linesBuffer.join('\r\n'));
                        this.currentCommand = null;
                        this.processCommandQueue();
                        continue;
                    } else { // Altra linea di dati
                        this._log(`Comando "${command}": Ricevuta linea dati aggiuntiva: "${line}"`, 'trace');
                        this.currentCommand.linesBuffer.push(line);
                        this.currentCommand.dataLinesStarted = true;
                    }
                }
            } else { // Comando non multilinea
                this._log(`Comando singola linea "${command}": Ricevuta risposta: "${trimmedLine}"`, 'debug');
                clearTimeout(timeoutId);
                if (statusCode >= 200 && statusCode < 300 && trimmedLine.includes("OK")) {
                    resolve(trimmedLine);
                } else {
                    this._log(`Comando "${command}": Risposta singola linea inattesa "${trimmedLine}". Rigetto.`, 'warning');
                    reject(new Error(trimmedLine));
                }
                this.currentCommand = null;
                this.processCommandQueue();
                continue;
            }
        }
    }

    sendCommand(commandString) {
        this._log(`Accodamento comando: "${commandString}"`, 'debug');
        return new Promise((resolve, reject) => {
            if (!this.connected && !this.autoReconnect && !this.isConnecting) {
                this._log(`Comando "${commandString}" fallito: non connesso, riconnessione disabilitata e non in fase di connessione.`, 'error');
                return reject(new Error('Non connesso a CasparCG e riconnessione automatica disabilitata.'));
            }

            const commandObj = {
                command: commandString,
                resolve,
                reject,
                isMultiline: commandString.startsWith('CLS') || commandString.startsWith('TLS') || commandString.startsWith('INFO') || commandString.startsWith('HELP') || commandString === 'VERSION',
                linesBuffer: [],
                statusReceived: false, // Flag per tracciare se la prima linea di stato OK è stata ricevuta
                dataLinesStarted: false, // Flag per tracciare se abbiamo iniziato a ricevere linee di dati
                timeoutId: null
            };

            this.commandQueue.push(commandObj);
            this.processCommandQueue();
        });
    }

    processCommandQueue() {
        if (this.currentCommand || this.commandQueue.length === 0) {
            return;
        }
        if (!this.connected || !this.socket || this.socket.destroyed) {
            this._log('Impossibile processare coda comandi: non connesso o socket non valido.', 'warning');
            return;
        }

        this.currentCommand = this.commandQueue.shift();
        const { command, reject } = this.currentCommand;

        // Imposta il timeout per QUESTO comando
        this.currentCommand.timeoutId = setTimeout(() => {
            if (this.currentCommand && this.currentCommand.command === command) { // Verifica se è ancora lo stesso comando
                this._log(`Timeout risposta per comando "${command}" dopo ${this.commandTimeout}ms. Rigetto.`, 'error');
                this.currentCommand.reject(new Error(`Timeout (${this.commandTimeout}ms) per il comando: ${command}`));
                this.currentCommand = null;
                this.processCommandQueue();
            }
        }, this.commandTimeout);

        this._log(`Invio comando dalla coda: "${command}"`, 'debug');
        this.socket.write(command + '\r\n', 'utf8', (err) => {
            if (err) {
                this._log(`Errore scrittura socket per comando "${command}": ${err.message}`, 'error');
                clearTimeout(this.currentCommand.timeoutId);
                if (reject) reject(err); // Usa la reject del comando corrente
                this.currentCommand = null;
                this.processCommandQueue();
            }
        });
    }

    disconnect() {
        this._log('Disconnessione manuale richiesta...');
        this.isManuallyDisconnected = true;
        this.stopKeepAlive();
        this.stopReconnectTimer();
        this.cleanupSocket();
        if (this.connected) {
            this.connected = false;
            this.emit('disconnected', { reason: 'Disconnessione manuale richiesta' });
        }
        return Promise.resolve();
    }

    scheduleReconnect() {
        this.stopReconnectTimer();

        if (this.isManuallyDisconnected || !this.autoReconnect || this.isConnecting) {
            this._log(`Riconnessione automatica saltata. Manuale: ${this.isManuallyDisconnected}, Auto: ${this.autoReconnect}, In Connessione: ${this.isConnecting}`);
            return;
        }

        this.reconnectAttemptsCount++;
        if (this.reconnectAttemptsCount > this.maxReconnectAttempts) {
            this._log(`Max tentativi di riconnessione (${this.maxReconnectAttempts}) raggiunti.`, 'error');
            this.emit('reconnect_failed');
            // Non resettare reconnectAttemptsCount qui per evitare loop se scheduleReconnect viene chiamato di nuovo
            return;
        }

        this.emit('reconnecting', this.reconnectAttemptsCount);

        const interval = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttemptsCount - 1), 30000);
        this._log(`Riconnessione pianificata tra ${Math.round(interval / 1000)}s (tentativo ${this.reconnectAttemptsCount}/${this.maxReconnectAttempts})`);

        this.reconnectTimerId = setTimeout(() => {
            this._log(`Esecuzione tentativo di riconnessione #${this.reconnectAttemptsCount}...`);
            if (!this.isConnecting && !this.connected) {
                 this.connect().catch(err => {
                    this._log(`Tentativo di riconnessione #${this.reconnectAttemptsCount} fallito (catch esplicito): ${err.message}`, 'warning');
                });
            } else {
                this._log('Tentativo di riconnessione saltato: connessione già in corso o già connesso.', 'info');
            }
        }, interval);
    }

    stopReconnectTimer() {
        if (this.reconnectTimerId) {
            clearTimeout(this.reconnectTimerId);
            this.reconnectTimerId = null;
            this._log('Timer di riconnessione fermato.');
        }
    }

    startKeepAlive() {
        this.stopKeepAlive();
        if (this.keepAliveInterval <= 0) {
            this._log('Keep-alive disabilitato.');
            return;
        }
        this._log(`Avvio timer di keep-alive (intervallo: ${this.keepAliveInterval}ms)`);
        this.keepAliveTimerId = setInterval(async () => {
            if (this.connected && this.socket && !this.socket.destroyed && !this.currentCommand) {
                this._log('Invio comando keep-alive (VERSION)...', 'trace');
                try {
                    await this.sendCommand('VERSION');
                    this._log('Comando keep-alive VERSION inviato.', 'trace');
                } catch (error) {
                    this._log(`Errore nell'invio del comando keep-alive VERSION: ${error.message}.`, 'warning');
                }
            } else if (this.connected && this.currentCommand) {
                this._log('Keep-alive: comando utente in corso, salto invio VERSION.', 'trace');
            }
            else {
                this._log('Keep-alive: non connesso o socket non valido, fermo il timer.', 'debug');
                this.stopKeepAlive();
            }
        }, this.keepAliveInterval);
    }

    stopKeepAlive() {
        if (this.keepAliveTimerId) {
            clearInterval(this.keepAliveTimerId);
            this.keepAliveTimerId = null;
            this._log('Timer di keep-alive fermato.');
        }
    }

    _parseClsTlsResponse(rawResponse, commandName) {
        const lines = rawResponse.split('\r\n');
        const items = [];
        let dataLinesStarted = false;

        this._log(`Parsing risposta per ${commandName}. Numero di linee ricevute: ${lines.length}`, 'debug');
        this._log(`Raw response per ${commandName}:\n${rawResponse}`, 'trace');

        for (const line of lines) {
            const trimmedLine = line.trim();
            this._log(`Parsing linea per ${commandName}: "${trimmedLine}"`, 'trace');

            if (!dataLinesStarted) {
                if (trimmedLine.match(new RegExp(`^\\d{3}\\s+${commandName}\\s+OK`, "i")) ||
                    (commandName === "VERSION" && trimmedLine.match(/^\d{3}\s+VERSION\s+OK/i))) {
                    dataLinesStarted = true;
                    this._log(`Linea di stato OK iniziale trovata per ${commandName}: "${trimmedLine}"`, 'debug');
                }
                continue;
            }

            // Ignora codici di stato finali
            if (trimmedLine.match(/^\d{3}\s+.*OK$/i) && items.length > 0) {
                this._log(`Trovata linea di stato finale OK per ${commandName}: "${trimmedLine}", ignoro.`, 'debug');
                continue;
            }

            if (trimmedLine === '') {
                if (commandName === "CLS" || commandName === "TLS") {
                     this._log(`Linea vuota trovata per ${commandName}, considero fine lista.`, 'debug');
                     break;
                }
                continue;
            }

            // NUOVO PARSER per CLS che estrae TUTTI i dati inclusa DURATA
            if (commandName === "CLS") {
                // Formato: "filename" type size date duration
                // Esempio: "AMB" MOVIE 6445816 20090101010000 160000
                const clsMatch = trimmedLine.match(/"([^"]+)"\s+(\w+)\s+(\d+)\s+(\d+)\s+(\d+)/);
                if (clsMatch) {
                    const [, filename, type, size, date, duration] = clsMatch;
                    // Converti duration da frames a millisecondi (assumendo 25fps)
                    const durationMs = Math.round((parseInt(duration) / 25) * 1000);
                    const item = {
                        name: filename,
                        type: type,
                        size: parseInt(size),
                        date: date,
                        frames: parseInt(duration),
                        duration: durationMs,
                        durationFormatted: this._formatDuration(durationMs)
                    };
                    items.push(item);
                    this._log(`CLS item con durata: ${filename} = ${item.durationFormatted} (${duration} frames)`, 'info');
                } else {
                    // Fallback per formato non standard
                    const match = trimmedLine.match(/"(.*?)"/);
                    if (match && match[1]) {
                        items.push({ name: match[1], duration: 0 });
                    }
                }
            } else {
                // Parser originale per TLS e altri comandi
                const match = trimmedLine.match(/"(.*?)"/);
                if (match && match[1]) {
                    items.push(match[1]);
                    this._log(`Item ${commandName} (con virgolette) aggiunto: "${match[1]}"`, 'trace');
                } else if (trimmedLine.length > 0 && !trimmedLine.match(/^\d{3}/)) {
                    const potentialItem = trimmedLine.split(' ')[0];
                    items.push(potentialItem);
                    this._log(`Item ${commandName} (senza virgolette/fallback) aggiunto: "${potentialItem}"`, 'trace');
                }
            }
        }
        this._log(`${commandName} trovati: ${items.length}.`, 'debug');
        return items;
    }

    _formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    async getMediaList() {
        this._log('Recupero lista media con CLS...');
        const rawResponse = await this.sendCommand('CLS');
        const items = this._parseClsTlsResponse(rawResponse, "CLS");
        
        // Per ogni media, proviamo a ottenere info più dettagliate con CINF
        // Nota: questo può essere lento per molti file, quindi è opzionale
        // e dovrebbe essere usato solo se necessario
        /*
        for (let item of items) {
            if (item.name && item.type === 'MOVIE') {
                try {
                    const cinfResponse = await this.sendCommand(`CINF "${item.name}"`);
                    // Il parsing di CINF dovrebbe fornire durata più accurata
                    this._log(`CINF response for ${item.name}: ${cinfResponse}`, 'debug');
                } catch (err) {
                    this._log(`CINF failed for ${item.name}: ${err.message}`, 'warning');
                }
            }
        }
        */
        
        return items;
    }
    
    // Nuovo metodo per ottenere info dettagliate di un singolo file
    async getMediaInfo(filename) {
        this._log(`Recupero info dettagliate per ${filename} con CINF...`);
        try {
            const rawResponse = await this.sendCommand(`CINF "${filename}"`);
            return this._parseCinfResponse(rawResponse, filename);
        } catch (err) {
            this._log(`CINF fallito per ${filename}: ${err.message}`, 'error');
            return null;
        }
    }
    
    // Parser per la risposta CINF
    _parseCinfResponse(rawResponse, filename) {
        this._log(`Parsing CINF response per ${filename}`, 'debug');
        this._log(`Raw CINF response:\n${rawResponse}`, 'trace');
        
        // CINF restituisce info in formato XML o strutturato
        // Esempio tipico: durata, frame rate, codec, etc.
        // TODO: Implementare parsing completo quando avremo il formato esatto
        
        const info = {
            name: filename,
            rawResponse: rawResponse
        };
        
        // Prova a estrarre durata e frames dal response
        // Formato tipico potrebbe includere nb-frames, duration, fps
        const framesMatch = rawResponse.match(/nb-frames[:\s]+(\d+)/i);
        const durationMatch = rawResponse.match(/duration[:\s]+([\d.]+)/i);
        const fpsMatch = rawResponse.match(/fps[:\s]+([\d.]+)/i);
        
        if (framesMatch) {
            info.frames = parseInt(framesMatch[1]);
        }
        if (durationMatch) {
            info.durationSeconds = parseFloat(durationMatch[1]);
            info.duration = Math.round(info.durationSeconds * 1000);
        }
        if (fpsMatch) {
            info.fps = parseFloat(fpsMatch[1]);
        }
        
        // Se abbiamo frames e fps, calcoliamo la durata
        if (info.frames && info.fps && !info.duration) {
            info.duration = Math.round((info.frames / info.fps) * 1000);
        }
        
        return info;
    }

    async getTemplateList() {
        this._log('Recupero lista template con TLS...');
        const rawResponse = await this.sendCommand('TLS');
        return this._parseClsTlsResponse(rawResponse, "TLS");
    }

    async getVersion() {
        this._log('Recupero versione CasparCG con VERSION...');
        const rawResponse = await this.sendCommand('VERSION');
        const lines = rawResponse.split('\r\n');
        if (lines.length >= 2 && lines[0].trim().startsWith("201")) {
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim().length > 0) {
                    return lines[i].trim();
                }
            }
        }
        this._log(`Risposta VERSION inattesa o incompleta: "${rawResponse}"`, 'warning');
        return "Sconosciuta";
    }

    play(channel, layer, clip, options = {}) {
        let command = `PLAY ${channel}-${layer} "${clip.replace(/"/g, '\\"')}"`;
        if (options.loop) command += " LOOP";
        this._log(`Esecuzione comando PLAY per ${channel}-${layer}: ${clip}`, 'info');
        return this.sendCommand(command);
    }

    pause(channel, layer) {
        this._log(`Esecuzione comando PAUSE per ${channel}-${layer}`, 'info');
        return this.sendCommand(`PAUSE ${channel}-${layer}`);
    }

    resume(channel, layer) {
        this._log(`Esecuzione comando RESUME per ${channel}-${layer}`, 'info');
        return this.sendCommand(`RESUME ${channel}-${layer}`);
    }

    stop(channel, layer) {
        this._log(`Esecuzione comando STOP per ${channel}-${layer}`, 'info');
        return this.sendCommand(`STOP ${channel}-${layer}`);
    }

    loadbg(channel, layer, clip, options = {}) {
        let command = `LOADBG ${channel}-${layer} "${clip.replace(/"/g, '\\"')}"`;
        if (options.loop) command += " LOOP";
        if (options.auto) command += " AUTO";
        this._log(`Esecuzione comando LOADBG per ${channel}-${layer}: ${clip}`, 'info');
        return this.sendCommand(command);
    }

    clear(channel, layer) {
        this._log(`Esecuzione comando CLEAR per ${channel}-${layer}`, 'info');
        return this.sendCommand(`CLEAR ${channel}-${layer}`);
    }

    cgAdd(channel, layer, cgLayer, template, playOnLoad = true, data = null) {
        let dataString = '""';
        if (data && (typeof data === 'object' ? Object.keys(data).length > 0 : typeof data === 'string' && data.length > 0) ) {
            try {
                const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
                dataString = `"${jsonData.replace(/"/g, '\\"')}"`;
            }
            catch (e) { this._log(`Errore serializzazione JSON per CG ADD: ${e.message}`, 'error'); dataString = '""'; }
        }
        let command = `CG ${channel}-${layer} ADD ${cgLayer} "${template.replace(/"/g, '\\"')}" 1 ${dataString}`;
        return this.sendCommand(command);
    }
    cgPlay(channel, layer, cgLayer) { return this.sendCommand(`CG ${channel}-${layer} PLAY ${cgLayer}`); }
    cgStop(channel, layer, cgLayer) { return this.sendCommand(`CG ${channel}-${layer} STOP ${cgLayer}`); }
    cgRemove(channel, layer, cgLayer) { return this.sendCommand(`CG ${channel}-${layer} REMOVE ${cgLayer}`); }

    cgUpdate(channel, layer, cgLayer, data) {
        let dataString = '""';
        if (data && (typeof data === 'object' ? Object.keys(data).length > 0 : typeof data === 'string' && data.length > 0) ) {
            try {
                const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
                dataString = `"${jsonData.replace(/"/g, '\\"')}"`;
            }
            catch (e) {
                this._log(`Errore serializzazione JSON per CG UPDATE: ${e.message}`, 'error');
                return Promise.reject(new Error("Errore dati JSON per CG UPDATE"));
            }
        }
        return this.sendCommand(`CG ${channel}-${layer} UPDATE ${cgLayer} ${dataString}`);
    }
    cgInvoke(channel, layer, cgLayer, method) { return this.sendCommand(`CG ${channel}-${layer} INVOKE ${cgLayer} "${method.replace(/"/g, '\\"')}"`); }

    mixer(channel, layer, property, value, duration = 0, tween = 'linear') {
      let command = `MIXER ${channel}-${layer} ${property.toUpperCase()}`;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          command += ` ${value.x || 0} ${value.y || 0} ${value.width || 0} ${value.height || 0}`;
      } else if (Array.isArray(value)) {
          command += ` ${value.join(' ')}`;
      }
      else {
          command += ` ${value}`;
      }
      if (duration > 0) {
          command += ` ${duration} ${tween.toUpperCase()}`;
      }
      return this.sendCommand(command);
  }
}

module.exports = CasparClient;
