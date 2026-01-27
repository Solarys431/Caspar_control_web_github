import { useCallback, useState } from 'react';
import { useCaspar } from '../../../contexts/CasparContext'; // Assicurati che il percorso sia corretto
import { useRundown } from '../../../contexts/RundownContext'; // Assicurati che il percorso sia corretto

/**
 * Hook personalizzato per gestire la riproduzione degli elementi del rundown.
 * Interagisce con CasparCG per la riproduzione, l'arresto e la gestione dei template.
 */
const useRundownPlayback = () => {
  // Funzioni dal CasparContext per interagire con CasparCG
  const {
    play: casparPlayMedia,
    stop: casparStopMedia,
    cgAdd: casparCgAdd,
    cgPlay: casparCgPlay,
    cgStop: casparCgStop,
    cgRemove: casparCgRemove, // Manteniamo l'importazione, potrebbe servire se si decommenta il codice sotto
    cgUpdate: casparCgUpdate,
    addLog // Funzione per il logging
  } = useCaspar();

  // Funzioni e dati dal RundownContext per aggiornare lo stato del rundown
  const {
    updateItemPlayingStatus,
  } = useRundown();

  // 🔥 TRACKING SYSTEM - Mappa per tracciare configurazioni template attivi per item
  // Formato: Map(itemId -> { templateName, channel, layer, cgLayer, data })
  const [activeTemplateConfigs, setActiveTemplateConfigs] = useState(new Map());

  /**
   * Riproduce un elemento di tipo MEDIA.
   * Gestisce anche l'attivazione di un eventuale template collegato (linkedTemplate).
   */
  const playMediaItem = useCallback(async (item) => {
    if (!item || item.type !== 'MEDIA' || !item.data) {
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Tentativo di riprodurre un item media non valido: ${JSON.stringify(item)}`, 'error');
      return false;
    }

    try {
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Inizio riproduzione media "${item.name}" (Clip: ${item.data.clip}) su canale ${item.data.channel || 1}-${item.data.layer || 10}`, 'info');
      // Comando PLAY a CasparCG per il media
      await casparPlayMedia(
        item.data.channel || 1,
        item.data.layer || 10,
        item.data.clip,
        { loop: item.data.loop || false }
      );
      updateItemPlayingStatus(item.id, true); // Aggiorna lo stato dell'item a "in riproduzione"
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Media "${item.name}" marcato come in riproduzione.`, 'info');

      // Gestione del template collegato, se presente
      if (item.data.linkedTemplate && item.data.linkedTemplate.template) {
        const linked = item.data.linkedTemplate;
        const delay = linked.delay || 0; // Delay prima di attivare il template collegato
        if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Trovato template annidato "${linked.name || linked.template}" per "${item.name}". Delay: ${delay}ms.`, 'debug');

        setTimeout(async () => {
          try {
            if (!linked.channel || !linked.layer || !linked.cgLayer || !linked.template) {
              if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: ERRORE - Parametri mancanti per CG ADD del template annidato "${linked.name || linked.template}". Dati: ${JSON.stringify(linked)}`, 'error');
              return;
            }
            if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG ADD per template annidato "${linked.name || linked.template}" su ${linked.channel}-${linked.layer} (CG: ${linked.cgLayer})`, 'info');
            
            // Comando CG ADD per il template collegato
            await casparCgAdd(
              linked.channel, linked.layer, linked.cgLayer,
              linked.template,
              linked.playOnLoad !== undefined ? linked.playOnLoad : true, // Riproduci al caricamento o meno
              linked.data || {} // Dati per il template
            );

            // 🔥 SALVA configurazione linkedTemplate per STOP/REMOVE successivi
            const linkedTemplateKey = `${item.id}_linkedTemplate`;
            setActiveTemplateConfigs(prev => {
              const newMap = new Map(prev);
              newMap.set(linkedTemplateKey, {
                templateName: linked.template,
                channel: linked.channel,
                layer: linked.layer,
                cgLayer: linked.cgLayer,
                data: linked.data || {}
              });
              return newMap;
            });
            if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: LinkedTemplate config salvata con chiave "${linkedTemplateKey}".`, 'info');

            // Se playOnLoad è false, invia un comando CG PLAY separato
            if (linked.playOnLoad === false) {
              if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG PLAY per template annidato "${linked.name}" (playOnLoad: false)`, 'info');
              await casparCgPlay(linked.channel, linked.layer, linked.cgLayer);
            }
          } catch (templateError) {
            console.error(`PLAYBACK_HOOK: Errore attivazione template annidato ${linked.template}:`, templateError);
            if (typeof addLog === 'function') addLog(`Errore attivazione template annidato ${linked.template} per ${item.name}: ${templateError.message}`, 'error');
          }
        }, delay);
      }
      return true;
    } catch (error) {
      console.error(`PLAYBACK_HOOK: Errore nella riproduzione del media "${item.name}":`, error);
      if (typeof addLog === 'function') addLog(`Errore riproduzione media ${item.name}: ${error.message}`, 'error');
      updateItemPlayingStatus(item.id, false); // Assicura che l'item sia segnato come non in riproduzione in caso di errore
      return false;
    }
  }, [casparPlayMedia, casparCgAdd, casparCgPlay, updateItemPlayingStatus, addLog]);

  /**
   * Arresta un elemento di tipo MEDIA.
   * Gestisce anche l'arresto e la rimozione di un eventuale template collegato.
   */
  const stopMediaItem = useCallback(async (item) => {
    if (!item || item.type !== 'MEDIA' || !item.data) {
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Tentativo di fermare un item media non valido: ${JSON.stringify(item)}`, 'error');
      return false;
    }
    try {
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Inizio arresto media "${item.name}" su canale ${item.data.channel || 1}-${item.data.layer || 10}`, 'info');
      // Comando STOP a CasparCG per il media
      await casparStopMedia(
        item.data.channel || 1,
        item.data.layer || 10
      );
      updateItemPlayingStatus(item.id, false); // Aggiorna lo stato dell'item a "non in riproduzione"
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Media "${item.name}" marcato come non in riproduzione.`, 'info');

      // Gestione del template collegato, se presente
      if (item.data.linkedTemplate && item.data.linkedTemplate.template) {
        const linked = item.data.linkedTemplate;
        const linkedTemplateKey = `${item.id}_linkedTemplate`;
        
        if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Gestione take out template annidato "${linked.name || linked.template}" per "${item.name}".`, 'debug');
        
        try {
          // 🔥 RECUPERA configurazione linkedTemplate salvata in precedenza
          const savedLinkedConfig = activeTemplateConfigs.get(linkedTemplateKey);
          
          let channel, layer, cgLayer, templateName;
          
          if (savedLinkedConfig) {
            // Usa la configurazione salvata durante ADD (METODO SICURO)
            channel = savedLinkedConfig.channel;
            layer = savedLinkedConfig.layer;
            cgLayer = savedLinkedConfig.cgLayer;
            templateName = savedLinkedConfig.templateName;
            if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Usando configurazione salvata per linkedTemplate "${linkedTemplateKey}": ${channel}-${layer}-${cgLayer}`, 'info');
          } else {
            // Fallback ai valori dell'item (METODO ORIGINALE)
            channel = linked.channel;
            layer = linked.layer;
            cgLayer = linked.cgLayer;
            templateName = linked.template;
            if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: ATTENZIONE - Nessuna configurazione salvata per linkedTemplate "${linkedTemplateKey}", uso valori originali: ${channel}-${layer}-${cgLayer}`, 'warning');
          }

          if (!channel || !layer || !cgLayer) {
            if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: ERRORE - Parametri mancanti per CG STOP/REMOVE del template annidato "${linked.name || linked.template}".`, 'error');
          } else {
            // Comandi CG STOP e CG REMOVE per il template collegato
            if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG STOP per template annidato "${linked.name}" su ${channel}-${layer} (CG: ${cgLayer})`, 'info');
            await casparCgStop(channel, layer, cgLayer);
            
            if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG REMOVE per template annidato "${linked.name}" su ${channel}-${layer} (CG: ${cgLayer})`, 'info');
            await casparCgRemove(channel, layer, cgLayer);

            // 🔥 RIMUOVI configurazione linkedTemplate dopo REMOVE
            setActiveTemplateConfigs(prev => {
              const newMap = new Map(prev);
              newMap.delete(linkedTemplateKey);
              return newMap;
            });
            if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: LinkedTemplate config rimossa con chiave "${linkedTemplateKey}".`, 'info');
          }
        } catch (templateError) {
          console.error(`PLAYBACK_HOOK: Errore stop/remove template annidato ${linked.template}:`, templateError);
          if (typeof addLog === 'function') addLog(`Errore stop/remove template annidato ${linked.template} per ${item.name}: ${templateError.message}`, 'error');
        }
      }
      return true;
    } catch (error) {
      console.error(`PLAYBACK_HOOK: Errore nell'arresto del media "${item.name}":`, error);
      if (typeof addLog === 'function') addLog(`Errore arresto media ${item.name}: ${error.message}`, 'error');
      return false;
    }
  }, [casparStopMedia, casparCgStop, casparCgRemove, updateItemPlayingStatus, addLog]);

  /**
   * Riproduce un elemento di tipo TEMPLATE (grafica).
   */
  const playTemplateItem = useCallback(async (item) => {
    if (!item || item.type !== 'TEMPLATE' || !item.data) {
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Tentativo di riprodurre un item template non valido: ${JSON.stringify(item)}`, 'error');
      return false;
    }
    try {
      const channel = item.data.channel || 1;
      const layer = item.data.layer || 20; // Layer video predefinito per i template
      const cgLayer = item.data.cgLayer || 1; // Layer grafico (CG layer)
      const templateName = item.data.template; // Nome del template
      const templateData = item.data.data || {}; // Dati del template

      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG ADD per template principale "${item.name}" su ${channel}-${layer}-${cgLayer}`, 'info');
      
      // Comando CG ADD per il template
      await casparCgAdd(
        channel,
        layer,
        cgLayer,
        templateName,
        item.data.playOnLoad !== undefined ? item.data.playOnLoad : true,
        templateData
      );

      // 🔥 SALVA configurazione template attivo per STOP/REMOVE successivi
      setActiveTemplateConfigs(prev => {
        const newMap = new Map(prev);
        newMap.set(item.id, {
          templateName,
          channel,
          layer,
          cgLayer,
          data: templateData
        });
        return newMap;
      });

      updateItemPlayingStatus(item.id, true);
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Template "${item.name}" aggiunto e marcato come in riproduzione. PlayOnLoad: ${item.data.playOnLoad}. Config salvata per tracking.`);

      // Se playOnLoad è false, invia un comando CG PLAY separato
      if (item.data.playOnLoad === false) {
        if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG PLAY per template "${item.name}" (playOnLoad: false)`, 'info');
        await casparCgPlay(channel, layer, cgLayer);
      }
      return true;
    } catch (error) {
      console.error(`PLAYBACK_HOOK: Errore nella riproduzione del template "${item.name}":`, error);
      if (typeof addLog === 'function') addLog(`Errore riproduzione template ${item.name}: ${error.message}`, 'error');
      updateItemPlayingStatus(item.id, false);
      return false;
    }
  }, [casparCgAdd, casparCgPlay, updateItemPlayingStatus, addLog]);

  /**
   * Arresta un elemento di tipo TEMPLATE.
   * Considerare se è necessario anche `cgRemove` in base al workflow.
   */
  const stopTemplateItem = useCallback(async (item) => {
    if (!item || item.type !== 'TEMPLATE' || !item.data) {
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Tentativo di fermare un item template non valido: ${JSON.stringify(item)}`, 'error');
      return false;
    }
    try {
      // 🔥 RECUPERA configurazione template attivo salvata in precedenza
      const savedConfig = activeTemplateConfigs.get(item.id);
      
      let channel, layer, cgLayer, templateName;
      
      if (savedConfig) {
        // Usa la configurazione salvata durante ADD (METODO SICURO)
        channel = savedConfig.channel;
        layer = savedConfig.layer;
        cgLayer = savedConfig.cgLayer;
        templateName = savedConfig.templateName;
        if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Usando configurazione salvata per template "${item.name}": ${channel}-${layer}-${cgLayer}`, 'info');
      } else {
        // Fallback ai valori dell'item (METODO ORIGINALE)
        channel = item.data.channel || 1;
        layer = item.data.layer || 20;
        cgLayer = item.data.cgLayer || 1;
        templateName = item.data.template;
        if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: ATTENZIONE - Nessuna configurazione salvata per template "${item.name}", uso valori item: ${channel}-${layer}-${cgLayer}`, 'warning');
      }

      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG STOP per template principale "${item.name}" su ${channel}-${layer}-${cgLayer}`, 'info');
      
      // Comando CG STOP per il template
      await casparCgStop(channel, layer, cgLayer);
      
      // Comando CG REMOVE per rimuovere completamente il template dalla scena
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG REMOVE per template principale "${item.name}" su ${channel}-${layer}-${cgLayer}`, 'info');
      await casparCgRemove(channel, layer, cgLayer);
      
      // 🔥 RIMUOVI configurazione salvata dopo REMOVE
      setActiveTemplateConfigs(prev => {
        const newMap = new Map(prev);
        newMap.delete(item.id);
        return newMap;
      });
      
      updateItemPlayingStatus(item.id, false);
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Template "${item.name}" fermato, rimosso e marcato come non in riproduzione. Config rimossa dal tracking.`);
      return true;
    } catch (error) {
      console.error(`PLAYBACK_HOOK: Errore nell'arresto del template "${item.name}":`, error);
      if (typeof addLog === 'function') addLog(`Errore arresto template ${item.name}: ${error.message}`, 'error');
      return false;
    }
  }, [casparCgStop, casparCgRemove, updateItemPlayingStatus, addLog, activeTemplateConfigs]);

  /**
   * Aggiorna i dati di un elemento TEMPLATE già in scena.
   */
  const updateTemplateDataItem = useCallback(async (item, newData) => {
    if (!item || item.type !== 'TEMPLATE' || !item.data) {
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Tentativo di aggiornare un item template non valido: ${JSON.stringify(item)}`, 'error');
      return false;
    }
    try {
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Invio CG UPDATE per template "${item.name}" con nuovi dati.`, 'info');
      // Comando CG UPDATE per il template
      await casparCgUpdate(
        item.data.channel || 1,
        item.data.layer || 20,
        item.data.cgLayer || 1,
        newData || item.data.data || {} // Nuovi dati per il template
      );
      if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK: Template "${item.name}" aggiornato con successo.`);
      return true;
    } catch (error) {
      console.error(`PLAYBACK_HOOK: Errore nell'aggiornamento del template "${item.name}":`, error);
      if (typeof addLog === 'function') addLog(`Errore aggiornamento template ${item.name}: ${error.message}`, 'error');
      return false;
    }
  }, [casparCgUpdate, addLog]);

  /**
   * Funzione generica per riprodurre un item (MEDIA o TEMPLATE).
   * Questa funzione viene solitamente esposta tramite RundownContext.
   */
  const playItem = useCallback(async (itemToPlay) => {
    if (!itemToPlay) {
      if (typeof addLog === 'function') addLog('PLAYBACK_HOOK (playItem): Nessun item fornito per la riproduzione.', 'warning');
      return false;
    }
    if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK (playItem): Richiesta di riproduzione per item "${itemToPlay.name}" di tipo ${itemToPlay.type}.`, 'info');

    if (itemToPlay.type === 'MEDIA') {
      return await playMediaItem(itemToPlay);
    } else if (itemToPlay.type === 'TEMPLATE') {
      return await playTemplateItem(itemToPlay);
    }
    if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK (playItem): Tipo di item "${itemToPlay.type}" non riconosciuto per la riproduzione.`, 'warning');
    return false;
  }, [playMediaItem, playTemplateItem, addLog]);

  /**
   * Funzione generica per arrestare un item (MEDIA o TEMPLATE).
   * Questa funzione viene solitamente esposta tramite RundownContext.
   */
  const stopItem = useCallback(async (itemToStop) => {
    if (!itemToStop) {
      if (typeof addLog === 'function') addLog('PLAYBACK_HOOK (stopItem): Nessun item fornito per l\'arresto.', 'warning');
      return false;
    }
    if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK (stopItem): Richiesta di arresto per item "${itemToStop.name}" di tipo ${itemToStop.type}.`, 'info');

    if (itemToStop.type === 'MEDIA') {
      return await stopMediaItem(itemToStop);
    } else if (itemToStop.type === 'TEMPLATE') {
      return await stopTemplateItem(itemToStop);
    }
    if (typeof addLog === 'function') addLog(`PLAYBACK_HOOK (stopItem): Tipo di item "${itemToStop.type}" non riconosciuto per l'arresto.`, 'warning');
    return false;
  }, [stopMediaItem, stopTemplateItem, addLog]);

  // Le funzioni come playAll, stopAll, e la logica di autoplay sono generalmente gestite
  // a un livello superiore (es. RundownContext o RundownPage) utilizzando le primitive playItem/stopItem.

  return {
    playItem,               // Funzione generica per avviare un item
    stopItem,               // Funzione generica per fermare un item
    updateTemplateDataItem, // Funzione per aggiornare i dati di un template in scena
    // Le seguenti funzioni specifiche potrebbero essere esportate se necessario per un controllo più diretto:
    // playMediaItem,
    // stopMediaItem,
    // playTemplateItem,
    // stopTemplateItem,
  };
};

export default useRundownPlayback;
