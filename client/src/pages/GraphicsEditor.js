import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
// PlayArrowIcon non è più usato direttamente nei bottoni principali se CG ADD fa il play
// import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import UpdateIcon from '@mui/icons-material/Update';
import BrushIcon from '@mui/icons-material/Brush';
import DynamicTemplateForm from './DynamicTemplateForm';
import { useCaspar } from '../contexts/CasparContext';

const getTemplateType = (templateName) => {
  if (!templateName) return 'generic';
  const name = templateName.toLowerCase();
  if (name.includes('professional_ticker_casparcg')) return 'professional_ticker';
  if (name.includes('lower_third_casparcg')) return 'professional_lower_third';
  if (name.includes('ticker2')) return 'ticker_advanced';
  if (name.includes('ticker')) return 'ticker';
  if (name.includes('logo')) return 'logo';
  if (name.includes('lower') && name.includes('third')) return 'lower_third';
  if (name.includes('text')) return 'text';
  return 'generic';
};

// La funzione fetchTemplateManifest esterna non è più necessaria qui,
// useremo quella del CasparContext.

const GraphicsEditor = () => {
  const {
    connected,
    templateList,
    mediaList, // 🔥 AGGIUNTO per ottenere template locali da getAllMedia
    getTemplateList,
    getAllMedia, // 🔥 AGGIUNTO per template locali + CasparCG media
    cgAdd,
    // cgPlay, // Potrebbe non essere necessario se cgAdd gestisce playOnLoad
    cgStop,
    cgRemove,
    cgUpdate,
    loading,
    fetchManifest // NUOVA FUNZIONE DAL CONTEXT
  } = useCaspar();

  // Rimuovi la costante CASPARCG_HTTP_TEMPLATE_SERVER_URL
  // const CASPARCG_HTTP_TEMPLATE_SERVER_URL = 'http://localhost:8000';

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplateList, setFilteredTemplateList] = useState([]);
  const [combinedTemplateList, setCombinedTemplateList] = useState([]); // 🔥 Template locali + CasparCG
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateManifest, setSelectedTemplateManifest] = useState(null);
  const [templateData, setTemplateData] = useState({});

  const [channel, setChannel] = useState(1);
  const [layer, setLayer] = useState(20);

  const [activeTemplate, setActiveTemplate] = useState(null);
  const [presets] = useState([
    { name: 'LT Ospite Generico', templateFullName: 'LOWER_THIRDNEW', data: { title: 'Ospite Importante', subtitle: 'Esperto del Settore' } },
    { name: 'Ticker Breaking News', templateFullName: 'TICKER2', data: { f0: "BREAKING NEWS", f2: "Aggiornamenti in tempo reale dalla redazione..." } },
  ]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [manifestLoading, setManifestLoading] = useState(false);

  const handleRefreshTemplates = useCallback(async () => {
    // 🔥 CARICA SEMPRE assets locali, template remoti se connesso
    await getAllMedia();
    if (connected) {
      await getTemplateList();
    }
  }, [connected, getAllMedia, getTemplateList]);

  useEffect(() => {
    // 🔥 CARICA SEMPRE template (locali sempre, remoti se connesso)
    handleRefreshTemplates();
  }, [handleRefreshTemplates]);

  // 🔥 COMBINA template locali e remoti
  useEffect(() => {
    const combined = [];
    
    // 🔥 Aggiungi template remoti CasparCG
    if (templateList && templateList.length > 0) {
      templateList.forEach(template => {
        combined.push({
          name: template,
          path: template, 
          source: 'casparcg',
          type: 'template'
        });
      });
    }
    
    // 🔥 Aggiungi template locali da assets (filtrando solo template .html)
    if (mediaList && mediaList.length > 0) {
      mediaList.forEach(item => {
        // Se è un oggetto con categoria templates
        if (typeof item === 'object' && item.category === 'templates' && item.name && item.name.endsWith('.html')) {
          combined.push({
            name: item.name.replace('.html', ''), // Rimuovi .html per consistenza
            path: item.httpUrl || item.path,
            source: 'assets',
            type: 'template',
            isLocal: true
          });
        }
      });
    }
    
    setCombinedTemplateList(combined);
  }, [templateList, mediaList]);

  useEffect(() => {
    let filtered = combinedTemplateList; // 🔥 USA template combinati (locali + remoti)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        (template.name || '').toLowerCase().includes(term) ||
        (template.path || '').toLowerCase().includes(term)
      );
    }
    setFilteredTemplateList(filtered);
  }, [combinedTemplateList, searchTerm]); // 🔥 DIPENDENZA AGGIORNATA

  const handleSelectTemplate = async (templateBaseName) => {
    setSelectedTemplate(templateBaseName);
    setSelectedTemplateManifest(null);
    setTemplateData({});
    setManifestLoading(true);
    setError(null);

    if (!fetchManifest) {
        setError("La funzione fetchManifest non è disponibile nel contesto Caspar.");
        setManifestLoading(false);
        return;
    }

    try {
      console.log(`Richiesta manifest per ${templateBaseName} tramite context...`);
      const manifest = await fetchManifest(templateBaseName); // USA LA FUNZIONE DAL CONTEXT

      if (manifest && manifest.fields) {
        setSelectedTemplateManifest(manifest);
        const initialData = {};
        manifest.fields.forEach(field => {
          if (field.defaultValue !== undefined) {
            initialData[field.key] = field.defaultValue;
          }
        });
        setTemplateData(initialData);
        console.log(`Manifest per ${templateBaseName} processato:`, manifest);
      } else {
        console.warn(`Manifest non trovato o non valido per ${templateBaseName} tramite context. Si userà un editor generico o un fallback basato sul tipo.`);
        const type = getTemplateType(templateBaseName);
        if (type !== 'generic' && type !== 'professional_ticker' && type !== 'professional_lower_third' && type !== 'ticker_advanced') {
            switch (type) {
              case 'ticker': setTemplateData({ text: 'Testo del ticker' }); break;
              case 'logo': setTemplateData({ text: 'LOGO' }); break;
              case 'lower_third': setTemplateData({ title: 'Nome Cognome', subtitle: 'Titolo / Ruolo' }); break;
              case 'text': setTemplateData({ text: 'Testo di esempio' }); break;
              default: setTemplateData({}); break;
            }
        } else {
            setTemplateData({});
        }
      }
    } catch (err) {
      console.error(`Errore nel caricamento del manifest per ${templateBaseName} tramite context:`, err);
      setError(`Errore caricamento definizione template: ${err.message}.`);
      setTemplateData({});
    } finally {
      setManifestLoading(false);
    }
  };

  const prepareDataForCaspar = (currentData) => {
    const preparedData = { ...currentData };
    if (selectedTemplateManifest && selectedTemplateManifest.fields) {
        selectedTemplateManifest.fields.forEach(field => {
            if (field.type === 'textarea' && field.label.toLowerCase().includes('json')) {
                try {
                    if (typeof preparedData[field.key] === 'string') {
                         preparedData[field.key] = JSON.parse(preparedData[field.key]);
                    }
                } catch (e) {
                    console.warn(`Campo ${field.key} ('${preparedData[field.key]}') non è un JSON valido, inviato come stringa. Errore: ${e.message}`);
                }
            }
        });
    } else if (templateData && templateData.jsonData) {
        try {
            return JSON.parse(templateData.jsonData);
        } catch(e) {
            console.warn("jsonData non è un JSON valido, inviato come oggetto con chiave 'jsonData'.");
            return { jsonData: templateData.jsonData };
        }
    }
    return preparedData;
  };

  const handleAddTemplate = async () => {
    if (!connected || !selectedTemplate) return;
    setError(null);
    try {
      const dataToSend = prepareDataForCaspar(templateData);
      await cgAdd(channel, layer, 1, selectedTemplate, true, dataToSend);
      setActiveTemplate({
        template: selectedTemplate,
        channel,
        layer,
        cgLayer: 1,
        data: dataToSend
      });
    } catch (error) {
      console.error('Errore nell\'aggiunta del template:', error);
      setError(`Errore aggiunta: ${error.message}`);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!connected || !activeTemplate) return;
    setError(null);
    try {
      const dataToSend = prepareDataForCaspar(templateData);
      await cgUpdate(activeTemplate.channel, activeTemplate.layer, activeTemplate.cgLayer, dataToSend);
      setActiveTemplate({
        ...activeTemplate,
        data: dataToSend
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento del template:', error);
      setError(`Errore aggiornamento: ${error.message}`);
    }
  };

  const handleStopTemplate = async () => {
    if (!connected || !activeTemplate) return;
    setError(null);
    try {
      await cgStop(activeTemplate.channel, activeTemplate.layer, activeTemplate.cgLayer);
      await cgRemove(activeTemplate.channel, activeTemplate.layer, activeTemplate.cgLayer);
      setActiveTemplate(null);
    } catch (error) {
      console.error('Errore nell\'arresto del template:', error);
      setError(`Errore stop: ${error.message}`);
    }
  };

  const handleLoadPreset = async (preset) => {
    if (preset.templateFullName) {
        await handleSelectTemplate(preset.templateFullName);
        setTemplateData(currentData => ({...currentData, ...preset.data}));
    } else {
        // Utilizziamo il tipo dal preset o lo determiniamo dal nome
        // Nota: la variabile type non viene utilizzata direttamente qui, ma è utile per debug
        const templateType = preset.type || getTemplateType(preset.name);
        console.log(`Tipo template determinato: ${templateType}`);
        setSelectedTemplateManifest(null);
        setTemplateData(preset.data);
        setSelectedTemplate(preset.name);
    }
  };

  const handleTabChange = (_event, newValue) => {
    // Usiamo _event per indicare che il parametro non viene utilizzato
    setTabValue(newValue);
  };

  const handleFieldFocus = (fieldKey) => {
    console.log("Focus sul campo:", fieldKey);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Editor Grafica Dinamico
      </Typography>

       <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#2d2d2d' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              label="Cerca Template" variant="outlined" fullWidth
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefreshTemplates} disabled={!connected || loading}>
                Aggiorna Lista
              </Button>
              {activeTemplate && (
                <Button variant="contained" color="error" startIcon={<StopIcon />} onClick={handleStopTemplate} disabled={!connected || loading}>
                  Stop Template Attivo
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
           <Paper elevation={3} sx={{ backgroundColor: '#2d2d2d', height: 'calc(100vh - 300px)', overflow: 'auto' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Template" />
              <Tab label="Preset" />
            </Tabs>
            {tabValue === 0 ? (
              <>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}><Typography variant="h6">Template Server</Typography></Box>
                {loading && !templateList.length ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                ) : filteredTemplateList.length > 0 ? (
                  <List dense>
                    {filteredTemplateList.map((template) => {
                      // 🔥 GESTIONE OGGETTI TEMPLATE invece di stringhe
                      const templateName = template.name || template.path || template;
                      const templatePath = template.path || template;
                      const isLocal = template.source === 'assets';
                      const lastSlash = templateName.lastIndexOf('/');
                      const displayName = lastSlash === -1 ? templateName : templateName.substring(lastSlash + 1);
                      const folderPath = lastSlash === -1 ? (isLocal ? 'Assets' : './') : templateName.substring(0, lastSlash);
                      
                      return (
                        <ListItem
                            key={templatePath}
                            button
                            onClick={() => handleSelectTemplate(templatePath)} // 🔥 USA path per compatibilità
                            selected={selectedTemplate === templatePath}
                            disabled={manifestLoading && selectedTemplate === templatePath}
                        >
                          <ListItemIcon><BrushIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {displayName}
                                <Chip 
                                  label={isLocal ? 'Local' : 'CasparCG'} 
                                  size="small" 
                                  color={isLocal ? 'success' : 'info'}
                                  variant="outlined"
                                />
                              </Box>
                            } 
                            secondary={folderPath} 
                          />
                           {selectedTemplate === templatePath && manifestLoading && <CircularProgress size={20} sx={{ml:1}}/>}
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ p: 5, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      {connected ? 'Nessun template trovato o corrispondente alla ricerca.' : 'Non connesso a CasparCG.'}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <>
                 <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}><Typography variant="h6">Preset Locali</Typography></Box>
                <List dense>
                  {presets.map((preset, index) => (
                    <ListItem key={index} button onClick={() => handleLoadPreset(preset)}>
                      <ListItemIcon><BrushIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={preset.name} secondary={preset.templateFullName || preset.type} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ backgroundColor: '#2d2d2d', minHeight: 400, height: 'calc(100vh - 300px)', overflow: 'auto' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Typography variant="h6">
                Editor Template
                {selectedTemplate && (
                  <Typography variant="body2" color="text.secondary" component="span" sx={{display: 'block'}}>
                    {selectedTemplateManifest ? selectedTemplateManifest.templateName : selectedTemplate}
                    {selectedTemplateManifest?.version && ` (v${selectedTemplateManifest.version})`}
                  </Typography>
                )}
                 {selectedTemplate && manifestLoading && <Chip label="Caricamento definizione..." size="small" sx={{ml:1}} />}
              </Typography>
            </Box>

            {error && (<Alert severity="error" sx={{ m: 2, whiteSpace: 'pre-wrap' }}>{error}</Alert>)}

            {selectedTemplate && !manifestLoading ? (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center" sx={{mb:2}}>
                  <Grid item xs={6} sm={4} md={3}>
                    <TextField label="Canale Video" type="number" fullWidth value={channel} onChange={(e) => setChannel(Math.max(1, parseInt(e.target.value)))} InputProps={{ inputProps: { min: 1 } }} variant="standard" size="small"/>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <TextField label="Layer Video" type="number" fullWidth value={layer} onChange={(e) => setLayer(Math.max(1, parseInt(e.target.value)))} InputProps={{ inputProps: { min: 1 } }} variant="standard" size="small"/>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />

                {selectedTemplateManifest ? (
                  <DynamicTemplateForm
                    manifest={selectedTemplateManifest}
                    data={templateData}
                    onChange={setTemplateData}
                    onFocus={handleFieldFocus}
                  />
                ) : (
                  <Box>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Definizione (manifest) per questo template non trovata. Puoi modificare i dati come JSON generico se necessario.
                    </Typography>
                    <TextField
                        label="Dati JSON Template (Fallback)"
                        fullWidth
                        multiline
                        rows={10}
                        variant="filled"
                        value={typeof templateData.jsonData === 'string' ? templateData.jsonData : JSON.stringify(templateData, null, 2)}
                        onChange={(e) => {
                            setTemplateData(prev => ({ ...prev, jsonData: e.target.value }));
                        }}
                        helperText="Inserisci i dati del template in formato JSON."
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, borderTop: '1px solid rgba(255,255,255,0.12)', pt:2 }}>
                  <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleAddTemplate} disabled={!connected || loading || manifestLoading}>
                    Play (CG ADD)
                  </Button>
                  <Button variant="contained" color="primary" startIcon={<UpdateIcon />} onClick={handleUpdateTemplate} disabled={!connected || !activeTemplate || loading || manifestLoading}>
                    Aggiorna Dati
                  </Button>
                </Box>

              </Box>
            ) : !selectedTemplate && !manifestLoading ? (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Seleziona un template dalla lista a sinistra.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{mt:1}}>
                  L'editor mostrerà i campi configurabili per il template scelto se è disponibile una definizione (manifest).
                </Typography>
              </Box>
            ) : null }
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GraphicsEditor;
