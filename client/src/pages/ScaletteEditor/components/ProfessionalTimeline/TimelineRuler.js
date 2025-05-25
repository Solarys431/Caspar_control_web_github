import React, { useRef, useEffect } from 'react';
import { msToTimecode } from '../../utils/timelineUtils';

/**
 * Ruler temporale professionale con timecode broadcast e scrubbing
 */
const TimelineRuler = ({
  width,
  height,
  zoom,
  scrollX,
  currentTime,
  onSeek,
  onPan
}) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Setup canvas per alta risoluzione
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Pulisci canvas
    ctx.clearRect(0, 0, width, height);

    // Sfondo ruler
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, width, height);

    // Calcola intervalli di tempo basati sul zoom
    const pixelsPerSecond = zoom;
    let majorInterval, minorInterval;

    if (pixelsPerSecond >= 100) {
      // Zoom alto: ogni secondo
      majorInterval = 1000; // 1 secondo
      minorInterval = 200;  // 200ms
    } else if (pixelsPerSecond >= 50) {
      // Zoom medio: ogni 5 secondi
      majorInterval = 5000; // 5 secondi
      minorInterval = 1000; // 1 secondo
    } else if (pixelsPerSecond >= 20) {
      // Zoom basso: ogni 10 secondi
      majorInterval = 10000; // 10 secondi
      minorInterval = 2000;  // 2 secondi
    } else {
      // Zoom molto basso: ogni minuto
      majorInterval = 60000; // 1 minuto
      minorInterval = 10000; // 10 secondi
    }

    // Calcola range temporale visibile
    const startTime = scrollX;
    const endTime = scrollX + (width / zoom);

    // Disegna tick marks
    const startMajor = Math.floor(startTime / majorInterval) * majorInterval;
    const startMinor = Math.floor(startTime / minorInterval) * minorInterval;

    // Tick minori
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    for (let time = startMinor; time <= endTime + majorInterval; time += minorInterval) {
      const x = (time - scrollX) * zoom;
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, height - 10);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    // Tick maggiori con timecode
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let time = startMajor; time <= endTime + majorInterval; time += majorInterval) {
      const x = (time - scrollX) * zoom;
      if (x >= 0 && x <= width) {
        // Linea tick
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Timecode
        const timecode = msToTimecode(time, 25, false); // 25fps, no frames
        ctx.fillText(timecode, x, height / 2);
      }
    }

    // Linea di separazione inferiore
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(width, height - 0.5);
    ctx.stroke();

  }, [width, height, zoom, scrollX]);

  /**
   * Gestisce click per scrubbing e pan
   */
  const handleMouseDown = (event) => {
    if (event.button !== 0) return; // Solo click sinistro

    event.preventDefault();
    setIsDragging(true);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;

    if (event.shiftKey) {
      // Pan con Shift+Click
      const startX = event.clientX;
      const startScrollX = scrollX;

      const handleMouseMove = (e) => {
        const deltaX = e.clientX - startX;
        const deltaTime = deltaX / zoom;
        onPan && onPan(Math.max(0, startScrollX - deltaTime));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      // Scrubbing normale
      const timeMs = (x / zoom) + scrollX;
      onSeek && onSeek(Math.max(0, timeMs));

      const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const timeMs = (x / zoom) + scrollX;
        onSeek && onSeek(Math.max(0, timeMs));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        backgroundColor: '#2a2a2a',
        cursor: isDragging ? 'grabbing' : 'pointer'
      }}
      onMouseDown={handleMouseDown}
      title="Click to seek, Shift+Drag to pan"
    />
  );
};

export default TimelineRuler;
