/**
 * Hook per gestire la selezione multipla di elementi nella scaletta
 * Supporta selezione individuale, selezione multipla e operazioni batch
 */
import { useState, useCallback, useMemo } from 'react';

/**
 * Hook personalizzato per la gestione della selezione multipla
 * 
 * @param {Array} items - Array degli elementi disponibili per la selezione
 * @param {Object} options - Opzioni di configurazione
 * @param {boolean} options.persistOnFilter - Se mantenere la selezione durante i filtri
 * @param {Function} options.onSelectionChange - Callback chiamato quando cambia la selezione
 * @returns {Object} - Oggetto con stati e funzioni per la gestione della selezione
 */
const useMultiSelection = (items = [], options = {}) => {
  const {
    persistOnFilter = true,
    onSelectionChange
  } = options;

  // Set degli ID degli elementi selezionati
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  // Stato per "Seleziona Tutti"
  const [selectAllState, setSelectAllState] = useState('none'); // 'none' | 'partial' | 'all'

  /**
   * Calcola lo stato di "Seleziona Tutti" basato sulla selezione corrente
   */
  const calculateSelectAllState = useCallback((selectedIds, availableItems) => {
    if (selectedIds.size === 0) return 'none';
    
    const availableIds = availableItems.map(item => item.id);
    const selectedAvailableCount = availableIds.filter(id => selectedIds.has(id)).length;
    
    if (selectedAvailableCount === 0) return 'none';
    if (selectedAvailableCount === availableIds.length) return 'all';
    return 'partial';
  }, []);

  /**
   * Aggiorna lo stato "Seleziona Tutti" quando cambiano items o selezione
   */
  const updateSelectAllState = useCallback(() => {
    const newState = calculateSelectAllState(selectedItemIds, items);
    setSelectAllState(newState);
  }, [selectedItemIds, items, calculateSelectAllState]);

  // Aggiorna lo stato quando cambiano items o selezione
  useMemo(() => {
    updateSelectAllState();
  }, [updateSelectAllState]);

  /**
   * Seleziona/deseleziona un singolo elemento
   * 
   * @param {string} itemId - ID dell'elemento da selezionare/deselezionare
   * @param {boolean} selected - Se selezionare (true) o deselezionare (false)
   */
  const toggleItemSelection = useCallback((itemId, selected = null) => {
    setSelectedItemIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      
      if (selected === null) {
        // Toggle automatico
        if (newSelected.has(itemId)) {
          newSelected.delete(itemId);
        } else {
          newSelected.add(itemId);
        }
      } else if (selected) {
        newSelected.add(itemId);
      } else {
        newSelected.delete(itemId);
      }

      // Callback per notificare il cambiamento
      if (onSelectionChange) {
        const selectedItems = items.filter(item => newSelected.has(item.id));
        onSelectionChange(selectedItems, Array.from(newSelected));
      }

      return newSelected;
    });
  }, [items, onSelectionChange]);

  /**
   * Seleziona/deseleziona tutti gli elementi visibili
   * 
   * @param {boolean} selectAll - Se selezionare tutti (true) o deselezionare tutti (false)
   */
  const toggleSelectAll = useCallback((selectAll = null) => {
    setSelectedItemIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      const availableIds = items.map(item => item.id);

      if (selectAll === null) {
        // Determina automaticamente l'azione basata sullo stato corrente
        const currentState = calculateSelectAllState(prevSelected, items);
        selectAll = currentState !== 'all';
      }

      if (selectAll) {
        // Seleziona tutti gli elementi visibili
        availableIds.forEach(id => newSelected.add(id));
      } else {
        // Deseleziona tutti gli elementi visibili
        availableIds.forEach(id => newSelected.delete(id));
      }

      // Callback per notificare il cambiamento
      if (onSelectionChange) {
        const selectedItems = items.filter(item => newSelected.has(item.id));
        onSelectionChange(selectedItems, Array.from(newSelected));
      }

      return newSelected;
    });
  }, [items, calculateSelectAllState, onSelectionChange]);

  /**
   * Seleziona elementi per tipo
   * 
   * @param {string} itemType - Tipo di elementi da selezionare ('MEDIA', 'TEMPLATE', 'STORY')
   * @param {boolean} selected - Se selezionare o deselezionare
   */
  const selectByType = useCallback((itemType, selected = true) => {
    const typeItems = items.filter(item => item.type === itemType);
    typeItems.forEach(item => {
      toggleItemSelection(item.id, selected);
    });
  }, [items, toggleItemSelection]);

  /**
   * Seleziona elementi per range di indici
   * 
   * @param {number} startIndex - Indice di inizio (incluso)
   * @param {number} endIndex - Indice di fine (incluso)
   * @param {boolean} selected - Se selezionare o deselezionare
   */
  const selectByRange = useCallback((startIndex, endIndex, selected = true) => {
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    for (let i = start; i <= end && i < items.length; i++) {
      toggleItemSelection(items[i].id, selected);
    }
  }, [items, toggleItemSelection]);

  /**
   * Pulisce tutta la selezione
   */
  const clearSelection = useCallback(() => {
    setSelectedItemIds(new Set());
    
    if (onSelectionChange) {
      onSelectionChange([], []);
    }
  }, [onSelectionChange]);

  /**
   * Inverte la selezione corrente
   */
  const invertSelection = useCallback(() => {
    setSelectedItemIds(prevSelected => {
      const newSelected = new Set();
      items.forEach(item => {
        if (!prevSelected.has(item.id)) {
          newSelected.add(item.id);
        }
      });

      if (onSelectionChange) {
        const selectedItems = items.filter(item => newSelected.has(item.id));
        onSelectionChange(selectedItems, Array.from(newSelected));
      }

      return newSelected;
    });
  }, [items, onSelectionChange]);

  /**
   * Verifica se un elemento è selezionato
   * 
   * @param {string} itemId - ID dell'elemento da verificare
   * @returns {boolean} - True se l'elemento è selezionato
   */
  const isItemSelected = useCallback((itemId) => {
    return selectedItemIds.has(itemId);
  }, [selectedItemIds]);

  /**
   * Ottiene gli elementi attualmente selezionati
   * 
   * @returns {Array} - Array degli elementi selezionati
   */
  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedItemIds.has(item.id));
  }, [items, selectedItemIds]);

  /**
   * Ottiene le statistiche della selezione
   * 
   * @returns {Object} - Oggetto con statistiche della selezione
   */
  const getSelectionStats = useCallback(() => {
    const selectedItems = getSelectedItems();
    const stats = {
      total: selectedItems.length,
      byType: {
        MEDIA: selectedItems.filter(item => item.type === 'MEDIA').length,
        TEMPLATE: selectedItems.filter(item => item.type === 'TEMPLATE').length,
        STORY: selectedItems.filter(item => item.type === 'STORY').length
      },
      percentage: items.length > 0 ? Math.round((selectedItems.length / items.length) * 100) : 0
    };

    return stats;
  }, [getSelectedItems, items.length]);

  return {
    // Stati
    selectedItemIds: Array.from(selectedItemIds),
    selectedItemsSet: selectedItemIds,
    selectAllState,
    
    // Funzioni di selezione
    toggleItemSelection,
    toggleSelectAll,
    selectByType,
    selectByRange,
    clearSelection,
    invertSelection,
    
    // Funzioni di query
    isItemSelected,
    getSelectedItems,
    getSelectionStats,
    
    // Statistiche
    selectedCount: selectedItemIds.size,
    hasSelection: selectedItemIds.size > 0,
    isAllSelected: selectAllState === 'all',
    isPartiallySelected: selectAllState === 'partial'
  };
};

export default useMultiSelection;
