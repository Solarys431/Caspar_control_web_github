import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  // Divider non viene utilizzato, ma lo manteniamo commentato per riferimento futuro
  // Divider,
  Button,
  IconButton,
  // Tooltip non viene utilizzato, ma lo manteniamo commentato per riferimento futuro
  // Tooltip,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  // PlayIcon non viene utilizzato, usiamo solo PlayArrowIcon
  // PlayArrow as PlayIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Stop as StopIcon,
  Folder as FolderIcon,
  Movie as MovieIcon,
  Image as ImageIcon,
  // AudioIcon non viene utilizzato, usiamo AudiotrackIcon
  // AudioFile as AudioIcon,
  // FileIcon non viene utilizzato, usiamo InsertDriveFileIcon
  // InsertDriveFile as FileIcon,
  InsertDriveFile as InsertDriveFileIcon,
  AudioFile as AudiotrackIcon,
  MoreVert as MoreVertIcon
  // CodeIcon non viene utilizzato
  // Code as CodeIcon,
  // ClearIcon non viene utilizzato
  // Clear as ClearIcon
} from '@mui/icons-material';
import { useCaspar } from '../contexts/CasparContext';
// useRundown non viene utilizzato
// import { useRundown } from '../contexts/RundownContext';
// Questi componenti non vengono utilizzati
// import MediaBrowserComponent from '../components/media/MediaBrowser';
// import TemplateBrowserComponent from '../components/media/TemplateBrowser';

// Funzione per ottenere l'icona in base al tipo di file
const getFileIcon = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();

  if (['mp4', 'mov', 'avi', 'wmv', 'mxf'].includes(extension)) {
    return <MovieIcon />;
  } else if (['jpg', 'jpeg', 'png', 'gif', 'tga', 'tiff', 'bmp'].includes(extension)) {
    return <ImageIcon />;
  } else if (['mp3', 'wav', 'aac', 'ogg', 'flac'].includes(extension)) {
    return <AudiotrackIcon />;
  } else {
    return <InsertDriveFileIcon />;
  }
};

// Funzione per ottenere il tipo di file
const getFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();

  if (['mp4', 'mov', 'avi', 'wmv', 'mxf'].includes(extension)) {
    return 'Video';
  } else if (['jpg', 'jpeg', 'png', 'gif', 'tga', 'tiff', 'bmp'].includes(extension)) {
    return 'Immagine';
  } else if (['mp3', 'wav', 'aac', 'ogg', 'flac'].includes(extension)) {
    return 'Audio';
  } else {
    return 'Altro';
  }
};

// Funzione per ottenere il tipo di template
// Questa funzione non viene utilizzata attualmente, ma la manteniamo commentata per uso futuro
/*
const getTemplateType = (filename) => {
  if (!filename) return 'unknown';

  const name = filename.toLowerCase();

  if (name.includes('ticker')) return 'Ticker';
  if (name.includes('lower') || name.includes('third')) return 'Lower Third';
  if (name.includes('logo')) return 'Logo';
  if (name.includes('text')) return 'Testo';

  return 'Altro';
};
*/

const MediaBrowser = () => {
  const {
    connected,
    mediaList,
    getMediaList,
    getTemplateList,
    // templateList non viene utilizzato, ma lo manteniamo commentato per uso futuro
    // templateList,
    play,
    stop,
    loading
  } = useCaspar();

  // Stato per la ricerca e il filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMediaList, setFilteredMediaList] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folders, setFolders] = useState([]);

  // Stato per la riproduzione
  const [currentPlayingFile, setCurrentPlayingFile] = useState(null);

  // Stato per i menu
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Stato per i dialog
  const [playDialogOpen, setPlayDialogOpen] = useState(false);
  const [addToRundownDialogOpen, setAddToRundownDialogOpen] = useState(false);

  // Stato per i form
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [selectedLayer, setSelectedLayer] = useState(10);

  // Stato per le tab
  const [tabValue, setTabValue] = useState(0);

  // Stato per i template - commentato perché non utilizzato attualmente
  // const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Gestisce il cambio di tab
  const handleTabChange = (_event, newValue) => {
    // Usiamo _event per indicare che il parametro non viene utilizzato
    setTabValue(newValue);
  };

  // Aggiorna la lista dei media
  const handleRefreshMedia = useCallback(async () => {
    if (!connected) return;
    await getMediaList();
  }, [connected, getMediaList]);

  // Aggiorna la lista dei template
  const handleRefreshTemplates = useCallback(async () => {
    if (!connected) return;
    try {
      // Utilizziamo direttamente getTemplateList dalla props
      await getTemplateList();
    } catch (error) {
      console.error('Errore nel caricamento della lista dei template:', error);
    }
  }, [connected, getTemplateList]);

  // Carica la lista dei media quando la pagina viene caricata
  useEffect(() => {
    if (connected) {
      handleRefreshMedia();
    }
  }, [connected, handleRefreshMedia]);

  // Filtra la lista dei media quando cambia la ricerca o la cartella selezionata
  useEffect(() => {
    let filtered = mediaList;

    // Filtra per cartella
    if (selectedFolder) {
      filtered = filtered.filter(file => file.startsWith(selectedFolder));
    }

    // Filtra per termine di ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(file =>
        file.toLowerCase().includes(term)
      );
    }

    setFilteredMediaList(filtered);
  }, [mediaList, searchTerm, selectedFolder]);

  // Estrae le cartelle dalla lista dei media
  useEffect(() => {
    const folderSet = new Set();

    mediaList.forEach(file => {
      const parts = file.split('/');
      if (parts.length > 1) {
        const folder = parts.slice(0, -1).join('/');
        folderSet.add(folder);
      }
    });

    setFolders(Array.from(folderSet));
  }, [mediaList]);

  // Apertura del menu di un file
  const handleMenuOpen = (event, file) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  // Chiusura del menu di un file
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedFile(null);
  };

  // Apertura del dialog per riprodurre un file
  const handlePlayDialogOpen = () => {
    handleMenuClose();
    setPlayDialogOpen(true);
  };

  // Chiusura del dialog per riprodurre un file
  const handlePlayDialogClose = () => {
    setPlayDialogOpen(false);
  };

  // Apertura del dialog per aggiungere un file al rundown
  const handleAddToRundownDialogOpen = () => {
    handleMenuClose();
    setAddToRundownDialogOpen(true);
  };

  // Chiusura del dialog per aggiungere un file al rundown
  const handleAddToRundownDialogClose = () => {
    setAddToRundownDialogOpen(false);
  };

  // Riproduzione di un file
  const handlePlayFile = async () => {
    if (!connected || !selectedFile) return;

    try {
      await play(selectedChannel, selectedLayer, selectedFile);
      setCurrentPlayingFile(selectedFile);
    } catch (error) {
      console.error('Errore nella riproduzione del file:', error);
    }

    handlePlayDialogClose();
  };

  // Arresto della riproduzione
  const handleStopFile = async () => {
    if (!connected || !currentPlayingFile) return;

    try {
      await stop(selectedChannel, selectedLayer);
      setCurrentPlayingFile(null);
    } catch (error) {
      console.error('Errore nell\'arresto della riproduzione:', error);
    }
  };

  // Aggiunta di un file al rundown
  const handleAddToRundown = () => {
    // Questa funzionalità sarà implementata in seguito
    // quando integreremo il rundown con il browser media
    handleAddToRundownDialogClose();
  };

  // Selezione di una cartella
  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder);
  };

  // Torna alla cartella principale
  const handleBackToRoot = () => {
    setSelectedFolder('');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Browser Media
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: '#2d2d2d'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="media tabs">
              <Tab label="Media" />
              <Tab label="Template" />
            </Tabs>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshMedia}
                disabled={!connected || loading}
              >
                Aggiorna
              </Button>

              {currentPlayingFile && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStopFile}
                  disabled={!connected || loading}
                >
                  Stop
                </Button>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Cerca"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Contenuto delle tab */}
      <Box sx={{ mt: 2 }}>
        {/* Tab Media */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Pannello delle cartelle */}
            <Grid item xs={12} md={3}>
              <Paper
                elevation={3}
                sx={{
                  backgroundColor: '#2d2d2d',
                  height: 'calc(100vh - 300px)',
                  overflow: 'auto'
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <Typography variant="h6">
                    Cartelle
                  </Typography>
                </Box>

                <List>
                  <ListItem
                    onClick={handleBackToRoot}
                    sx={{
                      bgcolor: selectedFolder === '' ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText primary="Root" />
                  </ListItem>

                  {folders.map((folder) => (
                    <ListItem
                      key={folder}
                      onClick={() => handleSelectFolder(folder)}
                      sx={{
                        bgcolor: selectedFolder === folder ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <FolderIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={folder.split('/').pop()}
                        secondary={folder}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Lista dei file */}
            <Grid item xs={12} md={9}>
              <Paper
                elevation={3}
                sx={{
                  backgroundColor: '#2d2d2d',
                  minHeight: 400,
                  height: 'calc(100vh - 300px)',
                  overflow: 'auto'
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <Typography variant="h6">
                    File
                    {selectedFolder && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedFolder}
                      </Typography>
                    )}
                  </Typography>
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : filteredMediaList.length > 0 ? (
                  <Grid container spacing={2} sx={{ p: 2 }}>
                    {filteredMediaList.map((file) => {
                      const fileName = file.split('/').pop();
                      const fileType = getFileType(fileName);
                      const isPlaying = currentPlayingFile === file;

                      return (
                        <Grid item xs={12} sm={6} md={4} key={file}>
                          <Card
                            sx={{
                              backgroundColor: '#3d3d3d',
                              border: isPlaying ? '2px solid #4caf50' : 'none'
                            }}
                          >
                            <CardContent sx={{ pb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {getFileIcon(fileName)}
                                <Typography variant="body1" sx={{ ml: 1, fontWeight: 500 }}>
                                  {fileName}
                                </Typography>
                              </Box>

                              <Typography variant="body2" color="text.secondary" noWrap>
                                {file}
                              </Typography>
                            </CardContent>

                            <Box sx={{ px: 2, pb: 1 }}>
                              <Chip
                                label={fileType}
                                size="small"
                                color={
                                  fileType === 'Video' ? 'primary' :
                                  fileType === 'Immagine' ? 'secondary' :
                                  fileType === 'Audio' ? 'warning' : 'default'
                                }
                                variant="outlined"
                              />
                            </Box>

                            <CardActions>
                              <Button
                                size="small"
                                startIcon={<PlayArrowIcon />}
                                onClick={() => {
                                  setSelectedFile(file);
                                  setPlayDialogOpen(true);
                                }}
                                disabled={!connected || loading}
                              >
                                Play
                              </Button>

                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  setSelectedFile(file);
                                  setAddToRundownDialogOpen(true);
                                }}
                              >
                                Rundown
                              </Button>

                              <Box sx={{ flexGrow: 1 }} />

                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, file)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </CardActions>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Box sx={{ p: 5, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Nessun file trovato
                    </Typography>
                    {!connected && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Connettiti a un server CasparCG per visualizzare i file
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Tab Template */}
        {tabValue === 1 && (
          <Paper
            elevation={3}
            sx={{
              backgroundColor: '#2d2d2d',
              minHeight: 400,
              height: 'calc(100vh - 300px)',
              overflow: 'auto',
              p: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Template
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Questa sezione mostra i template disponibili nel server CasparCG. I template devono essere posizionati nella cartella 'template' configurata nel server.
            </Typography>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshTemplates}
                disabled={!connected}
              >
                Aggiorna Template
              </Button>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary" align="center">
                Questa funzionalità sarà implementata in una versione futura.
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Menu di un file */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handlePlayDialogOpen}>
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Riproduci" />
        </MenuItem>
        <MenuItem onClick={handleAddToRundownDialogOpen}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Aggiungi al Rundown" />
        </MenuItem>
      </Menu>

      {/* Dialog per riprodurre un file */}
      <Dialog
        open={playDialogOpen}
        onClose={handlePlayDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Riproduci Media</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            File: {selectedFile}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="Canale"
                type="number"
                fullWidth
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Layer"
                type="number"
                fullWidth
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePlayDialogClose}>Annulla</Button>
          <Button
            onClick={handlePlayFile}
            variant="contained"
            color="primary"
            disabled={!connected || loading}
          >
            Riproduci
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per aggiungere un file al rundown */}
      <Dialog
        open={addToRundownDialogOpen}
        onClose={handleAddToRundownDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Aggiungi al Rundown</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            File: {selectedFile}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="Canale"
                type="number"
                fullWidth
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Layer"
                type="number"
                fullWidth
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Nota: Questa funzionalità sarà implementata in una versione futura.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddToRundownDialogClose}>Annulla</Button>
          <Button
            onClick={handleAddToRundown}
            variant="contained"
            color="primary"
          >
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaBrowser;
