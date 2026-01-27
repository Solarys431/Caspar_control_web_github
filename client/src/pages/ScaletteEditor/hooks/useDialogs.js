import { useState } from 'react';

/**
 * Hook per gestire i dialoghi dell'editor di scalette
 *
 * @returns {Object} - Funzioni e stati per gestire i dialoghi
 */
const useDialogs = () => {
  // Stati per i dialoghi
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);
  const [isDialogForStory, setIsDialogForStory] = useState(false);
  const [templateIndex, setTemplateIndex] = useState(null);

  // Funzione per aprire il dialogo di selezione media
  const openMediaDialog = (forStory = false) => {
    setIsDialogForStory(forStory);
    setMediaDialogOpen(true);
  };

  // Funzione per chiudere il dialogo di selezione media
  const closeMediaDialog = () => {
    setMediaDialogOpen(false);
    setIsDialogForStory(false);
  };

  // Funzione per aprire il dialogo di selezione template
  const openTemplateDialog = (forStory = false, index = null) => {
    setIsDialogForStory(forStory);
    setTemplateIndex(index);
    setTemplateDialogOpen(true);
  };

  // Funzione per chiudere il dialogo di selezione template
  const closeTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setIsDialogForStory(false);
    setTemplateIndex(null);
  };

  // Funzione per aprire il dialogo di modifica
  const openEditDialog = (item) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  // Funzione per chiudere il dialogo di modifica
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingItem(null);
  };

  // Funzione per impostare un messaggio di errore
  const setErrorMessage = (message) => {
    setError(message);
    // Opzionale: pulisci automaticamente il messaggio dopo un certo tempo
    if (message) {
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Funzione per pulire il messaggio di errore
  const clearError = () => {
    setError(null);
  };

  return {
    mediaDialogOpen,
    templateDialogOpen,
    editDialogOpen,
    editingItem,
    error,
    isDialogForStory,
    templateIndex,
    openMediaDialog,
    closeMediaDialog,
    openTemplateDialog,
    closeTemplateDialog,
    openEditDialog,
    closeEditDialog,
    setEditingItem,
    setErrorMessage,
    clearError
  };
};

export default useDialogs;
