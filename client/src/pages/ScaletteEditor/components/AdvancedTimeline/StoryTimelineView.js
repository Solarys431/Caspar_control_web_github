import React, { useRef, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import TrackHeader from './TrackHeader';
import { StoryPlayhead } from './Playhead';
import useTimelineInteractions from '../../hooks/useTimelineInteractions';
import { calculateItemX, calculateItemWidth, getItemColors, msToTimecode, timecodeToMs } from '../../utils/timelineUtils';

/**
 * Componente per la visualizzazione della timeline interna di una storia
 * Mostra gli internal_items su tracce multiple con gestione NLE-like
 */
const StoryTimelineView = ({
  timelineData,
  oscData,
  selectedStory,
  onItemSelect,
  onItemMove,
  onItemResize,
  onItemPlay,
  onItemStop,
  onBackToMain
}) => {
  const canvasRef = useRef(null);
  const timeRulerRef = useRef(null);
  const tracksContainerRef = useRef(null);

  // Hook per gestire le interazioni
  const interactions = useTimelineInteractions(
    {
      ...timelineData,
      timelineStart: timelineData.storyTimelineStart,
      timelineWidth: timelineData.storyTimelineWidth,
      tracks: timelineData.storyTimelineData.tracks,
      onItemSelect,
      onItemMove,
      onItemResize,
      onClearSelection: timelineData.clearSelection,
      onZoom: (factor) => timelineData.setStoryZoom(timelineData.storyTimelineZoom * factor),
      onPan: (deltaMs) => timelineData.panStoryTimeline(deltaMs)
    },
    canvasRef
  );

  /**
   * Disegna la timeline delle storie
   */
  const drawStoryTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Pulisci il canvas
    ctx.clearRect(0, 0, width, height);

    // Sfondo
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Disegna le tracce
    let currentY = 0;
    timelineData.storyTimelineData.tracks.forEach((track, trackIndex) => {
      drawTrack(ctx, track, trackIndex, currentY, width);
      currentY += track.height;
    });

    // Griglia temporale
    if (timelineData.snapToGrid) {
      drawTimeGrid(ctx, width, height);
    }

    // Disegna i conflitti
    drawConflicts(ctx, width, height);

    // Linee di snap durante il dragging
    if (interactions.isDragging && timelineData.getSnapInfo) {
      const snapInfo = timelineData.getSnapInfo(0, true);
      drawSnapLines(ctx, snapInfo.snapLines, width, height);
    }
  }, [timelineData, interactions.isDragging]);

  /**
   * Disegna una singola traccia
   */
  const drawTrack = useCallback((ctx, track, trackIndex, y, width) => {
    const trackHeight = track.height;

    // Sfondo della traccia (alternato)
    ctx.fillStyle = trackIndex % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, y, width, trackHeight);

    // Bordo della traccia
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + trackHeight);
    ctx.lineTo(width, y + trackHeight);
    ctx.stroke();

    // Disegna gli elementi della traccia
    track.items.forEach(item => {
      drawTrackItem(ctx, item, y, trackHeight, width);
    });
  }, [timelineData]);

  /**
   * Disegna un elemento su una traccia
   */
  const drawTrackItem = useCallback((ctx, item, trackY, trackHeight, width) => {
    const x = calculateItemX(
      item.startTimeMs,
      timelineData.storyTimelineStart,
      timelineData.storyTimelineWidth,
      width
    );
    const itemWidth = calculateItemWidth(
      item.durationMs,
      timelineData.storyTimelineWidth,
      width
    );

    // Determina se l'elemento è selezionato
    const isSelected = timelineData.selectedItems.includes(item.id);
    const hasConflict = timelineData.storyTimelineData.conflicts.some(
      conflict => conflict.items.some(conflictItem => conflictItem.id === item.id)
    );

    // Ottieni i colori
    const colors = getItemColors(item.type, isSelected, hasConflict);

    // Dimensioni dell'elemento
    const itemHeight = Math.min(trackHeight - 4, 40);
    const y = trackY + (trackHeight - itemHeight) / 2;

    // Disegna il rettangolo principale
    ctx.fillStyle = colors.bg;
    ctx.fillRect(x, y, itemWidth, itemHeight);

    // Bordo
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.strokeRect(x, y, itemWidth, itemHeight);

    // Testo dell'elemento
    if (itemWidth > 20) {
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

      // Info aggiuntive per elementi più grandi
      if (itemWidth > 60 && itemHeight > 25) {
        ctx.font = '9px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const startTime = msToTimecode(item.startTimeMs);
        const duration = msToTimecode(item.durationMs);
        ctx.fillText(`${startTime} (${duration})`, x + 3, y + 16);
        
        // Layer info
        if (itemHeight > 35) {
          ctx.fillText(`CH${item.channel}-L${item.layer}`, x + 3, y + 26);
        }
      }
    }

    // Indicatore di tipo
    const typeIndicatorSize = 6;
    ctx.fillStyle = colors.border;
    ctx.fillRect(x + itemWidth - typeIndicatorSize - 1, y + 1, typeIndicatorSize, typeIndicatorSize);

    // Handle di resize (se selezionato)
    if (isSelected && itemWidth > 16) {
      const handleSize = 4;
      ctx.fillStyle = '#FFC107';
      
      // Handle sinistro
      ctx.fillRect(x - handleSize/2, y + itemHeight/2 - handleSize/2, handleSize, handleSize);
      
      // Handle destro
      ctx.fillRect(x + itemWidth - handleSize/2, y + itemHeight/2 - handleSize/2, handleSize, handleSize);
    }
  }, [timelineData]);

  /**
   * Disegna la griglia temporale
   */
  const drawTimeGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridInterval = timelineData.gridSize;
    const startTime = timelineData.storyTimelineStart;
    const endTime = startTime + timelineData.storyTimelineWidth;

    for (let time = Math.ceil(startTime / gridInterval) * gridInterval; time <= endTime; time += gridInterval) {
      const x = calculateItemX(time, startTime, timelineData.storyTimelineWidth, width);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [timelineData]);

  /**
   * Disegna i conflitti
   */
  const drawConflicts = useCallback((ctx, width, height) => {
    timelineData.storyTimelineData.conflicts.forEach(conflict => {
      if (conflict.type === 'layer_overlap') {
        // Trova la traccia del conflitto
        let trackY = 0;
        const track = timelineData.storyTimelineData.tracks.find(t => 
          t.layer === conflict.layer && t.channel === conflict.channel
        );
        
        if (track) {
          const trackIndex = timelineData.storyTimelineData.tracks.indexOf(track);
          trackY = timelineData.storyTimelineData.tracks.slice(0, trackIndex)
            .reduce((sum, t) => sum + t.height, 0);

          conflict.items.forEach(item => {
            const x = calculateItemX(
              item.startTimeMs,
              timelineData.storyTimelineStart,
              timelineData.storyTimelineWidth,
              width
            );
            const itemWidth = calculateItemWidth(
              item.durationMs,
              timelineData.storyTimelineWidth,
              width
            );

            // Overlay rosso semi-trasparente
            ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
            ctx.fillRect(x, trackY, itemWidth, track.height);

            // Bordo rosso
            ctx.strokeStyle = '#F44336';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, trackY, itemWidth, track.height);
          });
        }
      }
    });
  }, [timelineData]);

  /**
   * Disegna le linee di snap
   */
  const drawSnapLines = useCallback((ctx, snapLines, width, height) => {
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    snapLines.forEach(snapLine => {
      const x = calculateItemX(
        snapLine.time,
        timelineData.storyTimelineStart,
        timelineData.storyTimelineWidth,
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

    // Calcola l'intervallo delle etichette
    const timelineWidthMs = timelineData.storyTimelineWidth;
    const pixelsPerMs = width / timelineWidthMs;
    
    let labelInterval = 1000; // 1 secondo
    if (pixelsPerMs > 10) labelInterval = 100; // 100ms
    if (pixelsPerMs > 100) labelInterval = 40; // 40ms (1 frame a 25fps)
    if (pixelsPerMs < 1) labelInterval = 5000; // 5 secondi
    if (pixelsPerMs < 0.1) labelInterval = 30000; // 30 secondi

    const startTime = timelineData.storyTimelineStart;
    const endTime = startTime + timelineWidthMs;

    // Disegna le etichette
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let time = Math.ceil(startTime / labelInterval) * labelInterval; time <= endTime; time += labelInterval) {
      const x = calculateItemX(time, startTime, timelineWidthMs, width);
      const timeLabel = msToTimecode(time);

      // Linea di tick
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, height - 8);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Etichetta
      if (x > 30 && x < width - 30) { // Evita sovrapposizioni ai bordi
        ctx.fillText(timeLabel, x, height / 2);
      }
    }
  }, [timelineData]);

  // Effetti per il re-rendering
  useEffect(() => {
    drawStoryTimeline();
  }, [drawStoryTimeline]);

  useEffect(() => {
    drawTimeRuler();
  }, [drawTimeRuler]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && timeRulerRef.current && tracksContainerRef.current) {
        const container = tracksContainerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Calcola l'altezza totale delle tracce
        const totalHeight = timelineData.storyTimelineData.tracks.reduce(
          (sum, track) => sum + track.height, 0
        );
        
        canvasRef.current.width = rect.width - 200; // Spazio per header tracce
        canvasRef.current.height = totalHeight;
        
        timeRulerRef.current.width = rect.width - 200;
        timeRulerRef.current.height = 25;
        
        drawStoryTimeline();
        drawTimeRuler();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [drawStoryTimeline, drawTimeRuler, timelineData.storyTimelineData.tracks]);

  if (!selectedStory) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Seleziona una storia per visualizzare la timeline interna
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header con info storia */}
      <Box sx={{ 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        bgcolor: 'background.paper'
      }}>
        <IconButton size="small" onClick={onBackToMain}>
          <BackIcon />
        </IconButton>
        
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {selectedStory.data?.customName || selectedStory.name}
        </Typography>
        
        <Chip 
          label={`${timelineData.storyTimelineData.items.length} elementi`}
          size="small"
          variant="outlined"
        />
        
        {timelineData.storyTimelineData.conflicts.length > 0 && (
          <Chip 
            label={`${timelineData.storyTimelineData.conflicts.length} conflitti`}
            size="small"
            color="error"
            variant="outlined"
          />
        )}
      </Box>

      {/* Righello temporale */}
      <Box sx={{ height: '25px', borderBottom: 1, borderColor: 'divider', ml: '200px' }}>
        <canvas
          ref={timeRulerRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </Box>

      {/* Area tracce */}
      <Box 
        ref={tracksContainerRef}
        sx={{ flexGrow: 1, display: 'flex', overflow: 'auto' }}
      >
        {/* Header delle tracce */}
        <Box sx={{ width: '200px', borderRight: 1, borderColor: 'divider' }}>
          {timelineData.storyTimelineData.tracks.map((track, index) => (
            <TrackHeader
              key={track.id}
              track={track}
              height={track.height}
              onTrackToggle={() => {/* TODO: implementa toggle traccia */}}
              onTrackSolo={() => {/* TODO: implementa solo traccia */}}
              onTrackMute={() => {/* TODO: implementa mute traccia */}}
            />
          ))}
        </Box>

        {/* Canvas timeline */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          
          {/* Playhead per timeline storia */}
          <StoryPlayhead
            currentTime={oscData?.timecode}
            timelineStart={timelineData.storyTimelineStart}
            timelineWidth={timelineData.storyTimelineWidth}
            tracks={timelineData.storyTimelineData.tracks}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StoryTimelineView;
