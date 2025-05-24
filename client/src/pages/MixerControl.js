import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Slider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Card,
  CardContent,
  CardActions,
  // Chip non viene utilizzato, lo manteniamo commentato per riferimento futuro
  // Chip,
  Alert,
  // CircularProgress non viene utilizzato, lo manteniamo commentato per riferimento futuro
  // CircularProgress
} from '@mui/material';
import { useCaspar } from '../contexts/CasparContext';

// Componente per il controllo del mixer di un layer
const LayerMixerControl = ({ channel, layer, onMixer, loading }) => {
  // Stato per i parametri del mixer
  const [fill, setFill] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const [opacity, setOpacity] = useState(1);
  const [duration, setDuration] = useState(0);
  const [tween, setTween] = useState('linear');

  // Gestione del cambiamento di fill
  const handleFillChange = (property, value) => {
    setFill({ ...fill, [property]: value });
  };

  // Gestione del cambiamento di opacità
  const handleOpacityChange = (_event, value) => {
    // Usiamo _event per indicare che il parametro non viene utilizzato
    setOpacity(value);
  };

  // Applicazione dei parametri del mixer
  const handleApplyFill = () => {
    onMixer(channel, layer, 'FILL', [fill.x, fill.y, fill.width, fill.height], duration, tween);
  };

  // Applicazione dell'opacità
  const handleApplyOpacity = () => {
    onMixer(channel, layer, 'OPACITY', opacity, duration, tween);
  };

  // Reset dei parametri del mixer
  const handleReset = () => {
    setFill({ x: 0, y: 0, width: 1, height: 1 });
    setOpacity(1);
    setDuration(0);
    setTween('linear');

    // Applica i valori di default
    onMixer(channel, layer, 'FILL', [0, 0, 1, 1], 0, 'linear');
    onMixer(channel, layer, 'OPACITY', 1, 0, 'linear');
  };

  return (
    <Card sx={{ backgroundColor: '#3d3d3d', mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Canale {channel} - Layer {layer}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Posizione e Dimensione (FILL)
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" gutterBottom>
              Posizione X: {fill.x.toFixed(2)}
            </Typography>
            <Slider
              value={fill.x}
              onChange={(_e, value) => handleFillChange('x', value)}
              min={-1}
              max={2}
              step={0.01}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" gutterBottom>
              Posizione Y: {fill.y.toFixed(2)}
            </Typography>
            <Slider
              value={fill.y}
              onChange={(_e, value) => handleFillChange('y', value)}
              min={-1}
              max={2}
              step={0.01}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" gutterBottom>
              Larghezza: {fill.width.toFixed(2)}
            </Typography>
            <Slider
              value={fill.width}
              onChange={(_e, value) => handleFillChange('width', value)}
              min={0}
              max={2}
              step={0.01}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" gutterBottom>
              Altezza: {fill.height.toFixed(2)}
            </Typography>
            <Slider
              value={fill.height}
              onChange={(_e, value) => handleFillChange('height', value)}
              min={0}
              max={2}
              step={0.01}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyFill}
              disabled={loading}
              fullWidth
            >
              Applica FILL
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Opacità
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Opacità: {opacity.toFixed(2)}
            </Typography>
            <Slider
              value={opacity}
              onChange={handleOpacityChange}
              min={0}
              max={1}
              step={0.01}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyOpacity}
              disabled={loading}
              fullWidth
            >
              Applica Opacità
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Transizione
            </Typography>
          </Grid>

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

          <Grid item xs={6}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Tween</InputLabel>
              <Select
                value={tween}
                onChange={(e) => setTween(e.target.value)}
                label="Tween"
              >
                <MenuItem value="linear">Linear</MenuItem>
                <MenuItem value="easeInQuad">Ease In Quad</MenuItem>
                <MenuItem value="easeOutQuad">Ease Out Quad</MenuItem>
                <MenuItem value="easeInOutQuad">Ease In Out Quad</MenuItem>
                <MenuItem value="easeInCubic">Ease In Cubic</MenuItem>
                <MenuItem value="easeOutCubic">Ease Out Cubic</MenuItem>
                <MenuItem value="easeInOutCubic">Ease In Out Cubic</MenuItem>
                <MenuItem value="easeInQuart">Ease In Quart</MenuItem>
                <MenuItem value="easeOutQuart">Ease Out Quart</MenuItem>
                <MenuItem value="easeInOutQuart">Ease In Out Quart</MenuItem>
                <MenuItem value="easeInQuint">Ease In Quint</MenuItem>
                <MenuItem value="easeOutQuint">Ease Out Quint</MenuItem>
                <MenuItem value="easeInOutQuint">Ease In Out Quint</MenuItem>
                <MenuItem value="easeInSine">Ease In Sine</MenuItem>
                <MenuItem value="easeOutSine">Ease Out Sine</MenuItem>
                <MenuItem value="easeInOutSine">Ease In Out Sine</MenuItem>
                <MenuItem value="easeInExpo">Ease In Expo</MenuItem>
                <MenuItem value="easeOutExpo">Ease Out Expo</MenuItem>
                <MenuItem value="easeInOutExpo">Ease In Out Expo</MenuItem>
                <MenuItem value="easeInCirc">Ease In Circ</MenuItem>
                <MenuItem value="easeOutCirc">Ease Out Circ</MenuItem>
                <MenuItem value="easeInOutCirc">Ease In Out Circ</MenuItem>
                <MenuItem value="easeInElastic">Ease In Elastic</MenuItem>
                <MenuItem value="easeOutElastic">Ease Out Elastic</MenuItem>
                <MenuItem value="easeInOutElastic">Ease In Out Elastic</MenuItem>
                <MenuItem value="easeInBack">Ease In Back</MenuItem>
                <MenuItem value="easeOutBack">Ease Out Back</MenuItem>
                <MenuItem value="easeInOutBack">Ease In Out Back</MenuItem>
                <MenuItem value="easeInBounce">Ease In Bounce</MenuItem>
                <MenuItem value="easeOutBounce">Ease Out Bounce</MenuItem>
                <MenuItem value="easeInOutBounce">Ease In Out Bounce</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleReset}
          disabled={loading}
        >
          Reset
        </Button>
      </CardActions>
    </Card>
  );
};

const MixerControl = () => {
  const { connected, mixer, loading } = useCaspar();

  // Stato per i layer
  const [layers, setLayers] = useState([
    { channel: 1, layer: 10 },
    { channel: 1, layer: 20 }
  ]);

  // Stato per gli errori
  const [error, setError] = useState(null);

  // Gestione del mixer
  const handleMixer = async (channel, layer, property, value, duration, tween) => {
    if (!connected) return;

    setError(null);

    try {
      if (property === 'FILL') {
        await mixer(channel, layer, property, value.join(' '), duration, tween);
      } else {
        await mixer(channel, layer, property, value, duration, tween);
      }
    } catch (error) {
      console.error(`Errore nell'impostazione del mixer ${property}:`, error);
      setError(`Errore nell'impostazione del mixer ${property}: ${error.message}`);
    }
  };

  // Aggiunta di un layer
  const handleAddLayer = () => {
    // Trova il canale e il layer più alti
    const highestChannel = Math.max(...layers.map(l => l.channel));
    const highestLayer = Math.max(...layers.filter(l => l.channel === highestChannel).map(l => l.layer));

    // Aggiungi un nuovo layer
    setLayers([...layers, { channel: highestChannel, layer: highestLayer + 10 }]);
  };

  // Rimozione di un layer
  const handleRemoveLayer = () => {
    if (layers.length > 1) {
      const newLayers = [...layers];
      newLayers.pop();
      setLayers(newLayers);
    }
  };

  // Aggiunta di un canale
  const handleAddChannel = () => {
    // Trova il canale più alto
    const highestChannel = Math.max(...layers.map(l => l.channel));

    // Aggiungi un nuovo layer con un nuovo canale
    setLayers([...layers, { channel: highestChannel + 1, layer: 10 }]);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Controllo Mixer
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
              Controllo Layer
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleRemoveLayer}
                disabled={layers.length <= 1}
              >
                Rimuovi Layer
              </Button>

              <Button
                variant="outlined"
                onClick={handleAddLayer}
              >
                Aggiungi Layer
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
        {layers.map((layer, index) => (
          <Grid item xs={12} md={6} key={index}>
            <LayerMixerControl
              channel={layer.channel}
              layer={layer.layer}
              onMixer={handleMixer}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MixerControl;
