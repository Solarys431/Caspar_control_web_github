/**
 * Hook per gestire gli elementi della scaletta con Supabase
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import supabase from '../../../supabaseClient';
import { getUserRoleForScaletta, canUserEditScaletta } from '../../../utils/permissionsChecker';
import useScalettaPresence from './useScalettaPresence';

/**
 * Hook per gestire gli elementi della scaletta
 *
 * @returns {Object} - Funzioni e stati per gestire gli elementi della scaletta
 */
const useScalettaItems = () => {
  // Ottieni l'ID della scaletta dai parametri dell'URL
  const { id: activeScalettaId } = useParams();

  // Stati per la scaletta
  const [scalettaItems, setScalettaItems] = useState([]);
  const [scalettaName, setScalettaName] = useState('Caricamento...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modified, setModified] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [userRoleForScaletta, setUserRoleForScaletta] = useState(null);

  // Riferimento per tenere traccia dell'ultimo evento gestito e dello stato corrente
  const lastHandledEventRef = useRef(null);
  const scalettaItemsRef = useRef([]);

  // Aggiorna il riferimento quando cambia lo stato
  useEffect(() => {
    scalettaItemsRef.current = scalettaItems;
  }, [scalettaItems]);

  // Ottieni l'utente corrente
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Utilizziamo il nuovo hook useScalettaPresence per gestire la presenza
  const {
    editingStatusByItemId,
    startEditingItem,
    stopEditingItem
  } = useScalettaPresence(activeScalettaId, currentUserId, user, supabase);

  /**
   * Carica i dati della scaletta
   *
   * @param {string} scalettaId - ID della scaletta
   */
  const loadScalettaData = useCallback(async (scalettaId) => {
    try {
      setLoading(true);
      setError(null);

      // Ottieni i dati della scaletta
      const { data: scalettaData, error: scalettaError } = await supabase
        .from('scalette')
        .select('name, owner_id')
        .eq('id', scalettaId)
        .single();

      if (scalettaError) {
        throw scalettaError;
      }

      // Imposta il nome della scaletta
      setScalettaName(scalettaData.name);

      // Determina il ruolo dell'utente per questa scaletta
      const userRole = await getUserRoleForScaletta(currentUserId, scalettaId);
      setUserRoleForScaletta(userRole);

      // Ottieni gli elementi della scaletta
      const { data: itemsData, error: itemsError } = await supabase
        .from('scaletta_items')
        .select('*')
        .eq('scaletta_id', scalettaId)
        .order('item_order', { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      // Imposta gli elementi della scaletta
      setScalettaItems(itemsData);
    } catch (error) {
      console.error('Errore nel caricamento della scaletta:', error.message);
      setError('Errore nel caricamento della scaletta: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, setError, setLoading, setScalettaItems, setScalettaName, setUserRoleForScaletta]);

  /**
   * Gestisce l'inserimento remoto di un elemento
   *
   * @param {Object} newItem - Nuovo elemento inserito
   */
  const handleRemoteInsert = useCallback((newItem) => {
    setScalettaItems(prevItems => [...prevItems, newItem].sort((a, b) => a.item_order - b.item_order));
  }, []);

  /**
   * Gestisce l'aggiornamento remoto di un elemento
   *
   * @param {Object} oldItem - Elemento prima dell'aggiornamento
   * @param {Object} newItem - Elemento dopo l'aggiornamento
   * @param {string} eventOriginatorId - ID dell'utente che ha originato l'evento
   */
  const handleRemoteUpdate = useCallback((oldItem, newItem, eventOriginatorId) => { // Aggiunto eventOriginatorId
    console.log(`[REALTIME UPDATE RECEIVED] Aggiornamento remoto dell'elemento ${newItem.id}`, {
      oldItem,
      newItem,
      eventOriginatorId,
      currentUserId
    });

    // Verifica se è un aggiornamento di riordinamento (item_order cambiato)
    if (oldItem.item_order !== newItem.item_order) {
      console.log(`[REALTIME UPDATE] Rilevato cambiamento nell'ordine dell'elemento: ${oldItem.item_order} -> ${newItem.item_order}`);

      // Se l'ordine è cambiato E l'evento NON è stato originato dall'utente corrente, ricarica.
      // Se è stato originato dall'utente corrente, l'UI dovrebbe essere già stata aggiornata da handleDrop.
      if (eventOriginatorId !== currentUserId) {
        console.log(`[REALTIME UPDATE] Il cambiamento dell'ordine è stato originato da un altro utente (${eventOriginatorId}). Ricaricando tutti gli elementi...`);
        loadScalettaData(activeScalettaId);
        return;
      } else {
        console.log(`[REALTIME UPDATE] Il cambiamento dell'ordine è stato originato dall'utente corrente. L'aggiornamento locale dovrebbe aver già gestito questo.`);
        // Non ricaricare. L'UI è stata aggiornata da handleDrop.
        // L'elemento specifico verrà comunque aggiornato di seguito se altri campi (oltre a item_order) sono cambiati.
        // Se solo item_order è cambiato e l'evento è dall'utente corrente, potremmo anche fare un return qui
        // per evitare l'aggiornamento ridondante dell'item singolo, ma per sicurezza lo lasciamo procedere.
      }
    }

    // Log dettagliato per debug usando scalettaItemsRef.current invece di scalettaItems
    console.log('[REALTIME UPDATE] Stato items prima dell\'aggiornamento:',
      JSON.stringify(scalettaItemsRef.current.map(i => ({ id: i.id, name: i.name, order: i.item_order })), null, 2));

    // Crea una nuova istanza dell'array items con l'elemento aggiornato
    // Questo garantisce che React rilevi il cambiamento e aggiorni l'interfaccia
    setScalettaItems(prevItems => {
      // Verifica se l'elemento esiste nell'array
      const itemExists = prevItems.some(item => item.id === newItem.id);

      if (!itemExists) {
        console.log(`[REALTIME UPDATE] L'elemento ${newItem.id} non esiste nell'array locale, lo aggiungiamo`);
        return [...prevItems, newItem].sort((a, b) => a.item_order - b.item_order);
      }

      // Crea un nuovo array con l'elemento aggiornato
      const updatedItems = prevItems.map(item =>
        item.id === newItem.id ? { ...newItem } : item
      );

      console.log('[REALTIME UPDATE] Stato items dopo l\'aggiornamento:',
        JSON.stringify(updatedItems.map(i => ({ id: i.id, name: i.name, order: i.item_order })), null, 2));

      return updatedItems;
    });

    // Imposta lo stato come modificato
    setModified(true);
  }, [activeScalettaId, loadScalettaData, currentUserId]); // Aggiunto currentUserId alle dipendenze

  /**
   * Gestisce l'eliminazione remota di un elemento
   *
   * @param {Object} oldItem - Elemento eliminato
   */
  const handleRemoteDelete = useCallback((oldItem) => {
    console.log(`Eliminazione remota dell'elemento ${oldItem.id}`, oldItem);
    setScalettaItems(prevItems => prevItems.filter(item => item.id !== oldItem.id));
  }, []);

  // Carica i dati della scaletta all'avvio
  useEffect(() => {
    if (activeScalettaId && currentUserId) {
      loadScalettaData(activeScalettaId);
    }
  }, [activeScalettaId, currentUserId, loadScalettaData]);

  // Sottoscrizione ai cambiamenti in tempo reale
  useEffect(() => {
    if (!activeScalettaId || !currentUserId) return;

    // Crea il canale per la sottoscrizione
    const channel = supabase
      .channel(`scaletta-items-${activeScalettaId}`)
      // Sottoscrizione ai cambiamenti degli elementi della scaletta
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scaletta_items',
        filter: `scaletta_id=eq.${activeScalettaId}`
      }, (payload) => {
        // Genera un ID univoco per l'evento
        const eventId = `${payload.eventType}-${payload.new?.id || payload.old?.id}-${Date.now()}`;

        console.log(`Evento ricevuto: ${eventId}`, payload);

        // Imposta l'ID dell'ultimo evento gestito
        lastHandledEventRef.current = eventId;

        // Log dettagliato per debug
        console.log(`[REALTIME EVENT] Ricevuto evento ${payload.eventType} per elemento ${payload.new?.id || payload.old?.id}:`, {
          eventId,
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
          lastHandledEvent: lastHandledEventRef.current,
          currentUserId
        });

        // Verifica se è un evento di riordinamento (più elementi aggiornati in sequenza)
        const isReorderEvent = lastHandledEventRef.current && lastHandledEventRef.current.startsWith('REORDER-');

        // Ignora gli eventi generati dall'utente corrente o già gestiti
        // Per gli eventi DELETE, verifichiamo se l'ultimo evento gestito inizia con DELETE-{id}
        // Per gli altri eventi, verifichiamo se updated_by corrisponde all'utente corrente
        // Eccezione: non ignoriamo gli eventi di riordinamento anche se generati dall'utente corrente
        if ((payload.eventType === 'DELETE' && lastHandledEventRef.current && lastHandledEventRef.current.startsWith(`DELETE-${payload.old?.id}`)) ||
            (payload.eventType !== 'DELETE' && !isReorderEvent && payload.new?.updated_by === currentUserId)) {
          console.log(`[REALTIME EVENT] Evento ignorato perché generato dall'utente corrente: ${eventId}`);
          return;
        }

        // Se è un evento di riordinamento e l'ultimo evento gestito è un REORDER, ricarichiamo tutti gli elementi
        if (payload.eventType === 'UPDATE' && isReorderEvent &&
            payload.old && payload.new && payload.old.item_order !== payload.new.item_order) {
          console.log(`[REALTIME EVENT] Rilevato evento di riordinamento in sequenza. Ricaricando tutti gli elementi...`);
          loadScalettaData(activeScalettaId);
          return;
        }

        // Gestisci i diversi tipi di eventi
        switch (payload.eventType) {
          case 'INSERT':
            console.log(`[REALTIME EVENT] Gestione evento INSERT: ${eventId}`);
            handleRemoteInsert(payload.new);
            break;
          case 'UPDATE':
            console.log(`[REALTIME EVENT] Gestione evento UPDATE: ${eventId}`);
            handleRemoteUpdate(payload.old, payload.new, payload.new?.updated_by); // Passa payload.new?.updated_by
            break;
          case 'DELETE':
            console.log(`[REALTIME EVENT] Gestione evento DELETE: ${eventId}`, {
              old: payload.old,
              oldId: payload.old?.id,
              oldScalettaId: payload.old?.scaletta_id
            });
            if (payload.old && payload.old.id) {
              handleRemoteDelete(payload.old);
            } else {
              console.error(`[REALTIME EVENT] Evento DELETE senza payload.old o payload.old.id: ${eventId}`);
            }
            break;
          default:
            break;
        }

        // Mostra una notifica all'utente (qui potremmo integrare un sistema di notifiche)
        const userName = 'Un altro utente';
        const actionText = payload.eventType === 'INSERT' ? 'aggiunto' : payload.eventType === 'UPDATE' ? 'aggiornato' : 'rimosso';
        const itemName = payload.new?.name || payload.old?.name || 'un elemento';

        console.log(`${userName} ha ${actionText} ${itemName}`);
      })
      // Sottoscrizione ai cambiamenti della scaletta stessa (per il nome)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'scalette',
        filter: `id=eq.${activeScalettaId}`
      }, (payload) => {
        // Aggiorna il nome della scaletta se è stato modificato
        if (payload.new?.name && payload.new.name !== scalettaName) {
          console.log(`Nome scaletta aggiornato da un altro utente: ${payload.new.name}`);
          setScalettaName(payload.new.name);
        }
      })
      .subscribe();

    // Pulizia della sottoscrizione
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeScalettaId, currentUserId, scalettaName, loadScalettaData, handleRemoteInsert, handleRemoteUpdate, handleRemoteDelete]);



  // La funzione loadScalettaData è già definita sopra



  /**
   * Aggiorna il nome della scaletta
   *
   * @param {string} newName - Nuovo nome della scaletta
   */
  const updateScalettaName = async (newName) => {
    try {
      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return;
      }

      setLoading(true);
      setError(null);

      // Aggiorna il nome della scaletta
      const { error } = await supabase
        .from('scalette')
        .update({ name: newName })
        .eq('id', activeScalettaId);

      if (error) {
        throw error;
      }

      // Aggiorna lo stato locale
      setScalettaName(newName);
    } catch (error) {
      console.error('Errore nell\'aggiornamento del nome della scaletta:', error.message);
      setError('Errore nell\'aggiornamento del nome della scaletta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiunge un elemento media alla scaletta
   *
   * @param {Object} mediaData - Dati del media
   * @returns {Promise<Object>} - Elemento aggiunto
   */
  const addMediaItem = async (mediaData) => {
    try {
      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return null;
      }

      setLoading(true);
      setError(null);

      // Calcola l'ordine del nuovo elemento
      const maxOrder = scalettaItems.length > 0
        ? Math.max(...scalettaItems.map(item => item.item_order))
        : -1;

      // Prepara i dati JSONB secondo la struttura definita
      const jsonbData = {
        customName: mediaData.customName || mediaData.clip,
        originalName: mediaData.clip,
        notes: mediaData.notes || '',
        sourcePath: mediaData.clip,
        timing: {
          startTime: mediaData.startTime || '00:00:00',
          duration: mediaData.duration || '00:00:00',
          inPoint: mediaData.inPoint || '00:00:00:00',
          outPoint: mediaData.outPoint || '00:00:00:00'
        },
        casparcgConfig: {
          channel: mediaData.channel || 1,
          layer: mediaData.layer || 10
        },
        mediaDetails: {
          clipPath: mediaData.clip,
          loop: mediaData.loop || false,
          autoNext: mediaData.autoNext || false,
          linkedTemplate: null
        },
        templateDetails: null
      };

      // Crea il nuovo elemento
      const { data, error } = await supabase
        .from('scaletta_items')
        .insert([
          {
            scaletta_id: activeScalettaId,
            item_order: maxOrder + 1,
            type: 'MEDIA',
            name: mediaData.customName || mediaData.clip,
            data: jsonbData,
            updated_by: currentUserId
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Genera un ID univoco per l'evento
      const eventId = `INSERT-${data[0].id}-${Date.now()}`;

      // Imposta l'ID dell'ultimo evento gestito
      lastHandledEventRef.current = eventId;

      // Aggiorna lo stato locale
      const newItem = data[0];
      setScalettaItems(items => [...items, newItem]);
      setModified(true);

      return newItem;
    } catch (error) {
      console.error('Errore nell\'aggiunta del media:', error.message);
      setError('Errore nell\'aggiunta del media: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiunge un elemento template alla scaletta
   *
   * @param {Object} templateData - Dati del template
   * @returns {Promise<Object>} - Elemento aggiunto
   */
  const addTemplateItem = async (templateData) => {
    try {
      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return null;
      }

      setLoading(true);
      setError(null);

      // Calcola l'ordine del nuovo elemento
      const maxOrder = scalettaItems.length > 0
        ? Math.max(...scalettaItems.map(item => item.item_order))
        : -1;

      // Prepara i dati JSONB secondo la struttura definita
      const jsonbData = {
        customName: templateData.customName || templateData.template,
        originalName: templateData.template,
        notes: templateData.notes || '',
        sourcePath: templateData.template,
        timing: {
          startTime: templateData.startTime || '00:00:00',
          duration: '00:00:10', // Durata di default per i template
          inPoint: '00:00:00:00',
          outPoint: '00:00:10:00'
        },
        casparcgConfig: {
          channel: templateData.channel || 1,
          layer: templateData.layer || 11
        },
        mediaDetails: null,
        templateDetails: {
          templateFile: templateData.template,
          casparcgConfig: {
            cgLayer: templateData.cgLayer || '1',
            playOnLoad: templateData.playOnLoad !== undefined ? templateData.playOnLoad : true
          },
          autoRemove: false,
          instanceData: templateData.data || {}
        }
      };

      // Crea il nuovo elemento
      const { data, error } = await supabase
        .from('scaletta_items')
        .insert([
          {
            scaletta_id: activeScalettaId,
            item_order: maxOrder + 1,
            type: 'TEMPLATE',
            name: templateData.customName || templateData.template,
            data: jsonbData,
            updated_by: currentUserId
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Genera un ID univoco per l'evento
      const eventId = `INSERT-${data[0].id}-${Date.now()}`;

      // Imposta l'ID dell'ultimo evento gestito
      lastHandledEventRef.current = eventId;

      // Aggiorna lo stato locale
      const newItem = data[0];
      setScalettaItems(items => [...items, newItem]);
      setModified(true);

      return newItem;
    } catch (error) {
      console.error('Errore nell\'aggiunta del template:', error.message);
      setError('Errore nell\'aggiunta del template: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiorna un elemento della scaletta
   *
   * @param {Object} updatedItem - Elemento aggiornato
   * @returns {Promise<Object>} - Risultato dell'aggiornamento
   */
  const updateItem = async (updatedItem) => {
    try {
      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return { success: false, error: 'Permessi insufficienti' };
      }

      if (!updatedItem || !updatedItem.id) {
        console.error('[UPDATE ITEM] Impossibile aggiornare l\'elemento: ID mancante');
        return { success: false, error: 'ID elemento mancante' };
      }

      console.log(`[UPDATE ITEM] Aggiornamento elemento ${updatedItem.id}:`, updatedItem);

      setLoading(true);
      setError(null);

      // Ottieni la versione corrente dell'elemento
      const { data: currentItem, error: fetchError } = await supabase
        .from('scaletta_items')
        .select('version')
        .eq('id', updatedItem.id)
        .single();

      if (fetchError) {
        console.error(`[UPDATE ITEM] Errore nel recupero della versione corrente:`, fetchError);
        throw fetchError;
      }

      console.log(`[UPDATE ITEM] Versione corrente: ${currentItem.version}, versione item: ${updatedItem.version}`);

      // Verifica se c'è un conflitto di versione
      if (currentItem.version !== updatedItem.version) {
        console.log(`[UPDATE ITEM] Rilevato conflitto di versione: DB=${currentItem.version}, Local=${updatedItem.version}`);

        // Ottieni i dati più recenti
        const { data: latestItem, error: latestError } = await supabase
          .from('scaletta_items')
          .select('*')
          .eq('id', updatedItem.id)
          .single();

        if (latestError) {
          console.error(`[UPDATE ITEM] Errore nel recupero dei dati più recenti:`, latestError);
          throw latestError;
        }

        console.log(`[UPDATE ITEM] Dati più recenti recuperati:`, latestItem);

        return {
          conflict: true,
          latestData: latestItem,
          message: 'Conflitto rilevato: l\'elemento è stato modificato da un altro utente'
        };
      }

      // Aggiungi un timestamp aggiornato per garantire che Supabase rilevi il cambiamento
      const updatedAt = new Date().toISOString();

      // Aggiorna l'elemento
      const { data, error } = await supabase
        .from('scaletta_items')
        .update({
          name: updatedItem.name,
          data: updatedItem.data,
          version: currentItem.version + 1,
          updated_by: currentUserId,
          updated_at: updatedAt
        })
        .eq('id', updatedItem.id)
        .eq('version', currentItem.version)
        .select();

      if (error) {
        console.error(`[UPDATE ITEM] Errore nell'aggiornamento dell'elemento:`, error);
        throw error;
      }

      console.log(`[UPDATE ITEM] Elemento aggiornato con successo:`, data);

      // Genera un ID univoco per l'evento
      const eventId = `UPDATE-${updatedItem.id}-${Date.now()}`;
      console.log(`[UPDATE ITEM] Evento UPDATE generato: ${eventId}`);

      // Imposta l'ID dell'ultimo evento gestito
      lastHandledEventRef.current = eventId;

      // Log dello stato prima dell'aggiornamento
      console.log('[UPDATE ITEM] Stato items prima dell\'aggiornamento:',
        JSON.stringify(scalettaItems.map(i => ({ id: i.id, name: i.name })), null, 2));

      // Aggiorna lo stato locale con una nuova istanza dell'array
      if (data && data.length > 0) {
        setScalettaItems(items => {
          // Crea un nuovo array con l'elemento aggiornato
          const updatedItems = items.map(item =>
            item.id === updatedItem.id
              ? { ...data[0] } // Usa lo spread operator per garantire una nuova istanza
              : item
          );

          console.log('[UPDATE ITEM] Stato items dopo l\'aggiornamento:',
            JSON.stringify(updatedItems.map(i => ({ id: i.id, name: i.name })), null, 2));

          return updatedItems;
        });

        setModified(true);

        return { success: true, data: data[0] };
      } else {
        console.error('[UPDATE ITEM] Nessun dato restituito dall\'aggiornamento');
        return { success: false, error: 'Nessun dato restituito dall\'aggiornamento' };
      }
    } catch (error) {
      console.error('[UPDATE ITEM] Errore nell\'aggiornamento dell\'elemento:', error.message);
      setError('Errore nell\'aggiornamento dell\'elemento: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rimuove un elemento dalla scaletta
   *
   * @param {string} itemId - ID dell'elemento da rimuovere
   * @returns {Promise<boolean>} - True se l'elemento è stato rimosso con successo, false altrimenti
   */
  const removeItem = async (itemId) => {
    try {
      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return false;
      }

      console.log(`Rimuovendo elemento con ID ${itemId} dalla scaletta ${activeScalettaId}`);

      // Verifica che itemId sia valido
      if (!itemId) {
        console.error("ID elemento non valido:", itemId);
        return false;
      }

      setLoading(true);
      setError(null);

      // Rimuovi l'elemento
      const { error } = await supabase
        .from('scaletta_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      // Genera un ID univoco per l'evento
      const eventId = `DELETE-${itemId}-${Date.now()}`;
      console.log(`Evento DELETE generato: ${eventId}`);

      // Imposta l'ID dell'ultimo evento gestito
      lastHandledEventRef.current = eventId;

      // Aggiorna lo stato locale
      setScalettaItems(items => items.filter(item => item.id !== itemId));
      setModified(true);

      console.log(`Elemento con ID ${itemId} rimosso con successo`);
      return true;
    } catch (error) {
      console.error('Errore nella rimozione dell\'elemento:', error.message);
      setError('Errore nella rimozione dell\'elemento: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestisce il drag and drop per riordinare gli elementi
   *
   * @param {number} dragIndex - Indice dell'elemento trascinato
   * @param {number} dropIndex - Indice dell'elemento su cui è stato rilasciato
   * @returns {Promise<boolean>} - True se il riordino è avvenuto con successo, false altrimenti
   */
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();

    try {
      // Ottieni l'indice dell'elemento trascinato dai dati di trasferimento
      const dragData = e.dataTransfer.getData('text/plain');
      console.log(`[DRAG&DROP] Dati di trasferimento ricevuti: "${dragData}"`);

      // Verifica che dragData sia una stringa non vuota
      if (!dragData) {
        console.error('[DRAG&DROP] Errore: dati di trasferimento mancanti o vuoti');
        setError('Errore nel drag and drop: dati di trasferimento mancanti');
        return false;
      }

      // Converti in numero e verifica che sia un numero valido
      const dragIndex = parseInt(dragData, 10);
      if (isNaN(dragIndex)) {
        console.error(`[DRAG&DROP] Errore: indice di trascinamento non valido: "${dragData}"`);
        setError('Errore nel drag and drop: indice non valido');
        return false;
      }

      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return false;
      }

      // Verifica che gli indici siano diversi
      if (dragIndex === dropIndex) {
        console.log(`[DRAG&DROP] Nessuna modifica necessaria: indice di origine e destinazione identici (${dragIndex})`);
        return true;
      }

      // Verifica che gli indici siano validi rispetto all'array
      if (dragIndex < 0 || dragIndex >= scalettaItems.length || dropIndex < 0 || dropIndex >= scalettaItems.length) {
        console.error(`[DRAG&DROP] Errore: indici fuori intervallo - dragIndex: ${dragIndex}, dropIndex: ${dropIndex}, lunghezza array: ${scalettaItems.length}`);
        setError('Errore nel drag and drop: indici fuori intervallo');
        return false;
      }

      console.log(`[DRAG&DROP] Riordinamento da indice ${dragIndex} a indice ${dropIndex}`);

      setLoading(true);
      setError(null);

      // Crea una copia dell'array degli elementi
      const newItems = [...scalettaItems];
      // Rimuovi l'elemento trascinato
      const draggedItemTemp = newItems.splice(dragIndex, 1)[0];

      // Verifica che l'elemento trascinato sia stato trovato
      if (!draggedItemTemp) {
        console.error(`[DRAG&DROP] Errore: elemento trascinato non trovato all'indice ${dragIndex}`);
        setError('Errore nel drag and drop: elemento non trovato');
        return false;
      }

      // Inserisci l'elemento nella nuova posizione
      newItems.splice(dropIndex, 0, draggedItemTemp);

      // Log dello stato prima dell'aggiornamento
      console.log('[DRAG&DROP] Stato items prima dell\'aggiornamento:',
        JSON.stringify(scalettaItemsRef.current.map(i => ({ id: i.id, name: i.name, order: i.item_order })), null, 2));

      // Aggiorna gli ordini degli elementi uno per uno invece di usare upsert batch
      // Questo approccio rispetta meglio le policy RLS di Supabase
      console.log(`[DRAG&DROP] Aggiornamento di ${newItems.length} elementi con nuovi ordini`);

      let hasError = false;
      let updateError = null;

      // Utilizziamo un ciclo for...of per poter usare await all'interno
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        const newOrder = i;

        console.log(`[DRAG&DROP] Aggiornamento elemento ${item.id} con nuovo ordine ${newOrder}`);

        // Aggiorna un elemento alla volta
        const { error } = await supabase
          .from('scaletta_items')
          .update({
            item_order: newOrder,
            version: item.version + 1,
            updated_by: currentUserId,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) {
          console.error(`[DRAG&DROP] Errore nell'aggiornamento dell'elemento ${item.id}:`, error);
          hasError = true;
          updateError = error;
          break; // Interrompi il ciclo al primo errore
        }
      }

      // Se c'è stato un errore, lancialo
      if (hasError) {
        console.error(`[DRAG&DROP] Errore nell'aggiornamento degli elementi:`, updateError);
        throw updateError;
      }

      console.log(`[DRAG&DROP] Aggiornamento degli elementi completato con successo`);

      // Genera un ID univoco per l'evento
      const eventId = `REORDER-${Date.now()}`;
      console.log(`[DRAG&DROP] Evento REORDER generato: ${eventId}`);

      // Imposta l'ID dell'ultimo evento gestito
      lastHandledEventRef.current = eventId;

      // Aggiorna lo stato locale con una nuova istanza dell'array
      // Questo garantisce che React rilevi il cambiamento e aggiorni l'interfaccia
      setScalettaItems([...newItems]);
      setDragOverIndex(null);
      setModified(true);

      // Log dello stato dopo l'aggiornamento
      console.log('[DRAG&DROP] Stato items dopo l\'aggiornamento:',
        JSON.stringify(newItems.map(i => ({ id: i.id, name: i.name, order: i.item_order })), null, 2));

      return true;
    } catch (error) {
      console.error('[DRAG&DROP] Errore nel riordino degli elementi:', error.message);
      setError('Errore nel riordino degli elementi: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per gestire il drag and drop
  const handleDragStart = (e, index) => {
    try {
      // Verifica che l'indice sia valido
      if (index === undefined || index === null || isNaN(index)) {
        console.error(`[DRAG&DROP] Errore: indice non valido in handleDragStart: ${index}`);
        return;
      }

      // Converti l'indice in stringa per garantire la compatibilità
      const indexStr = String(index);
      console.log(`[DRAG&DROP] Impostazione dati di trasferimento: "${indexStr}"`);

      // Imposta i dati da trasferire
      e.dataTransfer.setData('text/plain', indexStr);

      // Imposta l'effetto di trascinamento
      e.dataTransfer.effectAllowed = 'move';

      // Aggiungi una classe CSS all'elemento trascinato per lo stile
      if (e.target && e.target.classList) {
        e.target.classList.add('dragging');
      }
    } catch (error) {
      console.error('[DRAG&DROP] Errore in handleDragStart:', error);
    }
  };

  const handleDragOver = (e, index) => {
    try {
      e.preventDefault();
      setDragOverIndex(index);
      e.dataTransfer.dropEffect = 'move';
    } catch (error) {
      console.error('[DRAG&DROP] Errore in handleDragOver:', error);
    }
  };

  const handleDragEnd = (e) => {
    try {
      setDragOverIndex(null);

      // Rimuovi la classe CSS dall'elemento trascinato
      if (e && e.target && e.target.classList) {
        e.target.classList.remove('dragging');
      }
    } catch (error) {
      console.error('[DRAG&DROP] Errore in handleDragEnd:', error);
    }
  };



  /**
   * Aggiunge una nuova storia alla scaletta
   *
   * @param {Object} storyData - Dati della storia da aggiungere
   * @returns {Promise<Object>} - Elemento aggiunto
   */
  const addEmptyStory = async (storyData = null) => {
    try {
      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return null;
      }

      setLoading(true);
      setError(null);

      // Calcola l'ordine del nuovo elemento
      const maxOrder = scalettaItems.length > 0
        ? Math.max(...scalettaItems.map(item => item.item_order))
        : -1;

      // Prepara i dati JSONB secondo la struttura definita
      const defaultData = {
        customName: 'Nuova Storia',
        originalName: 'Nuova Storia',
        notes: '',
        content: '',
        sourcePath: '',
        timing: {
          startTime: '00:00:00',
          duration: '00:01:00',
          inPoint: '00:00:00:00',
          outPoint: '00:01:00:00'
        },
        casparcgConfig: {
          channel: 1,
          layer: 10
        },
        // Aggiungiamo mediaDetails per supportare le funzionalità di riproduzione
        mediaDetails: {
          clipPath: '',
          loop: false,
          autoNext: false,
          linkedTemplate: null,
          channel: 1,
          layer: 10
        },
        // Aggiungiamo templatesDetails per supportare i template multipli
        templatesDetails: []
      };

      // Unisci i dati predefiniti con quelli forniti
      const jsonbData = storyData ? {
        customName: storyData.name || defaultData.customName,
        originalName: storyData.name || defaultData.originalName,
        notes: storyData.notes || defaultData.notes,
        content: storyData.content || defaultData.content,
        sourcePath: storyData.sourcePath || defaultData.sourcePath,
        timing: {
          startTime: storyData.timing?.startTime || defaultData.timing.startTime,
          duration: storyData.timing?.duration || defaultData.timing.duration,
          inPoint: storyData.timing?.inPoint || defaultData.timing.inPoint,
          outPoint: storyData.timing?.outPoint || defaultData.timing.outPoint
        },
        casparcgConfig: {
          channel: storyData.casparcgConfig?.channel || defaultData.casparcgConfig.channel,
          layer: storyData.casparcgConfig?.layer || defaultData.casparcgConfig.layer
        },
        // Usa i mediaDetails forniti o quelli predefiniti
        mediaDetails: storyData.mediaDetails || defaultData.mediaDetails,
      } : defaultData;

      // Gestione dei template: priorità al nuovo formato (templatesDetails)
      if (storyData) {
        // Caso 1: Se templatesDetails è fornito e non è vuoto, lo utilizziamo e impostiamo templateDetails a null
        if (storyData.templatesDetails && Array.isArray(storyData.templatesDetails) && storyData.templatesDetails.length > 0) {
          console.log("[ADD_STORY] Utilizzando templatesDetails fornito:", storyData.templatesDetails);
          jsonbData.templatesDetails = storyData.templatesDetails;
          jsonbData.templateDetails = null; // Impostiamo esplicitamente a null per evitare confusione
        }
        // Caso 2: Se templatesDetails non è fornito ma c'è templateDetails (legacy), convertiamo in templatesDetails
        else if (storyData.templateDetails && storyData.templateDetails.templateFile) {
          console.log("[ADD_STORY] Convertendo templateDetails legacy in templatesDetails:", storyData.templateDetails);
          jsonbData.templateDetails = storyData.templateDetails;
          jsonbData.templatesDetails = [{
            templateFile: storyData.templateDetails.templateFile,
            casparcgConfig: storyData.templateDetails.casparcgConfig || {
              cgLayer: 1,
              playOnLoad: true,
              channel: storyData.casparcgConfig?.channel || 1,
              layer: 20
            },
            autoRemove: storyData.templateDetails.autoRemove || false,
            instanceData: storyData.templateDetails.instanceData || {},
            timing: {
              startDelay: 0,
              autoStart: true
            }
          }];
        }
        // Caso 3: Se non c'è né templatesDetails né templateDetails, inizializziamo templatesDetails come array vuoto
        else {
          console.log("[ADD_STORY] Nessun template fornito, inizializzando templatesDetails vuoto");
          jsonbData.templatesDetails = [];
          jsonbData.templateDetails = null;
        }
      }

      // Crea il nuovo elemento
      const { data, error } = await supabase
        .from('scaletta_items')
        .insert([
          {
            scaletta_id: activeScalettaId,
            item_order: maxOrder + 1,
            type: 'STORY',
            name: jsonbData.customName,
            data: jsonbData,
            updated_by: currentUserId
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Genera un ID univoco per l'evento
      const eventId = `INSERT-${data[0].id}-${Date.now()}`;

      // Imposta l'ID dell'ultimo evento gestito
      lastHandledEventRef.current = eventId;

      // Aggiorna lo stato locale
      const newItem = data[0];
      setScalettaItems(items => [...items, newItem]);
      setModified(true);

      return newItem;
    } catch (error) {
      console.error('Errore nell\'aggiunta della storia:', error.message);
      setError('Errore nell\'aggiunta della storia: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Salva lo stato corrente della scaletta
   *
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  const saveScaletta = async () => {
    try {
      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return { success: false, error: 'Permessi insufficienti' };
      }

      setLoading(true);
      setError(null);

      // Aggiorna il timestamp della scaletta
      const { error } = await supabase
        .from('scalette')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', activeScalettaId);

      if (error) {
        throw error;
      }

      // Resetta lo stato di modifica
      setModified(false);

      return { success: true, message: 'Scaletta salvata con successo' };
    } catch (error) {
      console.error('Errore nel salvataggio della scaletta:', error.message);
      setError('Errore nel salvataggio della scaletta: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina la scaletta corrente
   *
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  const deleteScaletta = async () => {
    try {
      // Verifica i permessi (solo il proprietario può eliminare la scaletta)
      if (userRoleForScaletta !== 'owner') {
        setError('Solo il proprietario può eliminare la scaletta');
        return { success: false, error: 'Permessi insufficienti' };
      }

      setLoading(true);
      setError(null);

      // Elimina prima tutti gli elementi della scaletta
      const { error: itemsError } = await supabase
        .from('scaletta_items')
        .delete()
        .eq('scaletta_id', activeScalettaId);

      if (itemsError) {
        throw itemsError;
      }

      // Elimina i collaboratori della scaletta
      const { error: collaboratorsError } = await supabase
        .from('scaletta_collaborators')
        .delete()
        .eq('scaletta_id', activeScalettaId);

      if (collaboratorsError) {
        throw collaboratorsError;
      }

      // Elimina la scaletta
      const { error } = await supabase
        .from('scalette')
        .delete()
        .eq('id', activeScalettaId);

      if (error) {
        throw error;
      }

      return { success: true, message: 'Scaletta eliminata con successo', redirectTo: '/scalette' };
    } catch (error) {
      console.error('Errore nell\'eliminazione della scaletta:', error.message);
      setError('Errore nell\'eliminazione della scaletta: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Esporta la scaletta in formato JSON
   *
   * @returns {Object} - Dati della scaletta in formato JSON
   */
  const exportScaletta = () => {
    try {
      // Crea un oggetto con i dati della scaletta
      const exportData = {
        id: activeScalettaId,
        name: scalettaName,
        items: scalettaItems.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          order: item.item_order,
          data: item.data
        })),
        exported_at: new Date().toISOString(),
        exported_by: currentUserId
      };

      return { success: true, data: exportData };
    } catch (error) {
      console.error('Errore nell\'esportazione della scaletta:', error.message);
      setError('Errore nell\'esportazione della scaletta: ' + error.message);
      return { success: false, error: error.message };
    }
  };



  /**
   * Ripristina la scaletta a una versione precedente
   *
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  const restoreScaletta = async () => {
    try {
      // Verifica i permessi
      if (!canUserEditScaletta(userRoleForScaletta)) {
        setError('Non hai i permessi per modificare questa scaletta');
        return { success: false, error: 'Permessi insufficienti' };
      }

      setLoading(true);
      setError(null);

      // In una implementazione reale, qui si recupererebbe una versione precedente della scaletta
      // Per ora, ricarichiamo semplicemente i dati dal database
      await loadScalettaData(activeScalettaId);

      // Resetta lo stato di modifica
      setModified(false);

      return { success: true, message: 'Scaletta ripristinata con successo' };
    } catch (error) {
      console.error('Errore nel ripristino della scaletta:', error.message);
      setError('Errore nel ripristino della scaletta: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Condivide la scaletta con un altro utente
   *
   * @param {string} email - Email dell'utente con cui condividere
   * @param {string} role - Ruolo da assegnare all'utente ('editor', 'viewer')
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  const shareScaletta = async (email, role) => {
    try {
      // Verifica i permessi (solo il proprietario può condividere la scaletta)
      if (userRoleForScaletta !== 'owner') {
        setError('Solo il proprietario può condividere la scaletta');
        return { success: false, error: 'Permessi insufficienti' };
      }

      if (!email || !role) {
        return { success: false, error: 'Email e ruolo sono obbligatori' };
      }

      if (!['editor', 'viewer'].includes(role)) {
        return { success: false, error: 'Ruolo non valido. I ruoli validi sono: editor, viewer' };
      }

      setLoading(true);
      setError(null);

      // Cerca l'utente tramite email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          return { success: false, error: 'Utente non trovato' };
        }
        throw userError;
      }

      const userId = userData.id;

      // Verifica se l'utente è già un collaboratore
      const { data: existingCollaborator, error: collaboratorError } = await supabase
        .from('scaletta_collaborators')
        .select('id, role')
        .eq('scaletta_id', activeScalettaId)
        .eq('user_id', userId);

      if (collaboratorError) {
        throw collaboratorError;
      }

      if (existingCollaborator && existingCollaborator.length > 0) {
        // Aggiorna il ruolo del collaboratore esistente
        const { error: updateError } = await supabase
          .from('scaletta_collaborators')
          .update({ role })
          .eq('id', existingCollaborator[0].id);

        if (updateError) {
          throw updateError;
        }

        return { success: true, message: `Ruolo dell'utente aggiornato a ${role}` };
      }

      // Aggiungi il nuovo collaboratore
      const { error: insertError } = await supabase
        .from('scaletta_collaborators')
        .insert([
          {
            scaletta_id: activeScalettaId,
            user_id: userId,
            role
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      return { success: true, message: `Scaletta condivisa con ${email} (ruolo: ${role})` };
    } catch (error) {
      console.error('Errore nella condivisione della scaletta:', error.message);
      setError('Errore nella condivisione della scaletta: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    scalettaItems,
    scalettaName,
    loading,
    error,
    modified,
    selectedItemIndex,
    dragOverIndex,
    userRoleForScaletta,
    editingStatusByItemId,
    activeScalettaId,
    setScalettaName: updateScalettaName,
    setSelectedItemIndex,
    addMediaItem,
    addTemplateItem,
    addEmptyStory,
    updateItem,
    removeItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    startEditingItem,
    stopEditingItem,
    saveScaletta,
    deleteScaletta,
    exportScaletta,
    restoreScaletta,
    shareScaletta
  };
};

export default useScalettaItems;
