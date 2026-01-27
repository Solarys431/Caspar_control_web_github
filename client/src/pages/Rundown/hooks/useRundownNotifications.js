import { useState, useCallback } from 'react';

/**
 * Hook personalizzato per gestire le notifiche del rundown.
 * Gestisce l'apertura, la chiusura e il contenuto delle notifiche.
 */
const useRundownNotifications = () => {
  // Stato per le notifiche
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Mostra una notifica
  const showNotification = useCallback((message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // Chiudi la notifica
  const closeNotification = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  return {
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    setSnackbarMessage,
    snackbarSeverity,
    setSnackbarSeverity,
    showNotification,
    closeNotification
  };
};

export default useRundownNotifications;
