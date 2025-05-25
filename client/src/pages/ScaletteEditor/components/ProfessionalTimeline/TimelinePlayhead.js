import React from 'react';
import { Box } from '@mui/material';

/**
 * Playhead della timeline sincronizzato con CasparCG e draggabile
 */
const TimelinePlayhead = ({
  currentTime,
  zoom,
  scrollX,
  height,
  offsetX = 0,
  onSeek
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  // Calcola posizione X del playhead
  const playheadX = (currentTime - scrollX) * zoom + offsetX;

  // Solo mostra se visibile nell'area timeline
  if (playheadX < offsetX || playheadX > window.innerWidth) {
    return null;
  }

  /**
   * Gestisce drag del playhead per scrubbing
   */
  const handleMouseDown = (event) => {
    if (event.button !== 0) return; // Solo click sinistro

    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);

    const handleMouseMove = (e) => {
      const newX = e.clientX - offsetX;
      const newTime = Math.max(0, (newX / zoom) + scrollX);
      onSeek && onSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: playheadX,
        top: 0,
        width: 2,
        height: height,
        backgroundColor: isDragging ? '#ff6666' : '#ff0000',
        pointerEvents: 'auto',
        zIndex: 1000,
        boxShadow: isDragging ? '0 0 8px rgba(255, 0, 0, 0.8)' : '0 0 4px rgba(255, 0, 0, 0.5)',
        cursor: 'ew-resize',
        transition: isDragging ? 'none' : 'all 0.1s ease'
      }}
      onMouseDown={handleMouseDown}
      title={`Playhead - Drag to scrub (${Math.round(currentTime / 1000)}s)`}
    >
      {/* Triangolo superiore del playhead */}
      <Box
        sx={{
          position: 'absolute',
          top: -1,
          left: -6,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '8px solid #ff0000'
        }}
      />

      {/* Triangolo inferiore del playhead */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -1,
          left: -6,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid #ff0000'
        }}
      />
    </Box>
  );
};

export default TimelinePlayhead;
