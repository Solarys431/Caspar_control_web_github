import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import LoopIcon from '@mui/icons-material/Loop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import AutorenewIcon from '@mui/icons-material/Autorenew';

/**
 * Componente per i controlli contestuali dell'item selezionato
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.selectedItem - Item selezionato
 * @param {Object} props.playbackStatus - Stato di riproduzione
 * @param {string} props.currentTimecode - Timecode corrente
 * @param {string} props.totalDuration - Durata totale
 * @param {number} props.progressValue - Valore della barra di progresso
 * @param {Function} props.onPlaybackControl - Funzione per gestire i controlli di riproduzione
 * @param {Function} props.onTake - Funzione per eseguire il take
 * @param {boolean} props.autoMode - Se la modalità auto è attiva
 * @param {Function} props.onToggleAutoMode - Funzione per attivare/disattivare la modalità auto
 * @param {string} props.transitionType - Tipo di transizione selezionato
 * @param {Function} props.onTransitionChange - Funzione per cambiare il tipo di transizione
 * @returns {JSX.Element} - Componente React
 */
const ItemContextControls = ({
  selectedItem,
  playbackStatus = 'STOPPED',
  currentTimecode = '00:00:00:00',
  totalDuration = '00:00:00:00',
  progressValue = 0,
  onPlaybackControl,
  onTake,
  autoMode = false,
  onToggleAutoMode,
  transitionType = 'CUT',
  onTransitionChange
}) => {
  // Verifica se c'è un item selezionato
  const hasSelectedItem = !!selectedItem;

  // Determina il tipo di item
  const itemType = selectedItem?.type || '';
  const isMedia = itemType === 'MEDIA';
  const isTemplate = itemType === 'TEMPLATE';

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      p: 1,
      overflow: 'hidden'
    }}>
      {/* Header con titolo dell'item */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 1,
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle1" fontWeight="medium" noWrap>
          {hasSelectedItem ? (selectedItem.data?.customName || selectedItem.name || 'Item Selezionato') : 'Nessun item selezionato'}
        </Typography>
        <Chip
          label={playbackStatus}
          size="small"
          color={
            playbackStatus === 'PLAYING' ? 'success' :
            playbackStatus === 'PAUSED' ? 'warning' :
            'default'
          }
        />
      </Box>

      {/* Barra di progresso e timecode */}
      <Box sx={{ mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 0.5,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: playbackStatus === 'PLAYING' ? 'success.main' :
                              playbackStatus === 'PAUSED' ? 'warning.main' : 'grey.500'
            }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {currentTimecode}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {totalDuration}
          </Typography>
        </Box>
      </Box>

      {/* Controlli di riproduzione specifici per l'item */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Controlli Item
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Tooltip title="Play">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onPlaybackControl('play')}
                disabled={!hasSelectedItem}
              >
                <PlayArrowIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Pausa">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onPlaybackControl('pause')}
                disabled={!hasSelectedItem}
              >
                <PauseIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Stop">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onPlaybackControl('stop')}
                disabled={!hasSelectedItem}
              >
                <StopIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Loop">
            <span>
              <IconButton
                size="small"
                color={selectedItem?.data?.loop ? "secondary" : "default"}
                onClick={() => onPlaybackControl('toggleLoop')}
                disabled={!hasSelectedItem || !isMedia}
              >
                <LoopIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={selectedItem?.data?.muted ? "Unmute" : "Mute"}>
            <span>
              <IconButton
                size="small"
                color={selectedItem?.data?.muted ? "default" : "primary"}
                onClick={() => onPlaybackControl('toggleMute')}
                disabled={!hasSelectedItem || !isMedia}
              >
                {selectedItem?.data?.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default ItemContextControls;
