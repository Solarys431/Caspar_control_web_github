import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import MediaSelector from '../../../components/scalette/MediaSelector';

/**
 * Componente per il dialogo di selezione media
 *
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il dialogo è aperto
 * @param {Function} props.onClose - Funzione per chiudere il dialogo
 * @param {Function} props.onSelectMedia - Funzione per selezionare un media
 * @param {Function} props.onAddMedia - Funzione per aggiungere un media alla scaletta
 * @param {Function} props.onConfirmForStory - Funzione chiamata quando si conferma un media per una storia
 * @param {string|null} props.selectedMedia - Media selezionato
 * @param {boolean} props.isUpdate - Se si sta aggiornando un media esistente
 * @param {boolean} props.isForStory - Se il media è selezionato per una storia
 * @returns {JSX.Element} - Componente React
 */
const MediaDialog = ({
  open,
  onClose,
  onSelectMedia,
  onAddMedia,
  onConfirmForStory,
  selectedMedia,
  isUpdate = false,
  isForStory = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>{isUpdate ? 'Aggiorna Media' : 'Seleziona Media'}</DialogTitle>
      <DialogContent dividers>
        <MediaSelector onSelectMedia={onSelectMedia} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (selectedMedia) {
              if (isForStory && onConfirmForStory) {
                onConfirmForStory();
              } else {
                onAddMedia();
              }
              onClose();
            }
          }}
          disabled={!selectedMedia}
        >
          {isUpdate
            ? 'Aggiorna Media'
            : isForStory
              ? 'Conferma'
              : 'Aggiungi alla Scaletta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaDialog;
