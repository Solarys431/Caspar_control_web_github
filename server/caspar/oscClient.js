/**
 * Client OSC per la comunicazione con il server CasparCG
 * Riceve i messaggi OSC dal server CasparCG e li inoltra al frontend tramite Socket.IO
 */
const osc = require('osc');
const EventEmitter = require('events');

class OscClient extends EventEmitter {
    constructor(options = {}) {
        super();
        this.host = options.host || 'localhost';
        this.port = options.port || 6250; // Porta OSC predefinita di CasparCG
        this.localPort = options.localPort || 5253; // Porta locale per ricevere i messaggi OSC
        this.autoReconnect = options.autoReconnect !== undefined ? options.autoReconnect : true;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;

        this.connected = false;
        this.udpPort = null;
        this.reconnectAttemptsCount = 0;
        this.reconnectTimerId = null;
        this.isManuallyDisconnected = false;
        this.isConnecting = false;

        // Throttling per i messaggi OSC
        this.lastMessageTimes = {}; // Memorizza l'ultimo timestamp per ogni tipo di messaggio
        this.lastMessageValues = {}; // Memorizza l'ultimo valore per ogni tipo di messaggio
        this.throttleIntervals = {
            // Intervalli di throttling in millisecondi per tipo di messaggio (aumentati per ridurre il traffico)
            'default': 2000,      // Default per tutti i messaggi
            'time': 500,          // Aggiornamenti timecode meno frequenti
            'frame': 1000,        // Aggiornamenti frame meno frequenti
            'paused': 10000,      // Stato paused molto meno frequente (ogni 10 secondi)
            'producer': 5000,     // Stato producer meno frequente
            'length': 10000,      // Lunghezza file raramente cambia
            'path': 10000         // Percorso file raramente cambia
        };

        // Configurazione per il filtraggio dei messaggi
        this.messageFilters = {
            // Priorità per canale (più alto = più prioritario)
            channelPriority: {
                '3': 10,  // Canale 3 ha la massima priorità (canale di preview)
                '1': 5,   // Canale 1 ha priorità media
                '2': 5    // Canale 2 ha priorità media
            },
            // Soglia minima di priorità per processare i messaggi (default)
            priorityThreshold: 0
        };

        this._log(`Client OSC istanziato per ${this.host}:${this.port}. Porta locale: ${this.localPort}`);
    }

    _log(message, level = 'info') {
        this.emit('log', `[OscClient] [${level.toUpperCase()}] ${message}`);
    }

    connect() {
        if (this.isConnecting) {
            this._log('Tentativo di connessione ignorato: connessione già in corso.');
            return Promise.reject(new Error('Connessione già in corso.'));
        }
        if (this.connected && this.udpPort) {
            this._log('Già connesso.');
            return Promise.resolve('Già connesso.');
        }

        this._log(`Tentativo di connessione OSC a ${this.host}:${this.port}...`);
        this.isConnecting = true;
        this.isManuallyDisconnected = false;

        return new Promise((resolve, reject) => {
            try {
                this.udpPort = new osc.UDPPort({
                    localAddress: '0.0.0.0',
                    localPort: this.localPort,
                    remoteAddress: this.host,
                    remotePort: this.port,
                    metadata: true
                });

                this.udpPort.on('ready', () => {
                    this.isConnecting = false;
                    this.connected = true;
                    this.reconnectAttemptsCount = 0;
                    this._log(`Connesso con successo a ${this.host}:${this.port}.`);
                    this.emit('connected');
                    resolve('Connesso a CasparCG OSC');
                });

                // Funzione per determinare il tipo di messaggio OSC
                this._getMessageType = (address) => {
                    if (address.includes('/file/time')) return 'time';
                    if (address.includes('/file/frame')) return 'frame';
                    if (address.includes('/file/length')) return 'length';
                    if (address.includes('/file/path')) return 'path';
                    if (address.includes('/paused')) return 'paused';
                    if (address.includes('/producer')) return 'producer';
                    return 'default';
                };

                // Funzione per verificare se un messaggio deve essere throttled
                this._shouldThrottle = (address, channel, layer) => {
                    // Non applicare throttling ai messaggi di controllo (PLAY, PAUSE, STOP, ecc.)
                    if (address.includes('/control/')) {
                        return false; // Non throttle i messaggi di controllo
                    }

                    const now = Date.now();
                    const messageType = this._getMessageType(address);
                    const key = `${channel}-${layer}-${messageType}`;

                    // Ottieni l'intervallo di throttling per questo tipo di messaggio
                    const throttleInterval = this.throttleIntervals[messageType] || this.throttleIntervals.default;

                    // Verifica se è passato abbastanza tempo dall'ultimo messaggio di questo tipo
                    const lastTime = this.lastMessageTimes[key] || 0;
                    const shouldThrottle = (now - lastTime) < throttleInterval;

                    // Aggiorna il timestamp dell'ultimo messaggio
                    if (!shouldThrottle) {
                        this.lastMessageTimes[key] = now;
                    }

                    return shouldThrottle;
                };

                // Funzione per filtrare i messaggi OSC
                this._shouldProcessOscMessage = (oscMsg) => {
                    // Lista di pattern di indirizzi OSC che ci interessano
                    const allowedPatterns = [
                        '/channel/*/stage/layer/*/file/time',
                        '/channel/*/stage/layer/*/file/frame',
                        '/channel/*/stage/layer/*/file/length',
                        '/channel/*/stage/layer/*/file/path',
                        '/channel/*/stage/layer/*/paused',
                        '/channel/*/stage/layer/*/foreground/paused',
                        '/channel/*/stage/layer/*/foreground/producer',
                        '/channel/*/stage/layer/*/foreground/file/time',
                        '/channel/*/stage/layer/*/foreground/file/frame',
                        '/channel/*/stage/layer/*/foreground/file/length',
                        '/channel/*/stage/layer/*/control/*'  // Aggiungi pattern per i messaggi di controllo
                    ];

                    // Converti l'indirizzo OSC in un pattern con * per confrontarlo con i pattern consentiti
                    const address = oscMsg.address;

                    // Processa sempre i messaggi di controllo
                    if (address.includes('/control/')) {
                        return true;
                    }

                    const addressParts = address.split('/');

                    // Estrai il canale e il layer dall'indirizzo OSC
                    const channelIndex = addressParts.indexOf('channel');
                    const layerIndex = addressParts.indexOf('layer');

                    if (channelIndex === -1 || layerIndex === -1) {
                        return false; // Non è un messaggio valido
                    }

                    const channel = addressParts[channelIndex + 1];
                    const layer = addressParts[layerIndex + 1];

                    // Verifica se il messaggio deve essere throttled
                    if (this._shouldThrottle(address, channel, layer)) {
                        return false; // Throttle questo messaggio
                    }

                    // Verifica se l'indirizzo corrisponde a uno dei pattern consentiti
                    for (const pattern of allowedPatterns) {
                        const patternParts = pattern.split('/');

                        if (addressParts.length !== patternParts.length) {
                            continue;
                        }

                        let match = true;
                        for (let i = 0; i < patternParts.length; i++) {
                            if (patternParts[i] === '*' || patternParts[i] === addressParts[i]) {
                                continue;
                            }
                            match = false;
                            break;
                        }

                        if (match) {
                            return true;
                        }
                    }

                    return false;
                };

                this.udpPort.on('message', (oscMsg, timeTag, info) => {
                    // Filtra i messaggi OSC che non ci interessano
                    if (!this._shouldProcessOscMessage(oscMsg)) {
                        return;
                    }

                    // Log più dettagliato per il debug
                    const value = oscMsg.args && oscMsg.args[0] ? oscMsg.args[0].value : 'N/A';
                    const valueType = oscMsg.args && oscMsg.args[0] ? oscMsg.args[0].type : 'unknown';

                    // Estrai il canale per il logging
                    const addressParts = oscMsg.address.split('/');
                    const channelIndex = addressParts.indexOf('channel');
                    const layerIndex = addressParts.indexOf('layer');

                    let channel = 'unknown';
                    let layer = 'unknown';

                    if (channelIndex !== -1 && channelIndex + 1 < addressParts.length) {
                        channel = addressParts[channelIndex + 1];
                    }

                    if (layerIndex !== -1 && layerIndex + 1 < addressParts.length) {
                        layer = addressParts[layerIndex + 1];
                    }

                    const key = `${channel}-${layer}`;

                    // Log ridotto solo per messaggi importanti e solo a livello trace
                    if (oscMsg.address.includes('/file/time')) {
                        // Log solo per il canale 3 (preview) o quando il valore cambia
                        if (channel === '3') {
                            this._log(`[TIMECODE] ${key}: ${value}`, 'trace');
                        }
                    } else if (oscMsg.address.includes('/file/length') ||
                               oscMsg.address.includes('/file/fps')) {
                        // Log solo per informazioni importanti
                        this._log(`[OSC] ${oscMsg.address} - ${key}: ${value}`, 'trace');
                    } else if (oscMsg.address.includes('/background/') ||
                               oscMsg.address.includes('/foreground/') ||
                               oscMsg.address.includes('/mixer/')) {
                        // Log solo per debug avanzato
                        this._log(`[OSC] ${oscMsg.address} - ${key}: ${value}`, 'trace');
                    }

                    this.emit('message', oscMsg);

                    // Emetti eventi specifici in base all'indirizzo OSC
                    this._processOscMessage(oscMsg);
                });

                this.udpPort.on('error', (err) => {
                    this.isConnecting = false;
                    this._log(`Errore UDP: ${err.message}`, 'error');
                    this.handleDisconnect(err);
                    reject(err);
                });

                this.udpPort.open();
            } catch (err) {
                this.isConnecting = false;
                this._log(`Errore durante l'inizializzazione del client OSC: ${err.message}`, 'error');
                reject(err);
            }
        });
    }

    handleDisconnect(errorContext = null) {
        const wasConnected = this.connected;
        this._log(`Gestione disconnessione. Era connesso: ${wasConnected}. Errore: ${errorContext ? errorContext.message : 'N/A'}`, 'debug');

        this.isConnecting = false;
        this.connected = false;

        if (this.udpPort) {
            try {
                this.udpPort.close();
            } catch (e) {
                this._log(`Errore durante la chiusura della porta UDP: ${e.message}`, 'warning');
            }
            this.udpPort = null;
        }

        if (wasConnected) {
            this.emit('disconnected', { reason: errorContext ? errorContext.message : 'Disconnessione generica' });
        }

        if (this.autoReconnect && !this.isManuallyDisconnected) {
            this.scheduleReconnect();
        }
    }

    disconnect() {
        this._log('Disconnessione manuale richiesta...');
        this.isManuallyDisconnected = true;
        this.stopReconnectTimer();

        if (this.udpPort) {
            try {
                this.udpPort.close();
            } catch (e) {
                this._log(`Errore durante la chiusura della porta UDP: ${e.message}`, 'warning');
            }
            this.udpPort = null;
        }

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
            return;
        }

        this.emit('reconnecting', this.reconnectAttemptsCount);

        const interval = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttemptsCount - 1), 30000);
        this._log(`Riconnessione pianificata tra ${Math.round(interval / 1000)}s (tentativo ${this.reconnectAttemptsCount}/${this.maxReconnectAttempts})`);

        this.reconnectTimerId = setTimeout(() => {
            this._log(`Esecuzione tentativo di riconnessione #${this.reconnectAttemptsCount}...`);
            if (!this.isConnecting && !this.connected) {
                this.connect().catch(err => {
                    this._log(`Tentativo di riconnessione #${this.reconnectAttemptsCount} fallito: ${err.message}`, 'warning');
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

    _processOscMessage(oscMsg) {
        try {
            // Estrai il canale e il layer dall'indirizzo OSC
            const addressParts = oscMsg.address.split('/');
            if (addressParts.length < 3) return;

            // Formato tipico: /channel/1/stage/layer/10/file/time
            const channelIndex = addressParts.indexOf('channel');
            const layerIndex = addressParts.indexOf('layer');

            if (channelIndex === -1 || layerIndex === -1) return;

            const channel = addressParts[channelIndex + 1];
            const layer = addressParts[layerIndex + 1];
            const key = `${channel}-${layer}`;

            // Verifica che ci siano argomenti validi
            if (!oscMsg.args || oscMsg.args.length === 0 || oscMsg.args[0] === undefined) {
                this._log(`Messaggio OSC senza argomenti validi: ${oscMsg.address}`, 'warning');
                return;
            }

            // Processa i diversi tipi di messaggi OSC
            if (oscMsg.address.includes('/file/time')) {
                const time = oscMsg.args[0].value;

                // Converti il tempo in formato timecode (HH:MM:SS:FF)
                let timecode = time;
                if (typeof time === 'number') {
                    // Se il tempo è in secondi, convertiamo in timecode
                    const totalSeconds = Math.floor(time);
                    const frames = Math.round((time - totalSeconds) * 25); // Assumiamo 25 fps
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;

                    timecode = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
                }

                // Log solo per canale 3 o quando il valore cambia
                if (channel === '3') {
                    this._log(`Timecode ricevuto per ${key}: ${timecode} (originale: ${time})`, 'trace');
                }

                // Emetti sia il valore originale che il timecode formattato
                this.emit('timecode', {
                    channel,
                    layer,
                    time: timecode,
                    rawTime: time
                });

                // Emetti anche un evento specifico per questo canale/layer
                this.emit(`timecode:${key}`, {
                    channel,
                    layer,
                    time: timecode,
                    rawTime: time
                });
            } else if (oscMsg.address.includes('/file/frame')) {
                const frame = oscMsg.args[0].value;
                // Log solo per canale 3
                if (channel === '3') {
                    this._log(`Frame ricevuto per ${key}: ${frame}`, 'trace');
                }
                this.emit('frame', {
                    channel,
                    layer,
                    frame
                });

                // Emetti anche un evento specifico per questo canale/layer
                this.emit(`frame:${key}`, {
                    channel,
                    layer,
                    frame
                });
            } else if (oscMsg.address.includes('/file/fps')) {
                const fps = oscMsg.args[0].value;
                // Log solo per canale 3
                if (channel === '3') {
                    this._log(`FPS ricevuto per ${key}: ${fps}`, 'trace');
                }
                this.emit('fps', {
                    channel,
                    layer,
                    fps
                });

                // Emetti anche un evento specifico per questo canale/layer
                this.emit(`fps:${key}`, {
                    channel,
                    layer,
                    fps
                });
            } else if (oscMsg.address.includes('/file/path')) {
                const path = oscMsg.args[0].value;
                // Log solo per canale 3
                if (channel === '3') {
                    this._log(`Path ricevuto per ${key}: ${path}`, 'trace');
                }
                this.emit('path', {
                    channel,
                    layer,
                    path
                });

                // Emetti anche un evento specifico per questo canale/layer
                this.emit(`path:${key}`, {
                    channel,
                    layer,
                    path
                });
            } else if (oscMsg.address.includes('/file/length')) {
                const length = oscMsg.args[0].value;

                // Converti la lunghezza in frames in timecode (HH:MM:SS:FF)
                const fps = 25; // Assumiamo 25 fps
                const totalSeconds = Math.floor(length / fps);
                const frames = length % fps;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                const timecode = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;

                // Log solo per canale 3
                if (channel === '3') {
                    this._log(`Lunghezza file ricevuta per ${key}: ${length} frames (${timecode})`, 'trace');
                }

                this.emit('length', {
                    channel,
                    layer,
                    length,
                    timecode
                });

                // Emetti anche un evento specifico per questo canale/layer
                this.emit(`length:${key}`, {
                    channel,
                    layer,
                    length,
                    timecode
                });
            } else if (oscMsg.address.includes('/paused')) {
                const paused = oscMsg.args[0].value === 1;
                // Log solo per canale 3
                if (channel === '3') {
                    this._log(`Stato pausa ricevuto per ${key}: ${paused}`, 'trace');
                }
                this.emit('paused', {
                    channel,
                    layer,
                    paused
                });

                // Emetti anche un evento specifico per questo canale/layer
                this.emit(`paused:${key}`, {
                    channel,
                    layer,
                    paused
                });
            } else if (oscMsg.address.includes('/loop')) {
                const loop = oscMsg.args[0].value === 1;
                // Log solo per canale 3
                if (channel === '3') {
                    this._log(`Stato loop ricevuto per ${key}: ${loop}`, 'trace');
                }
                this.emit('loop', {
                    channel,
                    layer,
                    loop
                });

                // Emetti anche un evento specifico per questo canale/layer
                this.emit(`loop:${key}`, {
                    channel,
                    layer,
                    loop
                });
            }
        } catch (error) {
            this._log(`Errore nell'elaborazione del messaggio OSC: ${error.message}`, 'error');
        }
    }
}

module.exports = OscClient;
