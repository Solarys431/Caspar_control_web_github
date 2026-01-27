import { useState, useEffect, useCallback, useRef } from 'react';
import { useRundown } from '../contexts/RundownContext';

/**
 * Hook per la sincronizzazione dello stato di riproduzione tra Rundown ed Editor Scalette
 * Gestisce la propagazione degli stati LIVE, PREVIEW, NEXT tra i diversi componenti
 * CORREZIONE CRITICA: Implementa sincronizzazione unidirezionale (Rundown → Scalette)
 */
const usePlaybackSync = () => {
  // Stati per il tracking degli elementi in riproduzione
  const [playingItems, setPlayingItems] = useState(new Map()); // Map<itemId, playbackInfo>
  const [nextItemId, setNextItemId] = useState(null);
  const [liveItems, setLiveItems] = useState(new Set()); // Set di itemId in onda LIVE (canale 1)
  const [previewItems, setPreviewItems] = useState(new Set()); // Set di itemId in preview (canale 3)

  // Riferimenti per evitare loop infiniti
  const lastUpdateRef = useRef(Date.now());
  const syncTimeoutRef = useRef(null);

  // Accesso al contesto Rundown
  const { items: rundownItems } = useRundown();

  /**
   * Aggiorna lo stato di riproduzione di un elemento
   * CORREZIONE CRITICA: Distingue tra LIVE (canale 1) e PREVIEW (canale 3)
   * @param {string} itemId - ID dell'elemento
   * @param {Object} playbackInfo - Informazioni di riproduzione
   * @param {string} playbackInfo.status - PLAYING, PAUSED, STOPPED, LIVE, PREVIEW
   * @param {string} playbackInfo.channel - Canale CasparCG
   * @param {string} playbackInfo.layer - Layer CasparCG
   * @param {number} playbackInfo.startTime - Timestamp di inizio riproduzione
   * @param {string} playbackInfo.source - Fonte dell'aggiornamento (rundown, scalette, osc)
   */
  const updatePlaybackStatus = useCallback((itemId, playbackInfo) => {
    if (!itemId || !playbackInfo) return;

    const now = Date.now();

    // Evita aggiornamenti troppo frequenti
    if (now - lastUpdateRef.current < 100) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        updatePlaybackStatus(itemId, playbackInfo);
      }, 100);
      return;
    }

    lastUpdateRef.current = now;

    // CORREZIONE CRITICA: Determina il tipo di riproduzione basato su source e channel
    let actualStatus = playbackInfo.status;
    const isLiveEnvironment = playbackInfo.source === 'rundown' || playbackInfo.channel === 1;
    const isPreviewEnvironment = playbackInfo.source === 'scalette' || playbackInfo.channel === 3;

    // Converti status basato sull'ambiente
    if (actualStatus === 'PLAYING') {
      if (isLiveEnvironment) {
        actualStatus = 'LIVE';
      } else if (isPreviewEnvironment) {
        actualStatus = 'PREVIEW';
      }
    }

    console.log(`🔄 [PLAYBACK SYNC] Aggiornamento stato per ${itemId}:`, {
      originalStatus: playbackInfo.status,
      actualStatus,
      source: playbackInfo.source,
      channel: playbackInfo.channel,
      isLiveEnvironment,
      isPreviewEnvironment
    });

    setPlayingItems(prev => {
      const newMap = new Map(prev);

      if (actualStatus === 'STOPPED') {
        // Rimuovi l'elemento dalla lista di riproduzione
        newMap.delete(itemId);
      } else {
        // Aggiorna o aggiungi l'elemento con lo status corretto
        newMap.set(itemId, {
          ...playbackInfo,
          status: actualStatus,
          lastUpdate: now
        });
      }

      return newMap;
    });

    // CORREZIONE CRITICA: Gestisci separatamente LIVE e PREVIEW
    if (actualStatus === 'LIVE') {
      setLiveItems(prev => new Set([...prev, itemId]));
      // Rimuovi da preview se era lì
      setPreviewItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } else if (actualStatus === 'PREVIEW') {
      setPreviewItems(prev => new Set([...prev, itemId]));
      // NON aggiungere a liveItems - questa è la correzione principale
    } else if (actualStatus === 'STOPPED') {
      // Rimuovi da entrambi i set
      setLiveItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      setPreviewItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, []);

  /**
   * PROBLEMA 2 FIX: Pulisce completamente lo stato di riproduzione di un elemento
   * @param {string} itemId - ID dell'elemento da pulire
   */
  const clearPlaybackStatus = useCallback((itemId) => {
    if (!itemId) return;

    console.log(`🧹 [PLAYBACK SYNC] Pulizia stato per elemento: ${itemId}`);

    // Rimuovi dalle mappe di stato
    setPlayingItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });

    // Rimuovi dai set LIVE e PREVIEW
    setLiveItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });

    setPreviewItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });

    // Se era l'elemento NEXT, pulisci anche quello
    if (nextItemId === itemId) {
      setNextItemId(null);
    }
  }, [nextItemId]);

  /**
   * Imposta l'elemento successivo in coda
   * @param {string} itemId - ID dell'elemento successivo
   */
  const setNextItem = useCallback((itemId) => {
    console.log(`🎯 [PLAYBACK SYNC] Elemento NEXT impostato:`, itemId);
    setNextItemId(itemId);
  }, []);

  /**
   * Ottiene lo stato di riproduzione di un elemento
   * @param {string} itemId - ID dell'elemento
   * @returns {Object|null} - Informazioni di riproduzione o null
   */
  const getPlaybackStatus = useCallback((itemId) => {
    return playingItems.get(itemId) || null;
  }, [playingItems]);

  /**
   * Verifica se un elemento è attualmente in riproduzione
   * @param {string} itemId - ID dell'elemento
   * @returns {boolean}
   */
  const isItemPlaying = useCallback((itemId) => {
    const status = playingItems.get(itemId);
    return status && (status.status === 'PLAYING' || status.status === 'LIVE');
  }, [playingItems]);

  /**
   * Verifica se un elemento è il prossimo in coda
   * @param {string} itemId - ID dell'elemento
   * @returns {boolean}
   */
  const isItemNext = useCallback((itemId) => {
    return nextItemId === itemId;
  }, [nextItemId]);

  /**
   * Verifica se un elemento è in onda (LIVE)
   * @param {string} itemId - ID dell'elemento
   * @returns {boolean}
   */
  const isItemLive = useCallback((itemId) => {
    return liveItems.has(itemId);
  }, [liveItems]);

  /**
   * Verifica se un elemento è in preview
   * @param {string} itemId - ID dell'elemento
   * @returns {boolean}
   */
  const isItemPreview = useCallback((itemId) => {
    return previewItems.has(itemId);
  }, [previewItems]);

  /**
   * Ottiene tutti gli elementi attualmente in riproduzione
   * @returns {Array} - Array di oggetti {itemId, playbackInfo}
   */
  const getAllPlayingItems = useCallback(() => {
    return Array.from(playingItems.entries()).map(([itemId, playbackInfo]) => ({
      itemId,
      playbackInfo
    }));
  }, [playingItems]);

  /**
   * Pulisce gli stati di riproduzione obsoleti (più vecchi di 30 secondi senza aggiornamenti)
   */
  const cleanupStaleStates = useCallback(() => {
    const now = Date.now();
    const staleThreshold = 30000; // 30 secondi

    setPlayingItems(prev => {
      const newMap = new Map();

      for (const [itemId, playbackInfo] of prev.entries()) {
        if (now - playbackInfo.lastUpdate < staleThreshold) {
          newMap.set(itemId, playbackInfo);
        } else {
          console.log(`🧹 [PLAYBACK SYNC] Rimozione stato obsoleto per ${itemId}`);
        }
      }

      return newMap;
    });

    setLiveItems(prev => {
      const newSet = new Set();

      for (const itemId of prev) {
        const playbackInfo = playingItems.get(itemId);
        if (playbackInfo && now - playbackInfo.lastUpdate < staleThreshold) {
          newSet.add(itemId);
        }
      }

      return newSet;
    });

    // CORREZIONE CRITICA: Cleanup anche per previewItems
    setPreviewItems(prev => {
      const newSet = new Set();

      for (const itemId of prev) {
        const playbackInfo = playingItems.get(itemId);
        if (playbackInfo && now - playbackInfo.lastUpdate < staleThreshold) {
          newSet.add(itemId);
        }
      }

      return newSet;
    });
  }, [playingItems]);

  /**
   * Sincronizza con i dati OSC
   * @param {Object} oscData - Dati OSC dal CasparCG
   */
  const syncWithOSC = useCallback((oscData) => {
    if (!oscData || !oscData.isConnected) return;

    // Trova elementi del rundown che corrispondono ai dati OSC
    if (rundownItems && rundownItems.length > 0) {
      rundownItems.forEach(item => {
        if (item.isPlaying) {
          updatePlaybackStatus(item.id, {
            status: 'PLAYING',
            channel: item.data?.casparcgConfig?.channel || 1,
            layer: item.data?.casparcgConfig?.layer || 1,
            startTime: item.playingStartTime || Date.now(),
            source: 'osc'
          });
        }
      });
    }
  }, [rundownItems, updatePlaybackStatus]);

  // Cleanup automatico ogni 30 secondi
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupStaleStates, 30000);
    return () => clearInterval(cleanupInterval);
  }, [cleanupStaleStates]);

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Stati
    playingItems: Array.from(playingItems.entries()),
    nextItemId,
    liveItems: Array.from(liveItems),
    previewItems: Array.from(previewItems), // CORREZIONE CRITICA: Aggiungi previewItems

    // Funzioni di controllo
    updatePlaybackStatus,
    clearPlaybackStatus, // PROBLEMA 2 FIX: Aggiungi clearPlaybackStatus
    setNextItem,

    // Funzioni di query
    getPlaybackStatus,
    isItemPlaying,
    isItemNext,
    isItemLive,
    isItemPreview, // CORREZIONE CRITICA: Aggiungi isItemPreview
    getAllPlayingItems,

    // Sincronizzazione
    syncWithOSC,
    cleanupStaleStates
  };
};

export default usePlaybackSync;
