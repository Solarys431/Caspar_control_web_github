/**
 * Gestore dei profili CasparCG
 *
 * Questo modulo gestisce i profili di configurazione CasparCG,
 * le connessioni ai server e le sessioni di preview.
 */
const { createClient } = require('@supabase/supabase-js');
const CasparClient = require('./casparClient');
const OscClient = require('./oscClient');
const config = require('../config');

// Inizializza il client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Verifica che le variabili d'ambiente siano definite
if (!supabaseUrl || !supabaseKey) {
  console.error('Errore: Variabili d\'ambiente Supabase mancanti. Assicurati di aver definito SUPABASE_URL e SUPABASE_SERVICE_KEY nel file .env');
  // Non terminiamo il processo, ma logghiamo l'errore
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseKey ? 'Presente' : 'Mancante');
}

// Inizializza il client Supabase solo se le variabili d'ambiente sono definite
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// Log dello stato di inizializzazione Supabase
if (supabase) {
  console.log('[PROFILE_MANAGER] [INFO] Client Supabase inizializzato correttamente');
  console.log(`[PROFILE_MANAGER] [DEBUG] Supabase URL: ${supabaseUrl}`);
  console.log(`[PROFILE_MANAGER] [DEBUG] Service Key presente: ${supabaseKey ? 'SI' : 'NO'}`);
} else {
  console.log('[PROFILE_MANAGER] [WARNING] Client Supabase NON inizializzato - variabili d\'ambiente mancanti');
  console.log(`[PROFILE_MANAGER] [DEBUG] SUPABASE_URL: ${supabaseUrl || 'NON DEFINITA'}`);
  console.log(`[PROFILE_MANAGER] [DEBUG] SUPABASE_SERVICE_KEY: ${supabaseKey ? 'DEFINITA' : 'NON DEFINITA'}`);
}

// Stato dei profili e delle connessioni
const profileState = {
  profiles: [],
  servers: [],
  assignments: [],
  connections: {}, // Connessioni attive ai server CasparCG
  oscConnections: {}, // Connessioni OSC attive
  previewSessions: {} // Sessioni di preview attive
};

// Funzione per il logging
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [PROFILE_MANAGER] [${level.toUpperCase()}] ${message}`);
}

/**
 * Inizializza il gestore dei profili
 *
 * @returns {Promise<void>}
 */
async function initialize() {
  try {
    log('Inizializzazione del gestore dei profili CasparCG...');

    // Verifica che il client Supabase sia inizializzato
    if (!supabase) {
      log('Client Supabase non inizializzato. Utilizzo dati di esempio.', 'warning');

      // Utilizza dati di esempio
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

      profileState.servers = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Server Locale',
          host: 'localhost',
          port: 5250,
          purpose: 'playout',
          is_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      profileState.assignments = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          profile_id: '00000000-0000-0000-0000-000000000001',
          server_id: '00000000-0000-0000-0000-000000000001',
          server_role_in_profile: 'MAIN_PLAYOUT',
          config_details: {},
          created_at: new Date().toISOString()
        }
      ];

      log('Dati di esempio caricati con successo.');
      return;
    }

    // Carica i profili da Supabase
    await loadProfiles();

    // Carica i server da Supabase
    await loadServers();

    // Carica le assegnazioni da Supabase
    await loadAssignments();

    log('Gestore dei profili CasparCG inizializzato con successo.');
  } catch (error) {
    log(`Errore durante l'inizializzazione del gestore dei profili: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Carica i profili da Supabase
 *
 * @returns {Promise<void>}
 */
async function loadProfiles() {
  try {
    // Verifica che il client Supabase sia inizializzato
    if (!supabase) {
      log('Client Supabase non inizializzato. Impossibile caricare i profili.', 'warning');
      return;
    }

    log('Tentativo di caricamento profili da Supabase...', 'debug');

    // TEST DIAGNOSTICO: Verifica connessione Supabase
    try {
      log('TEST: Verifica connessione Supabase con query di test...', 'debug');

      // Test 1: Query count
      const testResult = await supabase.from('casparcg_profiles').select('count', { count: 'exact', head: true });
      log(`TEST 1: Risultato query count: ${JSON.stringify(testResult)}`, 'debug');

      // Test 2: Query semplice
      const simpleTest = await supabase.from('casparcg_profiles').select('id').limit(1);
      log(`TEST 2: Risultato query semplice: ${JSON.stringify(simpleTest)}`, 'debug');

      // Test 3: Verifica ruolo corrente
      const { data: roleData, error: roleError } = await supabase.rpc('auth.role');
      log(`TEST 3: Ruolo corrente - Data: ${JSON.stringify(roleData)}, Error: ${JSON.stringify(roleError)}`, 'debug');

    } catch (testError) {
      log(`TEST: Errore nella query di test: ${JSON.stringify(testError)}`, 'error');
    }

    // CORREZIONE: Usa funzione di sicurezza per bypassare problemi RLS
    const { data, error } = await supabase.rpc('get_all_casparcg_profiles');

    log(`Query profili completata. Data: ${data ? data.length : 'null'}, Error: ${error ? JSON.stringify(error) : 'null'}`, 'debug');

    if (error) {
      log(`Errore query profili: ${JSON.stringify(error)}`, 'error');
      throw error;
    }

    profileState.profiles = data || [];
    log(`Caricati ${profileState.profiles.length} profili CasparCG.`);

    if (profileState.profiles.length > 0) {
      log(`Primo profilo: ${JSON.stringify(profileState.profiles[0])}`, 'debug');
    } else {
      log('ATTENZIONE: Nessun profilo caricato nonostante query senza errori!', 'warning');
    }
  } catch (error) {
    log(`Errore durante il caricamento dei profili: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
    throw error;
  }
}

/**
 * Carica i server da Supabase
 *
 * @returns {Promise<void>}
 */
async function loadServers() {
  try {
    // Verifica che il client Supabase sia inizializzato
    if (!supabase) {
      log('Client Supabase non inizializzato. Impossibile caricare i server.', 'warning');
      return;
    }

    log('Tentativo di caricamento server da Supabase...', 'debug');

    // CORREZIONE: Usa funzione di sicurezza per bypassare problemi RLS
    const { data, error } = await supabase.rpc('get_all_casparcg_servers');

    if (error) {
      log(`Errore query server: ${JSON.stringify(error)}`, 'error');
      throw error;
    }

    profileState.servers = data || [];
    log(`Caricati ${profileState.servers.length} server CasparCG.`);

    if (profileState.servers.length > 0) {
      log(`Primo server: ${JSON.stringify(profileState.servers[0])}`, 'debug');
    }
  } catch (error) {
    log(`Errore durante il caricamento dei server: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
    throw error;
  }
}

/**
 * Carica le assegnazioni da Supabase
 *
 * @returns {Promise<void>}
 */
async function loadAssignments() {
  try {
    // Verifica che il client Supabase sia inizializzato
    if (!supabase) {
      log('Client Supabase non inizializzato. Impossibile caricare le assegnazioni.', 'warning');
      return;
    }

    log('Tentativo di caricamento assegnazioni da Supabase...', 'debug');

    // CORREZIONE: Usa funzione di sicurezza per bypassare problemi RLS
    const { data, error } = await supabase.rpc('get_all_profile_server_assignments');

    if (error) {
      log(`Errore query assegnazioni: ${JSON.stringify(error)}`, 'error');
      throw error;
    }

    profileState.assignments = data || [];
    log(`Caricate ${profileState.assignments.length} assegnazioni server-profilo.`);

    if (profileState.assignments.length > 0) {
      log(`Prima assegnazione: ${JSON.stringify(profileState.assignments[0])}`, 'debug');
    }
  } catch (error) {
    log(`Errore durante il caricamento delle assegnazioni: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
    throw error;
  }
}

/**
 * Ottiene un profilo per ID
 *
 * @param {string} profileId - ID del profilo
 * @returns {Object|null} - Profilo trovato o null
 */
function getProfileById(profileId) {
  return profileState.profiles.find(profile => profile.id === profileId) || null;
}

/**
 * Ottiene un server per ID
 *
 * @param {string} serverId - ID del server
 * @returns {Object|null} - Server trovato o null
 */
function getServerById(serverId) {
  return profileState.servers.find(server => server.id === serverId) || null;
}

/**
 * Ottiene le assegnazioni per un profilo
 *
 * @param {string} profileId - ID del profilo
 * @returns {Array} - Assegnazioni trovate
 */
function getAssignmentsByProfileId(profileId) {
  return profileState.assignments.filter(assignment => assignment.profile_id === profileId);
}

/**
 * Ottiene un server per profilo e ruolo
 *
 * @param {string} profileId - ID del profilo
 * @param {string} role - Ruolo del server nel profilo
 * @returns {Object|null} - Server trovato o null
 */
function getServerByProfileAndRole(profileId, role) {
  const assignment = profileState.assignments.find(
    a => a.profile_id === profileId && a.server_role_in_profile === role
  );

  if (!assignment) return null;

  const server = getServerById(assignment.server_id);
  if (!server) return null;

  return {
    server,
    assignment
  };
}

/**
 * Connette a un server CasparCG
 *
 * @param {string} serverId - ID del server
 * @returns {Promise<Object>} - Risultato della connessione
 */
async function connectToServer(serverId) {
  try {
    // Verifica se esiste già una connessione attiva
    if (profileState.connections[serverId]) {
      log(`Connessione già attiva per il server ${serverId}.`);
      return { success: true, connection: profileState.connections[serverId] };
    }

    // Ottieni il server
    const server = getServerById(serverId);
    if (!server) {
      throw new Error(`Server con ID ${serverId} non trovato.`);
    }

    // Verifica che il server sia abilitato
    if (!server.is_enabled) {
      throw new Error(`Server ${server.name} (${serverId}) non è abilitato.`);
    }

    log(`Connessione al server ${server.name} (${server.host}:${server.port})...`);

    // Crea una nuova istanza del client CasparCG
    const casparClient = new CasparClient({
      host: server.host,
      port: server.port,
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 3
    });

    // Gestisci gli eventi del client
    casparClient.on('log', (message) => {
      log(`[${server.name}] ${message}`, 'debug');
    });

    // Connetti al server
    await casparClient.connect();

    // Salva la connessione
    profileState.connections[serverId] = {
      client: casparClient,
      server,
      connected: true,
      connectedAt: new Date()
    };

    log(`Connesso con successo al server ${server.name} (${server.host}:${server.port}).`);

    // Connetti anche al server OSC
    await connectToOsc(serverId, server);

    return { success: true, connection: profileState.connections[serverId] };
  } catch (error) {
    log(`Errore durante la connessione al server ${serverId}: ${error.message}`, 'error');
    return { success: false, message: error.message };
  }
}

/**
 * Connette a un server OSC
 *
 * @param {string} serverId - ID del server
 * @param {Object} server - Oggetto server
 * @returns {Promise<Object>} - Risultato della connessione
 */
async function connectToOsc(serverId, server) {
  try {
    // Verifica se esiste già una connessione OSC attiva
    if (profileState.oscConnections[serverId]) {
      log(`Connessione OSC già attiva per il server ${serverId}.`);
      return { success: true, connection: profileState.oscConnections[serverId] };
    }

    log(`Connessione OSC al server ${server.name} (${server.host}:6250)...`);

    // Crea una nuova istanza del client OSC
    const oscClient = new OscClient({
      host: server.host,
      port: 6250, // Porta OSC predefinita di CasparCG
      localPort: 0 // Porta locale dinamica
    });

    // Gestisci gli eventi del client
    oscClient.on('log', (message) => {
      log(`[OSC ${server.name}] ${message}`, 'trace');
    });

    // Connetti al server OSC
    await oscClient.connect();

    // Salva la connessione OSC
    profileState.oscConnections[serverId] = {
      client: oscClient,
      server,
      connected: true,
      connectedAt: new Date()
    };

    log(`Connesso con successo al server OSC ${server.name} (${server.host}:6250).`);

    return { success: true, connection: profileState.oscConnections[serverId] };
  } catch (error) {
    log(`Errore durante la connessione OSC al server ${serverId}: ${error.message}`, 'error');
    return { success: false, message: error.message };
  }
}

/**
 * Disconnette da un server CasparCG
 *
 * @param {string} serverId - ID del server
 * @returns {Promise<Object>} - Risultato della disconnessione
 */
async function disconnectFromServer(serverId) {
  try {
    // Verifica se esiste una connessione attiva
    if (!profileState.connections[serverId]) {
      log(`Nessuna connessione attiva per il server ${serverId}.`);
      return { success: true, message: 'Nessuna connessione attiva da chiudere.' };
    }

    const { server, client } = profileState.connections[serverId];

    log(`Disconnessione dal server ${server.name} (${server.host}:${server.port})...`);

    // Disconnetti dal server
    await client.disconnect();

    // Rimuovi la connessione
    delete profileState.connections[serverId];

    log(`Disconnesso con successo dal server ${server.name}.`);

    // Disconnetti anche dal server OSC
    await disconnectFromOsc(serverId);

    return { success: true, message: 'Disconnesso con successo.' };
  } catch (error) {
    log(`Errore durante la disconnessione dal server ${serverId}: ${error.message}`, 'error');
    return { success: false, message: error.message };
  }
}

/**
 * Disconnette da un server OSC
 *
 * @param {string} serverId - ID del server
 * @returns {Promise<Object>} - Risultato della disconnessione
 */
async function disconnectFromOsc(serverId) {
  try {
    // Verifica se esiste una connessione OSC attiva
    if (!profileState.oscConnections[serverId]) {
      log(`Nessuna connessione OSC attiva per il server ${serverId}.`);
      return { success: true, message: 'Nessuna connessione OSC attiva da chiudere.' };
    }

    const { server, client } = profileState.oscConnections[serverId];

    log(`Disconnessione dal server OSC ${server.name} (${server.host}:6250)...`);

    // Disconnetti dal server OSC
    await client.disconnect();

    // Rimuovi la connessione OSC
    delete profileState.oscConnections[serverId];

    log(`Disconnesso con successo dal server OSC ${server.name}.`);

    return { success: true, message: 'Disconnesso con successo dal server OSC.' };
  } catch (error) {
    log(`Errore durante la disconnessione dal server OSC ${serverId}: ${error.message}`, 'error');
    return { success: false, message: error.message };
  }
}

/**
 * Invia un comando a un server CasparCG
 *
 * @param {string} serverId - ID del server
 * @param {string} command - Comando AMCP da inviare
 * @returns {Promise<Object>} - Risultato del comando
 */
async function sendCommandToServer(serverId, command) {
  try {
    // Verifica se esiste una connessione attiva
    if (!profileState.connections[serverId]) {
      throw new Error(`Nessuna connessione attiva per il server ${serverId}.`);
    }

    const { server, client } = profileState.connections[serverId];

    log(`Invio comando al server ${server.name}: ${command}`, 'debug');

    // Invia il comando al server
    const response = await client.sendCommand(command);

    log(`Risposta dal server ${server.name}: ${response}`, 'debug');

    return { success: true, response };
  } catch (error) {
    log(`Errore durante l'invio del comando al server ${serverId}: ${error.message}`, 'error');
    return { success: false, message: error.message };
  }
}

/**
 * Gestisce le sessioni di preview
 */
const previewSessionManager = {
  // Sessioni attive
  sessions: {},

  // Contatore per gli ID delle sessioni
  sessionCounter: 0,

  // Genera un nuovo ID sessione
  generateSessionId() {
    return `preview_session_${Date.now()}_${this.sessionCounter++}`;
  },

  // Crea una nuova sessione di preview
  async createSession(profileId) {
    try {
      log(`Creazione di una nuova sessione di preview per il profilo ${profileId}...`);

      // Ottieni il server di preview per il profilo
      const previewServerInfo = getServerByProfileAndRole(profileId, 'PREVIEW_POOL');
      if (!previewServerInfo) {
        throw new Error(`Nessun server di preview trovato per il profilo ${profileId}.`);
      }

      const { server, assignment } = previewServerInfo;
      const config = assignment.config_details || {};

      // Connetti al server di preview se non è già connesso
      const connectionResult = await connectToServer(server.id);
      if (!connectionResult.success) {
        throw new Error(`Impossibile connettersi al server di preview: ${connectionResult.message}`);
      }

      // Genera un nuovo ID sessione
      const sessionId = this.generateSessionId();

      // Calcola il layer da utilizzare
      const previewChannel = config.preview_channel || 3;
      const layerStart = config.preview_layer_start || 100;
      const numLayers = config.num_preview_layers || 5;

      // Trova un layer disponibile
      let availableLayer = null;
      const usedLayers = new Set();

      // Raccogli i layer già utilizzati
      Object.values(this.sessions).forEach(session => {
        if (session.profileId === profileId && session.channel === previewChannel) {
          usedLayers.add(session.layer);
        }
      });

      // Trova il primo layer disponibile
      for (let i = 0; i < numLayers; i++) {
        const layer = layerStart + i;
        if (!usedLayers.has(layer)) {
          availableLayer = layer;
          break;
        }
      }

      if (availableLayer === null) {
        throw new Error(`Nessun layer di preview disponibile per il profilo ${profileId}.`);
      }

      // Crea la sessione
      const session = {
        id: sessionId,
        profileId,
        serverId: server.id,
        server: {
          id: server.id,
          name: server.name,
          host: server.host,
          port: server.port
        },
        channel: previewChannel,
        layer: availableLayer,
        createdAt: new Date(),
        lastUsedAt: new Date()
      };

      // Salva la sessione
      this.sessions[sessionId] = session;

      log(`Sessione di preview creata: ${sessionId} (${server.name}, canale ${previewChannel}, layer ${availableLayer})`);

      return { success: true, session };
    } catch (error) {
      log(`Errore durante la creazione della sessione di preview: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  },

  // Ottiene una sessione di preview
  getSession(sessionId) {
    return this.sessions[sessionId] || null;
  },

  // Aggiorna il timestamp di ultima attività di una sessione
  updateSessionActivity(sessionId) {
    const session = this.getSession(sessionId);
    if (session) {
      session.lastUsedAt = new Date();
    }
  },

  // Elimina una sessione di preview
  deleteSession(sessionId) {
    const session = this.getSession(sessionId);
    if (session) {
      log(`Eliminazione della sessione di preview ${sessionId}...`);

      // Pulisci il layer
      const { serverId, channel, layer } = session;
      if (profileState.connections[serverId]) {
        const command = `CLEAR ${channel}-${layer}`;
        sendCommandToServer(serverId, command)
          .catch(error => log(`Errore durante la pulizia del layer per la sessione ${sessionId}: ${error.message}`, 'error'));
      }

      // Rimuovi la sessione
      delete this.sessions[sessionId];

      log(`Sessione di preview ${sessionId} eliminata.`);
      return true;
    }
    return false;
  },

  // Invia un comando a una sessione di preview
  async sendCommand(sessionId, command) {
    try {
      const session = this.getSession(sessionId);
      if (!session) {
        throw new Error(`Sessione di preview ${sessionId} non trovata.`);
      }

      // Aggiorna il timestamp di ultima attività
      this.updateSessionActivity(sessionId);

      // Invia il comando al server
      const result = await sendCommandToServer(session.serverId, command);

      return result;
    } catch (error) {
      log(`Errore durante l'invio del comando alla sessione di preview ${sessionId}: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  },

  // Pulisce le sessioni inattive
  cleanupInactiveSessions(maxAgeMinutes = 30) {
    const now = new Date();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    Object.keys(this.sessions).forEach(sessionId => {
      const session = this.sessions[sessionId];
      const age = now - new Date(session.lastUsedAt);

      if (age > maxAgeMs) {
        log(`Pulizia della sessione inattiva ${sessionId} (inattiva da ${Math.round(age / 60000)} minuti)...`);
        this.deleteSession(sessionId);
      }
    });
  }
};

// Avvia un timer per la pulizia delle sessioni inattive
setInterval(() => {
  previewSessionManager.cleanupInactiveSessions();
}, 5 * 60 * 1000); // Ogni 5 minuti

// Esporta le funzioni e gli oggetti
module.exports = {
  initialize,
  loadProfiles,
  loadServers,
  loadAssignments,
  getProfileById,
  getServerById,
  getAssignmentsByProfileId,
  getServerByProfileAndRole,
  connectToServer,
  connectToOsc,
  disconnectFromServer,
  disconnectFromOsc,
  sendCommandToServer,
  previewSessionManager,
  profileState
};
