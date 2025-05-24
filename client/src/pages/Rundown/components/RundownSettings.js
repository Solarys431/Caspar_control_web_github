import React, { useState } from 'react';
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
  Slider,
  Box
} from '@mui/material';
import { useRundown } from '../../../contexts/RundownContext';

/**
 * Componente per le impostazioni del rundown.
 */
const RundownSettings = ({ open, onClose }) => {
  const {
    dayStartTime,
    setDayStart,
    autoPlay,
    setAutoPlay,
    scheduledPlayback,
    toggleScheduledPlayback
  } = useRundown();

  // Stato locale per le impostazioni
  const [localDayStartTime, setLocalDayStartTime] = useState(dayStartTime);
  const [localAutoPlay, setLocalAutoPlay] = useState(autoPlay);

  // Gestione del salvataggio delle impostazioni
  const handleSave = () => {
    setDayStart(localDayStartTime);
    setAutoPlay(localAutoPlay);
    onClose();
  };

  // Gestione della chiusura senza salvare
  const handleCancel = () => {
    // Ripristina i valori originali
    setLocalDayStartTime(dayStartTime);
    setLocalAutoPlay(autoPlay);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Impostazioni Rundown</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Impostazioni Generali
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Ora di inizio giornata"
              type="time"
              value={localDayStartTime}
              onChange={(e) => setLocalDayStartTime(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 300, // 5 minuti
              }}
              fullWidth
              helperText="Imposta l'ora di inizio della giornata per la pianificazione"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localAutoPlay}
                  onChange={(e) => setLocalAutoPlay(e.target.checked)}
                  color="primary"
                />
              }
              label="Riproduzione automatica"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Riproduce automaticamente gli elementi in sequenza
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Impostazioni di Visualizzazione
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography id="timeline-slider-label" gutterBottom>
              Dimensione Timeline
            </Typography>
            <Slider
              aria-labelledby="timeline-slider-label"
              valueLabelDisplay="auto"
              step={10}
              marks
              min={30}
              max={100}
              defaultValue={50}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Impostazioni di Pianificazione
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography sx={{ mr: 2 }}>
                Pianificazione:
              </Typography>
              <Button
                variant="contained"
                color={scheduledPlayback ? "error" : "success"}
                onClick={toggleScheduledPlayback}
              >
                {scheduledPlayback ? "Disattiva Pianificazione" : "Attiva Pianificazione"}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              La pianificazione riproduce automaticamente gli elementi all'orario specificato
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Impostazioni Avanzate
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Canale predefinito</InputLabel>
              <Select
                value={1}
                label="Canale predefinito"
              >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Layer predefinito</InputLabel>
              <Select
                value={10}
                label="Layer predefinito"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={30}>30</MenuItem>
                <MenuItem value={40}>40</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Annulla</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RundownSettings;
