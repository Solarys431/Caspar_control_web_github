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

/**
 * Verifica se l'utente corrente è un operatore di playout designato per i rundown
 * (stessa logica delle scalette)
 *
 * @param {string} userId - ID dell'utente da verificare
 * @returns {Promise<boolean>} - True se l'utente è un operatore di playout
 */
export const isCurrentUserDesignatedPlayoutOperatorForRundown = async (userId) => {
  // Riutilizza la stessa logica delle scalette
  return await isCurrentUserDesignatedPlayoutOperator(userId);
};

/**
 * Ottiene il ruolo dell'utente per un rundown specifico
 *
 * @param {string} userId - ID dell'utente
 * @param {string} rundownId - ID del rundown
 * @returns {Promise<string|null>} - Ruolo dell'utente ('owner', 'editor', 'viewer', 'playout_operator') o null
 */
export const getUserRoleForRundown = async (userId, rundownId) => {
  if (!userId || !rundownId) {
    console.warn('getUserRoleForRundown: userId o rundownId mancanti');
    return null;
  }

  try {
    // Prima verifica se l'utente è il proprietario del rundown
    const { data: rundownData, error: rundownError } = await supabase
      .from('rundowns')
      .select('owner_id')
      .eq('id', rundownId)
      .single();

    if (rundownError) {
      console.error('Errore nel recupero dei dati del rundown:', rundownError.message);
      return null;
    }

    // Se è il proprietario, restituisci 'owner'
    if (rundownData.owner_id === userId) {
      return 'owner';
    }

    // Altrimenti verifica se è un collaboratore
    const { data: collaboratorData, error: collaboratorError } = await supabase
      .from('rundown_collaborators')
      .select('role')
      .eq('rundown_id', rundownId)
      .eq('user_id', userId)
      .single();

    if (collaboratorError) {
      // Se non è trovato come collaboratore, non ha accesso
      if (collaboratorError.code === 'PGRST116') {
        return null;
      }
      console.error('Errore nel recupero del ruolo collaboratore per rundown:', collaboratorError.message);
      return null;
    }

    return collaboratorData.role;
  } catch (error) {
    console.error('Errore nella verifica del ruolo utente per rundown:', error.message);
    return null;
  }
};

/**
 * Verifica se l'utente può modificare un rundown basandosi sul suo ruolo
 *
 * @param {string} userRole - Ruolo dell'utente nel rundown
 * @returns {boolean} - True se l'utente può modificare il rundown
 */
export const canUserEditRundown = (userRole) => {
  if (!userRole) return false;

  // I ruoli che possono modificare un rundown
  const editableRoles = ['owner', 'editor', 'playout_operator'];
  return editableRoles.includes(userRole);
};

/**
 * Verifica se l'utente può visualizzare un rundown basandosi sul suo ruolo
 *
 * @param {string} userRole - Ruolo dell'utente nel rundown
 * @returns {boolean} - True se l'utente può visualizzare il rundown
 */
export const canUserViewRundown = (userRole) => {
  if (!userRole) return false;

  // Tutti i ruoli possono visualizzare il rundown
  const viewableRoles = ['owner', 'editor', 'viewer', 'playout_operator'];
  return viewableRoles.includes(userRole);
};
