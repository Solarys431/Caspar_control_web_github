import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

// Crea il context
const CasparContext = createContext();

// Hook personalizzato per utilizzare il context
export const useCaspar = () => useContext(CasparContext);

// Provider del context
export const CasparProvider = ({ children }) => {
  // Stato per il profilo attivo e la sessione di preview
  const [activeProfileId, setActiveProfileId] = useState(null);

  // Funzione per impostare il profilo attivo
  const updateActiveProfile = (profileId) => {
    setActiveProfileId(profileId);
    console.log(`Profilo attivo aggiornato: ${profileId}`);
  };

  const [connected, setConnected] = useState(false);
  const [host, setHost] = useState('100.74.188.128'); // Host di CasparCG, non del backend
  const [port, setPort] = useState(5250);   // Porta AMCP di CasparCG
  const [socket, setSocket] = useState(null); // Socket per la connessione al backend (server.js)
  const [logs, setLogs] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [templateList, setTemplateList] = useState([]);
  const [loading, setLoading] = useState(false); // Loading generico per operazioni CasparCG
  const [error, setError] = useState(null);

  // Stato per la sessione di preview
  const [previewSessionId, setPreviewSessionId] = useState(null);

  // Stato per i dati OSC
  const [oscConnected, setOscConnected] = useState(false);
  const [oscData, setOscData] = useState({});
  const [timecodes, setTimecodes] = useState({});
  const [mediaLengths, setMediaLengths] = useState({});

  // MIGLIORAMENTO 1: OSC Throttling & Batching
  const oscUpdateBatchRef = useRef({});
  const oscThrottleTimerRef = useRef(null);
  const lastOscLogTimeRef = useRef(0);

  const addLog = useCallback((message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [{ timestamp, message: `[${level.toUpperCase()}] ${message}` }, ...prevLogs.slice(0, 199)]); // Limita a 200 log
    // console.log(`[${level.toUpperCase()}] ${timestamp} - ${message}`);
  }, []);

  // MIGLIORAMENTO 1: Funzione per throttling OSC updates
  const processBatchedOscUpdates = useCallback(() => {
    const batch = oscUpdateBatchRef.current;
    if (Object.keys(batch).length === 0) return;

    // Log throttled: solo ogni 2 secondi
    const now = Date.now();
    if (now - lastOscLogTimeRef.current > 2000) {
      const channelKeys = Object.keys(batch);
      console.log(`🎬 [OSC-BATCH] Aggiornamento ${channelKeys.length} canali:`, channelKeys.join(', '));
      lastOscLogTimeRef.current = now;
    }

    // Applica tutti gli updates in batch
    setOscData(prev => ({ ...prev, ...batch }));

    // Aggiorna timecodes in batch
    const newTimecodes = {};
    const newMediaLengths = {};

    Object.entries(batch).forEach(([key, state]) => {
      if (state.timecode?.time) {
        newTimecodes[key] = state.timecode.time;
      }
      if (state.length?.frames || state.length?.length) {
        const frames = state.length.frames || state.length.length || 0;
        const timecode = state.length.timecode || '';
        newMediaLengths[key] = { frames, timecode };
      }
    });

    if (Object.keys(newTimecodes).length > 0) {
      setTimecodes(prev => ({ ...prev, ...newTimecodes }));
    }
    if (Object.keys(newMediaLengths).length > 0) {
      setMediaLengths(prev => ({ ...prev, ...newMediaLengths }));
    }

    // Reset batch
    oscUpdateBatchRef.current = {};
  }, []);

  // MIGLIORAMENTO 1: Funzione per accumulare OSC updates
  const batchOscUpdate = useCallback((key, state) => {
    // Accumula nel batch
    oscUpdateBatchRef.current[key] = {
      ...oscUpdateBatchRef.current[key],
      ...state
    };

    // Clear existing timer
    if (oscThrottleTimerRef.current) {
      clearTimeout(oscThrottleTimerRef.current);
    }

    // Schedule batch processing (200ms throttle)
    oscThrottleTimerRef.current = setTimeout(processBatchedOscUpdates, 200);
  }, [processBatchedOscUpdates]);

  useEffect(() => {
    addLog('Inizializzazione del socket client per il backend...');
    const configuredServerUrl = process.env.REACT_APP_API_URL || 'http://100.74.188.128:5000';
    addLog(`Tentativo di connessione Socket.IO al backend: ${configuredServerUrl}`);

    const newSocket = io(configuredServerUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 20000,
      transports: ['websocket'],
      autoConnect: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      addLog(`Socket client connesso con successo al server backend (${configuredServerUrl}). ID: ${newSocket.id}`);
      newSocket.emit('caspar:status:request'); // Richiedi lo stato di CasparCG al backend
    });

    newSocket.on('disconnect', (reason) => {
      addLog(`Socket client disconnesso dal server backend: ${reason}`, 'warning');
    });

    newSocket.on('connect_error', (err) => {
      const errMsg = `Errore di connessione socket client al backend (${configuredServerUrl}): ${err.message}.`;
      addLog(errMsg + " VERIFICARE: 1) Server backend (server.js) è ATTIVO? 2) URL è corretto? 3) CORS configurato nel backend?", 'error');
      setError(`Fallita connessione al server backend (${configuredServerUrl}).`);
    });

    // Gestori eventi CasparCG inoltrati dal backend
    newSocket.on('caspar:connected', (data) => {
      addLog(`CONNESSO a CasparCG su ${data.host}:${data.port} (via backend).`);
      setConnected(true);
      setHost(data.host); // Host di CasparCG
      setPort(data.port);   // Porta AMCP di CasparCG
      setError(null);
      setLoading(false);
    });

    newSocket.on('caspar:disconnected', (data) => {
      const reason = data && data.reason ? data.reason : 'Non specificato';
      addLog(`DISCONNESSO da CasparCG (via backend). Motivo: ${reason}`, 'warning');
      setConnected(false);
      setLoading(false);
    });

    newSocket.on('caspar:error', (data) => {
      const errorMessage = data.message || 'Errore sconosciuto da CasparCG (via backend)';
      addLog(`ERRORE CasparCG (via backend): ${errorMessage}`, 'error');
      setError(errorMessage);
      // setConnected(false); // Dipende se l'errore implica disconnessione
      setLoading(false);
    });

    newSocket.on('caspar:log', (data) => {
      if (data.message && !data.message.includes('Risposta:')) { // Evita di loggare risposte già gestite
        addLog(`Log CasparCG (via backend): ${data.message}`, 'debug');
      }
    });

    newSocket.on('caspar:status', (data) => {
      addLog(`Stato CasparCG (via backend): connesso=${data.connected}, host=${data.host}, port=${data.port}`);
      setConnected(data.connected);
      if(data.connected) {
        setHost(data.host);
        setPort(data.port);
        setError(null);
      }
      setLoading(false);
    });

    newSocket.on('caspar:loading', (isLoading) => {
        // addLog(`Stato caricamento CasparCG (via backend): ${isLoading}`, 'debug');
        setLoading(isLoading);
    });

    // Gestori eventi OSC
    newSocket.on('osc:connected', (data) => {
      addLog(`CONNESSO a CasparCG OSC su ${data.host}:6250 (via backend).`);
      setOscConnected(true);
    });

    newSocket.on('osc:disconnected', (data) => {
      const reason = data && data.reason ? data.reason : 'Non specificato';
      addLog(`DISCONNESSO da CasparCG OSC (via backend). Motivo: ${reason}`, 'warning');
      setOscConnected(false);
    });

    newSocket.on('osc:error', (data) => {
      const errorMessage = data.message || 'Errore sconosciuto da CasparCG OSC (via backend)';
      addLog(`ERRORE CasparCG OSC (via backend): ${errorMessage}`, 'error');
    });

    newSocket.on('osc:timecode', (data) => {
      // Aggiorna il timecode per il canale/layer specifico
      setTimecodes(prev => ({
        ...prev,
        [`${data.channel}-${data.layer}`]: data.time
      }));

      // Log per debug (solo per il canale 3 che è quello di preview)
      if (data.channel === 3) {
        console.log(`OSC Timecode ricevuto per ${data.channel}-${data.layer}: ${data.time}`);
      }
    });

    newSocket.on('osc:frame', (data) => {
      // PROBLEMA 1 FIX: Estrai il valore primitivo invece dell'oggetto completo
      const frameValue = typeof data.frame === 'number' ? data.frame : (data.frame || 0);

      // Aggiorna il frame per il canale/layer specifico
      setOscData(prev => ({
        ...prev,
        [`${data.channel}-${data.layer}`]: {
          ...prev[`${data.channel}-${data.layer}`],
          frame: frameValue // Salva solo il valore numerico
        }
      }));

      // Log per debug OSC data parsing
      if (data.channel === 3) {
        console.log(`🔧 [OSC FIX] Frame aggiornato per ${data.channel}-${data.layer}: ${frameValue} (tipo: ${typeof frameValue})`);
      }
    });

    newSocket.on('osc:fps', (data) => {
      // Aggiorna il fps per il canale/layer specifico
      setOscData(prev => ({
        ...prev,
        [`${data.channel}-${data.layer}`]: {
          ...prev[`${data.channel}-${data.layer}`],
          fps: data.fps
        }
      }));
    });

    newSocket.on('osc:path', (data) => {
      // Aggiorna il path per il canale/layer specifico
      setOscData(prev => ({
        ...prev,
        [`${data.channel}-${data.layer}`]: {
          ...prev[`${data.channel}-${data.layer}`],
          path: data.path
        }
      }));
    });

    newSocket.on('osc:length', (data) => {
      // Verifica che i dati siano validi
      if (!data || typeof data.length !== 'number' || data.length <= 0) {
        console.warn(`Ricevuti dati di lunghezza non validi per ${data?.channel}-${data?.layer}:`, data);
        return;
      }

      // Aggiorna la lunghezza del media per il canale/layer specifico
      console.log(`Ricevuta lunghezza media per ${data.channel}-${data.layer}: ${data.length} frames`);

      // Converti la lunghezza in frames in timecode (assumendo 25 fps)
      const fps = 25; // Default, dovrebbe essere aggiornato con il valore reale dal server
      const totalSeconds = Math.floor(data.length / fps);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const frames = data.length % fps;

      const timecode = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;

      const channelLayerKey = `${data.channel}-${data.layer}`;

      // Salva sia la lunghezza in frames che il timecode
      setMediaLengths(prev => ({
        ...prev,
        [channelLayerKey]: {
          frames: data.length,
          timecode: timecode
        }
      }));

      // PROBLEMA 1 FIX: Aggiorna i dati OSC con valore primitivo
      setOscData(prev => ({
        ...prev,
        [channelLayerKey]: {
          ...prev[channelLayerKey],
          length: data.length, // Salva solo il valore numerico
          duration: timecode
        }
      }));

      // Log per debug (solo per il canale 3 che è quello di preview)
      if (data.channel === 3) {
        console.log(`🔧 [OSC FIX] Length aggiornata per ${data.channel}-${data.layer}: ${data.length} frames (${timecode}) - tipo: ${typeof data.length}`);
      }
    });

    newSocket.on('osc:paused', (data) => {
      // PROBLEMA 1 FIX: Estrai il valore primitivo boolean invece dell'oggetto
      const pausedValue = typeof data.paused === 'boolean' ? data.paused : Boolean(data.paused);

      // Aggiorna lo stato di pausa per il canale/layer specifico
      setOscData(prev => ({
        ...prev,
        [`${data.channel}-${data.layer}`]: {
          ...prev[`${data.channel}-${data.layer}`],
          paused: pausedValue // Salva solo il valore boolean
        }
      }));

      // Log per debug OSC data parsing
      if (data.channel === 3) {
        console.log(`🔧 [OSC FIX] Paused aggiornato per ${data.channel}-${data.layer}: ${pausedValue} (tipo: ${typeof pausedValue})`);
      }
    });

    newSocket.on('osc:loop', (data) => {
      // Aggiorna lo stato di loop per il canale/layer specifico
      setOscData(prev => ({
        ...prev,
        [`${data.channel}-${data.layer}`]: {
          ...prev[`${data.channel}-${data.layer}`],
          loop: data.loop
        }
      }));
    });

    // Gestione dello stato OSC globale - MIGLIORAMENTO 1: Con throttling
    newSocket.on('osc:state', (data) => {
      const { key, state } = data;
      
      // MIGLIORAMENTO 1: Usa batching invece di update immediato
      batchOscUpdate(key, state);
    });

    // Gestione dello stato OSC completo - MIGLIORAMENTO 1: Con throttling
    newSocket.on('osc:state:all', (allState) => {
      // MIGLIORAMENTO 1: Batch all state updates insieme
      Object.entries(allState).forEach(([key, state]) => {
        batchOscUpdate(key, state);
      });
    });


    return () => {
      addLog('Cleanup del socket client: disconnessione dal backend.');
      
      // MIGLIORAMENTO 1: Cleanup throttle timer
      if (oscThrottleTimerRef.current) {
        clearTimeout(oscThrottleTimerRef.current);
        oscThrottleTimerRef.current = null;
      }
      
      newSocket.disconnect();
      setSocket(null);
    };
  }, [addLog, processBatchedOscUpdates]); // MIGLIORAMENTO 1: Dipendenza corretta

  // Funzione per connettersi a CasparCG
  const connectToCaspar = useCallback(async (newHost, newPort, profileId = null, serverRole = null) => {
    if (!socket || !socket.connected) {
        const msg = 'Connessione a CasparCG fallita: client non connesso al server backend.';
        addLog(msg, 'error'); setError(msg);
        return { success: false, message: msg };
    }
    setLoading(true); setError(null);

    // Se profileId e serverRole sono forniti, utilizziamo il profilo
    if (profileId && serverRole) {
      addLog(`Richiesta di connessione a CasparCG tramite profilo (${profileId}, ruolo: ${serverRole}) inviata al backend...`);
      socket.emit('caspar:connect:profile', { profileId, serverRole });
    } else {
      // Connessione diretta con host e porta
      addLog(`Richiesta di connessione diretta a CasparCG (${newHost}:${newPort}) inviata al backend...`);
      socket.emit('caspar:connect', { host: newHost, port: newPort });
    }

    // La risposta e l'aggiornamento di stato avverranno tramite gli eventi 'caspar:connected' o 'caspar:error'
    return { success: true, message: 'Richiesta di connessione inviata.' }; // Indica solo che la richiesta è partita
  }, [socket, addLog]);

  // Funzione per richiedere una sessione di preview
  const requestPreviewSession = useCallback(async () => {
    if (!socket || !socket.connected) {
        const msg = 'Richiesta sessione preview fallita: client non connesso al server backend.';
        addLog(msg, 'error'); setError(msg);
        return { success: false, message: msg };
    }

    if (!activeProfileId) {
        const msg = 'Richiesta sessione preview fallita: nessun profilo attivo.';
        addLog(msg, 'error'); setError(msg);
        return { success: false, message: msg };
    }

    setLoading(true); setError(null);
    addLog(`Richiesta di sessione preview per il profilo ${activeProfileId} inviata al backend...`);

    return new Promise((resolve, reject) => {
      socket.emit('preview:request_session', { profileId: activeProfileId }, (response) => {
        setLoading(false);

        if (response && response.success) {
          const { sessionId, server, channel, layer } = response;
          setPreviewSessionId(sessionId);
          addLog(`Sessione preview ottenuta: ${sessionId} (${server.host}:${server.port}, canale ${channel}, layer ${layer})`);
          resolve({
            success: true,
            sessionId,
            server,
            channel,
            layer,
            message: 'Sessione preview ottenuta con successo.'
          });
        } else {
          const errorMsg = response ? response.message : 'Errore sconosciuto nella richiesta di sessione preview.';
          addLog(`Errore nella richiesta di sessione preview: ${errorMsg}`, 'error');
          setError(errorMsg);
          reject({ success: false, message: errorMsg });
        }
      });
    });
  }, [socket, addLog, activeProfileId]);

  const disconnectFromCaspar = useCallback(async () => {
    if (!socket || !socket.connected) {
        const msg = 'Disconnessione da CasparCG fallita: client non connesso al server backend.';
        addLog(msg, 'error'); setError(msg);
        return { success: false, message: msg };
    }
    if (!connected && !loading) {
        addLog('Già disconnesso da CasparCG.', 'info');
        return { success: true, message: 'Già disconnesso.' };
    }
    setLoading(true); setError(null);
    addLog('Richiesta di disconnessione da CasparCG inviata al backend...');
    socket.emit('caspar:disconnect');
    return { success: true, message: 'Richiesta di disconnessione inviata.' };
  }, [socket, addLog, loading, connected]);

  const sendCommand = useCallback(async (commandString, options = {}) => {
    if (!socket || !socket.connected) {
        return Promise.reject({ success: false, message: 'Client non connesso al server backend.' });
    }

    // Opzioni per il comando
    const {
      isPreview = false,
      sessionId = previewSessionId,
      profileId = activeProfileId,
      skipConnectionCheck = false
    } = options;

    // Se non è un comando di preview, verifica che siamo connessi a CasparCG
    if (!isPreview && !connected && !skipConnectionCheck) {
        return Promise.reject({ success: false, message: 'Non connesso a CasparCG.' });
    }

    // Se è un comando di preview, verifica che abbiamo una sessione di preview
    if (isPreview && !sessionId) {
        return Promise.reject({ success: false, message: 'Nessuna sessione di preview attiva.' });
    }

    // Log del comando
    if (isPreview) {
      addLog(`Invio comando AMCP di preview (via backend): ${commandString}`, 'debug');
    } else {
      addLog(`Invio comando AMCP (via backend): ${commandString}`, 'debug');
    }

    // Invia il comando appropriato
    return new Promise((resolve, reject) => {
        if (isPreview) {
          // Comando di preview
          socket.emit('preview:command', {
            command: commandString,
            sessionId,
            profileId
          }, (response) => {
              if (response && response.success) {
                  addLog(`Risposta comando preview "${commandString}": ${response.response || 'OK'}`, 'debug');
                  resolve({ success: true, response: response.response });
              } else {
                  const errorMsg = response ? response.message : `Errore sconosciuto per comando preview: ${commandString}`;
                  addLog(`Errore comando preview "${commandString}": ${errorMsg}`, 'error');
                  reject({ success: false, message: errorMsg });
              }
          });
        } else {
          // Comando normale
          socket.emit('caspar:command', { command: commandString }, (response) => {
              if (response && response.success) {
                  addLog(`Risposta comando "${commandString}": ${response.response || 'OK'}`, 'debug');
                  resolve({ success: true, response: response.response });
              } else {
                  const errorMsg = response ? response.message : `Errore sconosciuto per: ${commandString}`;
                  addLog(`Errore comando "${commandString}": ${errorMsg}`, 'error');
                  reject({ success: false, message: errorMsg });
              }
          });
        }
    });
  }, [connected, socket, addLog, previewSessionId, activeProfileId]);

  const getMediaList = useCallback(async () => {
    // ... (implementazione invariata, usa sendCommand) ...
    if (!connected) { /* ... */ }
    addLog('Richiesta lista media (CLS)...');
    try {
        const result = await sendCommand('CLS');
        if (result.success && result.response) {
          const files = result.response.split('\r\n')
            .filter(line => line.trim() !== '' && !line.startsWith('200') && !line.startsWith('201') && !line.startsWith('404') && line.length > 0)
            .map(line => { const match = line.match(/"(.*?)"/); return match ? match[1] : line.trim(); })
            .filter(Boolean);
          setMediaList(files);
          addLog(`Lista media aggiornata: ${files.length} file.`);
          return { success: true, media: files };
        }
        setError(result.message || 'Errore recupero lista media.');
        return { success: false, media: [], message: result.message };
    } catch (error) {
        setError(error.message || 'Eccezione recupero lista media.');
        return { success: false, media: [], message: error.message };
    }
  }, [connected, sendCommand, addLog]);

  const getTemplateList = useCallback(async () => {
    // ... (implementazione invariata, usa sendCommand) ...
    if (!connected) { /* ... */ }
    addLog('Richiesta lista template (TLS)...');
    try {
        const result = await sendCommand('TLS');
        if (result.success && result.response) {
          const files = result.response.split('\r\n')
            .filter(line => line.trim() !== '' && !line.startsWith('200') && !line.startsWith('201') && !line.startsWith('404') && line.length > 0)
            .map(line => { const match = line.match(/"(.*?)"/); return match ? match[1] : line.trim(); })
            .filter(Boolean);
          setTemplateList(files);
          addLog(`Lista template aggiornata: ${files.length} template.`);
          return { success: true, templates: files };
        }
        setError(result.message || 'Errore recupero lista template.');
        return { success: false, templates: [], message: result.message };
    } catch (error) {
        setError(error.message || 'Eccezione recupero lista template.');
        return { success: false, templates: [], message: error.message };
    }
  }, [connected, sendCommand, addLog]);

  // NUOVA FUNZIONE PER RECUPERARE IL MANIFEST
  const fetchManifest = useCallback((templateName) => {
    return new Promise((resolve, reject) => {
      if (!socket || !socket.connected) {
        const msg = 'Fetch manifest fallito: client non connesso al server backend.';
        addLog(msg, 'error');
        return reject(new Error(msg));
      }
      if (!templateName) {
        const msg = 'Fetch manifest fallito: nome del template non fornito.';
        addLog(msg, 'error');
        return reject(new Error(msg));
      }

      addLog(`Richiesta manifest per "${templateName}" al backend...`, 'debug');
      setLoading(true); // Potresti voler uno stato di loading specifico per i manifest
      socket.emit('get_template_manifest', templateName, (response) => {
        setLoading(false);
        if (response && response.error) {
          addLog(`Errore dal backend per manifest "${templateName}": ${response.error}`, 'error');
          // Se il manifest non è trovato (caso comune), risolvi con null.
          // Altrimenti, se è un errore diverso, potresti voler rigettare.
          if (response.error.toLowerCase().includes('not found') || response.error.toLowerCase().includes('non trovato')) {
              resolve(null);
          } else {
              reject(new Error(response.error));
          }
        } else if (response && response.data !== undefined) { // response.data può essere null se non trovato
          addLog(`Manifest per "${templateName}" ricevuto con successo dal backend.`, 'debug');
          resolve(response.data);
        } else {
          addLog(`Risposta inattesa dal backend per manifest "${templateName}".`, 'warning');
          resolve(null); // Tratta come non trovato se la risposta non è strutturata come atteso
        }
      });

      // Timeout per la richiesta del manifest (opzionale ma consigliato)
      setTimeout(() => {
        if (loading) { // Se ancora in caricamento dopo il timeout
            setLoading(false);
            const msg = `Timeout nella richiesta del manifest per "${templateName}" al backend.`;
            addLog(msg, 'error');
            reject(new Error(msg));
        }
      }, 15000); // Timeout di 15 secondi

      // Ascolta un evento di conferma per pulire il timeout se la risposta arriva prima
      // È buona pratica che il backend emetta un evento di risposta specifico o usi la callback.
      // Se usi solo la callback, il timeout è l'unico modo per gestire la mancata risposta.
      // Per semplicità, qui ci affidiamo al timeout e alla gestione di loading.
      // In uno scenario reale, potresti voler un meccanismo di ack più robusto.
      // newSocket.once(`manifest_response_for_${templateName}`, () => clearTimeout(manifestTimeoutId));
    });
  }, [socket, addLog, loading]); // Aggiunto loading alle dipendenze

  // Funzione per inviare comandi di controllo con priorità alta
  const sendControlCommand = useCallback((command, channel, layer, clip, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!socket || !socket.connected) {
        const msg = 'Impossibile inviare comando di controllo: socket non connesso';
        addLog(msg, 'error');
        return reject(new Error(msg));
      }

      addLog(`Invio comando di controllo ${command} a ${channel}-${layer}${clip ? ` (${clip})` : ''}`, 'info');

      socket.emit('caspar:control', { command, channel, layer, clip, options }, (response) => {
        if (response && response.success) {
          addLog(`Comando di controllo ${command} eseguito con successo`, 'success');
          resolve(response);
        } else {
          const errorMsg = response && response.message ? response.message : 'Errore sconosciuto';
          addLog(`Errore nell'esecuzione del comando di controllo ${command}: ${errorMsg}`, 'error');
          reject(new Error(errorMsg));
        }
      });
    });
  }, [socket, addLog]);

  // Funzioni per il controllo di CasparCG con priorità alta
  const play = useCallback((channel, layer, clip, options = {}) => {
    // Usa il nuovo endpoint di controllo per i comandi prioritari
    return sendControlCommand('PLAY', channel, layer, clip, options);
  }, [sendControlCommand]);

  const pause = useCallback((channel, layer) => {
    return sendControlCommand('PAUSE', channel, layer);
  }, [sendControlCommand]);

  const resume = useCallback((channel, layer) => {
    return sendControlCommand('RESUME', channel, layer);
  }, [sendControlCommand]);

  const stop = useCallback((channel, layer) => {
    return sendControlCommand('STOP', channel, layer);
  }, [sendControlCommand]);

  const clear = useCallback((channel, layer) => {
    return sendControlCommand('CLEAR', channel, layer);
  }, [sendControlCommand]);

  const loadbg = useCallback((channel, layer, clip, options = {}) => {
    return sendControlCommand('LOADBG', channel, layer, clip, options);
  }, [sendControlCommand]);
  const casparCgAdd = useCallback((channel, layer, cgLayer, template, playOnLoad = true, data = null) => {
    let dataString;
    
    // CORREZIONE DEFINITIVA: Gestione corretta dei dati JSON senza virgolette doppie
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      try { 
        const jsonData = JSON.stringify(data);
        // Escape virgolette interne ma non aggiungere virgolette extra
        dataString = jsonData.replace(/"/g, '\\"'); 
      }
      catch (e) { 
        addLog(`Errore JSON per CG ADD: ${e.message}`, 'error'); 
        dataString = '{}'; 
      }
    } else { 
      // CORREZIONE DEFINITIVA: Per dati vuoti, invia solo {} senza virgolette extra
      dataString = '{}'; 
    }

    // Utilizziamo il parametro playOnLoad per determinare se il template deve essere riprodotto immediatamente
    const playOnLoadValue = playOnLoad ? "1" : "0";

    // CORREZIONE DEFINITIVA: Le virgolette vengono aggiunte qui nel comando finale
    let command = `CG ${channel}-${layer} ADD ${cgLayer} "${template}" ${playOnLoadValue} "${dataString}"`;
    return sendCommand(command);
  }, [sendCommand, addLog]);
  const casparCgPlay = useCallback((channel, layer, cgLayer) => sendCommand(`CG ${channel}-${layer} PLAY ${cgLayer}`), [sendCommand]);
  const casparCgStop = useCallback((channel, layer, cgLayer) => sendCommand(`CG ${channel}-${layer} STOP ${cgLayer}`), [sendCommand]);
  const casparCgRemove = useCallback((channel, layer, cgLayer) => sendCommand(`CG ${channel}-${layer} REMOVE ${cgLayer}`), [sendCommand]);
  const casparCgUpdate = useCallback((channel, layer, cgLayer, data) => {
    let dataString;
    
    // CORREZIONE DEFINITIVA: Gestione corretta dei dati JSON per UPDATE
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      try { 
        const jsonData = JSON.stringify(data);
        // Escape virgolette interne ma non aggiungere virgolette extra
        dataString = jsonData.replace(/"/g, '\\"'); 
      }
      catch (e) { 
        addLog(`Errore JSON per CG UPDATE: ${e.message}`, 'error'); 
        return Promise.reject({success: false, message: "Errore dati JSON"}); 
      }
    } else { 
      addLog('CG UPDATE senza dati validi.', 'warning'); 
      // CORREZIONE DEFINITIVA: Per dati vuoti, invia solo {} senza virgolette extra
      dataString = '{}'; 
    }
    
    // CORREZIONE DEFINITIVA: Le virgolette vengono aggiunte qui nel comando finale
    return sendCommand(`CG ${channel}-${layer} UPDATE ${cgLayer} "${dataString}"`);
  }, [sendCommand, addLog]);
  const cgInvoke = useCallback((channel, layer, cgLayer, method) => sendCommand(`CG ${channel}-${layer} INVOKE ${cgLayer} "${method}"`), [sendCommand]);
  const mixer = useCallback((channel, layer, property, value, duration = 0, tween = 'linear') => { /* ...invariato... */
      let command = `MIXER ${channel}-${layer} ${property.toUpperCase()}`;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) { command += ` ${value.x || 0} ${value.y || 0} ${value.width || 0} ${value.height || 0}`; }
      else if (Array.isArray(value)) { command += ` ${value.join(' ')}`; }
      else { command += ` ${value}`; }
      if (duration > 0) { command += ` ${duration} ${tween.toUpperCase()}`; }
      return sendCommand(command);
  }, [sendCommand]);

  const value = {
    connected, host, port, logs, mediaList, templateList, loading, error,
    connect: connectToCaspar,
    disconnect: disconnectFromCaspar,
    sendCommand,
    sendControlCommand, // Esponi la nuova funzione di controllo prioritario
    getMediaList,
    getTemplateList,
    fetchManifest,
    play, pause, resume, stop, loadbg, clear, // Aggiungi pause e resume
    cgAdd: casparCgAdd,
    cgPlay: casparCgPlay,
    cgStop: casparCgStop,
    cgRemove: casparCgRemove,
    cgUpdate: casparCgUpdate,
    cgInvoke,
    mixer,
    addLog,
    clearLogs: () => setLogs([]),
    // CORREZIONE: Esponi socket per ProfileSelector
    socket,
    // Dati OSC
    oscConnected,
    oscData,
    timecodes,
    mediaLengths,
    // Funzione di utilità per ottenere il timecode di un canale/layer specifico
    getTimecode: (channel, layer) => timecodes[`${channel}-${layer}`] || '00:00:00:00',
    // Funzioni per i profili CasparCG
    activeProfileId,
    updateActiveProfile,
    previewSessionId,
    requestPreviewSession,
    // Funzione di utilità per ottenere i dati OSC di un canale/layer specifico
    getOscData: (channel, layer) => oscData[`${channel}-${layer}`] || {},
    // Funzione di utilità per ottenere la durata di un media
    getMediaDuration: (channel, layer) => {
      const key = `${channel}-${layer}`;
      return mediaLengths[key] ? mediaLengths[key].timecode : '00:00:00:00';
    },
    // Funzione di utilità per ottenere la lunghezza in frames di un media
    getMediaLength: (channel, layer) => {
      const key = `${channel}-${layer}`;
      return mediaLengths[key] ? mediaLengths[key].frames : 0;
    },
  };

  return (
    <CasparContext.Provider value={value}>
      {children}
    </CasparContext.Provider>
  );
};

export default CasparContext; // Assicurati che l'export di default sia corretto
