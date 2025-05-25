import { useState, useEffect, useCallback, useRef } from 'react';
import { useRundown } from '../contexts/RundownContext';

/**
 * Hook per la sincronizzazione dello stato di riproduzione tra Rundown ed Editor Scalette
 * Gestisce la propagazione degli stati ON AIR, NEXT, PLAYING tra i diversi componenti
 */
const usePlaybackSync = () => {
  // Stati per il tracking degli elementi in riproduzione
  const [playingItems, setPlayingItems] = useState(new Map()); // Map<itemId, playbackInfo>
  const [nextItemId, setNextItemId] = useState(null);
  const [liveItems, setLiveItems] = useState(new Set()); // Set di itemId in onda
  
  // Riferimenti per evitare loop infiniti
  const lastUpdateRef = useRef(Date.now());
  const syncTimeoutRef = useRef(null);
  
  // Accesso al contesto Rundown
  const { items: rundownItems } = useRundown();

  /**
   * Aggiorna lo stato di riproduzione di un elemento
   * @param {string} itemId - ID dell'elemento
   * @param {Object} playbackInfo - Informazioni di riproduzione
   * @param {string} playbackInfo.status - PLAYING, PAUSED, STOPPED, LIVE
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

    console.log(`🔄 [PLAYBACK SYNC] Aggiornamento stato per ${itemId}:`, playbackInfo);

    setPlayingItems(prev => {
      const newMap = new Map(prev);
      
      if (playbackInfo.status === 'STOPPED') {
        // Rimuovi l'elemento dalla lista di riproduzione
        newMap.delete(itemId);
      } else {
        // Aggiorna o aggiungi l'elemento
        newMap.set(itemId, {
          ...playbackInfo,
          lastUpdate: now
        });
      }
      
      return newMap;
    });

    // Gestisci gli elementi LIVE (in onda)
    if (playbackInfo.status === 'LIVE' || playbackInfo.status === 'PLAYING') {
      setLiveItems(prev => new Set([...prev, itemId]));
    } else if (playbackInfo.status === 'STOPPED') {
      setLiveItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, []);

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
    
    // Funzioni di controllo
    updatePlaybackStatus,
    setNextItem,
    
    // Funzioni di query
    getPlaybackStatus,
    isItemPlaying,
    isItemNext,
    isItemLive,
    getAllPlayingItems,
    
    // Sincronizzazione
    syncWithOSC,
    cleanupStaleStates
  };
};

export default usePlaybackSync;
