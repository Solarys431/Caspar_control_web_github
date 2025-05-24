import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  // CardMedia non viene utilizzato, lo rimuoviamo
  CardActionArea,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Chip,
  Tooltip,
  CircularProgress,
  // Button non viene utilizzato, lo rimuoviamo
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Movie as MovieIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useCaspar } from '../../contexts/CasparContext';
import { useRundown } from '../../contexts/RundownContext';

// Funzione per determinare il tipo di file in base all'estensione
const getFileType = (filename) => {
  if (!filename) return 'unknown';

  const extension = filename.split('.').pop().toLowerCase();

  // Tipi di file video
  if (['mp4', 'mov', 'avi', 'wmv', 'mkv', 'flv', 'webm', 'mxf'].includes(extension)) {
    return 'video';
  }

  // Tipi di file immagine
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'tga'].includes(extension)) {
    return 'image';
  }

  // Tipi di file audio
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma'].includes(extension)) {
    return 'audio';
  }

  return 'other';
};

// Componente per il browser dei media
const MediaBrowser = ({ onSelectMedia }) => {
  const { connected, mediaList, getMediaList } = useCaspar();
  const { addMedia } = useRundown();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);

  // Carica la lista dei media
  const loadMediaList = useCallback(async () => {
    if (!connected) return;

    setLoading(true);
    try {
      await getMediaList();
    } catch (error) {
      console.error('Errore nel caricamento della lista dei media:', error);
    } finally {
      setLoading(false);
    }
  }, [connected, getMediaList]);

  // Carica la lista dei media all'avvio e quando cambia lo stato di connessione
  useEffect(() => {
    if (connected) {
      loadMediaList();
    }
  }, [connected, loadMediaList]);

  // Filtra i media in base al termine di ricerca e al tipo di filtro
  useEffect(() => {
    if (!mediaList) {
      setFilteredMedia([]);
      return;
    }

    let filtered = mediaList;

    // Applica il filtro di ricerca
    if (searchTerm) {
      filtered = filtered.filter(media =>
        media.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Applica il filtro per tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(media => getFileType(media) === filterType);
    }

    setFilteredMedia(filtered);
  }, [mediaList, searchTerm, filterType]);

  // Gestisce la selezione di un media
  const handleSelectMedia = (media) => {
    setSelectedMedia(media);
    if (onSelectMedia) {
      onSelectMedia(media);
    }
  };

  // Gestisce l'aggiunta di un media al rundown
  const handleAddToRundown = async (media) => {
    try {
      const mediaData = {
        clip: media,
        name: media,
        channel: 1,
        layer: 10
      };

      await addMedia(mediaData);
    } catch (error) {
      console.error('Errore nell\'aggiunta del media al rundown:', error);
    }
  };

  // Gestisce l'apertura del menu di filtro
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  // Gestisce la chiusura del menu di filtro
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };

  // Gestisce la selezione di un filtro
  const handleFilterSelect = (type) => {
    setFilterType(type);
    handleFilterMenuClose();
  };

  // Restituisce l'icona appropriata per il tipo di file
  const getFileIcon = (filename) => {
    const fileType = getFileType(filename);

    switch (fileType) {
      case 'video':
        return <MovieIcon />;
      case 'image':
        return <ImageIcon />;
      case 'audio':
        return <AudioIcon />;
      default:
        return <FileIcon />;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Browser Media</Typography>

        <Box>
          <Tooltip title="Aggiorna lista media">
            <IconButton onClick={loadMediaList} disabled={loading || !connected}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Filtra per tipo">
            <IconButton onClick={handleFilterMenuOpen}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Cerca media..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
      />

      {filterType !== 'all' && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`Filtro: ${filterType}`}
            onDelete={() => setFilterType('all')}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : filteredMedia.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              {connected ? 'Nessun media trovato' : 'Connettiti a CasparCG per visualizzare i media'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredMedia.map((media) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={media}>
                <Card
                  sx={{
                    bgcolor: selectedMedia === media ? 'primary.dark' : 'background.paper',
                    transition: 'all 0.2s'
                  }}
                >
                  <CardActionArea onClick={() => handleSelectMedia(media)}>
                    <CardContent sx={{ p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getFileIcon(media)}
                        <Typography variant="body2" sx={{ ml: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {media}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
                    <Tooltip title="Aggiungi al rundown">
                      <IconButton size="small" onClick={() => handleAddToRundown(media)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Riproduci">
                      <IconButton size="small" onClick={() => console.log('Play', media)}>
                        <PlayIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Menu di filtro */}
      <Menu
        anchorEl={filterMenuAnchorEl}
        open={Boolean(filterMenuAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem onClick={() => handleFilterSelect('all')}>
          <ListItemIcon>
            <FileIcon />
          </ListItemIcon>
          <ListItemText primary="Tutti i file" />
        </MenuItem>
        <MenuItem onClick={() => handleFilterSelect('video')}>
          <ListItemIcon>
            <MovieIcon />
          </ListItemIcon>
          <ListItemText primary="Video" />
        </MenuItem>
        <MenuItem onClick={() => handleFilterSelect('image')}>
          <ListItemIcon>
            <ImageIcon />
          </ListItemIcon>
          <ListItemText primary="Immagini" />
        </MenuItem>
        <MenuItem onClick={() => handleFilterSelect('audio')}>
          <ListItemIcon>
            <AudioIcon />
          </ListItemIcon>
          <ListItemText primary="Audio" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default MediaBrowser;
