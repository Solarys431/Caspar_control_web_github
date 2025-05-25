import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useRundown } from '../../../contexts/RundownContext';


/**
 * Componente per visualizzare l'orologio e i controlli di riproduzione.
 */
const RundownClock = ({ connected, playAll, stopAll }) => {
  const {
    // currentTime non utilizzato
    scheduledPlayback,
    toggleScheduledPlayback,
    playingItems,
    items
  } = useRundown();

  // Stato locale per l'ora corrente
  const [localTime, setLocalTime] = useState(new Date());

  // Aggiorna l'ora locale ogni secondo
  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{
      mr: 2,
      p: 1.5,
      borderRadius: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minWidth: '200px',
      position: 'relative'
    }}>
      <Typography
        variant="h6"
        sx={{
          fontFamily: 'monospace',
          fontWeight: 'bold',
          fontSize: '1.5rem',
          color: '#ff5722',
          textShadow: '0 0 5px rgba(255, 87, 34, 0.5)',
          letterSpacing: '1px'
        }}
      >
        {localTime.toTimeString().substring(0, 8)}
      </Typography>

      {/* PROBLEMA 2: Rimossi controlli duplicati "Play All" e "Stop All"
          Questi controlli sono già disponibili in RundownHeader.js come "Auto Play" */}

      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mt: 1,
        width: '100%'
      }}>
        <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>
          Pianificazione:
        </Typography>
        <Button
          variant={scheduledPlayback ? "contained" : "outlined"}
          color={scheduledPlayback ? "success" : "primary"}
          size="small"
          onClick={toggleScheduledPlayback}
          sx={{ fontSize: '0.7rem', minWidth: '80px' }}
        >
          {scheduledPlayback ? "ATTIVA" : "DISATTIVA"}
        </Button>
      </Box>

      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: 2,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontWeight: 'bold',
          color: 'text.secondary',
          fontSize: '0.65rem',
          letterSpacing: '1px'
        }}
      >
        ORARIO CORRENTE
      </Typography>

      {playingItems.length > 0 && (
        <Chip
          label={`${playingItems.length} in onda`}
          size="small"
          color="success"
          sx={{ mt: 1, height: 24 }}
        />
      )}
    </Box>
  );
};

export default RundownClock;
