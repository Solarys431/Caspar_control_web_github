import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCaspar } from './CasparContext'; // Assicurati che il path sia corretto
import { useAuth } from './AuthContext';
import useRundownItems from '../pages/Rundown/hooks/useRundownItems';
import { autoMigrateRundownFromLocalStorage, hasRundownToMigrate } from '../utils/rundownMigration';

// Crea il context
const RundownContext = createContext();

// Hook personalizzato per utilizzare il context
export const useRundown = () => useContext(RundownContext);

// Provider del context
export const RundownProvider = ({ children }) => {
  const {
    connected,
    play,
    stop,
    loadbg,
    cgAdd,
    cgPlay,
    cgStop,
    cgRemove,
    cgUpdate,
    addLog,
    templateList, // PROBLEMA 3 FIX: Aggiungi templateList dal CasparContext
    // LOOP AUTOMATICO: Importa dati OSC per rilevamento fine media
    oscConnected,
    oscData
  } = useCaspar();

  const { user } = useAuth();

  // CORREZIONE: Stato per rundown attivo indipendente dall'URL
  const [externalActiveRundownId, setExternalActiveRundownId] = useState(null);

  // Hook per la sincronizzazione Supabase
  // CORREZIONE CRITICA: Passa externalActiveRundownId al hook per sincronizzazione
  const {
    rundownItems: supabaseItems,
    rundownName: supabaseName,
    loading: supabaseLoading,
    error: supabaseError,
    modified: supabaseModified,
    activeRundownId: urlActiveRundownId,
    addMediaItem,
    addTemplateItem,
    addStoryItem,
    setRundownName: updateRundownName,
    loadRundownData
  } = useRundownItems(externalActiveRundownId);

  // CORREZIONE: Stabilizza activeRundownId con useMemo per evitare re-render
  const activeRundownId = useMemo(() => {
    return urlActiveRundownId || externalActiveRundownId;
  }, [urlActiveRundownId, externalActiveRundownId]);

  // CORREZIONE: Funzione per impostare rundown attivo esternamente (per editor scalette)
  const setActiveRundownIdExternal = useCallback(async (rundownId) => {
    console.log('🎯 [RUNDOWN_CONTEXT] Impostazione rundown attivo esterno:', rundownId);

    if (rundownId) {
      // Se c'è un ID, carica i dati del rundown
      setExternalActiveRundownId(rundownId);

      // Carica i dati del rundown se la funzione è disponibile
      if (loadRundownData) {
        try {
          console.log('🔄 [RUNDOWN_CONTEXT] Caricamento dati rundown esterno...');
          await loadRundownData(rundownId);

          console.log('✅ [RUNDOWN_CONTEXT] Dati rundown caricati per ID esterno:', rundownId);

          // Verifica che il caricamento sia avvenuto con successo
          if (typeof addLog === 'function') {
            addLog(`Rundown attivo impostato: ${rundownId}`, 'success');
          }

          return true; // Indica successo
        } catch (error) {
          console.error('❌ [RUNDOWN_CONTEXT] Errore caricamento dati rundown esterno:', error);

          if (typeof addLog === 'function') {
            addLog(`Errore caricamento rundown: ${error.message}`, 'error');
          }

          // Reset in caso di errore
          setExternalActiveRundownId(null);
          throw error; // Rilancia l'errore per gestione upstream
        }
      } else {
        console.warn('⚠️ [RUNDOWN_CONTEXT] loadRundownData non disponibile');
        if (typeof addLog === 'function') {
          addLog('Funzione caricamento rundown non disponibile', 'warning');
        }
        return false;
      }
    } else {
      // Se non c'è ID, resetta
      setExternalActiveRundownId(null);
      console.log('🔄 [RUNDOWN_CONTEXT] Rundown attivo esterno resettato');

      if (typeof addLog === 'function') {
        addLog('Rundown attivo resettato', 'info');
      }

      return true;
    }
  }, [loadRundownData, addLog]); // CORREZIONE: Rimuovi externalActiveRundownId dalle dipendenze per evitare loop

  // Stati locali per compatibilità con API esistente
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [rundownName, setRundownName] = useState('Nuovo Rundown');
  const [modified, setModified] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1);
  // const [autoPlayTimer, setAutoPlayTimer] = useState(null); // RIMOSSO: Non più utilizzato con nuovo sistema OSC
  const [useSupabaseSync, setUseSupabaseSync] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [rundownIsLooping, setRundownIsLooping] = useState(false);
  
  // CORREZIONE STALE CLOSURE: Flag di controllo interno per loop
  const loopControlRef = useRef({ 
    running: false, 
    shouldLoop: false, 
    currentIndex: 0,
    timerId: null 
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduledPlayback, setScheduledPlayback] = useState(false);
  const [dayStartTime, setDayStartTime] = useState('00:00:00');
  const [timeIndicatorPosition, setTimeIndicatorPosition] = useState(0);
  const [playingItems, setPlayingItems] = useState([]);
  const [nextItemPrepared, setNextItemPrepared] = useState(null);

  // Effetto per gestire la migrazione automatica da localStorage a Supabase
  useEffect(() => {
    const handleMigration = async () => {
      if (!user?.id || migrationCompleted) return;

      console.log('RundownContext: Verifica migrazione da localStorage a Supabase');

      try {
        // Verifica se c'è un rundown da migrare
        if (hasRundownToMigrate()) {
          if (typeof addLog === 'function') {
            addLog('Trovato rundown in localStorage, avvio migrazione a Supabase...', 'info');
          }

          const migrationResult = await autoMigrateRundownFromLocalStorage(user.id);

          if (migrationResult.success) {
            if (typeof addLog === 'function') {
              addLog(`Migrazione completata: ${migrationResult.message}`, 'success');
            }
            setUseSupabaseSync(true);
            setMigrationCompleted(true);

            // Se è stato creato un nuovo rundown, caricalo
            if (migrationResult.rundownId) {
              await loadRundownData(migrationResult.rundownId);
            }
          } else {
            if (typeof addLog === 'function') {
              addLog(`Errore migrazione: ${migrationResult.error}`, 'error');
            }
            // Fallback a localStorage
            loadFromLocalStorage();
          }
        } else {
          // Nessuna migrazione necessaria, usa Supabase se disponibile
          setUseSupabaseSync(true);
          setMigrationCompleted(true);
        }
      } catch (error) {
        console.error('RundownContext: Errore durante migrazione:', error);
        if (typeof addLog === 'function') {
          addLog(`Errore migrazione: ${error.message}`, 'error');
        }
        // Fallback a localStorage
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      console.log('RundownContext: Caricamento da localStorage (fallback)');
      try {
        const savedRundown = localStorage.getItem('rundown');
        if (savedRundown) {
          const parsedRundown = JSON.parse(savedRundown);
          setItems(parsedRundown.items || []);
          setRundownName(parsedRundown.name || 'Rundown Caricato');
          if (typeof addLog === 'function') {
            addLog('Rundown caricato da localStorage (modalità offline)');
          }
        } else {
          if (typeof addLog === 'function') {
            addLog('Nessun rundown trovato in localStorage');
          }
        }
      } catch (error) {
        console.error('RundownContext: Errore caricamento localStorage:', error);
        if (typeof addLog === 'function') {
          addLog(`Errore caricamento localStorage: ${error.message}`, 'error');
        }
      }
    };

    if (user?.id) {
      handleMigration();
    } else {
      // Se non c'è utente autenticato, usa localStorage
      loadFromLocalStorage();
    }
  }, [user?.id, migrationCompleted, loadRundownData, addLog]);

  // CORREZIONE CRITICA: Effetto per sincronizzare i dati da Supabase allo stato locale senza loop infinito
  useEffect(() => {
    if (useSupabaseSync && supabaseItems && supabaseItems.length >= 0) {
      console.log('🔄 [RUNDOWN CONTEXT] Sincronizzazione dati da Supabase:', supabaseItems.length, 'elementi');

      // Converte i dati Supabase al formato locale
      const convertedItems = supabaseItems.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        data: item.data,
        isPlaying: false, // Stato locale di riproduzione
        playingStartTime: null
      }));

      setItems(convertedItems);
      setModified(supabaseModified || false);

      // CORREZIONE: Log senza dipendenza per evitare loop infinito
      console.log(`✅ [RUNDOWN CONTEXT] Sincronizzati ${convertedItems.length} elementi da Supabase`);
    }
  }, [useSupabaseSync, supabaseItems, supabaseModified]); // RIMOSSA dipendenza addLog

  // Effetto per sincronizzare il nome del rundown da Supabase
  useEffect(() => {
    if (useSupabaseSync && supabaseName) {
      setRundownName(supabaseName);
    }
  }, [useSupabaseSync, supabaseName]);

  // CORREZIONE: Effetto per gestire errori Supabase senza loop infinito
  useEffect(() => {
    if (supabaseError) {
      console.error('❌ [RUNDOWN CONTEXT] Errore Supabase:', supabaseError);
    }
  }, [supabaseError]); // RIMOSSA dipendenza addLog

  // CORREZIONE: Effetto per salvare in localStorage senza loop infinito
  useEffect(() => {
    if (!useSupabaseSync && (items.length > 0 || rundownName !== 'Nuovo Rundown' || localStorage.getItem('rundown') !== null)) {
      try {
        const rundownToSave = { name: rundownName, items };
        localStorage.setItem('rundown', JSON.stringify(rundownToSave));
        setModified(true);
        console.log('💾 [RUNDOWN CONTEXT] Rundown salvato in localStorage');
      } catch (error) {
        console.error('❌ [RUNDOWN CONTEXT] Errore nel salvataggio del rundown nel localStorage:', error);
      }
    }
  }, [useSupabaseSync, items, rundownName]); // RIMOSSA dipendenza addLog

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const totalSecondsInDay = 24 * 60 * 60;
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      setTimeIndicatorPosition((currentSeconds / totalSecondsInDay) * 100);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getMediaDuration = useCallback(async (mediaPath) => {
    if (!connected) return '00:05:00';
    try {
      if (typeof addLog === 'function') addLog(`Richiesta durata (stimata) per: ${mediaPath}`);
      const fileExtension = mediaPath.split('.').pop().toLowerCase();
      const defaultDurations = {
        'mp4': '00:02:00', 'mov': '00:01:30', 'avi': '00:03:00', 'mxf': '00:04:00',
        'mp3': '00:03:30', 'wav': '00:01:00',
        'png': '00:00:05', 'jpg': '00:00:05',
      };
      const duration = defaultDurations[fileExtension] || '00:05:00';
      if (typeof addLog === 'function') addLog(`Durata stimata per ${mediaPath}: ${duration}`);
      return duration;
    } catch (error) {
      if (typeof addLog === 'function') addLog(`Errore stima durata: ${error.message}`, 'error');
      return '00:05:00';
    }
  }, [connected, addLog]);

  const addMedia = useCallback(async (mediaData) => {
    // CORREZIONE: Verifica che ci sia un rundown attivo
    if (!activeRundownId) {
      console.error('❌ [RUNDOWN_CONTEXT] Nessun rundown attivo, apertura selettore rundown');
      if (typeof addLog === 'function') {
        addLog('❌ Nessun rundown attivo per aggiungere media', 'error');
      }
      return null;
    }

    console.log('🎯 [RUNDOWN_CONTEXT] Aggiunta media al rundown attivo:', activeRundownId);

    if (useSupabaseSync && addMediaItem) {
      // Usa Supabase per aggiungere il media
      try {
        let duration = mediaData.duration;
        if (!duration && mediaData.clip) {
          duration = await getMediaDuration(mediaData.clip);
        }

        const supabaseMediaData = {
          ...mediaData,
          duration: duration || '00:05:00',
          customName: mediaData.customName || mediaData.name || mediaData.clip?.split('/').pop() || 'Media Sconosciuto'
        };

        const newItem = await addMediaItem(supabaseMediaData);

        // CORREZIONE CRITICA: Verifica che l'elemento sia stato effettivamente aggiunto
        if (!newItem) {
          console.error('❌ [RUNDOWN CONTEXT] addMediaItem ha ritornato null - inserimento fallito');
          if (typeof addLog === 'function') {
            addLog('❌ Errore aggiunta media a Supabase - inserimento fallito', 'error');
          }
          throw new Error('Elemento MEDIA non aggiunto a Supabase - inserimento fallito');
        }

        if (typeof addLog === 'function') {
          addLog(`Media aggiunto a Supabase: ${newItem.name}`);
        }

        console.log('✅ [RUNDOWN CONTEXT] Media aggiunto con successo a Supabase:', newItem);
        return newItem;
      } catch (error) {
        console.error('Errore aggiunta media a Supabase:', error);
        if (typeof addLog === 'function') {
          addLog(`Errore aggiunta media: ${error.message}`, 'error');
        }
        return null;
      }
    } else {
      // Fallback a localStorage
      let duration = mediaData.duration;
      if (!duration && mediaData.clip) {
        duration = await getMediaDuration(mediaData.clip);
      }
      const newItem = {
        id: uuidv4(),
        type: 'MEDIA',
        name: mediaData.name || mediaData.clip?.split('/').pop() || 'Media Sconosciuto',
        data: {
          clip: mediaData.clip,
          channel: mediaData.channel || 1,
          layer: mediaData.layer || 10,
          customName: mediaData.customName || '',
          loop: mediaData.loop || false,
          autoNext: mediaData.autoNext || false,
          linkedTemplate: mediaData.linkedTemplate || null,
          startTime: mediaData.startTime || '00:00:00',
          duration: duration || '00:05:00',
          location: mediaData.location || mediaData.clip,
          note: mediaData.note || '',
          inPoint: mediaData.inPoint || '00:00:00',
          outPoint: mediaData.outPoint || '',
          notificationSent: false,
          errorCount: 0,
          lastError: null,
          lastPlayTime: null
        },
        isPlaying: false,
        playingStartTime: null,
      };
      setItems(prevItems => [...prevItems, newItem].sort((a, b) => (a.data.startTime || "0").localeCompare(b.data.startTime || "0")));
      if (typeof addLog === 'function') addLog(`Media aggiunto (localStorage): ${newItem.name}`);
      return newItem;
    }
  }, [useSupabaseSync, addMediaItem, addLog, getMediaDuration, activeRundownId]);

  const addTemplate = useCallback(async (templateData) => {
    // CORREZIONE: Verifica che ci sia un rundown attivo
    if (!activeRundownId) {
      console.error('❌ [RUNDOWN_CONTEXT] Nessun rundown attivo, apertura selettore rundown');
      if (typeof addLog === 'function') {
        addLog('❌ Nessun rundown attivo per aggiungere template', 'error');
      }
      return null;
    }

    console.log('🎯 [RUNDOWN_CONTEXT] Aggiunta template al rundown attivo:', activeRundownId);

    if (useSupabaseSync && addTemplateItem) {
      // Usa Supabase per aggiungere il template
      try {
        let data = {};
        if (typeof templateData.data === 'string') {
          try {
            data = JSON.parse(templateData.data);
          } catch (error) {
            data = { text: templateData.data };
          }
        } else if (typeof templateData.data === 'object') {
          data = templateData.data;
        }

        const supabaseTemplateData = {
          ...templateData,
          data,
          customName: templateData.customName || templateData.name || templateData.template?.split('/').pop() || 'Template Sconosciuto'
        };

        const newItem = await addTemplateItem(supabaseTemplateData);

        // CORREZIONE CRITICA: Verifica che l'elemento sia stato effettivamente aggiunto
        if (!newItem) {
          console.error('❌ [RUNDOWN CONTEXT] addTemplateItem ha ritornato null - inserimento fallito');
          if (typeof addLog === 'function') {
            addLog('❌ Errore aggiunta template a Supabase - inserimento fallito', 'error');
          }
          throw new Error('Elemento TEMPLATE non aggiunto a Supabase - inserimento fallito');
        }

        if (typeof addLog === 'function') {
          addLog(`Template aggiunto a Supabase: ${newItem.name}`);
        }

        console.log('✅ [RUNDOWN CONTEXT] Template aggiunto con successo a Supabase:', newItem);
        return newItem;
      } catch (error) {
        console.error('Errore aggiunta template a Supabase:', error);
        if (typeof addLog === 'function') {
          addLog(`Errore aggiunta template: ${error.message}`, 'error');
        }
        return null;
      }
    } else {
      // Fallback a localStorage
      let data = {};
      if (typeof templateData.data === 'string') {
        try {
          data = JSON.parse(templateData.data);
        } catch (error) {
          data = { text: templateData.data };
        }
      } else if (typeof templateData.data === 'object') {
        data = templateData.data;
      }
      const newItem = {
        id: uuidv4(),
        type: 'TEMPLATE',
        name: templateData.name || templateData.template?.split('/').pop() || 'Template Sconosciuto',
        data: {
          template: templateData.template,
          channel: templateData.channel || 1,
          layer: templateData.layer || 20,
          cgLayer: templateData.cgLayer || 1,
          playOnLoad: templateData.playOnLoad !== undefined ? templateData.playOnLoad : true,
          data,
          customName: templateData.customName || '',
          startTime: templateData.startTime || '00:00:00',
          duration: templateData.duration || '00:01:00',
          location: templateData.location || templateData.template,
          note: templateData.note || '',
          inPoint: templateData.inPoint || '00:00:00',
          outPoint: templateData.outPoint || '',
          notificationSent: false,
          errorCount: 0,
          lastError: null,
          lastPlayTime: null
        },
        isPlaying: false,
        playingStartTime: null,
      };
      setItems(prevItems => [...prevItems, newItem].sort((a, b) => (a.data.startTime || "0").localeCompare(b.data.startTime || "0")));
      if (typeof addLog === 'function') addLog(`Template aggiunto (localStorage): ${newItem.name}`);
      return newItem;
    }
  }, [useSupabaseSync, addTemplateItem, addLog, activeRundownId]);

  // CORREZIONE CRITICA: Funzione per aggiungere elementi STORY completi al rundown con integrazione Supabase
  const addStory = useCallback(async (storyData) => {
    // CORREZIONE: Verifica che ci sia un rundown attivo
    if (!activeRundownId) {
      console.error('❌ [RUNDOWN_CONTEXT] Nessun rundown attivo, apertura selettore rundown');
      if (typeof addLog === 'function') {
        addLog('❌ Nessun rundown attivo per aggiungere storia', 'error');
      }
      return null;
    }

    console.log('🎯 [RUNDOWN_CONTEXT] Aggiunta storia al rundown attivo:', activeRundownId);

    if (useSupabaseSync && addStoryItem) {
      // Usa Supabase per aggiungere la storia
      try {
        console.log('🔄 [RUNDOWN CONTEXT] Aggiunta storia tramite Supabase:', storyData);

        const supabaseStoryData = {
          ...storyData,
          customName: storyData.customName || storyData.name || 'Storia Sconosciuta'
        };

        const newItem = await addStoryItem(supabaseStoryData);

        // CORREZIONE CRITICA: Verifica che l'elemento sia stato effettivamente aggiunto
        if (!newItem) {
          throw new Error('Elemento STORY non aggiunto a Supabase - possibile problema di permessi RLS');
        }

        if (typeof addLog === 'function') {
          addLog(`Storia aggiunta a Supabase: ${newItem.name}`);
        }

        console.log('✅ [RUNDOWN CONTEXT] Storia aggiunta con successo a Supabase:', newItem);
        return newItem;
      } catch (error) {
        console.error('❌ [RUNDOWN CONTEXT] Errore aggiunta storia a Supabase:', error);
        if (typeof addLog === 'function') {
          addLog(`Errore aggiunta storia a Supabase: ${error.message}`, 'error');
        }
        // Fallback al localStorage in caso di errore
      }
    }

    // Fallback: usa localStorage se Supabase non è disponibile o in caso di errore
    console.log('📁 [RUNDOWN CONTEXT] Aggiunta storia tramite localStorage (fallback):', storyData);

    const newItem = {
      id: uuidv4(),
      type: 'STORY',
      name: storyData.customName || storyData.name || 'Storia Sconosciuta',
      data: {
        customName: storyData.customName || storyData.name || '',
        originalName: storyData.name || '',
        content: storyData.content || '',
        channel: storyData.channel || 1,
        layer: storyData.layer || 10,
        startTime: storyData.startTime || '00:00:00',
        duration: storyData.duration || '00:00:10',
        location: storyData.location || `CH${storyData.channel || 1}-L${storyData.layer || 10}`,
        notes: storyData.notes || '',
        // Mantieni tutti i dettagli originali della storia
        mediaDetails: storyData.mediaDetails || null,
        templateDetails: storyData.templateDetails || null,
        templatesDetails: storyData.templatesDetails || null,
        // Configurazione CasparCG
        casparcgConfig: {
          channel: storyData.channel || 1,
          layer: storyData.layer || 10
        },
        // Timing
        timing: {
          startTime: storyData.startTime || '00:00:00',
          duration: storyData.duration || '00:00:10',
          inPoint: '00:00:00:00',
          outPoint: '00:00:00:00'
        },
        // Dati completi per compatibilità
        ...(storyData.data || {}),
        // Metadati
        notificationSent: false,
        errorCount: 0,
        lastError: null,
        lastPlayTime: null
      },
      isPlaying: false,
      playingStartTime: null,
    };

    setItems(prevItems => [...prevItems, newItem].sort((a, b) => (a.data.startTime || "0").localeCompare(b.data.startTime || "0")));
    if (typeof addLog === 'function') addLog(`Storia aggiunta (localStorage): ${newItem.name}`);
    return newItem;
  }, [useSupabaseSync, addStoryItem, addLog, activeRundownId]);

  const removeItem = useCallback((itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    setPlayingItems(prev => prev.filter(id => id !== itemId));
    if (typeof addLog === 'function') addLog(`Item rimosso: ${itemId}`);
  }, [addLog]);

  const updateItem = useCallback((itemId, newData) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === itemId ? { ...item, ...newData, data: { ...item.data, ...newData.data } } : item
      );
      if (newData.data && newData.data.startTime) {
        return updatedItems.sort((a, b) => (a.data.startTime || "0").localeCompare(b.data.startTime || "0"));
      }
      return updatedItems;
    });
    if (typeof addLog === 'function') addLog(`Item aggiornato: ${itemId}`);
  }, [addLog]);

  const moveItem = useCallback((fromIndex, toIndex) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      return newItems;
    });
    if (typeof addLog === 'function') addLog(`Item spostato da ${fromIndex} a ${toIndex}`);
  }, [addLog]);

  // *** DEFINIZIONE DI stopItem PRIMA DI playItem ***
  const stopItem = useCallback(async (item, isAutoTakeContext = false) => {
    if (!connected || !item) {
      if (typeof addLog === 'function') addLog(`stopItem: Tentativo di stop fallito. Non connesso o item nullo. Connesso: ${connected}, Item ID: ${item ? item.id : 'null'}`, 'warning');
      return;
    }
    if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Chiamata per item "${item.name}" (ID: ${item.id}, Tipo: ${item.type}, AutoTake: ${isAutoTakeContext})`, 'debug');

    // Se l'item che stiamo fermando era quello precaricato, annulla il precaricamento
    if (nextItemPrepared === item.id) {
      setNextItemPrepared(null);
      if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Reset stato precaricamento per "${item.name}"`, 'debug');
    }

    if (item.type === 'MEDIA' && item.data && item.data.linkedTemplate) {
        if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Dettagli linkedTemplate per "${item.name}": ${JSON.stringify(item.data.linkedTemplate)}`, 'debug');
    }

    try {
      if (item.type === 'MEDIA') {
        // Determina se inviare il comando STOP
        let shouldStopMedia = true;

        // PROBLEMA 2: Migliorata logica auto-take per evitare black frames
        if (isAutoTakeContext) {
          const currentIndex = items.findIndex(i => i.id === item.id);
          if (currentIndex !== -1 && currentIndex < items.length - 1) {
            const nextItem = items[currentIndex + 1];
            if (nextItem.type === 'MEDIA' &&
                nextItem.data.channel === item.data.channel &&
                nextItem.data.layer === item.data.layer) {
              // CORREZIONE CRITICA: Non inviare STOP ai media durante auto-take
              shouldStopMedia = false;
              if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Skip STOP per media "${item.name}" - sarà sovrascritto dal PLAY del prossimo media sullo stesso layer (AUTO-TAKE)`, 'info');
            }
          }
        }

        if (shouldStopMedia) {
          if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Invio STOP per media "${item.name}" su canale ${item.data.channel}-${item.data.layer}`, 'info');
          await stop(item.data.channel, item.data.layer);
        }

        if (item.data.linkedTemplate && item.data.linkedTemplate.template) {
          const linked = item.data.linkedTemplate;

          if (!linked.channel || !linked.layer || !linked.cgLayer) {
            if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: ERRORE - Parametri mancanti per CG STOP/REMOVE del template annidato "${linked.name || linked.template}". Canale: ${linked.channel}, Layer Video Template: ${linked.layer}, CGLayer Grafico: ${linked.cgLayer}`, 'error');
          } else {
            if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Invio CG STOP per template annidato "${linked.name || linked.template}" su ${linked.channel}-${linked.layer} (CG: ${linked.cgLayer})`, 'info');
            await cgStop(linked.channel, linked.layer, linked.cgLayer);

            if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Invio CG REMOVE per template annidato "${linked.name || linked.template}" su ${linked.channel}-${linked.layer} (CG: ${linked.cgLayer})`, 'info');
            await cgRemove(linked.channel, linked.layer, linked.cgLayer);
          }
        } else {
            if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Nessun linkedTemplate valido trovato per media "${item.name}".`, 'info');
        }
      } else if (item.type === 'TEMPLATE') {
        if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Invio CG STOP per template principale "${item.name}" su ${item.data.channel}-${item.data.layer}-${item.data.cgLayer}`, 'info');
        await cgStop(item.data.channel, item.data.layer, item.data.cgLayer);
        // Considera se anche i template principali debbano essere rimossi con cgRemove.
        // if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Invio CG REMOVE per template principale "${item.name}"...`, 'info');
        // await cgRemove(item.data.channel, item.data.layer, item.data.cgLayer);
      } else if (item.type === 'STORY') {
        if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Arresto storia "${item.name}"`, 'info');

        // Verifica se la storia ha un media associato
        if (item.data.mediaDetails && item.data.mediaDetails.clipPath) {
          if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Arresto media dalla storia "${item.name}": ${item.data.mediaDetails.clipPath}`, 'info');
          await stop(
            item.data.mediaDetails.channel || item.data.casparcgConfig?.channel || 1,
            item.data.mediaDetails.layer || item.data.casparcgConfig?.layer || 10
          );
        }

        // Verifica se la storia ha template multipli (nuovo formato)
        if (item.data.templatesDetails && item.data.templatesDetails.length > 0) {
          for (let i = 0; i < item.data.templatesDetails.length; i++) {
            const templateDetail = item.data.templatesDetails[i];
            if (templateDetail.templateFile) {
              try {
                if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Arresto template ${i + 1} dalla storia "${item.name}": ${templateDetail.templateFile}`, 'info');
                await cgStop(
                  templateDetail.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
                  templateDetail.casparcgConfig?.layer || 20,
                  templateDetail.casparcgConfig?.cgLayer || 1
                );
                await cgRemove(
                  templateDetail.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
                  templateDetail.casparcgConfig?.layer || 20,
                  templateDetail.casparcgConfig?.cgLayer || 1
                );
              } catch (templateError) {
                console.error(`RUNDOWN_CONTEXT_STOP_ITEM: Errore arresto template ${i + 1} dalla storia:`, templateError);
                if (typeof addLog === 'function') addLog(`Errore arresto template ${i + 1} dalla storia ${item.name}: ${templateError.message}`, 'error');
              }
            }
          }
        }
        // Verifica se la storia ha un template associato (vecchio formato)
        else if (item.data.templateDetails && item.data.templateDetails.templateFile) {
          if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Arresto template dalla storia "${item.name}": ${item.data.templateDetails.templateFile}`, 'info');
          await cgStop(
            item.data.templateDetails.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
            item.data.templateDetails.casparcgConfig?.layer || 20,
            item.data.templateDetails.casparcgConfig?.cgLayer || 1
          );
          await cgRemove(
            item.data.templateDetails.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
            item.data.templateDetails.casparcgConfig?.layer || 20,
            item.data.templateDetails.casparcgConfig?.cgLayer || 1
          );
        }
      }

      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id ? { ...i, isPlaying: false, playingStartTime: null } : i
        )
      );
      setPlayingItems(prev => prev.filter(id => id !== item.id));
      if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_STOP_ITEM: Item "${item.name}" marcato come non in play.`, 'info');

    } catch (error) {
      console.error(`RUNDOWN_CONTEXT_STOP_ITEM: Errore nell'arresto dell'item ${item.id} (${item.name}):`, error);
      if (typeof addLog === 'function') addLog(`Stop fallito per ${item.name}: ${error.message}`, 'error');
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id ? { ...i, isPlaying: false, playingStartTime: null, data: { ...i.data, errorCount: (i.data.errorCount || 0) + 1, lastError: error.message } } : i
        )
      );
    }
  }, [connected, stop, cgStop, cgRemove, addLog, setItems, setPlayingItems, items, nextItemPrepared]);

  // PROBLEMA 3 FIX: Funzione di validazione template
  const validateTemplate = useCallback((templateFile, templateList) => {
    if (!templateFile || !templateList || !Array.isArray(templateList)) {
      return false;
    }

    // Verifica se il template esiste nella lista
    const templateExists = templateList.some(template => {
      // Gestisci diversi formati di template nella lista
      if (typeof template === 'string') {
        return template === templateFile || template.includes(templateFile);
      }
      if (template && template.name) {
        return template.name === templateFile || template.name.includes(templateFile);
      }
      return false;
    });

    if (!templateExists) {
      console.warn(`🚨 [TEMPLATE VALIDATION] Template "${templateFile}" non trovato nella lista template`);
    }

    return templateExists;
  }, []);

  // CRITICAL FIX: Moved before playItem to avoid circular dependency
  const updateItemPlayingStatus = useCallback((itemId, isPlayingStatus) => {
    const now = new Date();
    const currentTimeString = now.toTimeString().substring(0, 8); // HH:MM:SS format
    
    // DEBUG LOGGING: Verifica chiamata funzione
    if (typeof addLog === 'function') {
      addLog(`🔧 UPDATE_STATUS: Item ${itemId.slice(0,8)}... → ${isPlayingStatus ? 'PLAYING' : 'STOPPED'} - START TIME: ${currentTimeString}`, 'info');
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { 
              ...item, 
              isPlaying: isPlayingStatus, 
              playingStartTime: isPlayingStatus ? now : null,
              // AGGIORNAMENTO DINAMICO: Update START TIME con orario reale
              data: isPlayingStatus ? {
                ...item.data,
                startTime: currentTimeString,
                lastPlayTime: now.toISOString(),
                errorCount: 0,
                lastError: null
              } : item.data
            }
          : item
      )
    );
    if (isPlayingStatus) {
        setPlayingItems(prev => prev.includes(itemId) ? prev : [...prev, itemId]);
    } else {
        setPlayingItems(prev => prev.filter(id => id !== itemId));
    }
  }, [setItems, setPlayingItems, addLog]);

  const playItem = useCallback(async (item) => {
    if (!connected || !item) {
      if (typeof addLog === 'function') addLog(`playItem: Tentativo di play fallito. Non connesso o item nullo. Connesso: ${connected}, Item ID: ${item ? item.id : 'null'}`, 'warning');
      return;
    }
    setCurrentItem(item);
    if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Chiamata per item "${item.name}" (ID: ${item.id}, Tipo: ${item.type})`, 'debug');

    try {
      if (item.type === 'MEDIA') {
        const otherMediaPlayingOnSameLayer = items.find(i =>
            i.id !== item.id &&
            i.isPlaying &&
            i.type === 'MEDIA' &&
            i.data.channel === item.data.channel &&
            i.data.layer === item.data.layer
        );
        if (otherMediaPlayingOnSameLayer) {
            if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Trovato altro media "${otherMediaPlayingOnSameLayer.name}" in play sullo stesso canale/layer. Lo fermo.`, 'info');
            await stopItem(otherMediaPlayingOnSameLayer, false); // Chiama la funzione di stop definita qui (non è un autotake)
        }
      }

      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id
            ? { ...i, isPlaying: true, playingStartTime: new Date(), data: { ...i.data, lastPlayTime: new Date().toISOString(), errorCount: 0, lastError: null } }
            : i
        )
      );
      setPlayingItems(prevPlaying => {
        let updatedPlaying = [...prevPlaying];
        if (item.type === 'MEDIA') {
            updatedPlaying = prevPlaying.filter(id => {
                const prevItem = items.find(p => p.id === id);
                return !(prevItem && prevItem.type === 'MEDIA' && prevItem.data.channel === item.data.channel && prevItem.data.layer === item.data.layer && prevItem.id !== item.id);
            });
        }
        if (!updatedPlaying.includes(item.id)) {
          updatedPlaying.push(item.id);
        }
        return updatedPlaying;
      });

      // Se l'item che sta andando in play era quello precaricato, resetta lo stato
      if (nextItemPrepared === item.id) {
        setNextItemPrepared(null);
        if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Reset stato precaricamento per "${item.name}" che ora va in play`, 'debug');
      }

      if (item.type === 'MEDIA') {
        if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Invio PLAY per media "${item.name}" su ${item.data.channel}-${item.data.layer}`, 'info');
        await play(item.data.channel, item.data.layer, item.data.clip, { loop: item.data.loop || false });

        if (item.data.linkedTemplate && item.data.linkedTemplate.template) {
          const linked = item.data.linkedTemplate;
          if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Trovato template annidato "${linked.name || linked.template}" per "${item.name}". Delay: ${linked.delay || 0}ms. Dati: ${JSON.stringify(linked)}`, 'debug');

          setTimeout(async () => {
            try {
              if (!linked.channel || !linked.layer || !linked.cgLayer || !linked.template) {
                if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: ERRORE - Parametri mancanti per CG ADD del template annidato "${linked.name || linked.template}". Canale: ${linked.channel}, Layer: ${linked.layer}, CGLayer: ${linked.cgLayer}, Template: ${linked.template}`, 'error');
                return;
              }

              // PROBLEMA 3 FIX: Validazione template annidato prima della riproduzione
              if (!validateTemplate(linked.template, templateList)) {
                const errorMsg = `Template annidato "${linked.template}" per "${item.name}" non trovato`;
                console.warn(`🚨 [TEMPLATE VALIDATION] ${errorMsg}`);
                if (typeof addLog === 'function') addLog(`AVVISO TEMPLATE: ${errorMsg} - Skip template annidato`, 'warning');
                return; // Skip questo template ma continua con l'auto-sequential
              }

              if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Invio CG ADD per template annidato "${linked.name || linked.template}" su ${linked.channel}-${linked.layer} (CG: ${linked.cgLayer})`, 'info');
              await cgAdd(
                linked.channel,
                linked.layer,
                linked.cgLayer,
                linked.template,
                linked.playOnLoad !== undefined ? linked.playOnLoad : true,
                linked.data || {}
              );
              if (linked.playOnLoad === false) {
                 if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Invio CG PLAY per template annidato "${linked.name}" (playOnLoad: false)`, 'info');
                 await cgPlay(linked.channel, linked.layer, linked.cgLayer);
              }
            } catch (templateError) {
              console.error(`RUNDOWN_CONTEXT_PLAY_ITEM: Errore attivazione template annidato ${linked.template}:`, templateError);
              if (typeof addLog === 'function') addLog(`Errore attivazione template annidato ${linked.template} per ${item.name}: ${templateError.message}`, 'error');
              // PROBLEMA 3 FIX: Non interrompere l'auto-sequential per errori template annidati
            }
          }, linked.delay || 0);
        }

      } else if (item.type === 'TEMPLATE') {
        // PROBLEMA 3 FIX: Validazione template prima della riproduzione
        if (!validateTemplate(item.data.template, templateList)) {
          const errorMsg = `Template "${item.data.template}" non trovato nella lista template disponibili`;
          console.error(`🚨 [TEMPLATE VALIDATION] ${errorMsg}`);
          if (typeof addLog === 'function') addLog(`ERRORE TEMPLATE: ${errorMsg}`, 'error');

          // Non interrompere l'auto-sequential, continua con il prossimo elemento
          throw new Error(errorMsg);
        }

        if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Invio CG ADD per template principale "${item.name}" su ${item.data.channel}-${item.data.layer}-${item.data.cgLayer}`, 'info');
        await cgAdd(
          item.data.channel,
          item.data.layer,
          item.data.cgLayer,
          item.data.template,
          item.data.playOnLoad !== undefined ? item.data.playOnLoad : true,
          item.data.data || {}
        );
        if (item.data.playOnLoad === false) {
            if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Invio CG PLAY per template principale "${item.name}" (playOnLoad: false)`, 'info');
            await cgPlay(item.data.channel, item.data.layer, item.data.cgLayer);
        }
      } else if (item.type === 'STORY') {
        if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Riproduzione storia "${item.name}"`, 'info');

        let hasPlayedSomething = false;

        // Verifica se la storia ha un media associato
        if (item.data.mediaDetails && item.data.mediaDetails.clipPath) {
          if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Riproduzione media dalla storia "${item.name}": ${item.data.mediaDetails.clipPath}`, 'info');
          await play(
            item.data.mediaDetails.channel || item.data.casparcgConfig?.channel || 1,
            item.data.mediaDetails.layer || item.data.casparcgConfig?.layer || 10,
            item.data.mediaDetails.clipPath,
            { loop: item.data.mediaDetails.loop || false }
          );
          hasPlayedSomething = true;
        }

        // Verifica se la storia ha template multipli (nuovo formato)
        if (item.data.templatesDetails && item.data.templatesDetails.length > 0) {
          for (let i = 0; i < item.data.templatesDetails.length; i++) {
            const templateDetail = item.data.templatesDetails[i];
            if (templateDetail.templateFile) {
              const startDelay = templateDetail.timing?.startDelay || 0;
              const autoStart = templateDetail.timing?.autoStart !== false;

              if (autoStart) {
                const executeTemplate = async () => {
                  try {
                    // PROBLEMA 3 FIX: Validazione template prima della riproduzione
                    if (!validateTemplate(templateDetail.templateFile, templateList)) {
                      const errorMsg = `Template "${templateDetail.templateFile}" (${i + 1}) dalla storia "${item.name}" non trovato`;
                      console.warn(`🚨 [TEMPLATE VALIDATION] ${errorMsg}`);
                      if (typeof addLog === 'function') addLog(`AVVISO TEMPLATE: ${errorMsg} - Skip template`, 'warning');
                      return; // Skip questo template ma continua con gli altri
                    }

                    if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Riproduzione template ${i + 1} dalla storia "${item.name}": ${templateDetail.templateFile}`, 'info');
                    await cgAdd(
                      templateDetail.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
                      templateDetail.casparcgConfig?.layer || 20,
                      templateDetail.casparcgConfig?.cgLayer || 1,
                      templateDetail.templateFile,
                      templateDetail.casparcgConfig?.playOnLoad !== undefined ? templateDetail.casparcgConfig.playOnLoad : true,
                      templateDetail.instanceData || {}
                    );
                    if (templateDetail.casparcgConfig?.playOnLoad === false) {
                      await cgPlay(
                        templateDetail.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
                        templateDetail.casparcgConfig?.layer || 20,
                        templateDetail.casparcgConfig?.cgLayer || 1
                      );
                    }
                  } catch (templateError) {
                    console.error(`RUNDOWN_CONTEXT_PLAY_ITEM: Errore riproduzione template ${i + 1} dalla storia:`, templateError);
                    if (typeof addLog === 'function') addLog(`Errore riproduzione template ${i + 1} dalla storia ${item.name}: ${templateError.message}`, 'error');
                    // PROBLEMA 3 FIX: Non interrompere l'auto-sequential per errori template
                    // Continua con il prossimo template o elemento
                  }
                };

                if (startDelay > 0) {
                  setTimeout(executeTemplate, startDelay * 1000);
                } else {
                  await executeTemplate();
                }
                hasPlayedSomething = true;
              }
            }
          }
        }
        // Verifica se la storia ha un template associato (vecchio formato)
        else if (item.data.templateDetails && item.data.templateDetails.templateFile) {
          if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Riproduzione template dalla storia "${item.name}": ${item.data.templateDetails.templateFile}`, 'info');
          await cgAdd(
            item.data.templateDetails.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
            item.data.templateDetails.casparcgConfig?.layer || 20,
            item.data.templateDetails.casparcgConfig?.cgLayer || 1,
            item.data.templateDetails.templateFile,
            item.data.templateDetails.casparcgConfig?.playOnLoad !== undefined ? item.data.templateDetails.casparcgConfig.playOnLoad : true,
            item.data.templateDetails.instanceData || {}
          );
          if (item.data.templateDetails.casparcgConfig?.playOnLoad === false) {
            await cgPlay(
              item.data.templateDetails.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
              item.data.templateDetails.casparcgConfig?.layer || 20,
              item.data.templateDetails.casparcgConfig?.cgLayer || 1
            );
          }
          hasPlayedSomething = true;
        }

        if (!hasPlayedSomething) {
          if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_PLAY_ITEM: Storia "${item.name}" non ha media o template associati`, 'warning');
        }
      }
      
      // CRITICAL FIX: Aggiorna stato di riproduzione per timing dinamico
      if (typeof addLog === 'function') addLog(`🔧 PLAY_ITEM: Calling updateItemPlayingStatus for "${item.name}"`, 'debug');
      updateItemPlayingStatus(item.id, true);
      
    } catch (error) {
      console.error(`RUNDOWN_CONTEXT_PLAY_ITEM: Errore nella riproduzione dell'item ${item.id} (${item.name}):`, error);
      if (typeof addLog === 'function') addLog(`Play fallito per ${item.name}: ${error.message}`, 'error');
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id
            ? { ...i, isPlaying: false, playingStartTime: null, data: { ...i.data, errorCount: (i.data.errorCount || 0) + 1, lastError: error.message } }
            : i
        )
      );
      setPlayingItems(prev => prev.filter(id => id !== item.id));
    }
  }, [connected, play, cgAdd, cgPlay, items, addLog, setItems, setPlayingItems, stopItem, nextItemPrepared, validateTemplate, templateList, updateItemPlayingStatus]);


  const removeTemplate = useCallback(async (item) => {
    if (!connected || !item || item.type !== 'TEMPLATE') return;
    try {
      if (typeof addLog === 'function') addLog(`RUNDOWN_CONTEXT_REMOVE_TEMPLATE: Invio CG REMOVE per template "${item.name}" su ${item.data.channel}-${item.data.layer}-${item.data.cgLayer}`, 'info');
      await cgRemove(item.data.channel, item.data.layer, item.data.cgLayer);
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id ? { ...i, isPlaying: false, playingStartTime: null } : i
        )
      );
      setPlayingItems(prev => prev.filter(id => id !== item.id));
    } catch (error) {
      if (typeof addLog === 'function') addLog(`Errore rimozione template (REMOVE_TEMPLATE): ${error.message}`, 'error');
    }
  }, [connected, cgRemove, addLog, setItems, setPlayingItems]);

  const updateTemplate = useCallback(async (item, newData) => {
    if (!connected || !item || item.type !== 'TEMPLATE') return;
    try {
      if (!item.isPlaying) {
         if (typeof addLog === 'function') addLog(`Tentativo di update su template non in play: ${item.name}.`, 'warning');
      }
      if (cgUpdate) {
        await cgUpdate(item.data.channel, item.data.layer, item.data.cgLayer, newData);
        updateItem(item.id, { data: { ...item.data, data: newData } });
        if (typeof addLog === 'function') addLog(`Template aggiornato: ${item.name}`);
      } else {
        if (typeof addLog === 'function') addLog(`cgUpdate non disponibile in CasparContext. Impossibile aggiornare ${item.name}.`, 'error');
      }
    } catch (error) {
      if (typeof addLog === 'function') addLog(`Errore aggiornamento template ${item.name}: ${error.message}`, 'error');
    }
  }, [connected, cgUpdate, updateItem, addLog]);

  // Funzione per precaricare il prossimo elemento
  const prepareNextItem = useCallback(async (item) => {
    if (!connected || !item || item.type !== 'MEDIA' || !item.data || !item.data.clip) {
      if (typeof addLog === 'function') addLog(`Precaricamento fallito: item non valido o non è un media. ID: ${item ? item.id : 'null'}`, 'warning');
      return;
    }

    // Se l'elemento è già precaricato, non fare nulla
    if (nextItemPrepared === item.id) {
      if (typeof addLog === 'function') addLog(`Item "${item.name}" già precaricato.`, 'debug');
      return;
    }

    try {
      if (typeof addLog === 'function') addLog(`Precaricamento media "${item.name}" su ${item.data.channel}-${item.data.layer}`, 'info');

      // Invia il comando LOADBG per precaricare il media
      await loadbg(item.data.channel, item.data.layer, item.data.clip, {
        loop: item.data.loop || false,
        auto: false,  // Non riprodurre automaticamente
        transition: 'CUT',
        duration: 0
      });

      // Salva l'ID dell'elemento precaricato
      setNextItemPrepared(item.id);

      if (typeof addLog === 'function') addLog(`Media "${item.name}" precaricato con successo.`, 'info');
    } catch (error) {
      console.error(`Errore durante il precaricamento di ${item.name}:`, error);
      if (typeof addLog === 'function') addLog(`Errore precaricamento media ${item.name}: ${error.message}`, 'error');
    }
  }, [connected, loadbg, addLog, nextItemPrepared]);

  // SISTEMA LOOP CORRETTO: Eliminato bug di stale closure
  const playAll = useCallback((enableLoop = false) => {
    // DEBUG CRITICO: Verifica chiamata playAll
    if (typeof addLog === 'function') {
      addLog(`🚀 PLAYALL CALLED: enableLoop=${enableLoop}, connected=${connected}, items=${items.length}`, 'info');
    }
    
    if (!connected || items.length === 0) {
      if (typeof addLog === 'function') {
        addLog('❌ AUTOPLAY: Impossibile avviare - non connesso o lista vuota', 'warning');
      }
      return;
    }
    
    // CORREZIONE CRITICA: Stop eventuali loop precedenti
    if (loopControlRef.current.timerId) {
      clearTimeout(loopControlRef.current.timerId);
      loopControlRef.current.timerId = null;
    }
    
    // Imposta flag di controllo interno
    loopControlRef.current = {
      running: true,
      shouldLoop: enableLoop,
      currentIndex: 0,
      timerId: null
    };
    
    // Aggiorna stati React per UI
    setAutoPlay(true);
    setCurrentPlayingIndex(0);
    setLoopEnabled(enableLoop);
    setRundownIsLooping(false);
    
    if (typeof addLog === 'function') {
      addLog(`🚀 AUTOPLAY FIXED: Avvio ${enableLoop ? 'LOOP INFINITO' : 'sequenziale'} - ${items.length} elementi`, 'info');
    }

    // CORREZIONE: Sistema autonomo senza dipendenze da closure
    const executeSequence = () => {
      const playNext = () => {
        // CORREZIONE: Controllo su ref invece di stato React
        if (!loopControlRef.current.running) {
          if (typeof addLog === 'function') addLog('⏹️ AUTOPLAY: Fermato manualmente', 'info');
          return;
        }
        
        const currentIndex = loopControlRef.current.currentIndex;
        
        // LOOP: Gestione fine playlist
        if (currentIndex >= items.length) {
          if (loopControlRef.current.shouldLoop) {
            if (typeof addLog === 'function') addLog('🔄 AUTOPLAY LOOP: Fine playlist - Riavvio dal primo', 'info');
            setRundownIsLooping(true);
            loopControlRef.current.currentIndex = 0;
            setCurrentPlayingIndex(0);
            
            // Pausa prima del riavvio
            loopControlRef.current.timerId = setTimeout(() => {
              setRundownIsLooping(false);
              playNext();
            }, 1500);
            return;
          } else {
            // Fine playlist senza loop
            if (typeof addLog === 'function') addLog('✅ AUTOPLAY: Playlist completata - Stop', 'info');
            loopControlRef.current.running = false;
            setAutoPlay(false);
            setCurrentPlayingIndex(-1);
            return;
          }
        }
        
        const currentItem = items[currentIndex];
        if (!currentItem) {
          if (typeof addLog === 'function') addLog(`❌ AUTOPLAY: Elemento ${currentIndex + 1} non trovato`, 'error');
          loopControlRef.current.currentIndex++;
          playNext();
          return;
        }
        
        if (typeof addLog === 'function') {
          addLog(`▶️ AUTOPLAY: [${currentIndex + 1}/${items.length}] "${currentItem.name}" (${currentItem.type})`, 'info');
        }
        
        setCurrentPlayingIndex(currentIndex);
        
        // STATI DINAMICI: Aggiorna stati ON AIR/NEXT
        updateItemStates(currentIndex);
        
        // Riproduzione asincrona dell'elemento
        playItem(currentItem)
          .then(() => {
            // Calcola durata per timing
            let durationMs = 5000; // Default 5 secondi
            
            if (currentItem.data?.duration) {
              try {
                const [h, m, s] = currentItem.data.duration.split(':').map(Number);
                durationMs = (h * 3600 + m * 60 + s) * 1000;
                if (durationMs <= 0 || isNaN(durationMs)) durationMs = 5000;
              } catch (e) {
                if (typeof addLog === 'function') {
                  addLog(`⚠️ AUTOPLAY: Durata non valida per "${currentItem.name}", uso 5s`, 'warning');
                }
              }
            }
            
            // Template hanno durata più breve
            if (currentItem.type === 'TEMPLATE') {
              durationMs = Math.min(durationMs, 3000);
            }
            
            if (typeof addLog === 'function') {
              addLog(`⏱️ AUTOPLAY: Attesa ${Math.round(durationMs/1000)}s per "${currentItem.name}"`, 'debug');
            }
            
            // OSC-BASED MEDIA END DETECTION: Sostituisce setTimeout fisso
            const startOSCMonitoring = () => {
              const channelLayer = `${currentItem.data?.channel || 1}-${currentItem.data?.layer || 10}`;
              let lastTimecode = null;
              let stuckCount = 0;
              const STUCK_THRESHOLD = 2; // Considerato "finito" dopo 2 controlli consecutivi con stesso timecode
              const CHECK_INTERVAL = 1000; // Controlla ogni 1 secondo (ridotto da 500ms per evitare loop troppo rapidi)
              
              // DEBUG CRITICO: Verifica che la funzione sia chiamata
              if (typeof addLog === 'function') {
                addLog(`🚀 START_OSC_MONITOR: Chiamata per "${currentItem.name}" - Tipo: ${currentItem.type}`, 'info');
                addLog(`🔍 OSC_MONITOR_INIT: oscConnected=${oscConnected}, loopRunning=${loopControlRef.current.running}`, 'info');
              }
              
              if (typeof addLog === 'function') {
                addLog(`🎯 OSC MONITOR: Inizio monitoraggio "${currentItem.name}" su ${channelLayer}`, 'info');
                addLog(`🔍 MONITOR DEBUG: OSC Connected: ${oscConnected}, OSC Data keys: ${oscData ? Object.keys(oscData).join(',') : 'NULL'}`, 'info');
              }
              
              const monitorOSC = () => {
                if (!loopControlRef.current.running) {
                  if (typeof addLog === 'function') addLog('⏹️ OSC MONITOR: Stop monitoraggio (loop fermato)', 'debug');
                  return;
                }
                
                // Verifica connessione OSC e disponibilità dati
                if (!oscConnected || !oscData || !oscData[channelLayer]) {
                  // Fallback a setTimeout se OSC non disponibile
                  if (typeof addLog === 'function') {
                    addLog(`⚠️ OSC MONITOR: OSC non disponibile per ${channelLayer}, fallback a timer fisso (${Math.round(durationMs/1000)}s)`, 'warning');
                  }
                  loopControlRef.current.timerId = setTimeout(() => {
                    loopControlRef.current.currentIndex++;
                    playNext();
                  }, durationMs);
                  return;
                }
                
                // NUOVO SISTEMA: Frame-based end detection invece di stuck timecode
                const oscChannelData = oscData[channelLayer];
                
                // DEBUG CRITICO: Log struttura completa OSC data
                if (typeof addLog === 'function') {
                  addLog(`🔍 DEBUG OSC: ${channelLayer} - Data disponibile: ${JSON.stringify(oscChannelData)}`, 'info');
                  addLog(`🔍 OSC KEYS: Chiavi disponibili: ${oscChannelData ? Object.keys(oscChannelData).join(', ') : 'NESSUN DATO'}`, 'info');
                }
                
                // SAFE TIMECODE EXTRACTION: Handle both string and object formats
                let currentTimecode = oscChannelData?.timecode;
                
                // CRITICAL FIX: Ensure timecode is a string
                if (currentTimecode && typeof currentTimecode === 'object') {
                  // If timecode is an object, try to extract the actual timecode value
                  currentTimecode = currentTimecode.timecode || currentTimecode.value || String(currentTimecode);
                }
                if (currentTimecode && typeof currentTimecode !== 'string') {
                  currentTimecode = String(currentTimecode);
                }
                
                const currentFrame = oscChannelData?.frame;
                const totalFrames = oscChannelData?.nb_frames || oscChannelData?.length;
                const isPaused = oscChannelData?.paused;
                
                if (typeof addLog === 'function') {
                  addLog(`🎬 OSC FRAME: ${channelLayer} - TC:${currentTimecode} Frame:${currentFrame}/${totalFrames} Paused:${isPaused}`, 'debug');
                }
                
                // Verifica se abbiamo dati di frame validi
                if (currentFrame !== undefined && totalFrames !== undefined && totalFrames > 0) {
                  // FRAME-BASED DETECTION: Verifica se siamo vicini alla fine del media
                  const frameProgress = currentFrame / totalFrames;
                  const isNearEnd = frameProgress >= 0.98; // 98% del media completato
                  
                  if (isNearEnd || currentFrame >= totalFrames - 2) {
                    // Media finito - calcola durata effettiva basata su tempo reale
                    const actualDuration = calculateActualDuration(currentItem, currentTimecode);
                    updateItemDuration(currentItem.id, actualDuration);
                    
                    if (typeof addLog === 'function') {
                      addLog(`✅ FRAME END: "${currentItem.name}" completato (${currentFrame}/${totalFrames}) - TC:${currentTimecode} - Durata: ${actualDuration}`, 'info');
                    }
                    loopControlRef.current.currentIndex++;
                    playNext();
                    return;
                  }
                  
                  // Media in riproduzione normale
                  if (typeof addLog === 'function' && Math.random() < 0.1) { // Log solo 10% delle volte per ridurre spam
                    addLog(`▶️ FRAME PROGRESS: "${currentItem.name}" - ${Math.round(frameProgress * 100)}% (${currentFrame}/${totalFrames})`, 'debug');
                  }
                  
                } else if (currentTimecode && !totalFrames) {
                  // FALLBACK AVANZATO: Timecode-based detection intelligente
                  if (typeof addLog === 'function') {
                    addLog(`🔍 TC ANALYSIS: ${currentTimecode} (Last: ${lastTimecode})`, 'debug');
                  }
                  
                  // Rilevamento avanzato: reset del timecode (media che ricomincia)
                  if (lastTimecode && currentTimecode) {
                    try {
                      // SAFE TIMECODE PARSING: Prevent crashes with invalid formats
                      const parseTimecodeToSeconds = (timecode) => {
                        if (!timecode || typeof timecode !== 'string') return 0;
                        const parts = timecode.split(':');
                        if (parts.length < 3) return 0;
                        
                        const hours = parseInt(parts[0]) || 0;
                        const minutes = parseInt(parts[1]) || 0;
                        const seconds = parseInt(parts[2]) || 0;
                        
                        return hours * 3600 + minutes * 60 + seconds;
                      };
                      
                      const currentSeconds = parseTimecodeToSeconds(currentTimecode);
                      const lastSeconds = parseTimecodeToSeconds(lastTimecode);
                    
                      // RILEVAMENTO RESET: Se il timecode torna a 0 o diminuisce significativamente
                      if (currentSeconds < lastSeconds - 1 || (lastSeconds > 2 && currentSeconds < 1)) {
                        const actualDuration = calculateActualDuration(currentItem, lastTimecode);
                        updateItemDuration(currentItem.id, actualDuration);
                        
                        if (typeof addLog === 'function') {
                          addLog(`✅ TC RESET: "${currentItem.name}" fine rilevata (reset ${lastSeconds}s → ${currentSeconds}s) - Durata: ${actualDuration}`, 'info');
                        }
                        loopControlRef.current.currentIndex++;
                        playNext();
                        return;
                      }
                      
                    } catch (timecodeError) {
                      if (typeof addLog === 'function') {
                        addLog(`⚠️ TIMECODE PARSE ERROR: ${timecodeError.message} - TC: ${currentTimecode}`, 'warning');
                      }
                      // Continue with stuck detection as fallback
                    }
                  }
                  
                  // RILEVAMENTO STUCK AVANZATO: Gestisce entrambi i casi
                  if (currentTimecode === lastTimecode) {
                    stuckCount++;
                    if (typeof addLog === 'function') {
                      addLog(`🔍 TC STUCK: ${currentTimecode} stuck ${stuckCount}/${STUCK_THRESHOLD} volte`, 'debug');
                    }
                    
                    // ENHANCED DETECTION: Controlla se il timecode è bloccato su un valore di fine
                    let isAtEndValue = false;
                    try {
                      if (currentTimecode && typeof currentTimecode === 'string') {
                        isAtEndValue = (
                          currentTimecode.includes('05:01') || // Common end pattern from logs
                          currentTimecode.includes('05:00') || 
                          currentTimecode.includes('04:24') ||
                          currentTimecode.includes('04:23')
                        );
                        
                        // Also check if frames part indicates end
                        const parts = currentTimecode.split(':');
                        if (parts.length >= 3) {
                          const frames = parseFloat(parts[2]) || 0;
                          if (frames > 23) isAtEndValue = true; // PAL/NTSC frame overflow
                        }
                      }
                    } catch (e) {
                      // Safe fallback
                      isAtEndValue = false;
                    }
                    
                    if (stuckCount >= STUCK_THRESHOLD || (isAtEndValue && stuckCount >= 1)) {
                      const actualDuration = calculateActualDuration(currentItem, currentTimecode);
                      updateItemDuration(currentItem.id, actualDuration);
                      
                      if (typeof addLog === 'function') {
                        addLog(`✅ TC END: "${currentItem.name}" fine rilevata (stuck ${stuckCount}x) - TC:${currentTimecode} - Durata: ${actualDuration}`, 'info');
                      }
                      loopControlRef.current.currentIndex++;
                      playNext();
                      return;
                    }
                  } else {
                    // Reset stuck counter when timecode progresses
                    if (stuckCount > 0 && typeof addLog === 'function') {
                      addLog(`▶️ TC PROGRESS: ${lastTimecode} → ${currentTimecode} (reset stuck counter)`, 'debug');
                    }
                    stuckCount = 0;
                    lastTimecode = currentTimecode;
                  }
                  
                } else if (currentItem.type === 'TEMPLATE') {
                  // Template handling - uso timer fisso
                  const templateDuration = Math.min(durationMs, 3000);
                  if (typeof addLog === 'function') {
                    addLog(`🎨 TEMPLATE: "${currentItem.name}" - timer fisso ${templateDuration}ms`, 'debug');
                  }
                  loopControlRef.current.timerId = setTimeout(() => {
                    loopControlRef.current.currentIndex++;
                    playNext();
                  }, templateDuration);
                  return;
                  
                } else {
                  // Nessun dato OSC utile - fallback a timer
                  if (typeof addLog === 'function') {
                    addLog(`⚠️ OSC FALLBACK: Nessun dato frame/timecode per ${channelLayer}, uso timer ${Math.round(durationMs/1000)}s`, 'warning');
                  }
                  loopControlRef.current.timerId = setTimeout(() => {
                    loopControlRef.current.currentIndex++;
                    playNext();
                  }, durationMs);
                  return;
                }
                
                // Continua monitoraggio
                loopControlRef.current.timerId = setTimeout(monitorOSC, CHECK_INTERVAL);
              };
              
              // Inizia monitoraggio dopo breve delay per permettere al media di iniziare
              if (typeof addLog === 'function') {
                addLog(`⏱️ OSC_TIMEOUT: Impostazione timeout 1000ms per "${currentItem.name}"`, 'info');
              }
              loopControlRef.current.timerId = setTimeout(monitorOSC, 1000);
            };
            
            // DEBUG CRITICO: Verifica che startOSCMonitoring sia chiamato
            if (typeof addLog === 'function') {
              addLog(`🔧 CALLING startOSCMonitoring per "${currentItem.name}"`, 'info');
            }
            startOSCMonitoring();
            
          })
          .catch((error) => {
            if (typeof addLog === 'function') {
              addLog(`❌ AUTOPLAY ERRORE: "${currentItem.name}" - ${error.message} - Continuo`, 'error');
            }
            
            // In caso di errore, passa al prossimo dopo 1 secondo
            loopControlRef.current.timerId = setTimeout(() => {
              loopControlRef.current.currentIndex++;
              playNext();
            }, 1000);
          });
      };
      
      // Avvia la sequenza
      playNext();
    };
    
    // Avvia immediatamente
    executeSequence();
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, items, playItem, setAutoPlay, setCurrentPlayingIndex, setLoopEnabled, setRundownIsLooping, addLog, oscConnected, oscData]);

  // SISTEMA CORRETTO: Logica autonoma senza stale closures

  const stopAll = useCallback(() => {
    // SISTEMA SEMPLIFICATO: Stop immediato e pulizia stati
    setAutoPlay(false);
    setCurrentPlayingIndex(-1);
    setRundownIsLooping(false);
    setLoopEnabled(false);
    
    // CORREZIONE: Stop sistema loop e pulizia timer OSC
    if (loopControlRef.current.timerId) {
      clearTimeout(loopControlRef.current.timerId);
      loopControlRef.current.timerId = null;
    }
    loopControlRef.current.running = false;
    
    // Ferma tutti gli elementi in riproduzione
    playingItems.forEach(itemId => {
      const itemToStop = items.find(i => i.id === itemId);
      if (itemToStop) stopItem(itemToStop, false);
    });
    
    setPlayingItems([]);
    setItems(prev => prev.map(i => ({
      ...i, 
      isPlaying: false, 
      playingStartTime: null,
      // RESET STATI: Resetta tutti gli stati ON AIR/NEXT
      data: {
        ...i.data,
        itemState: 'normal'
      }
    })));
    
    if (typeof addLog === 'function') addLog('⏹️ AUTOPLAY: Stop completo - Sistema loop fermato e tutti gli elementi fermati', 'info');
  }, [items, stopItem, playingItems, setPlayingItems, setItems, setAutoPlay, setCurrentPlayingIndex, setRundownIsLooping, setLoopEnabled, addLog]);

  const saveRundown = useCallback(() => {
    const rundownData = { name: rundownName, items };
    const blob = new Blob([JSON.stringify(rundownData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rundownName.replace(/\s+/g, '_') || 'rundown'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setModified(false);
    if (typeof addLog === 'function') addLog(`Rundown salvato: ${rundownName}`);
  }, [rundownName, items, addLog]);

  const processPlaylistItems = useCallback((playlistItemsToProcess) => {
    return playlistItemsToProcess.map(pItem => {
        // Se l'elemento è di tipo STORY, preserva la struttura originale dei dati
        if (pItem.type === 'STORY') {
            console.log(`[RUNDOWN_CONTEXT] Processando elemento STORY: ${pItem.name}`, pItem.data);
            return {
                id: pItem.id || uuidv4(),
                type: 'STORY',
                name: pItem.name || 'Storia Importata',
                data: {
                    // Preserva tutti i dati originali della storia
                    ...pItem.data,
                    // Assicurati che i campi base siano presenti
                    startTime: pItem.data?.startTime || '00:00:00',
                    duration: pItem.data?.duration || '00:01:00',
                    customName: pItem.data?.customName || pItem.name || 'Storia Importata',
                    originalName: pItem.data?.originalName || pItem.name || 'Storia Importata',
                    notificationSent: false,
                    errorCount: 0,
                    lastError: null,
                    lastPlayTime: null
                },
                isPlaying: false,
                playingStartTime: null,
            };
        }

        // Per elementi MEDIA e TEMPLATE, usa la logica esistente
        const baseData = {
            clip: pItem.data?.clip || (pItem.type !== 'TEMPLATE' ? pItem.path : undefined),
            template: pItem.data?.template || (pItem.type === 'TEMPLATE' ? pItem.path : undefined),
            channel: pItem.data?.channel || pItem.channel || 1,
            layer: pItem.data?.layer || pItem.layer || (pItem.type === 'TEMPLATE' ? 20 : 10),
            cgLayer: pItem.data?.cgLayer || pItem.cgLayer || 1,
            customName: pItem.data?.customName || pItem.customName || '',
            startTime: pItem.data?.startTime || pItem.startTime || '00:00:00',
            duration: pItem.data?.duration || pItem.duration || '00:01:00',
            data: pItem.data?.data || pItem.data || {},
            loop: pItem.data?.loop || pItem.loop || false,
            playOnLoad: pItem.data?.playOnLoad !== undefined ? pItem.data.playOnLoad : true,
            linkedTemplate: pItem.data?.linkedTemplate || pItem.linkedTemplate || null,
            location: pItem.data?.location || pItem.location || pItem.path,
            note: pItem.data?.note || pItem.note || '',
            inPoint: pItem.data?.inPoint || pItem.inPoint || '00:00:00',
            outPoint: pItem.data?.outPoint || pItem.outPoint || '',
            notificationSent: false,
            errorCount: 0,
            lastError: null,
            lastPlayTime: null
        };
        return {
            id: pItem.id || uuidv4(),
            type: pItem.type || (pItem.path?.endsWith('.html') || pItem.path?.endsWith('.ft') ? 'TEMPLATE' : 'MEDIA'),
            name: pItem.name || pItem.path?.split('/').pop() || 'Elemento importato',
            data: baseData,
            isPlaying: false,
            playingStartTime: null,
        };
    });
  }, []);

  const loadRundown = useCallback((pathOrData) => {
    const loadData = (data) => {
        if (data && data.items && Array.isArray(data.items)) {
            const processed = processPlaylistItems(data.items);
            const sortedItems = processed.sort((a, b) => (a.data.startTime || "0").localeCompare(b.data.startTime || "0"));
            setItems(sortedItems);
            setRundownName(data.name || 'Rundown Caricato');
            setPlayingItems([]);
            setModified(false);
            if (typeof addLog === 'function') addLog(`Rundown caricato: ${data.name || 'Senza Nome'} (${sortedItems.length} items)`);
        } else {
            if (typeof addLog === 'function') addLog('Formato rundown non valido durante il caricamento.', 'error');
        }
    };
    if (typeof pathOrData === 'string') {
        fetch(pathOrData)
            .then(response => {
                if (!response.ok) throw new Error(`Errore HTTP ${response.status} nel caricare ${pathOrData}`);
                return response.json();
            })
            .then(data => loadData(data))
            .catch(error => {
                console.error('Errore caricamento rundown da path:', error);
                if (typeof addLog === 'function') addLog(`Errore caricamento rundown da ${pathOrData}: ${error.message}`, 'error');
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = e => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = re => {
                            try {
                                const jsonData = JSON.parse(re.target.result);
                                loadData(jsonData);
                            } catch (parseError) {
                                if (typeof addLog === 'function') addLog(`Errore parsing file rundown: ${parseError.message}`, 'error');
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });
    } else if (typeof pathOrData === 'object' && pathOrData !== null) {
        loadData(pathOrData);
    } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = re => {
                    try {
                        const jsonData = JSON.parse(re.target.result);
                        loadData(jsonData);
                    } catch (parseError) {
                        if (typeof addLog === 'function') addLog(`Errore parsing file rundown: ${parseError.message}`, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
  }, [addLog, processPlaylistItems]);

  const clearRundown = useCallback(() => {
    setItems([]);
    setCurrentItem(null);
    setRundownName('Nuovo Rundown');
    setPlayingItems([]);
    if (typeof addLog === 'function') addLog('Rundown pulito');
  }, [addLog]);

  // Funzione per aggiornare il nome del rundown
  const updateRundownNameWrapper = useCallback(async (newName) => {
    if (useSupabaseSync && updateRundownName) {
      try {
        await updateRundownName(newName);
        if (typeof addLog === 'function') {
          addLog(`Nome rundown aggiornato in Supabase: ${newName}`);
        }
      } catch (error) {
        console.error('Errore aggiornamento nome rundown:', error);
        if (typeof addLog === 'function') {
          addLog(`Errore aggiornamento nome: ${error.message}`, 'error');
        }
        // Fallback locale
        setRundownName(newName);
      }
    } else {
      // Fallback localStorage
      setRundownName(newName);
      if (typeof addLog === 'function') {
        addLog(`Nome rundown aggiornato (localStorage): ${newName}`);
      }
    }
  }, [useSupabaseSync, updateRundownName, addLog]);

  const toggleScheduledPlayback = useCallback(() => {
    setScheduledPlayback(prev => {
        if (typeof addLog === 'function') addLog(`Riproduzione pianificata ${!prev ? 'attivata' : 'disattivata'}`);
        return !prev;
    });
  }, [addLog]);

  const setDayStart = useCallback((time) => {
    setDayStartTime(time);
    if (typeof addLog === 'function') addLog(`Ora inizio giornata impostata a: ${time}`);
  }, [addLog]);

  const calculateEndTime = useCallback((sTime, dur) => {
    if (!sTime || !dur) return '';
    try {
        const [sh, sm, ss] = sTime.split(':').map(Number);
        const [dh, dm, ds] = dur.split(':').map(Number);
        let totalSeconds = sh * 3600 + sm * 60 + ss + dh * 3600 + dm * 60 + ds;
        const endH = Math.floor(totalSeconds / 3600) % 24;
        totalSeconds %= 3600;
        const endM = Math.floor(totalSeconds / 60);
        const endS = totalSeconds % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}`;
    } catch (e) { return ''; }
  }, []);

  const sortItemsByStartTime = useCallback(() => {
    setItems(prevItems =>
        [...prevItems].sort((a, b) => (a.data.startTime || "0").localeCompare(b.data.startTime || "0"))
    );
    if (typeof addLog === 'function') addLog('Elementi ordinati per ora di inizio');
  }, [addLog]);

  const showNotification = useCallback((title, message, type = 'info') => {
    if (typeof addLog === 'function') addLog(`[${type.toUpperCase()}] ${title}: ${message}`);
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
            if (p === 'granted') new Notification(title, { body: message });
        });
    }
  }, [addLog]);

  useEffect(() => {
    if (!scheduledPlayback || items.length === 0) return;
    const checkScheduledItems = () => {
      const now = new Date();
      const currentTimeString = now.toTimeString().substring(0, 8);
      items.forEach(item => {
        if (item.data.startTime && !item.isPlaying && item.data.startTime === currentTimeString) {
            playItem(item);
        }
      });
    };
    const timer = setInterval(checkScheduledItems, 1000);
    return () => clearInterval(timer);
  }, [items, scheduledPlayback, playItem]); // playItem è ora una dipendenza

  const getItemById = useCallback((itemId) => items.find(item => item.id === itemId), [items]);

  // HELPER FUNCTIONS per aggiornamento timing dinamico - Moved before playAll to avoid circular dependencies
  const calculateActualDuration = useCallback((item, finalTimecode) => {
    // DEBUG CRITICO: Verifica chiamata funzione
    if (typeof addLog === 'function') {
      addLog(`🔧 CALC_DURATION CALLED: ${item.name} - playingStartTime: ${!!item.playingStartTime}`, 'info');
    }
    
    if (!item.playingStartTime) {
      if (typeof addLog === 'function') {
        addLog(`⚠️ CALC_DURATION: Missing playingStartTime for ${item.name}`, 'warning');
      }
      return item.data?.duration || '00:00:05';
    }
    
    try {
      // CORRETTO: Calcola la durata effettiva basata sul tempo reale trascorso
      const startTime = new Date(item.playingStartTime);
      const endTime = new Date(); // Ora corrente = fine riproduzione
      const elapsedMs = endTime.getTime() - startTime.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      
      // Assicurati che la durata sia almeno 1 secondo
      const totalSeconds = Math.max(elapsedSeconds, 1);
      
      // Formatta come HH:MM:SS
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      
      const newDuration = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      
      if (typeof addLog === 'function') {
        addLog(`📏 REAL_DURATION: ${item.name} - Riprodotto per ${totalSeconds}s (${startTime.toTimeString().substring(0,8)} → ${endTime.toTimeString().substring(0,8)}) → Durata: ${newDuration}`, 'info');
      }
      
      return newDuration;
    } catch (error) {
      if (typeof addLog === 'function') {
        addLog(`⚠️ TIMING: Errore calcolo durata per ${item.name}: ${error.message}`, 'warning');
      }
      return item.data?.duration || '00:00:05';
    }
  }, [addLog]);

  const updateItemDuration = useCallback((itemId, newDuration) => {
    // DEBUG CRITICO: Verifica chiamata funzione
    if (typeof addLog === 'function') {
      addLog(`🔧 UPDATE_DURATION CALLED: Item ${itemId.slice(0,8)}... → Nuova durata: ${newDuration}`, 'info');
      addLog(`📏 UPDATE_DURATION: Item ${itemId.slice(0,8)}... → Nuova durata: ${newDuration}`, 'info');
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { 
              ...item, 
              data: { 
                ...item.data, 
                duration: newDuration,
                // Aggiorna anche outPoint se necessario
                outPoint: newDuration
              }
            }
          : item
      )
    );
  }, [setItems, addLog]);

  const updateItemStates = useCallback((currentIndex) => {
    setItems(prevItems =>
      prevItems.map((item, index) => {
        let newState = 'normal';
        
        if (index === currentIndex) {
          newState = 'onair'; // Item corrente in riproduzione
        } else if (index === currentIndex + 1 || (loopControlRef.current.shouldLoop && currentIndex === prevItems.length - 1 && index === 0)) {
          newState = 'next'; // Prossimo item o primo item se loop infinito
        }
        
        return {
          ...item,
          data: {
            ...item.data,
            itemState: newState
          }
        };
      })
    );
    
    if (typeof addLog === 'function') {
      const nextIndex = currentIndex + 1 < items.length ? currentIndex + 1 : (loopControlRef.current.shouldLoop ? 0 : -1);
      addLog(`🎬 STATI: Item ${currentIndex + 1} ON AIR${nextIndex >= 0 ? `, Item ${nextIndex + 1} NEXT` : ''}`, 'debug');
    }
  }, [setItems, items.length, addLog]);


  const handleAutoPlayChange = useCallback((value) => {
    setAutoPlay(value);
    showNotification('Riproduzione Automatica', `Riproduzione automatica ${value ? 'attivata' : 'disattivata'}.`, 'info');
  }, [showNotification, setAutoPlay]);


  // SISTEMA SEMPLIFICATO: Controlli loop diretti
  const playAllWithLoop = useCallback(() => {
    console.log('🔍 DEBUG playAllWithLoop: connected =', connected, 'items.length =', items.length);
    console.log('🔍 DEBUG playAllWithLoop: typeof addLog =', typeof addLog);
    console.log('🔍 DEBUG playAllWithLoop: typeof playAll =', typeof playAll);
    
    if (!connected || items.length === 0) {
      console.log('🔍 DEBUG playAllWithLoop: Early return - connected:', connected, 'items.length:', items.length);
      if (typeof addLog === 'function') addLog(`⚠️ LOOP: Impossibile avviare - connected: ${connected}, items: ${items.length}`, 'warning');
      return;
    }
    
    console.log('🔍 DEBUG playAllWithLoop: About to call addLog for LOOP INFINITO');
    if (typeof addLog === 'function') {
      addLog('🔄 LOOP INFINITO: Avvio riproduzione continua', 'info');
    }
    console.log('🔍 DEBUG playAllWithLoop: addLog call completed');
    
    console.log('🔍 DEBUG playAllWithLoop: About to call playAll(true)');
    if (typeof addLog === 'function') {
      addLog(`🔧 CALLING playAll(true) from playAllWithLoop`, 'info');
    }
    try {
      playAll(true); // Attiva il loop infinito
      console.log('🔍 DEBUG playAllWithLoop: playAll(true) call completed');
      if (typeof addLog === 'function') {
        addLog(`✅ playAll(true) chiamata completata da playAllWithLoop`, 'info');
      }
    } catch (error) {
      console.error('🔍 DEBUG playAllWithLoop: ERROR in playAll(true):', error);
      if (typeof addLog === 'function') {
        addLog(`❌ ERRORE in playAll(true): ${error.message}`, 'error');
      }
    }
  }, [connected, items.length, addLog, playAll]); // FIXED: Aggiunto playAll alle dipendenze

  const toggleLoop = useCallback(() => {
    const newLoopStatus = !loopEnabled;
    setLoopEnabled(newLoopStatus);
    
    // CORREZIONE: Aggiorna anche il ref se il loop è attivo
    if (loopControlRef.current.running) {
      loopControlRef.current.shouldLoop = newLoopStatus;
    }
    
    if (typeof addLog === 'function') {
      addLog(`🔄 LOOP TOGGLE: ${newLoopStatus ? 'ATTIVATO ✅' : 'DISATTIVATO ❌'}`, 'info');
    }
    
    // Se stiamo disattivando il loop durante la riproduzione
    if (!newLoopStatus && loopControlRef.current.running) {
      if (typeof addLog === 'function') {
        addLog('🔄 LOOP: La riproduzione corrente continuerà ma non farà loop', 'info');
      }
    }
  }, [loopEnabled, addLog]);

  const value = {
    items, currentItem, rundownName, modified, autoPlay, currentPlayingIndex,
    playingItems, currentTime, scheduledPlayback, dayStartTime, timeIndicatorPosition,
    nextItemPrepared, // Aggiungiamo lo stato del precaricamento
    // SISTEMA LOOP CORRETTO: Stati loop senza stale closures
    loopEnabled,
    rundownIsLooping,
    // Stati Supabase
    useSupabaseSync,
    supabaseLoading,
    supabaseError,
    activeRundownId,
    setActiveRundownId: setActiveRundownIdExternal, // CORREZIONE: Usa la nuova funzione che supporta rundown esterni
    // Funzioni esistenti (con integrazione Supabase)
    setItems,
    setRundownName: updateRundownNameWrapper, // Usa la versione con Supabase
    setAutoPlay: handleAutoPlayChange,
    addMedia, addTemplate, addStory, removeItem, updateItem, moveItem,
    playItem, stopItem, removeTemplate, updateTemplate,
    prepareNextItem, // Aggiungiamo la funzione di precaricamento
    playAll, stopAll, saveRundown, loadRundown, clearRundown,
    // SISTEMA LOOP CORRETTO: Funzioni loop con controllo ref
    playAllWithLoop,
    toggleLoop,
    toggleScheduledPlayback, setDayStart, calculateEndTime, sortItemsByStartTime,
    showNotification, getMediaDuration, getItemById, updateItemPlayingStatus
  };

  return (
    <RundownContext.Provider value={value}>
      {children}
    </RundownContext.Provider>
  );
};

export default RundownContext;
