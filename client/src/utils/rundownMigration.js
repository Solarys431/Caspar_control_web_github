/**
 * Utility per la migrazione dei rundown da localStorage a Supabase
 */
import supabase from '../supabaseClient';

/**
 * Migra un rundown da localStorage a Supabase
 * 
 * @param {Object} rundownData - Dati del rundown da localStorage
 * @param {string} userId - ID dell'utente proprietario
 * @returns {Promise<Object>} - Risultato della migrazione
 */
export const migrateRundownToSupabase = async (rundownData, userId) => {
  try {
    console.log('[RUNDOWN MIGRATION] Inizio migrazione rundown:', rundownData.name);

    // Crea il rundown principale
    const { data: rundownResult, error: rundownError } = await supabase
      .from('rundowns')
      .insert([
        {
          name: rundownData.name || 'Rundown Migrato',
          owner_id: userId
        }
      ])
      .select('id')
      .single();

    if (rundownError) {
      throw new Error(`Errore nella creazione del rundown: ${rundownError.message}`);
    }

    const rundownId = rundownResult.id;
    console.log('[RUNDOWN MIGRATION] Rundown creato con ID:', rundownId);

    // Migra gli elementi del rundown
    if (rundownData.items && rundownData.items.length > 0) {
      const migratedItems = [];

      for (let i = 0; i < rundownData.items.length; i++) {
        const item = rundownData.items[i];
        
        try {
          // Converte l'elemento dal formato localStorage al formato Supabase
          const migratedItem = convertItemToSupabaseFormat(item, rundownId, i, userId);
          
          const { data: itemResult, error: itemError } = await supabase
            .from('rundown_items')
            .insert([migratedItem])
            .select('id')
            .single();

          if (itemError) {
            console.error(`[RUNDOWN MIGRATION] Errore nella migrazione dell'elemento ${i}:`, itemError);
            continue; // Continua con il prossimo elemento
          }

          migratedItems.push(itemResult);
          console.log(`[RUNDOWN MIGRATION] Elemento ${i} migrato con ID:`, itemResult.id);
        } catch (itemError) {
          console.error(`[RUNDOWN MIGRATION] Errore nella conversione dell'elemento ${i}:`, itemError);
          continue;
        }
      }

      console.log(`[RUNDOWN MIGRATION] Migrati ${migratedItems.length}/${rundownData.items.length} elementi`);
    }

    return {
      success: true,
      rundownId,
      message: `Rundown "${rundownData.name}" migrato con successo`
    };

  } catch (error) {
    console.error('[RUNDOWN MIGRATION] Errore nella migrazione:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Converte un elemento dal formato localStorage al formato Supabase
 * 
 * @param {Object} item - Elemento dal localStorage
 * @param {string} rundownId - ID del rundown
 * @param {number} order - Ordine dell'elemento
 * @param {string} userId - ID dell'utente
 * @returns {Object} - Elemento convertito per Supabase
 */
const convertItemToSupabaseFormat = (item, rundownId, order, userId) => {
  // Determina il tipo dell'elemento
  let type = item.type || 'MEDIA';
  if (!type && item.data) {
    if (item.data.template) {
      type = 'TEMPLATE';
    } else if (item.data.clip) {
      type = 'MEDIA';
    } else if (item.data.content || item.data.templatesDetails) {
      type = 'STORY';
    }
  }

  // Prepara i dati JSONB
  let jsonbData = {};

  if (type === 'MEDIA') {
    jsonbData = {
      clip: item.data?.clip || item.data?.location || '',
      channel: item.data?.channel || 1,
      layer: item.data?.layer || 10,
      customName: item.data?.customName || item.name || '',
      loop: item.data?.loop || false,
      autoNext: item.data?.autoNext || false,
      linkedTemplate: item.data?.linkedTemplate || null,
      startTime: item.data?.startTime || '00:00:00',
      duration: item.data?.duration || '00:05:00',
      location: item.data?.location || item.data?.clip || '',
      note: item.data?.note || '',
      inPoint: item.data?.inPoint || '00:00:00',
      outPoint: item.data?.outPoint || '',
      notificationSent: item.data?.notificationSent || false,
      errorCount: item.data?.errorCount || 0,
      lastError: item.data?.lastError || null,
      lastPlayTime: item.data?.lastPlayTime || null
    };
  } else if (type === 'TEMPLATE') {
    jsonbData = {
      template: item.data?.template || item.data?.location || '',
      channel: item.data?.channel || 1,
      layer: item.data?.layer || 20,
      cgLayer: item.data?.cgLayer || 1,
      playOnLoad: item.data?.playOnLoad !== undefined ? item.data.playOnLoad : true,
      data: item.data?.data || {},
      customName: item.data?.customName || item.name || '',
      startTime: item.data?.startTime || '00:00:00',
      duration: item.data?.duration || '00:01:00',
      location: item.data?.location || item.data?.template || '',
      note: item.data?.note || '',
      inPoint: item.data?.inPoint || '00:00:00',
      outPoint: item.data?.outPoint || '',
      notificationSent: item.data?.notificationSent || false,
      errorCount: item.data?.errorCount || 0,
      lastError: item.data?.lastError || null,
      lastPlayTime: item.data?.lastPlayTime || null
    };
  } else if (type === 'STORY') {
    jsonbData = {
      customName: item.data?.customName || item.name || 'Storia Migrata',
      originalName: item.data?.originalName || item.name || 'Storia Migrata',
      content: item.data?.content || '',
      channel: item.data?.channel || item.data?.casparcgConfig?.channel || 1,
      layer: item.data?.layer || item.data?.casparcgConfig?.layer || 10,
      startTime: item.data?.startTime || '00:00:00',
      duration: item.data?.duration || '00:00:10',
      location: item.data?.location || `CH${item.data?.channel || 1}-L${item.data?.layer || 10}`,
      notes: item.data?.notes || item.data?.note || '',
      // Mantieni tutti i dettagli originali della storia
      mediaDetails: item.data?.mediaDetails || null,
      templateDetails: item.data?.templateDetails || null,
      templatesDetails: item.data?.templatesDetails || null,
      // Configurazione CasparCG
      casparcgConfig: item.data?.casparcgConfig || {
        channel: item.data?.channel || 1,
        layer: item.data?.layer || 10
      },
      // Timing
      timing: item.data?.timing || {
        startTime: item.data?.startTime || '00:00:00',
        duration: item.data?.duration || '00:00:10',
        inPoint: '00:00:00:00',
        outPoint: '00:00:00:00'
      },
      // Metadati
      notificationSent: item.data?.notificationSent || false,
      errorCount: item.data?.errorCount || 0,
      lastError: item.data?.lastError || null,
      lastPlayTime: item.data?.lastPlayTime || null
    };
  }

  return {
    rundown_id: rundownId,
    item_order: order,
    type: type,
    name: item.name || item.data?.customName || `Elemento ${order + 1}`,
    data: jsonbData,
    updated_by: userId
  };
};

/**
 * Carica il rundown da localStorage
 * 
 * @returns {Object|null} - Dati del rundown o null se non trovato
 */
export const loadRundownFromLocalStorage = () => {
  try {
    const savedRundown = localStorage.getItem('rundown');
    if (savedRundown) {
      return JSON.parse(savedRundown);
    }
    return null;
  } catch (error) {
    console.error('[RUNDOWN MIGRATION] Errore nel caricamento da localStorage:', error);
    return null;
  }
};

/**
 * Rimuove il rundown da localStorage dopo la migrazione
 */
export const clearRundownFromLocalStorage = () => {
  try {
    localStorage.removeItem('rundown');
    console.log('[RUNDOWN MIGRATION] Rundown rimosso da localStorage');
  } catch (error) {
    console.error('[RUNDOWN MIGRATION] Errore nella rimozione da localStorage:', error);
  }
};

/**
 * Funzione principale per la migrazione automatica
 * 
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object>} - Risultato della migrazione
 */
export const autoMigrateRundownFromLocalStorage = async (userId) => {
  try {
    // Carica il rundown da localStorage
    const localRundown = loadRundownFromLocalStorage();
    
    if (!localRundown) {
      return {
        success: true,
        message: 'Nessun rundown da migrare trovato in localStorage'
      };
    }

    console.log('[RUNDOWN MIGRATION] Trovato rundown in localStorage, inizio migrazione...');

    // Migra a Supabase
    const migrationResult = await migrateRundownToSupabase(localRundown, userId);

    if (migrationResult.success) {
      // Rimuovi da localStorage solo se la migrazione è riuscita
      clearRundownFromLocalStorage();
      
      return {
        success: true,
        rundownId: migrationResult.rundownId,
        message: `Migrazione completata: ${migrationResult.message}`
      };
    } else {
      return migrationResult;
    }

  } catch (error) {
    console.error('[RUNDOWN MIGRATION] Errore nella migrazione automatica:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verifica se esiste un rundown in localStorage che necessita migrazione
 * 
 * @returns {boolean} - True se c'è un rundown da migrare
 */
export const hasRundownToMigrate = () => {
  const localRundown = loadRundownFromLocalStorage();
  return localRundown !== null && localRundown.items && localRundown.items.length > 0;
};
