import React, { useState, useEffect } from 'react';
import {
  Box,
  // Paper non viene utilizzato, lo rimuoviamo
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  // CircularProgress non viene utilizzato, lo rimuoviamo
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  // Refresh non viene utilizzato, lo rimuoviamo
  PlayArrow as PlayIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { useCaspar } from '../../contexts/CasparContext';

// Funzione per determinare i campi di un template in base al nome
const getTemplateFields = (templateName) => {
  if (!templateName) return [];

  const name = templateName.toLowerCase();

  if (name.includes('ticker')) {
    return [
      { name: 'text', label: 'Testo', type: 'text', defaultValue: 'Testo del ticker' }
    ];
  } else if (name.includes('lower') && name.includes('third')) {
    return [
      { name: 'title', label: 'Titolo', type: 'text', defaultValue: 'Titolo' },
      { name: 'subtitle', label: 'Sottotitolo', type: 'text', defaultValue: 'Sottotitolo' }
    ];
  } else if (name.includes('logo')) {
    return [
      { name: 'position', label: 'Posizione', type: 'select', options: ['topleft', 'topright', 'bottomleft', 'bottomright'], defaultValue: 'topright' }
    ];
  } else if (name.includes('text')) {
    return [
      { name: 'text', label: 'Testo', type: 'text', defaultValue: 'Testo semplice' }
    ];
  }

  // Template generico
  return [
    { name: 'text', label: 'Testo', type: 'text', defaultValue: 'Testo generico' }
  ];
};

// Componente per la modifica dei template
const TemplateEditor = ({ template, open, onClose, onSave }) => {
  const { connected, cgAdd, cgUpdate, cgStop } = useCaspar();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);

  // Carica i campi del template all'apertura del dialog
  useEffect(() => {
    if (open && template) {
      const templateFields = getTemplateFields(template);
      setFields(templateFields);

      // Inizializza i valori con i valori predefiniti
      const initialValues = {};
      templateFields.forEach(field => {
        initialValues[field.name] = field.defaultValue || '';
      });
      setValues(initialValues);
    }
  }, [open, template]);

  // Gestisce il cambio di valore di un campo
  const handleFieldChange = (fieldName, value) => {
    setValues({
      ...values,
      [fieldName]: value
    });
  };

  // Gestisce l'anteprima del template
  const handlePreview = async () => {
    if (!connected || !template) return;

    setLoading(true);
    setError(null);

    try {
      // Canale di preview
      const channel = 3;
      const layer = 2;
      const cgLayer = 1;

      if (!isPlaying) {
        // Aggiungi il template
        await cgAdd(channel, layer, cgLayer, template, true, values);
        setIsPlaying(true);
      } else {
        // Aggiorna il template
        await cgUpdate(channel, layer, cgLayer, values);
      }
    } catch (error) {
      console.error('Errore nell\'anteprima del template:', error);
      setError(`Errore nell'anteprima del template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gestisce l'arresto dell'anteprima
  const handleStopPreview = async () => {
    if (!connected || !template || !isPlaying) return;

    setLoading(true);
    setError(null);

    try {
      // Canale di preview
      const channel = 3;
      const layer = 2;
      const cgLayer = 1;

      // Ferma il template
      await cgStop(channel, layer, cgLayer);
      setIsPlaying(false);
    } catch (error) {
      console.error('Errore nell\'arresto dell\'anteprima del template:', error);
      setError(`Errore nell'arresto dell'anteprima del template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gestisce il salvataggio del template
  const handleSave = () => {
    if (onSave) {
      onSave({
        template,
        data: values
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Modifica Template: {typeof template === 'string' ? template : (template?.name || template?.path || 'Template sconosciuto')}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {fields.map((field) => (
            <Grid item xs={12} key={field.name}>
              <TextField
                label={field.label}
                value={values[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                fullWidth
                multiline={field.type === 'textarea'}
                rows={field.type === 'textarea' ? 4 : 1}
                select={field.type === 'select'}
                SelectProps={{
                  native: true
                }}
              >
                {field.type === 'select' && field.options && field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </TextField>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Box>
            <Tooltip title={isPlaying ? 'Aggiorna anteprima' : 'Mostra anteprima'}>
              <Button
                onClick={handlePreview}
                startIcon={<PlayIcon />}
                disabled={loading || !connected}
                color="primary"
              >
                {isPlaying ? 'Aggiorna' : 'Anteprima'}
              </Button>
            </Tooltip>

            {isPlaying && (
              <Tooltip title="Ferma anteprima">
                <Button
                  onClick={handleStopPreview}
                  startIcon={<StopIcon />}
                  disabled={loading || !connected}
                  color="error"
                  sx={{ ml: 1 }}
                >
                  Ferma
                </Button>
              </Tooltip>
            )}
          </Box>

          <Box>
            <Button onClick={onClose} color="inherit">
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              startIcon={<SaveIcon />}
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ ml: 1 }}
            >
              Salva
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateEditor;
