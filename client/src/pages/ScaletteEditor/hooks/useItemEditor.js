/**
 * Hook per gestire la modifica degli elementi della scaletta
 * Centralizza la logica comune tra EditItemDialog e ItemEditPanel
 */
import { useState, useEffect, useRef } from 'react';

/**
 * Hook per gestire la modifica degli elementi della scaletta
 *
 * @param {Object} item - Elemento da modificare
 * @param {Function} onSave - Funzione per salvare le modifiche
 * @param {Function} startEditingItem - Funzione per iniziare la modifica
 * @param {Function} stopEditingItem - Funzione per terminare la modifica
 * @param {string} userRole - Ruolo dell'utente per la scaletta corrente
 * @returns {Object} - Funzioni e stati per gestire la modifica
 */
const useItemEditor = ({
  item,
  onSave,
  startEditingItem,
  stopEditingItem,
  userRole = ''
}) => {
  // Stati per la gestione dei conflitti
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalVersion, setOriginalVersion] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  // Stato locale per memorizzare l'item corrente
  const [localItem, setLocalItem] = useState(null);

  // Riferimenti per lo stato di editing
  const editingStartedRef = useRef(false);
  const editingItemIdRef = useRef(null);

  // Verifica se l'utente può modificare la scaletta
  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Aggiorna lo stato locale quando l'item cambia
  useEffect(() => {
    if (item) {
      console.log(`[EDITOR] Item aggiornato:`, {
        id: item.id,
        version: item.version,
        type: item.type
      });

      // Crea una copia profonda dell'item per evitare modifiche indesiderate all'oggetto originale
      const deepCopy = JSON.parse(JSON.stringify(item));

      // Inizializza il campo data se non esiste
      if (!deepCopy.data) {
        deepCopy.data = {};
      }

      // Assicurati che i campi necessari esistano
      if (deepCopy.type === 'STORY') {
        // Inizializza templatesDetails se non esiste
        if (!deepCopy.data.templatesDetails) {
          deepCopy.data.templatesDetails = [];
        }
      }

      // Inizializza l'item locale
      setLocalItem(deepCopy);
    }
  }, [item]);

  // Gestione del salvataggio
  const handleSave = async (closeAfterSave = false) => {
    if (!canEdit || !localItem) {
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[EDITOR] Tentativo di salvare le modifiche per item ${localItem.id}`);

      const result = await onSave(localItem, originalVersion);

      if (result && result.conflict) {
        console.log(`[EDITOR] Rilevato conflitto durante il salvataggio:`, result);
        setConflictData(result);
        setLoading(false);
        return { success: false, conflict: true };
      }

      console.log(`[EDITOR] Salvataggio completato con successo:`, result);

      // Resettiamo lo stato di editing
      editingStartedRef.current = false;

      // Aggiorniamo la versione originale
      if (result && result.data) {
        setOriginalVersion(result.data.version);
        setLocalItem(result.data);
      }

      // Riavviamo l'editing con la nuova versione se non stiamo chiudendo
      if (!closeAfterSave && localItem.id) {
        await startEditingItem(localItem.id);
        editingStartedRef.current = true;
      }

      return { success: true, data: result?.data };
    } catch (error) {
      console.error('[EDITOR] Errore durante il salvataggio:', error);
      setError('Errore durante il salvataggio: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Gestione del salvataggio e chiusura
  const handleSaveAndClose = async () => {
    const result = await handleSave(true);
    return result;
  };

  // Inizia la modifica dell'elemento
  const startEditing = async () => {
    // Verifica che localItem, localItem.id e startEditingItem siano definiti
    if (!localItem) {
      console.log(`[EDITOR] Impossibile iniziare la modifica: localItem non definito`);
      return false;
    }

    if (!localItem.id) {
      console.log(`[EDITOR] Impossibile iniziare la modifica: localItem.id non definito`);
      return false;
    }

    if (typeof startEditingItem !== 'function') {
      console.log(`[EDITOR] Impossibile iniziare la modifica: startEditingItem non è una funzione`);
      return false;
    }

    // Log dettagliato per debug
    console.log(`[EDITOR] Verifica condizioni per iniziare la modifica:`, {
      hasLocalItem: !!localItem,
      itemId: localItem.id,
      hasStartEditingItem: typeof startEditingItem === 'function',
      editingStarted: editingStartedRef.current,
      currentEditingItemId: editingItemIdRef.current
    });

    // Se la modifica è già iniziata per questo item, non fare nulla
    if (editingStartedRef.current && editingItemIdRef.current === localItem.id) {
      console.log(`[EDITOR] Modifica già iniziata per item ${localItem.id}, ignoro`);
      return true;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[EDITOR] Inizializzazione modifica per item ${localItem.id}`);
      setOriginalVersion(localItem.version);
      editingItemIdRef.current = localItem.id;

      // Chiamata alla funzione startEditingItem con gestione degli errori
      try {
        const success = await startEditingItem(localItem.id);

        if (success) {
          editingStartedRef.current = true;
          console.log(`[EDITOR] Modifica iniziata con successo per item ${localItem.id}`);
          return true;
        } else {
          setError('Non è possibile modificare questo elemento al momento.');
          console.error(`[EDITOR] Impossibile iniziare la modifica per item ${localItem.id}`);
          return false;
        }
      } catch (callError) {
        console.error('[EDITOR] Errore nella chiamata a startEditingItem:', callError);
        setError('Errore nella chiamata a startEditingItem: ' + (callError.message || 'Errore sconosciuto'));
        return false;
      }
    } catch (error) {
      console.error('[EDITOR] Errore nell\'iniziare la modifica dell\'elemento:', error);
      setError('Errore nell\'iniziare la modifica dell\'elemento: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Termina la modifica dell'elemento
  const stopEditing = async () => {
    if (stopEditingItem && editingStartedRef.current) {
      console.log(`[EDITOR] Terminazione modifica per item ${editingItemIdRef.current || 'sconosciuto'}`);

      try {
        await stopEditingItem();
        console.log('[EDITOR] Modifica terminata con successo');
        editingStartedRef.current = false;
        editingItemIdRef.current = null;
        return true;
      } catch (error) {
        console.error('[EDITOR] Errore nel terminare la modifica dell\'elemento:', error);
        editingStartedRef.current = false;
        editingItemIdRef.current = null;
        return false;
      }
    }
    return true;
  };

  return {
    localItem,
    setLocalItem,
    loading,
    error,
    setError,
    conflictData,
    setConflictData,
    originalVersion,
    setOriginalVersion,
    canEdit,
    handleSave,
    handleSaveAndClose,
    startEditing,
    stopEditing,
    editingStarted: editingStartedRef.current
  };
};

export default useItemEditor;
