import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Divider,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useRundown } from '../../../contexts/RundownContext';

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
 * Componente per il dialog di modifica di un elemento del rundown.
 */
const EditItemDialog = ({
  open,
  onClose,
  selectedItemId,
  showNotification,
  mediaList = [],
  templateList = []
}) => {
  const { items, updateItem } = useRundown();
  const item = items.find(it => it.id === selectedItemId);

  // Stati locali per i campi comuni
  const [customName, setCustomName] = useState('');
  const [startTime, setStartTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [inPoint, setInPoint] = useState('00:00:00');
  const [outPoint, setOutPoint] = useState('');
  const [note, setNote] = useState('');
  const [itemChannel, setItemChannel] = useState(1);
  const [itemLayer, setItemLayer] = useState(10);

  // Stati specifici per MEDIA
  const [itemLoop, setItemLoop] = useState(false);
  const [selectedMediaClip, setSelectedMediaClip] = useState('');

  // Stati specifici per TEMPLATE
  const [itemCgLayer, setItemCgLayer] = useState(1);
  const [selectedTemplateFile, setSelectedTemplateFile] = useState('');
  const [currentTemplateType, setCurrentTemplateType] = useState('generic');
  const [templateFieldText, setTemplateFieldText] = useState('');
  const [templateFieldTitle, setTemplateFieldTitle] = useState('');
  const [templateFieldSubtitle, setTemplateFieldSubtitle] = useState('');
  const [templateDataJson, setTemplateDataJson] = useState('{}');

  // Stati per il TEMPLATE ANNIDATO (quando item.type === 'MEDIA')
  const [linkedTemplateFile, setLinkedTemplateFile] = useState('');
  const [linkedTemplateGeneralLayer, setLinkedTemplateGeneralLayer] = useState(20); // Layer generale per template annidato
  const [linkedTemplateCgLayer, setLinkedTemplateCgLayer] = useState(1);
  const [linkedTemplateDelay, setLinkedTemplateDelay] = useState(1000);
  const [currentLinkedTemplateType, setCurrentLinkedTemplateType] = useState('generic');
  const [linkedTemplateFieldText, setLinkedTemplateFieldText] = useState('');
  const [linkedTemplateFieldTitle, setLinkedTemplateFieldTitle] = useState('');
  const [linkedTemplateFieldSubtitle, setLinkedTemplateFieldSubtitle] = useState('');
  const [linkedTemplateDataJson, setLinkedTemplateDataJson] = useState('{}');
  const [linkedTemplatePlayOnLoad, setLinkedTemplatePlayOnLoad] = useState(true);


  useEffect(() => {
    if (item && open) { // Assicurati che l'item esista e il dialogo sia aperto
      setCustomName(item.data.customName || '');
      setStartTime(item.data.startTime || '00:00:00');
      setDuration(item.data.duration || (item.type === 'MEDIA' ? '00:05:00' : '00:01:00'));
      setInPoint(item.data.inPoint || '00:00:00');
      setOutPoint(item.data.outPoint || '');
      setNote(item.data.note || '');
      setItemChannel(item.data.channel || 1);
      setItemLayer(item.data.layer || (item.type === 'MEDIA' ? 10 : 20));

      if (item.type === 'MEDIA') {
        setItemLoop(item.data.loop || false);
        setSelectedMediaClip(item.data.clip || '');

        // Gestione template annidato
        if (item.data.linkedTemplate && item.data.linkedTemplate.template) {
          const linked = item.data.linkedTemplate;
          setLinkedTemplateFile(linked.template || '');
          const linkedType = getTemplateTypeFromName(linked.template);
          setCurrentLinkedTemplateType(linkedType);
          // Usa item.data.layer come base se il layer del template annidato non è definito o è troppo basso
          setLinkedTemplateGeneralLayer(linked.layer || (item.data.layer ? item.data.layer + 10 : 20));
          setLinkedTemplateCgLayer(linked.cgLayer || 1);
          setLinkedTemplateDelay(linked.delay !== undefined ? linked.delay : 1000);
          setLinkedTemplatePlayOnLoad(linked.playOnLoad !== undefined ? linked.playOnLoad : true);


          const lTemplateData = linked.data || {};
          if (linkedType === 'ticker' || linkedType === 'logo' || linkedType === 'text') {
            setLinkedTemplateFieldText(lTemplateData.text || '');
            setLinkedTemplateFieldTitle(''); setLinkedTemplateFieldSubtitle(''); setLinkedTemplateDataJson('{}');
          } else if (linkedType === 'lower_third') {
            setLinkedTemplateFieldTitle(lTemplateData.title || '');
            setLinkedTemplateFieldSubtitle(lTemplateData.subtitle || '');
            setLinkedTemplateFieldText(''); setLinkedTemplateDataJson('{}');
          } else { // generic
            setLinkedTemplateDataJson(JSON.stringify(lTemplateData, null, 2));
            setLinkedTemplateFieldText(''); setLinkedTemplateFieldTitle(''); setLinkedTemplateFieldSubtitle('');
          }
        } else { // Resetta i campi del template annidato se non c'è
          setLinkedTemplateFile('');
          setCurrentLinkedTemplateType('generic');
          setLinkedTemplateGeneralLayer(item.data.layer ? item.data.layer + 10 : 20); // Default layer se non c'è linkedTemplate
          setLinkedTemplateCgLayer(1);
          setLinkedTemplateDelay(1000);
          setLinkedTemplatePlayOnLoad(true);
          setLinkedTemplateFieldText('');
          setLinkedTemplateFieldTitle('');
          setLinkedTemplateFieldSubtitle('');
          setLinkedTemplateDataJson('{}');
        }
      } else if (item.type === 'TEMPLATE') {
        setItemCgLayer(item.data.cgLayer || 1);
        setSelectedTemplateFile(item.data.template || '');
        const type = getTemplateTypeFromName(item.data.template);
        setCurrentTemplateType(type);
        const tData = item.data.data || {};
        if (type === 'ticker' || type === 'logo' || type === 'text') {
          setTemplateFieldText(tData.text || '');
          setTemplateFieldTitle(''); setTemplateFieldSubtitle(''); setTemplateDataJson('{}');
        } else if (type === 'lower_third') {
          setTemplateFieldTitle(tData.title || '');
          setTemplateFieldSubtitle(tData.subtitle || '');
          setTemplateFieldText(''); setTemplateDataJson('{}');
        } else { // generic
          setTemplateDataJson(JSON.stringify(tData, null, 2));
          setTemplateFieldText(''); setTemplateFieldTitle(''); setTemplateFieldSubtitle('');
        }
         // Resetta i campi del template annidato se l'item è un TEMPLATE (non può avere un linkedTemplate)
        setLinkedTemplateFile('');
      }
    } else if (!open) { // Resetta quando il dialogo è chiuso
        setCustomName(''); setStartTime('00:00:00'); setDuration('00:00:00');
        setInPoint('00:00:00'); setOutPoint(''); setNote('');
        setItemChannel(1); setItemLayer(10); setItemLoop(false); setSelectedMediaClip('');
        setItemCgLayer(1); setSelectedTemplateFile(''); setCurrentTemplateType('generic');
        setTemplateFieldText(''); setTemplateFieldTitle(''); setTemplateFieldSubtitle(''); setTemplateDataJson('{}');
        setLinkedTemplateFile(''); setCurrentLinkedTemplateType('generic');
        setLinkedTemplateGeneralLayer(20); setLinkedTemplateCgLayer(1); setLinkedTemplateDelay(1000); setLinkedTemplatePlayOnLoad(true);
        setLinkedTemplateFieldText(''); setLinkedTemplateFieldTitle(''); setLinkedTemplateFieldSubtitle(''); setLinkedTemplateDataJson('{}');
    }
  }, [item, open]); // Ricarica quando l'item o lo stato open cambiano

  useEffect(() => {
    if (item?.type === 'TEMPLATE' && selectedTemplateFile) {
      const type = getTemplateTypeFromName(selectedTemplateFile);
      if (type !== currentTemplateType) { // Resetta i dati solo se il tipo cambia effettivamente
        setCurrentTemplateType(type);
        setTemplateFieldText('');
        setTemplateFieldTitle('');
        setTemplateFieldSubtitle('');
        setTemplateDataJson('{}');
      }
    }
  }, [selectedTemplateFile, item?.type, currentTemplateType]);

  useEffect(() => {
    if (item?.type === 'MEDIA' && linkedTemplateFile) {
        const linkedType = getTemplateTypeFromName(linkedTemplateFile);
        if (linkedType !== currentLinkedTemplateType) { // Resetta i dati solo se il tipo cambia
            setCurrentLinkedTemplateType(linkedType);
            setLinkedTemplateFieldText('');
            setLinkedTemplateFieldTitle('');
            setLinkedTemplateFieldSubtitle('');
            setLinkedTemplateDataJson('{}');
        }
    } else if (item?.type === 'MEDIA' && !linkedTemplateFile) { // Se il file del template annidato viene deselezionato
        setCurrentLinkedTemplateType('generic'); // Resetta il tipo
        // I campi dati specifici verranno resettati dall'effetto principale o possono essere resettati qui
    }
  }, [linkedTemplateFile, item?.type, currentLinkedTemplateType]);


  if (!item) return null;

  const handleSave = () => {
    try {
      const updatedDataItem = {
        ...item.data,
        customName: customName,
        startTime: startTime,
        duration: duration,
        inPoint: inPoint,
        outPoint: outPoint,
        note: note,
        channel: itemChannel,
        layer: itemLayer,
      };

      if (item.type === 'MEDIA') {
        updatedDataItem.loop = itemLoop;
        updatedDataItem.clip = selectedMediaClip;

        if (linkedTemplateFile) {
            let linkedTemplateDataObject = {};
            if (currentLinkedTemplateType === 'ticker' || currentLinkedTemplateType === 'logo' || currentLinkedTemplateType === 'text') {
                linkedTemplateDataObject = { text: linkedTemplateFieldText || "" };
            } else if (currentLinkedTemplateType === 'lower_third') {
                linkedTemplateDataObject = { title: linkedTemplateFieldTitle || "", subtitle: linkedTemplateFieldSubtitle || "" };
            } else { 
                try {
                    linkedTemplateDataObject = linkedTemplateDataJson ? JSON.parse(linkedTemplateDataJson) : {};
                } catch (e) {
                    showNotification('Errore nel formato JSON dei dati del template annidato.', 'error');
                    return;
                }
            }
            updatedDataItem.linkedTemplate = {
                template: linkedTemplateFile,
                channel: itemChannel, // Usa il canale del media principale per il template annidato (o rendilo configurabile)
                layer: linkedTemplateGeneralLayer, // Layer generale del template annidato
                cgLayer: linkedTemplateCgLayer,
                delay: linkedTemplateDelay,
                playOnLoad: linkedTemplatePlayOnLoad,
                name: linkedTemplateFile.split('/').pop(), // Nome basato sul file
                data: linkedTemplateDataObject,
            };
        } else {
            updatedDataItem.linkedTemplate = null; // Rimuovi il template annidato se il file è deselezionato
        }

      } else if (item.type === 'TEMPLATE') {
        updatedDataItem.cgLayer = itemCgLayer;
        updatedDataItem.template = selectedTemplateFile;

        let templateDataObject = {};
        if (currentTemplateType === 'ticker' || currentTemplateType === 'logo' || currentTemplateType === 'text') {
          templateDataObject = { text: templateFieldText || "" };
        } else if (currentTemplateType === 'lower_third') {
          templateDataObject = { title: templateFieldTitle || "", subtitle: templateFieldSubtitle || "" };
        } else { 
          try {
            templateDataObject = templateDataJson ? JSON.parse(templateDataJson) : {};
          } catch (e) {
            showNotification('Errore nel formato JSON dei dati del template.', 'error');
            return;
          }
        }
        updatedDataItem.data = templateDataObject;
      }

      updateItem(selectedItemId, { ...item, data: updatedDataItem });
      showNotification('Elemento aggiornato con successo!', 'success');
      onClose();
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'elemento:", error);
      showNotification(`Errore durante l'aggiornamento: ${error.message}`, 'error');
    }
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md" // Potrebbe servire 'lg' se il contenuto diventa troppo denso
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#3d3d3d', 
          color: 'white',
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', pb: 2 }}>
        Modifica Elemento: {item.data.customName || item.name}
        <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.7)'}}>
            Tipo: {item.type}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, maxHeight: '70vh' }}> {/* Max height e overflow per scroll */}
        <Grid container spacing={3}>
          {/* Colonna Sinistra: Impostazioni Comuni */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.light', mb:2 }}>Impostazioni Comuni</Typography>
            <TextField
              label="Nome Personalizzato"
              fullWidth
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={item.name}
              variant="filled" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }}
            />
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField label="Orario di Inizio" fullWidth value={startTime} onChange={(e) => setStartTime(e.target.value)} helperText="HH:MM:SS" variant="filled" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Durata" fullWidth value={duration} onChange={(e) => setDuration(e.target.value)} helperText="HH:MM:SS" variant="filled" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Punto di Ingresso (IN)" fullWidth value={inPoint} onChange={(e) => setInPoint(e.target.value)} helperText="HH:MM:SS" variant="filled" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Punto di Uscita (OUT)" fullWidth value={outPoint} onChange={(e) => setOutPoint(e.target.value)} helperText="HH:MM:SS (opz.)" variant="filled" InputLabelProps={{ shrink: true }} />
                </Grid>
            </Grid>
            <TextField
              label="Note" fullWidth multiline rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Note opzionali" variant="filled" sx={{ mt: 2 }} InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Colonna Destra: Impostazioni Specifiche e Canali/Layer */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.light', mb:2 }}>Impostazioni Riproduzione</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={item.type === 'TEMPLATE' ? 4 : 6}>
                    <TextField label="Canale" type="number" fullWidth value={itemChannel} onChange={(e) => setItemChannel(parseInt(e.target.value) || 1)} InputProps={{ inputProps: { min: 1 } }} variant="filled" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={item.type === 'TEMPLATE' ? 4 : 6}>
                    <TextField label="Layer" type="number" fullWidth value={itemLayer} onChange={(e) => setItemLayer(parseInt(e.target.value) || 10)} InputProps={{ inputProps: { min: 1 } }} variant="filled" InputLabelProps={{ shrink: true }} />
                </Grid>
                {item.type === 'TEMPLATE' && (
                    <Grid item xs={4}>
                        <TextField label="CG Layer" type="number" fullWidth value={itemCgLayer} onChange={(e) => setItemCgLayer(parseInt(e.target.value) || 1)} InputProps={{ inputProps: { min: 1 } }} variant="filled" InputLabelProps={{ shrink: true }} />
                    </Grid>
                )}
            </Grid>

            {item.type === 'MEDIA' && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: 'secondary.light' }}>Dettagli Media</Typography>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.2)'}}/>
                <FormControl fullWidth margin="dense" variant="filled">
                  <InputLabel shrink>File Media</InputLabel>
                  <Select value={selectedMediaClip} onChange={(e) => setSelectedMediaClip(e.target.value)} label="File Media">
                    {mediaList.map((media) => (<MenuItem key={media} value={media}>{media}</MenuItem>))}
                  </Select>
                </FormControl>
                <FormControlLabel control={<Checkbox checked={itemLoop} onChange={(e) => setItemLoop(e.target.checked)} sx={{ color: 'primary.light' }}/>} label="Riproduzione in loop" sx={{ mt: 1 }} />
              </>
            )}

            {item.type === 'TEMPLATE' && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: 'secondary.light' }}>Dettagli Template</Typography>
                 <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.2)'}}/>
                <FormControl fullWidth margin="dense" variant="filled">
                  <InputLabel shrink>File Template</InputLabel>
                  <Select value={selectedTemplateFile} onChange={(e) => setSelectedTemplateFile(e.target.value)} label="File Template">
                    {templateList.map((template) => (<MenuItem key={template} value={template}>{template}</MenuItem>))}
                  </Select>
                </FormControl>
                <Box sx={{ mt: 2 }}>
                    {currentTemplateType === 'ticker' && (<TextField label="Testo Ticker" fullWidth value={templateFieldText} onChange={(e) => setTemplateFieldText(e.target.value)} multiline rows={3} variant="filled" InputLabelProps={{ shrink: true }} />)}
                    {currentTemplateType === 'lower_third' && (<><TextField label="Titolo" fullWidth value={templateFieldTitle} onChange={(e) => setTemplateFieldTitle(e.target.value)} sx={{ mb: 2 }} variant="filled" InputLabelProps={{ shrink: true }} /><TextField label="Sottotitolo" fullWidth value={templateFieldSubtitle} onChange={(e) => setTemplateFieldSubtitle(e.target.value)} variant="filled" InputLabelProps={{ shrink: true }} /></>)}
                    {currentTemplateType === 'logo' && (<TextField label="Testo/ID Logo" fullWidth value={templateFieldText} onChange={(e) => setTemplateFieldText(e.target.value)} variant="filled" InputLabelProps={{ shrink: true }} />)}
                    {currentTemplateType === 'text' && (<TextField label="Testo Generico" fullWidth value={templateFieldText} onChange={(e) => setTemplateFieldText(e.target.value)} multiline rows={4} variant="filled" InputLabelProps={{ shrink: true }} />)}
                    {currentTemplateType === 'generic' && (<TextField label="Dati Template (JSON)" fullWidth multiline rows={4} value={templateDataJson} onChange={(e) => setTemplateDataJson(e.target.value)} placeholder='{"f0":"Testo"}' variant="filled" InputLabelProps={{ shrink: true }} />)}
                </Box>
              </>
            )}
          </Grid>

          {/* Sezione Template Annidato (solo per MEDIA) */}
          {item.type === 'MEDIA' && (
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.light', mt: 3, mb: 2 }}>Template Annidato (Opzionale)</Typography>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.2)'}}/>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={7}> {/* Più spazio per il nome del file */}
                        <FormControl fullWidth margin="dense" variant="filled">
                            <InputLabel shrink>File Template Annidato</InputLabel>
                            <Select value={linkedTemplateFile} onChange={(e) => setLinkedTemplateFile(e.target.value)} label="File Template Annidato">
                                <MenuItem value=""><em>Nessuno</em></MenuItem>
                                {templateList.map((template) => (<MenuItem key={template} value={template}>{template}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>
                     <Grid item xs={6} md={2.5}>
                        <TextField label="Layer T.A." type="number" fullWidth value={linkedTemplateGeneralLayer} onChange={(e) => setLinkedTemplateGeneralLayer(parseInt(e.target.value) || 20)} InputProps={{ inputProps: { min: 1 } }} variant="filled" InputLabelProps={{ shrink: true }} disabled={!linkedTemplateFile} helperText="Generale"/>
                    </Grid>
                    <Grid item xs={6} md={2.5}>
                        <TextField label="CG Layer T.A." type="number" fullWidth value={linkedTemplateCgLayer} onChange={(e) => setLinkedTemplateCgLayer(parseInt(e.target.value) || 1)} InputProps={{ inputProps: { min: 1 } }} variant="filled" InputLabelProps={{ shrink: true }} disabled={!linkedTemplateFile} helperText="Grafico"/>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Ritardo T.A. (ms)" type="number" fullWidth value={linkedTemplateDelay} onChange={(e) => setLinkedTemplateDelay(parseInt(e.target.value) || 0)} InputProps={{ inputProps: { min: 0 } }} variant="filled" InputLabelProps={{ shrink: true }} disabled={!linkedTemplateFile} />
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                         <FormControlLabel control={<Checkbox checked={linkedTemplatePlayOnLoad} onChange={(e) => setLinkedTemplatePlayOnLoad(e.target.checked)} sx={{ color: 'primary.light' }} disabled={!linkedTemplateFile} />} label="Play T.A. all'avvio" />
                    </Grid>
                </Grid>
                {linkedTemplateFile && ( // Mostra i campi dati solo se un template annidato è selezionato
                    <Box sx={{ mt: 2, p:2, border: '1px solid rgba(255,255,255,0.1)', borderRadius:1 }}>
                        <Typography variant="subtitle2" sx={{ mb:1 }}>Dati per "{linkedTemplateFile.split('/').pop()}" (Tipo: {currentLinkedTemplateType})</Typography>
                        {currentLinkedTemplateType === 'ticker' && (<TextField label="Testo Ticker Annidato" fullWidth value={linkedTemplateFieldText} onChange={(e) => setLinkedTemplateFieldText(e.target.value)} multiline rows={2} variant="filled" InputLabelProps={{ shrink: true }} />)}
                        {currentLinkedTemplateType === 'lower_third' && (<><TextField label="Titolo Annidato" fullWidth value={linkedTemplateFieldTitle} onChange={(e) => setLinkedTemplateFieldTitle(e.target.value)} sx={{ mb: 2 }} variant="filled" InputLabelProps={{ shrink: true }} /><TextField label="Sottotitolo Annidato" fullWidth value={linkedTemplateFieldSubtitle} onChange={(e) => setLinkedTemplateFieldSubtitle(e.target.value)} variant="filled" InputLabelProps={{ shrink: true }} /></>)}
                        {currentLinkedTemplateType === 'logo' && (<TextField label="Testo/ID Logo Annidato" fullWidth value={linkedTemplateFieldText} onChange={(e) => setLinkedTemplateFieldText(e.target.value)} variant="filled" InputLabelProps={{ shrink: true }} />)}
                        {currentLinkedTemplateType === 'text' && (<TextField label="Testo Generico Annidato" fullWidth value={linkedTemplateFieldText} onChange={(e) => setLinkedTemplateFieldText(e.target.value)} multiline rows={3} variant="filled" InputLabelProps={{ shrink: true }} />)}
                        {currentLinkedTemplateType === 'generic' && (<TextField label="Dati Template Annidato (JSON)" fullWidth multiline rows={3} value={linkedTemplateDataJson} onChange={(e) => setLinkedTemplateDataJson(e.target.value)} placeholder='{"f0":"Testo"}' variant="filled" InputLabelProps={{ shrink: true }} />)}
                    </Box>
                )}
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', pt: 2, justifyContent: 'space-between', px:3, pb:2 }}>
        <Button onClick={onClose} color="inherit">Annulla</Button>
        <Button onClick={handleSave} variant="contained" color="primary" size="large">
          Salva Modifiche
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditItemDialog;
