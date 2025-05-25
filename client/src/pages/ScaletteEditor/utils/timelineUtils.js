/**
 * Utility functions per la gestione della Timeline Visuale Avanzata
 * Funzioni per calcoli temporali, conversioni e manipolazione dati timeline
 */

/**
 * Converte un timecode in millisecondi
 * @param {string} timecode - Timecode nel formato HH:MM:SS:FF o HH:MM:SS
 * @param {number} fps - Frame rate (default: 25)
 * @returns {number} - Millisecondi
 */
export const timecodeToMs = (timecode, fps = 25) => {
  if (!timecode || typeof timecode !== 'string') return 0;
  
  const parts = timecode.split(':');
  if (parts.length < 3) return 0;
  
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;
  const frames = parts.length > 3 ? parseInt(parts[3]) || 0 : 0;
  
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + (frames * 1000 / fps);
};

/**
 * Converte millisecondi in timecode
 * @param {number} ms - Millisecondi
 * @param {number} fps - Frame rate (default: 25)
 * @param {boolean} includeFrames - Se includere i frame nel formato (default: true)
 * @returns {string} - Timecode nel formato HH:MM:SS:FF o HH:MM:SS
 */
export const msToTimecode = (ms, fps = 25, includeFrames = true) => {
  if (!ms || ms < 0) return includeFrames ? '00:00:00:00' : '00:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const frames = Math.floor((ms % 1000) / (1000 / fps));
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  const s = seconds.toString().padStart(2, '0');
  const f = frames.toString().padStart(2, '0');
  
  return includeFrames ? `${h}:${m}:${s}:${f}` : `${h}:${m}:${s}`;
};

/**
 * Calcola la posizione X di un elemento sulla timeline
 * @param {number} startTimeMs - Tempo di inizio in millisecondi
 * @param {number} timelineStartMs - Inizio della timeline visibile in millisecondi
 * @param {number} timelineWidthMs - Larghezza della timeline visibile in millisecondi
 * @param {number} canvasWidth - Larghezza del canvas in pixel
 * @returns {number} - Posizione X in pixel
 */
export const calculateItemX = (startTimeMs, timelineStartMs, timelineWidthMs, canvasWidth) => {
  const relativeStartMs = startTimeMs - timelineStartMs;
  return (relativeStartMs / timelineWidthMs) * canvasWidth;
};

/**
 * Calcola la larghezza di un elemento sulla timeline
 * @param {number} durationMs - Durata in millisecondi
 * @param {number} timelineWidthMs - Larghezza della timeline visibile in millisecondi
 * @param {number} canvasWidth - Larghezza del canvas in pixel
 * @returns {number} - Larghezza in pixel
 */
export const calculateItemWidth = (durationMs, timelineWidthMs, canvasWidth) => {
  return Math.max(2, (durationMs / timelineWidthMs) * canvasWidth);
};

/**
 * Calcola il tempo corrispondente a una posizione X sulla timeline
 * @param {number} x - Posizione X in pixel
 * @param {number} timelineStartMs - Inizio della timeline visibile in millisecondi
 * @param {number} timelineWidthMs - Larghezza della timeline visibile in millisecondi
 * @param {number} canvasWidth - Larghezza del canvas in pixel
 * @returns {number} - Tempo in millisecondi
 */
export const calculateTimeFromX = (x, timelineStartMs, timelineWidthMs, canvasWidth) => {
  const relativeX = x / canvasWidth;
  return timelineStartMs + (relativeX * timelineWidthMs);
};

/**
 * Snap di un tempo alla griglia più vicina
 * @param {number} timeMs - Tempo in millisecondi
 * @param {number} gridSizeMs - Dimensione della griglia in millisecondi
 * @returns {number} - Tempo snappato in millisecondi
 */
export const snapToGrid = (timeMs, gridSizeMs) => {
  return Math.round(timeMs / gridSizeMs) * gridSizeMs;
};

/**
 * Verifica se due elementi si sovrappongono temporalmente
 * @param {Object} item1 - Primo elemento con startTime e duration
 * @param {Object} item2 - Secondo elemento con startTime e duration
 * @returns {boolean} - True se si sovrappongono
 */
export const itemsOverlap = (item1, item2) => {
  const start1 = timecodeToMs(item1.relative_start_time || item1.startTime);
  const end1 = start1 + timecodeToMs(item1.duration);
  const start2 = timecodeToMs(item2.relative_start_time || item2.startTime);
  const end2 = start2 + timecodeToMs(item2.duration);
  
  return start1 < end2 && start2 < end1;
};

/**
 * Trova conflitti di layer tra elementi
 * @param {Array} items - Array di elementi
 * @returns {Array} - Array di conflitti trovati
 */
export const findLayerConflicts = (items) => {
  const conflicts = [];
  
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];
      
      // Verifica se sono sullo stesso layer e canale
      if (item1.layer === item2.layer && 
          item1.channel === item2.channel && 
          itemsOverlap(item1, item2)) {
        conflicts.push({
          items: [item1, item2],
          type: 'layer_overlap',
          layer: item1.layer,
          channel: item1.channel
        });
      }
    }
  }
  
  return conflicts;
};

/**
 * Genera colori per i diversi tipi di elementi
 * @param {string} type - Tipo dell'elemento
 * @param {boolean} isSelected - Se l'elemento è selezionato
 * @param {boolean} hasConflict - Se l'elemento ha conflitti
 * @returns {Object} - Oggetto con colori per background, border, text
 */
export const getItemColors = (type, isSelected = false, hasConflict = false) => {
  const baseColors = {
    MEDIA: { bg: '#4CAF50', border: '#388E3C', text: '#FFFFFF' },
    TEMPLATE: { bg: '#2196F3', border: '#1976D2', text: '#FFFFFF' },
    STORY: { bg: '#FF9800', border: '#F57C00', text: '#FFFFFF' },
    AUDIO: { bg: '#9C27B0', border: '#7B1FA2', text: '#FFFFFF' },
    COMMAND: { bg: '#607D8B', border: '#455A64', text: '#FFFFFF' }
  };
  
  let colors = baseColors[type] || baseColors.MEDIA;
  
  if (hasConflict) {
    colors = { bg: '#F44336', border: '#D32F2F', text: '#FFFFFF' };
  }
  
  if (isSelected) {
    colors = {
      ...colors,
      border: '#FFC107',
      bg: colors.bg + 'DD' // Aggiunge trasparenza
    };
  }
  
  return colors;
};

/**
 * Calcola le tracce automaticamente basandosi sui layer
 * @param {Array} items - Array di elementi
 * @returns {Array} - Array di tracce con informazioni
 */
export const calculateTracks = (items) => {
  const layerMap = new Map();
  
  // Raggruppa per layer
  items.forEach(item => {
    const key = `${item.channel}-${item.layer}`;
    if (!layerMap.has(key)) {
      layerMap.set(key, {
        id: key,
        name: `CH${item.channel}-L${item.layer}`,
        channel: item.channel,
        layer: item.layer,
        items: []
      });
    }
    layerMap.get(key).items.push(item);
  });
  
  // Ordina per canale e layer
  return Array.from(layerMap.values()).sort((a, b) => {
    if (a.channel !== b.channel) return a.channel - b.channel;
    return a.layer - b.layer;
  });
};

/**
 * Valida la struttura di un internal_item
 * @param {Object} item - Elemento da validare
 * @returns {Object} - Risultato della validazione con isValid e errors
 */
export const validateInternalItem = (item) => {
  const errors = [];
  
  if (!item.id) errors.push('ID mancante');
  if (!item.type) errors.push('Tipo mancante');
  if (!item.name) errors.push('Nome mancante');
  if (!item.relative_start_time) errors.push('Tempo di inizio mancante');
  if (!item.duration) errors.push('Durata mancante');
  if (typeof item.track !== 'number') errors.push('Traccia non valida');
  if (typeof item.layer !== 'number') errors.push('Layer non valido');
  if (typeof item.channel !== 'number') errors.push('Canale non valido');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Crea un nuovo internal_item con valori di default
 * @param {string} type - Tipo dell'elemento
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Object} - Nuovo internal_item
 */
export const createInternalItem = (type, options = {}) => {
  const baseItem = {
    id: `internal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name: options.name || `Nuovo ${type}`,
    relative_start_time: options.startTime || '00:00:00:00',
    duration: options.duration || '00:00:10:00',
    track: options.track || 1,
    layer: options.layer || 10,
    channel: options.channel || 1,
    data: options.data || {}
  };
  
  // Dati specifici per tipo
  switch (type) {
    case 'MEDIA':
      baseItem.data = {
        clipPath: '',
        inPoint: '00:00:00:00',
        outPoint: baseItem.duration,
        loop: false,
        ...options.data
      };
      break;
      
    case 'TEMPLATE':
      baseItem.data = {
        templateFile: '',
        cgLayer: 1,
        playOnLoad: true,
        instanceData: {},
        ...options.data
      };
      break;
      
    default:
      break;
  }
  
  return baseItem;
};
