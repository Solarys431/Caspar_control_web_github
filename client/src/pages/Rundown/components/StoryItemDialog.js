import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Grid,
  Chip,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Movie as MovieIcon,
  Brush as BrushIcon,
  Article as ArticleIcon,
  Schedule as ScheduleIcon,
  Source as SourceIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Import delle funzioni helper dal RundownList
import {
  formatTemplateName,
  formatTemplateDisplay,
  generateTemplateTooltip,
  detectTemplateConflicts
} from './RundownList';

/**
 * Dialog dettagliato per la visualizzazione e modifica degli elementi STORY importati
 * dall'editor scalette con supporto completo per elementi complessi (media + template multipli)
 */
const StoryItemDialog = ({ 
  open, 
  onClose, 
  item, 
  onSave, 
  onDelete,
  connected 
}) => {
  // Stati per la gestione del form
  const [editedItem, setEditedItem] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    media: true,
    templates: true,
    timing: false,
    origin: false,
    preview: false
  });

  // Inizializza l'item editato quando si apre il dialog
  useEffect(() => {
    if (item && open) {
      setEditedItem(JSON.parse(JSON.stringify(item))); // Deep clone
      setHasChanges(false);
    }
  }, [item, open]);

  // Verifica se l'item è un elemento STORY complesso
  const isStoryItem = item?.type === 'STORY';
  const hasMedia = isStoryItem && item?.data?.mediaDetails?.clipPath;
  const hasTemplates = isStoryItem && (
    (item?.data?.templateDetails?.templateFile) ||
    (item?.data?.templatesDetails?.length > 0)
  );
  const hasMultipleTemplates = isStoryItem && item?.data?.templatesDetails?.length > 1;
  const isImported = isStoryItem && item?.data?.sourceInfo;

  // Rileva conflitti nei template
  const templateConflicts = hasMultipleTemplates ? 
    detectTemplateConflicts(item?.data?.templatesDetails) : [];

  // Gestione dell'espansione delle sezioni
  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Gestione delle modifiche ai campi
  const handleFieldChange = (path, value) => {
    if (!editedItem) return;

    const newItem = { ...editedItem };
    const pathArray = path.split('.');
    let current = newItem;

    // Naviga fino al penultimo livello
    for (let i = 0; i < pathArray.length - 1; i++) {
      if (!current[pathArray[i]]) {
        current[pathArray[i]] = {};
      }
      current = current[pathArray[i]];
    }

    // Imposta il valore finale
    current[pathArray[pathArray.length - 1]] = value;

    setEditedItem(newItem);
    setHasChanges(true);
  };

  // Gestione del salvataggio
  const handleSave = () => {
    if (editedItem && onSave) {
      onSave(editedItem);
      setHasChanges(false);
      onClose();
    }
  };

  // Gestione dell'eliminazione
  const handleDelete = () => {
    if (onDelete && item) {
      onDelete(item.id);
      onClose();
    }
  };

  // Gestione della chiusura con conferma se ci sono modifiche
  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('Ci sono modifiche non salvate. Vuoi davvero chiudere?')) {
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!item || !isStoryItem) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <ArticleIcon color="primary" />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">
            Dettagli Elemento STORY
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.data?.customName || item.name}
          </Typography>
        </Box>
        {isImported && (
          <Chip
            icon={<SourceIcon fontSize="small" />}
            label="IMPORTATO"
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
        {templateConflicts.length > 0 && (
          <Chip
            icon={<WarningIcon fontSize="small" />}
            label="CONFLITTI"
            color="error"
            variant="outlined"
            size="small"
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Alert per conflitti template */}
        {templateConflicts.length > 0 && (
          <Alert severity="warning" sx={{ m: 2, mb: 0 }}>
            <Typography variant="body2" fontWeight="bold">
              Conflitti rilevati nei template:
            </Typography>
            {templateConflicts.map((conflict, index) => (
              <Typography key={index} variant="caption" display="block">
                • {conflict.message}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Sezione Media */}
        {hasMedia && (
          <Accordion 
            expanded={expandedSections.media}
            onChange={() => handleSectionToggle('media')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MovieIcon color="success" />
                <Typography variant="h6">Media</Typography>
                <Chip 
                  label={formatTemplateName(item.data.mediaDetails.clipPath)} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Percorso File Media"
                    value={editedItem?.data?.mediaDetails?.clipPath || ''}
                    onChange={(e) => handleFieldChange('data.mediaDetails.clipPath', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Punto IN"
                    value={editedItem?.data?.inPoint || '00:00:00:00'}
                    onChange={(e) => handleFieldChange('data.inPoint', e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="00:00:00:00"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Punto OUT"
                    value={editedItem?.data?.outPoint || ''}
                    onChange={(e) => handleFieldChange('data.outPoint', e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="00:00:05:00"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Durata"
                    value={editedItem?.data?.duration || '00:05:00'}
                    onChange={(e) => handleFieldChange('data.duration', e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="00:05:00"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedItem?.data?.loop || false}
                        onChange={(e) => handleFieldChange('data.loop', e.target.checked)}
                      />
                    }
                    label="Loop"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Sezione Template */}
        {hasTemplates && (
          <Accordion 
            expanded={expandedSections.templates}
            onChange={() => handleSectionToggle('templates')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BrushIcon color="primary" />
                <Typography variant="h6">Template</Typography>
                <Chip 
                  label={hasMultipleTemplates ? `${item.data.templatesDetails.length} template` : '1 template'} 
                  size="small" 
                  variant="outlined" 
                />
                {templateConflicts.length > 0 && (
                  <Chip 
                    icon={<WarningIcon fontSize="small" />}
                    label={`${templateConflicts.length} conflitti`}
                    size="small" 
                    color="error"
                    variant="outlined" 
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Lista template */}
                {(item.data.templatesDetails || [item.data.templateDetails]).filter(Boolean).map((template, index) => (
                  <Paper key={index} sx={{ p: 2, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Template {index + 1}: {formatTemplateName(template.templateFile)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {hasMultipleTemplates && (
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="File Template"
                          value={template.templateFile || ''}
                          variant="outlined"
                          size="small"
                          disabled
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Canale"
                          value={template.casparcgConfig?.channel || 1}
                          variant="outlined"
                          size="small"
                          type="number"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Layer"
                          value={template.casparcgConfig?.layer || 1}
                          variant="outlined"
                          size="small"
                          type="number"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="CG Layer"
                          value={template.casparcgConfig?.cgLayer || 10}
                          variant="outlined"
                          size="small"
                          type="number"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={template.casparcgConfig?.playOnLoad !== false}
                              size="small"
                            />
                          }
                          label="Play on Load"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={template.timing?.autoStart !== false}
                              size="small"
                            />
                          }
                          label="Auto Start"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                
                {/* Pulsante aggiungi template */}
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  color="primary"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Aggiungi Template
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Sezione Timing */}
        <Accordion 
          expanded={expandedSections.timing}
          onChange={() => handleSectionToggle('timing')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon color="info" />
              <Typography variant="h6">Timing e Configurazione</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Nome Personalizzato"
                  value={editedItem?.data?.customName || editedItem?.name || ''}
                  onChange={(e) => handleFieldChange('data.customName', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Orario di Inizio"
                  value={editedItem?.data?.startTime || '00:00:00'}
                  onChange={(e) => handleFieldChange('data.startTime', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="00:00:00"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note"
                  value={editedItem?.data?.notes || ''}
                  onChange={(e) => handleFieldChange('data.notes', e.target.value)}
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={editedItem?.data?.location || ''}
                  onChange={(e) => handleFieldChange('data.location', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Sezione Origine (solo per elementi importati) */}
        {isImported && (
          <Accordion 
            expanded={expandedSections.origin}
            onChange={() => handleSectionToggle('origin')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SourceIcon color="primary" />
                <Typography variant="h6">Informazioni di Origine</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Scaletta di Origine"
                    secondary={item.data.sourceInfo.sourceScalettaName}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Data di Origine"
                    secondary={format(new Date(item.data.sourceInfo.sourceDay), 'dd/MM/yyyy')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Importato il"
                    secondary={item.data.sourceInfo.importedAt ? 
                      format(new Date(item.data.sourceInfo.importedAt), 'dd/MM/yyyy HH:mm:ss') : 
                      'Data non disponibile'
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Sezione Anteprima */}
        <Accordion 
          expanded={expandedSections.preview}
          onChange={() => handleSectionToggle('preview')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PreviewIcon color="secondary" />
              <Typography variant="h6">Anteprima Configurazione</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="subtitle2" gutterBottom>
                Configurazione che andrà in onda:
              </Typography>
              <Divider sx={{ my: 1 }} />
              
              {hasMedia && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    📹 Media: {formatTemplateName(item.data.mediaDetails.clipPath)}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Durata: {item.data.duration || '00:05:00'} | 
                    IN: {item.data.inPoint || '00:00:00:00'} | 
                    OUT: {item.data.outPoint || 'Fine file'}
                  </Typography>
                </Box>
              )}
              
              {hasTemplates && (
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    🎨 Template ({hasMultipleTemplates ? item.data.templatesDetails.length : 1}):
                  </Typography>
                  {(item.data.templatesDetails || [item.data.templateDetails]).filter(Boolean).map((template, index) => (
                    <Typography key={index} variant="caption" display="block" color="text.secondary">
                      {index + 1}. {formatTemplateDisplay(template)}
                    </Typography>
                  ))}
                </Box>
              )}
            </Paper>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Button onClick={handleClose} color="inherit">
          Annulla
        </Button>
        <Button 
          onClick={handleDelete} 
          color="error" 
          variant="outlined"
          startIcon={<DeleteIcon />}
        >
          Elimina
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={!hasChanges}
          startIcon={<EditIcon />}
        >
          Salva Modifiche
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoryItemDialog;
