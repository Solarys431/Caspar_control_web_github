import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * Componente per visualizzare l'ora corrente in tempo reale
 * Design accattivante e professionale per l'editor delle scalette
 */
const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Aggiorna l'ora ogni secondo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup del timer quando il componente viene smontato
    return () => clearInterval(timer);
  }, []);

  // Formatta l'ora nel formato HH:MM:SS
  const formatTime = (date) => {
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Formatta la data nel formato DD/MM/YYYY
  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Ottieni il giorno della settimana
  const getDayOfWeek = (date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long'
    });
  };

  return (
    <Paper
      elevation={2}
      sx={{
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
        p: 1.5,
        borderRadius: 2,
        minWidth: 180,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Icona */}
        <AccessTimeIcon sx={{ fontSize: '1.2rem', opacity: 0.9 }} />

        {/* Ora principale */}
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            lineHeight: 1,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            letterSpacing: '0.05em'
          }}
        >
          {formatTime(currentTime)}
        </Typography>

        {/* Data compatta */}
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            opacity: 0.8,
            fontSize: '0.75rem',
            whiteSpace: 'nowrap'
          }}
        >
          {formatDate(currentTime)}
        </Typography>

        {/* Indicatore di aggiornamento */}
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#4caf50',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                opacity: 1,
                transform: 'scale(1)'
              },
              '50%': {
                opacity: 0.5,
                transform: 'scale(1.2)'
              },
              '100%': {
                opacity: 1,
                transform: 'scale(1)'
              }
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default LiveClock;
