import React, { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

/**
 * Componente Canvas ottimizzato per il rendering della timeline
 * Gestisce il rendering ad alte prestazioni di elementi timeline
 */
const TimelineCanvas = ({
  width = 800,
  height = 400,
  items = [],
  tracks = [],
  timelineStart = 0,
  timelineWidth = 24 * 60 * 60 * 1000,
  selectedItems = [],
  hoveredItem = null,
  draggedItem = null,
  snapLines = [],
  showGrid = false,
  gridSize = 1000,
  onRender,
  style = {}
}) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  /**
   * Funzione principale di rendering
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width: canvasWidth, height: canvasHeight } = canvas;

    // Pulisci il canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Sfondo
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Griglia (se abilitata)
    if (showGrid) {
      renderGrid(ctx, canvasWidth, canvasHeight);
    }

    // Tracce (se presenti)
    if (tracks && tracks.length > 0) {
      renderTracks(ctx, canvasWidth, canvasHeight);
    }

    // Elementi
    renderItems(ctx, canvasWidth, canvasHeight);

    // Linee di snap
    if (snapLines && snapLines.length > 0) {
      renderSnapLines(ctx, canvasWidth, canvasHeight);
    }

    // Callback di rendering completato
    if (onRender) {
      onRender(ctx, canvasWidth, canvasHeight);
    }
  }, [
    items,
    tracks,
    timelineStart,
    timelineWidth,
    selectedItems,
    hoveredItem,
    draggedItem,
    snapLines,
    showGrid,
    gridSize,
    onRender
  ]);

  /**
   * Renderizza la griglia temporale
   */
  const renderGrid = useCallback((ctx, canvasWidth, canvasHeight) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const startTime = timelineStart;
    const endTime = startTime + timelineWidth;

    for (let time = Math.ceil(startTime / gridSize) * gridSize; time <= endTime; time += gridSize) {
      const x = ((time - startTime) / timelineWidth) * canvasWidth;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
  }, [timelineStart, timelineWidth, gridSize]);

  /**
   * Renderizza le tracce di sfondo
   */
  const renderTracks = useCallback((ctx, canvasWidth, canvasHeight) => {
    let currentY = 0;
    
    tracks.forEach((track, index) => {
      // Sfondo alternato
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, currentY, canvasWidth, track.height);

      // Bordo traccia
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, currentY + track.height);
      ctx.lineTo(canvasWidth, currentY + track.height);
      ctx.stroke();

      // Barra colorata laterale
      ctx.fillStyle = track.color || '#4CAF50';
      ctx.fillRect(0, currentY, 4, track.height);

      currentY += track.height;
    });
  }, [tracks]);

  /**
   * Renderizza gli elementi della timeline
   */
  const renderItems = useCallback((ctx, canvasWidth, canvasHeight) => {
    items.forEach(item => {
      renderItem(ctx, item, canvasWidth, canvasHeight);
    });
  }, [items, timelineStart, timelineWidth, selectedItems, hoveredItem, draggedItem]);

  /**
   * Renderizza un singolo elemento
   */
  const renderItem = useCallback((ctx, item, canvasWidth, canvasHeight) => {
    const startTimeMs = item.startTimeMs || 0;
    const durationMs = item.durationMs || 1000;
    
    // Calcola posizione e dimensioni
    const x = ((startTimeMs - timelineStart) / timelineWidth) * canvasWidth;
    const itemWidth = Math.max(2, (durationMs / timelineWidth) * canvasWidth);
    
    // Determina la posizione Y basandosi sulle tracce o su una posizione fissa
    let y = 10;
    let itemHeight = 40;
    
    if (tracks && tracks.length > 0) {
      // Trova la traccia corrispondente
      const trackIndex = tracks.findIndex(track => 
        track.channel === item.channel && track.layer === item.layer
      );
      
      if (trackIndex !== -1) {
        y = tracks.slice(0, trackIndex).reduce((sum, track) => sum + track.height, 0);
        y += (tracks[trackIndex].height - itemHeight) / 2;
        itemHeight = Math.min(itemHeight, tracks[trackIndex].height - 4);
      }
    }

    // Determina lo stato dell'elemento
    const isSelected = selectedItems.includes(item.id);
    const isHovered = hoveredItem?.id === item.id;
    const isDragged = draggedItem?.id === item.id;

    // Colori basati sul tipo e stato
    const colors = getItemColors(item.type, isSelected, isHovered, isDragged);

    // Disegna il rettangolo principale
    ctx.fillStyle = colors.background;
    ctx.fillRect(x, y, itemWidth, itemHeight);

    // Bordo
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = isSelected ? 3 : (isHovered ? 2 : 1);
    ctx.strokeRect(x, y, itemWidth, itemHeight);

    // Testo (se c'è spazio)
    if (itemWidth > 30) {
      ctx.fillStyle = colors.text;
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const text = item.name || 'Senza nome';
      const maxWidth = itemWidth - 6;
      
      // Tronca il testo se necessario
      let displayText = text;
      const textWidth = ctx.measureText(text).width;
      if (textWidth > maxWidth) {
        while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }

      ctx.fillText(displayText, x + 3, y + 3);
    }

    // Indicatore di tipo
    const typeIndicatorSize = 6;
    ctx.fillStyle = colors.border;
    ctx.fillRect(x + itemWidth - typeIndicatorSize - 2, y + 2, typeIndicatorSize, typeIndicatorSize);

    // Handle di resize (se selezionato)
    if (isSelected && itemWidth > 16) {
      const handleSize = 4;
      ctx.fillStyle = '#FFC107';
      
      // Handle sinistro
      ctx.fillRect(x - handleSize/2, y + itemHeight/2 - handleSize/2, handleSize, handleSize);
      
      // Handle destro
      ctx.fillRect(x + itemWidth - handleSize/2, y + itemHeight/2 - handleSize/2, handleSize, handleSize);
    }

    // Effetto hover
    if (isHovered && !isSelected) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x, y, itemWidth, itemHeight);
    }

    // Effetto drag
    if (isDragged) {
      ctx.fillStyle = 'rgba(255, 193, 7, 0.3)';
      ctx.fillRect(x, y, itemWidth, itemHeight);
    }
  }, [timelineStart, timelineWidth, tracks, selectedItems, hoveredItem, draggedItem]);

  /**
   * Renderizza le linee di snap
   */
  const renderSnapLines = useCallback((ctx, canvasWidth, canvasHeight) => {
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    snapLines.forEach(snapLine => {
      const x = ((snapLine.time - timelineStart) / timelineWidth) * canvasWidth;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    });

    ctx.setLineDash([]);
  }, [snapLines, timelineStart, timelineWidth]);

  /**
   * Ottiene i colori per un elemento basandosi sul tipo e stato
   */
  const getItemColors = (type, isSelected, isHovered, isDragged) => {
    const baseColors = {
      MEDIA: { background: '#4CAF50', border: '#388E3C', text: '#FFFFFF' },
      TEMPLATE: { background: '#2196F3', border: '#1976D2', text: '#FFFFFF' },
      STORY: { background: '#FF9800', border: '#F57C00', text: '#FFFFFF' },
      AUDIO: { background: '#9C27B0', border: '#7B1FA2', text: '#FFFFFF' },
      COMMAND: { background: '#607D8B', border: '#455A64', text: '#FFFFFF' }
    };
    
    let colors = baseColors[type] || baseColors.MEDIA;
    
    if (isSelected) {
      colors = {
        ...colors,
        border: '#FFC107',
        background: colors.background + 'DD'
      };
    } else if (isHovered) {
      colors = {
        ...colors,
        background: colors.background + 'CC'
      };
    }
    
    if (isDragged) {
      colors = {
        ...colors,
        background: colors.background + '88'
      };
    }
    
    return colors;
  };

  /**
   * Effetto per il rendering
   */
  useEffect(() => {
    // Cancella il frame precedente
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Programma il nuovo rendering
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  /**
   * Effetto per il resize del canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Imposta le dimensioni del canvas
    canvas.width = width;
    canvas.height = height;

    // Forza il re-rendering
    render();
  }, [width, height, render]);

  return (
    <Box sx={{ position: 'relative', ...style }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'default'
        }}
      />
    </Box>
  );
};

export default TimelineCanvas;
