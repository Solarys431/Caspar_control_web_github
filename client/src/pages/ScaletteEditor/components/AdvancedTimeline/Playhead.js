import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { timecodeToMs, calculateItemX } from '../../utils/timelineUtils';

/**
 * Componente Playhead per indicare la posizione corrente di riproduzione
 * Sincronizzato con i dati OSC di CasparCG
 */
const Playhead = ({
  currentTime = '00:00:00:00',
  timelineStart = 0,
  timelineWidth = 24 * 60 * 60 * 1000,
  containerWidth = null,
  height = '100%',
  color = '#ff5722',
  showTime = true
}) => {
  /**
   * Calcola la posizione del playhead in percentuale
   */
  const playheadPosition = useMemo(() => {
    if (!currentTime || currentTime === '00:00:00:00') return null;
    
    const currentTimeMs = timecodeToMs(currentTime);
    
    // Verifica se il tempo corrente è visibile nella timeline
    if (currentTimeMs < timelineStart || currentTimeMs > timelineStart + timelineWidth) {
      return null; // Playhead fuori dalla vista corrente
    }
    
    // Calcola la posizione in percentuale
    const relativeTime = currentTimeMs - timelineStart;
    const position = (relativeTime / timelineWidth) * 100;
    
    return Math.max(0, Math.min(100, position));
  }, [currentTime, timelineStart, timelineWidth]);

  /**
   * Calcola la posizione in pixel se containerWidth è fornito
   */
  const playheadPositionPx = useMemo(() => {
    if (!containerWidth || playheadPosition === null) return null;
    
    const currentTimeMs = timecodeToMs(currentTime);
    return calculateItemX(currentTimeMs, timelineStart, timelineWidth, containerWidth);
  }, [currentTime, timelineStart, timelineWidth, containerWidth, playheadPosition]);

  // Se il playhead non è visibile, non renderizzare nulla
  if (playheadPosition === null) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: containerWidth ? `${playheadPositionPx}px` : `${playheadPosition}%`,
        height: height,
        width: '3px',
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}`,
        zIndex: 1000,
        pointerEvents: 'none',
        transform: 'translateX(-1.5px)', // Centra la linea
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-4px',
          width: '11px',
          height: '11px',
          backgroundColor: color,
          borderRadius: '50%',
          boxShadow: `0 0 6px ${color}`,
        },
        '&::after': showTime ? {
          content: `"${currentTime}"`,
          position: 'absolute',
          top: '-25px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          zIndex: 1001,
          border: `1px solid ${color}`,
        } : {}
      }}
    />
  );
};

/**
 * Variante del Playhead per timeline con tracce multiple
 */
export const MultiTrackPlayhead = ({
  currentTime = '00:00:00:00',
  timelineStart = 0,
  timelineWidth = 24 * 60 * 60 * 1000,
  tracks = [],
  containerWidth = null,
  color = '#ff5722',
  showTime = true
}) => {
  const playheadPosition = useMemo(() => {
    if (!currentTime || currentTime === '00:00:00:00') return null;
    
    const currentTimeMs = timecodeToMs(currentTime);
    
    if (currentTimeMs < timelineStart || currentTimeMs > timelineStart + timelineWidth) {
      return null;
    }
    
    const relativeTime = currentTimeMs - timelineStart;
    const position = (relativeTime / timelineWidth) * 100;
    
    return Math.max(0, Math.min(100, position));
  }, [currentTime, timelineStart, timelineWidth]);

  const playheadPositionPx = useMemo(() => {
    if (!containerWidth || playheadPosition === null) return null;
    
    const currentTimeMs = timecodeToMs(currentTime);
    return calculateItemX(currentTimeMs, timelineStart, timelineWidth, containerWidth);
  }, [currentTime, timelineStart, timelineWidth, containerWidth, playheadPosition]);

  // Calcola l'altezza totale delle tracce
  const totalHeight = useMemo(() => {
    return tracks.reduce((sum, track) => sum + (track.height || 50), 0);
  }, [tracks]);

  if (playheadPosition === null) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: containerWidth ? `${playheadPositionPx}px` : `${playheadPosition}%`,
        height: `${totalHeight}px`,
        width: '3px',
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}`,
        zIndex: 1000,
        pointerEvents: 'none',
        transform: 'translateX(-1.5px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-4px',
          width: '11px',
          height: '11px',
          backgroundColor: color,
          borderRadius: '50%',
          boxShadow: `0 0 6px ${color}`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: '-4px',
          width: '11px',
          height: '11px',
          backgroundColor: color,
          borderRadius: '50%',
          boxShadow: `0 0 6px ${color}`,
        }
      }}
    >
      {/* Timecode display */}
      {showTime && (
        <Box
          sx={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            zIndex: 1001,
            border: `1px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `4px solid ${color}`,
            }
          }}
        >
          {currentTime}
        </Box>
      )}
    </Box>
  );
};

/**
 * Playhead per la timeline principale (semplificato)
 */
export const MainPlayhead = (props) => {
  return <Playhead {...props} height="100%" showTime={true} />;
};

/**
 * Playhead per la timeline delle storie (con tracce multiple)
 */
export const StoryPlayhead = (props) => {
  return <MultiTrackPlayhead {...props} showTime={true} />;
};

export default Playhead;
