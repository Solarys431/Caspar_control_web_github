/**
 * Hook per gestire la presenza degli utenti nel rundown
 * Segue gli stessi pattern di useScalettaPresence per consistenza
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook per gestire la presenza degli utenti durante l'editing del rundown
 *
 * @param {string} rundownId - ID del rundown
 * @param {string} currentUserId - ID dell'utente corrente
 * @param {Object} currentUser - Oggetto utente corrente
 * @param {Object} supabase - Client Supabase
 * @returns {Object} - Funzioni e stati per gestire la presenza
 */
const useRundownPresence = (rundownId, currentUserId, currentUser, supabase) => {
  // Stato per tracciare chi sta modificando quale elemento
  const [editingStatusByItemId, setEditingStatusByItemId] = useState({});

  /**
   * Inizia l'editing di un elemento
   *
   * @param {string} itemId - ID dell'elemento da modificare
   */
  const startEditingItem = useCallback(async (itemId) => {
    if (!rundownId || !currentUserId || !itemId) return;

    try {
      console.log(`[RUNDOWN PRESENCE] Inizio editing elemento ${itemId} da parte di ${currentUser?.email || currentUserId}`);

      // Aggiorna lo stato locale immediatamente per feedback immediato
      setEditingStatusByItemId(prev => ({
        ...prev,
        [itemId]: {
          userId: currentUserId,
          userName: currentUser?.email || currentUser?.user_metadata?.full_name || 'Utente Sconosciuto',
          startTime: new Date().toISOString()
        }
      }));

      // Invia il segnale di presenza tramite Supabase Realtime
      const channel = supabase.channel(`rundown-presence-${rundownId}`);
      
      await channel.track({
        editing_item_id: itemId,
        user_id: currentUserId,
        user_name: currentUser?.email || currentUser?.user_metadata?.full_name || 'Utente Sconosciuto',
        action: 'start_editing',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[RUNDOWN PRESENCE] Errore nell\'avvio editing:', error);
    }
  }, [rundownId, currentUserId, currentUser, supabase]);

  /**
   * Termina l'editing di un elemento
   *
   * @param {string} itemId - ID dell'elemento di cui terminare l'editing
   */
  const stopEditingItem = useCallback(async (itemId) => {
    if (!rundownId || !currentUserId || !itemId) return;

    try {
      console.log(`[RUNDOWN PRESENCE] Fine editing elemento ${itemId} da parte di ${currentUser?.email || currentUserId}`);

      // Aggiorna lo stato locale immediatamente
      setEditingStatusByItemId(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });

      // Invia il segnale di fine editing tramite Supabase Realtime
      const channel = supabase.channel(`rundown-presence-${rundownId}`);
      
      await channel.track({
        editing_item_id: null,
        user_id: currentUserId,
        user_name: currentUser?.email || currentUser?.user_metadata?.full_name || 'Utente Sconosciuto',
        action: 'stop_editing',
        previous_item_id: itemId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[RUNDOWN PRESENCE] Errore nella fine editing:', error);
    }
  }, [rundownId, currentUserId, currentUser, supabase]);

  // Effetto per gestire la sottoscrizione alla presenza
  useEffect(() => {
    if (!rundownId || !currentUserId) return;

    console.log(`[RUNDOWN PRESENCE] Inizializzazione presenza per rundown ${rundownId}`);

    // Crea il canale per la presenza
    const presenceChannel = supabase
      .channel(`rundown-presence-${rundownId}`)
      .on('presence', { event: 'sync' }, () => {
        console.log('[RUNDOWN PRESENCE] Sincronizzazione presenza');
        
        const presenceState = presenceChannel.presenceState();
        const newEditingStatus = {};

        // Processa lo stato di presenza per costruire editingStatusByItemId
        Object.values(presenceState).forEach(presences => {
          presences.forEach(presence => {
            if (presence.editing_item_id && presence.user_id !== currentUserId) {
              newEditingStatus[presence.editing_item_id] = {
                userId: presence.user_id,
                userName: presence.user_name || 'Utente Sconosciuto',
                startTime: presence.timestamp || new Date().toISOString()
              };
            }
          });
        });

        setEditingStatusByItemId(newEditingStatus);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[RUNDOWN PRESENCE] Utente entrato:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[RUNDOWN PRESENCE] Utente uscito:', key, leftPresences);
        
        // Rimuovi gli elementi che stavano modificando gli utenti che sono usciti
        leftPresences.forEach(presence => {
          if (presence.editing_item_id) {
            setEditingStatusByItemId(prev => {
              const newState = { ...prev };
              delete newState[presence.editing_item_id];
              return newState;
            });
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RUNDOWN PRESENCE] Sottoscrizione presenza attiva');
          
          // Traccia la presenza iniziale dell'utente corrente
          await presenceChannel.track({
            editing_item_id: null,
            user_id: currentUserId,
            user_name: currentUser?.email || currentUser?.user_metadata?.full_name || 'Utente Sconosciuto',
            action: 'join',
            timestamp: new Date().toISOString()
          });
        }
      });

    // Cleanup della sottoscrizione
    return () => {
      console.log(`[RUNDOWN PRESENCE] Cleanup presenza per rundown ${rundownId}`);
      
      // Invia segnale di uscita prima di disconnettersi
      presenceChannel.track({
        editing_item_id: null,
        user_id: currentUserId,
        user_name: currentUser?.email || currentUser?.user_metadata?.full_name || 'Utente Sconosciuto',
        action: 'leave',
        timestamp: new Date().toISOString()
      }).then(() => {
        supabase.removeChannel(presenceChannel);
      }).catch(error => {
        console.error('[RUNDOWN PRESENCE] Errore durante cleanup:', error);
        supabase.removeChannel(presenceChannel);
      });
    };
  }, [rundownId, currentUserId, currentUser, supabase]);

  return {
    editingStatusByItemId,
    startEditingItem,
    stopEditingItem
  };
};

export default useRundownPresence;
