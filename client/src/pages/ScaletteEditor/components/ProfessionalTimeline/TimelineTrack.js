import React, { useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';
import { msToTimecode } from '../../utils/timelineUtils';

/**
 * Singola traccia della timeline con elementi
 */
const TimelineTrack = ({
  track,
  items,
  width,
  labelWidth,
  zoom,
  scrollX,
  selectedItem,
  onItemSelect,
  onItemMouseDown,
  onItemPlay,
  onItemStop
}) => {
  const canvasRef = useRef(null);
  const [hoveredItem, setHoveredItem] = React.useState(null);
  const [cursorType, setCursorType] = React.useState('default');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Setup canvas per alta risoluzione
    canvas.width = width * dpr;
    canvas.height = track.height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${track.height}px`;
    ctx.scale(dpr, dpr);

    // Pulisci canvas
    ctx.clearRect(0, 0, width, track.height);

    // Sfondo traccia
    ctx.fillStyle = track.id === 'pgm' ? '#2a1a1a' : '#1a1a1a';
    ctx.fillRect(0, 0, width, track.height);

    // Griglia temporale sottile
    const pixelsPerSecond = zoom;
    let gridInterval = 5000; // 5 secondi
    if (pixelsPerSecond >= 50) gridInterval = 1000; // 1 secondo
    else if (pixelsPerSecond < 20) gridInterval = 10000; // 10 secondi

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const startTime = scrollX;
    const endTime = scrollX + (width / zoom);
    const startGrid = Math.floor(startTime / gridInterval) * gridInterval;

    for (let time = startGrid; time <= endTime; time += gridInterval) {
      const x = (time - scrollX) * zoom;
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, track.height);
        ctx.stroke();
      }
    }

    // Disegna elementi con larghezza minima broadcast-grade
    items.forEach(item => {
      const startX = (item.startTimeMs - scrollX) * zoom;
      const itemWidth = item.displayWidth || (item.durationMs * zoom);
      const endX = startX + itemWidth;

      // Solo se visibile
      if (endX >= 0 && startX <= width) {
        const isSelected = selectedItem && selectedItem.id === item.id;
        const isCompressed = item.isCompressed || false;

        // Sfondo elemento con indicatore compressione
        ctx.fillStyle = item.color || track.color;
        ctx.globalAlpha = isSelected ? 1.0 : 0.8;
        ctx.fillRect(startX, 2, itemWidth, track.height - 4);

        // Bordo con feedback visivo per selezione
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(startX, 2, itemWidth, track.height - 4);

        // Indicatore elemento compresso
        if (isCompressed) {
          ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
          ctx.fillRect(startX, 2, 4, track.height - 4);
        }

        // Testo elemento con supporto per elementi compressi
        if (itemWidth > 30) { // Soglia ridotta per elementi compressi
          ctx.fillStyle = '#ffffff';
          ctx.font = itemWidth > 60 ? '12px Arial' : '10px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          const text = item.displayName || item.name || 'Unnamed';
          const maxWidth = itemWidth - (isCompressed ? 12 : 8); // Spazio per indicatore

          // Tronca testo se necessario
          let displayText = text;
          const textWidth = ctx.measureText(text).width;
          if (textWidth > maxWidth) {
            while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
              displayText = displayText.slice(0, -1);
            }
            displayText += '...';
          }

          const textX = startX + (isCompressed ? 8 : 4);
          ctx.fillText(displayText, textX, 6);

          // Timecode per elementi non compressi o abbastanza alti
          if (track.height > 35 && itemWidth > 80) {
            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const startTime = msToTimecode(item.startTimeMs, 25, false);
            const duration = msToTimecode(item.durationMs, 25, false);
            ctx.fillText(`${startTime} (${duration})`, textX, track.height - 16);
          }
        }

        // Resize handles per elementi selezionati
        if (isSelected && itemWidth > 20) {
          ctx.fillStyle = '#ffffff';
          // Handle sinistro
          ctx.fillRect(startX, 2, 3, track.height - 4);
          // Handle destro
          ctx.fillRect(startX + itemWidth - 3, 2, 3, track.height - 4);
        }

        // Indicatore tipo elemento (piccolo quadrato colorato)
        const typeColor = getTypeColor(item.type);
        ctx.fillStyle = typeColor;
        ctx.fillRect(startX + 2, 4, 6, 6);
      }
    });

    // Linea di separazione inferiore
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, track.height - 0.5);
    ctx.lineTo(width, track.height - 0.5);
    ctx.stroke();

  }, [track, items, width, zoom, scrollX, selectedItem]);

  /**
   * Ottiene colore per tipo elemento
   */
  const getTypeColor = (type) => {
    switch (type) {
      case 'MEDIA': return '#00ff00';
      case 'TEMPLATE': return '#ffff00';
      case 'AUDIO': return '#00ffff';
      case 'STORY': return '#ff00ff';
      default: return '#ffffff';
    }
  };

  /**
   * Gestisce mouse move per hover states e cursor changes
   */
  const handleCanvasMouseMove = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const timeMs = (x / zoom) + scrollX;

    // Trova elemento sotto il cursore
    const hoveredItem = items.find(item =>
      timeMs >= item.startTimeMs && timeMs <= item.endTimeMs
    );

    setHoveredItem(hoveredItem);

    if (hoveredItem) {
      const itemStartX = (hoveredItem.startTimeMs - scrollX) * zoom;
      const itemWidth = hoveredItem.displayWidth || (hoveredItem.durationMs * zoom);
      const relativeX = x - itemStartX;

      // Determina tipo di cursore basato sulla posizione
      if (relativeX <= 5) {
        setCursorType('w-resize'); // Resize sinistro
      } else if (relativeX >= itemWidth - 5) {
        setCursorType('e-resize'); // Resize destro
      } else {
        setCursorType('move'); // Drag elemento
      }
    } else {
      setCursorType('default');
    }
  };

  /**
   * Gestisce click su canvas per selezione elementi
   */
  const handleCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const timeMs = (x / zoom) + scrollX;

    // Trova elemento sotto il cursore
    const clickedItem = items.find(item =>
      timeMs >= item.startTimeMs && timeMs <= item.endTimeMs
    );

    if (clickedItem) {
      if (onItemSelect) {
        onItemSelect(clickedItem);
      }
    }
  };

  /**
   * Gestisce mouse down per drag
   */
  const handleCanvasMouseDown = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const timeMs = (x / zoom) + scrollX;

    // Trova elemento sotto il cursore
    const clickedItem = items.find(item =>
      timeMs >= item.startTimeMs && timeMs <= item.endTimeMs
    );

    if (clickedItem && onItemMouseDown) {
      onItemMouseDown(event, clickedItem);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: track.height }}>
      {/* Label traccia */}
      <Box
        sx={{
          width: labelWidth,
          backgroundColor: '#2a2a2a',
          borderRight: '1px solid #444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          borderBottom: '1px solid #333'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: track.color,
            fontWeight: 'bold',
            fontSize: '11px'
          }}
        >
          {track.name}
        </Typography>

        {/* Controlli traccia */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Play Track">
            <IconButton
              size="small"
              sx={{ color: '#888', p: 0.25 }}
              onClick={() => {
                // Play primo elemento della traccia
                if (items.length > 0 && onItemPlay) {
                  onItemPlay(items[0]);
                }
              }}
            >
              <PlayArrow fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Stop Track">
            <IconButton
              size="small"
              sx={{ color: '#888', p: 0.25 }}
              onClick={() => {
                // Stop tutti gli elementi della traccia
                items.forEach(item => {
                  if (onItemStop) onItemStop(item);
                });
              }}
            >
              <Stop fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Area canvas timeline */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          cursor: cursorType
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        title={hoveredItem ? `${hoveredItem.displayName} (${msToTimecode(hoveredItem.durationMs, 25, false)})` : ''}
      />
    </Box>
  );
};

export default TimelineTrack;
