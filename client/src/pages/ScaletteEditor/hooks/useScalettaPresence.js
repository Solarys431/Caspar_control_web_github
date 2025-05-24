/**
 * Hook per gestire la presenza degli utenti in una scaletta
 * Gestisce la sottoscrizione al canale di presenza Supabase e tiene traccia degli elementi in modifica
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook per gestire la presenza degli utenti in una scaletta
 *
 * @param {string} activeScalettaId - ID della scaletta attiva
 * @param {string} currentUserId - ID dell'utente corrente
 * @param {Object} user - Oggetto utente con metadati
 * @param {Object} supabase - Client Supabase
 * @returns {Object} - Funzioni e stati per gestire la presenza
 */
const useScalettaPresence = (activeScalettaId, currentUserId, user, supabase) => {
  // Stati per la presenza
  const [editingStatusByItemId, setEditingStatusByItemId] = useState({});
  const [presenceChannelReady, setPresenceChannelReady] = useState(false);

  // Riferimenti per il canale di presenza e l'elemento in modifica
  const presenceChannelRef = useRef(null);
  const currentEditingItemIdRef = useRef(null);

  // Sottoscrizione alla presenza in tempo reale
  useEffect(() => {
    if (!activeScalettaId || !currentUserId) return;

    console.log(`[PRESENCE] Inizializzazione canale Presence per scaletta: ${activeScalettaId}`);

    // Variabili per la gestione della riconnessione
    // Importante: NON usare useRef qui, ma una variabile locale
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelayMs = 3000;
    let reconnectTimerRef = null;

    // Funzione per creare e configurare il canale
    const setupPresenceChannel = () => {
      const channelName = `scaletta-presence-${activeScalettaId}`;
      console.log(`[PRESENCE] Creazione nuovo canale Presence: ${channelName}`);

      // Crea il canale con timeout più lungo (30 secondi invece del default di 10)
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: `scaletta-presence-${activeScalettaId}`,
          },
          broadcast: { self: true },
          // Aumentiamo il timeout per ridurre le disconnessioni
          timeout: 30000
        }
      });

      // Configura l'evento di sincronizzazione
      channel.on('presence', { event: 'sync' }, () => {
        try {
          // Ottieni lo stato di tutti gli utenti connessi
          const state = channel.presenceState();
          console.log('[PRESENCE] Stato presence ricevuto:', state);

          // Crea un nuovo oggetto per editingStatusByItemId
          const newEditingStatus = {};

          // Itera su tutti gli utenti connessi
          Object.keys(state).forEach(userKey => {
            const userStates = state[userKey];

            // Itera su tutti gli stati dell'utente
            userStates.forEach(userState => {
              // Se l'utente sta modificando un elemento e non è l'utente corrente, aggiungi l'informazione
              if (userState.editing_item_id && userState.user_id !== currentUserId) {
                newEditingStatus[userState.editing_item_id] = {
                  userId: userState.user_id,
                  userName: userState.user_name || 'Utente sconosciuto'
                };
              }
            });
          });

          // Aggiorna lo stato
          setEditingStatusByItemId(newEditingStatus);

          // Reset del contatore dei tentativi di riconnessione quando riceviamo un sync
          reconnectAttempts = 0;
        } catch (e) {
          console.error("[PRESENCE] Errore durante la sincronizzazione della presence:", e);
        }
      });

      // Aggiungiamo un handler per l'evento 'join' per debug
      channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log(`[PRESENCE] Utente connesso:`, newPresences);
      });

      // Aggiungiamo un handler per l'evento 'leave' per debug
      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log(`[PRESENCE] Utente disconnesso:`, leftPresences);
      });

      return channel;
    };

    // Funzione per tentare la riconnessione
    const attemptReconnect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.error(`[PRESENCE] Raggiunto il numero massimo di tentativi di riconnessione (${maxReconnectAttempts})`);
        return;
      }

      reconnectAttempts++;
      console.log(`[PRESENCE] Tentativo di riconnessione ${reconnectAttempts}/${maxReconnectAttempts}...`);

      // Rimuovi il canale esistente
      if (presenceChannelRef.current) {
        try {
          supabase.removeChannel(presenceChannelRef.current);
        } catch (e) {
          console.error("[PRESENCE] Errore durante la rimozione del canale:", e);
        }
      }

      // Crea un nuovo canale
      presenceChannelRef.current = setupPresenceChannel();

      // Sottoscrizione al nuovo canale
      subscribeToChannel();
    };

    // Funzione per sottoscriversi al canale
    const subscribeToChannel = () => {
      if (!presenceChannelRef.current) return;

      presenceChannelRef.current.subscribe(async (status) => {
        console.log(`[PRESENCE] Stato canale Presence: ${status}`);

        if (status === 'SUBSCRIBED') {
          console.log('[PRESENCE] Canale Presence sottoscritto con successo');
          setPresenceChannelReady(true);

          // Reset del contatore dei tentativi di riconnessione
          reconnectAttempts = 0;

          // Traccia la presenza dell'utente corrente senza elemento in modifica
          try {
            await presenceChannelRef.current.track({
              user_id: currentUserId,
              user_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utente',
              editing_item_id: null
            });
            console.log('[PRESENCE] Presenza utente tracciata con successo');

            // Se c'è un elemento in attesa di essere tracciato, traccialo ora
            if (currentEditingItemIdRef.current && presenceChannelRef.current) {
              console.log(`[PRESENCE] Tracciamento elemento in attesa ${currentEditingItemIdRef.current}`);
              try {
                await presenceChannelRef.current.track({
                  user_id: currentUserId,
                  user_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utente',
                  editing_item_id: currentEditingItemIdRef.current
                });
                console.log(`[PRESENCE] Elemento in attesa ${currentEditingItemIdRef.current} tracciato con successo`);
              } catch (trackError) {
                console.error(`[PRESENCE] Errore nel tracciare l'elemento in attesa: ${trackError.message}`);
                // Non impostiamo setPresenceChannelReady(false) qui per evitare un ciclo
              }
            }
          } catch (e) {
            console.error("[PRESENCE] Errore nel tracciare la presenza dell'utente:", e);
            setPresenceChannelReady(false);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[PRESENCE] Errore nel canale Presence: ${status}`);
          setPresenceChannelReady(false);

          // Importante: NON impostiamo presenceChannelRef.current = null qui
          // perché vogliamo mantenere il riferimento per i tentativi di riconnessione

          // Tenta la riconnessione dopo un ritardo
          if (reconnectTimerRef) clearTimeout(reconnectTimerRef);
          reconnectTimerRef = setTimeout(attemptReconnect, reconnectDelayMs);
        }
      });
    };

    // Crea il canale solo se non esiste già
    if (!presenceChannelRef.current) {
      presenceChannelRef.current = setupPresenceChannel();
      subscribeToChannel();
    }

    // Pulizia della sottoscrizione
    return () => {
      console.log(`[PRESENCE] Pulizia canale Presence per scaletta: ${activeScalettaId}`);

      // Cancella eventuali timer di riconnessione
      if (reconnectTimerRef) {
        clearTimeout(reconnectTimerRef);
        reconnectTimerRef = null;
      }

      if (presenceChannelRef.current) {
        try {
          // Utilizziamo una funzione di untrack più robusta
          const performUntrack = async () => {
            try {
              // Verifichiamo che il canale esista e abbia il metodo untrack
              if (presenceChannelRef.current && typeof presenceChannelRef.current.untrack === 'function') {
                // Tentiamo di fare untrack
                await presenceChannelRef.current.untrack();
                console.log('[PRESENCE] Untrack eseguito con successo');
              } else {
                console.log('[PRESENCE] Canale non valido o metodo untrack non disponibile');
              }
            } catch (e) {
              console.error("[PRESENCE] Errore durante l'untrack:", e);
              // Continuiamo comunque con la rimozione del canale
            }

            try {
              // Verifichiamo che il canale esista prima di rimuoverlo
              if (presenceChannelRef.current && supabase && typeof supabase.removeChannel === 'function') {
                // Rimuoviamo il canale
                supabase.removeChannel(presenceChannelRef.current);
                console.log('[PRESENCE] Canale rimosso con successo');
              } else {
                console.log('[PRESENCE] Canale non valido o metodo removeChannel non disponibile');
              }
            } catch (e) {
              console.error("[PRESENCE] Errore durante la rimozione del canale:", e);
            }

            // Reset delle variabili
            presenceChannelRef.current = null;
            setPresenceChannelReady(false);
            // NON resettiamo currentEditingItemIdRef.current qui, lo faremo in stopEditingItem
          };

          // Esegui la funzione di untrack
          performUntrack();
        } catch (e) {
          console.error("[PRESENCE] Errore durante la pulizia del canale:", e);
          // Anche in caso di errore, proviamo a rimuovere il canale
          try {
            // Verifichiamo che il canale esista prima di rimuoverlo
            if (presenceChannelRef.current && supabase && typeof supabase.removeChannel === 'function') {
              supabase.removeChannel(presenceChannelRef.current);
              console.log('[PRESENCE] Canale rimosso con successo nel blocco catch');
            } else {
              console.log('[PRESENCE] Canale non valido o metodo removeChannel non disponibile nel blocco catch');
            }
          } catch (e) {
            console.error("[PRESENCE] Errore durante la rimozione del canale:", e);
          }
          presenceChannelRef.current = null;
          setPresenceChannelReady(false);
          // NON resettiamo currentEditingItemIdRef.current qui, lo faremo in stopEditingItem
        }
      }
    };
  }, [activeScalettaId, currentUserId, user, supabase]);

  /**
   * Inizia la modifica di un elemento
   *
   * @param {string} itemId - ID dell'elemento da modificare
   * @returns {Promise<boolean>} - True se l'operazione è riuscita, false altrimenti
   */
  const startEditingItem = useCallback(async (itemId) => {
    try {
      console.log(`[EDITING] Tentativo di iniziare la modifica dell'elemento ${itemId}`);

      // Verifica che l'elemento non sia già in modifica da un altro utente
      if (editingStatusByItemId[itemId] && editingStatusByItemId[itemId].userId !== currentUserId) {
        const errorMsg = `L'elemento è già in modifica da ${editingStatusByItemId[itemId].userName}`;
        console.error(`[EDITING] ${errorMsg}`);
        return false;
      }

      // Memorizza l'ID dell'elemento che stiamo tentando di modificare
      // Questo viene fatto PRIMA di qualsiasi operazione di rete per garantire
      // che l'ID sia disponibile anche in caso di errori di rete
      currentEditingItemIdRef.current = itemId;
      console.log(`[EDITING] ID elemento in modifica impostato: ${itemId}`);

      // Verifica che il canale di presenza sia disponibile e pronto
      if (!presenceChannelRef.current || !presenceChannelReady) {
        console.warn("[EDITING] Canale di presenza non disponibile o non pronto durante startEditingItem");

        // Anche se il canale non è disponibile, consideriamo l'operazione riuscita
        // per evitare che l'interfaccia utente si blocchi
        // L'ID è già stato memorizzato in currentEditingItemIdRef.current
        return true;
      }

      // Traccia l'elemento in modifica
      try {
        // Verifica nuovamente che il canale sia disponibile
        if (!presenceChannelRef.current) {
          console.warn("[EDITING] Canale di presenza diventato null dopo il controllo iniziale");
          return true;
        }

        console.log(`[EDITING] Tracciamento elemento ${itemId} tramite presenceChannelRef`);

        // Utilizziamo un timeout per evitare che l'operazione si blocchi indefinitamente
        const trackPromise = new Promise(async (resolve, reject) => {
          try {
            // Verifica ancora una volta che il canale sia disponibile
            if (!presenceChannelRef.current) {
              console.warn("[EDITING] Canale di presenza diventato null prima del track");
              resolve(true); // Risolviamo comunque con successo
              return;
            }

            await presenceChannelRef.current.track({
              user_id: currentUserId,
              user_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utente',
              editing_item_id: itemId
            });
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });

        // Impostiamo un timeout di 5 secondi
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout durante il tracciamento dell\'elemento')), 5000)
        );

        // Attendiamo la prima promessa che si risolve/rifiuta
        await Promise.race([trackPromise, timeoutPromise]);

        console.log(`[EDITING] Elemento ${itemId} tracciato con successo`);
        return true;
      } catch (e) {
        console.error("[EDITING] Errore nel tracciare l'elemento:", e);
        // Anche in caso di errore, consideriamo l'operazione riuscita
        // L'ID è già stato memorizzato in currentEditingItemIdRef.current
        return true;
      }
    } catch (error) {
      console.error('[EDITING] Errore nell\'iniziare la modifica dell\'elemento:', error.message);
      // Anche in caso di errore, consideriamo l'operazione riuscita
      // L'ID è già stato memorizzato in currentEditingItemIdRef.current
      return true;
    }
  }, [currentUserId, editingStatusByItemId, user, presenceChannelReady]);

  /**
   * Termina la modifica di un elemento
   *
   * @returns {Promise<boolean>} - True se l'operazione è riuscita, false altrimenti
   */
  const stopEditingItem = useCallback(async () => {
    try {
      // Salva l'ID corrente per il logging
      const currentItemId = currentEditingItemIdRef.current;
      console.log(`[EDITING] Tentativo di terminare la modifica dell'elemento ${currentItemId || 'sconosciuto'}`);

      // Resetta il riferimento all'elemento in modifica
      // Questo viene fatto PRIMA di qualsiasi operazione di rete
      // per garantire che l'ID sia resettato anche in caso di errori di rete
      const previousItemId = currentEditingItemIdRef.current;
      currentEditingItemIdRef.current = null;
      console.log(`[EDITING] ID elemento in modifica resettato da ${previousItemId || 'null'} a null`);

      // Verifica che il canale di presenza sia disponibile e pronto
      if (!presenceChannelRef.current || !presenceChannelReady) {
        console.warn("[EDITING] Canale di presenza non disponibile o non pronto durante stopEditingItem");
        // Anche se il canale non è disponibile, consideriamo l'operazione riuscita
        // L'ID è già stato resettato
        return true;
      }

      // Esegui track con editing_item_id: null
      try {
        // Verifica nuovamente che il canale sia disponibile
        if (!presenceChannelRef.current) {
          console.warn("[EDITING] Canale di presenza diventato null dopo il controllo iniziale in stopEditingItem");
          return true;
        }

        console.log(`[EDITING] Esecuzione track con editing_item_id: null`);

        // Utilizziamo un timeout per evitare che l'operazione si blocchi indefinitamente
        const trackPromise = new Promise(async (resolve, reject) => {
          try {
            // Verifica ancora una volta che il canale sia disponibile
            if (!presenceChannelRef.current) {
              console.warn("[EDITING] Canale di presenza diventato null prima del track in stopEditingItem");
              resolve(true); // Risolviamo comunque con successo
              return;
            }

            await presenceChannelRef.current.track({
              user_id: currentUserId,
              user_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utente',
              editing_item_id: null
            });
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });

        // Impostiamo un timeout di 5 secondi
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout durante il reset del tracciamento')), 5000)
        );

        // Attendiamo la prima promessa che si risolve/rifiuta
        await Promise.race([trackPromise, timeoutPromise]);

        console.log(`[EDITING] Track con editing_item_id: null eseguito con successo`);
        return true;
      } catch (e) {
        console.error("[EDITING] Errore nel tracciare con editing_item_id: null:", e);
        // Anche in caso di errore, consideriamo l'operazione riuscita
        // L'ID è già stato resettato
        return true;
      }
    } catch (error) {
      console.error('[EDITING] Errore nel terminare la modifica dell\'elemento:', error.message);
      // Anche in caso di errore, consideriamo l'operazione riuscita
      // L'ID è già stato resettato
      return true;
    }
  }, [currentUserId, user, presenceChannelReady]);

  return {
    editingStatusByItemId,
    presenceChannelReady,
    startEditingItem,
    stopEditingItem
  };
};

export default useScalettaPresence;
