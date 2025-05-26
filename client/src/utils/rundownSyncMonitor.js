/**
 * Utility per monitoraggio e debugging della sincronizzazione rundown
 */

/**
 * Monitora lo stato del rundown durante il processo di invio
 *
 * @param {Object} rundownContext - Contesto del rundown
 * @param {string} operationName - Nome dell'operazione in corso
 * @returns {Object} - Stato dettagliato del rundown
 */
export const monitorRundownState = (rundownContext, operationName = 'Unknown') => {
  const state = {
    timestamp: new Date().toISOString(),
    operation: operationName,
    activeRundownId: rundownContext?.activeRundownId || null,
    useSupabaseSync: rundownContext?.useSupabaseSync || false,
    itemsCount: rundownContext?.items?.length || 0,
    contextAvailable: !!rundownContext,
    hasAddFunctions: {
      addMedia: typeof rundownContext?.addMedia === 'function',
      addTemplate: typeof rundownContext?.addTemplate === 'function',
      addStory: typeof rundownContext?.addStory === 'function'
    }
  };

  console.log(`🔍 [RUNDOWN MONITOR] ${operationName}:`, state);
  return state;
};

/**
 * Verifica che il rundown sia in uno stato valido per operazioni
 *
 * @param {Object} rundownContext - Contesto del rundown
 * @param {string} operationName - Nome dell'operazione da verificare
 * @returns {Object} - Risultato della verifica
 */
export const validateRundownState = (rundownContext, operationName = 'Operation') => {
  const issues = [];
  const warnings = [];

  // Verifica disponibilità contesto
  if (!rundownContext) {
    issues.push('RundownContext non disponibile');
  } else {
    // Verifica rundown attivo
    if (!rundownContext.activeRundownId) {
      issues.push('Nessun rundown attivo');
    }

    // Verifica sincronizzazione Supabase
    if (!rundownContext.useSupabaseSync) {
      warnings.push('Sincronizzazione Supabase disabilitata');
    }

    // Verifica funzioni di aggiunta
    const requiredFunctions = ['addMedia', 'addTemplate', 'addStory'];
    requiredFunctions.forEach(funcName => {
      if (typeof rundownContext[funcName] !== 'function') {
        issues.push(`Funzione ${funcName} non disponibile`);
      }
    });

    // Verifica stato items
    if (!Array.isArray(rundownContext.items)) {
      warnings.push('Array items non disponibile o non valido');
    }
  }

  const result = {
    valid: issues.length === 0,
    issues,
    warnings,
    operation: operationName,
    timestamp: new Date().toISOString()
  };

  if (issues.length > 0) {
    console.error(`❌ [RUNDOWN VALIDATOR] ${operationName} - Problemi rilevati:`, issues);
  }

  if (warnings.length > 0) {
    console.warn(`⚠️ [RUNDOWN VALIDATOR] ${operationName} - Avvisi:`, warnings);
  }

  if (result.valid) {
    console.log(`✅ [RUNDOWN VALIDATOR] ${operationName} - Stato valido`);
  }

  return result;
};

/**
 * Attende che il rundown raggiunga uno stato valido
 *
 * @param {Object} rundownContext - Contesto del rundown
 * @param {number} maxWaitMs - Tempo massimo di attesa in millisecondi
 * @param {number} checkIntervalMs - Intervallo tra i controlli in millisecondi
 * @returns {Promise<boolean>} - True se il rundown è valido, false se timeout
 */
export const waitForValidRundownState = async (
  rundownContext,
  maxWaitMs = 5000,
  checkIntervalMs = 200
) => {
  const startTime = Date.now();
  let attempts = 0;

  console.log(`🔄 [RUNDOWN WAITER] Attesa stato rundown valido (max ${maxWaitMs}ms)...`);

  while (Date.now() - startTime < maxWaitMs) {
    attempts++;
    const validation = validateRundownState(rundownContext, `Wait Attempt ${attempts}`);

    if (validation.valid) {
      console.log(`✅ [RUNDOWN WAITER] Stato valido raggiunto dopo ${attempts} tentativi (${Date.now() - startTime}ms)`);
      return true;
    }

    console.log(`🔄 [RUNDOWN WAITER] Tentativo ${attempts} - Stato non ancora valido, attesa ${checkIntervalMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  console.error(`❌ [RUNDOWN WAITER] Timeout raggiunto dopo ${attempts} tentativi (${maxWaitMs}ms)`);
  return false;
};

/**
 * Verifica la sincronizzazione degli elementi dopo l'invio
 *
 * @param {Object} rundownContext - Contesto del rundown
 * @param {number} expectedCount - Numero di elementi attesi
 * @param {number} maxWaitMs - Tempo massimo di attesa
 * @returns {Promise<Object>} - Risultato della verifica
 */
export const verifySyncAfterSend = async (
  rundownContext,
  expectedCount,
  maxWaitMs = 10000
) => {
  const startTime = Date.now();
  let attempts = 0;
  const checkInterval = 1000; // 1 secondo tra i controlli

  console.log(`🔄 [SYNC VERIFIER] Verifica sincronizzazione ${expectedCount} elementi (max ${maxWaitMs}ms)...`);

  // Import dinamico di Supabase per verifica database diretta
  let supabase = null;
  try {
    const supabaseModule = await import('../supabaseClient');
    supabase = supabaseModule.default;
  } catch (error) {
    console.warn('⚠️ [SYNC VERIFIER] Impossibile importare Supabase per verifica database diretta');
  }

  // CORREZIONE CRITICA: Dichiarare databaseCount fuori dal loop per evitare ReferenceError
  let databaseCount = 0;

  while (Date.now() - startTime < maxWaitMs) {
    attempts++;
    const currentItems = rundownContext?.items || [];
    const currentCount = currentItems.length;

    console.log(`📊 [SYNC VERIFIER] Tentativo ${attempts} - Elementi stato locale: ${currentCount}/${expectedCount}`);

    // CORREZIONE: Verifica anche database diretto se disponibile
    databaseCount = 0; // Reset per ogni tentativo
    if (supabase && rundownContext?.activeRundownId) {
      try {
        const { data: dbItems, error } = await supabase
          .from('rundown_items')
          .select('id, type, name')
          .eq('rundown_id', rundownContext.activeRundownId);

        if (!error && dbItems) {
          databaseCount = dbItems.length;
          console.log(`📊 [SYNC VERIFIER] Tentativo ${attempts} - Elementi database: ${databaseCount}/${expectedCount}`);

          // Se il database ha gli elementi ma lo stato locale no, forza refresh
          if (databaseCount >= expectedCount && currentCount < expectedCount) {
            console.log(`🔄 [SYNC VERIFIER] Database aggiornato ma stato locale no - possibile problema real-time`);
          }
        }
      } catch (dbError) {
        console.warn(`⚠️ [SYNC VERIFIER] Errore verifica database:`, dbError);
      }
    }

    // Considera successo se almeno uno dei due (stato locale o database) ha gli elementi
    const effectiveCount = Math.max(currentCount, databaseCount);

    if (effectiveCount >= expectedCount) {
      const result = {
        success: true,
        actualCount: currentCount,
        databaseCount,
        effectiveCount,
        expectedCount,
        attempts,
        duration: Date.now() - startTime,
        items: currentItems,
        syncIssue: databaseCount > currentCount // Indica problema sincronizzazione real-time
      };

      console.log(`✅ [SYNC VERIFIER] Sincronizzazione verificata:`, result);

      if (result.syncIssue) {
        console.warn(`⚠️ [SYNC VERIFIER] Problema sincronizzazione real-time rilevato: DB=${databaseCount}, Locale=${currentCount}`);
      }

      return result;
    }

    if (effectiveCount > 0 && effectiveCount < expectedCount) {
      console.log(`🔄 [SYNC VERIFIER] Sincronizzazione parziale: Locale=${currentCount}, DB=${databaseCount}, Attesi=${expectedCount}`);
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  const result = {
    success: false,
    actualCount: rundownContext?.items?.length || 0,
    databaseCount,
    effectiveCount: Math.max(rundownContext?.items?.length || 0, databaseCount),
    expectedCount,
    attempts,
    duration: maxWaitMs,
    timeout: true,
    items: rundownContext?.items || []
  };

  console.error(`❌ [SYNC VERIFIER] Timeout sincronizzazione:`, result);
  return result;
};

/**
 * Diagnostica completa dello stato del rundown
 *
 * @param {Object} rundownContext - Contesto del rundown
 * @param {Object} additionalInfo - Informazioni aggiuntive per il debug
 * @returns {Object} - Report diagnostico completo
 */
export const diagnoseRundownState = (rundownContext, additionalInfo = {}) => {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    context: {
      available: !!rundownContext,
      activeRundownId: rundownContext?.activeRundownId || null,
      useSupabaseSync: rundownContext?.useSupabaseSync || false,
      itemsCount: rundownContext?.items?.length || 0,
      itemsArray: Array.isArray(rundownContext?.items)
    },
    functions: {
      addMedia: typeof rundownContext?.addMedia === 'function',
      addTemplate: typeof rundownContext?.addTemplate === 'function',
      addStory: typeof rundownContext?.addStory === 'function',
      setActiveRundownId: typeof rundownContext?.setActiveRundownId === 'function'
    },
    additionalInfo,
    recommendations: []
  };

  // Genera raccomandazioni
  if (!diagnosis.context.available) {
    diagnosis.recommendations.push('Verificare che RundownContext sia correttamente fornito');
  }

  if (!diagnosis.context.activeRundownId) {
    diagnosis.recommendations.push('Impostare un rundown attivo prima di procedere');
  }

  if (!diagnosis.context.useSupabaseSync) {
    diagnosis.recommendations.push('Abilitare sincronizzazione Supabase se necessaria');
  }

  const missingFunctions = Object.entries(diagnosis.functions)
    .filter(([, available]) => !available)
    .map(([name]) => name);

  if (missingFunctions.length > 0) {
    diagnosis.recommendations.push(`Verificare disponibilità funzioni: ${missingFunctions.join(', ')}`);
  }

  console.group('🔍 [RUNDOWN DIAGNOSIS] Diagnostica completa');
  console.log('📊 Contesto:', diagnosis.context);
  console.log('🔧 Funzioni:', diagnosis.functions);
  console.log('📝 Info aggiuntive:', diagnosis.additionalInfo);
  console.log('💡 Raccomandazioni:', diagnosis.recommendations);
  console.groupEnd();

  return diagnosis;
};

/**
 * Forza il refresh dello stato del rundown dal database
 *
 * @param {Object} rundownContext - Contesto del rundown
 * @returns {Promise<Object>} - Risultato del refresh
 */
export const forceRefreshRundownState = async (rundownContext) => {
  console.log('🔄 [FORCE REFRESH] Inizio refresh forzato stato rundown...');

  if (!rundownContext?.activeRundownId) {
    const error = 'Nessun rundown attivo per il refresh';
    console.error(`❌ [FORCE REFRESH] ${error}`);
    return { success: false, error };
  }

  try {
    // Import dinamico di Supabase
    const supabaseModule = await import('../supabaseClient');
    const supabase = supabaseModule.default;

    // Query diretta al database per ottenere gli elementi aggiornati
    const { data: dbItems, error } = await supabase
      .from('rundown_items')
      .select('*')
      .eq('rundown_id', rundownContext.activeRundownId)
      .order('item_order');

    if (error) {
      throw error;
    }

    console.log(`📊 [FORCE REFRESH] Trovati ${dbItems.length} elementi nel database`);

    // Se il rundown context ha una funzione di refresh, usala
    if (typeof rundownContext.loadRundownData === 'function') {
      console.log('🔄 [FORCE REFRESH] Utilizzo loadRundownData del context...');
      await rundownContext.loadRundownData(rundownContext.activeRundownId);
    }

    const result = {
      success: true,
      databaseItems: dbItems,
      itemCount: dbItems.length,
      refreshMethod: 'loadRundownData'
    };

    console.log('✅ [FORCE REFRESH] Refresh completato:', result);
    return result;

  } catch (error) {
    console.error('❌ [FORCE REFRESH] Errore durante refresh:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verifica e corregge la sincronizzazione tra database e stato locale
 *
 * @param {Object} rundownContext - Contesto del rundown
 * @returns {Promise<Object>} - Risultato della verifica e correzione
 */
export const verifyAndFixSync = async (rundownContext) => {
  console.log('🔍 [SYNC FIX] Verifica e correzione sincronizzazione...');

  if (!rundownContext?.activeRundownId) {
    return { success: false, error: 'Nessun rundown attivo' };
  }

  try {
    // Import dinamico di Supabase
    const supabaseModule = await import('../supabaseClient');
    const supabase = supabaseModule.default;

    // Ottieni elementi dal database
    const { data: dbItems, error } = await supabase
      .from('rundown_items')
      .select('*')
      .eq('rundown_id', rundownContext.activeRundownId)
      .order('item_order');

    if (error) {
      throw error;
    }

    const localItems = rundownContext.items || [];
    const dbCount = dbItems.length;
    const localCount = localItems.length;

    console.log(`📊 [SYNC FIX] Database: ${dbCount} elementi, Locale: ${localCount} elementi`);

    if (dbCount !== localCount) {
      console.warn(`⚠️ [SYNC FIX] Discrepanza rilevata - forzando refresh...`);
      const refreshResult = await forceRefreshRundownState(rundownContext);

      return {
        success: refreshResult.success,
        discrepancyFound: true,
        databaseCount: dbCount,
        localCount: localCount,
        refreshResult
      };
    }

    console.log('✅ [SYNC FIX] Sincronizzazione corretta');
    return {
      success: true,
      discrepancyFound: false,
      databaseCount: dbCount,
      localCount: localCount
    };

  } catch (error) {
    console.error('❌ [SYNC FIX] Errore verifica sincronizzazione:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crea un logger specifico per operazioni rundown
 *
 * @param {string} operationName - Nome dell'operazione
 * @returns {Object} - Logger con metodi specifici
 */
export const createRundownLogger = (operationName) => {
  const prefix = `[${operationName.toUpperCase()}]`;

  return {
    info: (message, data) => console.log(`ℹ️ ${prefix} ${message}`, data || ''),
    warn: (message, data) => console.warn(`⚠️ ${prefix} ${message}`, data || ''),
    error: (message, data) => console.error(`❌ ${prefix} ${message}`, data || ''),
    success: (message, data) => console.log(`✅ ${prefix} ${message}`, data || ''),
    debug: (message, data) => console.log(`🔍 ${prefix} ${message}`, data || ''),
    group: (title) => console.group(`📁 ${prefix} ${title}`),
    groupEnd: () => console.groupEnd()
  };
};
