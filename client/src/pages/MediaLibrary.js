import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  // Grid non viene utilizzato, lo manteniamo commentato per riferimento futuro
  // Grid,
  Tabs,
  Tab,
  // Divider non viene utilizzato, lo manteniamo commentato per riferimento futuro
  // Divider,
  Button,
  // IconButton non viene utilizzato, lo manteniamo commentato per riferimento futuro
  // IconButton,
  // Tooltip non viene utilizzato, lo manteniamo commentato per riferimento futuro
  // Tooltip
} from '@mui/material';
import {
  // RefreshIcon non viene utilizzato, lo manteniamo commentato per riferimento futuro
  // Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useCaspar } from '../contexts/CasparContext';
import { useRundown } from '../contexts/RundownContext';
import MediaBrowser from '../components/media/MediaBrowser';
import TemplateBrowser from '../components/media/TemplateBrowser';

// Componente TabPanel per gestire il contenuto delle tab
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`media-tabpanel-${index}`}
      aria-labelledby={`media-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Funzione per generare le proprietà delle tab
const a11yProps = (index) => {
  return {
    id: `media-tab-${index}`,
    'aria-controls': `media-tabpanel-${index}`,
  };
};

// Componente principale per la libreria media
const MediaLibrary = () => {
  // Rimuoviamo getMediaList e getTemplateList poiché non vengono utilizzati direttamente
  // ma sono gestiti dai componenti MediaBrowser e TemplateBrowser
  const { connected, play } = useCaspar();
  const { addMedia, addTemplate } = useRundown();

  const [tabValue, setTabValue] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Gestisce il cambio di tab
  const handleTabChange = (_event, newValue) => {
    // Usiamo _event per indicare che il parametro non viene utilizzato
    setTabValue(newValue);
  };

  // Gestisce la selezione di un media
  const handleSelectMedia = (media) => {
    setSelectedMedia(media);
  };

  // Gestisce la selezione di un template
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  // Gestisce la riproduzione di un media
  const handlePlayMedia = async () => {
    if (!selectedMedia || !connected) return;

    try {
      await play(1, 10, selectedMedia);
    } catch (error) {
      console.error('Errore nella riproduzione del media:', error);
    }
  };

  // Gestisce l'aggiunta di un media al rundown
  const handleAddMediaToRundown = async () => {
    if (!selectedMedia) return;

    try {
      const mediaData = {
        clip: selectedMedia,
        name: selectedMedia,
        channel: 1,
        layer: 10
      };

      await addMedia(mediaData);
    } catch (error) {
      console.error('Errore nell\'aggiunta del media al rundown:', error);
    }
  };

  // Gestisce l'aggiunta di un template al rundown
  const handleAddTemplateToRundown = async () => {
    if (!selectedTemplate) return;

    try {
      // Determina i dati predefiniti in base al tipo di template
      let defaultData = {};
      const templateType = selectedTemplate.toLowerCase();

      if (templateType.includes('ticker')) {
        defaultData = { text: 'Testo del ticker' };
      } else if (templateType.includes('lower') || templateType.includes('third')) {
        defaultData = { title: 'Titolo', subtitle: 'Sottotitolo' };
      } else if (templateType.includes('logo')) {
        defaultData = { position: 'topright' };
      } else if (templateType.includes('text')) {
        defaultData = { text: 'Testo semplice' };
      }

      const templateData = {
        template: selectedTemplate,
        name: selectedTemplate,
        channel: 1,
        layer: 20,
        cgLayer: 1,
        data: defaultData
      };

      await addTemplate(templateData);
    } catch (error) {
      console.error('Errore nell\'aggiunta del template al rundown:', error);
    }
  };

  // Gestisce l'aggiornamento delle liste
  // Questa funzione non viene utilizzata attualmente, ma la manteniamo commentata per uso futuro
  /*
  const handleRefresh = async () => {
    if (!connected) return;

    try {
      if (tabValue === 0) {
        await getMediaList();
      } else {
        await getTemplateList();
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento delle liste:', error);
    }
  };
  */

  return (
    <Box sx={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5">Libreria Media</Typography>
        <Typography variant="body2" color="text.secondary">
          Sfoglia e gestisci i media e i template disponibili nel server CasparCG
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="media library tabs">
            <Tab label="Media" {...a11yProps(0)} />
            <Tab label="Template" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={handlePlayMedia}
                  disabled={!selectedMedia || !connected}
                  sx={{ mr: 1 }}
                >
                  Riproduci
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddMediaToRundown}
                  disabled={!selectedMedia}
                  color="secondary"
                >
                  Aggiungi al Rundown
                </Button>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <MediaBrowser onSelectMedia={handleSelectMedia} />
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddTemplateToRundown}
                  disabled={!selectedTemplate}
                  color="secondary"
                >
                  Aggiungi al Rundown
                </Button>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <TemplateBrowser onSelectTemplate={handleSelectTemplate} />
              </Box>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default MediaLibrary;
