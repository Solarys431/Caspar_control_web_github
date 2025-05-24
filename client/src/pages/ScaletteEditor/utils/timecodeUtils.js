/**
 * Utility per la gestione dei timecode
 */

/**
 * Converte un timecode in frame
 *
 * @param {string} timecode - Timecode nel formato HH:MM:SS:FF
 * @param {number} fps - Frame per secondo (default: 25)
 * @returns {number} - Numero totale di frame
 */
export const timecodeToFrames = (timecode, fps = 25) => {
  try {
    // Formato atteso: HH:MM:SS:FF
    const parts = timecode.split(':');
    if (parts.length !== 4) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    const frames = parseInt(parts[3], 10);

    return frames + (seconds * fps) + (minutes * 60 * fps) + (hours * 60 * 60 * fps);
  } catch (error) {
    console.error('Errore nella conversione del timecode:', error);
    return 0;
  }
};

/**
 * Converte un numero di frame in timecode
 *
 * @param {number} frames - Numero totale di frame
 * @param {number} fps - Frame per secondo (default: 25)
 * @returns {string} - Timecode nel formato HH:MM:SS:FF
 */
export const framesToTimecode = (frames, fps = 25) => {
  try {
    if (frames < 0) frames = 0;

    const hours = Math.floor(frames / (fps * 60 * 60));
    const minutes = Math.floor((frames % (fps * 60 * 60)) / (fps * 60));
    const seconds = Math.floor((frames % (fps * 60)) / fps);
    const remainingFrames = frames % fps;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${remainingFrames.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Errore nella conversione dei frame in timecode:', error);
    return '00:00:00:00';
  }
};

/**
 * Valida un timecode
 *
 * @param {string} timecode - Timecode da validare
 * @param {number} fps - Frame per secondo (default: 25)
 * @returns {boolean} - true se il timecode è valido, false altrimenti
 */
export const isValidTimecode = (timecode, fps = 25) => {
  if (!timecode) return false;

  // Formato atteso: HH:MM:SS:FF
  const regex = /^([0-9]{2}):([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
  if (!regex.test(timecode)) return false;

  const parts = timecode.split(':');
  // Non utilizziamo hours nella validazione, ma lo manteniamo per chiarezza
  // const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const frames = parseInt(parts[3], 10);

  // Validazione dei valori
  if (minutes >= 60 || seconds >= 60 || frames >= fps) return false;

  return true;
};

/**
 * Calcola la differenza tra due timecode
 *
 * @param {string} timecode1 - Primo timecode
 * @param {string} timecode2 - Secondo timecode
 * @param {number} fps - Frame per secondo (default: 25)
 * @returns {string} - Differenza in formato timecode
 */
export const timecodeSubtract = (timecode1, timecode2, fps = 25) => {
  const frames1 = timecodeToFrames(timecode1, fps);
  const frames2 = timecodeToFrames(timecode2, fps);
  const diffFrames = Math.abs(frames1 - frames2);

  return framesToTimecode(diffFrames, fps);
};

/**
 * Aggiunge un numero di frame a un timecode
 *
 * @param {string} timecode - Timecode di partenza
 * @param {number} framesToAdd - Numero di frame da aggiungere
 * @param {number} fps - Frame per secondo (default: 25)
 * @returns {string} - Nuovo timecode
 */
export const addFramesToTimecode = (timecode, framesToAdd, fps = 25) => {
  const totalFrames = timecodeToFrames(timecode, fps) + framesToAdd;
  return framesToTimecode(totalFrames, fps);
};

// Creiamo un oggetto con tutte le funzioni esportate
const timecodeUtils = {
  timecodeToFrames,
  framesToTimecode,
  isValidTimecode,
  timecodeSubtract,
  addFramesToTimecode
};

export default timecodeUtils;
