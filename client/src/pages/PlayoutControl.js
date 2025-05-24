import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useCaspar } from '../contexts/CasparContext';

// Componente per il controllo di un canale
const ChannelControl = ({ channel, onPlay, onStop, onLoadBg, onClear, loading, currentPlaying }) => {
  const [clip, setClip] = useState('');
  const [layer, setLayer] = useState(10);
  const [loop, setLoop] = useState(false);
  const [transition, setTransition] = useState('CUT');
  const [duration, setDuration] = useState(0);
  const [auto, setAuto] = useState(false);

  const isPlaying = currentPlaying &&
                   currentPlaying.channel === channel &&
                   currentPlaying.layer === layer;

  return (
    <Card sx={{ backgroundColor: '#3d3d3d', mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Canale {channel}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Clip"
              fullWidth
              value={clip}
              onChange={(e) => setClip(e.target.value)}
              margin="normal"
              size="small"
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Layer"
              type="number"
              fullWidth
              value={layer}
              onChange={(e) => setLayer(parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1 } }}
              margin="normal"
              size="small"
            />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Transizione</InputLabel>
              <Select
                value={transition}
                onChange={(e) => setTransition(e.target.value)}
                label="Transizione"
              >
                <MenuItem value="CUT">CUT</MenuItem>
                <MenuItem value="MIX">MIX</MenuItem>
                <MenuItem value="PUSH">PUSH</MenuItem>
                <MenuItem value="WIPE">WIPE</MenuItem>
                <MenuItem value="SLIDE">SLIDE</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {transition !== 'CUT' && (
            <Grid item xs={6}>
              <TextField
                label="Durata (frames)"
                type="number"
                fullWidth
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 0 } }}
                margin="normal"
                size="small"
              />
            </Grid>
          )}

          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                  color="primary"
                />
              }
              label="Loop"
              sx={{ mt: 2 }}
            />
          </Grid>

          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={auto}
                  onChange={(e) => setAuto(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto"
              sx={{ mt: 2 }}
            />
          </Grid>
        </Grid>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="outlined"
          onClick={() => onLoadBg(channel, layer, clip, { loop, transition, duration, auto })}
          disabled={!clip || loading}
        >
          Load BG
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={() => onPlay(channel, layer, clip, { loop, transition, duration, auto })}
          disabled={!clip || loading}
        >
          Play
        </Button>

        <Button
          variant="contained"
          color="error"
          startIcon={<StopIcon />}
          onClick={() => onStop(channel, layer)}
          disabled={!isPlaying || loading}
        >
          Stop
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={() => onClear(channel, layer)}
          disabled={loading}
        >
          Clear
        </Button>
      </CardActions>

      {isPlaying && (
        <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', borderTop: '1px solid rgba(76, 175, 80, 0.24)' }}>
          <Typography variant="body2">
            In riproduzione: {currentPlaying.clip}
          </Typography>
        </Box>
      )}
    </Card>
  );
};

const PlayoutControl = () => {
  const {
    connected,
    mediaList,
    getMediaList,
    play,
    stop,
    loadbg,
    clear,
    loading
  } = useCaspar();

  // Stato per i canali
  const [channels, setChannels] = useState([1, 2]);
  const [currentPlaying, setCurrentPlaying] = useState(null);

  // Stato per gli errori
  const [error, setError] = useState(null);

  // Carica la lista dei media quando la pagina viene caricata
  useEffect(() => {
    if (connected) {
      getMediaList();
    }
  }, [connected, getMediaList]);

  // Riproduzione di un clip
  const handlePlay = async (channel, layer, clip, options) => {
    if (!connected) return;

    setError(null);

    try {
      await play(channel, layer, clip, options);
      setCurrentPlaying({ channel, layer, clip });
    } catch (error) {
      console.error('Errore nella riproduzione del clip:', error);
      setError(`Errore nella riproduzione del clip: ${error.message}`);
    }
  };

  // Arresto della riproduzione
  const handleStop = async (channel, layer) => {
    if (!connected) return;

    setError(null);

    try {
      await stop(channel, layer);

      if (currentPlaying &&
          currentPlaying.channel === channel &&
          currentPlaying.layer === layer) {
        setCurrentPlaying(null);
      }
    } catch (error) {
      console.error('Errore nell\'arresto della riproduzione:', error);
      setError(`Errore nell'arresto della riproduzione: ${error.message}`);
    }
  };

  // Caricamento di un clip in background
  const handleLoadBg = async (channel, layer, clip, options) => {
    if (!connected) return;

    setError(null);

    try {
      await loadbg(channel, layer, clip, options);
    } catch (error) {
      console.error('Errore nel caricamento del clip in background:', error);
      setError(`Errore nel caricamento del clip in background: ${error.message}`);
    }
  };

  // Pulizia di un layer
  const handleClear = async (channel, layer) => {
    if (!connected) return;

    setError(null);

    try {
      await clear(channel, layer);

      if (currentPlaying &&
          currentPlaying.channel === channel &&
          currentPlaying.layer === layer) {
        setCurrentPlaying(null);
      }
    } catch (error) {
      console.error('Errore nella pulizia del layer:', error);
      setError(`Errore nella pulizia del layer: ${error.message}`);
    }
  };

  // Aggiunta di un canale
  const handleAddChannel = () => {
    const newChannel = Math.max(...channels) + 1;
    setChannels([...channels, newChannel]);
  };

  // Rimozione di un canale
  const handleRemoveChannel = () => {
    if (channels.length > 1) {
      const newChannels = [...channels];
      newChannels.pop();
      setChannels(newChannels);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Controllo Playout
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
            <Typography variant="h6">
              Controllo Canali
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleRemoveChannel}
                disabled={channels.length <= 1}
              >
                Rimuovi Canale
              </Button>

              <Button
                variant="outlined"
                onClick={handleAddChannel}
              >
                Aggiungi Canale
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {channels.map((channel) => (
          <Grid item xs={12} md={6} key={channel}>
            <ChannelControl
              channel={channel}
              onPlay={handlePlay}
              onStop={handleStop}
              onLoadBg={handleLoadBg}
              onClear={handleClear}
              loading={loading}
              currentPlaying={currentPlaying}
            />
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mt: 3,
          backgroundColor: '#2d2d2d'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Media Disponibili
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={1}>
          {mediaList.length > 0 ? (
            mediaList.map((media, index) => (
              <Grid item key={index}>
                <Chip
                  label={media}
                  onClick={() => {
                    // Copia negli appunti
                    navigator.clipboard.writeText(media);
                  }}
                  sx={{
                    maxWidth: 200,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">
                Nessun media disponibile
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default PlayoutControl;
