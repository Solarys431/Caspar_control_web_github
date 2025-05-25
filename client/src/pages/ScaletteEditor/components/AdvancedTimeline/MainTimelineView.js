import React, { useRef, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import TimelineCanvas from './TimelineCanvas';
import Playhead from './Playhead';
import useTimelineInteractions from '../../hooks/useTimelineInteractions';
import { calculateItemX, calculateItemWidth, getItemColors, msToTimecode } from '../../utils/timelineUtils';

/**
 * Componente per la visualizzazione della timeline principale della scaletta
 * Mostra gli elementi principali (storie, media, template) come blocchi temporali
 */
const MainTimelineView = ({
  timelineData,
  oscData,
  onItemSelect,
  onItemMove,
  onItemResize,
  onItemDoubleClick,
  onItemPlay,
  onItemStop
}) => {
  const canvasRef = useRef(null);
  const timeRulerRef = useRef(null);

  // Hook per gestire le interazioni
  const interactions = useTimelineInteractions(
    {
      ...timelineData,
      timelineStart: timelineData.mainTimelineStart,
      timelineWidth: timelineData.mainTimelineWidth,
      items: timelineData.mainTimelineData.items, // Passa gli items processati
      onItemSelect,
      onItemMove,
      onItemResize,
      onItemDoubleClick: onItemDoubleClick,
      onClearSelection: timelineData.clearSelection,
      onZoom: (factor) => timelineData.setMainZoom(timelineData.mainTimelineZoom * factor),
      onPan: (deltaMs) => timelineData.panMainTimeline(deltaMs)
    },
    canvasRef
  );

  /**
   * Disegna la timeline principale
   */
  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    console.log('[MainTimeline] Drawing timeline with items:', timelineData.mainTimelineData.items.length);

    // Pulisci il canvas
    ctx.clearRect(0, 0, width, height);

    // Sfondo
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Griglia temporale
    if (timelineData.snapToGrid) {
      drawTimeGrid(ctx, width, height);
    }

    // Disegna gli elementi
    if (timelineData.mainTimelineData.items && timelineData.mainTimelineData.items.length > 0) {
      timelineData.mainTimelineData.items.forEach((item, index) => {
        console.log(`[MainTimeline] Drawing item ${index}:`, item.displayName, item.startTimeMs, item.durationMs);
        drawTimelineItem(ctx, item, width, height);
      });
    } else {
      console.log('[MainTimeline] No items to draw');
    }

    // Disegna i conflitti
    if (timelineData.mainTimelineData.conflicts && timelineData.mainTimelineData.conflicts.length > 0) {
      drawConflicts(ctx, width, height);
    }

    // Disegna le linee di snap se in dragging
    if (interactions.isDragging && timelineData.getSnapInfo) {
      const snapInfo = timelineData.getSnapInfo(0, false);
      drawSnapLines(ctx, snapInfo.snapLines, width, height);
    }
  }, [timelineData.mainTimelineData, timelineData.snapToGrid, interactions.isDragging]);

  /**
   * Disegna la griglia temporale
   */
  const drawTimeGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridInterval = timelineData.gridSize;
    const startTime = timelineData.mainTimelineStart;
    const endTime = startTime + timelineData.mainTimelineWidth;

    for (let time = Math.ceil(startTime / gridInterval) * gridInterval; time <= endTime; time += gridInterval) {
      const x = calculateItemX(time, startTime, timelineData.mainTimelineWidth, width);

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [timelineData]);

  /**
   * Disegna un elemento della timeline
   */
  const drawTimelineItem = useCallback((ctx, item, width, height) => {
    const x = calculateItemX(
      item.startTimeMs,
      timelineData.mainTimelineStart,
      timelineData.mainTimelineWidth,
      width
    );
    const itemWidth = calculateItemWidth(
      item.durationMs,
      timelineData.mainTimelineWidth,
      width
    );

    // Determina se l'elemento è selezionato
    const isSelected = timelineData.selectedItems.includes(item.id);
    const hasConflict = timelineData.mainTimelineData.conflicts.some(
      conflict => conflict.items.some(conflictItem => conflictItem.id === item.id)
    );

    // Ottieni i colori
    const colors = getItemColors(item.type, isSelected, hasConflict);

    // Altezza dell'elemento (lascia spazio per separazione)
    const itemHeight = 50;
    const y = 10;

    // Disegna il rettangolo principale
    ctx.fillStyle = colors.bg;
    ctx.fillRect(x, y, itemWidth, itemHeight);

    // Bordo
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.strokeRect(x, y, itemWidth, itemHeight);

    // Testo dell'elemento
    if (itemWidth > 30) {
      ctx.fillStyle = colors.text;
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const text = item.displayName || item.data?.customName || item.name || 'Senza nome';
      const maxWidth = itemWidth - 8;

      // Tronca il testo se necessario
      let displayText = text;
      const textWidth = ctx.measureText(text).width;
      if (textWidth > maxWidth) {
        while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }

      ctx.fillText(displayText, x + 4, y + 4);

      // Timing info
      if (itemHeight > 30) {
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const startTime = msToTimecode(item.startTimeMs, 25, false);
        const duration = msToTimecode(item.durationMs, 25, false);
        ctx.fillText(`${startTime} (${duration})`, x + 4, y + 20);
      }
    }

    // Indicatore di tipo
    const typeIndicatorSize = 8;
    ctx.fillStyle = colors.border;
    ctx.fillRect(x + itemWidth - typeIndicatorSize - 2, y + 2, typeIndicatorSize, typeIndicatorSize);

    // Handle di resize (se selezionato)
    if (isSelected && itemWidth > 20) {
      const handleSize = 6;
      ctx.fillStyle = '#FFC107';

      // Handle sinistro
      ctx.fillRect(x - handleSize/2, y + itemHeight/2 - handleSize/2, handleSize, handleSize);

      // Handle destro
      ctx.fillRect(x + itemWidth - handleSize/2, y + itemHeight/2 - handleSize/2, handleSize, handleSize);
    }
  }, [timelineData]);

  /**
   * Disegna i conflitti
   */
  const drawConflicts = useCallback((ctx, width, height) => {
    timelineData.mainTimelineData.conflicts.forEach(conflict => {
      if (conflict.type === 'layer_overlap') {
        // Disegna un'area di warning per i conflitti
        conflict.items.forEach(item => {
          const x = calculateItemX(
            item.startTimeMs,
            timelineData.mainTimelineStart,
            timelineData.mainTimelineWidth,
            width
          );
          const itemWidth = calculateItemWidth(
            item.durationMs,
            timelineData.mainTimelineWidth,
            width
          );

          // Overlay rosso semi-trasparente
          ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
          ctx.fillRect(x, 5, itemWidth, 60);

          // Bordo rosso
          ctx.strokeStyle = '#F44336';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, 5, itemWidth, 60);
        });
      }
    });
  }, [timelineData]);

  /**
   * Disegna le linee di snap
   */
  const drawSnapLines = useCallback((ctx, snapLines, width, height) => {
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    snapLines.forEach(snapLine => {
      const x = calculateItemX(
        snapLine.time,
        timelineData.mainTimelineStart,
        timelineData.mainTimelineWidth,
        width
      );

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    ctx.setLineDash([]);
  }, [timelineData]);

  /**
   * Disegna il righello temporale
   */
  const drawTimeRuler = useCallback(() => {
    const canvas = timeRulerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Pulisci
    ctx.clearRect(0, 0, width, height);

    // Sfondo
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, width, height);

    // Calcola l'intervallo delle etichette temporali
    const timelineWidthMs = timelineData.mainTimelineWidth;
    const pixelsPerMs = width / timelineWidthMs;

    // Determina l'intervallo appropriato per le etichette
    let labelInterval = 60000; // 1 minuto
    if (pixelsPerMs > 0.1) labelInterval = 10000; // 10 secondi
    if (pixelsPerMs > 1) labelInterval = 1000; // 1 secondo
    if (pixelsPerMs < 0.01) labelInterval = 600000; // 10 minuti
    if (pixelsPerMs < 0.001) labelInterval = 3600000; // 1 ora

    const startTime = timelineData.mainTimelineStart;
    const endTime = startTime + timelineWidthMs;

    // Disegna le etichette
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let time = Math.ceil(startTime / labelInterval) * labelInterval; time <= endTime; time += labelInterval) {
      const x = calculateItemX(time, startTime, timelineWidthMs, width);
      const timeLabel = msToTimecode(time, 25, false);

      // Linea di tick
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, height - 10);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Etichetta
      ctx.fillText(timeLabel, x, height / 2);
    }
  }, [timelineData]);

  // Effetti per il re-rendering
  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  useEffect(() => {
    drawTimeRuler();
  }, [drawTimeRuler]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && timeRulerRef.current) {
        const container = canvasRef.current.parentElement;
        const rect = container.getBoundingClientRect();

        canvasRef.current.width = rect.width;
        canvasRef.current.height = 80;

        timeRulerRef.current.width = rect.width;
        timeRulerRef.current.height = 30;

        drawTimeline();
        drawTimeRuler();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, [drawTimeline, drawTimeRuler]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Righello temporale */}
      <Box sx={{ height: '30px', borderBottom: 1, borderColor: 'divider' }}>
        <canvas
          ref={timeRulerRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </Box>

      {/* Area principale timeline */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Playhead */}
        <Playhead
          currentTime={oscData?.timecode}
          timelineStart={timelineData.mainTimelineStart}
          timelineWidth={timelineData.mainTimelineWidth}
        />
      </Box>

      {/* Info bar */}
      <Box sx={{
        height: '24px',
        px: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="caption">
          {timelineData.mainTimelineData.items.length} elementi
        </Typography>

        {timelineData.mainTimelineData.conflicts.length > 0 && (
          <Typography variant="caption" color="error">
            {timelineData.mainTimelineData.conflicts.length} conflitti rilevati
          </Typography>
        )}

        <Typography variant="caption">
          Durata: {msToTimecode(timelineData.mainTimelineData.duration, 25, false)}
        </Typography>
      </Box>
    </Box>
  );
};

export default MainTimelineView;
