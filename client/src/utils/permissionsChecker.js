/**
 * Utility per la verifica dei permessi
 */
import supabase from '../supabaseClient';

/**
 * Verifica se l'utente corrente è designato come operatore di playout per la data corrente
 * 
 * @param {string} userId - ID dell'utente
 * @returns {Promise<boolean>} - True se l'utente è un operatore di playout, false altrimenti
 */
export const isCurrentUserDesignatedPlayoutOperator = async (userId) => {
  if (!userId) return false;
  
  try {
    // Ottieni la data corrente in formato ISO (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Verifica se l'utente è assegnato come operatore di playout per oggi
    const { data, error } = await supabase
      .from('playout_assignments')
      .select('id')
      .eq('assignment_date', today)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Errore nella verifica dei permessi di playout:', error.message);
      return false;
    }
    
    // Se ci sono risultati, l'utente è un operatore di playout
    return data && data.length > 0;
  } catch (error) {
    console.error('Errore nella verifica dei permessi di playout:', error.message);
    return false;
  }
};

/**
 * Verifica il ruolo dell'utente per una specifica scaletta
 * 
 * @param {string} userId - ID dell'utente
 * @param {string} scalettaId - ID della scaletta
 * @returns {Promise<string|null>} - Ruolo dell'utente o null se non ha accesso
 */
export const getUserRoleForScaletta = async (userId, scalettaId) => {
  if (!userId || !scalettaId) return null;
  
  try {
    // Verifica se l'utente è il proprietario della scaletta
    const { data: scalettaData, error: scalettaError } = await supabase
      .from('scalette')
      .select('owner_id')
      .eq('id', scalettaId)
      .single();
    
    if (scalettaError) {
      console.error('Errore nella verifica del proprietario della scaletta:', scalettaError.message);
      return null;
    }
    
    // Se l'utente è il proprietario, restituisci 'owner'
    if (scalettaData && scalettaData.owner_id === userId) {
      return 'owner';
    }
    
    // Altrimenti, verifica se l'utente è un collaboratore
    const { data: collaboratorData, error: collaboratorError } = await supabase
      .from('scaletta_collaborators')
      .select('role')
      .eq('scaletta_id', scalettaId)
      .eq('user_id', userId)
      .single();
    
    if (collaboratorError && collaboratorError.code !== 'PGRST116') { // PGRST116 è "No rows returned"
      console.error('Errore nella verifica del ruolo del collaboratore:', collaboratorError.message);
      return null;
    }
    
    // Se l'utente è un collaboratore, restituisci il suo ruolo
    if (collaboratorData) {
      return collaboratorData.role;
    }
    
    // Se l'utente non è né proprietario né collaboratore, restituisci null
    return null;
  } catch (error) {
    console.error('Errore nella verifica del ruolo dell\'utente:', error.message);
    return null;
  }
};

/**
 * Verifica se l'utente può modificare una scaletta
 * 
 * @param {string} role - Ruolo dell'utente
 * @returns {boolean} - True se l'utente può modificare la scaletta, false altrimenti
 */
export const canUserEditScaletta = (role) => {
  return role === 'owner' || role === 'editor';
};

/**
 * Verifica se l'utente può inviare una scaletta al rundown
 * 
 * @param {string} role - Ruolo dell'utente
 * @param {boolean} isPlayoutOperator - Se l'utente è un operatore di playout
 * @returns {boolean} - True se l'utente può inviare la scaletta al rundown, false altrimenti
 */
export const canUserSendToRundown = (role, isPlayoutOperator) => {
  return role === 'owner' || role === 'playout_operator' || isPlayoutOperator;
};
