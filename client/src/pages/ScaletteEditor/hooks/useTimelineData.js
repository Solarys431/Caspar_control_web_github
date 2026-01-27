import { useState, useEffect, useCallback, useMemo } from 'react';
import { timecodeToMs, msToTimecode, findLayerConflicts } from '../utils/timelineUtils';
import { organizeTracksByLayers, optimizeTrackHeights } from '../utils/trackUtils';

/**
 * Hook per la gestione dei dati della Timeline Visuale Avanzata
 * Gestisce sia la timeline principale che quella interna delle storie
 */
const useTimelineData = (items = [], selectedStory = null) => {
  // Stati per la timeline principale
  const [mainTimelineZoom, setMainTimelineZoom] = useState(1);
  const [mainTimelineStart, setMainTimelineStart] = useState(0);
  const [mainTimelineWidth, setMainTimelineWidth] = useState(24 * 60 * 60 * 1000); // 24 ore in ms

  // Stati per la timeline interna
  const [storyTimelineZoom, setStoryTimelineZoom] = useState(1);
  const [storyTimelineStart, setStoryTimelineStart] = useState(0);
  const [storyTimelineWidth, setStoryTimelineWidth] = useState(5 * 60 * 1000); // 5 minuti in ms

  // Stati per la visualizzazione
  const [viewMode, setViewMode] = useState('main'); // 'main' | 'story'
  const [selectedItems, setSelectedItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(1000); // 1 secondo in ms

  /**
   * Dati della timeline principale
   */
  const mainTimelineData = useMemo(() => {
    if (!items || items.length === 0) return { items: [], conflicts: [], duration: 0 };

    console.log('[Timeline] Processing items for main timeline:', items);

    // Converte gli items per la timeline principale
    const timelineItems = items.map((item, index) => {
      // Calcola il tempo di inizio basandosi sull'indice se non specificato
      const defaultStartTime = `${String(Math.floor(index * 2 / 60)).padStart(2, '0')}:${String((index * 2) % 60).padStart(2, '0')}:00`;

      const startTime = item.data?.timing?.startTime ||
                       item.data?.startTime ||
                       defaultStartTime;

      const duration = item.data?.timing?.duration ||
                      item.data?.duration ||
                      '00:01:00';

      const startTimeMs = timecodeToMs(startTime);
      const durationMs = timecodeToMs(duration);

      const processedItem = {
        ...item,
        startTimeMs,
        durationMs,
        endTimeMs: startTimeMs + durationMs,
        // Assicurati che il nome sia sempre disponibile
        displayName: item.data?.customName || item.name || `Elemento ${index + 1}`,
        // Aggiungi informazioni di layer e canale
        channel: item.data?.casparcgConfig?.channel || item.data?.channel || 1,
        layer: item.data?.casparcgConfig?.layer || item.data?.layer || 10
      };

      console.log(`[Timeline] Processed item ${index}:`, {
        id: processedItem.id,
        name: processedItem.displayName,
        type: processedItem.type,
        startTime,
        duration,
        startTimeMs,
        durationMs
      });

      return processedItem;
    });

    // Calcola la durata totale
    const totalDuration = Math.max(
      ...timelineItems.map(item => item.endTimeMs),
      mainTimelineWidth,
      24 * 60 * 60 * 1000 // Minimo 24 ore
    );

    // Trova conflitti
    const conflicts = findLayerConflicts(timelineItems);

    console.log('[Timeline] Main timeline data processed:', {
      itemCount: timelineItems.length,
      totalDuration: msToTimecode(totalDuration, 25, false),
      conflicts: conflicts.length
    });

    return {
      items: timelineItems,
      conflicts,
      duration: totalDuration
    };
  }, [items, mainTimelineWidth]);

  /**
   * Dati della timeline interna della storia
   */
  const storyTimelineData = useMemo(() => {
    if (!selectedStory || !selectedStory.data?.internal_items) {
      return { items: [], tracks: [], conflicts: [], duration: 0 };
    }

    const internalItems = selectedStory.data.internal_items.map(item => ({
      ...item,
      startTimeMs: timecodeToMs(item.relative_start_time),
      durationMs: timecodeToMs(item.duration),
      endTimeMs: timecodeToMs(item.relative_start_time) + timecodeToMs(item.duration)
    }));

    // Organizza in tracce
    const tracks = optimizeTrackHeights(
      organizeTracksByLayers(internalItems, { groupByType: true })
    );

    // Calcola la durata totale della storia
    const storyDuration = Math.max(
      ...internalItems.map(item => item.endTimeMs),
      timecodeToMs(selectedStory.data?.timing?.duration || '00:01:00')
    );

    // Trova conflitti
    const conflicts = findLayerConflicts(internalItems);

    return {
      items: internalItems,
      tracks,
      conflicts,
      duration: storyDuration
    };
  }, [selectedStory]);

  /**
   * Cambia il livello di zoom della timeline principale
   */
  const setMainZoom = useCallback((zoom) => {
    const newZoom = Math.max(0.1, Math.min(10, zoom));
    setMainTimelineZoom(newZoom);

    // Aggiusta la larghezza visibile
    const baseWidth = 24 * 60 * 60 * 1000; // 24 ore
    setMainTimelineWidth(baseWidth / newZoom);
  }, []);

  /**
   * Cambia il livello di zoom della timeline interna
   */
  const setStoryZoom = useCallback((zoom) => {
    const newZoom = Math.max(0.1, Math.min(20, zoom));
    setStoryTimelineZoom(newZoom);

    // Aggiusta la larghezza visibile basandosi sulla durata della storia
    const storyDurationMs = storyTimelineData.duration || 5 * 60 * 1000;
    setStoryTimelineWidth(Math.max(storyDurationMs, 30 * 1000) / newZoom);
  }, [storyTimelineData.duration]);

  /**
   * Sposta la vista della timeline principale
   */
  const panMainTimeline = useCallback((deltaMs) => {
    setMainTimelineStart(prev => {
      const maxStart = Math.max(0, mainTimelineData.duration - mainTimelineWidth);
      return Math.max(0, Math.min(maxStart, prev + deltaMs));
    });
  }, [mainTimelineData.duration, mainTimelineWidth]);

  /**
   * Sposta la vista della timeline interna
   */
  const panStoryTimeline = useCallback((deltaMs) => {
    setStoryTimelineStart(prev => {
      const maxStart = Math.max(0, storyTimelineData.duration - storyTimelineWidth);
      return Math.max(0, Math.min(maxStart, prev + deltaMs));
    });
  }, [storyTimelineData.duration, storyTimelineWidth]);

  /**
   * Seleziona/deseleziona elementi
   */
  const toggleItemSelection = useCallback((itemId, multiSelect = false) => {
    setSelectedItems(prev => {
      if (!multiSelect) {
        return prev.includes(itemId) ? [] : [itemId];
      }

      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  /**
   * Pulisce la selezione
   */
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  /**
   * Aggiorna la posizione di un elemento nella timeline principale
   */
  const updateMainItemPosition = useCallback((itemId, newStartTimeMs) => {
    // Questa funzione dovrebbe essere collegata al sistema di aggiornamento degli items
    // Per ora restituisce i dati per l'aggiornamento
    const newStartTime = msToTimecode(newStartTimeMs, 25, false);

    return {
      itemId,
      updates: {
        'data.timing.startTime': newStartTime
      }
    };
  }, []);

  /**
   * Aggiorna la posizione di un internal_item
   */
  const updateInternalItemPosition = useCallback((itemId, newStartTimeMs, newTrackId = null) => {
    if (!selectedStory) return null;

    const newStartTime = msToTimecode(newStartTimeMs);

    return {
      storyId: selectedStory.id,
      itemId,
      updates: {
        relative_start_time: newStartTime,
        ...(newTrackId && { track: newTrackId })
      }
    };
  }, [selectedStory]);

  /**
   * Aggiorna la durata di un elemento
   */
  const updateItemDuration = useCallback((itemId, newDurationMs, isInternal = false) => {
    const newDuration = msToTimecode(newDurationMs);

    if (isInternal) {
      return {
        storyId: selectedStory?.id,
        itemId,
        updates: { duration: newDuration }
      };
    } else {
      return {
        itemId,
        updates: {
          'data.timing.duration': newDuration
        }
      };
    }
  }, [selectedStory]);

  /**
   * Ottiene le informazioni di snap per un tempo dato
   */
  const getSnapInfo = useCallback((timeMs, isInternal = false) => {
    if (!snapToGrid) return { snappedTime: timeMs, snapLines: [] };

    const snappedTime = Math.round(timeMs / gridSize) * gridSize;
    const snapLines = [];

    // Aggiungi linee di snap per la griglia
    const currentData = isInternal ? storyTimelineData : mainTimelineData;
    const timelineStart = isInternal ? storyTimelineStart : mainTimelineStart;
    const timelineWidth = isInternal ? storyTimelineWidth : mainTimelineWidth;

    // Linee di griglia
    for (let t = timelineStart; t <= timelineStart + timelineWidth; t += gridSize) {
      snapLines.push({ time: t, type: 'grid' });
    }

    // Linee per inizio/fine di altri elementi
    currentData.items.forEach(item => {
      if (Math.abs(item.startTimeMs - timeMs) < gridSize) {
        snapLines.push({ time: item.startTimeMs, type: 'item-start', itemId: item.id });
      }
      if (Math.abs(item.endTimeMs - timeMs) < gridSize) {
        snapLines.push({ time: item.endTimeMs, type: 'item-end', itemId: item.id });
      }
    });

    return { snappedTime, snapLines };
  }, [snapToGrid, gridSize, mainTimelineData, storyTimelineData, mainTimelineStart, storyTimelineStart, mainTimelineWidth, storyTimelineWidth]);

  /**
   * Effetto per aggiornare la timeline quando cambia la storia selezionata
   */
  useEffect(() => {
    if (selectedStory) {
      setViewMode('story');
      setStoryTimelineStart(0);
      // Reset zoom per adattarsi alla durata della storia
      const storyDurationMs = timecodeToMs(selectedStory.data?.timing?.duration || '00:01:00');
      const optimalZoom = Math.max(0.5, Math.min(2, (5 * 60 * 1000) / storyDurationMs));
      setStoryZoom(optimalZoom);
    } else {
      setViewMode('main');
    }
  }, [selectedStory, setStoryZoom]);

  return {
    // Dati timeline
    mainTimelineData,
    storyTimelineData,

    // Stati visualizzazione
    viewMode,
    setViewMode,
    selectedItems,
    draggedItem,
    setDraggedItem,

    // Zoom e pan
    mainTimelineZoom,
    mainTimelineStart,
    mainTimelineWidth,
    storyTimelineZoom,
    storyTimelineStart,
    storyTimelineWidth,
    setMainZoom,
    setStoryZoom,
    panMainTimeline,
    panStoryTimeline,

    // Selezione
    toggleItemSelection,
    clearSelection,

    // Aggiornamenti
    updateMainItemPosition,
    updateInternalItemPosition,
    updateItemDuration,

    // Snap e griglia
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    getSnapInfo
  };
};

export default useTimelineData;
