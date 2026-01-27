import { useCallback, useRef, useEffect } from 'react';
import { calculateItemX, calculateItemWidth, getItemColors, msToTimecode } from '../utils/timelineUtils';

/**
 * Hook per gestire il rendering ottimizzato della timeline
 * Fornisce funzioni di rendering per diversi elementi della timeline
 */
const useTimelineRendering = (timelineData) => {
  const renderingContextRef = useRef({});

  /**
   * Renderizza la griglia temporale
   */
  const renderGrid = useCallback((ctx, width, height, gridSize, timelineStart, timelineWidth) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const startTime = timelineStart;
    const endTime = startTime + timelineWidth;

    // Linee verticali della griglia
    for (let time = Math.ceil(startTime / gridSize) * gridSize; time <= endTime; time += gridSize) {
      const x = calculateItemX(time, startTime, timelineWidth, width);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Linee orizzontali ogni 50px
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let y = 50; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  /**
   * Renderizza il righello temporale
   */
  const renderTimeRuler = useCallback((ctx, width, height, timelineStart, timelineWidth) => {
    // Sfondo del righello
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, width, height);

    // Calcola l'intervallo appropriato per le etichette
    const pixelsPerMs = width / timelineWidth;
    let labelInterval = 60000; // 1 minuto
    
    if (pixelsPerMs > 0.1) labelInterval = 10000; // 10 secondi
    if (pixelsPerMs > 1) labelInterval = 1000; // 1 secondo
    if (pixelsPerMs > 10) labelInterval = 100; // 100ms
    if (pixelsPerMs < 0.01) labelInterval = 600000; // 10 minuti
    if (pixelsPerMs < 0.001) labelInterval = 3600000; // 1 ora

    const startTime = timelineStart;
    const endTime = startTime + timelineWidth;

    // Disegna le etichette temporali
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let time = Math.ceil(startTime / labelInterval) * labelInterval; time <= endTime; time += labelInterval) {
      const x = calculateItemX(time, startTime, timelineWidth, width);
      
      // Linea di tick
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, height - 10);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Etichetta temporale
      const timeLabel = msToTimecode(time, 25, false);
      if (x > 30 && x < width - 30) {
        ctx.fillText(timeLabel, x, height / 2);
      }
    }
  }, []);

  /**
   * Renderizza un elemento della timeline
   */
  const renderTimelineItem = useCallback((ctx, item, width, height, timelineStart, timelineWidth, selectedItems = [], conflicts = []) => {
    const x = calculateItemX(item.startTimeMs, timelineStart, timelineWidth, width);
    const itemWidth = calculateItemWidth(item.durationMs, timelineWidth, width);

    // Determina lo stato dell'elemento
    const isSelected = selectedItems.includes(item.id);
    const hasConflict = conflicts.some(conflict => 
      conflict.items.some(conflictItem => conflictItem.id === item.id)
    );

    // Ottieni i colori
    const colors = getItemColors(item.type, isSelected, hasConflict);

    // Posizione Y (per timeline principale)
    const itemHeight = 50;
    const y = 15;

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

      const text = item.data?.customName || item.name || 'Senza nome';
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

      // Informazioni temporali
      if (itemHeight > 30 && itemWidth > 80) {
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
  }, []);

  /**
   * Renderizza un elemento su una traccia specifica
   */
  const renderTrackItem = useCallback((ctx, item, track, trackY, width, timelineStart, timelineWidth, selectedItems = []) => {
    const x = calculateItemX(item.startTimeMs, timelineStart, timelineWidth, width);
    const itemWidth = calculateItemWidth(item.durationMs, timelineWidth, width);

    // Determina lo stato dell'elemento
    const isSelected = selectedItems.includes(item.id);

    // Ottieni i colori
    const colors = getItemColors(item.type, isSelected, false);

    // Dimensioni dell'elemento
    const itemHeight = Math.min(track.height - 4, 35);
    const y = trackY + (track.height - itemHeight) / 2;

    // Disegna il rettangolo principale
    ctx.fillStyle = colors.bg;
    ctx.fillRect(x, y, itemWidth, itemHeight);

    // Bordo
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, itemWidth, itemHeight);

    // Testo dell'elemento
    if (itemWidth > 25) {
      ctx.fillStyle = colors.text;
      ctx.font = '10px Arial';
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
        ctx.font = '8px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const duration = msToTimecode(item.durationMs);
        ctx.fillText(duration, x + 3, y + 15);
      }
    }

    // Indicatore di tipo
    const typeIndicatorSize = 4;
    ctx.fillStyle = colors.border;
    ctx.fillRect(x + itemWidth - typeIndicatorSize - 1, y + 1, typeIndicatorSize, typeIndicatorSize);

    // Handle di resize (se selezionato)
    if (isSelected && itemWidth > 16) {
      const handleSize = 3;
      ctx.fillStyle = '#FFC107';
      
      // Handle sinistro
      ctx.fillRect(x - handleSize/2, y + itemHeight/2 - handleSize/2, handleSize, handleSize);
      
      // Handle destro
      ctx.fillRect(x + itemWidth - handleSize/2, y + itemHeight/2 - handleSize/2, handleSize, handleSize);
    }
  }, []);

  /**
   * Renderizza le tracce di sfondo
   */
  const renderTracks = useCallback((ctx, tracks, width) => {
    let currentY = 0;
    
    tracks.forEach((track, index) => {
      // Sfondo alternato
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, currentY, width, track.height);

      // Bordo traccia
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, currentY + track.height);
      ctx.lineTo(width, currentY + track.height);
      ctx.stroke();

      currentY += track.height;
    });
  }, []);

  /**
   * Renderizza i conflitti
   */
  const renderConflicts = useCallback((ctx, conflicts, width, height, timelineStart, timelineWidth, tracks = null) => {
    conflicts.forEach(conflict => {
      if (conflict.type === 'layer_overlap') {
        conflict.items.forEach(item => {
          const x = calculateItemX(item.startTimeMs, timelineStart, timelineWidth, width);
          const itemWidth = calculateItemWidth(item.durationMs, timelineWidth, width);

          let y = 10;
          let conflictHeight = 60;

          // Se abbiamo le tracce, trova la posizione corretta
          if (tracks) {
            const trackIndex = tracks.findIndex(t => 
              t.layer === conflict.layer && t.channel === conflict.channel
            );
            if (trackIndex !== -1) {
              y = tracks.slice(0, trackIndex).reduce((sum, t) => sum + t.height, 0);
              conflictHeight = tracks[trackIndex].height;
            }
          }

          // Overlay rosso semi-trasparente
          ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
          ctx.fillRect(x, y, itemWidth, conflictHeight);

          // Bordo rosso
          ctx.strokeStyle = '#F44336';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, itemWidth, conflictHeight);
        });
      }
    });
  }, []);

  /**
   * Renderizza le linee di snap
   */
  const renderSnapLines = useCallback((ctx, snapLines, width, height, timelineStart, timelineWidth) => {
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    snapLines.forEach(snapLine => {
      const x = calculateItemX(snapLine.time, timelineStart, timelineWidth, width);

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    ctx.setLineDash([]);
  }, []);

  /**
   * Pulisce il canvas
   */
  const clearCanvas = useCallback((ctx, width, height, backgroundColor = '#1a1a1a') => {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }, []);

  return {
    renderGrid,
    renderTimeRuler,
    renderTimelineItem,
    renderTrackItem,
    renderTracks,
    renderConflicts,
    renderSnapLines,
    clearCanvas
  };
};

export default useTimelineRendering;
