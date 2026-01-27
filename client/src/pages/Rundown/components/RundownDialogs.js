import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useRundown } from '../../../contexts/RundownContext';

import RundownSettings from './RundownSettings';
import EditItemDialog from './EditItemDialog';

// Funzione helper per determinare il tipo di template basandosi sul nome
const getTemplateTypeFromName = (templateName) => {
  if (!templateName) return 'generic';
  const lowerName = templateName.toLowerCase();
  if (lowerName.includes('ticker')) return 'ticker';
  if (lowerName.includes('lower') && lowerName.includes('third')) return 'lower_third';
  if (lowerName.includes('logo')) return 'logo';
  if (lowerName.includes('text') && !lowerName.includes('lower_third') && !lowerName.includes('ticker')) return 'text';
  return 'generic';
};

/**
 * Componente per la gestione dei dialoghi per aggiungere/modificare elementi.
 */
const RundownDialogs = ({
  mediaList,
  templateList,
  showNotification,
  dialogsState
}) => {
  const {
    addMedia,
    addTemplate,
  } = useRundown();

  const {
    addMediaDialogOpen,
    setAddMediaDialogOpen,
    addTemplateDialogOpen,
    setAddTemplateDialogOpen,
    addMediaWithTemplateDialogOpen,
    setAddMediaWithTemplateDialogOpen,
    editItemDialogOpen,
    setEditItemDialogOpen,
    // setLinkTemplateDialogOpen non utilizzato
    settingsDialogOpen,
    setSettingsDialogOpen,
    selectedItemId,
    setSelectedItemId
  } = dialogsState;

  // Stato per i form comuni
  const [selectedMedia, setSelectedMedia] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [selectedLayer, setSelectedLayer] = useState(10);
  const [selectedTemplateLayer, setSelectedTemplateLayer] = useState(20);

  // Stati per i campi specifici del template (dialogo "Aggiungi Template")
  const [currentTemplateType, setCurrentTemplateType] = useState('generic');
  const [templateFieldText, setTemplateFieldText] = useState('');
  const [templateFieldTitle, setTemplateFieldTitle] = useState('');
  const [templateFieldSubtitle, setTemplateFieldSubtitle] = useState('');
  const [templateDataJson, setTemplateDataJson] = useState('{}');

  // Stati specifici per il dialogo "Aggiungi Media con Template"
  const [selectedLinkedTemplate, setSelectedLinkedTemplate] = useState('');
  const [linkedTemplateGeneralLayer, setLinkedTemplateGeneralLayer] = useState(20);
  const [currentLinkedTemplateType, setCurrentLinkedTemplateType] = useState('generic');
  const [linkedTemplateFieldText, setLinkedTemplateFieldText] = useState('');
  const [linkedTemplateFieldTitle, setLinkedTemplateFieldTitle] = useState('');
  const [linkedTemplateFieldSubtitle, setLinkedTemplateFieldSubtitle] = useState('');
  const [linkedTemplateDataJson, setLinkedTemplateDataJson] = useState('{}');


  useEffect(() => {
    if (selectedTemplate && addTemplateDialogOpen) {
      const type = getTemplateTypeFromName(selectedTemplate);
      setCurrentTemplateType(type);
      setTemplateFieldText('');
      setTemplateFieldTitle('');
      setTemplateFieldSubtitle('');
      setTemplateDataJson('{}');
    }
  }, [selectedTemplate, addTemplateDialogOpen]);

  useEffect(() => {
    if (selectedLinkedTemplate && addMediaWithTemplateDialogOpen) {
        const type = getTemplateTypeFromName(selectedLinkedTemplate);
        setCurrentLinkedTemplateType(type);
        setLinkedTemplateFieldText('');
        setLinkedTemplateFieldTitle('');
        setLinkedTemplateFieldSubtitle('');
        setLinkedTemplateDataJson('{}');
    }
  }, [selectedLinkedTemplate, addMediaWithTemplateDialogOpen]);


  const handleAddMediaDialogClose = () => {
    setAddMediaDialogOpen(false);
    setSelectedMedia('');
  };

  const handleAddTemplateDialogClose = () => {
    setAddTemplateDialogOpen(false);
    setSelectedTemplate('');
    setCurrentTemplateType('generic');
    setTemplateFieldText('');
    setTemplateFieldTitle('');
    setTemplateFieldSubtitle('');
    setTemplateDataJson('{}');
  };

  const handleAddMediaWithTemplateDialogClose = () => {
    setAddMediaWithTemplateDialogOpen(false);
    setSelectedMedia('');
    setSelectedLinkedTemplate('');
    setCurrentLinkedTemplateType('generic');
    setLinkedTemplateFieldText('');
    setLinkedTemplateFieldTitle('');
    setLinkedTemplateFieldSubtitle('');
    setLinkedTemplateDataJson('{}');
    setLinkedTemplateGeneralLayer(20);
  };

  const handleEditItemDialogClose = () => {
    setEditItemDialogOpen(false);
    setTimeout(() => {
      setSelectedItemId(null);
    }, 100);
  };

  const handleAddMedia = () => {
    if (!selectedMedia) {
        showNotification('Seleziona un media.', 'warning');
        return;
    }
    const fileName = selectedMedia.split('/').pop();
    const customName = document.getElementById('mediaCustomName')?.value || fileName;
    const startTime = document.getElementById('mediaStartTime')?.value || '00:00:00';
    const duration = document.getElementById('mediaDuration')?.value || '00:05:00';
    const location = document.getElementById('mediaLocation')?.value || selectedMedia;
    const note = document.getElementById('mediaNote')?.value || '';
    const inPoint = document.getElementById('mediaInPoint')?.value || '00:00:00';
    const outPoint = document.getElementById('mediaOutPoint')?.value || '';
    const loop = document.getElementById('mediaLoop')?.checked || false;

    const mediaData = {
      clip: selectedMedia,
      channel: selectedChannel,
      layer: selectedLayer,
      name: fileName,
      customName: customName,
      loop: loop,
      startTime: startTime,
      duration: duration,
      location: location,
      note: note,
      inPoint: inPoint,
      outPoint: outPoint,
      linkedTemplate: null
    };
    addMedia(mediaData);
    handleAddMediaDialogClose();
    showNotification('Media aggiunto al rundown', 'success');
  };

  const handleAddTemplate = () => {
    if (!selectedTemplate) {
        showNotification('Seleziona un template.', 'warning');
        return;
    }
    const templateName = selectedTemplate.split('/').pop();
    const customName = document.getElementById('templateCustomName')?.value || templateName;
    const startTime = document.getElementById('templateStartTime')?.value || '00:00:00';
    const duration = document.getElementById('templateDuration')?.value || '00:01:00';
    const location = document.getElementById('templateLocation')?.value || selectedTemplate;
    const note = document.getElementById('templateNote')?.value || '';
    const inPoint = document.getElementById('templateInPoint')?.value || '00:00:00';
    const outPoint = document.getElementById('templateOutPoint')?.value || '';
    const cgLayer = parseInt(document.getElementById('cgLayer')?.value) || 1;
    const playOnLoad = document.getElementById('playOnLoad')?.checked !== false;

    let templateDataObject = {};
    try {
        if (currentTemplateType === 'ticker') {
            templateDataObject = { text: templateFieldText || "" };
        } else if (currentTemplateType === 'lower_third') {
            templateDataObject = { title: templateFieldTitle || "", subtitle: templateFieldSubtitle || "" };
        } else if (currentTemplateType === 'logo') {
            templateDataObject = { text: templateFieldText || "" };
        } else if (currentTemplateType === 'text') {
            templateDataObject = { text: templateFieldText || "" };
        } else { // generic
            templateDataObject = templateDataJson ? JSON.parse(templateDataJson) : {};
        }
    } catch (error) {
        showNotification('Errore nel formato JSON dei dati del template.', 'error');
        console.error("Errore parsing JSON per template:", error);
        return;
    }

    const templateParams = {
      template: selectedTemplate,
      channel: selectedChannel,
      layer: selectedTemplateLayer,
      cgLayer: cgLayer,
      playOnLoad: playOnLoad,
      name: templateName,
      customName: customName,
      data: templateDataObject,
      startTime: startTime,
      duration: duration,
      location: location,
      note: note,
      inPoint: inPoint,
      outPoint: outPoint
    };
    addTemplate(templateParams);
    handleAddTemplateDialogClose();
    showNotification('Template aggiunto al rundown', 'success');
  };

  const handleAddMediaWithTemplate = () => {
    if (!selectedMedia || !selectedLinkedTemplate) {
        showNotification('Seleziona sia un media che un template annidato.', 'warning');
        return;
    }

    const mediaFileName = selectedMedia.split('/').pop();
    const templateFileName = selectedLinkedTemplate.split('/').pop();

    const customName = document.getElementById('mediaWithTemplateCustomName')?.value || mediaFileName;
    const mediaStartTime = document.getElementById('mediaWithTemplateStartTime')?.value || '00:00:00';
    const mediaDuration = document.getElementById('mediaWithTemplateDuration')?.value || '00:05:00';
    const mediaLocation = document.getElementById('mediaWithTemplateLocation')?.value || selectedMedia;
    const mediaNote = document.getElementById('mediaWithTemplateNote')?.value || '';
    const mediaInPoint = document.getElementById('mediaWithTemplateInPoint')?.value || '00:00:00';
    const mediaOutPoint = document.getElementById('mediaWithTemplateOutPoint')?.value || '';
    const mediaLoop = document.getElementById('mediaWithTemplateLoop')?.checked || false;

    const linkedTemplateCgLayer = parseInt(document.getElementById('mediaWithTemplateCgLayer')?.value) || 1;
    const linkedTemplatePlayOnLoad = document.getElementById('mediaWithTemplatePlayOnLoad')?.checked !== false;
    const linkedTemplateDelay = parseInt(document.getElementById('mediaWithTemplateDelay')?.value) || 0;

    const mediaChannel = selectedChannel;
    const mediaLayer = selectedLayer;
    const actualLinkedTemplateGeneralLayer = linkedTemplateGeneralLayer;

    let linkedTemplateDataObject = {};
    try {
        if (currentLinkedTemplateType === 'ticker') {
            linkedTemplateDataObject = { text: linkedTemplateFieldText || "" };
        } else if (currentLinkedTemplateType === 'lower_third') {
            linkedTemplateDataObject = { title: linkedTemplateFieldTitle || "", subtitle: linkedTemplateFieldSubtitle || "" };
        } else if (currentLinkedTemplateType === 'logo') {
            linkedTemplateDataObject = { text: linkedTemplateFieldText || "" };
        } else if (currentLinkedTemplateType === 'text') {
            linkedTemplateDataObject = { text: linkedTemplateFieldText || "" };
        } else { // generic
            linkedTemplateDataObject = linkedTemplateDataJson ? JSON.parse(linkedTemplateDataJson) : {};
        }
    } catch (error) {
        showNotification('Errore nel formato JSON dei dati del template annidato.', 'error');
        console.error("Errore parsing JSON per template annidato:", error);
        return;
    }

    const mediaData = {
      clip: selectedMedia,
      channel: mediaChannel,
      layer: mediaLayer,
      name: mediaFileName,
      customName: customName,
      loop: mediaLoop,
      startTime: mediaStartTime,
      duration: mediaDuration,
      location: mediaLocation,
      note: mediaNote,
      inPoint: mediaInPoint,
      outPoint: mediaOutPoint,
      linkedTemplate: {
        template: selectedLinkedTemplate,
        channel: mediaChannel,
        layer: actualLinkedTemplateGeneralLayer,
        cgLayer: linkedTemplateCgLayer,
        playOnLoad: linkedTemplatePlayOnLoad,
        name: templateFileName,
        data: linkedTemplateDataObject,
        delay: linkedTemplateDelay
      }
    };

    addMedia(mediaData);
    handleAddMediaWithTemplateDialogClose();
    showNotification('Media con template annidato aggiunto al rundown', 'success');
  };

  return (
    <>
      {/* Dialog per le impostazioni del Rundown */}
      <RundownSettings
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
      />

      {/* Dialog per aggiungere un media con template annidato */}
      <Dialog
        open={addMediaWithTemplateDialogOpen}
        onClose={handleAddMediaWithTemplateDialogClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="form-dialog-title-media-template"
      >
        <DialogTitle id="form-dialog-title-media-template">Aggiungi Media con Template Annidato</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Sezione Media */}
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 1, mb: 1, color: "primary.main" }}>
                    Configurazione Media
                </Typography>
                <Divider />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="select-media-label">Media</InputLabel>
                <Select
                  labelId="select-media-label"
                  value={selectedMedia}
                  onChange={(e) => setSelectedMedia(e.target.value)}
                  label="Media"
                >
                  {mediaList.map((media) => {
                    const mediaName = typeof media === 'string' ? media : (media?.name || media?.path || 'Media sconosciuto');
                    const mediaValue = typeof media === 'string' ? media : (media?.name || media?.path || media);
                    const displayName = typeof media === 'string' ? media.split('/').pop() : (media?.name || 'Media sconosciuto');
                    return (
                      <MenuItem key={mediaName} value={mediaValue}>
                        {displayName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
             <Grid item xs={12} md={6}>
                <TextField
                    id="mediaWithTemplateCustomName"
                    label="Nome Personalizzato Media"
                    fullWidth
                    margin="normal"
                    placeholder={selectedMedia ? selectedMedia.split('/').pop() : "Nome personalizzato"}
                    helperText="Lascia vuoto per usare il nome del file media"
                />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="mediaWithTemplateStartTime"
                label="Orario Inizio Media"
                fullWidth
                margin="normal"
                defaultValue="00:00:00"
                inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }}
                helperText="Formato HH:MM:SS"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="mediaWithTemplateDuration"
                label="Durata Media"
                fullWidth
                margin="normal"
                defaultValue="00:05:00"
                inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }}
                helperText="Formato HH:MM:SS"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="mediaWithTemplateLocation"
                label="Percorso Media"
                fullWidth
                margin="normal"
                defaultValue={selectedMedia || ""}
                InputLabelProps={{ shrink: !!selectedMedia }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="mediaWithTemplateNote"
                label="Note Media"
                fullWidth
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="mediaWithTemplateInPoint"
                label="IN Media"
                fullWidth
                margin="normal"
                defaultValue="00:00:00"
                inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }}
                helperText="Formato HH:MM:SS"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="mediaWithTemplateOutPoint"
                label="OUT Media"
                fullWidth
                margin="normal"
                inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }}
                helperText="Formato HH:MM:SS (opzionale)"
              />
            </Grid>
             <Grid item xs={12}>
                <FormControlLabel
                    control={<Checkbox id="mediaWithTemplateLoop" />}
                    label="Riproduzione media in loop"
                />
            </Grid>

            {/* Sezione Template Annidato */}
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: "primary.main" }}>
                    Configurazione Template Annidato
                </Typography>
                <Divider />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="select-linked-template-label">Template Annidato</InputLabel>
                <Select
                  labelId="select-linked-template-label"
                  value={selectedLinkedTemplate}
                  onChange={(e) => setSelectedLinkedTemplate(e.target.value)}
                  label="Template Annidato"
                >
                  {templateList.map((template) => {
                    const templateName = typeof template === 'string' ? template : (template?.name || template?.path || 'Template sconosciuto');
                    const templateValue = typeof template === 'string' ? template : (template?.name || template?.path || template);
                    const displayName = typeof template === 'string' ? template.split('/').pop() : (template?.name || 'Template sconosciuto');
                    return (
                      <MenuItem key={templateName} value={templateValue}>
                        {displayName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
                <TextField
                    id="mediaWithTemplate_linkedTemplateGeneralLayer"
                    label="Layer Video Template Ann."
                    type="number"
                    fullWidth
                    margin="normal"
                    value={linkedTemplateGeneralLayer}
                    onChange={(e) => setLinkedTemplateGeneralLayer(parseInt(e.target.value) || 20)}
                    InputProps={{ inputProps: { min: 1 } }}
                    helperText="Layer video per il template annidato"
                />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="mediaWithTemplateCgLayer"
                label="CG Layer Template Ann."
                type="number"
                fullWidth
                margin="normal"
                defaultValue="1"
                InputProps={{ inputProps: { min: 1 } }}
                helperText="Layer grafico specifico del template"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                id="mediaWithTemplateDelay"
                label="Ritardo Template Ann. (ms)"
                type="number"
                fullWidth
                margin="normal"
                defaultValue="0"
                helperText="Ritardo in millisecondi"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
             <Grid item xs={12}>
                <FormControlLabel
                    control={<Checkbox id="mediaWithTemplatePlayOnLoad" defaultChecked />}
                    label="Play template annidato all'avvio del media"
                />
            </Grid>

            {selectedLinkedTemplate && (
                 <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                        Dati per "{selectedLinkedTemplate.split('/').pop()}" (Tipo: {currentLinkedTemplateType})
                    </Typography>
                    {currentLinkedTemplateType === 'ticker' && (
                        <TextField
                            label="Testo Ticker Annidato"
                            fullWidth margin="normal" value={linkedTemplateFieldText}
                            onChange={(e) => setLinkedTemplateFieldText(e.target.value)}
                            multiline rows={3} helperText="Testo per il ticker annidato."
                        />
                    )}
                    {currentLinkedTemplateType === 'lower_third' && (
                        <>
                            <TextField
                                label="Titolo Annidato" fullWidth margin="normal" value={linkedTemplateFieldTitle}
                                onChange={(e) => setLinkedTemplateFieldTitle(e.target.value)}
                                helperText="Riga principale del lower third annidato."
                            />
                            <TextField
                                label="Sottotitolo Annidato" fullWidth margin="normal" value={linkedTemplateFieldSubtitle}
                                onChange={(e) => setLinkedTemplateFieldSubtitle(e.target.value)}
                                helperText="Riga secondaria del lower third annidato."
                            />
                        </>
                    )}
                    {currentLinkedTemplateType === 'logo' && (
                        <TextField
                            label="Testo/ID Logo Annidato" fullWidth margin="normal" value={linkedTemplateFieldText}
                            onChange={(e) => setLinkedTemplateFieldText(e.target.value)}
                            helperText="Identificativo o testo per il logo annidato."
                        />
                    )}
                    {currentLinkedTemplateType === 'text' && (
                        <TextField
                            label="Testo Generico Annidato" fullWidth margin="normal" value={linkedTemplateFieldText}
                            onChange={(e) => setLinkedTemplateFieldText(e.target.value)}
                            multiline rows={4} helperText="Contenuto testuale del template annidato."
                        />
                    )}
                    {currentLinkedTemplateType === 'generic' && (
                        <TextField
                            id="mediaWithTemplate_linkedTemplateDataJson"
                            label="Dati Template Annidato (JSON)"
                            multiline rows={3} fullWidth margin="normal" value={linkedTemplateDataJson}
                            onChange={(e) => setLinkedTemplateDataJson(e.target.value)}
                            placeholder='{"text":"Testo per template annidato"}'
                            helperText="Dati JSON per il template annidato."
                            />
                    )}
                </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddMediaWithTemplateDialogClose}>Annulla</Button>
          <Button onClick={handleAddMediaWithTemplate} variant="contained" color="primary">
            Aggiungi Media con Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per aggiungere un media semplice */}
      <Dialog
        open={addMediaDialogOpen}
        onClose={handleAddMediaDialogClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="form-dialog-title-media"
      >
        <DialogTitle id="form-dialog-title-media">Aggiungi Media</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="select-media-simple-label">Media</InputLabel>
                <Select
                  labelId="select-media-simple-label"
                  value={selectedMedia}
                  onChange={(e) => setSelectedMedia(e.target.value)}
                  label="Media"
                >
                  {mediaList.map((media) => {
                    const mediaName = typeof media === 'string' ? media : (media?.name || media?.path || 'Media sconosciuto');
                    const mediaValue = typeof media === 'string' ? media : (media?.name || media?.path || media);
                    const displayName = typeof media === 'string' ? media.split('/').pop() : (media?.name || 'Media sconosciuto');
                    return (
                      <MenuItem key={mediaName} value={mediaValue}>
                        {displayName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="mediaCustomName"
                label="Nome Personalizzato"
                fullWidth
                margin="normal"
                placeholder={selectedMedia ? selectedMedia.split('/').pop() : "Nome personalizzato"}
                helperText="Lascia vuoto per usare il nome del file"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField id="mediaStartTime" label="Orario Inizio" fullWidth margin="normal" defaultValue="00:00:00" inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }} helperText="HH:MM:SS"/>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField id="mediaDuration" label="Durata" fullWidth margin="normal" defaultValue="00:05:00" inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }} helperText="HH:MM:SS"/>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField id="mediaLocation" label="Percorso" fullWidth margin="normal" defaultValue={selectedMedia || ""} InputLabelProps={{ shrink: !!selectedMedia }}/>
            </Grid>
            <Grid item xs={12}>
              <TextField id="mediaNote" label="Note" fullWidth margin="normal" multiline rows={2}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField id="mediaInPoint" label="IN" fullWidth margin="normal" defaultValue="00:00:00" inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }} helperText="HH:MM:SS"/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField id="mediaOutPoint" label="OUT" fullWidth margin="normal" inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }} helperText="HH:MM:SS (opzionale)"/>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="select-channel-media-label">Canale</InputLabel>
                <Select labelId="select-channel-media-label" value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} label="Canale">
                  {[1, 2, 3, 4].map((c) => (<MenuItem key={`media-ch-${c}`} value={c}>{c}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="select-layer-media-label">Layer</InputLabel>
                <Select labelId="select-layer-media-label" value={selectedLayer} onChange={(e) => setSelectedLayer(e.target.value)} label="Layer">
                  {[10, 20, 30, 40, 50].map((l) => (<MenuItem key={`media-lay-${l}`} value={l}>{l}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', mt:1 }}>
              <FormControlLabel control={<Checkbox id="mediaLoop" />} label="Loop" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddMediaDialogClose}>Annulla</Button>
          <Button onClick={handleAddMedia} variant="contained" color="primary">
            Aggiungi Media
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per aggiungere un template semplice */}
      <Dialog
        open={addTemplateDialogOpen}
        onClose={handleAddTemplateDialogClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="form-dialog-title-template"
      >
        <DialogTitle id="form-dialog-title-template">Aggiungi Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="select-template-simple-label">Template</InputLabel>
                <Select
                  labelId="select-template-simple-label"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  label="Template"
                >
                  {templateList.map((template) => {
                    const templateName = typeof template === 'string' ? template : (template?.name || template?.path || 'Template sconosciuto');
                    const templateValue = typeof template === 'string' ? template : (template?.name || template?.path || template);
                    const displayName = typeof template === 'string' ? template.split('/').pop() : (template?.name || 'Template sconosciuto');
                    return (
                      <MenuItem key={templateName} value={templateValue}>
                        {displayName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField id="templateCustomName" label="Nome Personalizzato" fullWidth margin="normal" placeholder={selectedTemplate ? selectedTemplate.split('/').pop() : "Nome personalizzato"} helperText="Lascia vuoto per usare il nome del file"/>
            </Grid>
            <Grid item xs={12} md={4}><TextField id="templateStartTime" label="Orario Inizio" fullWidth margin="normal" defaultValue="00:00:00" inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }} helperText="HH:MM:SS"/></Grid>
            <Grid item xs={12} md={4}><TextField id="templateDuration" label="Durata" fullWidth margin="normal" defaultValue="00:01:00" inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }} helperText="HH:MM:SS"/></Grid>
            <Grid item xs={12} md={4}><TextField id="templateLocation" label="Percorso" fullWidth margin="normal" defaultValue={selectedTemplate || ""} InputLabelProps={{ shrink: !!selectedTemplate }}/></Grid>
            <Grid item xs={12}><TextField id="templateNote" label="Note" fullWidth margin="normal" multiline rows={2}/></Grid>
            <Grid item xs={12} md={6}><TextField id="templateInPoint" label="IN" fullWidth margin="normal" defaultValue="00:00:00" inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }} helperText="HH:MM:SS"/></Grid>
            <Grid item xs={12} md={6}><TextField id="templateOutPoint" label="OUT" fullWidth margin="normal" inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }} helperText="HH:MM:SS (opzionale)"/></Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="select-channel-template-label">Canale</InputLabel>
                <Select labelId="select-channel-template-label" value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} label="Canale">
                  {[1,2,3,4].map(c => <MenuItem key={`tpl-ch-${c}`} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="select-layer-template-label">Layer Video</InputLabel>
                <Select labelId="select-layer-template-label" value={selectedTemplateLayer} onChange={(e) => setSelectedTemplateLayer(e.target.value)} label="Layer Video">
                  {[10,20,30,40,50].map(l => <MenuItem key={`tpl-lay-${l}`} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}><TextField id="cgLayer" label="CG Layer" type="number" fullWidth margin="normal" defaultValue={1} InputProps={{ inputProps: { min: 1 }}} helperText="Layer grafico"/></Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', mt:1 }}><FormControlLabel control={<Checkbox id="playOnLoad" defaultChecked />} label="Play all'aggiunta" /></Grid>

            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Dati Template</Typography><Divider sx={{ mb: 2 }}/>
                {/* CORREZIONE: Assicurarsi che le stringhe siano pulite, specialmente quella con l'errore di parsing.
                    L'errore era alla colonna 86 della riga seguente (nello spazio di "Dati Template (JSON)").
                    Riscrivo la stringa per sicurezza, anche se visivamente sembra corretta. */}
                {selectedTemplate && currentTemplateType === 'generic' && (
                    <TextField
                        label="Dati Template (JSON)" // Stringa "pulita"
                        fullWidth
                        margin="normal"
                        multiline
                        rows={4}
                        value={templateDataJson}
                        onChange={(e) => setTemplateDataJson(e.target.value)}
                        placeholder='{"f0":"Testo"}'
                        helperText='Es. {"f0":"Valore"}' // Questa stringa sembra ok, ma l'errore era sul label.
                    />
                )}
                {selectedTemplate && currentTemplateType === 'ticker' && (<TextField label="Testo Ticker" fullWidth margin="normal" value={templateFieldText} onChange={(e) => setTemplateFieldText(e.target.value)} multiline rows={3}/>)}
                {selectedTemplate && currentTemplateType === 'lower_third' && (<><TextField label="Titolo" fullWidth margin="normal" value={templateFieldTitle} onChange={(e) => setTemplateFieldTitle(e.target.value)}/><TextField label="Sottotitolo" fullWidth margin="normal" value={templateFieldSubtitle} onChange={(e) => setTemplateFieldSubtitle(e.target.value)}/></>)}
                {selectedTemplate && currentTemplateType === 'logo' && (<TextField label="Testo/ID Logo" fullWidth margin="normal" value={templateFieldText} onChange={(e) => setTemplateFieldText(e.target.value)}/>)}
                {selectedTemplate && currentTemplateType === 'text' && (<TextField label="Testo Generico" fullWidth margin="normal" value={templateFieldText} onChange={(e) => setTemplateFieldText(e.target.value)} multiline rows={4}/>)}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddTemplateDialogClose}>Annulla</Button>
          <Button onClick={handleAddTemplate} variant="contained" color="primary">
            Aggiungi Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per modificare un item esistente */}
      <EditItemDialog
        open={editItemDialogOpen}
        onClose={handleEditItemDialogClose}
        selectedItemId={selectedItemId}
        showNotification={showNotification}
        mediaList={mediaList}
        templateList={templateList}
      />
    </>
  );
};

export default RundownDialogs;
