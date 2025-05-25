import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCaspar } from './CasparContext'; // Assicurati che il path sia corretto

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
    templateList // PROBLEMA 3 FIX: Aggiungi templateList dal CasparContext
  } = useCaspar();

  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [rundownName, setRundownName] = useState('Nuovo Rundown');
  const [modified, setModified] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1);
  const [autoPlayTimer, setAutoPlayTimer] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduledPlayback, setScheduledPlayback] = useState(false);
  const [dayStartTime, setDayStartTime] = useState('00:00:00');
  const [timeIndicatorPosition, setTimeIndicatorPosition] = useState(0);
  const [playingItems, setPlayingItems] = useState([]);
  const [nextItemPrepared, setNextItemPrepared] = useState(null);

  useEffect(() => {
    console.log('RundownContext: Attempting to load rundown from localStorage.');
    try {
      const savedRundown = localStorage.getItem('rundown');
      if (savedRundown) {
        const parsedRundown = JSON.parse(savedRundown);
        setItems(parsedRundown.items || []);
        setRundownName(parsedRundown.name || 'Rundown Caricato');
        if (typeof addLog === 'function') {
            addLog('Rundown caricato con successo dal localStorage.');
        }
        console.log('RundownContext: Rundown loaded from localStorage:', parsedRundown);
      } else {
        console.log('RundownContext: No rundown found in localStorage.');
        if (typeof addLog === 'function') {
            addLog('Nessun rundown salvato trovato nel localStorage.');
        }
      }
    } catch (error) {
      console.error('RundownContext: Errore nel caricamento del rundown dal localStorage:', error);
      if (typeof addLog === 'function') {
        addLog(`Errore caricamento rundown: ${error.message}`, 'error');
      }
    }
  }, [addLog]);

  useEffect(() => {
    if (items.length > 0 || rundownName !== 'Nuovo Rundown' || localStorage.getItem('rundown') !== null) {
      // console.log('RundownContext: Attempting to save rundown to localStorage.'); // Log troppo frequente
      try {
        const rundownToSave = { name: rundownName, items };
        localStorage.setItem('rundown', JSON.stringify(rundownToSave));
        setModified(true);
      } catch (error) {
        console.error('RundownContext: Errore nel salvataggio del rundown nel localStorage:', error);
        if (typeof addLog === 'function') {
            addLog(`Errore salvataggio rundown: ${error.message}`, 'error');
        }
      }
    }
  }, [items, rundownName, addLog]); // Rimosso addLog se non strettamente necessario per la logica di salvataggio

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
    if (typeof addLog === 'function') addLog(`Media aggiunto: ${newItem.name}`);
    return newItem;
  }, [addLog, getMediaDuration]);

  const addTemplate = useCallback((templateData) => {
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
    if (typeof addLog === 'function') addLog(`Template aggiunto: ${newItem.name}`);
    return newItem;
  }, [addLog]);

  // Funzione per aggiungere elementi STORY completi al rundown
  const addStory = useCallback((storyData) => {
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
    if (typeof addLog === 'function') addLog(`Storia aggiunta: ${newItem.name}`);
    return newItem;
  }, [addLog]);

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
  }, [connected, play, cgAdd, cgPlay, items, addLog, setItems, setPlayingItems, stopItem, nextItemPrepared, validateTemplate, templateList]);


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

  // PROBLEMA 2: Auto-play sequenziale migliorato con OSC data
  const playAll = useCallback(() => {
    if (!connected || items.length === 0) return;
    setAutoPlay(true);
    setCurrentPlayingIndex(0);

    // Funzione per riprodurre un elemento e precaricare il successivo
    const playAndPrepareNext = async (index) => {
      if (index < 0 || index >= items.length) {
        if (typeof addLog === 'function') addLog('AUTOPLAY: Fine playlist o indice non valido.', 'info');
        if (autoPlayTimer) clearInterval(autoPlayTimer);
        setAutoPlayTimer(null);
        setAutoPlay(false);
        setCurrentPlayingIndex(-1);
        return;
      }

      const currentItemToPlay = items[index];
      if (typeof addLog === 'function') addLog(`AUTOPLAY: Riproduzione item #${index + 1}: "${currentItemToPlay.name}"`, 'info');
      await playItem(currentItemToPlay);

      // Precaricare il prossimo elemento, se esiste
      if (index + 1 < items.length) {
        const nextItemToPrepare = items[index + 1];
        if (nextItemToPrepare.type === 'MEDIA') {
          if (typeof addLog === 'function') addLog(`AUTOPLAY: Precaricamento prossimo item #${index + 2}: "${nextItemToPrepare.name}"`, 'info');
          await prepareNextItem(nextItemToPrepare);
        }
      }

      // PROBLEMA 2: Usa OSC data per timing preciso invece di timer fissi
      const setupOscBasedAutoTake = () => {
        if (autoPlayTimer) clearInterval(autoPlayTimer);

        // Polling OSC data per rilevare fine media
        const oscPollingInterval = setInterval(() => {
          if (!autoPlay) {
            clearInterval(oscPollingInterval);
            return;
          }

          // Ottieni dati OSC per l'elemento corrente
          const channel = currentItemToPlay.data?.channel || 1;
          const layer = currentItemToPlay.data?.layer || 10;

          // Verifica se il media è finito tramite OSC
          // Questo dovrebbe essere implementato con i dati OSC reali
          // Per ora manteniamo la logica timer come fallback

          if (typeof addLog === 'function') addLog(`AUTOPLAY: Controllo OSC per ${currentItemToPlay.name} su ${channel}-${layer}`, 'debug');

          // TODO: Implementare controllo OSC reale qui
          // const oscData = getOscData(channel, layer);
          // if (oscData && oscData.isFinished) {
          //   clearInterval(oscPollingInterval);
          //   setCurrentPlayingIndex(prev => prev + 1);
          // }

        }, 1000); // Controlla ogni secondo

        setAutoPlayTimer(oscPollingInterval);

        // Fallback timer basato su durata (come prima)
        let fallbackDurationMs = 5000; // Default
        if (currentItemToPlay.data.duration) {
          try {
            const [h, m, s] = currentItemToPlay.data.duration.split(':').map(Number);
            fallbackDurationMs = (h * 3600 + m * 60 + s) * 1000;
            if (fallbackDurationMs <= 0) fallbackDurationMs = 5000;
          } catch (e) {
            if (typeof addLog === 'function') addLog(`AUTOPLAY: Errore parsing durata per ${currentItemToPlay.name}, uso default.`, 'warning');
          }
        }

        // Timer di fallback
        const fallbackTimer = setTimeout(() => {
          if (autoPlay) {
            clearInterval(oscPollingInterval);
            if (typeof addLog === 'function') addLog(`AUTOPLAY: Fallback timer attivato per ${currentItemToPlay.name}`, 'info');
            setCurrentPlayingIndex(prev => prev + 1);
          }
        }, fallbackDurationMs);

        // Cleanup quando l'elemento cambia
        return () => {
          clearInterval(oscPollingInterval);
          clearTimeout(fallbackTimer);
        };
      };

      setupOscBasedAutoTake();
    };

    // Avvia la riproduzione con il primo elemento
    if (items[0]) {
      playAndPrepareNext(0);
    }

    if (typeof addLog === 'function') addLog('AUTOPLAY: PlayAll avviato con monitoraggio OSC migliorato');
  }, [connected, items, playItem, prepareNextItem, autoPlayTimer, autoPlay, setAutoPlay, setCurrentPlayingIndex, addLog]);

  // Gestione dell'avanzamento dell'autoplay quando currentPlayingIndex cambia
  useEffect(() => {
    if (autoPlay && currentPlayingIndex >= 0 && currentPlayingIndex < items.length) {
      // La logica di playAndPrepareNext è già in playAll
      // Qui reagiamo solo ai cambiamenti di currentPlayingIndex
      if (currentPlayingIndex > 0) { // Non il primo elemento, che è già gestito da playAll
        const currentItem = items[currentPlayingIndex];
        playItem(currentItem);

        // Precaricare il prossimo elemento
        if (currentPlayingIndex + 1 < items.length) {
          const nextItem = items[currentPlayingIndex + 1];
          if (nextItem.type === 'MEDIA') {
            prepareNextItem(nextItem);
          }
        }
      }
    } else if (autoPlay && currentPlayingIndex >= items.length) {
      // Playlist finita
      if (typeof addLog === 'function') addLog('AUTOPLAY: Fine playlist (indice fuori range).', 'info');
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      setAutoPlayTimer(null);
      setAutoPlay(false);
      setCurrentPlayingIndex(-1);
    }
  }, [currentPlayingIndex, autoPlay, items, playItem, prepareNextItem, autoPlayTimer, setAutoPlay, setCurrentPlayingIndex, addLog]);

  const stopAll = useCallback(() => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    setAutoPlay(false);
    setCurrentPlayingIndex(-1);
    playingItems.forEach(itemId => {
      const itemToStop = items.find(i => i.id === itemId);
      if (itemToStop) stopItem(itemToStop, false); // Passa false per indicare che non è un autotake
    });
    setPlayingItems([]);
    setItems(prev => prev.map(i => ({...i, isPlaying: false, playingStartTime: null })));
    if (typeof addLog === 'function') addLog('StopAll eseguito');
  }, [autoPlayTimer, items, stopItem, playingItems, setPlayingItems, setItems, setAutoPlay, setCurrentPlayingIndex, addLog]);

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

  const updateItemPlayingStatus = useCallback((itemId, isPlayingStatus) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, isPlaying: isPlayingStatus, playingStartTime: isPlayingStatus ? new Date() : null }
          : item
      )
    );
    if (isPlayingStatus) {
        setPlayingItems(prev => prev.includes(itemId) ? prev : [...prev, itemId]);
    } else {
        setPlayingItems(prev => prev.filter(id => id !== itemId));
    }
  }, [setItems, setPlayingItems]); // Dipendenze corrette

  const handleAutoPlayChange = useCallback((value) => {
    setAutoPlay(value);
    showNotification('Riproduzione Automatica', `Riproduzione automatica ${value ? 'attivata' : 'disattivata'}.`, 'info');
  }, [showNotification, setAutoPlay]);


  const value = {
    items, currentItem, rundownName, modified, autoPlay, currentPlayingIndex,
    playingItems, currentTime, scheduledPlayback, dayStartTime, timeIndicatorPosition,
    nextItemPrepared, // Aggiungiamo lo stato del precaricamento
    setItems, setRundownName, setAutoPlay: handleAutoPlayChange,
    addMedia, addTemplate, addStory, removeItem, updateItem, moveItem,
    playItem, stopItem, removeTemplate, updateTemplate,
    prepareNextItem, // Aggiungiamo la funzione di precaricamento
    playAll, stopAll, saveRundown, loadRundown, clearRundown,
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
