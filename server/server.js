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
const { getVideoDurationInSeconds } = require('get-video-duration');

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

// 🔥 ASSETS HTTP SERVING - Struttura organizzata per CasparCG (SPX Style)
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));         // Assets root folder

// 🔥 BACKWARD COMPATIBILITY - Mantieni i vecchi endpoint  
app.use('/templates', express.static(path.resolve(__dirname, '../templates')));   // Legacy templates
app.use('/media', express.static(path.resolve(__dirname, '../media')));           // Legacy media
app.use('/images', express.static(path.resolve(__dirname, '../images')));         // Legacy images
app.use('/video', express.static(path.resolve(__dirname, '../video')));           // Legacy video
app.use('/audio', express.static(path.resolve(__dirname, '../audio')));           // Legacy audio
app.use('/graphics', express.static(path.resolve(__dirname, '../graphics')));     // Legacy graphics
app.use('/logos', express.static(path.resolve(__dirname, '../client/public')));   // Legacy logos

const PORT = config.server.port || 5000; // Assicurati che config.server.port esista
let casparClientInstance = null;
let oscClientInstance = null;

// MIGLIORAMENTO 3: Command Debouncing System
const commandDebounceMap = new Map(); // Mappa per tracciare comandi recenti
const DEBOUNCE_WINDOW_MS = 500; // 500ms window per prevenire duplicati

// MIGLIORAMENTO 3: Funzione per generare chiave debounce
const generateDebounceKey = (command, channel, layer, clip) => {
    return `${command.toUpperCase()}-${channel}-${layer}-${clip || 'NO_CLIP'}`;
};

// MIGLIORAMENTO 3: Funzione per verificare se comando è duplicato
const isDuplicateCommand = (command, channel, layer, clip, socketId) => {
    const key = generateDebounceKey(command, channel, layer, clip);
    const now = Date.now();
    const lastCommand = commandDebounceMap.get(key);
    
    if (lastCommand && (now - lastCommand.timestamp) < DEBOUNCE_WINDOW_MS) {
        serverLog(`🚫 [DEBOUNCE] Comando duplicato bloccato: ${key} da ${socketId} (ultimo: ${now - lastCommand.timestamp}ms fa)`, 'debug');
        return true;
    }
    
    // Registra il nuovo comando
    commandDebounceMap.set(key, { timestamp: now, socketId });
    
    // Cleanup periodico (rimuovi entries più vecchi di 5 secondi)
    if (Math.random() < 0.1) { // 10% delle volte
        for (const [mapKey, value] of commandDebounceMap.entries()) {
            if (now - value.timestamp > 5000) {
                commandDebounceMap.delete(mapKey);
            }
        }
    }
    
    return false;
};
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
        // FIX AUTOPLAY: Emetti SEMPRE per canale 1 per garantire detection fine media
        if (data.channel === '3' || data.channel === '1' || isMessageChanged(key, 'timecode_emit', data.rawTime)) {
            io.emit('osc:timecode', data);
            io.emit(`osc:timecode:${key}`, data);
        }
    });

    oscClientInstance.on('frame', (data) => {
        const key = `${data.channel}-${data.layer}`;

        // Aggiorna lo stato OSC globale sempre
        updateOscState(data.channel, data.layer, 'frame', data);

        // Emetti eventi per canali prioritari (1 e 3) o quando il valore cambia
        // FIX LOOP: Emetti sempre per canale 1 per garantire loop continuo
        if (data.channel === '1' || data.channel === '3' || isMessageChanged(key, 'frame', data.frame)) {
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

        // Emetti eventi per canali prioritari o quando il valore cambia
        // FIX LOOP: Emetti sempre per canale 1 per garantire dati completi
        if (data.channel === '1' || data.channel === '3' || isMessageChanged(key, 'length_emit', data.length)) {
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

// 🔥 FUNZIONE TEMPLATE COMMAND PROCESSOR - Gestisce modalità HTTP per CG ADD e PLAY
const processTemplateCommand = (commandString) => {
    // 🔥 GESTIONE COMANDI CG ADD per template
    if (config.templates.mode === 'HTTP' && commandString.includes('CG') && commandString.includes('ADD')) {
        const cgAddMatch = commandString.match(/CG\s+(\d+-\d+)\s+ADD\s+(\d+)\s+"([^"]+)"/);
        if (cgAddMatch) {
            const [, channel, layer, templateName] = cgAddMatch;
            
            if (!templateName.startsWith('http')) {
                // 🔥 DISTINZIONE INTELLIGENTE: Template locali vs remoti CasparCG
                // Verifica se il template esiste fisicamente nella cartella locale
                const fs = require('fs');
                const path = require('path');
                const localTemplatePath = path.resolve(__dirname, '../templates', `${templateName}.html`);
                const assetsTemplatePath = path.resolve(__dirname, '../assets/templates', `${templateName}.html`);
                
                const isLocalTemplate = (
                    fs.existsSync(localTemplatePath) || 
                    fs.existsSync(assetsTemplatePath)
                );
                
                if (isLocalTemplate) {
                    // Template locale → Converte in HTTP
                    const httpUrl = `${config.templates.httpBaseUrl}/${templateName}.html`;
                    const newCommand = commandString.replace(`"${templateName}"`, `"${httpUrl}"`);
                    serverLog(`🔥 HTTP Mode: Converted LOCAL template "${templateName}" to "${httpUrl}" (exists locally)`, 'info');
                    return newCommand;
                } else {
                    // Template remoto CasparCG → Lascia inalterato
                    serverLog(`🎯 CasparCG Mode: Keeping REMOTE template "${templateName}" as original path (not found locally)`, 'info');
                    return commandString;
                }
            }
        }
    }
    
    // 🔥 GESTIONE COMANDI PLAY per assets
    if (commandString.includes('PLAY') && commandString.includes('assets/')) {
        const playMatch = commandString.match(/PLAY\s+(\d+-\d+)\s+"([^"]+)"/);
        if (playMatch) {
            const [, channel, assetPath] = playMatch;
            
            // Se il path inizia con "assets/" e non è già HTTP, convertilo
            if (assetPath.startsWith('assets/') && !assetPath.startsWith('http')) {
                const httpUrl = `${config.assets.httpBaseUrl}/${assetPath.replace('assets/', '')}`;
                const newCommand = commandString.replace(`"${assetPath}"`, `"${httpUrl}"`);
                serverLog(`🔥 HTTP Mode: Converted asset "${assetPath}" to "${httpUrl}"`, 'info');
                return newCommand;
            }
        }
    }
    
    return commandString; // Ritorna comando originale se non richiede conversione
};

const sendCommandToCaspar = async (commandString) => {
    if (!casparClientInstance || !casparState.connected) {
        serverLog(`Invio comando "${commandString}" fallito: non connesso.`, 'warning');
        return { success: false, message: 'Non connesso a CasparCG' };
    }
    
    // 🔥 PROCESSA COMANDO PER MODALITÀ TEMPLATE
    const processedCommand = processTemplateCommand(commandString);
    
    try {
        // Riduci il livello di log per i comandi CLS e TLS a 'trace' invece di 'debug'
        const logLevel = (processedCommand === 'CLS' || processedCommand === 'TLS') ? 'trace' : 'debug';
        const scanLogLevel = processedCommand === 'SCAN' ? 'info' : logLevel;
        serverLog(`Invio comando: "${processedCommand}"`, scanLogLevel);

        // 🎯 IMPORTANTE: Per CLS, restituisci l'array di oggetti parsati con durate!
        if (processedCommand === 'CLS') {
            const mediaList = await casparClientInstance.getMediaList();
            serverLog(`📊 CLS response: ${mediaList.length} media con durate`, 'info');
            
            // DEBUG: Log dettagliato per ogni media
            for (const media of mediaList) {
                if (media.frames && media.duration) {
                    serverLog(`📹 "${media.name}": ${media.frames} frames → ${media.duration}ms (${(media.duration/1000).toFixed(1)}s)`, 'debug');
                }
            }
            
            return { success: true, response: JSON.stringify(mediaList), parsedMedia: mediaList };
        }
        
        // 🔥 NUOVO: Gestione comando SCAN per ottenere TUTTI i media (CasparCG + assets locali)
        if (processedCommand === 'SCAN') {
            serverLog('🔥 COMANDO SCAN RICEVUTO - Scansione assets locali + CasparCG', 'info');
            return new Promise((resolve) => {
                // Simula una chiamata a media:list tramite evento interno
                const fakeSocket = {
                    on: (event, callback) => {}
                };
                
                // Chiama direttamente la logica di media:list
                const scanMediaList = async () => {
                    const mediaList = {
                        caspar: [],
                        assets: {}
                    };
                    
                    // Scan assets locali
                    const assetsConfig = config.assets;
                    serverLog(`🔍 Config assets: ${JSON.stringify(assetsConfig?.paths || {})}`, 'debug');
                    
                    if (assetsConfig && assetsConfig.paths) {
                        for (const [category, dirPath] of Object.entries(assetsConfig.paths)) {
                            try {
                                if (!mediaList.assets[category]) {
                                    mediaList.assets[category] = [];
                                }
                                
                                serverLog(`📁 Checking directory: ${dirPath} for category: ${category}`, 'debug');
                                
                                if (fs.existsSync(dirPath)) {
                                    serverLog(`✅ Directory exists: ${dirPath}`, 'debug');
                                    // Funzione ricorsiva ASINCRONA per scansionare e calcolare durate
                                    const scanDirectoryRecursive = async (currentDir, relativePath = '') => {
                                        const items = fs.readdirSync(currentDir, { withFileTypes: true });
                                        
                                        for (const item of items) {
                                            if (item.name.startsWith('.')) continue;
                                            
                                            const fullPath = path.join(currentDir, item.name);
                                            const currentRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
                                            
                                            if (item.isFile()) {
                                                const fileName = item.name;
                                                const fileExtension = path.extname(fileName).toLowerCase();
                                                const httpUrl = `${assetsConfig.httpBaseUrl}/${category}/${currentRelativePath}`;
                                                const fileStats = fs.statSync(fullPath);
                                                
                                                const isSupported = category === 'templates' || 
                                                    Object.values(assetsConfig.supportedFormats || {}).flat().includes(fileExtension);
                                                
                                                if (isSupported || category === 'templates') {
                                                    let duration = 0;
                                                    let durationFormatted = '';
                                                    let frames = 0;
                                                    
                                                    // Calcola durata per file video/audio
                                                    if (category === 'video' || category === 'audio') {
                                                        try {
                                                            const durationInSeconds = await getVideoDurationInSeconds(fullPath);
                                                            duration = Math.round(durationInSeconds * 1000);
                                                            frames = Math.round(durationInSeconds * 25);
                                                            
                                                            const hours = Math.floor(durationInSeconds / 3600);
                                                            const minutes = Math.floor((durationInSeconds % 3600) / 60);
                                                            const seconds = Math.floor(durationInSeconds % 60);
                                                            durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                                                            
                                                            serverLog(`📊 Durata ${fileName}: ${durationFormatted} (${duration}ms)`, 'debug');
                                                        } catch (durErr) {
                                                            serverLog(`⚠️ Impossibile calcolare durata per ${fileName}: ${durErr.message}`, 'debug');
                                                        }
                                                    }
                                                    
                                                    mediaList.assets[category].push({
                                                        name: fileName,
                                                        path: `assets/${category}/${currentRelativePath}`,
                                                        httpUrl: httpUrl,
                                                        type: category,
                                                        extension: fileExtension,
                                                        size: fileStats.size,
                                                        duration: duration,
                                                        durationFormatted: durationFormatted,
                                                        frames: frames,
                                                        subfolder: relativePath || null
                                                    });
                                                }
                                            } else if (item.isDirectory()) {
                                                await scanDirectoryRecursive(fullPath, currentRelativePath);
                                            }
                                        }
                                    };
                                    
                                    await scanDirectoryRecursive(dirPath);
                                    serverLog(`🔥 Assets scan: ${category} = ${mediaList.assets[category].length} files`, 'info');
                                } else {
                                    serverLog(`⚠️ Directory NOT found: ${dirPath}`, 'warning');
                                }
                            } catch (scanError) {
                                serverLog(`❌ Errore scan ${category}: ${scanError.message}`, 'error');
                            }
                        }
                    }
                    
                    // Scan media CasparCG
                    try {
                        if (casparClientInstance && casparClientInstance.connected) {
                            const casparMediaList = await casparClientInstance.getMediaList();
                            mediaList.caspar = casparMediaList || [];
                            serverLog(`🔥 CasparCG media scan: ${mediaList.caspar.length} files`, 'info');
                        }
                    } catch (casparError) {
                        serverLog(`⚠️ Errore scan CasparCG: ${casparError.message}`, 'warning');
                    }
                    
                    return mediaList;
                };
                
                scanMediaList().then(media => {
                    resolve({ success: true, media });
                }).catch(err => {
                    resolve({ success: false, message: err.message });
                });
            });
        }

        const response = await casparClientInstance.sendCommand(processedCommand);
        return { success: true, response };
    } catch (err) {
        serverLog(`Errore invio comando "${processedCommand}": ${err.message}`, 'error');
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
        
        // DEBUG: Log specifico per CLS
        if (commandString === 'CLS' && result.parsedMedia) {
            serverLog(`🔍 SENDING parsedMedia to client: ${result.parsedMedia.length} items`, 'info');
            // Log primi 3 media come esempio
            result.parsedMedia.slice(0, 3).forEach(m => {
                if (m.frames && m.duration) {
                    serverLog(`  → "${m.name}": ${m.frames}fr = ${m.duration}ms`, 'debug');
                }
            });
        }
        
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

        // MIGLIORAMENTO 3: Check comando duplicato
        if (isDuplicateCommand(command, channel, layer, clip, socket.id)) {
            if (typeof callback === 'function') callback({ success: true, response: 'Comando duplicato ignorato', debounced: true });
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
                    // 🔥 APPLICA AUTO-CONVERSIONE HTTP AI CONTROL COMMANDS
                    let processedClip = clip;
                    if (clip.startsWith('assets/') && !clip.startsWith('http')) {
                        processedClip = `${config.assets.httpBaseUrl}/${clip.replace('assets/', '')}`;
                        serverLog(`🔥 HTTP Mode: Converted control command asset "${clip}" to "${processedClip}"`, 'info');
                    }
                    result = await casparClientInstance.play(channel, layer, processedClip, options || {});
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
                    // 🔥 APPLICA AUTO-CONVERSIONE HTTP AI CONTROL COMMANDS
                    let processedClipLoadbg = clip;
                    if (clip.startsWith('assets/') && !clip.startsWith('http')) {
                        processedClipLoadbg = `${config.assets.httpBaseUrl}/${clip.replace('assets/', '')}`;
                        serverLog(`🔥 HTTP Mode: Converted control command asset "${clip}" to "${processedClipLoadbg}"`, 'info');
                    }
                    result = await casparClientInstance.loadbg(channel, layer, processedClipLoadbg, options || {});
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

    // 🔥 NUOVO ENDPOINT: Scansione completa media (assets + CasparCG)
    socket.on('media:scan', async (callback) => {
        if (typeof callback !== 'function') {
            serverLog("Callback non fornita per media:scan.", "warning");
            return;
        }

        serverLog('🔥 MEDIA:SCAN ricevuto - Scansione completa assets + CasparCG', 'info');

        try {
            const mediaList = {
                caspar: [],
                assets: {}
            };

            // 🔥 SCAN CARTELLE ASSETS LOCALI
            const assetsConfig = config.assets;
            serverLog(`🔍 Config assets: ${JSON.stringify(assetsConfig?.paths || {})}`, 'debug');
            
            if (assetsConfig && assetsConfig.paths) {
                for (const [category, dirPath] of Object.entries(assetsConfig.paths)) {
                    try {
                        if (!mediaList.assets[category]) {
                            mediaList.assets[category] = [];
                        }
                        
                        serverLog(`📁 Checking directory: ${dirPath} for category: ${category}`, 'debug');
                        
                        if (fs.existsSync(dirPath)) {
                            serverLog(`✅ Directory exists: ${dirPath}`, 'debug');
                            // Funzione ricorsiva ASINCRONA per scansionare e calcolare durate
                            const scanDirectoryRecursive = async (currentDir, relativePath = '') => {
                                const items = fs.readdirSync(currentDir, { withFileTypes: true });
                                
                                for (const item of items) {
                                    if (item.name.startsWith('.')) continue;
                                    
                                    const fullPath = path.join(currentDir, item.name);
                                    const currentRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
                                    
                                    if (item.isFile()) {
                                        const fileName = item.name;
                                        const fileExtension = path.extname(fileName).toLowerCase();
                                        const httpUrl = `${assetsConfig.httpBaseUrl}/${category}/${currentRelativePath}`;
                                        const fileStats = fs.statSync(fullPath);
                                        
                                        const isSupported = category === 'templates' || 
                                            Object.values(assetsConfig.supportedFormats || {}).flat().includes(fileExtension);
                                        
                                        if (isSupported || category === 'templates') {
                                            let duration = 0;
                                            let durationFormatted = '';
                                            let frames = 0;
                                            
                                            // Calcola durata per file video/audio
                                            if (category === 'video' || category === 'audio') {
                                                try {
                                                    const durationInSeconds = await getVideoDurationInSeconds(fullPath);
                                                    duration = Math.round(durationInSeconds * 1000);
                                                    frames = Math.round(durationInSeconds * 25);
                                                    
                                                    const hours = Math.floor(durationInSeconds / 3600);
                                                    const minutes = Math.floor((durationInSeconds % 3600) / 60);
                                                    const seconds = Math.floor(durationInSeconds % 60);
                                                    durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                                                    
                                                    serverLog(`📊 Durata ${fileName}: ${durationFormatted} (${duration}ms)`, 'debug');
                                                } catch (durErr) {
                                                    serverLog(`⚠️ Impossibile calcolare durata per ${fileName}: ${durErr.message}`, 'debug');
                                                }
                                            }
                                            
                                            mediaList.assets[category].push({
                                                name: fileName,
                                                path: `assets/${category}/${currentRelativePath}`,
                                                httpUrl: httpUrl,
                                                type: category,
                                                extension: fileExtension,
                                                size: fileStats.size,
                                                duration: duration,
                                                durationFormatted: durationFormatted,
                                                frames: frames,
                                                subfolder: relativePath || null
                                            });
                                        }
                                    } else if (item.isDirectory()) {
                                        await scanDirectoryRecursive(fullPath, currentRelativePath);
                                    }
                                }
                            };
                            
                            await scanDirectoryRecursive(dirPath);
                            serverLog(`🔥 Assets scan: ${category} = ${mediaList.assets[category].length} files`, 'info');
                        } else {
                            serverLog(`⚠️ Directory NOT found: ${dirPath}`, 'warning');
                        }
                    } catch (scanError) {
                        serverLog(`❌ Errore scan ${category}: ${scanError.message}`, 'error');
                    }
                }
            }
            
            // 🔥 SCAN MEDIA CASPAR SERVER (CLS) se connesso
            try {
                if (casparClientInstance && casparClientInstance.connected) {
                    const casparMediaList = await casparClientInstance.getMediaList();
                    mediaList.caspar = casparMediaList || [];
                    serverLog(`🔥 CasparCG media scan: ${mediaList.caspar.length} files`, 'info');
                } else {
                    serverLog(`⚠️ CasparCG non connesso - solo assets locali`, 'info');
                }
            } catch (casparError) {
                serverLog(`⚠️ Errore scan CasparCG: ${casparError.message}`, 'warning');
            }
            
            const totalAssets = Object.values(mediaList.assets).reduce((acc, arr) => acc + arr.length, 0);
            serverLog(`✅ SCAN COMPLETATO: ${totalAssets} assets locali + ${mediaList.caspar.length} media CasparCG`, 'info');
            
            callback({
                success: true,
                media: mediaList
            });

        } catch (error) {
            serverLog(`❌ Errore devastante nella scansione media: ${error.message}`, 'error');
            callback({
                success: false,
                message: error.message
            });
        }
    });

    // 🎥 VECCHIO ENDPOINT: Lista media disponibili via HTTP
    socket.on('media:list', async (type, callback) => {
        if (typeof callback !== 'function') {
            serverLog("Callback non fornita per media:list.", "warning");
            return;
        }

        const mediaType = type || 'all';

        try {
            const mediaList = {
                caspar: [],        // Media da CasparCG server (CLS)
                assets: {}         // Media da cartelle assets locali (inizializzato dinamicamente)
            };

            // 🔥 SCAN CARTELLE ASSETS LOCALI
            const assetsConfig = config.assets;
            if (assetsConfig && assetsConfig.paths) {
                for (const [category, dirPath] of Object.entries(assetsConfig.paths)) {
                    try {
                        // 🔥 Inizializza array per categoria se non esiste
                        if (!mediaList.assets[category]) {
                            mediaList.assets[category] = [];
                        }
                        
                        if (fs.existsSync(dirPath)) {
                            // 🔥 FUNZIONE RICORSIVA ASINCRONA per scansionare sottocartelle e calcolare durate
                            const scanDirectoryRecursive = async (currentDir, relativePath = '') => {
                                const items = fs.readdirSync(currentDir, { withFileTypes: true });
                                
                                for (const item of items) {
                                    if (item.name.startsWith('.')) continue; // Skip file nascosti
                                    
                                    const fullPath = path.join(currentDir, item.name);
                                    const currentRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
                                    
                                    if (item.isFile()) {
                                        const fileName = item.name;
                                        const fileExtension = path.extname(fileName).toLowerCase();
                                        const httpUrl = `${assetsConfig.httpBaseUrl}/${category}/${currentRelativePath}`;
                                        const fileStats = fs.statSync(fullPath);
                                        
                                        // Verifica formato supportato
                                        const isSupported = category === 'templates' || 
                                            Object.values(assetsConfig.supportedFormats || {}).flat().includes(fileExtension);
                                        
                                        if (isSupported || category === 'templates') {
                                            let duration = 0;
                                            let durationFormatted = '';
                                            let frames = 0;
                                            
                                            // 📊 Calcola durata per file video/audio
                                            if (category === 'video' || category === 'audio') {
                                                try {
                                                    const durationInSeconds = await getVideoDurationInSeconds(fullPath);
                                                    duration = Math.round(durationInSeconds * 1000); // Converti in millisecondi
                                                    frames = Math.round(durationInSeconds * 25); // Assumendo 25fps
                                                    
                                                    // Formatta durata in HH:MM:SS
                                                    const hours = Math.floor(durationInSeconds / 3600);
                                                    const minutes = Math.floor((durationInSeconds % 3600) / 60);
                                                    const seconds = Math.floor(durationInSeconds % 60);
                                                    durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                                                    
                                                    serverLog(`📊 Durata ${fileName}: ${durationFormatted} (${duration}ms, ${frames} frames)`, 'debug');
                                                } catch (durErr) {
                                                    serverLog(`⚠️ Impossibile calcolare durata per ${fileName}: ${durErr.message}`, 'debug');
                                                }
                                            }
                                            
                                            mediaList.assets[category].push({
                                                name: fileName,
                                                path: `assets/${category}/${currentRelativePath}`,
                                                httpUrl: httpUrl,
                                                type: category,
                                                extension: fileExtension,
                                                size: fileStats.size,
                                                duration: duration, // Durata in millisecondi
                                                durationFormatted: durationFormatted, // Durata formattata HH:MM:SS
                                                frames: frames, // Numero di frames (assumendo 25fps)
                                                subfolder: relativePath || null
                                            });
                                        }
                                    } else if (item.isDirectory()) {
                                        // Ricorsione nelle sottocartelle
                                        await scanDirectoryRecursive(fullPath, currentRelativePath);
                                    }
                                }
                            };
                            
                            // Avvia scansione ricorsiva (ora asincrona)
                            await scanDirectoryRecursive(dirPath);
                            serverLog(`🔥 Assets scan: ${category} = ${mediaList.assets[category].length} files`, 'info');
                        } else {
                            serverLog(`⚠️ Assets directory non trovata: ${dirPath}`, 'warning');
                        }
                    } catch (scanError) {
                        serverLog(`❌ Errore scan ${category}: ${scanError.message}`, 'error');
                    }
                }
            }

            // 🔥 SCAN MEDIA E TEMPLATE CASPAR SERVER (CLS + TLS) se connesso
            let casparTemplateList = [];
            try {
                if (casparClientInstance && casparClientInstance.connected) {
                    // 🔥 SCAN MEDIA (CLS)
                    const casparMediaList = await casparClientInstance.getMediaList();
                    mediaList.caspar = casparMediaList || [];
                    serverLog(`🔥 CasparCG media scan: ${mediaList.caspar.length} files`, 'info');
                    
                    // 📊 DEBUG: Log durate estratte dal CLS
                    if (mediaList.caspar.length > 0 && typeof mediaList.caspar[0] === 'object') {
                        const sample = mediaList.caspar.slice(0, 3); // Mostra primi 3 per debug
                        sample.forEach(item => {
                            if (item.duration) {
                                serverLog(`📊 CLS DURATION: "${item.name}" = ${item.durationFormatted} (${item.duration}ms)`, 'info');
                            }
                        });
                    }
                    
                    // 🔥 SCAN TEMPLATE (TLS) - SEPARATO DAI MEDIA
                    try {
                        casparTemplateList = await casparClientInstance.getTemplateList();
                        serverLog(`🔥 CasparCG template scan: ${casparTemplateList.length} template`, 'info');
                    } catch (templateError) {
                        serverLog(`⚠️ Errore scan template CasparCG: ${templateError.message}`, 'warning');
                        casparTemplateList = [];
                    }
                }
            } catch (casparError) {
                serverLog(`⚠️ Errore scan CasparCG media: ${casparError.message}`, 'warning');
            }

            // 🔥 RESPONSE COMPLETA CON TEMPLATE SEPARATI
            callback({
                success: true,
                mediaList: mediaList,
                templateList: {
                    caspar: casparTemplateList || [], // 🔥 TEMPLATE REMOTI CASPARCG (TLS)
                    assets: mediaList.assets.templates || [] // Template locali da assets
                },
                baseUrls: {
                    assets: assetsConfig?.httpBaseUrl || 'http://100.64.211.9:5000/assets',
                    caspar: 'caspar://server' // URL simbolico per media CasparCG
                },
                endpoints: {
                    templates: `${assetsConfig?.httpBaseUrl || 'http://100.64.211.9:5000/assets'}/templates/`,
                    images: `${assetsConfig?.httpBaseUrl || 'http://100.64.211.9:5000/assets'}/images/`,
                    video: `${assetsConfig?.httpBaseUrl || 'http://100.64.211.9:5000/assets'}/video/`,
                    audio: `${assetsConfig?.httpBaseUrl || 'http://100.64.211.9:5000/assets'}/audio/`,
                    graphics: `${assetsConfig?.httpBaseUrl || 'http://100.64.211.9:5000/assets'}/graphics/`,
                    logos: `${assetsConfig?.httpBaseUrl || 'http://100.64.211.9:5000/assets'}/logos/`
                },
                supportedFormats: assetsConfig?.supportedFormats || {},
                totalFiles: {
                    assets: Object.values(mediaList.assets).reduce((acc, arr) => acc + arr.length, 0),
                    caspar: mediaList.caspar.length,
                    templates: {
                        caspar: casparTemplateList.length,
                        assets: mediaList.assets.templates ? mediaList.assets.templates.length : 0
                    }
                }
            });

        } catch (error) {
            serverLog(`❌ Errore devastante nella lista media: ${error.message}`, 'error');
            callback({ success: false, message: error.message });
        }
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
