import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TimelineRuler from './TimelineRuler';
import TimelineTrack from './TimelineTrack';
import TimelinePlayhead from './TimelinePlayhead';
import TimelineControls from './TimelineControls';
import { msToTimecode, timecodeToMs } from '../../utils/timelineUtils';

/**
 * Timeline Professionale Broadcast-Grade
 * Replica l'interfaccia delle timeline professionali come CasparCG Client
 */
const ProfessionalTimeline = ({
  items = [],
  selectedItem = null,
  onItemSelect,
  onItemUpdate,
  onItemPlay,
  onItemStop,
  oscData = {},
  previewChannel = 3,
  previewLayer = 1
}) => {
  // Stati della timeline
  const [zoom, setZoom] = useState(1); // Pixel per secondo
  const [scrollX, setScrollX] = useState(0); // Offset orizzontale in ms
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Tempo corrente in ms

  // Refs
  const timelineRef = useRef(null);
  const containerRef = useRef(null);

  // Configurazione tracce broadcast standard
  const tracks = [
    { id: 'pgm', name: 'PGM', type: 'program', height: 60, color: '#ff4444' },
    { id: 'vt1', name: 'VT 1', type: 'video', height: 50, color: '#4444ff' },
    { id: 'vt2', name: 'VT 2', type: 'video', height: 50, color: '#44ff44' },
    { id: 'gfx1', name: 'GFX 1', type: 'graphics', height: 40, color: '#ffaa00' },
    { id: 'gfx2', name: 'GFX 2', type: 'graphics', height: 40, color: '#aa00ff' },
    { id: 'audio', name: 'Audio', type: 'audio', height: 35, color: '#00aaff' }
  ];

  // Dimensioni timeline e costanti broadcast
  const TIMELINE_WIDTH = 1200;
  const TIMELINE_HEIGHT = tracks.reduce((sum, track) => sum + track.height, 0);
  const RULER_HEIGHT = 40;
  const TRACK_LABEL_WIDTH = 80;
  const MIN_ELEMENT_WIDTH = 60; // Larghezza minima elementi per visibilità broadcast
  const SNAP_GRID_MS = 1000; // Snap ogni secondo per precisione broadcast

  /**
   * Ottiene il colore dell'elemento basato sul tipo
   * NOTA: Definita prima di timelineItems per evitare errori di hoisting
   */
  function getItemColor(type) {
    switch (type) {
      case 'MEDIA': return '#4a90e2';
      case 'TEMPLATE': return '#f5a623';
      case 'AUDIO': return '#7ed321';
      case 'STORY': return '#bd10e0';
      default: return '#9013fe';
    }
  }

  /**
   * Converte gli items della scaletta in elementi timeline con larghezza minima broadcast
   */
  const timelineItems = React.useMemo(() => {
    return items.map((item, index) => {
      // Calcola posizione temporale basata sull'ordine se non specificata
      const startTime = item.data?.timing?.startTime ||
                       item.data?.startTime ||
                       `${String(Math.floor(index * 30 / 60)).padStart(2, '0')}:${String((index * 30) % 60).padStart(2, '0')}:00:00`;

      const duration = item.data?.timing?.duration ||
                      item.data?.duration ||
                      '00:00:30:00'; // 30 secondi default

      const startTimeMs = timecodeToMs(startTime);
      const durationMs = timecodeToMs(duration);

      // Calcola larghezza display con minimo broadcast-grade
      const naturalWidth = durationMs * zoom;
      const displayWidth = Math.max(MIN_ELEMENT_WIDTH, naturalWidth);
      const isCompressed = naturalWidth < MIN_ELEMENT_WIDTH;

      // Assegna traccia basata sul tipo con distribuzione intelligente
      let trackId = 'vt1';
      if (item.type === 'TEMPLATE') {
        trackId = index % 2 === 0 ? 'gfx1' : 'gfx2';
      } else if (item.type === 'AUDIO') {
        trackId = 'audio';
      } else if (item.type === 'MEDIA') {
        trackId = index % 2 === 0 ? 'vt1' : 'vt2';
      }

      return {
        ...item,
        startTimeMs,
        durationMs,
        endTimeMs: startTimeMs + durationMs,
        trackId,
        displayName: item.data?.customName || item.name || `Item ${index + 1}`,
        color: getItemColor(item.type),
        displayWidth,
        naturalWidth,
        isCompressed
      };
    });
  }, [items, zoom]);

  /**
   * Converte posizione pixel in tempo
   */
  const pixelToTime = useCallback((pixel) => {
    return (pixel / zoom) + scrollX;
  }, [zoom, scrollX]);

  /**
   * Converte tempo in posizione pixel
   */
  const timeToPixel = useCallback((timeMs) => {
    return (timeMs - scrollX) * zoom;
  }, [zoom, scrollX]);

  /**
   * Gestisce il drag degli elementi
   */
  const handleMouseDown = useCallback((event, item) => {
    if (event.button !== 0) return; // Solo click sinistro

    setIsDragging(true);
    setDraggedItem(item);

    const startX = event.clientX;
    const startTime = item.startTimeMs;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaTime = deltaX / zoom;
      const newStartTime = Math.max(0, startTime + deltaTime);

      // Aggiorna temporaneamente la posizione per feedback visivo
      if (onItemUpdate) {
        onItemUpdate({
          itemId: item.id,
          updates: {
            timing: {
              ...item.data?.timing,
              startTime: msToTimecode(newStartTime)
            }
          }
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedItem(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [zoom, onItemUpdate]);

  /**
   * Gestisce lo zoom e pan con la rotella del mouse (fix passive event listener)
   */
  const handleWheel = useCallback((event) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      // Zoom con Ctrl/Cmd
      const zoomFactor = event.deltaY > 0 ? 0.8 : 1.25;
      setZoom(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)));
    } else {
      // Pan orizzontale senza Ctrl
      const panAmount = event.deltaY * 1000; // ms
      setScrollX(prev => Math.max(0, prev + panAmount));
    }
  }, []);

  /**
   * Gestisce il pan orizzontale con mouse drag
   */
  const handleMousePan = useCallback((event) => {
    if (event.button !== 1) return; // Solo middle mouse button

    event.preventDefault();
    setIsDragging(true);

    const startX = event.clientX;
    const startScrollX = scrollX;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaTime = deltaX / zoom;
      setScrollX(Math.max(0, startScrollX - deltaTime));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [scrollX, zoom]);

  /**
   * Aggiorna il tempo corrente dal playhead OSC e stato riproduzione
   */
  useEffect(() => {
    if (oscData.timecode) {
      const timeMs = timecodeToMs(oscData.timecode);
      setCurrentTime(timeMs);
    }
    // Aggiorna stato riproduzione da OSC
    if (oscData.isPlaying !== undefined) {
      setIsPlaying(oscData.isPlaying);
    }
  }, [oscData.timecode, oscData.isPlaying]);

  /**
   * Keyboard shortcuts broadcast-standard
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Evita conflitti quando si sta digitando in input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isPlaying) {
            onItemStop && onItemStop();
          } else {
            onItemPlay && onItemPlay();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setCurrentTime(prev => Math.max(0, prev - 5000)); // -5 secondi
          break;
        case 'ArrowRight':
          event.preventDefault();
          setCurrentTime(prev => prev + 5000); // +5 secondi
          break;
        case 'Home':
          event.preventDefault();
          setCurrentTime(0);
          break;
        case 'PageUp':
          event.preventDefault();
          setScrollX(prev => Math.max(0, prev - 30000)); // -30 secondi
          break;
        case 'PageDown':
          event.preventDefault();
          setScrollX(prev => prev + 30000); // +30 secondi
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onItemPlay, onItemStop]);

  /**
   * Fix passive event listener per wheel events
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (event) => {
      handleWheel(event);
    };

    // Aggiunge listener non-passivo per permettere preventDefault
    container.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
  }, [handleWheel]);

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a'
      }}
    >
      {/* Header con controlli */}
      <TimelineControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        zoom={zoom}
        onPlay={() => {
          setIsPlaying(true);
          onItemPlay && onItemPlay();
        }}
        onPause={() => {
          setIsPlaying(false);
          onItemStop && onItemStop();
        }}
        onStop={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          onItemStop && onItemStop();
        }}
        onZoomChange={setZoom}
        onSeek={setCurrentTime}
        oscData={oscData}
      />

      {/* Area principale timeline */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onMouseDown={handleMousePan}
        style={{
          // Fix passive event listener error
          touchAction: 'none'
        }}
      >
        {/* Ruler temporale */}
        <Box sx={{ display: 'flex', height: RULER_HEIGHT }}>
          <Box sx={{ width: TRACK_LABEL_WIDTH, backgroundColor: '#2a2a2a' }} />
          <TimelineRuler
            width={TIMELINE_WIDTH}
            height={RULER_HEIGHT}
            zoom={zoom}
            scrollX={scrollX}
            currentTime={currentTime}
            onSeek={setCurrentTime}
            onPan={setScrollX}
          />
        </Box>

        {/* Tracce timeline */}
        <Box
          ref={timelineRef}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}
        >
          {tracks.map((track) => (
            <TimelineTrack
              key={track.id}
              track={track}
              items={timelineItems.filter(item => item.trackId === track.id)}
              width={TIMELINE_WIDTH}
              labelWidth={TRACK_LABEL_WIDTH}
              zoom={zoom}
              scrollX={scrollX}
              selectedItem={selectedItem}
              onItemSelect={onItemSelect}
              onItemMouseDown={handleMouseDown}
              onItemPlay={onItemPlay}
              onItemStop={onItemStop}
            />
          ))}
        </Box>

        {/* Playhead */}
        <TimelinePlayhead
          currentTime={currentTime}
          zoom={zoom}
          scrollX={scrollX}
          height={TIMELINE_HEIGHT + RULER_HEIGHT}
          offsetX={TRACK_LABEL_WIDTH}
          onSeek={setCurrentTime}
        />
      </Box>
    </Paper>
  );
};

export default ProfessionalTimeline;
