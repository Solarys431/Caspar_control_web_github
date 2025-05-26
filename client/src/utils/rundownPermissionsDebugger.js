/**
 * Utility per debugging permessi rundown e problemi RLS
 */
import supabase from '../supabaseClient';

/**
 * Verifica dettagliata dei permessi utente su un rundown specifico
 * 
 * @param {string} rundownId - ID del rundown da verificare
 * @param {string} userId - ID dell'utente (opzionale, usa quello corrente se non specificato)
 * @returns {Promise<Object>} - Risultato dettagliato della verifica
 */
export const debugRundownPermissions = async (rundownId, userId = null) => {
  try {
    console.group('🔍 [RUNDOWN PERMISSIONS DEBUG] Verifica permessi dettagliata');
    
    // 1. Verifica utente corrente
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Errore recupero utente:', userError);
      return { success: false, error: 'Errore recupero utente', details: userError };
    }
    
    if (!user) {
      console.error('❌ Nessun utente autenticato');
      return { success: false, error: 'Nessun utente autenticato' };
    }
    
    const currentUserId = userId || user.id;
    console.log('👤 Utente corrente:', currentUserId);
    
    // 2. Verifica esistenza rundown
    const { data: rundownData, error: rundownError } = await supabase
      .from('rundowns')
      .select('id, name, owner_id, created_at')
      .eq('id', rundownId)
      .single();
    
    if (rundownError) {
      console.error('❌ Errore recupero rundown:', rundownError);
      return { success: false, error: 'Rundown non trovato', details: rundownError };
    }
    
    console.log('📁 Rundown trovato:', rundownData);
    
    // 3. Verifica se l'utente è proprietario
    const isOwner = rundownData.owner_id === currentUserId;
    console.log('👑 È proprietario:', isOwner);
    
    // 4. Verifica collaborazioni
    const { data: collaboratorData, error: collaboratorError } = await supabase
      .from('rundown_collaborators')
      .select('role, created_at')
      .eq('rundown_id', rundownId)
      .eq('user_id', currentUserId)
      .single();
    
    if (collaboratorError && collaboratorError.code !== 'PGRST116') {
      console.error('❌ Errore verifica collaboratore:', collaboratorError);
    }
    
    const collaboratorRole = collaboratorData?.role || null;
    console.log('🤝 Ruolo collaboratore:', collaboratorRole);
    
    // 5. Determina ruolo effettivo
    let effectiveRole = 'no_access';
    if (isOwner) {
      effectiveRole = 'owner';
    } else if (collaboratorRole) {
      effectiveRole = collaboratorRole;
    }
    
    console.log('🎯 Ruolo effettivo:', effectiveRole);
    
    // 6. Verifica permessi di modifica
    const canEdit = ['owner', 'editor', 'playout_operator'].includes(effectiveRole);
    console.log('✏️ Può modificare:', canEdit);
    
    // 7. Test inserimento simulato (senza effettivamente inserire)
    const testInsertData = {
      rundown_id: rundownId,
      item_order: 999,
      type: 'STORY',
      name: 'TEST_STORY_PERMISSIONS',
      data: { test: true },
      updated_by: currentUserId
    };
    
    console.log('🧪 Test inserimento simulato...');
    
    // Test con dry-run (usando una transazione che viene rollback)
    const { error: insertTestError } = await supabase.rpc('test_insert_permissions', {
      table_name: 'rundown_items',
      test_data: testInsertData
    });
    
    const insertTestResult = !insertTestError;
    console.log('📝 Test inserimento:', insertTestResult ? 'SUCCESSO' : 'FALLITO');
    
    if (insertTestError) {
      console.error('❌ Errore test inserimento:', insertTestError);
    }
    
    // 8. Risultato finale
    const result = {
      success: true,
      userId: currentUserId,
      rundown: rundownData,
      permissions: {
        isOwner,
        collaboratorRole,
        effectiveRole,
        canEdit,
        canInsert: insertTestResult
      },
      recommendations: []
    };
    
    // 9. Raccomandazioni
    if (!canEdit) {
      result.recommendations.push('Utente non ha permessi di modifica. Necessario ruolo owner, editor o playout_operator.');
    }
    
    if (!insertTestResult && canEdit) {
      result.recommendations.push('Permessi teorici OK ma test inserimento fallito. Possibile problema RLS o dati.');
    }
    
    if (effectiveRole === 'no_access') {
      result.recommendations.push('Utente non ha accesso al rundown. Aggiungere come collaboratore o trasferire proprietà.');
    }
    
    console.log('📊 Risultato finale:', result);
    console.groupEnd();
    
    return result;
    
  } catch (error) {
    console.error('❌ [RUNDOWN PERMISSIONS DEBUG] Errore generale:', error);
    console.groupEnd();
    return { success: false, error: error.message, details: error };
  }
};

/**
 * Verifica rapida se l'utente può inserire elementi in un rundown
 * 
 * @param {string} rundownId - ID del rundown
 * @returns {Promise<boolean>} - True se può inserire, false altrimenti
 */
export const canUserInsertInRundown = async (rundownId) => {
  try {
    const result = await debugRundownPermissions(rundownId);
    return result.success && result.permissions?.canEdit;
  } catch (error) {
    console.error('Errore verifica permessi inserimento:', error);
    return false;
  }
};

/**
 * Ottiene informazioni dettagliate sui permessi per debugging
 * 
 * @param {string} rundownId - ID del rundown
 * @returns {Promise<string>} - Messaggio di debug formattato
 */
export const getPermissionsDebugMessage = async (rundownId) => {
  try {
    const result = await debugRundownPermissions(rundownId);
    
    if (!result.success) {
      return `❌ ERRORE: ${result.error}`;
    }
    
    const { permissions, recommendations } = result;
    
    let message = `🔍 PERMESSI RUNDOWN ${rundownId}:\n`;
    message += `👤 Utente: ${result.userId}\n`;
    message += `👑 Proprietario: ${permissions.isOwner ? 'SÌ' : 'NO'}\n`;
    message += `🤝 Collaboratore: ${permissions.collaboratorRole || 'NO'}\n`;
    message += `🎯 Ruolo effettivo: ${permissions.effectiveRole}\n`;
    message += `✏️ Può modificare: ${permissions.canEdit ? 'SÌ' : 'NO'}\n`;
    message += `📝 Può inserire: ${permissions.canInsert ? 'SÌ' : 'NO'}\n`;
    
    if (recommendations.length > 0) {
      message += `\n💡 RACCOMANDAZIONI:\n`;
      recommendations.forEach((rec, index) => {
        message += `${index + 1}. ${rec}\n`;
      });
    }
    
    return message;
    
  } catch (error) {
    return `❌ ERRORE DEBUG: ${error.message}`;
  }
};

/**
 * Aggiunge un utente come collaboratore di un rundown (solo per proprietari)
 * 
 * @param {string} rundownId - ID del rundown
 * @param {string} userId - ID dell'utente da aggiungere
 * @param {string} role - Ruolo da assegnare ('editor', 'viewer', 'playout_operator')
 * @returns {Promise<Object>} - Risultato dell'operazione
 */
export const addRundownCollaborator = async (rundownId, userId, role) => {
  try {
    const { data, error } = await supabase
      .from('rundown_collaborators')
      .insert([
        {
          rundown_id: rundownId,
          user_id: userId,
          role: role
        }
      ])
      .select();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data: data[0] };
    
  } catch (error) {
    console.error('Errore aggiunta collaboratore:', error);
    return { success: false, error: error.message };
  }
};
