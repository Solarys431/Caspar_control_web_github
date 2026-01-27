import { useState } from 'react';

/**
 * Hook personalizzato per gestire i dialoghi del rundown.
 * Gestisce l'apertura, la chiusura e lo stato dei vari dialoghi.
 */
const useRundownDialogs = () => {
  // Stato per i dialoghi
  const [addMediaDialogOpen, setAddMediaDialogOpen] = useState(false);
  const [addTemplateDialogOpen, setAddTemplateDialogOpen] = useState(false);
  const [addMediaWithTemplateDialogOpen, setAddMediaWithTemplateDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [linkTemplateDialogOpen, setLinkTemplateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Stato per l'elemento selezionato
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Stato per il menu contestuale
  const [contextMenu, setContextMenu] = useState(null);
  const [itemMenuAnchorEl, setItemMenuAnchorEl] = useState(null);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null);

  // Gestione dell'apertura del menu contestuale
  const handleContextMenu = (event, item) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      item: item
    });
  };

  // Gestione della chiusura del menu contestuale
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // Gestione dell'apertura del menu dell'elemento
  const handleItemMenuOpen = (event, itemId) => {
    setItemMenuAnchorEl(event.currentTarget);
    setSelectedItemId(itemId);
  };

  // Gestione della chiusura del menu dell'elemento
  const handleItemMenuClose = () => {
    setItemMenuAnchorEl(null);
    setTimeout(() => {
      setSelectedItemId(null);
    }, 100);
  };

  // Gestione dell'apertura del menu di aggiunta
  const handleAddMenuOpen = (event) => {
    setAddMenuAnchorEl(event.currentTarget);
  };

  // Gestione della chiusura del menu di aggiunta
  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };

  // Apertura del dialog per aggiungere un media
  const handleAddMediaDialogOpen = () => {
    handleAddMenuClose();
    setAddMediaDialogOpen(true);
  };

  // Apertura del dialog per aggiungere un template
  const handleAddTemplateDialogOpen = () => {
    handleAddMenuClose();
    setAddTemplateDialogOpen(true);
  };

  // Apertura del dialog per aggiungere un media con template
  const handleAddMediaWithTemplateDialogOpen = () => {
    handleAddMenuClose();
    setAddMediaWithTemplateDialogOpen(true);
  };

  // Gestione dell'apertura del dialog di modifica dell'elemento
  const handleEditItemDialogOpen = (itemId) => {
    setSelectedItemId(itemId);
    setEditItemDialogOpen(true);
  };

  // Gestione dell'apertura del dialog di collegamento del template
  const handleLinkTemplateDialogOpen = (itemId) => {
    setSelectedItemId(itemId);
    setLinkTemplateDialogOpen(true);
  };

  return {
    // Stato dei dialoghi
    addMediaDialogOpen,
    setAddMediaDialogOpen,
    addTemplateDialogOpen,
    setAddTemplateDialogOpen,
    addMediaWithTemplateDialogOpen,
    setAddMediaWithTemplateDialogOpen,
    editItemDialogOpen,
    setEditItemDialogOpen,
    linkTemplateDialogOpen,
    setLinkTemplateDialogOpen,
    settingsDialogOpen,
    setSettingsDialogOpen,

    // Stato dell'elemento selezionato
    selectedItemId,
    setSelectedItemId,

    // Stato del menu contestuale
    contextMenu,
    setContextMenu,
    itemMenuAnchorEl,
    setItemMenuAnchorEl,
    addMenuAnchorEl,
    setAddMenuAnchorEl,

    // Funzioni per gestire i menu
    handleContextMenu,
    handleContextMenuClose,
    handleItemMenuOpen,
    handleItemMenuClose,
    handleAddMenuOpen,
    handleAddMenuClose,

    // Funzioni per gestire i dialoghi
    handleAddMediaDialogOpen,
    handleAddTemplateDialogOpen,
    handleAddMediaWithTemplateDialogOpen,
    handleEditItemDialogOpen,
    handleLinkTemplateDialogOpen
  };
};

export default useRundownDialogs;
