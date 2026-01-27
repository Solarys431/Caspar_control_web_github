
import React, { useState } from 'react';
import { Box, IconButton, Button, TextField, Tooltip, Divider, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LoopIcon from '@mui/icons-material/Loop';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import UpdateIcon from '@mui/icons-material/Update';

/**
 * Componente per i controlli di riproduzione
 *
 * @param {Object} props - Proprietà del componente
 * @param {Function} props.onPlaybackControl - Funzione per gestire i controlli di riproduzione
 * @param {Function} props.onTemplateControl - Funzione per gestire i controlli dei template grafici
 * @param {boolean} props.disabled - Se i controlli sono disabilitati
 * @param {boolean} props.compact - Se mostrare i controlli in modalità compatta
 * @param {boolean} props.showTemplateControls - Se mostrare i controlli per i template grafici
 * @returns {JSX.Element} - Componente React
 */
const PlaybackControls = ({
  onPlaybackControl,
  onTemplateControl,
  disabled = false,
  compact = false,
  showTemplateControls = false
}) => {
  // Stato per il valore del frame
  const [frameValue, setFrameValue] = useState('');

  // Stile per i controlli in modalità compatta
  const compactStyle = compact ? {
    size: "small",
    iconSize: "small",
    gap: 1,
    mb: 1,
    buttonWidth: '80px',
    inputWidth: '70px'
  } : {
    size: "large",
    iconSize: "inherit",
    gap: 2,
    mb: 2,
    buttonWidth: '100px',
    inputWidth: '100px'
  };

  // Gestione del cambio del valore del frame
  const handleFrameChange = (e) => {
    setFrameValue(e.target.value);
  };

  // Gestione del click sul pulsante "Vai al Frame"
  const handleSeekToFrame = () => {
    onPlaybackControl('seekToFrame', frameValue);
  };

  return (
    <>
      {/* Controlli di riproduzione */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: compactStyle.gap,
        mb: compactStyle.mb,
        flexWrap: compact ? 'wrap' : 'nowrap'
      }}>
        <Tooltip title="Riproduci">
          <IconButton
            color="primary"
            size={compactStyle.size}
            onClick={() => onPlaybackControl('play')}
            disabled={disabled}
          >
            <PlayArrowIcon fontSize={compactStyle.iconSize} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Pausa">
          <IconButton
            color="primary"
            size={compactStyle.size}
            onClick={() => onPlaybackControl('pause')}
            disabled={disabled}
          >
            <PauseIcon fontSize={compactStyle.iconSize} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Riprendi">
          <IconButton
            color="primary"
            size={compactStyle.size}
            onClick={() => onPlaybackControl('resume')}
            disabled={disabled}
          >
            <PlayCircleOutlineIcon fontSize={compactStyle.iconSize} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Ferma">
          <IconButton
            color="primary"
            size={compactStyle.size}
            onClick={() => onPlaybackControl('stop')}
            disabled={disabled}
          >
            <StopIcon fontSize={compactStyle.iconSize} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Prossimo">
          <IconButton
            color="primary"
            size={compactStyle.size}
            onClick={() => onPlaybackControl('next')}
            disabled={disabled}
          >
            <SkipNextIcon fontSize={compactStyle.iconSize} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Loop">
          <IconButton
            color="secondary"
            size={compactStyle.size}
            onClick={() => onPlaybackControl('loop')}
            disabled={disabled}
          >
            <LoopIcon fontSize={compactStyle.iconSize} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Controlli per template grafici */}
      {showTemplateControls && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
            Controlli Template Grafici
          </Typography>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: compactStyle.gap,
            mb: compactStyle.mb,
            flexWrap: compact ? 'wrap' : 'nowrap'
          }}>
            <Tooltip title="Aggiungi Template">
              <IconButton
                color="success"
                size={compactStyle.size}
                onClick={() => onTemplateControl && onTemplateControl('cgAdd')}
                disabled={disabled}
              >
                <AddIcon fontSize={compactStyle.iconSize} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Riproduci Template">
              <IconButton
                color="primary"
                size={compactStyle.size}
                onClick={() => onTemplateControl && onTemplateControl('cgPlay')}
                disabled={disabled}
              >
                <PlayArrowIcon fontSize={compactStyle.iconSize} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Aggiorna Template">
              <IconButton
                color="info"
                size={compactStyle.size}
                onClick={() => onTemplateControl && onTemplateControl('cgUpdate')}
                disabled={disabled}
              >
                <UpdateIcon fontSize={compactStyle.iconSize} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ferma Template">
              <IconButton
                color="warning"
                size={compactStyle.size}
                onClick={() => onTemplateControl && onTemplateControl('cgStop')}
                disabled={disabled}
              >
                <StopIcon fontSize={compactStyle.iconSize} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rimuovi Template">
              <IconButton
                color="error"
                size={compactStyle.size}
                onClick={() => onTemplateControl && onTemplateControl('cgClear')}
                disabled={disabled}
              >
                <ClearIcon fontSize={compactStyle.iconSize} />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      )}

      {/* Controllo per andare a un frame specifico - nascosto in modalità compatta */}
      {!compact && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: compactStyle.gap, mb: compactStyle.mb }}>
          <TextField
            label="Frame"
            type="number"
            size="small"
            value={frameValue}
            onChange={handleFrameChange}
            InputProps={{
              inputProps: { min: 0 }
            }}
            sx={{ width: compactStyle.inputWidth }}
            disabled={disabled}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSeekToFrame}
            sx={{ height: '40px', alignSelf: 'center' }}
            disabled={disabled}
          >
            Vai al Frame
          </Button>
        </Box>
      )}
    </>
  );
};

export default PlaybackControls;
