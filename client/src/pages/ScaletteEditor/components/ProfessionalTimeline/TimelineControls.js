import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Slider,
  Tooltip,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipPrevious,
  SkipNext,
  ZoomIn,
  ZoomOut,
  FitScreen
} from '@mui/icons-material';
import { msToTimecode } from '../../utils/timelineUtils';

/**
 * Controlli della timeline professionale con sync CasparCG
 */
const TimelineControls = ({
  isPlaying,
  currentTime,
  zoom,
  onPlay,
  onPause,
  onStop,
  onZoomChange,
  onSeek,
  oscData = {}
}) => {

  /**
   * Gestisce il cambio di zoom
   */
  const handleZoomChange = (factor) => {
    const newZoom = Math.max(0.1, Math.min(10, zoom * factor));
    onZoomChange(newZoom);
  };

  /**
   * Zoom per adattare tutto il contenuto
   */
  const handleFitToWindow = () => {
    // Calcola zoom ottimale per mostrare 24 ore
    const windowWidth = window.innerWidth - 200; // Considera sidebar
    const totalDuration = 24 * 60 * 60 * 1000; // 24 ore in ms
    const optimalZoom = windowWidth / totalDuration;
    onZoomChange(optimalZoom);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1,
        backgroundColor: '#2a2a2a',
        borderBottom: '1px solid #444',
        minHeight: 56
      }}
    >
      {/* Controlli di trasporto broadcast-grade */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Previous (-5s) [←]">
          <IconButton
            size="small"
            sx={{
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
            onClick={() => onSeek(Math.max(0, currentTime - 5000))}
          >
            <SkipPrevious />
          </IconButton>
        </Tooltip>

        <Tooltip title={isPlaying ? "Pause [Space]" : "Play [Space]"}>
          <IconButton
            size="medium"
            sx={{
              color: '#fff',
              backgroundColor: isPlaying ? '#ff9800' : '#4caf50',
              border: isPlaying ? '2px solid #ffcc02' : '2px solid #66bb6a',
              '&:hover': {
                backgroundColor: isPlaying ? '#f57c00' : '#388e3c',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Stop [Esc]">
          <IconButton
            size="small"
            sx={{
              color: '#fff',
              backgroundColor: currentTime > 0 ? '#f44336' : 'rgba(244, 67, 54, 0.3)',
              '&:hover': {
                backgroundColor: '#d32f2f',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={onStop}
            disabled={currentTime === 0}
          >
            <Stop />
          </IconButton>
        </Tooltip>

        <Tooltip title="Next (+5s) [→]">
          <IconButton
            size="small"
            sx={{
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
            onClick={() => onSeek(currentTime + 5000)}
          >
            <SkipNext />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ borderColor: '#555' }} />

      {/* Display timecode corrente con sync OSC */}
      <Box sx={{ minWidth: 140, textAlign: 'center' }}>
        <Typography
          variant="h6"
          sx={{
            color: isPlaying ? '#00ff00' : '#ffff00',
            fontFamily: '"Courier New", monospace',
            fontSize: '16px',
            fontWeight: 'bold',
            textShadow: '0 0 4px rgba(0, 255, 0, 0.5)'
          }}
        >
          {oscData.timecode || msToTimecode(currentTime, 25, false)}
        </Typography>
        {oscData.progress !== undefined && (
          <Typography
            variant="caption"
            sx={{
              color: '#aaa',
              fontSize: '10px',
              display: 'block'
            }}
          >
            {Math.round(oscData.progress)}%
          </Typography>
        )}
      </Box>

      <Divider orientation="vertical" flexItem sx={{ borderColor: '#555' }} />

      {/* Controlli zoom */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: '#aaa', minWidth: 40 }}>
          Zoom:
        </Typography>

        <Tooltip title="Zoom Out">
          <IconButton
            size="small"
            sx={{ color: '#fff' }}
            onClick={() => handleZoomChange(0.8)}
          >
            <ZoomOut fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ width: 100 }}>
          <Slider
            value={zoom}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(_, value) => onZoomChange(value)}
            sx={{
              color: '#2196f3',
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16
              },
              '& .MuiSlider-track': {
                height: 3
              },
              '& .MuiSlider-rail': {
                height: 3,
                backgroundColor: '#555'
              }
            }}
          />
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: '#aaa',
            minWidth: 35,
            textAlign: 'center'
          }}
        >
          {Math.round(zoom * 100)}%
        </Typography>

        <Tooltip title="Zoom In">
          <IconButton
            size="small"
            sx={{ color: '#fff' }}
            onClick={() => handleZoomChange(1.25)}
          >
            <ZoomIn fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Fit to Window">
          <IconButton
            size="small"
            sx={{ color: '#fff' }}
            onClick={handleFitToWindow}
          >
            <FitScreen fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ borderColor: '#555' }} />

      {/* Informazioni timeline */}
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" sx={{ color: '#aaa' }}>
          Professional Timeline • Broadcast Grade
        </Typography>
      </Box>
    </Box>
  );
};

export default TimelineControls;
