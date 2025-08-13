import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Movie as MovieIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  PlayArrow as PlayIcon,
  // FilterList non viene utilizzato, lo rimuoviamo
  Clear as ClearIcon
} from '@mui/icons-material';
import { useCaspar } from '../../contexts/CasparContext';

// Componente per la selezione dei media
const MediaSelector = ({ onSelectMedia }) => {
  const { connected, mediaList, getAllMedia } = useCaspar(); // 🔥 USANDO getAllMedia per assets + CasparCG

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Carica la lista dei media
  const loadMediaList = useCallback(async () => {
    // 🔥 RIMOSSA dipendenza da connected - getAllMedia funziona per assets locali
    setLoading(true);
    try {
      await getAllMedia(); // 🔥 USANDO getAllMedia per assets + CasparCG
    } catch (error) {
      console.error('Errore nel caricamento della lista dei media:', error);
    } finally {
      setLoading(false);
    }
  }, [getAllMedia]);

  // Carica la lista dei media all'avvio
  useEffect(() => {
    // 🔥 RIMUOVI dipendenza da connected - getAllMedia funziona sempre per assets locali
    loadMediaList();
  }, [loadMediaList]);

  // 🔥 FILTRA MEDIA ESCLUDENDO TEMPLATE
  useEffect(() => {
    if (!mediaList || !Array.isArray(mediaList)) {
      setFilteredMedia([]);
      return;
    }

    let filtered = [...mediaList];

    // 🔥 FILTRA MEDIA: Escludi solo HTML e JSON, accetta tutto il resto
    filtered = filtered.filter(media => {
      const mediaName = typeof media === 'string' ? media : (media?.name || media?.path || '');
      const ext = mediaName.split('.').pop()?.toLowerCase() || '';
      
      // Escludi esplicitamente solo template e manifest
      const excludeExtensions = ['html', 'json'];
      const shouldExclude = excludeExtensions.includes(ext);
      
      if (shouldExclude) {
        console.log(`🚫 File escluso: ${mediaName} (ext: ${ext})`);
      }
      
      return !shouldExclude;
    });

    // Filtra per termine di ricerca
    if (searchTerm) {
      filtered = filtered.filter(media => {
        const mediaName = typeof media === 'string' ? media : (media?.name || media?.path || '');
        return mediaName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filtra per tipo di file
    if (filterType !== 'all') {
      filtered = filtered.filter(media => {
        const mediaName = typeof media === 'string' ? media : (media?.name || media?.path || '');
        const ext = mediaName.split('.').pop()?.toLowerCase() || '';
        switch (filterType) {
          case 'video':
            return ['mp4', 'mov', 'avi', 'wmv', 'mxf'].includes(ext);
          case 'image':
            return ['png', 'jpg', 'jpeg', 'bmp', 'tga', 'tiff'].includes(ext);
          case 'audio':
            return ['wav', 'mp3', 'aac'].includes(ext);
          default:
            return true;
        }
      });
    }

    setFilteredMedia(filtered);
    console.log(`🎬 Media filtrati (senza template): ${filtered.length} files`);
    console.log(`🔍 MEDIA DEBUG - mediaList totali: ${mediaList?.length || 0}`);
    if (Array.isArray(mediaList) && mediaList.length > 0) {
      const casparMedia = mediaList.filter(m => !m.isLocal).length;
      const localMedia = mediaList.filter(m => m.isLocal).length;
      console.log(`   CasparCG: ${casparMedia}, Locali: ${localMedia}`);
    }
  }, [mediaList, searchTerm, filterType]);

  // Gestisce la selezione di un media
  const handleSelectMedia = (media) => {
    setSelectedMedia(media);
    if (onSelectMedia) {
      onSelectMedia(media);
    }
  };

  // Restituisce l'icona appropriata per il tipo di file
  const getFileIcon = (media) => {
    // 🔥 SUPPORTA DUAL FORMAT: legacy string + nuovo object
    let filename = '';
    if (typeof media === 'string') {
      filename = media;
    } else if (media && media.name) {
      filename = media.name;
    } else if (media && media.path) {
      filename = media.path;
    } else {
      return <FileIcon fontSize="small" />;
    }

    const ext = filename.split('.').pop().toLowerCase();

    if (['mp4', 'mov', 'avi', 'wmv', 'mxf'].includes(ext)) {
      return <MovieIcon fontSize="small" />;
    } else if (['png', 'jpg', 'jpeg', 'bmp', 'tga', 'tiff'].includes(ext)) {
      return <ImageIcon fontSize="small" />;
    } else if (['wav', 'mp3', 'aac'].includes(ext)) {
      return <AudioIcon fontSize="small" />;
    } else {
      return <FileIcon fontSize="small" />;
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
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Cerca media..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          variant="outlined"
          size="small"
        />
      </Box>

      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="Tutti"
          onClick={() => setFilterType('all')}
          color={filterType === 'all' ? 'primary' : 'default'}
          variant={filterType === 'all' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Video"
          onClick={() => setFilterType('video')}
          color={filterType === 'video' ? 'primary' : 'default'}
          variant={filterType === 'video' ? 'filled' : 'outlined'}
          icon={<MovieIcon />}
        />
        <Chip
          label="Immagini"
          onClick={() => setFilterType('image')}
          color={filterType === 'image' ? 'primary' : 'default'}
          variant={filterType === 'image' ? 'filled' : 'outlined'}
          icon={<ImageIcon />}
        />
        <Chip
          label="Audio"
          onClick={() => setFilterType('audio')}
          color={filterType === 'audio' ? 'primary' : 'default'}
          variant={filterType === 'audio' ? 'filled' : 'outlined'}
          icon={<AudioIcon />}
        />
      </Box>

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
            {filteredMedia.map((media, index) => {
              // 🔥 SUPPORTA DUAL FORMAT: legacy string + nuovo object
              const displayName = typeof media === 'string' ? media : (media?.name || media?.path || 'Unknown file');
              const mediaKey = typeof media === 'string' ? media : `${media?.path || media?.name || 'unknown'}-${index}`;
              
              return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={mediaKey}>
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
                          {displayName}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
                    <Tooltip title="Anteprima">
                      <IconButton size="small" onClick={() => handleSelectMedia(media)}>
                        <PlayIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Paper>
  );
};

export default MediaSelector;
