/**
 * Utility per testare la sincronizzazione Supabase
 */
import supabase from '../supabaseClient';

/**
 * Test di connessione a Supabase
 */
export const testSupabaseConnection = async () => {
  try {
    console.log('[TEST SUPABASE] Verifica connessione...');
    
    const { data, error } = await supabase
      .from('rundowns')
      .select('count')
      .limit(1);

    if (error) {
      console.error('[TEST SUPABASE] Errore connessione:', error);
      return { success: false, error: error.message };
    }

    console.log('[TEST SUPABASE] Connessione riuscita:', data);
    return { success: true, message: 'Connessione Supabase OK' };
  } catch (error) {
    console.error('[TEST SUPABASE] Errore test connessione:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test di creazione rundown
 */
export const testCreateRundown = async (userId) => {
  try {
    console.log('[TEST SUPABASE] Test creazione rundown...');
    
    const testRundownName = `Test Rundown ${Date.now()}`;
    
    const { data, error } = await supabase
      .from('rundowns')
      .insert([
        { name: testRundownName, owner_id: userId }
      ])
      .select();

    if (error) {
      console.error('[TEST SUPABASE] Errore creazione rundown:', error);
      return { success: false, error: error.message };
    }

    console.log('[TEST SUPABASE] Rundown creato:', data[0]);
    return { success: true, rundown: data[0], message: 'Rundown creato con successo' };
  } catch (error) {
    console.error('[TEST SUPABASE] Errore test creazione:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test di aggiunta elemento rundown
 */
export const testAddRundownItem = async (rundownId, userId) => {
  try {
    console.log('[TEST SUPABASE] Test aggiunta elemento...');
    
    const testItem = {
      rundown_id: rundownId,
      item_order: 0,
      type: 'MEDIA',
      name: 'Test Media',
      data: {
        clip: 'test_media.mp4',
        channel: 1,
        layer: 10,
        customName: 'Test Media',
        startTime: '00:00:00',
        duration: '00:01:00',
        location: 'test_media.mp4',
        note: 'Test element',
        notificationSent: false,
        errorCount: 0
      },
      updated_by: userId
    };

    const { data, error } = await supabase
      .from('rundown_items')
      .insert([testItem])
      .select();

    if (error) {
      console.error('[TEST SUPABASE] Errore aggiunta elemento:', error);
      return { success: false, error: error.message };
    }

    console.log('[TEST SUPABASE] Elemento aggiunto:', data[0]);
    return { success: true, item: data[0], message: 'Elemento aggiunto con successo' };
  } catch (error) {
    console.error('[TEST SUPABASE] Errore test aggiunta elemento:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test di lettura elementi rundown
 */
export const testReadRundownItems = async (rundownId) => {
  try {
    console.log('[TEST SUPABASE] Test lettura elementi...');
    
    const { data, error } = await supabase
      .from('rundown_items')
      .select('*')
      .eq('rundown_id', rundownId)
      .order('item_order', { ascending: true });

    if (error) {
      console.error('[TEST SUPABASE] Errore lettura elementi:', error);
      return { success: false, error: error.message };
    }

    console.log('[TEST SUPABASE] Elementi letti:', data);
    return { success: true, items: data, message: `${data.length} elementi letti` };
  } catch (error) {
    console.error('[TEST SUPABASE] Errore test lettura:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test di cleanup (rimozione dati di test)
 */
export const testCleanup = async (rundownId) => {
  try {
    console.log('[TEST SUPABASE] Cleanup dati di test...');
    
    // Rimuovi il rundown (gli elementi verranno rimossi automaticamente per CASCADE)
    const { error } = await supabase
      .from('rundowns')
      .delete()
      .eq('id', rundownId);

    if (error) {
      console.error('[TEST SUPABASE] Errore cleanup:', error);
      return { success: false, error: error.message };
    }

    console.log('[TEST SUPABASE] Cleanup completato');
    return { success: true, message: 'Cleanup completato' };
  } catch (error) {
    console.error('[TEST SUPABASE] Errore cleanup:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test completo della sincronizzazione
 */
export const runFullSyncTest = async (userId) => {
  console.log('[TEST SUPABASE] === INIZIO TEST COMPLETO ===');
  
  const results = [];
  
  // Test 1: Connessione
  const connectionTest = await testSupabaseConnection();
  results.push({ test: 'Connessione', ...connectionTest });
  
  if (!connectionTest.success) {
    console.log('[TEST SUPABASE] Test interrotto per errore connessione');
    return results;
  }

  // Test 2: Creazione rundown
  const createTest = await testCreateRundown(userId);
  results.push({ test: 'Creazione Rundown', ...createTest });
  
  if (!createTest.success) {
    console.log('[TEST SUPABASE] Test interrotto per errore creazione');
    return results;
  }

  const rundownId = createTest.rundown.id;

  // Test 3: Aggiunta elemento
  const addItemTest = await testAddRundownItem(rundownId, userId);
  results.push({ test: 'Aggiunta Elemento', ...addItemTest });

  // Test 4: Lettura elementi
  const readTest = await testReadRundownItems(rundownId);
  results.push({ test: 'Lettura Elementi', ...readTest });

  // Test 5: Cleanup
  const cleanupTest = await testCleanup(rundownId);
  results.push({ test: 'Cleanup', ...cleanupTest });

  console.log('[TEST SUPABASE] === RISULTATI TEST ===');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.message || result.error}`);
  });

  const allPassed = results.every(r => r.success);
  console.log(`[TEST SUPABASE] === TEST ${allPassed ? 'COMPLETATO CON SUCCESSO' : 'FALLITO'} ===`);

  return results;
};

/**
 * Test di real-time subscription
 */
export const testRealtimeSubscription = async (rundownId) => {
  console.log('[TEST SUPABASE] Test sottoscrizione real-time...');
  
  return new Promise((resolve) => {
    let eventReceived = false;
    
    const channel = supabase
      .channel(`test-rundown-${rundownId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rundown_items',
        filter: `rundown_id=eq.${rundownId}`
      }, (payload) => {
        console.log('[TEST SUPABASE] Evento real-time ricevuto:', payload);
        eventReceived = true;
        
        // Cleanup
        supabase.removeChannel(channel);
        
        resolve({
          success: true,
          message: 'Evento real-time ricevuto correttamente',
          payload
        });
      })
      .subscribe();

    // Timeout dopo 10 secondi
    setTimeout(() => {
      if (!eventReceived) {
        supabase.removeChannel(channel);
        resolve({
          success: false,
          error: 'Timeout - nessun evento real-time ricevuto'
        });
      }
    }, 10000);
  });
};
