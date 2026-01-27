/**
 * Utility per i comandi CasparCG
 */

/**
 * Genera un comando PLAY
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {string} clip - Nome del clip da riprodurre
 * @param {number|null} seekFrame - Frame da cui iniziare la riproduzione (opzionale)
 * @returns {string} - Comando PLAY formattato
 */
export const generatePlayCommand = (channel, layer, clip, seekFrame = null) => {
  if (seekFrame !== null && seekFrame >= 0) {
    return `PLAY ${channel}-${layer} "${clip}" SEEK ${seekFrame}`;
  }
  return `PLAY ${channel}-${layer} "${clip}"`;
};

/**
 * Genera un comando LOADBG
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {string} clip - Nome del clip da caricare
 * @param {number|null} seekFrame - Frame da cui iniziare la riproduzione (opzionale)
 * @returns {string} - Comando LOADBG formattato
 */
export const generateLoadBgCommand = (channel, layer, clip, seekFrame = null) => {
  if (seekFrame !== null && seekFrame >= 0) {
    return `LOADBG ${channel}-${layer} "${clip}" SEEK ${seekFrame}`;
  }
  return `LOADBG ${channel}-${layer} "${clip}"`;
};

/**
 * Genera un comando PAUSE
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @returns {string} - Comando PAUSE formattato
 */
export const generatePauseCommand = (channel, layer) => {
  return `PAUSE ${channel}-${layer}`;
};

/**
 * Genera un comando RESUME
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @returns {string} - Comando RESUME formattato
 */
export const generateResumeCommand = (channel, layer) => {
  return `RESUME ${channel}-${layer}`;
};

/**
 * Genera un comando STOP
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @returns {string} - Comando STOP formattato
 */
export const generateStopCommand = (channel, layer) => {
  return `STOP ${channel}-${layer}`;
};

/**
 * Genera un comando CALL SEEK
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {number} frame - Frame a cui posizionarsi
 * @returns {string} - Comando CALL SEEK formattato
 */
export const generateCallSeekCommand = (channel, layer, frame) => {
  return `CALL ${channel}-${layer} SEEK ${frame}`;
};

/**
 * Genera un comando LOAD
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {string} clip - Nome del clip da caricare
 * @returns {string} - Comando LOAD formattato
 */
export const generateCallLoadCommand = (channel, layer, clip) => {
  // Il comando LOAD carica un file senza avviarne la riproduzione
  return `LOAD ${channel}-${layer} "${clip}"`;
};

/**
 * Genera un comando CG ADD
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {number} cgLayer - Layer CG
 * @param {string} template - Nome del template
 * @param {boolean} playOnLoad - Se riprodurre il template dopo il caricamento
 * @param {object} data - Dati da passare al template
 * @returns {string} - Comando CG ADD formattato
 */
export const generateCgAddCommand = (channel, layer, cgLayer, template, playOnLoad, data) => {
  const jsonData = JSON.stringify(data).replace(/"/g, '\\"');
  return `CG ${channel}-${layer} ADD ${cgLayer} "${template}" ${playOnLoad ? '1' : '0'} "${jsonData}"`;
};

/**
 * Genera un comando CG PLAY
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {number} cgLayer - Layer CG
 * @returns {string} - Comando CG PLAY formattato
 */
export const generateCgPlayCommand = (channel, layer, cgLayer) => {
  return `CG ${channel}-${layer} PLAY ${cgLayer}`;
};

/**
 * Genera un comando CG STOP
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {number} cgLayer - Layer CG
 * @returns {string} - Comando CG STOP formattato
 */
export const generateCgStopCommand = (channel, layer, cgLayer) => {
  return `CG ${channel}-${layer} STOP ${cgLayer}`;
};

/**
 * Genera un comando CG REMOVE
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {number} cgLayer - Layer CG
 * @returns {string} - Comando CG REMOVE formattato
 */
export const generateCgRemoveCommand = (channel, layer, cgLayer) => {
  return `CG ${channel}-${layer} REMOVE ${cgLayer}`;
};

/**
 * Genera una sequenza di comandi per caricare e visualizzare il primo frame di un media
 * in modo robusto, utilizzando i comandi standard di CasparCG
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @param {string} clip - Nome del clip da caricare
 * @param {number|null} seekFrame - Frame da cui iniziare la riproduzione (opzionale)
 * @returns {Array<string>} - Array di comandi da eseguire in sequenza
 */
const generateRobustLoadSequence = (channel, layer, clip, seekFrame = null) => {
  const commands = [];

  // Opzione 1: Usa LOAD se non c'è un punto di seek specifico
  if (seekFrame === null || seekFrame <= 0) {
    // Il comando LOAD carica un file senza avviarne la riproduzione
    commands.push(`LOAD ${channel}-${layer} "${clip}"`);
  }
  // Opzione 2: Se c'è un punto di seek, usa PLAY con SEEK e poi PAUSE
  else {
    // Usa PLAY con SEEK per iniziare da un frame specifico
    commands.push(`PLAY ${channel}-${layer} "${clip}" SEEK ${seekFrame}`);
    // Metti in pausa immediatamente
    commands.push(`PAUSE ${channel}-${layer}`);
  }

  return commands;
};

// Esporta tutte le funzioni in un oggetto default
const casparCommands = {
  generatePlayCommand,
  generateLoadBgCommand,
  generatePauseCommand,
  generateResumeCommand,
  generateStopCommand,
  generateCallSeekCommand,
  generateCallLoadCommand,
  generateCgAddCommand,
  generateCgPlayCommand,
  generateCgStopCommand,
  generateCgRemoveCommand,
  generateRobustLoadSequence
};

// Esporta l'oggetto come default
export default casparCommands;
