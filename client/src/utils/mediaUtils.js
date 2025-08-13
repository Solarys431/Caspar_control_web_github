/**
 * Utility functions per la gestione del formato media/template dual (string vs object)
 * 
 * FORMATO LEGACY: mediaList = ["file1.mp4", "file2.png", ...]
 * FORMATO NUOVO: mediaList = [{name: "file1.mp4", path: "...", httpUrl: "...", source: "assets"}, ...]
 */

/**
 * Estrae il nome per display da un elemento media/template
 * @param {string|object} item - L'elemento media/template
 * @returns {string} - Il nome per display
 */
export const getMediaDisplayName = (item) => {
  if (typeof item === 'string') {
    return item;
  }
  
  if (typeof item === 'object' && item) {
    return item.name || item.path || item.filename || 'Media sconosciuto';
  }
  
  return 'Media sconosciuto';
};

/**
 * Estrae il path/valore effettivo da un elemento media/template
 * @param {string|object} item - L'elemento media/template
 * @returns {string} - Il path/valore per l'uso nelle API
 */
export const getMediaValue = (item) => {
  if (typeof item === 'string') {
    return item;
  }
  
  if (typeof item === 'object' && item) {
    return item.path || item.name || item.filename || item;
  }
  
  return item;
};

/**
 * Estrae il nome file dal path (gestisce sia stringhe che oggetti)
 * @param {string|object} item - L'elemento media/template
 * @returns {string} - Il nome file senza path
 */
export const getMediaFileName = (item) => {
  const value = getMediaValue(item);
  if (typeof value === 'string') {
    return value.split('/').pop();
  }
  return 'Media sconosciuto';
};

/**
 * Estrae il nome file senza estensione (per rundown names)
 * @param {string|object} item - L'elemento media/template
 * @returns {string} - Il nome file senza estensione
 */
export const getMediaBaseName = (item) => {
  const fileName = getMediaFileName(item);
  return fileName.split('.')[0];
};

/**
 * Genera una key univoca per React maps
 * @param {string|object} item - L'elemento media/template
 * @param {number} index - Index dell'array come fallback
 * @returns {string} - Key univoca per React
 */
export const getMediaKey = (item, index = 0) => {
  const displayName = getMediaDisplayName(item);
  return displayName !== 'Media sconosciuto' ? displayName : `item-${index}`;
};

/**
 * Verifica se un elemento è nel formato oggetto nuovo
 * @param {string|object} item - L'elemento da verificare
 * @returns {boolean} - True se è nel formato oggetto
 */
export const isObjectFormat = (item) => {
  return typeof item === 'object' && item !== null && (item.name || item.path);
};

/**
 * Converte un array di media nel formato consistente per backwards compatibility
 * @param {Array} mediaArray - Array di media/template
 * @returns {Array} - Array normalizzato
 */
export const normalizeMediaArray = (mediaArray) => {
  if (!Array.isArray(mediaArray)) {
    return [];
  }
  
  return mediaArray.map((item, index) => ({
    original: item,
    displayName: getMediaDisplayName(item),
    value: getMediaValue(item),
    fileName: getMediaFileName(item),
    baseName: getMediaBaseName(item),
    key: getMediaKey(item, index),
    isObject: isObjectFormat(item)
  }));
};

/**
 * Filtra array di media per termine di ricerca (gestisce dual format)
 * @param {Array} mediaArray - Array di media/template
 * @param {string} searchTerm - Termine di ricerca
 * @returns {Array} - Array filtrato
 */
export const filterMediaBySearch = (mediaArray, searchTerm) => {
  if (!searchTerm || !Array.isArray(mediaArray)) {
    return mediaArray;
  }
  
  const lowerSearch = searchTerm.toLowerCase();
  return mediaArray.filter(item => {
    const displayName = getMediaDisplayName(item);
    return displayName.toLowerCase().includes(lowerSearch);
  });
};

/**
 * Template specifiche utility functions
 */
export const getTemplateDisplayName = getMediaDisplayName;
export const getTemplateValue = getMediaValue;
export const getTemplateFileName = getMediaFileName;
export const getTemplateBaseName = getMediaBaseName;
export const getTemplateKey = getMediaKey;

/**
 * Determina il tipo di file per un elemento media
 * @param {string|object} item - L'elemento media
 * @returns {string} - Il tipo di file (video, image, audio, other)
 */
export const getFileType = (item) => {
  const fileName = getMediaFileName(item);
  if (!fileName) return 'unknown';

  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return 'unknown';

  // Tipi di file video
  if (['mp4', 'mov', 'avi', 'wmv', 'mkv', 'flv', 'webm', 'mxf'].includes(extension)) {
    return 'video';
  }

  // Tipi di file immagine
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'tga'].includes(extension)) {
    return 'image';
  }

  // Tipi di file audio
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma'].includes(extension)) {
    return 'audio';
  }

  return 'other';
};

/**
 * Determina il tipo di template in base al nome
 * @param {string|object} item - L'elemento template
 * @returns {string} - Il tipo di template
 */
export const getTemplateType = (item) => {
  const name = getMediaDisplayName(item);
  if (!name) return 'generic';
  
  const lowerName = name.toLowerCase();
  if (lowerName.includes('ticker')) return 'ticker';
  if (lowerName.includes('lower') && lowerName.includes('third')) return 'lower_third';
  if (lowerName.includes('logo')) return 'logo';
  if (lowerName.includes('text')) return 'text';
  
  return 'generic';
};