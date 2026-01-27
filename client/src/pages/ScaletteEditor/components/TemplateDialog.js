import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import TemplateSelector from '../../../components/scalette/TemplateSelector';

/**
 * Componente per il dialogo di selezione template
 *
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il dialogo è aperto
 * @param {Function} props.onClose - Funzione per chiudere il dialogo
 * @param {Function} props.onSelectTemplate - Funzione per selezionare un template
 * @param {Function} props.onAddTemplate - Funzione per aggiungere un template alla scaletta
 * @param {Function} props.onConfirmForStory - Funzione chiamata quando si conferma un template per una storia
 * @param {string|null} props.selectedTemplate - Template selezionato
 * @param {boolean} props.isUpdate - Se si sta aggiornando un template esistente
 * @param {boolean} props.isForStory - Se il template è selezionato per una storia
 * @param {number|null} props.templateIndex - Indice del template nella lista dei template di una storia
 * @returns {JSX.Element} - Componente React
 */
const TemplateDialog = ({
  open,
  onClose,
  onSelectTemplate,
  onAddTemplate,
  onConfirmForStory,
  selectedTemplate,
  isUpdate = false,
  isForStory = false,
  templateIndex = null
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>{isUpdate ? 'Aggiorna Template' : 'Seleziona Template'}</DialogTitle>
      <DialogContent dividers>
        <TemplateSelector onSelectTemplate={(template) => {
          console.log(`[TEMPLATE_DIALOG] Template selezionato: ${typeof template === 'string' ? template : template.path}`);
          if (typeof onSelectTemplate === 'function') {
            onSelectTemplate(template);
          }
        }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (selectedTemplate) {
              if (isForStory && onConfirmForStory) {
                console.log(`[TEMPLATE_DIALOG] Confermando template per storia: ${typeof selectedTemplate === 'string' ? selectedTemplate : selectedTemplate.path}`);
                onConfirmForStory(templateIndex);
              } else {
                onAddTemplate();
              }
              onClose();
            }
          }}
          color="primary"
        >
          {isUpdate
            ? 'Aggiorna Template'
            : isForStory
              ? 'Conferma'
              : 'Aggiungi alla Scaletta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateDialog;
