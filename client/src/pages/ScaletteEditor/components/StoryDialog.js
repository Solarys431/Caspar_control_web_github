import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Tabs,
  Tab,
  Box,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import TemplateIcon from '@mui/icons-material/BrushOutlined';
import ArticleIcon from '@mui/icons-material/Article';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useCaspar } from '../../../contexts/CasparContext';
import TemplateDialog from './TemplateDialog';

/**
 * Componente per il dialogo di creazione di una nuova storia
 *
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il dialogo è aperto
 * @param {Function} props.onClose - Funzione per chiudere il dialogo
 * @param {Function} props.onAddStory - Funzione per aggiungere una nuova storia
 * @param {Function} props.onBrowseMedia - Funzione per aprire il selettore media
 * @param {Function} props.onBrowseTemplate - Funzione per aprire il selettore template
 * @param {Object} props.selectedMedia - Media selezionato
 * @param {Object} props.selectedTemplate - Template selezionato
 * @returns {JSX.Element} - Componente React
 */
const StoryDialog = ({
  open,
  onClose,
  onAddStory,
  onBrowseMedia,
  onBrowseTemplate,
  selectedMedia,
  selectedTemplate
}) => {
  // Accesso al context di CasparCG per fetchManifest
  const { fetchManifest } = useCaspar();

  // Stato per i dati della storia
  const [storyData, setStoryData] = useState({
    name: 'Nuova Storia',
    notes: '',
    content: '',
    includeMedia: false,
    includeTemplate: false,
    timing: {
      startTime: '00:00:00',
      duration: '00:01:00',
      inPoint: '00:00:00:00',
      outPoint: '00:01:00:00'
    },
    casparcgConfig: {
      channel: 1,
      layer: 10
    }
  });

  // Stato per la tab attiva
  const [activeTab, setActiveTab] = useState(0);

  // Stato per il caricamento
  const [loading, setLoading] = useState(false);

  // Stato per i template selezionati
  const [selectedTemplates, setSelectedTemplates] = useState([]);

  // Stato per le configurazioni dei template
  const [templateConfigs, setTemplateConfigs] = useState({});

  // Stato per i dati dei manifest dei template
  const [templateManifests, setTemplateManifests] = useState({});

  // Stato per i dati dei campi dei template
  const [templateFieldsData, setTemplateFieldsData] = useState({});

  // Stato per il dialogo dei template
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Stato locale per il template selezionato nel dialogo
  const [localSelectedTemplate, setLocalSelectedTemplate] = useState(null);

  // Aggiorniamo lo stato locale quando la prop cambia
  useEffect(() => {
    setLocalSelectedTemplate(selectedTemplate);
  }, [selectedTemplate]);

  // Funzione per aggiungere un template
  const handleAddTemplate = useCallback((template) => {
    // Ottieni il path del template (che useremo come chiave univoca)
    const templatePath = typeof template === 'string' ? template : template.path;

    // Verifica se il template è già presente nella lista usando il path come identificatore
    const isTemplateAlreadyAdded = selectedTemplates.some(t => {
      const existingPath = typeof t === 'string' ? t : t.path;
      return existingPath === templatePath;
    });

    if (!isTemplateAlreadyAdded) {
      console.log(`[STORY_DIALOG] Aggiunta template: ${templatePath}`);

      // Aggiungiamo il template alla lista
      setSelectedTemplates(prev => [...prev, template]);

      // Inizializza la configurazione per questo template usando il path come chiave
      setTemplateConfigs(prev => ({
        ...prev,
        [templatePath]: {
          channel: storyData.casparcgConfig.channel,
          layer: 20, // Layer di default per i template
          cgLayer: 1,
          // Aggiungiamo la temporizzazione per l'ingresso del template
          startDelay: 0, // Ritardo in secondi dall'inizio del media (0 = immediato)
          autoStart: true // Se il template deve partire automaticamente
        }
      }));

      // Estrai il nome del template dal path per caricare il manifest
      const templateName = templatePath.split('/').pop().replace(/\.[^/.]+$/, ''); // Rimuovi estensione

      console.log(`[STORY_DIALOG] Caricamento manifest per template: ${templateName} (path: ${templatePath})`);

      // Utilizziamo try/catch per gestire meglio gli errori
      try {
        fetchManifest(templateName)
          .then(manifest => {
            if (manifest) {
              console.log(`[STORY_DIALOG] Manifest caricato con successo per ${templateName}:`, manifest);

              // Usa il path del template come chiave per memorizzare il manifest
              setTemplateManifests(prev => ({
                ...prev,
                [templatePath]: manifest
              }));

              // Inizializza i dati dei campi con i valori di default
              const initialFieldsData = {};
              manifest.fields?.forEach(field => {
                if (field.defaultValue !== undefined) {
                  initialFieldsData[field.key] = field.defaultValue;
                }
              });

              // Usa il path del template come chiave per memorizzare i dati dei campi
              setTemplateFieldsData(prev => ({
                ...prev,
                [templatePath]: initialFieldsData
              }));
            } else {
              console.warn(`[STORY_DIALOG] Manifest non trovato per ${templateName}`);
              // Inizializziamo comunque un oggetto vuoto per evitare errori
              setTemplateFieldsData(prev => ({
                ...prev,
                [templatePath]: {}
              }));
            }
          })
          .catch(err => {
            console.error(`[STORY_DIALOG] Errore nel caricamento del manifest per ${templateName}:`, err);
            // Inizializziamo comunque un oggetto vuoto per evitare errori
            setTemplateFieldsData(prev => ({
              ...prev,
              [templatePath]: {}
            }));
          });
      } catch (error) {
        console.error(`[STORY_DIALOG] Errore critico nel caricamento del manifest per ${templateName}:`, error);
        // Inizializziamo comunque un oggetto vuoto per evitare errori
        setTemplateFieldsData(prev => ({
          ...prev,
          [templatePath]: {}
        }));
      }
    } else {
      console.log(`[STORY_DIALOG] Template già presente nella lista: ${templatePath}`);
    }
  }, [selectedTemplates, storyData.casparcgConfig.channel, fetchManifest]);

  // Resetta i dati quando il dialogo viene aperto
  useEffect(() => {
    if (open) {
      setStoryData({
        name: 'Nuova Storia',
        notes: '',
        content: '',
        includeMedia: false,
        includeTemplate: false,
        timing: {
          startTime: '00:00:00',
          duration: '00:01:00',
          inPoint: '00:00:00:00',
          outPoint: '00:01:00:00'
        },
        casparcgConfig: {
          channel: 1,
          layer: 10
        }
      });
      setActiveTab(0);
      setSelectedTemplates([]);
      setTemplateConfigs({});
      setTemplateManifests({});
      setTemplateFieldsData({});
      setLocalSelectedTemplate(null);
    }
  }, [open]);

  // Rimuoviamo l'effetto che aggiunge automaticamente il template selezionato alla lista
  // Ora il template verrà aggiunto solo quando l'utente conferma la selezione nel dialogo TemplateDialog
  // Questo risolve il problema dell'aggiunta automatica dei template senza conferma

  // Funzione per gestire la selezione del template nel dialogo TemplateDialog
  const handleSelectTemplate = useCallback((template) => {
    console.log(`[STORY_DIALOG] Template selezionato: ${typeof template === 'string' ? template : template.path}`);
    // Non aggiungiamo automaticamente il template alla lista, ma lo salviamo solo come template selezionato
    // Sarà aggiunto solo quando l'utente conferma la selezione

    // Salviamo il template selezionato nello stato locale
    setLocalSelectedTemplate(template);
  }, []);

  // Funzione per gestire la conferma del template nel dialogo TemplateDialog
  const handleConfirmTemplate = useCallback(() => {
    if (localSelectedTemplate) {
      console.log(`[STORY_DIALOG] Conferma template: ${typeof localSelectedTemplate === 'string' ? localSelectedTemplate : localSelectedTemplate.path}`);
      handleAddTemplate(localSelectedTemplate);
      // Chiudi il dialogo dei template e resetta lo stato locale
      setTemplateDialogOpen(false);
      setLocalSelectedTemplate(null);
    } else {
      console.warn('[STORY_DIALOG] Impossibile confermare il template: nessun template selezionato');
    }
  }, [localSelectedTemplate, handleAddTemplate]);

  // Gestione del cambio di tab
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Gestione dei cambiamenti nei campi
  const handleChange = (field, value) => {
    setStoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestione dei cambiamenti nei campi annidati
  const handleNestedChange = (parent, field, value) => {
    setStoryData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };



  // Funzione per rimuovere un template
  const handleRemoveTemplate = (template) => {
    // Ottieni il path del template (che useremo come chiave univoca)
    const templatePath = typeof template === 'string' ? template : template.path;

    // Rimuovi il template dalla lista dei template selezionati
    setSelectedTemplates(prev => prev.filter(t => {
      const existingPath = typeof t === 'string' ? t : t.path;
      return existingPath !== templatePath;
    }));

    // Rimuovi la configurazione per questo template usando il path come chiave
    setTemplateConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[templatePath];
      return newConfigs;
    });

    // Rimuovi i dati del manifest per questo template usando il path come chiave
    setTemplateManifests(prev => {
      const newManifests = { ...prev };
      delete newManifests[templatePath];
      return newManifests;
    });

    // Rimuovi i dati dei campi per questo template usando il path come chiave
    setTemplateFieldsData(prev => {
      const newFieldsData = { ...prev };
      delete newFieldsData[templatePath];
      return newFieldsData;
    });

    console.log(`[STORY_DIALOG] Template rimosso: ${templatePath}`);
  };

  // Funzione per aggiornare la configurazione di un template
  const handleTemplateConfigChange = (template, field, value) => {
    // Ottieni il path del template (che useremo come chiave univoca)
    const templatePath = typeof template === 'string' ? template : template.path;

    setTemplateConfigs(prev => ({
      ...prev,
      [templatePath]: {
        ...prev[templatePath],
        [field]: value
      }
    }));

    console.log(`[STORY_DIALOG] Configurazione template aggiornata: ${templatePath}, campo: ${field}, valore: ${value}`);
  };

  // Funzione per aggiornare i dati dei campi di un template
  const handleTemplateFieldChange = (template, field, value) => {
    // Ottieni il path del template (che useremo come chiave univoca)
    const templatePath = typeof template === 'string' ? template : template.path;

    setTemplateFieldsData(prev => ({
      ...prev,
      [templatePath]: {
        ...prev[templatePath],
        [field]: value
      }
    }));

    console.log(`[STORY_DIALOG] Campo template aggiornato: ${templatePath}, campo: ${field}, valore: ${value}`);
  };

  // Gestione dell'aggiunta della storia
  const handleAddStory = async () => {
    setLoading(true);

    try {
      // Prepara i dettagli dei template
      const templatesDetails = selectedTemplates.map(template => {
        // Ottieni il path del template (che useremo come chiave univoca)
        const templatePath = typeof template === 'string' ? template : template.path;

        return {
          templateFile: templatePath,
          casparcgConfig: {
            channel: templateConfigs[templatePath]?.channel || storyData.casparcgConfig.channel,
            layer: templateConfigs[templatePath]?.layer || 20,
            cgLayer: templateConfigs[templatePath]?.cgLayer || 1,
            playOnLoad: true
          },
          autoRemove: false,
          // Aggiungiamo le informazioni di temporizzazione
          timing: {
            startDelay: templateConfigs[templatePath]?.startDelay || 0,
            autoStart: templateConfigs[templatePath]?.autoStart !== false
          },
          instanceData: templateFieldsData[templatePath] || {}
        };
      });

      console.log("Creazione storia con template:", {
        includeTemplate: storyData.includeTemplate,
        selectedTemplates: selectedTemplates,
        templatesDetails: templatesDetails
      });

      const storyToAdd = {
        ...storyData,
        mediaDetails: storyData.includeMedia && selectedMedia ? {
          clipPath: typeof selectedMedia === 'string' ? selectedMedia : selectedMedia.path,
          loop: false,
          autoNext: false,
          linkedTemplate: null,
          channel: storyData.casparcgConfig.channel,
          layer: storyData.casparcgConfig.layer
        } : null,
        // Assicuriamoci che templatesDetails sia sempre un array, anche vuoto
        templatesDetails: storyData.includeTemplate && selectedTemplates.length > 0
          ? templatesDetails
          : []
      };

      console.log("Storia da aggiungere:", storyToAdd);
      await onAddStory(storyToAdd);

      onClose();
    } catch (error) {
      console.error('Errore nell\'aggiunta della storia:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Crea Nuova Storia</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="story tabs"
          >
            <Tab icon={<ArticleIcon />} label="Generale" />
            <Tab icon={<MovieIcon />} label="Media" />
            <Tab icon={<TemplateIcon />} label="Template" />
          </Tabs>
        </Box>

        {/* Tab: Generale */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nome Storia"
                fullWidth
                value={storyData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contenuto"
                fullWidth
                multiline
                rows={4}
                value={storyData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Note"
                fullWidth
                multiline
                rows={2}
                value={storyData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Canale Predefinito"
                type="number"
                fullWidth
                value={storyData.casparcgConfig.channel}
                onChange={(e) => handleNestedChange('casparcgConfig', 'channel', parseInt(e.target.value) || 1)}
                margin="normal"
                helperText="Canale predefinito per media e template"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Layer Predefinito"
                type="number"
                fullWidth
                value={storyData.casparcgConfig.layer}
                onChange={(e) => handleNestedChange('casparcgConfig', 'layer', parseInt(e.target.value) || 10)}
                margin="normal"
                helperText="Layer predefinito per i media"
              />
            </Grid>

            {/* Campi di timing */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Timing
              </Typography>
              <Divider />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Orario di Start"
                fullWidth
                value={storyData.timing.startTime}
                onChange={(e) => handleNestedChange('timing', 'startTime', e.target.value)}
                margin="normal"
                placeholder="00:00:00"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Durata"
                fullWidth
                value={storyData.timing.duration}
                onChange={(e) => handleNestedChange('timing', 'duration', e.target.value)}
                margin="normal"
                placeholder="00:01:00"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Punto IN"
                fullWidth
                value={storyData.timing.inPoint}
                onChange={(e) => handleNestedChange('timing', 'inPoint', e.target.value)}
                margin="normal"
                placeholder="00:00:00:00"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Punto OUT"
                fullWidth
                value={storyData.timing.outPoint}
                onChange={(e) => handleNestedChange('timing', 'outPoint', e.target.value)}
                margin="normal"
                placeholder="00:01:00:00"
              />
            </Grid>
          </Grid>
        )}

        {/* Tab: Media */}
        {activeTab === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={storyData.includeMedia}
                    onChange={(e) => handleChange('includeMedia', e.target.checked)}
                  />
                }
                label="Includi Media nella Storia"
              />
            </Grid>

            {storyData.includeMedia && (
              <>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => onBrowseMedia(true)}
                    sx={{ mt: 1 }}
                  >
                    {selectedMedia
                      ? `Media: ${typeof selectedMedia === 'string'
                          ? selectedMedia.split('/').pop()
                          : selectedMedia.name}`
                      : 'Seleziona Media'}
                  </Button>
                </Grid>

                {selectedMedia && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Dettagli Media
                      </Typography>
                      <Typography variant="body2">
                        Path: {typeof selectedMedia === 'string' ? selectedMedia : selectedMedia.path}
                      </Typography>
                      <Typography variant="body2">
                        Durata: {typeof selectedMedia === 'string' ? '00:00:00' : (selectedMedia.duration || '00:00:00')}
                      </Typography>
                    </Grid>

                    {/* Configurazione specifica del media */}
                    <Grid item xs={6}>
                      <TextField
                        label="Canale Media"
                        type="number"
                        fullWidth
                        value={storyData.casparcgConfig.channel}
                        onChange={(e) => handleNestedChange('casparcgConfig', 'channel', parseInt(e.target.value) || 1)}
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Layer Media"
                        type="number"
                        fullWidth
                        value={storyData.casparcgConfig.layer}
                        onChange={(e) => handleNestedChange('casparcgConfig', 'layer', parseInt(e.target.value) || 10)}
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        )}

        {/* Tab: Template */}
        {activeTab === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={storyData.includeTemplate}
                    onChange={(e) => handleChange('includeTemplate', e.target.checked)}
                  />
                }
                label="Includi Template nella Storia"
              />
            </Grid>

            {storyData.includeTemplate && (
              <>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setTemplateDialogOpen(true)}
                    sx={{ mt: 1 }}
                  >
                    Aggiungi Template
                  </Button>
                </Grid>

                {/* Lista dei template selezionati */}
                {selectedTemplates.length > 0 && (
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Template Selezionati ({selectedTemplates.length})
                    </Typography>

                    {selectedTemplates.map((template, index) => {
                      // Ottieni il path del template (che useremo come chiave univoca)
                      const templatePath = typeof template === 'string' ? template : template.path;
                      // Ottieni il nome del template dal path
                      const templateName = templatePath.split('/').pop();

                      return (
                        <Card key={index} sx={{ mb: 2, bgcolor: 'background.paper' }}>
                          <CardContent sx={{ pb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" component="div">
                                {templateName}
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveTemplate(template)}
                                title="Rimuovi template"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Path: {templatePath}
                            </Typography>

                            {/* Configurazione del template */}
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <TextField
                                  label="Canale"
                                  type="number"
                                  fullWidth
                                  value={templateConfigs[templatePath]?.channel || storyData.casparcgConfig.channel}
                                  onChange={(e) => handleTemplateConfigChange(template, 'channel', parseInt(e.target.value) || 1)}
                                  margin="dense"
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  label="Layer"
                                  type="number"
                                  fullWidth
                                  value={templateConfigs[templatePath]?.layer || 20}
                                  onChange={(e) => handleTemplateConfigChange(template, 'layer', parseInt(e.target.value) || 20)}
                                  margin="dense"
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  label="CG Layer"
                                  type="number"
                                  fullWidth
                                  value={templateConfigs[templatePath]?.cgLayer || 1}
                                  onChange={(e) => handleTemplateConfigChange(template, 'cgLayer', parseInt(e.target.value) || 1)}
                                  margin="dense"
                                  size="small"
                                />
                              </Grid>

                              {/* Temporizzazione del template */}
                              <Grid item xs={6}>
                                <TextField
                                  label="Ritardo Avvio (sec)"
                                  type="number"
                                  fullWidth
                                  value={templateConfigs[templatePath]?.startDelay || 0}
                                  onChange={(e) => handleTemplateConfigChange(template, 'startDelay', parseInt(e.target.value) || 0)}
                                  margin="dense"
                                  size="small"
                                  helperText="Secondi di ritardo dall'inizio del media"
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={templateConfigs[templatePath]?.autoStart !== false}
                                      onChange={(e) => handleTemplateConfigChange(template, 'autoStart', e.target.checked)}
                                      size="small"
                                    />
                                  }
                                  label="Avvio automatico"
                                  sx={{ mt: 1 }}
                                />
                              </Grid>
                            </Grid>

                            {/* Campi del manifest */}
                            {templateManifests[templatePath] && templateManifests[templatePath].fields && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Campi del Template
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                  {templateManifests[templatePath].fields.map((field, fieldIndex) => (
                                    <Grid item xs={12} sm={field.type === 'textarea' ? 12 : 6} key={fieldIndex}>
                                      <TextField
                                        label={field.label || field.key}
                                        fullWidth
                                        multiline={field.type === 'textarea'}
                                        rows={field.type === 'textarea' ? (field.props?.rows || 3) : 1}
                                        value={templateFieldsData[templatePath]?.[field.key] || field.defaultValue || ''}
                                        onChange={(e) => handleTemplateFieldChange(template, field.key, e.target.value)}
                                        margin="dense"
                                        size="small"
                                        placeholder={field.placeholder || ''}
                                        helperText={field.description || ''}
                                        required={field.required}
                                      />
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Grid>
                )}
              </>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Annulla
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddStory}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Crea Storia'}
        </Button>
      </DialogActions>

      {/* Dialogo per la selezione del template */}
      <TemplateDialog
        open={templateDialogOpen}
        onClose={() => {
          setTemplateDialogOpen(false);
          setLocalSelectedTemplate(null);
        }}
        onSelectTemplate={handleSelectTemplate}
        onConfirmForStory={handleConfirmTemplate}
        selectedTemplate={localSelectedTemplate}
        isForStory={true}
      />
    </Dialog>
  );
};

export default StoryDialog;
