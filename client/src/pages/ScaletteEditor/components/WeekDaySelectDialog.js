import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Typography,
  Divider,
  Box
} from '@mui/material';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Componente per il dialogo di selezione del giorno della settimana
 * 
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il dialogo è aperto
 * @param {Function} props.onClose - Funzione per chiudere il dialogo
 * @param {Function} props.onConfirm - Funzione chiamata quando l'utente conferma la selezione
 * @param {string} props.scalettaName - Nome della scaletta da inviare
 * @returns {JSX.Element} - Componente React
 */
const WeekDaySelectDialog = ({ open, onClose, onConfirm, scalettaName }) => {
  // Stato per il giorno selezionato (formato ISO YYYY-MM-DD)
  const [selectedDay, setSelectedDay] = useState('');
  
  // Stato per l'orario di inizio
  const [startTime, setStartTime] = useState('08:00:00');
  
  // Genera le opzioni per i giorni della settimana (7 giorni a partire da oggi)
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(new Date(), index);
    const dayIso = date.toISOString().split('T')[0];
    const dayName = format(date, 'EEEE d MMMM', { locale: it });
    return { dayIso, dayName };
  });

  // Imposta il giorno corrente come default quando il dialogo viene aperto
  useEffect(() => {
    if (open) {
      setSelectedDay(weekDays[0].dayIso);
    }
  }, [open]);

  // Gestisce la conferma della selezione
  const handleConfirm = () => {
    if (selectedDay) {
      onConfirm(selectedDay, startTime);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Invia Scaletta al Calendario</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Stai per inviare la scaletta "{scalettaName}" al calendario settimanale.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Seleziona il giorno della settimana in cui vuoi programmare questa scaletta.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="day-select-label">Giorno della settimana</InputLabel>
                <Select
                  labelId="day-select-label"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  label="Giorno della settimana"
                >
                  {weekDays.map((day) => (
                    <MenuItem key={day.dayIso} value={day.dayIso}>
                      {day.dayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Orario di inizio"
                type="time"
                value={startTime.substring(0, 5)}
                onChange={(e) => setStartTime(`${e.target.value}:00`)}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 minuti
                }}
                fullWidth
                helperText="Imposta l'orario di inizio per la scaletta"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          variant="contained" 
          onClick={handleConfirm}
          disabled={!selectedDay}
        >
          Conferma
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeekDaySelectDialog;
