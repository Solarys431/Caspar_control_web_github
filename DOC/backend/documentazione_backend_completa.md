# DOCUMENTAZIONE BACKEND COMPLETA - CasparCG Control Web

## INDICE
1. [Architettura Generale](#architettura-generale)
2. [File System e Struttura](#file-system-e-struttura)
3. [Server Principale](#server-principale)
4. [Client CasparCG (AMCP)](#client-casparcg-amcp)
5. [Client OSC](#client-osc)
6. [Profile Manager](#profile-manager)
7. [Sistema Socket.IO](#sistema-socketio)
8. [Integrazione Supabase](#integrazione-supabase)
9. [Configurazione e Deployment](#configurazione-e-deployment)
10. [Error Handling e Logging](#error-handling-e-logging)
11. [Troubleshooting](#troubleshooting)

---

## ARCHITETTURA GENERALE

### Stack Tecnologico
```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND REACT                         │
│              (client/ directory)                       │
└─────────────────┬───────────────────────────────────────┘
                  │ WebSocket (Socket.IO)
                  │ HTTP REST API
┌─────────────────▼───────────────────────────────────────┐
│                BACKEND NODE.JS                         │
│            Express + Socket.IO Server                  │
│                  (porta 5000)                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   AMCP      │  │     OSC      │  │   SUPABASE      │ │
│  │  Client     │  │   Client     │  │   DATABASE      │ │
│  │ (TCP 5250)  │  │ (UDP 6250)   │  │   & AUTH        │ │
│  └─────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              CASPARCG SERVER                            │
│        Media Playout & Graphics Engine                 │
└─────────────────────────────────────────────────────────┘
```

### Componenti Principali

#### 1. Server Express (server.js)
- **Porta**: 5000 (configurabile)
- **Middleware**: CORS, Morgan logging, JSON parsing
- **Real-time**: Socket.IO per comunicazione bidirezionale
- **Static serving**: File statici in produzione

#### 2. CasparClient (AMCP TCP)
- **Protocollo**: AMCP (Advanced Media Control Protocol)
- **Connessione**: TCP persistente sulla porta 5250
- **Funzioni**: Controllo playout, template graphics, mixer

#### 3. OscClient (OSC UDP)
- **Protocollo**: Open Sound Control
- **Connessione**: UDP sulla porta 6250 (ricezione)
- **Funzioni**: Real-time status, timecode, playback state

#### 4. ProfileManager
- **Database**: Supabase PostgreSQL
- **Funzioni**: Multi-server configuration, preview sessions
- **Caching**: Stato locale per performance

---

## FILE SYSTEM E STRUTTURA

### Directory Backend
```
server/
├── server.js              # Entry point principale (925 righe)
├── config.js              # Configurazione centralizzata (41 righe)
├── package.json           # Dipendenze e script
├── .env                   # Variabili d'ambiente (Supabase, config)
└── caspar/
    ├── casparClient.js    # Client AMCP TCP (654 righe)
    ├── oscClient.js       # Client OSC UDP (569 righe)
    └── profileManager.js  # Multi-server management (715 righe)
```

### Dipendenze Critiche
```json
{
  "express": "^4.18.2",           // Web framework
  "socket.io": "^4.6.1",         // Real-time WebSocket
  "@supabase/supabase-js": "^2.39.3", // Database + Auth
  "cors": "^2.8.5",              // Cross-origin requests
  "morgan": "^1.10.0",           // HTTP request logging
  "osc": "^2.4.4",               // OSC protocol support
  "dotenv": "^16.0.3",           // Environment variables
  "hls.js": "^1.6.2",           // HTTP Live Streaming
  "sdp-transform": "^2.14.1"     // SDP protocol parsing
}
```

---

## SERVER PRINCIPALE

### Configurazione Base (config.js)
```javascript
const config = {
  // Percorsi media CasparCG
  mediaPaths: [
    'E:\\progetti AI\\nebula test\\nebula-tutorial\\storage\\media',
    'E:\\progetti AI\\nebula test\\caspar_control\\media'
  ],
  
  // Percorso template CasparCG
  templatePath: 'template\\',
  
  // Configurazione server HTTP
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '100.74.188.128'
  },
  
  // Configurazione CasparCG di default
  caspar: {
    host: '100.74.188.128',
    port: 5250,
    autoReconnect: true,
    reconnectInterval: 10000,
    maxReconnectAttempts: 3,
    timeout: 15000
  }
};
```

### Inizializzazione Server (server.js)
```javascript
// Setup Express + Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware Stack
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(morgan('dev'));           // HTTP logging
app.use(express.json());          // JSON body parser
app.use(express.urlencoded({ extended: false }));

// Stato globale CasparCG
const casparState = {
    connected: false,
    host: config.caspar.host,
    port: config.caspar.port,
    serverVersion: null,
    channels: [],
    oscConnected: false
};

// Stato globale OSC per tutti i canali/layer
const oscState = {};
```

### Sistema di Logging
```javascript
function serverLog(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SERVER] [${level.toUpperCase()}] ${message}`);
    // Possibile invio real-time ai client via Socket.IO
    // io.emit('server:log', { timestamp, level, message });
}

// Livelli di log supportati:
// - 'trace': Dettagli massimi (OSC timecode, keep-alive)
// - 'debug': Informazioni sviluppo (comandi, risposte)
// - 'info': Informazioni normali (connessioni, eventi)
// - 'warning': Situazioni anomale non critiche
// - 'error': Errori che richiedono attenzione
```

### Gestione Stato OSC Real-time
```javascript
// Funzione per aggiornare lo stato OSC globale
const updateOscState = (channel, layer, type, data) => {
    const key = `${channel}-${layer}`;
    
    // Inizializza lo stato per questo canale/layer
    if (!oscState[key]) {
        oscState[key] = {};
    }
    
    // Aggiorna lo stato con i nuovi dati
    oscState[key][type] = data;
    
    // Emetti lo stato aggiornato via Socket.IO
    if (io) {
        io.emit('osc:state', { key, state: oscState[key] });
        io.emit(`osc:state:${key}`, oscState[key]);
    }
};
```

---

## CLIENT CASPARCG (AMCP)

### Architettura Client TCP
```javascript
class CasparClient extends EventEmitter {
    constructor(options = {}) {
        super();
        this.host = options.host || '100.74.188.128';
        this.port = options.port || 5250;
        this.connectionTimeout = options.timeout || 15000;
        this.commandTimeout = options.commandTimeout || 10000;
        this.autoReconnect = options.autoReconnect !== undefined ? options.autoReconnect : true;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.keepAliveInterval = options.keepAliveInterval || 8000;

        // Stato connessione
        this.connected = false;
        this.socket = null;
        this.buffer = '';
        
        // Sistema comandi con coda
        this.commandQueue = [];
        this.currentCommand = null;
        
        // Sistema riconnessione automatica
        this.reconnectAttemptsCount = 0;
        this.reconnectTimerId = null;
        this.keepAliveTimerId = null;
        this.isManuallyDisconnected = false;
        this.isConnecting = false;
    }
}
```

### Gestione Connessione TCP
```javascript
connect() {
    return new Promise((resolve, reject) => {
        this.cleanupSocket();
        this.socket = new net.Socket();

        // Timeout connessione
        const connTimeoutId = setTimeout(() => {
            this._log(`Timeout connessione dopo ${this.connectionTimeout}ms.`, 'error');
            if (this.socket) this.socket.destroy();
            reject(new Error('Timeout durante il tentativo di connessione'));
        }, this.connectionTimeout);

        // Eventi socket TCP
        this.socket.once('connect', () => {
            clearTimeout(connTimeoutId);
            this.isConnecting = false;
            this.connected = true;
            this.reconnectAttemptsCount = 0;
            this.emit('connected');
            this.startKeepAlive();
            this.processCommandQueue();
            resolve('Connesso a CasparCG');
        });

        this.socket.on('data', (data) => {
            this.buffer += data.toString('utf8');
            this.tryProcessBuffer();
        });

        this.socket.once('close', (hadError) => {
            this.handleDisconnect(hadError ? new Error('Socket TCP chiuso con errore') : null);
        });

        this.socket.once('error', (err) => {
            this.handleDisconnect(err);
            if (!this.connected) reject(err);
        });

        this.socket.connect({ port: this.port, host: this.host });
    });
}
```

### Sistema Parsing Risposte AMCP
```javascript
tryProcessBuffer() {
    let eolIndex;
    while ((eolIndex = this.buffer.indexOf('\r\n')) !== -1) {
        const line = this.buffer.substring(0, eolIndex);
        this.buffer = this.buffer.substring(eolIndex + 2);
        
        const trimmedLine = line.trim();
        
        if (!this.currentCommand) {
            // Gestione messaggi INFO spontanei
            if (trimmedLine.startsWith("INFO") || trimmedLine.match(/^\d{3}\s+INFO/i)) {
                this.emit('info', trimmedLine);
            }
            continue;
        }

        const { resolve, reject, command, isMultiline } = this.currentCommand;
        this.currentCommand.linesBuffer = this.currentCommand.linesBuffer || [];

        // Parsing codice stato AMCP
        let statusCode = 0;
        const matchStatus = trimmedLine.match(/^(\d{3})/);
        if (matchStatus) {
            statusCode = parseInt(matchStatus[1], 10);
        }

        // Gestione errori immediata (4xx status codes)
        if (statusCode >= 400) {
            clearTimeout(this.currentCommand.timeoutId);
            this.currentCommand.linesBuffer.push(line);
            reject(new Error(this.currentCommand.linesBuffer.join('\r\n')));
            this.currentCommand = null;
            this.processCommandQueue();
            continue;
        }

        // Gestione comandi multilinea (CLS, TLS, VERSION, INFO, HELP)
        if (isMultiline) {
            this._processMultilineResponse(line, trimmedLine, statusCode);
        } else {
            // Comando singola linea
            clearTimeout(this.currentCommand.timeoutId);
            if (statusCode >= 200 && statusCode < 300 && trimmedLine.includes("OK")) {
                resolve(trimmedLine);
            } else {
                reject(new Error(trimmedLine));
            }
            this.currentCommand = null;
            this.processCommandQueue();
        }
    }
}
```

### Coda Comandi con Timeout
```javascript
sendCommand(commandString) {
    return new Promise((resolve, reject) => {
        if (!this.connected && !this.autoReconnect && !this.isConnecting) {
            return reject(new Error('Non connesso a CasparCG e riconnessione automatica disabilitata.'));
        }

        const commandObj = {
            command: commandString,
            resolve,
            reject,
            isMultiline: this._isMultilineCommand(commandString),
            linesBuffer: [],
            statusReceived: false,
            dataLinesStarted: false,
            timeoutId: null
        };

        this.commandQueue.push(commandObj);
        this.processCommandQueue();
    });
}

processCommandQueue() {
    if (this.currentCommand || this.commandQueue.length === 0) return;
    if (!this.connected || !this.socket || this.socket.destroyed) return;

    this.currentCommand = this.commandQueue.shift();
    const { command, reject } = this.currentCommand;

    // Timeout per singolo comando
    this.currentCommand.timeoutId = setTimeout(() => {
        if (this.currentCommand && this.currentCommand.command === command) {
            this.currentCommand.reject(new Error(`Timeout (${this.commandTimeout}ms) per il comando: ${command}`));
            this.currentCommand = null;
            this.processCommandQueue();
        }
    }, this.commandTimeout);

    // Invio comando via socket TCP
    this.socket.write(command + '\r\n', 'utf8', (err) => {
        if (err) {
            clearTimeout(this.currentCommand.timeoutId);
            if (reject) reject(err);
            this.currentCommand = null;
            this.processCommandQueue();
        }
    });
}
```

### Metodi Controllo CasparCG
```javascript
// Controllo Media
play(channel, layer, clip, options = {}) {
    let command = `PLAY ${channel}-${layer} "${clip.replace(/"/g, '\\"')}"`;
    if (options.loop) command += " LOOP";
    return this.sendCommand(command);
}

pause(channel, layer) {
    return this.sendCommand(`PAUSE ${channel}-${layer}`);
}

resume(channel, layer) {
    return this.sendCommand(`RESUME ${channel}-${layer}`);
}

stop(channel, layer) {
    return this.sendCommand(`STOP ${channel}-${layer}`);
}

loadbg(channel, layer, clip, options = {}) {
    let command = `LOADBG ${channel}-${layer} "${clip.replace(/"/g, '\\"')}"`;
    if (options.loop) command += " LOOP";
    if (options.auto) command += " AUTO";
    return this.sendCommand(command);
}

clear(channel, layer) {
    return this.sendCommand(`CLEAR ${channel}-${layer}`);
}

// Controllo Template CG
cgAdd(channel, layer, cgLayer, template, playOnLoad = true, data = null) {
    let dataString;
    
    if (data && (typeof data === 'object' ? Object.keys(data).length > 0 : typeof data === 'string' && data.length > 0)) {
        try {
            const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
            dataString = jsonData.replace(/"/g, '\\"');
        } catch (e) { 
            dataString = '{}'; 
        }
    } else {
        dataString = '{}';
    }
    
    let command = `CG ${channel}-${layer} ADD ${cgLayer} "${template.replace(/"/g, '\\"')}" ${playOnLoad ? 1 : 0} "${dataString}"`;
    return this.sendCommand(command);
}

cgUpdate(channel, layer, cgLayer, data) {
    let dataString;
    
    if (data && (typeof data === 'object' ? Object.keys(data).length > 0 : typeof data === 'string' && data.length > 0)) {
        try {
            const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
            dataString = jsonData.replace(/"/g, '\\"');
        } catch (e) {
            return Promise.reject(new Error("Errore dati JSON per CG UPDATE"));
        }
    } else {
        dataString = '{}';
    }
    
    let command = `CG ${channel}-${layer} UPDATE ${cgLayer} "${dataString}"`;
    return this.sendCommand(command);
}

// Controllo Mixer
mixer(channel, layer, property, value, duration = 0, tween = 'linear') {
    let command = `MIXER ${channel}-${layer} ${property.toUpperCase()}`;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        command += ` ${value.x || 0} ${value.y || 0} ${value.width || 0} ${value.height || 0}`;
    } else if (Array.isArray(value)) {
        command += ` ${value.join(' ')}`;
    } else {
        command += ` ${value}`;
    }
    
    if (duration > 0) {
        command += ` ${duration} ${tween.toUpperCase()}`;
    }
    
    return this.sendCommand(command);
}
```

### Sistema Keep-Alive
```javascript
startKeepAlive() {
    this.stopKeepAlive();
    if (this.keepAliveInterval <= 0) return;
    
    this.keepAliveTimerId = setInterval(async () => {
        if (this.connected && this.socket && !this.socket.destroyed && !this.currentCommand) {
            try {
                await this.sendCommand('VERSION');
            } catch (error) {
                this._log(`Errore keep-alive VERSION: ${error.message}`, 'warning');
            }
        }
    }, this.keepAliveInterval);
}
```

---

## CLIENT OSC

### Architettura Client UDP
```javascript
class OscClient extends EventEmitter {
    constructor(options = {}) {
        super();
        this.host = options.host || '100.74.188.128';
        this.port = options.port || 6250; // Porta OSC CasparCG
        this.localPort = options.localPort || 5253; // Porta locale ricezione
        
        // Sistema riconnessione
        this.autoReconnect = options.autoReconnect !== undefined ? options.autoReconnect : true;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;

        // Stato connessione
        this.connected = false;
        this.udpPort = null;
        
        // Sistema throttling messaggi OSC
        this.lastMessageTimes = {};
        this.lastMessageValues = {};
        this.throttleIntervals = {
            'default': 2000,    // 2 secondi default
            'time': 500,        // Timecode ogni 500ms
            'frame': 1000,      // Frame ogni secondo
            'paused': 10000,    // Stato pausa ogni 10 secondi
            'producer': 5000,   // Stato producer ogni 5 secondi
            'length': 10000,    // Lunghezza file raramente cambia
            'path': 10000       // Percorso file raramente cambia
        };

        // Filtri messaggi per priorità canali
        this.messageFilters = {
            channelPriority: {
                '3': 10,  // Canale 3 (preview) massima priorità
                '1': 5,   // Canale 1 priorità media
                '2': 5    // Canale 2 priorità media
            },
            priorityThreshold: 0
        };
    }
}
```

### Connessione UDP OSC
```javascript
connect() {
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
                this.emit('connected');
                resolve('Connesso a CasparCG OSC');
            });

            // Gestione messaggi OSC in entrata
            this.udpPort.on('message', (oscMsg, timeTag, info) => {
                if (!this._shouldProcessOscMessage(oscMsg)) return;
                
                this.emit('message', oscMsg);
                this._processOscMessage(oscMsg);
            });

            this.udpPort.on('error', (err) => {
                this.handleDisconnect(err);
                reject(err);
            });

            this.udpPort.open();
        } catch (err) {
            reject(err);
        }
    });
}
```

### Sistema Throttling OSC
```javascript
_shouldThrottle(address, channel, layer) {
    // Non throttling per messaggi di controllo
    if (address.includes('/control/')) {
        return false;
    }

    const now = Date.now();
    const messageType = this._getMessageType(address);
    const key = `${channel}-${layer}-${messageType}`;

    // Ottieni intervallo throttling per tipo messaggio
    const throttleInterval = this.throttleIntervals[messageType] || this.throttleIntervals.default;

    // Verifica tempo trascorso dall'ultimo messaggio
    const lastTime = this.lastMessageTimes[key] || 0;
    const shouldThrottle = (now - lastTime) < throttleInterval;

    // Aggiorna timestamp se non throttled
    if (!shouldThrottle) {
        this.lastMessageTimes[key] = now;
    }

    return shouldThrottle;
}

_getMessageType(address) {
    if (address.includes('/file/time')) return 'time';
    if (address.includes('/file/frame')) return 'frame';
    if (address.includes('/file/length')) return 'length';
    if (address.includes('/file/path')) return 'path';
    if (address.includes('/paused')) return 'paused';
    if (address.includes('/producer')) return 'producer';
    return 'default';
}
```

### Processing Messaggi OSC
```javascript
_processOscMessage(oscMsg) {
    try {
        // Estrai canale e layer da indirizzo OSC
        // Formato: /channel/1/stage/layer/10/file/time
        const addressParts = oscMsg.address.split('/');
        const channelIndex = addressParts.indexOf('channel');
        const layerIndex = addressParts.indexOf('layer');

        if (channelIndex === -1 || layerIndex === -1) return;

        const channel = addressParts[channelIndex + 1];
        const layer = addressParts[layerIndex + 1];
        const key = `${channel}-${layer}`;

        // Verifica argomenti validi
        if (!oscMsg.args || oscMsg.args.length === 0 || oscMsg.args[0] === undefined) {
            return;
        }

        // Processing per tipo di messaggio OSC
        if (oscMsg.address.includes('/file/time')) {
            const time = oscMsg.args[0].value;
            
            // Converti tempo in timecode HH:MM:SS:FF
            let timecode = time;
            if (typeof time === 'number') {
                const totalSeconds = Math.floor(time);
                const frames = Math.round((time - totalSeconds) * 25); // 25 fps
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                timecode = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
            }

            this.emit('timecode', { channel, layer, time: timecode, rawTime: time });
            this.emit(`timecode:${key}`, { channel, layer, time: timecode, rawTime: time });
            
        } else if (oscMsg.address.includes('/file/frame')) {
            const frame = oscMsg.args[0].value;
            this.emit('frame', { channel, layer, frame });
            this.emit(`frame:${key}`, { channel, layer, frame });
            
        } else if (oscMsg.address.includes('/file/length')) {
            const length = oscMsg.args[0].value;
            
            // Converti frames in timecode
            const fps = 25;
            const totalSeconds = Math.floor(length / fps);
            const frames = length % fps;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            const timecode = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;

            this.emit('length', { channel, layer, length, timecode });
            this.emit(`length:${key}`, { channel, layer, length, timecode });
            
        } else if (oscMsg.address.includes('/file/path')) {
            const path = oscMsg.args[0].value;
            this.emit('path', { channel, layer, path });
            this.emit(`path:${key}`, { channel, layer, path });
            
        } else if (oscMsg.address.includes('/paused')) {
            const paused = oscMsg.args[0].value === 1;
            this.emit('paused', { channel, layer, paused });
            this.emit(`paused:${key}`, { channel, layer, paused });
            
        } else if (oscMsg.address.includes('/loop')) {
            const loop = oscMsg.args[0].value === 1;
            this.emit('loop', { channel, layer, loop });
            this.emit(`loop:${key}`, { channel, layer, loop });
        }
    } catch (error) {
        this._log(`Errore processing messaggio OSC: ${error.message}`, 'error');
    }
}
```

---

## PROFILE MANAGER

### Architettura Multi-Server
```javascript
// Stato profili e connessioni
const profileState = {
  profiles: [],           // Profili CasparCG da Supabase
  servers: [],            // Server CasparCG configurati
  assignments: [],        // Assegnazioni server-profilo-ruolo
  connections: {},        // Connessioni AMCP attive
  oscConnections: {},     // Connessioni OSC attive
  previewSessions: {}     // Sessioni preview attive
};
```

### Integrazione Supabase
```javascript
// Inizializzazione client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// Caricamento dati con fallback
async function loadProfiles() {
    if (!supabase) {
        // Usa dati di esempio se Supabase non disponibile
        profileState.profiles = [
            {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Profilo Predefinito',
                description: 'Profilo predefinito per CasparCG',
                is_default_profile: true
            }
        ];
        return;
    }

    // Carica da Supabase usando RPC per bypassare RLS
    const { data, error } = await supabase.rpc('get_all_casparcg_profiles');
    if (error) throw error;
    
    profileState.profiles = data || [];
}
```

### Sistema Preview Sessions
```javascript
const previewSessionManager = {
    sessions: {},
    sessionCounter: 0,

    // Crea sessione preview
    async createSession(profileId) {
        // Ottieni server preview per profilo
        const previewServerInfo = getServerByProfileAndRole(profileId, 'PREVIEW_POOL');
        if (!previewServerInfo) {
            throw new Error(`Nessun server di preview per profilo ${profileId}.`);
        }

        const { server, assignment } = previewServerInfo;
        const config = assignment.config_details || {};

        // Connetti a server se necessario
        const connectionResult = await connectToServer(server.id);
        if (!connectionResult.success) {
            throw new Error(`Impossibile connettersi al server preview: ${connectionResult.message}`);
        }

        // Genera ID sessione e alloca layer
        const sessionId = this.generateSessionId();
        const previewChannel = config.preview_channel || 3;
        const layerStart = config.preview_layer_start || 100;
        const numLayers = config.num_preview_layers || 5;

        // Trova layer disponibile
        let availableLayer = null;
        const usedLayers = new Set();

        Object.values(this.sessions).forEach(session => {
            if (session.profileId === profileId && session.channel === previewChannel) {
                usedLayers.add(session.layer);
            }
        });

        for (let i = 0; i < numLayers; i++) {
            const layer = layerStart + i;
            if (!usedLayers.has(layer)) {
                availableLayer = layer;
                break;
            }
        }

        if (availableLayer === null) {
            throw new Error(`Nessun layer preview disponibile per profilo ${profileId}.`);
        }

        // Crea e salva sessione
        const session = {
            id: sessionId,
            profileId,
            serverId: server.id,
            server: { id: server.id, name: server.name, host: server.host, port: server.port },
            channel: previewChannel,
            layer: availableLayer,
            createdAt: new Date(),
            lastUsedAt: new Date()
        };

        this.sessions[sessionId] = session;
        return { success: true, session };
    },

    // Invia comando a sessione
    async sendCommand(sessionId, command) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Sessione preview ${sessionId} non trovata.`);
        }

        this.updateSessionActivity(sessionId);
        return await sendCommandToServer(session.serverId, command);
    },

    // Elimina sessione
    deleteSession(sessionId) {
        const session = this.getSession(sessionId);
        if (session) {
            // Pulisci layer CasparCG
            const { serverId, channel, layer } = session;
            if (profileState.connections[serverId]) {
                const command = `CLEAR ${channel}-${layer}`;
                sendCommandToServer(serverId, command)
                    .catch(error => log(`Errore pulizia layer per sessione ${sessionId}: ${error.message}`, 'error'));
            }

            delete this.sessions[sessionId];
            return true;
        }
        return false;
    }
};
```

---

## SISTEMA SOCKET.IO

### Eventi Client → Server

#### Connessione e Stato
```javascript
// Richiesta stato CasparCG
socket.on('caspar:status:request', () => {
    socket.emit('caspar:status', {
        connected: casparState.connected,
        host: casparState.host,
        port: casparState.port,
        version: casparState.serverVersion,
        oscConnected: casparState.oscConnected
    });
});

// Connessione diretta a CasparCG
socket.on('caspar:connect', async (data) => {
    const { host, port } = data;
    if (!host || !port) {
        return io.emit('caspar:error', { message: 'Host e porta richiesti.' });
    }
    
    io.emit('caspar:loading', true);
    try {
        await initCasparClient(host, parseInt(port));
    } catch (error) {
        // Errore già gestito da initCasparClient
    }
});

// Disconnessione da CasparCG
socket.on('caspar:disconnect', () => {
    if (casparClientInstance && casparState.connected) {
        io.emit('caspar:loading', true);
        casparClientInstance.disconnect();
    } else {
        socket.emit('caspar:disconnected', {reason: 'Nessuna connessione attiva da chiudere.'});
    }
});
```

#### Comandi CasparCG
```javascript
// Comando AMCP generico
socket.on('caspar:command', async (data, callback) => {
    const commandString = data.command;
    
    if (typeof commandString !== 'string' || commandString.trim() === '') {
        if (typeof callback === 'function') {
            callback({ success: false, message: 'Comando AMCP non valido.' });
        }
        return;
    }

    // Log con livello ridotto per comandi frequenti
    const logLevel = (commandString === 'CLS' || commandString === 'TLS') ? 'trace' : 'debug';
    serverLog(`Comando "${commandString}" da ${socket.id}`, logLevel);

    // Priorità alta per comandi controllo
    const isControlCommand = commandString.startsWith('PLAY') ||
                            commandString.startsWith('PAUSE') ||
                            commandString.startsWith('RESUME') ||
                            commandString.startsWith('STOP') ||
                            commandString.startsWith('CLEAR');

    if (isControlCommand) {
        serverLog(`Comando controllo prioritario: "${commandString}"`, 'info');
    }

    const result = await sendCommandToCaspar(commandString);
    if (typeof callback === 'function') callback(result);
});

// Comandi controllo con parametri strutturati
socket.on('caspar:control', async (data, callback) => {
    const { command, channel, layer, clip, options } = data;

    if (!command || !channel || !layer) {
        if (typeof callback === 'function') {
            callback({ success: false, message: 'Parametri comando non validi.' });
        }
        return;
    }

    try {
        let result;
        switch (command.toUpperCase()) {
            case 'PLAY':
                if (!clip) throw new Error('Clip richiesta per comando PLAY');
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
                if (!clip) throw new Error('Clip richiesta per comando LOADBG');
                result = await casparClientInstance.loadbg(channel, layer, clip, options || {});
                break;
            default:
                throw new Error(`Comando controllo non supportato: ${command}`);
        }

        if (typeof callback === 'function') {
            callback({ success: true, response: result });
        }
    } catch (err) {
        serverLog(`Errore comando controllo "${command}": ${err.message}`, 'error');
        if (typeof callback === 'function') {
            callback({ success: false, message: err.message });
        }
    }
});
```

#### Gestione Profili
```javascript
// Lista profili CasparCG
socket.on('profiles:list', async (callback) => {
    try {
        const profiles = profileManager.profileState.profiles;
        callback({ success: true, profiles });
    } catch (error) {
        callback({ success: false, message: error.message });
    }
});

// Lista server CasparCG
socket.on('profiles:servers', async (callback) => {
    try {
        const servers = profileManager.profileState.servers;
        callback({ success: true, servers });
    } catch (error) {
        callback({ success: false, message: error.message });
    }
});

// Assegnazioni server per profilo
socket.on('profiles:assignments', async (data, callback) => {
    try {
        const { profileId } = data;
        const assignments = profileManager.getAssignmentsByProfileId(profileId);
        
        // Arricchisci con dettagli server
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
        callback({ success: false, message: error.message });
    }
});

// Connessione tramite profilo
socket.on('caspar:connect:profile', async (data, callback) => {
    try {
        const { profileId, serverRole } = data;
        
        if (!profileId) throw new Error('ID profilo richiesto.');
        if (!serverRole) throw new Error('Ruolo server richiesto.');

        // Ottieni server per profilo e ruolo
        const serverInfo = profileManager.getServerByProfileAndRole(profileId, serverRole);
        if (!serverInfo) {
            throw new Error(`Nessun server trovato per profilo ${profileId} con ruolo ${serverRole}.`);
        }

        const { server } = serverInfo;

        if (!server.is_enabled) {
            throw new Error(`Server ${server.name} non è abilitato.`);
        }

        io.emit('caspar:loading', true);
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
        serverLog(`Errore connessione tramite profilo: ${error.message}`, 'error');
        io.emit('caspar:error', { message: error.message });
        io.emit('caspar:loading', false);

        if (typeof callback === 'function') {
            callback({ success: false, message: error.message });
        }
    }
});
```

#### Sessioni Preview
```javascript
// Richiesta sessione preview
socket.on('preview:request_session', async (data, callback) => {
    try {
        const { profileId } = data;
        
        if (!profileId) throw new Error('ID profilo richiesto.');

        const result = await profileManager.previewSessionManager.createSession(profileId);
        if (!result.success) throw new Error(result.message);

        const { session } = result;
        session.socketId = socket.id; // Associa al socket corrente

        callback({
            success: true,
            sessionId: session.id,
            server: session.server,
            channel: session.channel,
            layer: session.layer
        });
    } catch (error) {
        callback({ success: false, message: error.message });
    }
});

// Comando a sessione preview
socket.on('preview:command', async (data, callback) => {
    try {
        const { sessionId, command } = data;
        
        if (!sessionId) throw new Error('ID sessione richiesto.');
        if (!command) throw new Error('Comando richiesto.');

        const result = await profileManager.previewSessionManager.sendCommand(sessionId, command);
        callback(result);
    } catch (error) {
        callback({ success: false, message: error.message });
    }
});

// Rilascio sessione preview
socket.on('preview:release_session', async (data, callback) => {
    try {
        const { sessionId } = data;
        
        if (!sessionId) throw new Error('ID sessione richiesto.');

        const result = profileManager.previewSessionManager.deleteSession(sessionId);
        callback({ success: true, released: result });
    } catch (error) {
        callback({ success: false, message: error.message });
    }
});
```

#### Template Manifest
```javascript
// Recupero manifest template
socket.on('get_template_manifest', (templateName, callback) => {
    if (typeof callback !== 'function') {
        serverLog("Callback non fornita per get_template_manifest.", "warning");
        return;
    }
    
    if (!templateName || typeof templateName !== 'string') {
        return callback({ error: 'Nome del template non fornito o non valido.' });
    }

    // Costruisci percorso manifest con protezione path traversal
    const manifestFileName = `${templateName}.manifest.json`;
    const manifestPath = path.resolve(CASPARCG_TEMPLATE_PATH, manifestFileName);

    // Verifica sicurezza percorso
    if (!manifestPath.startsWith(path.resolve(CASPARCG_TEMPLATE_PATH))) {
        return callback({ error: 'Accesso al percorso manifest non valido.' });
    }

    fs.readFile(manifestPath, 'utf8', (err, fileContent) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return callback({ data: null }); // Template senza manifest è normale
            }
            return callback({ error: `Errore lettura file manifest: ${err.message}` });
        }

        try {
            const manifestData = JSON.parse(fileContent);
            callback({ data: manifestData });
        } catch (parseError) {
            callback({ error: `Errore parsing JSON del manifest: ${parseError.message}` });
        }
    });
});
```

### Eventi Server → Client

#### Eventi Connessione CasparCG
```javascript
// Stato connessione
io.emit('caspar:connected', { host, port });
io.emit('caspar:disconnected', { reason });
io.emit('caspar:error', { message });
io.emit('caspar:loading', true/false);

// Log e informazioni
io.emit('caspar:log', { message });
io.emit('caspar:reconnect_failed');
```

#### Eventi OSC Real-time
```javascript
// Dati OSC specifici
io.emit('osc:timecode', { channel, layer, time, rawTime });
io.emit('osc:frame', { channel, layer, frame });
io.emit('osc:fps', { channel, layer, fps });
io.emit('osc:path', { channel, layer, path });
io.emit('osc:length', { channel, layer, length, timecode });
io.emit('osc:paused', { channel, layer, paused });
io.emit('osc:loop', { channel, layer, loop });

// Eventi specifici per canale/layer
io.emit(`osc:timecode:${channel}-${layer}`, data);
io.emit(`osc:frame:${channel}-${layer}`, data);
// ... altri eventi specifici

// Stato OSC globale
io.emit('osc:state', { key, state });
io.emit('osc:state:all', filteredState);

// Connessione OSC
io.emit('osc:connected', { host });
io.emit('osc:disconnected', { reason });
io.emit('osc:error', { message });
```

#### Eventi Server
```javascript
// Log server (opzionale)
io.emit('server:log', { timestamp, level, message });
```

---

## INTEGRAZIONE SUPABASE

### Configurazione Database
```javascript
// Variabili d'ambiente
SUPABASE_URL=https://wkqhkxzzozgxwkvrindq.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Inizializzazione client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,  // Disabilita refresh automatico
    persistSession: false     // Non persistere sessioni
  }
});
```

### Schema Database Principale
```sql
-- Profili CasparCG
CREATE TABLE casparcg_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    is_default_profile boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    owner_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Server CasparCG
CREATE TABLE casparcg_servers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    host text NOT NULL,
    port integer DEFAULT 5250,
    purpose text, -- 'playout', 'preview', 'backup'
    is_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Assegnazioni server-profilo
CREATE TABLE profile_server_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid REFERENCES casparcg_profiles(id) ON DELETE CASCADE,
    server_id uuid REFERENCES casparcg_servers(id) ON DELETE CASCADE,
    server_role_in_profile text NOT NULL, -- 'MAIN_PLAYOUT', 'PREVIEW_POOL', etc.
    config_details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    UNIQUE(profile_id, server_role_in_profile)
);

-- Rundown
CREATE TABLE rundowns (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    owner_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Elementi rundown
CREATE TABLE rundown_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rundown_id uuid REFERENCES rundowns(id) ON DELETE CASCADE NOT NULL,
    item_order integer NOT NULL,
    type text NOT NULL, -- 'MEDIA', 'TEMPLATE', 'STORY'
    name text,
    data jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);
```

### Funzioni RPC Bypass RLS
```sql
-- Funzione per ottenere tutti i profili (bypass RLS)
CREATE OR REPLACE FUNCTION get_all_casparcg_profiles()
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    is_default_profile boolean,
    created_at timestamptz,
    updated_at timestamptz,
    owner_id uuid
) SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
    SELECT p.id, p.name, p.description, p.is_default_profile, 
           p.created_at, p.updated_at, p.owner_id
    FROM casparcg_profiles p;
$$;

-- Funzione per ottenere tutti i server (bypass RLS)
CREATE OR REPLACE FUNCTION get_all_casparcg_servers()
RETURNS TABLE (
    id uuid,
    name text,
    host text,
    port integer,
    purpose text,
    is_enabled boolean,
    created_at timestamptz,
    updated_at timestamptz
) SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
    SELECT s.id, s.name, s.host, s.port, s.purpose, s.is_enabled,
           s.created_at, s.updated_at
    FROM casparcg_servers s;
$$;

-- Funzione per assegnazioni (bypass RLS)
CREATE OR REPLACE FUNCTION get_all_profile_server_assignments()
RETURNS TABLE (
    id uuid,
    profile_id uuid,
    server_id uuid,
    server_role_in_profile text,
    config_details jsonb,
    created_at timestamptz
) SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
    SELECT a.id, a.profile_id, a.server_id, a.server_role_in_profile,
           a.config_details, a.created_at
    FROM profile_server_assignments a;
$$;
```

### Gestione Dati con Fallback
```javascript
async function loadProfiles() {
    try {
        if (!supabase) {
            // Fallback a dati di esempio
            profileState.profiles = [
                {
                    id: '00000000-0000-0000-0000-000000000001',
                    name: 'Profilo Predefinito',
                    description: 'Profilo predefinito per CasparCG',
                    is_default_profile: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            return;
        }

        // Query con test diagnostici
        log('TEST: Verifica connessione Supabase...', 'debug');
        
        // Test connettività
        const testResult = await supabase.from('casparcg_profiles').select('count', { count: 'exact', head: true });
        log(`TEST: Risultato query count: ${JSON.stringify(testResult)}`, 'debug');

        // Query principale usando RPC
        const { data, error } = await supabase.rpc('get_all_casparcg_profiles');
        
        if (error) {
            log(`Errore query profili: ${JSON.stringify(error)}`, 'error');
            throw error;
        }

        profileState.profiles = data || [];
        log(`Caricati ${profileState.profiles.length} profili CasparCG.`);
        
    } catch (error) {
        log(`Errore caricamento profili: ${error.message}`, 'error');
        throw error;
    }
}
```

---

## CONFIGURAZIONE E DEPLOYMENT

### Variabili d'Ambiente (.env)
```bash
# Applicazione
REACT_APP_NAME=CasparCG Control Web
REACT_APP_VERSION=1.0.0
REACT_APP_API_URL=http://localhost:5000
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true

# Supabase Frontend
REACT_APP_SUPABASE_URL=https://wkqhkxzzozgxwkvrindq.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Backend
SUPABASE_URL=https://wkqhkxzzozgxwkvrindq.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration (opzionale)
PORT=5000
HOST=100.74.188.128
CLIENT_URL=http://localhost:3000
```

### Script Package.json
```json
{
  "scripts": {
    "start": "node server.js",           // Produzione
    "start:preview": "node server.js",   // Con preview abilitato
    "dev": "nodemon server.js",          // Sviluppo con auto-reload
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### Configurazione Produzione
```javascript
// server.js - Setup file statici in produzione
if (process.env.NODE_ENV === 'production') {
    const staticPath = config.staticPath || path.join(__dirname, '..', 'client', 'build');
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
```

### Configurazione CasparCG Server
```xml
<!-- casparcg.config -->
<configuration>
  <paths>
    <media-path>E:\progetti AI\nebula test\nebula-tutorial\storage\media\</media-path>
    <media-path>E:\progetti AI\nebula test\caspar_control\media\</media-path>
    <template-path>template\</template-path>
  </paths>
  
  <channels>
    <channel>
      <video-mode>1080p25</video-mode>
      <consumers>
        <screen/>
      </consumers>
    </channel>
    <channel>
      <video-mode>1080p25</video-mode>
      <consumers>
        <screen/>
      </consumers>
    </channel>
    <channel>
      <video-mode>1080p25</video-mode>
      <consumers>
        <screen/>
      </consumers>
    </channel>
  </channels>
  
  <controllers>
    <tcp>
      <port>5250</port>
      <protocol>AMCP</protocol>
    </tcp>
  </controllers>
  
  <osc>
    <default-port>6250</default-port>
    <predefined-clients>
      <predefined-client>
        <address>100.74.188.128</address>
        <port>5253</port>
      </predefined-client>
    </predefined-clients>
  </osc>
</configuration>
```

---

## ERROR HANDLING E LOGGING

### Sistema Logging Centralizzato
```javascript
function serverLog(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SERVER] [${level.toUpperCase()}] ${message}`);
    
    // Opzionale: invio real-time ai client
    // if (io) {
    //     io.emit('server:log', { timestamp, level, message });
    // }
}

// Livelli logging supportati:
// - trace: Dettagli massimi (OSC timecode, keep-alive commands)
// - debug: Informazioni sviluppo (AMCP commands, responses) 
// - info: Informazioni normali (connessioni, eventi principali)
// - warning: Situazioni anomale non critiche
// - error: Errori che richiedono attenzione

// Esempi utilizzo:
serverLog('Server avviato sulla porta 5000', 'info');
serverLog(`Comando "${commandString}" da ${socket.id}`, 'debug');
serverLog(`OSC Timecode: ${channel}-${layer} = ${timecode}`, 'trace');
serverLog(`Errore connessione CasparCG: ${error.message}`, 'error');
```

### Error Handling CasparClient
```javascript
// Gestione errori connessione
casparClientInstance.on('error', (err) => {
    serverLog(`Errore client CasparCG: ${err.message}`, 'error');
    io.emit('caspar:error', { message: `Errore client CasparCG: ${err.message}` });
    io.emit('caspar:loading', false);
});

// Gestione disconnessioni
casparClientInstance.on('disconnected', (data) => {
    const reason = data && data.reason ? data.reason : 'Disconnessione da CasparCG';
    serverLog(reason, 'warning');
    casparState.connected = false;
    casparState.serverVersion = null;
    casparState.channels = [];
    io.emit('caspar:disconnected', { reason });
    io.emit('caspar:loading', false);
});

// Gestione timeout riconnessione
casparClientInstance.on('reconnect_failed', () => {
    serverLog('Tutti i tentativi di riconnessione a CasparCG falliti.', 'error');
    io.emit('caspar:reconnect_failed');
    casparState.connected = false;
    io.emit('caspar:loading', false);
});
```

### Error Handling Socket.IO
```javascript
// Gestione disconnessioni client
io.on('connection', (socket) => {
    socket.on('disconnect', (reason) => {
        serverLog(`Client Socket.IO disconnesso: ${socket.id}. Motivo: ${reason}`);
        
        // Pulizia sessioni preview associate
        Object.entries(profileManager.previewSessionManager.sessions).forEach(([sessionId, session]) => {
            if (session.socketId === socket.id) {
                serverLog(`Pulizia sessione preview ${sessionId} per socket disconnesso ${socket.id}...`);
                profileManager.previewSessionManager.deleteSession(sessionId);
            }
        });
    });
});

// Validazione input comandi
socket.on('caspar:command', async (data, callback) => {
    const commandString = data.command;
    
    if (typeof commandString !== 'string' || commandString.trim() === '') {
        serverLog(`Comando non valido da ${socket.id}: ${JSON.stringify(data)}`, 'warning');
        if (typeof callback === 'function') {
            callback({ success: false, message: 'Comando AMCP non valido.' });
        }
        return;
    }
    
    // Continua con elaborazione comando...
});
```

### Error Handling Supabase
```javascript
async function loadProfiles() {
    try {
        if (!supabase) {
            log('Client Supabase non inizializzato. Utilizzo dati di esempio.', 'warning');
            // Fallback a dati esempio...
            return;
        }

        // Test diagnostici connessione
        try {
            const testResult = await supabase.from('casparcg_profiles').select('count', { count: 'exact', head: true });
            log(`TEST: Risultato query count: ${JSON.stringify(testResult)}`, 'debug');
        } catch (testError) {
            log(`TEST: Errore query test: ${JSON.stringify(testError)}`, 'error');
        }

        // Query principale
        const { data, error } = await supabase.rpc('get_all_casparcg_profiles');
        
        if (error) {
            log(`Errore query profili: ${JSON.stringify(error)}`, 'error');
            throw error;
        }

        profileState.profiles = data || [];
        log(`Caricati ${profileState.profiles.length} profili CasparCG.`);
        
    } catch (error) {
        log(`Errore durante caricamento profili: ${error.message}`, 'error');
        log(`Stack trace: ${error.stack}`, 'error');
        throw error;
    }
}
```

### Graceful Shutdown
```javascript
// Gestione segnali sistema per shutdown pulito
process.on('SIGTERM', async () => {
    console.log('Ricevuto SIGTERM. Shutdown graceful in corso...');
    
    try {
        // Disconnetti da CasparCG
        if (casparClientInstance && casparState.connected) {
            await casparClientInstance.disconnect();
        }
        
        // Disconnetti OSC
        if (oscClientInstance && casparState.oscConnected) {
            await oscClientInstance.disconnect();
        }
        
        // Chiudi server HTTP
        server.close(() => {
            console.log('Server HTTP chiuso.');
            process.exit(0);
        });
        
        // Timeout forzato dopo 10 secondi
        setTimeout(() => {
            console.log('Timeout shutdown. Uscita forzata.');
            process.exit(1);
        }, 10000);
        
    } catch (error) {
        console.error('Errore durante shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', () => {
    console.log('Ricevuto SIGINT (Ctrl+C). Avvio shutdown...');
    process.emit('SIGTERM');
});

// Gestione eccezioni non catturate
process.on('uncaughtException', (error) => {
    console.error('Eccezione non catturata:', error);
    serverLog(`Eccezione non catturata: ${error.message}`, 'error');
    serverLog(`Stack: ${error.stack}`, 'error');
    
    // Tentativo shutdown graceful
    process.emit('SIGTERM');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejection non gestita:', promise, 'reason:', reason);
    serverLog(`Promise rejection non gestita: ${reason}`, 'error');
    
    // Tentativo shutdown graceful
    process.emit('SIGTERM');
});
```

---

## TROUBLESHOOTING

### Problemi Connessione CasparCG

#### 1. TCP Connection Failed
```bash
# Sintomi
[ERROR] Errore socket TCP: ECONNREFUSED
[ERROR] Timeout connessione dopo 15000ms

# Verifiche
1. CasparCG Server in esecuzione?
   > Verifica processo CasparCG.exe
   
2. Porta AMCP corretta?
   > Default: 5250, verificare casparcg.config
   
3. Firewall/Network?
   > telnet 100.74.188.128 5250
   
4. Configurazione host corretta?
   > Verificare config.js: caspar.host

# Soluzioni
- Riavviare CasparCG Server  
- Verificare casparcg.config: <tcp><port>5250</port></tcp>
- Controllare logs CasparCG per errori
```

#### 2. AMCP Commands Timeout
```bash
# Sintomi  
[ERROR] Timeout (10000ms) per il comando: PLAY 1-10 "video.mp4"

# Verifiche
1. Server sovraccarico?
   > Verificare CPU/memoria CasparCG
   
2. Comando malformato?
   > Verificare sintassi AMCP
   
3. File media esistente?
   > Verificare percorsi media in casparcg.config

# Soluzioni
- Aumentare commandTimeout in CasparClient
- Ottimizzare media (codec, risoluzione)
- Verificare percorsi media paths
```

### Problemi OSC

#### 1. OSC Messages Not Received
```bash
# Sintomi
[WARNING] Nessun messaggio OSC ricevuto da CasparCG

# Verifiche  
1. OSC abilitato in CasparCG?
   > Verificare <osc> in casparcg.config
   
2. Porta OSC corretta?
   > Default: 6250, verificare configurazione
   
3. Client IP in predefined-clients?
   > Aggiungere IP backend a casparcg.config

# Soluzioni
- Abilitare OSC: <osc><default-port>6250</default-port></osc>
- Aggiungere client: <predefined-client><address>IP_BACKEND</address><port>5253</port></predefined-client>
- Riavviare CasparCG dopo modifiche config
```

#### 2. OSC Flooding/Performance
```bash
# Sintomi
[TRACE] Centinaia di messaggi OSC al secondo
Performance frontend degradata

# Soluzioni in OscClient
- Aumentare throttleIntervals per ridurre frequenza
- Filtrare canali non prioritari
- Aumentare intervallo oscStateInterval da 5000ms

# Configurazione throttling
this.throttleIntervals = {
    'time': 1000,     // Era 500ms, aumentare per ridurre traffico
    'frame': 2000,    // Era 1000ms
    'paused': 30000   // Era 10000ms
};
```

### Problemi Supabase

#### 1. RLS Policy Errors
```bash
# Sintomi
[ERROR] Errore query profili: {"code":"42501","message":"new row violates row-level security policy"}

# Soluzioni
1. Usare funzioni RPC con SECURITY DEFINER
   > get_all_casparcg_profiles(), get_all_casparcg_servers()
   
2. Verificare service key ha privilegi
   > Usare SUPABASE_SERVICE_KEY non ANON_KEY
   
3. Aggiornare RLS policies per service role
```

#### 2. Connection Issues
```bash
# Sintomi
[ERROR] Client Supabase NON inizializzato - variabili d'ambiente mancanti

# Verifiche
1. File .env presente e caricato?
   > console.log(process.env.SUPABASE_URL)
   
2. Variabili corrette?
   > SUPABASE_URL e SUPABASE_SERVICE_KEY definite
   
3. dotenv.config() chiamato?
   > Prima delle import dei moduli

# Soluzioni  
- Creare/verificare .env
- Caricare dotenv prima di tutto: require('dotenv').config()
- Usare absolute path per .env se necessario
```

### Problemi Socket.IO

#### 1. CORS Issues
```bash
# Sintomi
Frontend: Access to XMLHttpRequest blocked by CORS policy

# Soluzioni
1. Configurare CORS server
   app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
   
2. Configurare Socket.IO CORS
   const io = socketIo(server, {
       cors: {
           origin: process.env.CLIENT_URL || "http://localhost:3000",
           methods: ["GET", "POST"]
       }
   });
   
3. Verificare CLIENT_URL in .env
```

#### 2. Connection Drops
```bash
# Sintomi
Client frontend perde connessione Socket.IO frequentemente

# Verifiche
1. Timeout configurazioni
   > Socket.IO timeout settings
   
2. Proxy/Load balancer issues
   > Verificare sticky sessions
   
3. Network stability
   > Ping test tra client/server

# Soluzioni
- Aumentare timeout Socket.IO
- Configurare reconnection automatica lato client
- Implementare heartbeat/ping custom
```

### Problemi Performance

#### 1. Memory Leaks
```bash
# Sintomi
Memoria Node.js cresce continuamente
Rallentamenti dopo ore di utilizzo

# Identificazione
- Monitorare process.memoryUsage()
- Verificare timer non puliti (setInterval, setTimeout)
- Check event listeners non rimossi

# Soluzioni
- Cleanup sessioni preview inattive (ogni 5 minuti)
- clearTimeout/clearInterval appropriati
- removeAllListeners() su disconnessioni
```

#### 2. CPU High Usage
```bash
# Sintomi
CPU backend costantemente alto (>50%)

# Cause comuni
1. OSC message flooding (troppi messaggi/secondo)
2. Log eccessivi (livello trace in produzione)  
3. JSON.stringify/parse ripetuti

# Soluzioni
- Aumentare throttling OSC
- Ridurre livello log a 'info' in produzione
- Caching per dati frequentemente acceduti
- Ottimizzare parsing buffer AMCP
```

#### 3. Network Bandwidth
```bash
# Sintomi
Latenza alta, messaggi Socket.IO in ritardo

# Ottimizzazioni
1. Ridurre frequenza stato OSC
   > oscStateInterval da 1000ms a 5000ms
   
2. Filtrare messaggi non necessari
   > Inviare solo canali attivi/prioritari
   
3. Compressione Socket.IO
   > compression: true nella configurazione
   
4. Batch updates
   > Raggruppare aggiornamenti simili
```

### Diagnostic Tools

#### 1. Log Analysis
```bash
# Comandi utili per analisi log
grep "ERROR" server.log | tail -20
grep "CasparCG" server.log | grep -v "TRACE"
grep "Socket.IO" server.log

# Monitoraggio real-time
tail -f server.log | grep -E "(ERROR|WARNING)"
```

#### 2. Network Testing
```bash
# Test connettività CasparCG AMCP
telnet 100.74.188.128 5250
> VERSION (inviare comando)

# Test UDP OSC (Linux/Mac)
nc -u 100.74.188.128 6250

# Monitor network traffic
netstat -an | grep 5250
netstat -an | grep 6250
```

#### 3. Performance Monitoring
```javascript
// Aggiungere a server.js per monitoring
setInterval(() => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    serverLog(`Memoria: RSS=${Math.round(memUsage.rss/1024/1024)}MB, Heap=${Math.round(memUsage.heapUsed/1024/1024)}MB`, 'debug');
    serverLog(`CPU: User=${cpuUsage.user}, System=${cpuUsage.system}`, 'debug');
    
    // Socket.IO connections count
    const socketCount = io.engine.clientsCount;
    serverLog(`Socket.IO connessioni attive: ${socketCount}`, 'debug');
    
    // Preview sessions attive
    const previewCount = Object.keys(profileManager.previewSessionManager.sessions).length;
    serverLog(`Sessioni preview attive: ${previewCount}`, 'debug');
    
}, 60000); // Ogni minuto
```

---

## CONCLUSIONI

Questa documentazione copre tutti gli aspetti critici del backend di CasparCG Control Web:

### **Punti di Forza Architettura**
- **Separazione responsabilità**: Client AMCP, OSC e ProfileManager distinti
- **Real-time**: Socket.IO per comunicazione bidirezionale efficiente  
- **Multi-server**: Sistema profili per gestione server multipli
- **Resilienza**: Riconnessione automatica e error recovery
- **Scalabilità**: Preview sessions e throttling OSC per performance

### **Aree Critiche Monitoraggio**
- **Connessioni TCP/UDP**: Stabilità collegamenti CasparCG
- **Memory management**: Pulizia sessioni e timer
- **OSC flooding**: Controllo traffico messaggi real-time
- **Database connectivity**: Fallback e error handling Supabase

### **Raccomandazioni Deployment**
- **Environment variables**: Configurazione corretta .env
- **Logging levels**: 'info' in produzione, 'debug' sviluppo
- **Resource monitoring**: CPU, memoria, connessioni rete
- **Backup strategy**: Database Supabase e configurazioni

La documentazione fornisce tutti gli strumenti necessari per comprendere, mantenere e estendere il backend broadcast-ready di CasparCG Control Web.