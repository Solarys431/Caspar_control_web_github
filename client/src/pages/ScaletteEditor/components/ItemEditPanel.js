import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import MovieIcon from '@mui/icons-material/Movie';
import BrushIcon from '@mui/icons-material/Brush';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SettingsIcon from '@mui/icons-material/Settings';
import CodeIcon from '@mui/icons-material/Code';
import NotesIcon from '@mui/icons-material/Notes';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import useItemEditor from '../hooks/useItemEditor';

/**
 * Componente per il pannello di modifica degli elementi
 *
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il pannello è aperto
 * @param {Function} props.onClose - Funzione per chiudere il pannello
 * @param {Object} props.item - Elemento da modificare
 * @param {Function} props.onSave - Funzione per salvare le modifiche
 * @param {Function} props.onChange - Funzione per gestire i cambiamenti nei campi
 * @param {Function} props.onBrowseMedia - Funzione per aprire il selettore media
 * @param {Function} props.onBrowseTemplate - Funzione per aprire il selettore template
 * @param {Function} props.startEditingItem - Funzione per iniziare la modifica di un elemento
 * @param {Function} props.stopEditingItem - Funzione per terminare la modifica di un elemento
 * @param {string} props.userRole - Ruolo dell'utente per la scaletta corrente
 * @returns {JSX.Element} - Componente React
 */
const ItemEditPanel = ({
  open,
  onClose,
  item,
  onSave,
  onChange,
  onBrowseMedia,
  onBrowseTemplate,
  startEditingItem,
  stopEditingItem,
  userRole = ''
}) => {
  // Stato per la tab attiva
  const [activeTab, setActiveTab] = useState(0);

  // Utilizziamo il nuovo hook useItemEditor per gestire la modifica dell'elemento
  const {
    localItem,
    setLocalItem,
    loading,
    error,
    setError,
    conflictData,
    setConflictData,
    originalVersion,
    setOriginalVersion,
    canEdit,
    handleSave: editorHandleSave,
    handleSaveAndClose: editorHandleSaveAndClose,
    startEditing,
    stopEditing
  } = useItemEditor({
    item,
    onSave,
    startEditingItem,
    stopEditingItem,
    userRole
  });

  // Riferimenti per lo stato di editing (mantenuti per retrocompatibilità)
  const editingStartedRef = useRef(false);
  const editingItemIdRef = useRef(null);

  // Aggiorna lo stato locale quando l'item cambia
  useEffect(() => {
    if (item) {
      console.log(`[PANEL] Item aggiornato:`, {
        id: item.id,
        version: item.version,
        type: item.type,
        data: item.data,
        templatesDetails: item.data?.templatesDetails,
        templateDetails: item.data?.templateDetails
      });

      // Crea una copia profonda dell'item per evitare modifiche indesiderate all'oggetto originale
      const deepCopy = JSON.parse(JSON.stringify(item));

      console.log('[PANEL_INIT_START]', JSON.stringify(item));

      // Assicurati che la struttura dei dati sia corretta
      if (deepCopy.type === 'STORY') {
        console.log("[PANEL] Elaborazione item di tipo STORY");

        // Assicuriamoci che data esista
        if (!deepCopy.data) {
          deepCopy.data = {};
        }

        // Gestione dei template: priorità al nuovo formato (templatesDetails)

        // Caso 1: Se templatesDetails è fornito e non è vuoto, lo utilizziamo
        if (deepCopy.data.templatesDetails && Array.isArray(deepCopy.data.templatesDetails) && deepCopy.data.templatesDetails.length > 0) {
          console.log("[PANEL] Utilizzando templatesDetails esistente:", deepCopy.data.templatesDetails);

          // Assicuriamoci che ogni template abbia le strutture necessarie
          deepCopy.data.templatesDetails = deepCopy.data.templatesDetails.map(template => ({
            templateFile: template.templateFile || '',
            casparcgConfig: template.casparcgConfig || {
              channel: deepCopy.data.casparcgConfig?.channel || 1,
              layer: 20,
              cgLayer: 1,
              playOnLoad: true
            },
            autoRemove: template.autoRemove !== undefined ? template.autoRemove : false,
            instanceData: template.instanceData || {},
            timing: template.timing || {
              startDelay: 0,
              autoStart: true
            }
          }));
        }
        // Caso 2: Se templatesDetails non è fornito o è vuoto ma c'è templateDetails (legacy), convertiamo in templatesDetails
        else if (deepCopy.data.templateDetails && deepCopy.data.templateDetails.templateFile) {
          console.log("[PANEL] Convertendo templateDetails legacy in templatesDetails:", deepCopy.data.templateDetails);

          deepCopy.data.templatesDetails = [{
            templateFile: deepCopy.data.templateDetails.templateFile,
            casparcgConfig: deepCopy.data.templateDetails.casparcgConfig || {
              channel: deepCopy.data.casparcgConfig?.channel || 1,
              layer: 20,
              cgLayer: 1,
              playOnLoad: true
            },
            autoRemove: deepCopy.data.templateDetails.autoRemove || false,
            instanceData: deepCopy.data.templateDetails.instanceData || {},
            timing: {
              startDelay: 0,
              autoStart: true
            }
          }];

          // Impostiamo esplicitamente a null per evitare confusione
          deepCopy.data.templateDetails = null;
        }
        // Caso 3: Se non c'è né templatesDetails né templateDetails, inizializziamo templatesDetails come array vuoto
        else {
          console.log("[PANEL] Nessun template trovato, inizializzando templatesDetails vuoto");
          deepCopy.data.templatesDetails = [];
          deepCopy.data.templateDetails = null;
        }

        // Assicurati che mediaDetails esista
        if (!deepCopy.data.mediaDetails) {
          deepCopy.data.mediaDetails = {
            clipPath: '',
            loop: false,
            autoNext: false,
            channel: deepCopy.data.casparcgConfig?.channel || 1,
            layer: deepCopy.data.casparcgConfig?.layer || 10
          };
        }
      }

      console.log(`[PANEL] Item processato:`, {
        id: deepCopy.id,
        type: deepCopy.type,
        templatesDetails: deepCopy.data?.templatesDetails,
        templateDetails: deepCopy.data?.templateDetails
      });

      console.log('[PANEL_INIT_END]', JSON.stringify(deepCopy));

      setLocalItem(deepCopy);
    }
  }, [item]);

  // Effetto per iniziare la modifica dell'elemento quando il pannello viene aperto
  useEffect(() => {
    let isMounted = true;

    const handlePanelOpen = async () => {
      if (open && localItem && localItem.id) {
        console.log(`[PANEL] Inizializzazione modifica per item ${localItem.id}`);

        // Utilizziamo la funzione startEditing del hook useItemEditor
        const success = await startEditing();

        if (!isMounted) return;

        if (success) {
          // Aggiorniamo lo stato di editing locale per retrocompatibilità
          editingStartedRef.current = true;
          editingItemIdRef.current = localItem.id;
          console.log(`[PANEL] Modifica iniziata con successo per item ${localItem.id}`);
        } else {
          console.error(`[PANEL] Impossibile iniziare la modifica per item ${localItem.id}`);
        }
      } else if (!open) {
        // Quando il pannello viene chiuso, resettiamo lo stato di editing
        editingStartedRef.current = false;
        editingItemIdRef.current = null;

        // Utilizziamo la funzione stopEditing del hook useItemEditor
        if (localItem?.id) {
          console.log(`[PANEL] Terminazione modifica per item ${localItem.id}`);
          await stopEditing();
        }
      } else if (open) {
        console.log(`[PANEL] Pannello aperto ma localItem non ancora pronto:`, {
          open,
          hasLocalItem: !!localItem,
          itemId: localItem?.id
        });
      }
    };

    handlePanelOpen();

    return () => {
      isMounted = false;
    };
  }, [open, localItem, startEditing, stopEditing]);

  // Utilizziamo localItem se disponibile, altrimenti props.item
  const currentItem = localItem || item;

  // Se non abbiamo né props.item né localItem, non possiamo mostrare il pannello
  if (!currentItem) {
    return null;
  }

  // Gestione del cambio di tab
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Gestione dei cambiamenti nei campi
  const handleChange = (field, value) => {
    const updatedItem = {
      ...currentItem,
      data: {
        ...currentItem.data,
        [field]: value
      }
    };

    setLocalItem(updatedItem);
    onChange(updatedItem);
  };

  const handleNameChange = (value) => {
    const updatedItem = {
      ...currentItem,
      name: value,
      data: {
        ...currentItem.data,
        customName: value
      }
    };

    setLocalItem(updatedItem);
    onChange(updatedItem);
  };

  const handleJsonDataChange = (value) => {
    try {
      const newData = JSON.parse(value);

      const updatedItem = {
        ...currentItem,
        data: {
          ...currentItem.data,
          data: newData
        }
      };

      setLocalItem(updatedItem);
      onChange(updatedItem);
    } catch (error) {
      console.error('[PANEL] JSON non valido:', error);
    }
  };

  // Gestione del salvataggio utilizzando il hook useItemEditor
  const handleSave = async () => {
    console.log(`[PANEL] Tentativo di salvare le modifiche per item ${currentItem.id}`);

    const result = await editorHandleSave();

    if (result.success) {
      console.log(`[PANEL] Salvataggio completato con successo:`, result);
      // Aggiorniamo lo stato di editing locale per retrocompatibilità
      editingStartedRef.current = true;
    }
  };

  // Gestione del salvataggio e chiusura utilizzando il hook useItemEditor
  const handleSaveAndClose = async () => {
    console.log(`[PANEL] Tentativo di salvare le modifiche e chiudere per item ${currentItem.id}`);

    const result = await editorHandleSaveAndClose();

    if (result.success) {
      console.log(`[PANEL] Salvataggio completato con successo:`, result);
      // Impostiamo editingStartedRef.current = false prima di chiudere il pannello
      editingStartedRef.current = false;
      onClose();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '450px' },
          maxWidth: '100%',
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Header del pannello */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box>
          <Typography variant="h6" component="div">
            {currentItem.type === 'MEDIA'
              ? 'Modifica Media'
              : currentItem.type === 'TEMPLATE'
                ? 'Modifica Template'
                : 'Modifica Storia'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {currentItem.id}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Chiudi">
            <IconButton edge="end" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Contenuto del pannello */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100% - 64px - 64px)', // Altezza totale meno header e footer
        overflow: 'hidden'
      }}>
        {/* Tabs di navigazione */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="item edit tabs"
          >
            <Tab icon={<SettingsIcon />} label="Generale" />
            <Tab
              icon={
                currentItem.type === 'MEDIA'
                  ? <MovieIcon />
                  : currentItem.type === 'TEMPLATE'
                    ? <BrushIcon />
                    : <ArticleIcon />
              }
              label="Sorgente"
            />
            <Tab icon={<AccessTimeIcon />} label="Timing" />
            <Tab icon={<NotesIcon />} label="Note" />
            {currentItem.type === 'TEMPLATE' && <Tab icon={<CodeIcon />} label="Dati Template" />}
            {currentItem.type === 'STORY' && <Tab icon={<BrushIcon />} label="Template" />}
            {currentItem.type === 'STORY' && <Tab icon={<MovieIcon />} label="Media" />}
          </Tabs>
        </Box>

        {/* Contenuto delle tabs */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {/* Messaggi di errore o conflitto */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {conflictData && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Questo elemento è stato modificato da un altro utente. Scegli come procedere:
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    console.log(`[PANEL] Caricamento versione recente dell'item:`, conflictData.latestData);
                    setLocalItem(conflictData.latestData);
                    onChange(conflictData.latestData);
                    setOriginalVersion(conflictData.latestData.version);
                    setConflictData(null);
                  }}
                >
                  Carica Versione Recente
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  onClick={() => {
                    console.log(`[PANEL] Continuazione con la modifica corrente nonostante il conflitto`);
                    setConflictData(null);
                  }}
                >
                  Continua Modifica
                </Button>
              </Box>
            </Alert>
          )}

          {/* Tab: Generale */}
          {activeTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Nome"
                  fullWidth
                  value={currentItem.data.customName || currentItem.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  margin="normal"
                  disabled={!canEdit || loading}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Canale"
                  type="number"
                  fullWidth
                  value={currentItem.data.channel || 1}
                  onChange={(e) => handleChange('channel', parseInt(e.target.value) || 1)}
                  margin="normal"
                  disabled={!canEdit || loading}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Layer"
                  type="number"
                  fullWidth
                  value={currentItem.data.layer || 10}
                  onChange={(e) => handleChange('layer', parseInt(e.target.value) || 10)}
                  margin="normal"
                  disabled={!canEdit || loading}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab: Sorgente */}
          {activeTab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {currentItem.type === 'MEDIA' ? (
                  <>
                    <Typography variant="subtitle2" gutterBottom>Media</Typography>
                    <TextField
                      fullWidth
                      value={currentItem.data.clip || ''}
                      onChange={(e) => handleChange('clip', e.target.value)}
                      margin="normal"
                      disabled={!canEdit || loading}
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onBrowseMedia(currentItem)}
                      disabled={!canEdit || loading}
                      sx={{ mt: 1 }}
                    >
                      {currentItem.data.media ? `Media: ${currentItem.data.media.name}` : 'Seleziona Media'}
                    </Button>
                  </>
                ) : currentItem.type === 'TEMPLATE' ? (
                  <>
                    <Typography variant="subtitle2" gutterBottom>Template</Typography>
                    <TextField
                      fullWidth
                      value={currentItem.data.template || ''}
                      onChange={(e) => handleChange('template', e.target.value)}
                      margin="normal"
                      disabled={!canEdit || loading}
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onBrowseTemplate(currentItem)}
                      disabled={!canEdit || loading}
                      sx={{ mt: 1 }}
                    >
                      {currentItem.data.template ? `Template: ${currentItem.data.template.name}` : 'Seleziona Template'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle2" gutterBottom>Contenuto Storia</Typography>
                    <TextField
                      label="Contenuto"
                      fullWidth
                      multiline
                      rows={6}
                      value={currentItem.data.content || ''}
                      onChange={(e) => handleChange('content', e.target.value)}
                      margin="normal"
                      disabled={!canEdit || loading}
                    />
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Elementi associati
                    </Typography>
                    <FormControl component="fieldset" sx={{ mt: 1 }}>
                      <FormLabel component="legend">Seleziona gli elementi da includere nella storia</FormLabel>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!currentItem.data.mediaDetails?.clipPath}
                            onChange={(e) => {
                              const newMediaDetails = e.target.checked
                                ? { clipPath: '', loop: false, autoNext: false }
                                : null;
                              handleChange('mediaDetails', newMediaDetails);
                            }}
                            disabled={!canEdit || loading}
                          />
                        }
                        label="Includi Media"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!(currentItem.data.templatesDetails && currentItem.data.templatesDetails.length > 0)}
                            onChange={(e) => {
                              console.log("[PANEL] Cambio stato checkbox Includi Template (tab Sorgente):", {
                                checked: e.target.checked,
                                currentTemplatesDetails: currentItem.data.templatesDetails
                              });

                              if (e.target.checked) {
                                // Se non ci sono già template, creiamo un array con un template vuoto
                                if (!currentItem.data.templatesDetails || currentItem.data.templatesDetails.length === 0) {
                                  const templatesDetails = [{
                                    templateFile: '',
                                    casparcgConfig: {
                                      channel: currentItem.data.casparcgConfig?.channel || 1,
                                      layer: 20,
                                      cgLayer: 1,
                                      playOnLoad: true
                                    },
                                    autoRemove: false,
                                    instanceData: {},
                                    timing: {
                                      startDelay: 0,
                                      autoStart: true
                                    }
                                  }];

                                  console.log("[PANEL] Aggiungendo template vuoto (tab Sorgente):", templatesDetails);

                                  // Aggiorniamo lo stato con il nuovo array di template
                                  handleChange('templatesDetails', templatesDetails);

                                  // Assicuriamoci che templateDetails sia null per evitare confusione
                                  if (currentItem.data.templateDetails) {
                                    handleChange('templateDetails', null);
                                  }
                                }
                              } else {
                                // Rimuoviamo tutti i template
                                console.log("[PANEL] Rimuovendo tutti i template (tab Sorgente)");
                                handleChange('templatesDetails', []);
                                handleChange('templateDetails', null);
                              }
                            }}
                            disabled={!canEdit || loading}
                          />
                        }
                        label="Includi Template"
                      />
                    </FormControl>
                  </>
                )}
              </Grid>
            </Grid>
          )}

          {/* Tab: Timing */}
          {activeTab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Orario di Start"
                  fullWidth
                  value={currentItem.data.timing?.startTime || currentItem.data.startTime || '00:00:00'}
                  onChange={(e) => {
                    // Se esiste timing, aggiorna il campo timing.startTime
                    if (currentItem.data.timing) {
                      const newTiming = {
                        ...currentItem.data.timing,
                        startTime: e.target.value
                      };
                      handleChange('timing', newTiming);
                    } else {
                      // Altrimenti aggiorna il campo startTime direttamente
                      handleChange('startTime', e.target.value);
                    }
                  }}
                  margin="normal"
                  placeholder="00:00:00"
                  disabled={!canEdit || loading}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Durata"
                  fullWidth
                  value={currentItem.data.timing?.duration || currentItem.data.duration || '00:00:00'}
                  onChange={(e) => {
                    // Se esiste timing, aggiorna il campo timing.duration
                    if (currentItem.data.timing) {
                      const newTiming = {
                        ...currentItem.data.timing,
                        duration: e.target.value
                      };
                      handleChange('timing', newTiming);
                    } else {
                      // Altrimenti aggiorna il campo duration direttamente
                      handleChange('duration', e.target.value);
                    }
                  }}
                  margin="normal"
                  placeholder="00:01:00"
                  disabled={!canEdit || loading}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Punto IN"
                  fullWidth
                  value={currentItem.data.timing?.inPoint || currentItem.data.inPoint || '00:00:00:00'}
                  onChange={(e) => {
                    // Se esiste timing, aggiorna il campo timing.inPoint
                    if (currentItem.data.timing) {
                      const newTiming = {
                        ...currentItem.data.timing,
                        inPoint: e.target.value
                      };
                      handleChange('timing', newTiming);
                    } else {
                      // Altrimenti aggiorna il campo inPoint direttamente
                      handleChange('inPoint', e.target.value);
                    }
                  }}
                  margin="normal"
                  placeholder="00:00:00:00"
                  disabled={!canEdit || loading}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Punto OUT"
                  fullWidth
                  value={currentItem.data.timing?.outPoint || currentItem.data.outPoint || '00:00:00:00'}
                  onChange={(e) => {
                    // Se esiste timing, aggiorna il campo timing.outPoint
                    if (currentItem.data.timing) {
                      const newTiming = {
                        ...currentItem.data.timing,
                        outPoint: e.target.value
                      };
                      handleChange('timing', newTiming);
                    } else {
                      // Altrimenti aggiorna il campo outPoint direttamente
                      handleChange('outPoint', e.target.value);
                    }
                  }}
                  margin="normal"
                  placeholder="00:00:00:00"
                  disabled={!canEdit || loading}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab: Note */}
          {activeTab === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Note"
                  fullWidth
                  multiline
                  rows={8}
                  value={currentItem.data.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  margin="normal"
                  disabled={!canEdit || loading}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab: Dati Template */}
          {activeTab === 4 && currentItem.type === 'TEMPLATE' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Dati Template (JSON)"
                  fullWidth
                  multiline
                  rows={12}
                  value={JSON.stringify(currentItem.data.data || {}, null, 2)}
                  onChange={(e) => handleJsonDataChange(e.target.value)}
                  margin="normal"
                  disabled={!canEdit || loading}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab: Media per le storie */}
          {activeTab === 5 && currentItem.type === 'STORY' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Media associato alla storia</Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!(currentItem.data.mediaDetails && currentItem.data.mediaDetails.clipPath)}
                      onChange={(e) => {
                        const newMediaDetails = e.target.checked
                          ? {
                              clipPath: '',
                              loop: false,
                              autoNext: false,
                              channel: currentItem.data.casparcgConfig?.channel || 1,
                              layer: currentItem.data.casparcgConfig?.layer || 10
                            }
                          : null;
                        handleChange('mediaDetails', newMediaDetails);
                      }}
                      disabled={!canEdit || loading}
                    />
                  }
                  label="Includi Media"
                />

                {currentItem.data.mediaDetails && (
                  <Box sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    mt: 2
                  }}>
                    <TextField
                      label="Path Media"
                      fullWidth
                      value={currentItem.data.mediaDetails.clipPath || ''}
                      onChange={(e) => {
                        const newMediaDetails = {
                          ...currentItem.data.mediaDetails,
                          clipPath: e.target.value
                        };
                        handleChange('mediaDetails', newMediaDetails);
                      }}
                      margin="normal"
                      disabled={!canEdit || loading}
                    />

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onBrowseMedia({
                        ...currentItem,
                        type: 'MEDIA',
                        data: {
                          ...currentItem.data,
                          clip: currentItem.data.mediaDetails.clipPath
                        }
                      }, true)} // Passiamo true per indicare che è per una storia
                      disabled={!canEdit || loading}
                      sx={{ mt: 1 }}
                    >
                      Seleziona Media
                    </Button>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Configurazione CasparCG
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Channel"
                          type="number"
                          fullWidth
                          value={currentItem.data.mediaDetails.channel || currentItem.data.casparcgConfig?.channel || 1}
                          onChange={(e) => {
                            const newMediaDetails = {
                              ...currentItem.data.mediaDetails,
                              channel: parseInt(e.target.value) || 1
                            };
                            handleChange('mediaDetails', newMediaDetails);
                          }}
                          margin="normal"
                          disabled={!canEdit || loading}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Layer"
                          type="number"
                          fullWidth
                          value={currentItem.data.mediaDetails.layer || currentItem.data.casparcgConfig?.layer || 10}
                          onChange={(e) => {
                            const newMediaDetails = {
                              ...currentItem.data.mediaDetails,
                              layer: parseInt(e.target.value) || 10
                            };
                            handleChange('mediaDetails', newMediaDetails);
                          }}
                          margin="normal"
                          disabled={!canEdit || loading}
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Opzioni di Playback
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!currentItem.data.mediaDetails.loop}
                              onChange={(e) => {
                                const newMediaDetails = {
                                  ...currentItem.data.mediaDetails,
                                  loop: e.target.checked
                                };
                                handleChange('mediaDetails', newMediaDetails);
                              }}
                              disabled={!canEdit || loading}
                            />
                          }
                          label="Loop"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!currentItem.data.mediaDetails.autoNext}
                              onChange={(e) => {
                                const newMediaDetails = {
                                  ...currentItem.data.mediaDetails,
                                  autoNext: e.target.checked
                                };
                                handleChange('mediaDetails', newMediaDetails);
                              }}
                              disabled={!canEdit || loading}
                            />
                          }
                          label="Auto Next"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}

          {/* Tab: Template per le storie */}
          {activeTab === 4 && currentItem.type === 'STORY' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Template associati alla storia</Typography>

                {/* Debug info */}
                <Box sx={{ mb: 2, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  <Typography variant="caption" component="div">
                    Debug: templatesDetails è {currentItem.data.templatesDetails ?
                      `un array con ${currentItem.data.templatesDetails.length} elementi` :
                      'null o undefined'}
                  </Typography>
                  <Typography variant="caption" component="div">
                    Debug: templateDetails è {currentItem.data.templateDetails ?
                      `un oggetto con templateFile: ${currentItem.data.templateDetails.templateFile || 'vuoto'}` :
                      'null o undefined'}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      console.log("[PANEL] Forzando creazione template vuoto");
                      const templatesDetails = [{
                        templateFile: '',
                        casparcgConfig: {
                          channel: currentItem.data.casparcgConfig?.channel || 1,
                          layer: 20,
                          cgLayer: 1,
                          playOnLoad: true
                        },
                        autoRemove: false,
                        instanceData: {},
                        timing: {
                          startDelay: 0,
                          autoStart: true
                        }
                      }];
                      handleChange('templatesDetails', templatesDetails);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Forza creazione template
                  </Button>
                </Box>

                {/* Checkbox per includere template */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!(currentItem.data.templatesDetails && currentItem.data.templatesDetails.length > 0)}
                      onChange={(e) => {
                        console.log("[PANEL] Cambio stato checkbox Includi Template:", {
                          checked: e.target.checked,
                          currentTemplatesDetails: currentItem.data.templatesDetails
                        });

                        if (e.target.checked) {
                          // Se non ci sono già template, creiamo un array con un template vuoto
                          if (!currentItem.data.templatesDetails || currentItem.data.templatesDetails.length === 0) {
                            const templatesDetails = [{
                              templateFile: '',
                              casparcgConfig: {
                                channel: currentItem.data.casparcgConfig?.channel || 1,
                                layer: 20,
                                cgLayer: 1,
                                playOnLoad: true
                              },
                              autoRemove: false,
                              instanceData: {},
                              timing: {
                                startDelay: 0,
                                autoStart: true
                              }
                            }];

                            console.log("[PANEL] Aggiungendo template vuoto:", templatesDetails);

                            // Aggiorniamo lo stato con il nuovo array di template
                            handleChange('templatesDetails', templatesDetails);

                            // Assicuriamoci che templateDetails sia null per evitare confusione
                            if (currentItem.data.templateDetails) {
                              handleChange('templateDetails', null);
                            }
                          }
                        } else {
                          // Rimuoviamo tutti i template
                          console.log("[PANEL] Rimuovendo tutti i template");
                          handleChange('templatesDetails', []);
                          handleChange('templateDetails', null);
                        }
                      }}
                      disabled={!canEdit || loading}
                    />
                  }
                  label="Includi Template"
                />

                {/* Visualizzazione dei template nel nuovo formato (templatesDetails) */}
                {(currentItem.data.templatesDetails && currentItem.data.templatesDetails.length > 0) ? (
                  <>
                    {/* Intestazione con conteggio template */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                      mb: 1
                    }}>
                      <Typography variant="subtitle1">
                        Template associati ({currentItem.data.templatesDetails.length})
                      </Typography>

                      {/* Pulsante per rimuovere tutti i template */}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          console.log("[PANEL] Rimuovendo tutti i template dal pulsante");
                          const newTemplatesDetails = [];
                          handleChange('templatesDetails', newTemplatesDetails);
                        }}
                        disabled={!canEdit || loading}
                      >
                        Rimuovi tutti
                      </Button>
                    </Box>

                    {/* Lista dei template */}
                    {currentItem.data.templatesDetails.map((template, index) => (
                      <Box key={index} sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        mt: 2,
                        position: 'relative',
                        bgcolor: 'background.paper'
                      }}>
                        {/* Intestazione del template */}
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1
                        }}>
                          <Typography variant="subtitle2">
                            Template {index + 1}
                            {template.templateFile && `: ${template.templateFile.split('/').pop()}`}
                          </Typography>

                          {/* Pulsante per rimuovere il template */}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              console.log(`[PANEL] Rimuovendo template ${index}:`, template);
                              const newTemplatesDetails = [...currentItem.data.templatesDetails];
                              newTemplatesDetails.splice(index, 1);
                              handleChange('templatesDetails', newTemplatesDetails);
                            }}
                            disabled={!canEdit || loading}
                            title="Rimuovi template"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {/* Selezione del file template */}
                        <TextField
                          label="Path Template"
                          fullWidth
                          value={template.templateFile || ''}
                          onChange={(e) => {
                            console.log(`[PANEL] Aggiornando path template ${index}:`, e.target.value);
                            const newTemplatesDetails = [...currentItem.data.templatesDetails];
                            newTemplatesDetails[index] = {
                              ...newTemplatesDetails[index],
                              templateFile: e.target.value
                            };
                            handleChange('templatesDetails', newTemplatesDetails);
                          }}
                          margin="normal"
                          disabled={!canEdit || loading}
                        />

                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => {
                            console.log(`[PANEL] Aprendo selettore template per template ${index}`);
                            onBrowseTemplate({
                              ...currentItem,
                              type: 'TEMPLATE',
                              data: {
                                ...currentItem.data,
                                template: template.templateFile
                              }
                            }, true, index); // Passiamo true per indicare che è per una storia e l'indice del template
                          }}
                          disabled={!canEdit || loading}
                          sx={{ mt: 1 }}
                        >
                          Seleziona Template
                        </Button>

                        {/* Configurazione CasparCG */}
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Configurazione CasparCG
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <TextField
                              label="Channel"
                              type="number"
                              fullWidth
                              value={template.casparcgConfig?.channel || currentItem.data.casparcgConfig?.channel || 1}
                              onChange={(e) => {
                                console.log(`[PANEL] Aggiornando channel per template ${index}:`, e.target.value);
                                const newTemplatesDetails = [...currentItem.data.templatesDetails];
                                newTemplatesDetails[index] = {
                                  ...newTemplatesDetails[index],
                                  casparcgConfig: {
                                    ...newTemplatesDetails[index].casparcgConfig,
                                    channel: parseInt(e.target.value) || 1
                                  }
                                };
                                handleChange('templatesDetails', newTemplatesDetails);
                              }}
                              margin="normal"
                              disabled={!canEdit || loading}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <TextField
                              label="Layer"
                              type="number"
                              fullWidth
                              value={template.casparcgConfig?.layer || 20}
                              onChange={(e) => {
                                console.log(`[PANEL] Aggiornando layer per template ${index}:`, e.target.value);
                                const newTemplatesDetails = [...currentItem.data.templatesDetails];
                                newTemplatesDetails[index] = {
                                  ...newTemplatesDetails[index],
                                  casparcgConfig: {
                                    ...newTemplatesDetails[index].casparcgConfig,
                                    layer: parseInt(e.target.value) || 20
                                  }
                                };
                                handleChange('templatesDetails', newTemplatesDetails);
                              }}
                              margin="normal"
                              disabled={!canEdit || loading}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <TextField
                              label="CG Layer"
                              type="number"
                              fullWidth
                              value={template.casparcgConfig?.cgLayer || 1}
                              onChange={(e) => {
                                console.log(`[PANEL] Aggiornando cgLayer per template ${index}:`, e.target.value);
                                const newTemplatesDetails = [...currentItem.data.templatesDetails];
                                newTemplatesDetails[index] = {
                                  ...newTemplatesDetails[index],
                                  casparcgConfig: {
                                    ...newTemplatesDetails[index].casparcgConfig,
                                    cgLayer: parseInt(e.target.value) || 1
                                  }
                                };
                                handleChange('templatesDetails', newTemplatesDetails);
                              }}
                              margin="normal"
                              disabled={!canEdit || loading}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={template.casparcgConfig?.playOnLoad !== false}
                                  onChange={(e) => {
                                    console.log(`[PANEL] Aggiornando playOnLoad per template ${index}:`, e.target.checked);
                                    const newTemplatesDetails = [...currentItem.data.templatesDetails];
                                    newTemplatesDetails[index] = {
                                      ...newTemplatesDetails[index],
                                      casparcgConfig: {
                                        ...newTemplatesDetails[index].casparcgConfig,
                                        playOnLoad: e.target.checked
                                      }
                                    };
                                    handleChange('templatesDetails', newTemplatesDetails);
                                  }}
                                  disabled={!canEdit || loading}
                                  size="small"
                                />
                              }
                              label="Play On Load"
                            />
                          </Grid>
                        </Grid>

                        {/* Temporizzazione */}
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Temporizzazione
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              label="Ritardo (secondi)"
                              type="number"
                              fullWidth
                              value={template.timing?.startDelay || 0}
                              onChange={(e) => {
                                console.log(`[PANEL] Aggiornando startDelay per template ${index}:`, e.target.value);
                                const newTemplatesDetails = [...currentItem.data.templatesDetails];
                                newTemplatesDetails[index] = {
                                  ...newTemplatesDetails[index],
                                  timing: {
                                    ...newTemplatesDetails[index].timing,
                                    startDelay: parseInt(e.target.value) || 0
                                  }
                                };
                                handleChange('templatesDetails', newTemplatesDetails);
                              }}
                              margin="normal"
                              disabled={!canEdit || loading}
                              size="small"
                              helperText="Secondi di ritardo dall'inizio del media"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={template.timing?.autoStart !== false}
                                  onChange={(e) => {
                                    console.log(`[PANEL] Aggiornando autoStart per template ${index}:`, e.target.checked);
                                    const newTemplatesDetails = [...currentItem.data.templatesDetails];
                                    newTemplatesDetails[index] = {
                                      ...newTemplatesDetails[index],
                                      timing: {
                                        ...newTemplatesDetails[index].timing,
                                        autoStart: e.target.checked
                                      }
                                    };
                                    handleChange('templatesDetails', newTemplatesDetails);
                                  }}
                                  disabled={!canEdit || loading}
                                  size="small"
                                />
                              }
                              label="Avvio Automatico"
                            />
                          </Grid>
                        </Grid>

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!template.autoRemove}
                              onChange={(e) => {
                                console.log(`[PANEL] Aggiornando autoRemove per template ${index}:`, e.target.checked);
                                const newTemplatesDetails = [...currentItem.data.templatesDetails];
                                newTemplatesDetails[index] = {
                                  ...newTemplatesDetails[index],
                                  autoRemove: e.target.checked
                                };
                                handleChange('templatesDetails', newTemplatesDetails);
                              }}
                              disabled={!canEdit || loading}
                              size="small"
                            />
                          }
                          label="Auto Remove"
                        />

                        {/* Dati Template */}
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Dati Template
                        </Typography>
                        <TextField
                          label="Dati Template (JSON)"
                          fullWidth
                          multiline
                          rows={4}
                          value={JSON.stringify(template.instanceData || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const newData = JSON.parse(e.target.value);
                              console.log(`[PANEL] Aggiornando instanceData per template ${index}:`, newData);
                              const newTemplatesDetails = [...currentItem.data.templatesDetails];
                              newTemplatesDetails[index] = {
                                ...newTemplatesDetails[index],
                                instanceData: newData
                              };
                              handleChange('templatesDetails', newTemplatesDetails);
                            } catch (error) {
                              console.error('[PANEL] JSON non valido:', error);
                            }
                          }}
                          margin="normal"
                          disabled={!canEdit || loading}
                          size="small"
                        />
                      </Box>
                    ))}

                    {/* Pulsante per aggiungere un nuovo template */}
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => {
                        console.log("[PANEL] Aggiungendo nuovo template");
                        const newTemplatesDetails = [...currentItem.data.templatesDetails];
                        newTemplatesDetails.push({
                          templateFile: '',
                          casparcgConfig: {
                            channel: currentItem.data.casparcgConfig?.channel || 1,
                            layer: 20,
                            cgLayer: 1,
                            playOnLoad: true
                          },
                          autoRemove: false,
                          instanceData: {},
                          timing: {
                            startDelay: 0,
                            autoStart: true
                          }
                        });
                        handleChange('templatesDetails', newTemplatesDetails);
                      }}
                      disabled={!canEdit || loading}
                      sx={{ mt: 2 }}
                    >
                      Aggiungi Template
                    </Button>
                  </>
                ) : (
                  <Box sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                      Nessun template associato a questa storia.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => {
                        console.log("[PANEL] Aggiungendo primo template");
                        const templatesDetails = [{
                          templateFile: '',
                          casparcgConfig: {
                            channel: currentItem.data.casparcgConfig?.channel || 1,
                            layer: 20,
                            cgLayer: 1,
                            playOnLoad: true
                          },
                          autoRemove: false,
                          instanceData: {},
                          timing: {
                            startDelay: 0,
                            autoStart: true
                          }
                        }];
                        handleChange('templatesDetails', templatesDetails);
                      }}
                      disabled={!canEdit || loading}
                    >
                      Aggiungi Template
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>

      {/* Footer con pulsanti di azione */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button onClick={onClose} sx={{ mr: 1 }}>
          Annulla
        </Button>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!canEdit || loading}
          sx={{ mr: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Salva'}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveAndClose}
          disabled={!canEdit || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Salva e Chiudi'}
        </Button>
      </Box>
    </Drawer>
  );
};

export default ItemEditPanel;
