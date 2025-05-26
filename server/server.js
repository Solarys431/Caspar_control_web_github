/**
 * Server principale per CasparCG Control Web
 */

// Carica le variabili d'ambiente prima di importare i moduli
const dotenv = require('dotenv');
// Carica le variabili d'ambiente dal file .env
dotenv.config();

// Verifica che le variabili d'ambiente siano state caricate
console.log('Variabili d\'ambiente caricate:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Presente' : 'Mancante');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Presente' : 'Mancante');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs'); // Modulo File System di Node.js

// Importa il client CasparCG
const CasparClient = require('./caspar/casparClient');
// Importa il client OSC
const OscClient = require('./caspar/oscClient');
// Importa il gestore dei profili
const profileManager = require('./caspar/profileManager');
// Importa la configurazione
const config = require('./config');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = config.server.port || 5000; // Assicurati che config.server.port esista
let casparClientInstance = null;
let oscClientInstance = null;
let casparState = {
    connected: false,
    host: config.caspar.host,
    port: config.caspar.port,
    serverVersion: null,
    channels: [],
    oscConnected: false
};

// Stato globale OSC per tutti i canali e layer
const oscState = {};

// Funzione per aggiornare lo stato OSC
const updateOscState = (channel, layer, type, data) => {
    const key = `${channel}-${layer}`;

    // Inizializza lo stato per questo canale/layer se non esiste
    if (!oscState[key]) {
        oscState[key] = {};
    }

    // Aggiorna lo stato con i nuovi dati
    oscState[key][type] = data;

    // Emetti lo stato aggiornato
    if (io) {
        io.emit('osc:state', { key, state: oscState[key] });
        io.emit(`osc:state:${key}`, oscState[key]);
    }
};

// CONFIGURAZIONE IMPORTANTE: Percorso alla cartella dei template di CasparCG
// Assicurati che questo percorso sia corretto per il tuo ambiente server.
// Il percorso viene da config.js (config.templatePath) o usa il path hardcoded come fallback.
const CASPARCG_TEMPLATE_PATH = config.templatePath ?
  path.resolve(__dirname, '../..', 'CasparCG', config.templatePath) :
  path.resolve(__dirname, '../..', 'CasparCG', 'template');
// Verifica che il percorso sia corretto e accessibile
console.log(`[Server] Percorso template CasparCG configurato: ${CASPARCG_TEMPLATE_PATH}`);


function serverLog(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SERVER] [${level.toUpperCase()}] ${message}`);
    // io.emit('server:log', { timestamp, level, message }); // Invia log ai client se necessario
}

const initCasparClient = (host, port) => {
    // ... (implementazione invariata, assicurati che i log usino serverLog)
    serverLog(`Tentativo di inizializzazione client CasparCG per ${host}:${port}`);
    if (casparClientInstance) {
        serverLog('Disconnessione del client CasparCG esistente...');
        casparClientInstance.disconnect();
        casparClientInstance = null;
    }
    casparState.connected = false;
    casparClientInstance = new CasparClient({ host, port, /* ...altre opzioni... */ });

    casparClientInstance.on('connected', async () => {
        serverLog(`CONNESSO a CasparCG (${host}:${port})`);
        casparState.connected = true; casparState.host = host; casparState.port = port;
        io.emit('caspar:connected', { host, port });
        io.emit('caspar:loading', false); // Assicurati che loading sia false dopo connessione
        try {
            const versionRes = await casparClientInstance.getVersion(); // Usa il metodo aggiornato
            casparState.serverVersion = versionRes || 'Sconosciuta';
            serverLog(`Versione CasparCG: ${casparState.serverVersion}`);

            // Inizializza il client OSC dopo la connessione al server CasparCG
            initOscClient(host);
        } catch (error) { serverLog(`Errore recupero versione: ${error.message}`, 'error');}
    });
    casparClientInstance.on('disconnected', (data) => {
        const reason = data && data.reason ? data.reason : 'Disconnessione da CasparCG';
        serverLog(reason, 'warning');
        casparState.connected = false; casparState.serverVersion = null; casparState.channels = [];
        io.emit('caspar:disconnected', { reason });
        io.emit('caspar:loading', false);

        // Disconnetti anche il client OSC
        if (oscClientInstance) {
            oscClientInstance.disconnect();
        }
    });
    casparClientInstance.on('error', (err) => {
        serverLog(`Errore client CasparCG: ${err.message}`, 'error');
        // Non emettere caspar:error qui se 'disconnected' viene già emesso
        io.emit('caspar:error', { message: `Errore client CasparCG: ${err.message}` });
        io.emit('caspar:loading', false);
    });
    casparClientInstance.on('log', (message) => { io.emit('caspar:log', { message }); });
    casparClientInstance.on('reconnect_failed', () => {
        serverLog('Tutti i tentativi di riconnessione a CasparCG falliti.', 'error');
        io.emit('caspar:reconnect_failed');
        casparState.connected = false;
        io.emit('caspar:loading', false);
    });

    serverLog(`Tentativo di connessione effettiva a CasparCG ${host}:${port}...`);
    return casparClientInstance.connect()
        .catch((err) => {
            serverLog(`Errore connessione iniziale a CasparCG ${host}:${port}: ${err.message}`, 'error');
            casparState.connected = false;
            io.emit('caspar:error', { message: `Errore connessione iniziale a CasparCG: ${err.message}` });
            io.emit('caspar:loading', false); // Assicurati che loading sia false anche in caso di errore
            throw err; // Rilancia l'errore per gestirlo nel chiamante se necessario
        });
};

const initOscClient = (host) => {
    serverLog(`Tentativo di inizializzazione client OSC per ${host}:6250`);
    if (oscClientInstance) {
        serverLog('Disconnessione del client OSC esistente...');
        oscClientInstance.disconnect();
        oscClientInstance = null;
    }

    casparState.oscConnected = false;
    oscClientInstance = new OscClient({
        host,
        port: 6250, // Porta OSC predefinita di CasparCG
        localPort: 5253 // Porta locale per ricevere i messaggi OSC
    });

    oscClientInstance.on('connected', () => {
        serverLog(`CONNESSO a CasparCG OSC (${host}:6250)`);
        casparState.oscConnected = true;
        io.emit('osc:connected', { host });
    });

    oscClientInstance.on('disconnected', (data) => {
        const reason = data && data.reason ? data.reason : 'Disconnessione da CasparCG OSC';
        serverLog(reason, 'warning');
        casparState.oscConnected = false;
        io.emit('osc:disconnected', { reason });
    });

    oscClientInstance.on('error', (err) => {
        serverLog(`Errore client OSC: ${err.message}`, 'error');
        io.emit('osc:error', { message: `Errore client OSC: ${err.message}` });
    });

    oscClientInstance.on('log', (message) => {
        io.emit('osc:log', { message });
    });

    // Cache per i messaggi OSC per evitare log ridondanti
    const oscCache = {};

    // Funzione per verificare se un messaggio è cambiato rispetto all'ultimo ricevuto
    const isMessageChanged = (key, type, value) => {
        const cacheKey = `${key}-${type}`;
        if (oscCache[cacheKey] === undefined || oscCache[cacheKey] !== value) {
            oscCache[cacheKey] = value;
            return true;
        }
        return false;
    };

    // Gestione dei messaggi OSC specifici
    oscClientInstance.on('timecode', (data) => {
        const key = `${data.channel}-${data.layer}`;

        // Log solo se il valore è cambiato o se è un canale prioritario (3)
        if (data.channel === '3' || isMessageChanged(key, 'timecode', data.rawTime)) {
            // Riduci il livello di log a 'trace' per ridurre il volume
            serverLog(`OSC Timecode: ${key} = ${data.time} (raw: ${data.rawTime})`, 'trace');
        }

        // Aggiorna lo stato OSC globale sempre
        updateOscState(data.channel, data.layer, 'timecode', data);

        // Emetti eventi solo per canali prioritari o quando il valore cambia
        if (data.channel === '3' || isMessageChanged(key, 'timecode_emit', data.rawTime)) {
            io.emit('osc:timecode', data);
            io.emit(`osc:timecode:${key}`, data);
        }
    });

    oscClientInstance.on('frame', (data) => {
        const key = `${data.channel}-${data.layer}`;

        // Aggiorna lo stato OSC globale sempre
        updateOscState(data.channel, data.layer, 'frame', data);

        // Emetti eventi solo per canali prioritari o quando il valore cambia
        if (data.channel === '3' || isMessageChanged(key, 'frame', data.frame)) {
            io.emit('osc:frame', data);
            io.emit(`osc:frame:${key}`, data);
        }
    });

    oscClientInstance.on('fps', (data) => {
        const key = `${data.channel}-${data.layer}`;

        // Aggiorna lo stato OSC globale sempre
        updateOscState(data.channel, data.layer, 'fps', data);

        // Emetti eventi solo per canali prioritari o quando il valore cambia
        if (data.channel === '3' || isMessageChanged(key, 'fps', data.fps)) {
            io.emit('osc:fps', data);
            io.emit(`osc:fps:${key}`, data);
        }
    });

    oscClientInstance.on('path', (data) => {
        const key = `${data.channel}-${data.layer}`;

        // Log solo se il valore è cambiato
        if (isMessageChanged(key, 'path', data.path)) {
            serverLog(`OSC Path: ${key} = ${data.path}`, 'debug');
        }

        // Aggiorna lo stato OSC globale sempre
        updateOscState(data.channel, data.layer, 'path', data);

        // Emetti eventi solo quando il valore cambia
        if (isMessageChanged(key, 'path_emit', data.path)) {
            io.emit('osc:path', data);
            io.emit(`osc:path:${key}`, data);
        }
    });

    oscClientInstance.on('length', (data) => {
        const key = `${data.channel}-${data.layer}`;

        // Log solo se il valore è cambiato
        if (isMessageChanged(key, 'length', data.length)) {
            serverLog(`OSC Length: ${key} = ${data.length} frames (${data.timecode})`, 'debug');
        }

        // Aggiorna lo stato OSC globale sempre
        updateOscState(data.channel, data.layer, 'length', data);

        // Emetti eventi solo quando il valore cambia
        if (isMessageChanged(key, 'length_emit', data.length)) {
            io.emit('osc:length', data);
            io.emit(`osc:length:${key}`, data);
        }
    });

    oscClientInstance.on('paused', (data) => {
        const key = `${data.channel}-${data.layer}`;

        // Log solo se il valore è cambiato
        if (isMessageChanged(key, 'paused', data.paused)) {
            serverLog(`OSC Paused: ${key} = ${data.paused}`, 'trace');
        }

        // Aggiorna lo stato OSC globale sempre
        updateOscState(data.channel, data.layer, 'paused', data);

        // Emetti eventi solo quando il valore cambia
        if (isMessageChanged(key, 'paused_emit', data.paused)) {
            io.emit('osc:paused', data);
            io.emit(`osc:paused:${key}`, data);
        }
    });

    oscClientInstance.on('loop', (data) => {
        const key = `${data.channel}-${data.layer}`;

        // Aggiorna lo stato OSC globale sempre
        updateOscState(data.channel, data.layer, 'loop', data);

        // Emetti eventi solo quando il valore cambia
        if (isMessageChanged(key, 'loop', data.loop)) {
            io.emit('osc:loop', data);
            io.emit(`osc:loop:${key}`, data);
        }
    });

    // Gestione dei messaggi OSC generici - disabilitato per ridurre i log
    oscClientInstance.on('message', (oscMsg) => {
        // Non loggare i messaggi generici per ridurre il volume dei log
        // Solo per debug specifico, decommentare la riga seguente
        // if (oscMsg.address.includes('/file/')) {
        //     serverLog(`OSC Message: ${oscMsg.address} = ${oscMsg.args && oscMsg.args[0] ? oscMsg.args[0].value : 'N/A'}`, 'trace');
        // }
    });

    // Invia periodicamente lo stato OSC completo al frontend
    const oscStateInterval = setInterval(() => {
        if (io && Object.keys(oscState).length > 0) {
            // Filtra lo stato OSC per includere solo i canali attivi o importanti
            const filteredState = {};

            // Priorità al canale 3 (preview)
            Object.entries(oscState).forEach(([key, state]) => {
                const [channel] = key.split('-');
                if (channel === '3') {
                    filteredState[key] = state;
                }
            });

            // Aggiungi altri canali solo se hanno dati significativi
            Object.entries(oscState).forEach(([key, state]) => {
                const [channel] = key.split('-');
                if (channel !== '3' && state && (state.timecode || state.paused !== undefined)) {
                    filteredState[key] = state;
                }
            });

            // Invia solo lo stato filtrato al frontend
            io.emit('osc:state:all', filteredState);

            // Log dello stato OSC per il debug (solo se ci sono dati significativi)
            if (Object.keys(filteredState).length > 0) {
                const compactState = {};

                // Crea una versione compatta dello stato per il log
                Object.entries(filteredState).forEach(([key, state]) => {
                    // Filtra ulteriormente per loggare solo il canale 3 o canali attivi
                    const [channel] = key.split('-');
                    if (channel === '3' || (state && state.timecode)) {
                        compactState[key] = {};

                        // Includi solo i dati essenziali
                        if (state.timecode) {
                            compactState[key].timecode = state.timecode.time;
                        }

                        if (state.paused) {
                            compactState[key].paused = state.paused.paused;
                        }

                        if (state.length) {
                            compactState[key].length = state.length.timecode;
                        }
                    }
                });

                // Log solo se ci sono dati per il canale 3 o altri canali attivi
                if (Object.keys(compactState).length > 0) {
                    // Riduci il livello di log per lo stato OSC a 'trace' invece di 'debug'
                    serverLog(`Stato OSC: ${JSON.stringify(compactState)}`, 'trace');
                }
            }
        }
    }, 5000); // Aumentato a 5 secondi per ridurre ulteriormente il traffico

    // Pulisci l'intervallo quando il client OSC si disconnette
    oscClientInstance.on('disconnected', () => {
        if (oscStateInterval) {
            clearInterval(oscStateInterval);
        }
    });

    serverLog(`Tentativo di connessione effettiva a CasparCG OSC ${host}:6250...`);
    return oscClientInstance.connect()
        .catch((err) => {
            serverLog(`Errore connessione iniziale a CasparCG OSC ${host}:6250: ${err.message}`, 'error');
            casparState.oscConnected = false;
            io.emit('osc:error', { message: `Errore connessione iniziale a CasparCG OSC: ${err.message}` });
        });
};

const sendCommandToCaspar = async (commandString) => {
    // ... (implementazione invariata)
    if (!casparClientInstance || !casparState.connected) {
        serverLog(`Invio comando "${commandString}" fallito: non connesso.`, 'warning');
        return { success: false, message: 'Non connesso a CasparCG' };
    }
    try {
        // Riduci il livello di log per i comandi CLS e TLS a 'trace' invece di 'debug'
        const logLevel = (commandString === 'CLS' || commandString === 'TLS') ? 'trace' : 'debug';
        serverLog(`Invio comando: "${commandString}"`, logLevel);

        const response = await casparClientInstance.sendCommand(commandString);
        return { success: true, response };
    } catch (err) {
        serverLog(`Errore invio comando "${commandString}": ${err.message}`, 'error');
        return { success: false, message: err.message };
    }
};

io.on('connection', (socket) => {
    serverLog(`Nuovo client Socket.IO connesso: ${socket.id}`);
    socket.emit('caspar:status', { /* ... stato corrente ... */
        connected: casparState.connected,
        host: casparState.host,
        port: casparState.port,
        version: casparState.serverVersion,
        oscConnected: casparState.oscConnected
    });

    socket.on('disconnect', (reason) => {
        serverLog(`Client Socket.IO disconnesso: ${socket.id}. Motivo: ${reason}`);

        // Pulisci le sessioni di preview associate a questo socket
        Object.entries(profileManager.previewSessionManager.sessions).forEach(([sessionId, session]) => {
            if (session.socketId === socket.id) {
                serverLog(`Pulizia della sessione di preview ${sessionId} per il socket disconnesso ${socket.id}...`);
                profileManager.previewSessionManager.deleteSession(sessionId);
            }
        });
    });

    socket.on('caspar:status:request', () => {
        serverLog(`Richiesta stato CasparCG da client ${socket.id}`);
        socket.emit('caspar:status', { /* ... stato corrente ... */
            connected: casparState.connected,
            host: casparState.host,
            port: casparState.port,
            version: casparState.serverVersion,
            oscConnected: casparState.oscConnected
        });
    });

    // Eventi per i profili CasparCG
    socket.on('profiles:list', async (callback) => {
        try {
            serverLog(`Richiesta lista profili CasparCG da client ${socket.id}`);
            const profiles = profileManager.profileState.profiles;
            serverLog(`Invio ${profiles.length} profili al client ${socket.id}: ${JSON.stringify(profiles.map(p => ({id: p.id, name: p.name})))}`);
            callback({ success: true, profiles });
        } catch (error) {
            serverLog(`Errore nella richiesta lista profili: ${error.message}`, 'error');
            callback({ success: false, message: error.message });
        }
    });

    socket.on('profiles:servers', async (callback) => {
        try {
            serverLog(`Richiesta lista server CasparCG da client ${socket.id}`);
            const servers = profileManager.profileState.servers;
            callback({ success: true, servers });
        } catch (error) {
            serverLog(`Errore nella richiesta lista server: ${error.message}`, 'error');
            callback({ success: false, message: error.message });
        }
    });

    socket.on('profiles:assignments', async (data, callback) => {
        try {
            const { profileId } = data;
            serverLog(`Richiesta assegnazioni per il profilo ${profileId} da client ${socket.id}`);

            const assignments = profileManager.getAssignmentsByProfileId(profileId);
            const assignmentsWithDetails = await Promise.all(assignments.map(async (assignment) => {
                const server = profileManager.getServerById(assignment.server_id);
                return {
                    ...assignment,
                    server: server ? {
                        id: server.id,
                        name: server.name,
                        host: server.host,
                        port: server.port,
                        purpose: server.purpose,
                        is_enabled: server.is_enabled
                    } : null
                };
            }));

            callback({ success: true, assignments: assignmentsWithDetails });
        } catch (error) {
            serverLog(`Errore nella richiesta assegnazioni: ${error.message}`, 'error');
            callback({ success: false, message: error.message });
        }
    });

    socket.on('caspar:connect', async (data) => {
        const { host, port } = data;
        serverLog(`Richiesta connessione a CasparCG da ${socket.id} -> ${host}:${port}`);
        if (!host || !port) {
            return io.emit('caspar:error', { message: 'Host e porta richiesti.' }); // Usa io.emit per notificare tutti
        }
        io.emit('caspar:loading', true);
        try {
            await initCasparClient(host, parseInt(port));
            // Gli eventi 'caspar:connected' o 'caspar:error' aggiorneranno i client
        } catch (error) {
            // L'errore è già loggato e emesso da initCasparClient
            // io.emit('caspar:loading', false); // Già gestito in initCasparClient
        }
    });

    socket.on('caspar:connect:profile', async (data, callback) => {
        try {
            const { profileId, serverRole } = data;
            serverLog(`Richiesta connessione a CasparCG tramite profilo da ${socket.id} -> Profilo: ${profileId}, Ruolo: ${serverRole}`);

            if (!profileId) {
                throw new Error('ID profilo richiesto.');
            }

            if (!serverRole) {
                throw new Error('Ruolo server richiesto.');
            }

            // Ottieni il server per il profilo e il ruolo specificati
            const serverInfo = profileManager.getServerByProfileAndRole(profileId, serverRole);
            if (!serverInfo) {
                throw new Error(`Nessun server trovato per il profilo ${profileId} con ruolo ${serverRole}.`);
            }

            const { server } = serverInfo;

            // Verifica che il server sia abilitato
            if (!server.is_enabled) {
                throw new Error(`Il server ${server.name} non è abilitato.`);
            }

            io.emit('caspar:loading', true);

            // Connetti al server
            await initCasparClient(server.host, server.port);

            if (typeof callback === 'function') {
                callback({
                    success: true,
                    server: {
                        id: server.id,
                        name: server.name,
                        host: server.host,
                        port: server.port
                    }
                });
            }
        } catch (error) {
            serverLog(`Errore nella connessione tramite profilo: ${error.message}`, 'error');
            io.emit('caspar:error', { message: error.message });
            io.emit('caspar:loading', false);

            if (typeof callback === 'function') {
                callback({ success: false, message: error.message });
            }
        }
    });

    // Eventi per le sessioni di preview
    socket.on('preview:request_session', async (data, callback) => {
        try {
            const { profileId } = data;
            serverLog(`Richiesta sessione di preview da ${socket.id} per il profilo ${profileId}`);

            if (!profileId) {
                throw new Error('ID profilo richiesto.');
            }

            // Crea una nuova sessione di preview
            const result = await profileManager.previewSessionManager.createSession(profileId);
            if (!result.success) {
                throw new Error(result.message);
            }

            const { session } = result;

            // Associa la sessione al socket
            session.socketId = socket.id;

            serverLog(`Sessione di preview creata: ${session.id} (${session.server.name}, canale ${session.channel}, layer ${session.layer})`);

            callback({
                success: true,
                sessionId: session.id,
                server: session.server,
                channel: session.channel,
                layer: session.layer
            });
        } catch (error) {
            serverLog(`Errore nella richiesta di sessione di preview: ${error.message}`, 'error');
            callback({ success: false, message: error.message });
        }
    });

    socket.on('preview:command', async (data, callback) => {
        try {
            const { sessionId, command } = data;

            if (!sessionId) {
                throw new Error('ID sessione richiesto.');
            }

            if (!command) {
                throw new Error('Comando richiesto.');
            }

            // Invia il comando alla sessione di preview
            const result = await profileManager.previewSessionManager.sendCommand(sessionId, command);

            callback(result);
        } catch (error) {
            serverLog(`Errore nell'invio del comando di preview: ${error.message}`, 'error');
            callback({ success: false, message: error.message });
        }
    });

    socket.on('preview:release_session', async (data, callback) => {
        try {
            const { sessionId } = data;

            if (!sessionId) {
                throw new Error('ID sessione richiesto.');
            }

            // Elimina la sessione di preview
            const result = profileManager.previewSessionManager.deleteSession(sessionId);

            callback({ success: true, released: result });
        } catch (error) {
            serverLog(`Errore nel rilascio della sessione di preview: ${error.message}`, 'error');
            callback({ success: false, message: error.message });
        }
    });

    socket.on('caspar:disconnect', () => {
        serverLog(`Richiesta disconnessione da CasparCG da ${socket.id}`);
        if (casparClientInstance && casparState.connected) {
            io.emit('caspar:loading', true);
            casparClientInstance.disconnect(); // Emetterà 'caspar:disconnected'
        } else {
            serverLog('Nessun client CasparCG attivo da disconnettere o già disconnesso.', 'warning');
            socket.emit('caspar:disconnected', {reason: 'Nessuna connessione attiva da chiudere.'}); // Notifica il client richiedente
        }
    });

    socket.on('caspar:command', async (data, callback) => {
        const commandString = data.command;
        if (typeof commandString !== 'string' || commandString.trim() === '') {
            serverLog(`Comando non valido da ${socket.id}: ${JSON.stringify(data)}`, 'warning');
            if (typeof callback === 'function') callback({ success: false, message: 'Comando AMCP non valido.' });
            return;
        }

        // Riduci il livello di log per i comandi CLS e TLS a 'trace' invece di 'debug'
        const logLevel = (commandString === 'CLS' || commandString === 'TLS') ? 'trace' : 'debug';
        serverLog(`Comando "${commandString}" da ${socket.id}`, logLevel);

        // Priorità alta per i comandi di controllo (PLAY, PAUSE, STOP, CLEAR)
        const isControlCommand = commandString.startsWith('PLAY') ||
                                commandString.startsWith('PAUSE') ||
                                commandString.startsWith('RESUME') ||
                                commandString.startsWith('STOP') ||
                                commandString.startsWith('CLEAR');

        if (isControlCommand) {
            serverLog(`Comando di controllo prioritario: "${commandString}"`, 'info');
        }

        const result = await sendCommandToCaspar(commandString);
        if (typeof callback === 'function') callback(result);
    });

    // Endpoint specifico per i comandi di controllo (priorità alta)
    socket.on('caspar:control', async (data, callback) => {
        const { command, channel, layer, clip, options } = data;

        if (!command || !channel || !layer) {
            serverLog(`Comando di controllo non valido da ${socket.id}: ${JSON.stringify(data)}`, 'warning');
            if (typeof callback === 'function') callback({ success: false, message: 'Parametri comando non validi.' });
            return;
        }

        serverLog(`Comando di controllo "${command}" per ${channel}-${layer} da ${socket.id}`, 'info');

        try {
            let result;

            switch (command.toUpperCase()) {
                case 'PLAY':
                    if (!clip) {
                        throw new Error('Clip richiesta per il comando PLAY');
                    }
                    result = await casparClientInstance.play(channel, layer, clip, options || {});
                    break;
                case 'PAUSE':
                    result = await casparClientInstance.pause(channel, layer);
                    break;
                case 'RESUME':
                    result = await casparClientInstance.resume(channel, layer);
                    break;
                case 'STOP':
                    result = await casparClientInstance.stop(channel, layer);
                    break;
                case 'CLEAR':
                    result = await casparClientInstance.clear(channel, layer);
                    break;
                case 'LOADBG':
                    if (!clip) {
                        throw new Error('Clip richiesta per il comando LOADBG');
                    }
                    result = await casparClientInstance.loadbg(channel, layer, clip, options || {});
                    break;
                default:
                    throw new Error(`Comando di controllo non supportato: ${command}`);
            }

            if (typeof callback === 'function') callback({ success: true, response: result });
        } catch (err) {
            serverLog(`Errore esecuzione comando di controllo "${command}": ${err.message}`, 'error');
            if (typeof callback === 'function') callback({ success: false, message: err.message });
        }
    });

    // NUOVO GESTORE PER RECUPERARE I MANIFEST
    socket.on('get_template_manifest', (templateName, callback) => {
        if (typeof callback !== 'function') {
            serverLog("Callback non fornita per get_template_manifest.", "warning");
            return;
        }
        if (!templateName || typeof templateName !== 'string') {
          serverLog(`Richiesta manifest non valida da ${socket.id}: nome template mancante o non stringa.`, "warning");
          return callback({ error: 'Nome del template non fornito o non valido.' });
        }

        // templateName è il nome base (es. "LOWER_THIRDNEW" o "FOLDER/MYTEMPLATE")
        const manifestFileName = `${templateName}.manifest.json`;
        // path.resolve per sicurezza contro path traversal, anche se templateName viene dal client
        const manifestPath = path.resolve(CASPARCG_TEMPLATE_PATH, manifestFileName);

        serverLog(`Richiesta manifest per "${templateName}" da ${socket.id}. Percorso: ${manifestPath}`);

        // Verifica che il percorso risolto sia ancora dentro la cartella dei template
        if (!manifestPath.startsWith(path.resolve(CASPARCG_TEMPLATE_PATH))) {
            serverLog(`Tentativo di accesso non valido al manifest: ${manifestPath}`, "error");
            return callback({ error: 'Accesso al percorso manifest non valido.' });
        }

        fs.readFile(manifestPath, 'utf8', (err, fileContent) => {
          if (err) {
            if (err.code === 'ENOENT') {
              serverLog(`Manifest non trovato: ${manifestPath}`);
              // È normale che un template non abbia un manifest, quindi restituisci data: null
              return callback({ data: null });
            }
            serverLog(`Errore lettura manifest ${manifestPath}: ${err.message}`, 'error');
            return callback({ error: `Errore lettura file manifest: ${err.message}` });
          }

          try {
            const manifestData = JSON.parse(fileContent);
            serverLog(`Manifest "${manifestPath}" inviato con successo a ${socket.id}.`);
            callback({ data: manifestData });
          } catch (parseError) {
            serverLog(`Errore parsing JSON per ${manifestPath}: ${parseError.message}`, 'error');
            callback({ error: `Errore parsing JSON del manifest: ${parseError.message}` });
          }
        });
    });
});

if (process.env.NODE_ENV === 'production') {
    const staticPath = config.staticPath || path.join(__dirname, '..', 'client', 'build'); // Assumendo una struttura standard
    serverLog(`Servizio file statici da: ${staticPath} in modalità produzione.`);
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(staticPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Server CasparCG Control Web in esecuzione (modalità sviluppo).');
    });
}

server.listen(PORT, async () => {
    serverLog(`Server HTTP e Socket.IO in ascolto sulla porta ${PORT}`);
    serverLog(`Permetti connessioni CORS da: ${process.env.CLIENT_URL || "http://localhost:3000"}`);

    try {
        // Inizializza il gestore dei profili
        serverLog('Inizializzazione del gestore dei profili CasparCG...');
        await profileManager.initialize();
        serverLog('Gestore dei profili CasparCG inizializzato con successo.');

        // Considera se avviare initCasparClient qui o attendere una richiesta dal client.
        // Per ora, lo lascio commentato per permettere al client di specificare host/port.
        // if (config.caspar.autoConnectOnServerStart) {
        //    initCasparClient(config.caspar.host, config.caspar.port);
        // }
    } catch (error) {
        serverLog(`Errore durante l'inizializzazione del gestore dei profili: ${error.message}`, 'error');
    }
});

module.exports = app;
