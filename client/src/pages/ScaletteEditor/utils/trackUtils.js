/**
 * Utility functions per la gestione delle tracce nella Timeline Visuale
 * Funzioni per organizzazione, ordinamento e gestione delle tracce
 */

/**
 * Configurazione predefinita delle tracce per diversi tipi di contenuto
 */
// Import delle utility necessarie
import { timecodeToMs, msToTimecode } from './timelineUtils.js';

export const DEFAULT_TRACK_CONFIGS = {
  VIDEO: {
    name: 'Video',
    color: '#4CAF50',
    height: 60,
    allowedTypes: ['MEDIA'],
    defaultLayer: 10
  },
  GRAPHICS: {
    name: 'Grafiche',
    color: '#2196F3',
    height: 40,
    allowedTypes: ['TEMPLATE'],
    defaultLayer: 20
  },
  LOWER_THIRDS: {
    name: 'Lower Thirds',
    color: '#FF9800',
    height: 35,
    allowedTypes: ['TEMPLATE'],
    defaultLayer: 21
  },
  AUDIO: {
    name: 'Audio',
    color: '#9C27B0',
    height: 30,
    allowedTypes: ['AUDIO', 'MEDIA'],
    defaultLayer: 30
  },
  COMMANDS: {
    name: 'Comandi',
    color: '#607D8B',
    height: 25,
    allowedTypes: ['COMMAND'],
    defaultLayer: 40
  }
};

/**
 * Crea una nuova traccia
 * @param {Object} options - Opzioni per la creazione della traccia
 * @returns {Object} - Nuova traccia
 */
export const createTrack = (options = {}) => {
  return {
    id: options.id || `track-${Date.now()}`,
    name: options.name || 'Nuova Traccia',
    channel: options.channel || 1,
    layer: options.layer || 10,
    height: options.height || 50,
    color: options.color || '#4CAF50',
    allowedTypes: options.allowedTypes || ['MEDIA', 'TEMPLATE'],
    visible: options.visible !== false,
    locked: options.locked || false,
    muted: options.muted || false,
    solo: options.solo || false,
    order: options.order || 0,
    items: []
  };
};

/**
 * Organizza automaticamente le tracce basandosi sui layer CasparCG
 * @param {Array} items - Array di internal_items
 * @param {Object} options - Opzioni di organizzazione
 * @returns {Array} - Array di tracce organizzate
 */
export const organizeTracksByLayers = (items, options = {}) => {
  const { groupByType = true } = options;
  const trackMap = new Map();

  items.forEach(item => {
    let trackKey;

    if (groupByType) {
      // Raggruppa per tipo e layer
      trackKey = `${item.type}-${item.channel}-${item.layer}`;
    } else {
      // Raggruppa solo per canale e layer
      trackKey = `${item.channel}-${item.layer}`;
    }

    if (!trackMap.has(trackKey)) {
      const trackConfig = getTrackConfigForType(item.type);
      const track = createTrack({
        id: trackKey,
        name: generateTrackName(item, groupByType),
        channel: item.channel,
        layer: item.layer,
        color: trackConfig.color,
        height: trackConfig.height,
        allowedTypes: trackConfig.allowedTypes,
        order: calculateTrackOrder(item)
      });
      trackMap.set(trackKey, track);
    }

    trackMap.get(trackKey).items.push(item);
  });

  // Ordina le tracce
  return Array.from(trackMap.values()).sort((a, b) => {
    if (a.channel !== b.channel) return a.channel - b.channel;
    if (a.layer !== b.layer) return a.layer - b.layer;
    return a.order - b.order;
  });
};

/**
 * Ottiene la configurazione della traccia per un tipo di elemento
 * @param {string} type - Tipo dell'elemento
 * @returns {Object} - Configurazione della traccia
 */
export const getTrackConfigForType = (type) => {
  switch (type) {
    case 'MEDIA':
      return DEFAULT_TRACK_CONFIGS.VIDEO;
    case 'TEMPLATE':
      return DEFAULT_TRACK_CONFIGS.GRAPHICS;
    case 'AUDIO':
      return DEFAULT_TRACK_CONFIGS.AUDIO;
    case 'COMMAND':
      return DEFAULT_TRACK_CONFIGS.COMMANDS;
    default:
      return DEFAULT_TRACK_CONFIGS.VIDEO;
  }
};

/**
 * Genera un nome per la traccia
 * @param {Object} item - Elemento di riferimento
 * @param {boolean} includeType - Se includere il tipo nel nome
 * @returns {string} - Nome della traccia
 */
export const generateTrackName = (item, includeType = true) => {
  const baseName = `CH${item.channel}-L${item.layer}`;

  if (!includeType) return baseName;

  const typeNames = {
    MEDIA: 'Video',
    TEMPLATE: 'Grafica',
    AUDIO: 'Audio',
    COMMAND: 'Comando'
  };

  const typeName = typeNames[item.type] || item.type;
  return `${baseName} (${typeName})`;
};

/**
 * Calcola l'ordine di visualizzazione della traccia
 * @param {Object} item - Elemento di riferimento
 * @returns {number} - Ordine della traccia
 */
export const calculateTrackOrder = (item) => {
  // Ordine basato su tipo e layer
  const typeOrder = {
    MEDIA: 1000,
    TEMPLATE: 2000,
    AUDIO: 3000,
    COMMAND: 4000
  };

  return (typeOrder[item.type] || 1000) + item.layer;
};

/**
 * Trova la traccia appropriata per un elemento
 * @param {Array} tracks - Array di tracce disponibili
 * @param {Object} item - Elemento da posizionare
 * @returns {Object|null} - Traccia trovata o null
 */
export const findTrackForItem = (tracks, item) => {
  // Prima cerca una traccia esatta (stesso canale, layer e tipo compatibile)
  let exactTrack = tracks.find(track =>
    track.channel === item.channel &&
    track.layer === item.layer &&
    track.allowedTypes.includes(item.type)
  );

  if (exactTrack) return exactTrack;

  // Poi cerca una traccia compatibile per tipo
  let compatibleTrack = tracks.find(track =>
    track.allowedTypes.includes(item.type) &&
    !track.locked
  );

  return compatibleTrack || null;
};

/**
 * Verifica se un elemento può essere posizionato su una traccia
 * @param {Object} track - Traccia di destinazione
 * @param {Object} item - Elemento da verificare
 * @param {number} targetTime - Tempo di destinazione in ms
 * @returns {Object} - Risultato della verifica
 */
export const canPlaceItemOnTrack = (track, item, targetTime) => {
  if (track.locked) {
    return { canPlace: false, reason: 'Traccia bloccata' };
  }

  if (!track.allowedTypes.includes(item.type)) {
    return { canPlace: false, reason: 'Tipo non compatibile' };
  }

  // Verifica sovrapposizioni temporali
  const itemDurationMs = timecodeToMs(item.duration);
  const itemEndTime = targetTime + itemDurationMs;

  for (const existingItem of track.items) {
    const existingStartMs = timecodeToMs(existingItem.relative_start_time);
    const existingEndMs = existingStartMs + timecodeToMs(existingItem.duration);

    if (targetTime < existingEndMs && itemEndTime > existingStartMs) {
      return { canPlace: false, reason: 'Sovrapposizione temporale' };
    }
  }

  return { canPlace: true };
};

/**
 * Sposta un elemento tra tracce
 * @param {Array} tracks - Array di tracce
 * @param {string} itemId - ID dell'elemento da spostare
 * @param {string} targetTrackId - ID della traccia di destinazione
 * @param {number} targetTime - Tempo di destinazione in ms
 * @returns {Object} - Risultato dell'operazione
 */
export const moveItemBetweenTracks = (tracks, itemId, targetTrackId, targetTime) => {
  // Trova l'elemento e la traccia di origine
  let sourceTrack = null;
  let item = null;

  for (const track of tracks) {
    const foundItem = track.items.find(i => i.id === itemId);
    if (foundItem) {
      sourceTrack = track;
      item = foundItem;
      break;
    }
  }

  if (!item || !sourceTrack) {
    return { success: false, error: 'Elemento non trovato' };
  }

  // Trova la traccia di destinazione
  const targetTrack = tracks.find(t => t.id === targetTrackId);
  if (!targetTrack) {
    return { success: false, error: 'Traccia di destinazione non trovata' };
  }

  // Verifica se il posizionamento è possibile
  const canPlace = canPlaceItemOnTrack(targetTrack, item, targetTime);
  if (!canPlace.canPlace) {
    return { success: false, error: canPlace.reason };
  }

  // Rimuovi dalla traccia di origine
  sourceTrack.items = sourceTrack.items.filter(i => i.id !== itemId);

  // Aggiorna l'elemento con nuovi parametri
  const updatedItem = {
    ...item,
    relative_start_time: msToTimecode(targetTime),
    channel: targetTrack.channel,
    layer: targetTrack.layer,
    track: targetTrack.order
  };

  // Aggiungi alla traccia di destinazione
  targetTrack.items.push(updatedItem);

  return { success: true, item: updatedItem };
};

/**
 * Ottimizza l'altezza delle tracce basandosi sul contenuto
 * @param {Array} tracks - Array di tracce
 * @returns {Array} - Tracce con altezze ottimizzate
 */
export const optimizeTrackHeights = (tracks) => {
  return tracks.map(track => {
    let optimalHeight = 40; // Altezza minima

    // Aumenta l'altezza basandosi sul numero di elementi sovrapposti
    const maxOverlaps = calculateMaxOverlaps(track.items);
    if (maxOverlaps > 1) {
      optimalHeight = Math.min(100, 40 + (maxOverlaps - 1) * 15);
    }

    // Aumenta per tipi specifici
    if (track.allowedTypes.includes('MEDIA')) {
      optimalHeight = Math.max(optimalHeight, 60);
    }

    return {
      ...track,
      height: optimalHeight
    };
  });
};

/**
 * Calcola il numero massimo di sovrapposizioni in una traccia
 * @param {Array} items - Elementi della traccia
 * @returns {number} - Numero massimo di sovrapposizioni
 */
export const calculateMaxOverlaps = (items) => {
  if (items.length <= 1) return items.length;

  // Crea eventi di inizio e fine
  const events = [];
  items.forEach(item => {
    const startMs = timecodeToMs(item.relative_start_time);
    const endMs = startMs + timecodeToMs(item.duration);
    events.push({ time: startMs, type: 'start' });
    events.push({ time: endMs, type: 'end' });
  });

  // Ordina per tempo
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.type === 'end' ? -1 : 1; // Fine prima di inizio allo stesso tempo
  });

  // Calcola sovrapposizioni
  let currentOverlaps = 0;
  let maxOverlaps = 0;

  events.forEach(event => {
    if (event.type === 'start') {
      currentOverlaps++;
      maxOverlaps = Math.max(maxOverlaps, currentOverlaps);
    } else {
      currentOverlaps--;
    }
  });

  return maxOverlaps;
};
