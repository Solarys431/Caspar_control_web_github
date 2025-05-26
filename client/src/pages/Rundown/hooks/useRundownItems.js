/**
 * Hook per gestire gli elementi del rundown con Supabase
 * Segue gli stessi pattern di useScalettaItems per consistenza architetturale
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import supabase from '../../../supabaseClient';
import { getUserRoleForRundown, canUserEditRundown } from '../../../utils/permissionsChecker';
import useRundownPresence from './useRundownPresence';

/**
 * Hook per gestire gli elementi del rundown con sincronizzazione Supabase
 *
 * @param {string} externalRundownId - ID rundown passato esternamente (per Editor Scalette)
 * @returns {Object} - Funzioni e stati per gestire gli elementi del rundown
 */
const useRundownItems = (externalRundownId = null) => {
  // Ottieni l'ID del rundown dai parametri dell'URL
  const { id: urlRundownId } = useParams();

  // CORREZIONE CRITICA: Stabilizza activeRundownId con useMemo per evitare re-render
  const activeRundownId = useMemo(() => {
    return externalRundownId || urlRundownId;
  }, [externalRundownId, urlRundownId]);

  // CORREZIONE CRITICA: Sposta il logging in useEffect per evitare loop infinito
  const prevActiveRundownIdRef = useRef();

  useEffect(() => {
    // Log solo quando activeRundownId cambia effettivamente
    if (prevActiveRundownIdRef.current !== activeRundownId) {
      console.log('🔍 [USE_RUNDOWN_ITEMS] ID rundown determinato:', {
        externalRundownId,
        urlRundownId,
        activeRundownId,
        source: externalRundownId ? 'external' : 'url',
        changed: true
      });
      prevActiveRundownIdRef.current = activeRundownId;
    }
  }, [activeRundownId, externalRundownId, urlRundownId]);

  // Stati per il rundown
  const [rundownItems, setRundownItems] = useState([]);
  const [rundownName, setRundownName] = useState('Caricamento...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modified, setModified] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [userRoleForRundown, setUserRoleForRundown] = useState(null);

  // Riferimento per tenere traccia dell'ultimo evento gestito e dello stato corrente
  const lastHandledEventRef = useRef(null);
  const rundownItemsRef = useRef([]);

  // Aggiorna il riferimento quando cambia lo stato
  useEffect(() => {
    rundownItemsRef.current = rundownItems;
  }, [rundownItems]);

  // Ottieni l'utente corrente
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Utilizziamo il hook useRundownPresence per gestire la presenza
  const {
    editingStatusByItemId,
    startEditingItem,
    stopEditingItem
  } = useRundownPresence(activeRundownId, currentUserId, user, supabase);

  /**
   * Carica i dati del rundown
   *
   * @param {string} rundownId - ID del rundown
   */
  const loadRundownData = useCallback(async (rundownId) => {
    try {
      setLoading(true);
      setError(null);

      // Ottieni i dati del rundown
      const { data: rundownData, error: rundownError } = await supabase
        .from('rundowns')
        .select('name, owner_id')
        .eq('id', rundownId)
        .single();

      if (rundownError) {
        throw rundownError;
      }

      // Imposta il nome del rundown
      setRundownName(rundownData.name);

      // Determina il ruolo dell'utente per questo rundown
      const userRole = await getUserRoleForRundown(currentUserId, rundownId);
      setUserRoleForRundown(userRole);

      // Ottieni gli elementi del rundown
      const { data: itemsData, error: itemsError } = await supabase
        .from('rundown_items')
        .select('*')
        .eq('rundown_id', rundownId)
        .order('item_order', { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      // Imposta gli elementi del rundown
      setRundownItems(itemsData);
    } catch (error) {
      console.error('Errore nel caricamento del rundown:', error.message);
      setError('Errore nel caricamento del rundown: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]); // CORREZIONE: Rimuovi dipendenze setter che non cambiano mai

  /**
   * Gestisce l'inserimento remoto di un elemento
   *
   * @param {Object} newItem - Nuovo elemento inserito
   */
  const handleRemoteInsert = useCallback((newItem) => {
    setRundownItems(prevItems => [...prevItems, newItem].sort((a, b) => a.item_order - b.item_order));
  }, []);

  /**
   * Gestisce l'aggiornamento remoto di un elemento
   *
   * @param {Object} oldItem - Elemento prima dell'aggiornamento
   * @param {Object} newItem - Elemento dopo l'aggiornamento
   * @param {string} eventOriginatorId - ID dell'utente che ha originato l'evento
   */
  const handleRemoteUpdate = useCallback((oldItem, newItem, eventOriginatorId) => {
    console.log(`[RUNDOWN REALTIME UPDATE] Aggiornamento remoto dell'elemento ${newItem.id}`, {
      oldItem,
      newItem,
      eventOriginatorId,
      currentUserId
    });

    // Verifica se è un aggiornamento di riordinamento (item_order cambiato)
    if (oldItem.item_order !== newItem.item_order) {
      console.log(`[RUNDOWN REALTIME UPDATE] Rilevato cambiamento nell'ordine dell'elemento: ${oldItem.item_order} -> ${newItem.item_order}`);

      // Se l'ordine è cambiato E l'evento NON è stato originato dall'utente corrente, ricarica.
      if (eventOriginatorId !== currentUserId) {
        console.log(`[RUNDOWN REALTIME UPDATE] Il cambiamento dell'ordine è stato originato da un altro utente (${eventOriginatorId}). Ricaricando tutti gli elementi...`);
        loadRundownData(activeRundownId);
        return;
      } else {
        console.log(`[RUNDOWN REALTIME UPDATE] Il cambiamento dell'ordine è stato originato dall'utente corrente. L'aggiornamento locale dovrebbe aver già gestito questo.`);
      }
    }

    // Log dettagliato per debug usando rundownItemsRef.current invece di rundownItems
    console.log('[RUNDOWN REALTIME UPDATE] Stato items prima dell\'aggiornamento:',
      JSON.stringify(rundownItemsRef.current.map(i => ({ id: i.id, name: i.name, order: i.item_order })), null, 2));

    // Crea una nuova istanza dell'array items con l'elemento aggiornato
    setRundownItems(prevItems => {
      // Verifica se l'elemento esiste nell'array
      const itemExists = prevItems.some(item => item.id === newItem.id);

      if (!itemExists) {
        console.log(`[RUNDOWN REALTIME UPDATE] L'elemento ${newItem.id} non esiste nell'array locale, lo aggiungiamo`);
        return [...prevItems, newItem].sort((a, b) => a.item_order - b.item_order);
      }

      // Crea un nuovo array con l'elemento aggiornato
      const updatedItems = prevItems.map(item =>
        item.id === newItem.id ? { ...newItem } : item
      );

      console.log('[RUNDOWN REALTIME UPDATE] Stato items dopo l\'aggiornamento:',
        JSON.stringify(updatedItems.map(i => ({ id: i.id, name: i.name, order: i.item_order })), null, 2));

      return updatedItems;
    });

    // Imposta lo stato come modificato
    setModified(true);
  }, [activeRundownId, loadRundownData, currentUserId]);

  /**
   * Gestisce l'eliminazione remota di un elemento
   *
   * @param {Object} oldItem - Elemento eliminato
   */
  const handleRemoteDelete = useCallback((oldItem) => {
    console.log(`[RUNDOWN REALTIME DELETE] Eliminazione remota dell'elemento ${oldItem.id}`, oldItem);
    setRundownItems(prevItems => prevItems.filter(item => item.id !== oldItem.id));
  }, []);

  // Carica i dati del rundown all'avvio
  useEffect(() => {
    if (activeRundownId && currentUserId) {
      loadRundownData(activeRundownId);
    }
  }, [activeRundownId, currentUserId, loadRundownData]);

  // Sottoscrizione ai cambiamenti in tempo reale
  useEffect(() => {
    if (!activeRundownId || !currentUserId) return;

    // Crea il canale per la sottoscrizione
    const channel = supabase
      .channel(`rundown-items-${activeRundownId}`)
      // Sottoscrizione ai cambiamenti degli elementi del rundown
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rundown_items',
        filter: `rundown_id=eq.${activeRundownId}`
      }, (payload) => {
        // Genera un ID univoco per l'evento
        const eventId = `${payload.eventType}-${payload.new?.id || payload.old?.id}-${Date.now()}`;

        console.log(`[RUNDOWN REALTIME] Evento ricevuto: ${eventId}`, payload);

        // Imposta l'ID dell'ultimo evento gestito
        lastHandledEventRef.current = eventId;

        // Ignora gli eventi generati dall'utente corrente
        if ((payload.eventType === 'DELETE' && lastHandledEventRef.current && lastHandledEventRef.current.startsWith(`DELETE-${payload.old?.id}`)) ||
            (payload.eventType !== 'DELETE' && payload.new?.updated_by === currentUserId)) {
          console.log(`[RUNDOWN REALTIME] Evento ignorato perché generato dall'utente corrente: ${eventId}`);
          return;
        }

        // Gestisci i diversi tipi di eventi
        switch (payload.eventType) {
          case 'INSERT':
            console.log(`[RUNDOWN REALTIME] Gestione evento INSERT: ${eventId}`);
            handleRemoteInsert(payload.new);
            break;
          case 'UPDATE':
            console.log(`[RUNDOWN REALTIME] Gestione evento UPDATE: ${eventId}`);
            handleRemoteUpdate(payload.old, payload.new, payload.new?.updated_by);
            break;
          case 'DELETE':
            console.log(`[RUNDOWN REALTIME] Gestione evento DELETE: ${eventId}`);
            if (payload.old && payload.old.id) {
              handleRemoteDelete(payload.old);
            } else {
              console.error(`[RUNDOWN REALTIME] Evento DELETE senza payload.old o payload.old.id: ${eventId}`);
            }
            break;
          default:
            break;
        }
      })
      // Sottoscrizione ai cambiamenti del rundown stesso (per il nome)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rundowns',
        filter: `id=eq.${activeRundownId}`
      }, (payload) => {
        // Aggiorna il nome del rundown se è stato modificato
        if (payload.new?.name && payload.new.name !== rundownName) {
          console.log(`[RUNDOWN REALTIME] Nome rundown aggiornato da un altro utente: ${payload.new.name}`);
          setRundownName(payload.new.name);
        }
      })
      .subscribe();

    // Pulizia della sottoscrizione
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeRundownId, currentUserId, rundownName, loadRundownData, handleRemoteInsert, handleRemoteUpdate, handleRemoteDelete]);

  /**
   * Aggiorna il nome del rundown
   *
   * @param {string} newName - Nuovo nome del rundown
   */
  const updateRundownName = async (newName) => {
    try {
      // Verifica i permessi
      if (!canUserEditRundown(userRoleForRundown)) {
        setError('Non hai i permessi per modificare questo rundown');
        return;
      }

      setLoading(true);
      setError(null);

      // Aggiorna il nome del rundown
      const { error } = await supabase
        .from('rundowns')
        .update({ name: newName })
        .eq('id', activeRundownId);

      if (error) {
        throw error;
      }

      // Aggiorna lo stato locale
      setRundownName(newName);
    } catch (error) {
      console.error('Errore nell\'aggiornamento del nome del rundown:', error.message);
      setError('Errore nell\'aggiornamento del nome del rundown: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiunge un elemento media al rundown
   *
   * @param {Object} mediaData - Dati del media
   * @returns {Promise<Object>} - Elemento aggiunto
   */
  const addMediaItem = async (mediaData) => {
    try {
      // Verifica i permessi
      if (!canUserEditRundown(userRoleForRundown)) {
        setError('Non hai i permessi per modificare questo rundown');
        return null;
      }

      setLoading(true);
      setError(null);

      // Calcola l'ordine del nuovo elemento
      const maxOrder = rundownItems.length > 0
        ? Math.max(...rundownItems.map(item => item.item_order))
        : -1;

      // Prepara i dati JSONB seguendo la struttura del rundown esistente
      const jsonbData = {
        clip: mediaData.clip,
        channel: mediaData.channel || 1,
        layer: mediaData.layer || 10,
        customName: mediaData.customName || '',
        loop: mediaData.loop || false,
        autoNext: mediaData.autoNext || false,
        linkedTemplate: mediaData.linkedTemplate || null,
        startTime: mediaData.startTime || '00:00:00',
        duration: mediaData.duration || '00:05:00',
        location: mediaData.location || mediaData.clip,
        note: mediaData.note || '',
        inPoint: mediaData.inPoint || '00:00:00',
        outPoint: mediaData.outPoint || '',
        notificationSent: false,
        errorCount: 0,
        lastError: null,
        lastPlayTime: null
      };

      // Crea il nuovo elemento
      const { data, error } = await supabase
        .from('rundown_items')
        .insert([
          {
            rundown_id: activeRundownId,
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
      setRundownItems(items => [...items, newItem]);
      setModified(true);

      // CORREZIONE: Verifica che l'elemento sia stato effettivamente inserito nel database
      console.log('✅ [ADD_MEDIA_ITEM] Elemento MEDIA inserito con successo nel database:', {
        id: newItem.id,
        rundown_id: newItem.rundown_id,
        type: newItem.type,
        name: newItem.name
      });

      // Verifica aggiuntiva: query diretta per confermare inserimento
      try {
        const { data: verifyData, error: verifyError } = await supabase
          .from('rundown_items')
          .select('id, name, type')
          .eq('id', newItem.id)
          .single();

        if (verifyError || !verifyData) {
          console.error('❌ [ADD_MEDIA_ITEM] ERRORE: Elemento non trovato nel database dopo inserimento:', verifyError);
          throw new Error('Elemento inserito ma non trovato nel database - possibile problema di sincronizzazione');
        }

        console.log('✅ [ADD_MEDIA_ITEM] Verifica database completata - elemento confermato:', verifyData);
      } catch (verifyError) {
        console.error('❌ [ADD_MEDIA_ITEM] Errore verifica database:', verifyError);
        // Non lanciare errore qui per non bloccare il flusso, ma logga il problema
      }

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
   * Aggiunge un elemento template al rundown
   *
   * @param {Object} templateData - Dati del template
   * @returns {Promise<Object>} - Elemento aggiunto
   */
  const addTemplateItem = async (templateData) => {
    try {
      // Verifica i permessi
      if (!canUserEditRundown(userRoleForRundown)) {
        setError('Non hai i permessi per modificare questo rundown');
        return null;
      }

      setLoading(true);
      setError(null);

      // Calcola l'ordine del nuovo elemento
      const maxOrder = rundownItems.length > 0
        ? Math.max(...rundownItems.map(item => item.item_order))
        : -1;

      // Prepara i dati del template
      let data = {};
      if (typeof templateData.data === 'string') {
        try {
          data = JSON.parse(templateData.data);
        } catch (error) {
          data = { text: templateData.data };
        }
      } else if (typeof templateData.data === 'object') {
        data = templateData.data;
      }

      // Prepara i dati JSONB seguendo la struttura del rundown esistente
      const jsonbData = {
        template: templateData.template,
        channel: templateData.channel || 1,
        layer: templateData.layer || 20,
        cgLayer: templateData.cgLayer || 1,
        playOnLoad: templateData.playOnLoad !== undefined ? templateData.playOnLoad : true,
        data,
        customName: templateData.customName || '',
        startTime: templateData.startTime || '00:00:00',
        duration: templateData.duration || '00:01:00',
        location: templateData.location || templateData.template,
        note: templateData.note || '',
        inPoint: templateData.inPoint || '00:00:00',
        outPoint: templateData.outPoint || '',
        notificationSent: false,
        errorCount: 0,
        lastError: null,
        lastPlayTime: null
      };

      // Crea il nuovo elemento
      const { data: insertData, error } = await supabase
        .from('rundown_items')
        .insert([
          {
            rundown_id: activeRundownId,
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
      const eventId = `INSERT-${insertData[0].id}-${Date.now()}`;

      // Imposta l'ID dell'ultimo evento gestito
      lastHandledEventRef.current = eventId;

      // Aggiorna lo stato locale
      const newItem = insertData[0];
      setRundownItems(items => [...items, newItem]);
      setModified(true);

      // CORREZIONE: Verifica che l'elemento sia stato effettivamente inserito nel database
      console.log('✅ [ADD_TEMPLATE_ITEM] Elemento TEMPLATE inserito con successo nel database:', {
        id: newItem.id,
        rundown_id: newItem.rundown_id,
        type: newItem.type,
        name: newItem.name
      });

      // Verifica aggiuntiva: query diretta per confermare inserimento
      try {
        const { data: verifyData, error: verifyError } = await supabase
          .from('rundown_items')
          .select('id, name, type')
          .eq('id', newItem.id)
          .single();

        if (verifyError || !verifyData) {
          console.error('❌ [ADD_TEMPLATE_ITEM] ERRORE: Elemento non trovato nel database dopo inserimento:', verifyError);
          throw new Error('Elemento inserito ma non trovato nel database - possibile problema di sincronizzazione');
        }

        console.log('✅ [ADD_TEMPLATE_ITEM] Verifica database completata - elemento confermato:', verifyData);
      } catch (verifyError) {
        console.error('❌ [ADD_TEMPLATE_ITEM] Errore verifica database:', verifyError);
        // Non lanciare errore qui per non bloccare il flusso, ma logga il problema
      }

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
   * Aggiunge un elemento story al rundown
   *
   * @param {Object} storyData - Dati della storia
   * @returns {Promise<Object>} - Elemento aggiunto
   */
  const addStoryItem = async (storyData) => {
    try {
      console.log('🔄 [ADD_STORY_ITEM] Inizio aggiunta elemento STORY:', {
        activeRundownId,
        externalRundownId,
        urlRundownId,
        currentUserId,
        userRoleForRundown,
        storyName: storyData.customName || storyData.name
      });

      // CORREZIONE CRITICA: Debug dettagliato per activeRundownId
      if (!activeRundownId) {
        console.error('❌ [ADD_STORY_ITEM] DEBUG activeRundownId:', {
          activeRundownId,
          externalRundownId,
          urlRundownId,
          source: externalRundownId ? 'external' : 'url',
          bothNull: !externalRundownId && !urlRundownId
        });
      }

      // Verifica i permessi
      if (!canUserEditRundown(userRoleForRundown)) {
        const errorMsg = `Non hai i permessi per modificare questo rundown. Ruolo corrente: ${userRoleForRundown}`;
        console.error('❌ [ADD_STORY_ITEM] Permessi insufficienti:', errorMsg);
        setError(errorMsg);
        return null;
      }

      // Verifica che ci sia un rundown attivo
      if (!activeRundownId) {
        const errorMsg = 'Nessun rundown attivo per aggiungere elementi STORY';
        console.error('❌ [ADD_STORY_ITEM] Rundown mancante:', errorMsg);
        setError(errorMsg);
        return null;
      }

      // Verifica che ci sia un utente autenticato
      if (!currentUserId) {
        const errorMsg = 'Utente non autenticato - impossibile aggiungere elementi';
        console.error('❌ [ADD_STORY_ITEM] Utente non autenticato:', errorMsg);
        setError(errorMsg);
        return null;
      }

      setLoading(true);
      setError(null);

      // Calcola l'ordine del nuovo elemento
      const maxOrder = rundownItems.length > 0
        ? Math.max(...rundownItems.map(item => item.item_order))
        : -1;

      // Prepara i dati JSONB seguendo la struttura del rundown esistente
      const jsonbData = {
        customName: storyData.customName || storyData.name || '',
        originalName: storyData.name || '',
        content: storyData.content || '',
        channel: storyData.channel || 1,
        layer: storyData.layer || 10,
        startTime: storyData.startTime || '00:00:00',
        duration: storyData.duration || '00:00:10',
        location: storyData.location || `CH${storyData.channel || 1}-L${storyData.layer || 10}`,
        notes: storyData.notes || '',
        // Mantieni tutti i dettagli originali della storia
        mediaDetails: storyData.mediaDetails || null,
        templateDetails: storyData.templateDetails || null,
        templatesDetails: storyData.templatesDetails || null,
        // Configurazione CasparCG
        casparcgConfig: {
          channel: storyData.channel || 1,
          layer: storyData.layer || 10
        },
        // Timing
        timing: {
          startTime: storyData.startTime || '00:00:00',
          duration: storyData.duration || '00:00:10',
          inPoint: '00:00:00:00',
          outPoint: '00:00:00:00'
        },
        // Dati completi per compatibilità
        ...(storyData.data || {}),
        // Metadati
        notificationSent: false,
        errorCount: 0,
        lastError: null,
        lastPlayTime: null
      };

      // Prepara i dati per l'inserimento
      const insertData = {
        rundown_id: activeRundownId,
        item_order: maxOrder + 1,
        type: 'STORY',
        name: storyData.customName || storyData.name || 'Storia Sconosciuta',
        data: jsonbData,
        updated_by: currentUserId
      };

      console.log('📝 [ADD_STORY_ITEM] Dati per inserimento Supabase:', {
        rundown_id: insertData.rundown_id,
        item_order: insertData.item_order,
        type: insertData.type,
        name: insertData.name,
        updated_by: insertData.updated_by,
        dataKeys: Object.keys(insertData.data)
      });

      // Crea il nuovo elemento
      const { data, error } = await supabase
        .from('rundown_items')
        .insert([insertData])
        .select();

      if (error) {
        console.error('❌ [ADD_STORY_ITEM] Errore Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Gestione specifica errori RLS
        if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error(`Errore permessi RLS: ${error.message}. Verifica che l'utente abbia accesso al rundown ${activeRundownId}`);
        }

        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Nessun dato restituito da Supabase dopo inserimento');
      }

      // Genera un ID univoco per l'evento
      const eventId = `INSERT-${data[0].id}-${Date.now()}`;

      // Imposta l'ID dell'ultimo evento gestito
      lastHandledEventRef.current = eventId;

      // Aggiorna lo stato locale
      const newItem = data[0];
      setRundownItems(items => [...items, newItem]);
      setModified(true);

      console.log('✅ [ADD_STORY_ITEM] Elemento STORY aggiunto con successo:', {
        id: newItem.id,
        name: newItem.name,
        type: newItem.type,
        rundown_id: newItem.rundown_id
      });

      // CORREZIONE: Verifica che l'elemento sia stato effettivamente inserito nel database
      try {
        const { data: verifyData, error: verifyError } = await supabase
          .from('rundown_items')
          .select('id, name, type')
          .eq('id', newItem.id)
          .single();

        if (verifyError || !verifyData) {
          console.error('❌ [ADD_STORY_ITEM] ERRORE: Elemento non trovato nel database dopo inserimento:', verifyError);
          throw new Error('Elemento inserito ma non trovato nel database - possibile problema di sincronizzazione');
        }

        console.log('✅ [ADD_STORY_ITEM] Verifica database completata - elemento confermato:', verifyData);
      } catch (verifyError) {
        console.error('❌ [ADD_STORY_ITEM] Errore verifica database:', verifyError);
        // Non lanciare errore qui per non bloccare il flusso, ma logga il problema
      }

      return newItem;
    } catch (error) {
      console.error('Errore nell\'aggiunta della storia:', error.message);
      setError('Errore nell\'aggiunta della storia: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    rundownItems,
    rundownName,
    loading,
    error,
    modified,
    selectedItemIndex,
    dragOverIndex,
    userRoleForRundown,
    editingStatusByItemId,
    activeRundownId,
    setRundownName: updateRundownName,
    setSelectedItemIndex,
    addMediaItem,
    addTemplateItem,
    addStoryItem,
    startEditingItem,
    stopEditingItem,
    loadRundownData
  };
};

export default useRundownItems;
