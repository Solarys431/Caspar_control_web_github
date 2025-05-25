import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateTimeFromX, calculateItemX, calculateItemWidth } from '../utils/timelineUtils';

/**
 * Hook per gestire le interazioni della timeline (drag, resize, click, etc.)
 */
const useTimelineInteractions = (timelineData, canvasRef) => {
  // Stati per le interazioni
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [draggedItem, setDraggedItem] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null); // 'left' | 'right'
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredTrack, setHoveredTrack] = useState(null);

  // Ref per tracking del mouse
  const mousePos = useRef({ x: 0, y: 0 });
  const lastClickTime = useRef(0);

  /**
   * Converte coordinate del mouse in tempo sulla timeline
   */
  const mouseToTime = useCallback((mouseX) => {
    if (!canvasRef.current) return 0;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const relativeX = mouseX - rect.left;

    return calculateTimeFromX(
      relativeX,
      timelineData.timelineStart,
      timelineData.timelineWidth,
      canvas.width
    );
  }, [timelineData.timelineStart, timelineData.timelineWidth]);

  /**
   * Converte coordinate del mouse in numero di traccia
   */
  const mouseToTrack = useCallback((mouseY) => {
    if (!canvasRef.current || !timelineData.tracks) return 0;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const relativeY = mouseY - rect.top;

    let currentY = 0;
    for (let i = 0; i < timelineData.tracks.length; i++) {
      const track = timelineData.tracks[i];
      if (relativeY >= currentY && relativeY < currentY + track.height) {
        return i;
      }
      currentY += track.height;
    }

    return timelineData.tracks.length - 1;
  }, [timelineData.tracks]);

  /**
   * Trova l'elemento sotto il cursore del mouse
   */
  const getItemAtPosition = useCallback((mouseX, mouseY) => {
    if (!canvasRef.current) return null;

    const time = mouseToTime(mouseX);

    // Per la timeline principale, cerca negli items direttamente
    if (timelineData.items) {
      return timelineData.items.find(item => {
        const startTime = item.startTimeMs || 0;
        const endTime = startTime + (item.durationMs || 0);
        return time >= startTime && time <= endTime;
      });
    }

    // Per timeline con tracce
    const trackIndex = mouseToTrack(mouseY);
    if (!timelineData.tracks || !timelineData.tracks[trackIndex]) return null;

    const track = timelineData.tracks[trackIndex];

    return track.items.find(item => {
      const startTime = item.startTimeMs || 0;
      const endTime = startTime + (item.durationMs || 0);
      return time >= startTime && time <= endTime;
    });
  }, [mouseToTime, mouseToTrack, timelineData.tracks, timelineData.items]);

  /**
   * Determina se il mouse è su un handle di resize
   */
  const getResizeHandle = useCallback((item, mouseX) => {
    if (!item || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const itemX = calculateItemX(
      item.startTimeMs,
      timelineData.timelineStart,
      timelineData.timelineWidth,
      canvas.width
    );
    const itemWidth = calculateItemWidth(
      item.durationMs,
      timelineData.timelineWidth,
      canvas.width
    );

    const rect = canvas.getBoundingClientRect();
    const relativeX = mouseX - rect.left;

    const handleSize = 8; // Dimensione dell'area sensibile per il resize

    if (relativeX >= itemX - handleSize && relativeX <= itemX + handleSize) {
      return 'left';
    } else if (relativeX >= itemX + itemWidth - handleSize && relativeX <= itemX + itemWidth + handleSize) {
      return 'right';
    }

    return null;
  }, [timelineData.timelineStart, timelineData.timelineWidth]);

  /**
   * Gestisce l'inizio del drag
   */
  const handleMouseDown = useCallback((event) => {
    if (!canvasRef.current) return;

    const { clientX, clientY } = event;
    mousePos.current = { x: clientX, y: clientY };

    const item = getItemAtPosition(clientX, clientY);
    const handle = item ? getResizeHandle(item, clientX) : null;

    console.log('[Timeline] Mouse down:', { item: item?.displayName, handle });

    if (handle) {
      // Inizio resize
      setIsResizing(true);
      setResizeHandle(handle);
      setDraggedItem(item);
      setDragStartPos({ x: clientX, y: clientY });
      console.log('[Timeline] Starting resize:', handle);
    } else if (item) {
      // Inizio drag
      setIsDragging(true);
      setDraggedItem(item);
      setDragStartPos({ x: clientX, y: clientY });
      console.log('[Timeline] Starting drag:', item.displayName);

      // Seleziona l'elemento
      if (timelineData.onItemSelect) {
        timelineData.onItemSelect(item.id, event.ctrlKey || event.metaKey);
      }
    } else {
      // Click su area vuota - deseleziona
      if (timelineData.onClearSelection) {
        timelineData.onClearSelection();
      }
    }

    // Previeni la selezione del testo
    event.preventDefault();
  }, [getItemAtPosition, getResizeHandle, timelineData]);

  /**
   * Gestisce il movimento del mouse
   */
  const handleMouseMove = useCallback((event) => {
    const { clientX, clientY } = event;
    mousePos.current = { x: clientX, y: clientY };

    if (isDragging && draggedItem && canvasRef.current) {
      // Calcola la nuova posizione
      const deltaX = clientX - dragStartPos.x;
      const deltaTime = (deltaX / canvasRef.current.width) * timelineData.timelineWidth;
      const newStartTime = Math.max(0, draggedItem.startTimeMs + deltaTime);

      console.log('[Timeline] Dragging:', {
        deltaX,
        deltaTime,
        newStartTime,
        originalStart: draggedItem.startTimeMs
      });

      // Applica snap se abilitato
      const snapInfo = timelineData.getSnapInfo ? timelineData.getSnapInfo(newStartTime, false) : { snappedTime: newStartTime };

      // Aggiorna la posizione dell'elemento temporaneamente per il feedback visivo
      if (timelineData.onItemMove) {
        timelineData.onItemMove(draggedItem.id, snapInfo.snappedTime);
      }

    } else if (isResizing && draggedItem && resizeHandle && canvasRef.current) {
      // Calcola la nuova durata
      const deltaX = clientX - dragStartPos.x;
      const deltaTime = (deltaX / canvasRef.current.width) * timelineData.timelineWidth;

      let newStartTime = draggedItem.startTimeMs;
      let newDuration = draggedItem.durationMs;

      if (resizeHandle === 'left') {
        // Resize dal lato sinistro (cambia start time e duration)
        newStartTime = Math.max(0, draggedItem.startTimeMs + deltaTime);
        newDuration = Math.max(1000, draggedItem.durationMs - deltaTime);
      } else if (resizeHandle === 'right') {
        // Resize dal lato destro (cambia solo duration)
        newDuration = Math.max(1000, draggedItem.durationMs + deltaTime); // Minimo 1 secondo
      }

      console.log('[Timeline] Resizing:', {
        handle: resizeHandle,
        deltaTime,
        newStartTime,
        newDuration
      });

      // Applica snap
      if (timelineData.getSnapInfo) {
        if (resizeHandle === 'left') {
          const snapInfo = timelineData.getSnapInfo(newStartTime, false);
          newStartTime = snapInfo.snappedTime;
          newDuration = draggedItem.startTimeMs + draggedItem.durationMs - newStartTime;
        } else {
          const snapInfo = timelineData.getSnapInfo(newStartTime + newDuration, false);
          newDuration = snapInfo.snappedTime - newStartTime;
        }
      }

      // Aggiorna l'elemento
      if (timelineData.onItemResize) {
        timelineData.onItemResize(draggedItem.id, newStartTime, newDuration);
      }

    } else {
      // Aggiorna hover states
      const item = getItemAtPosition(clientX, clientY);
      const trackIndex = mouseToTrack(clientY);

      setHoveredItem(item);
      setHoveredTrack(trackIndex);

      // Aggiorna il cursore
      if (item && canvasRef.current) {
        const handle = getResizeHandle(item, clientX);
        if (handle) {
          canvasRef.current.style.cursor = 'ew-resize';
        } else {
          canvasRef.current.style.cursor = 'move';
        }
      } else if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
    }
  }, [isDragging, isResizing, draggedItem, resizeHandle, dragStartPos, timelineData, getItemAtPosition, mouseToTrack, getResizeHandle]);

  /**
   * Gestisce la fine del drag
   */
  const handleMouseUp = useCallback((event) => {
    if (isDragging || isResizing) {
      // Finalizza l'operazione
      if (timelineData.onInteractionEnd) {
        timelineData.onInteractionEnd(draggedItem, isDragging ? 'move' : 'resize');
      }
    }

    // Reset stati
    setIsDragging(false);
    setIsResizing(false);
    setDraggedItem(null);
    setResizeHandle(null);
    setDragStartPos({ x: 0, y: 0 });

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  }, [isDragging, isResizing, draggedItem, timelineData]);

  /**
   * Gestisce il click (selezione)
   */
  const handleClick = useCallback((event) => {
    const now = Date.now();
    const isDoubleClick = now - lastClickTime.current < 300;
    lastClickTime.current = now;

    const { clientX, clientY } = event;
    const item = getItemAtPosition(clientX, clientY);

    if (item) {
      if (isDoubleClick) {
        // Double click - apri editor
        if (timelineData.onItemDoubleClick) {
          timelineData.onItemDoubleClick(item);
        }
      } else {
        // Single click - selezione
        const multiSelect = event.ctrlKey || event.metaKey;
        if (timelineData.onItemSelect) {
          timelineData.onItemSelect(item.id, multiSelect);
        }
      }
    } else {
      // Click su area vuota - deseleziona
      if (timelineData.onClearSelection) {
        timelineData.onClearSelection();
      }
    }
  }, [getItemAtPosition, timelineData]);

  /**
   * Gestisce lo scroll per zoom e pan
   */
  const handleWheel = useCallback((event) => {
    event.preventDefault();

    console.log('[Timeline] Wheel event:', {
      deltaY: event.deltaY,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey
    });

    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const zoomFactor = event.deltaY > 0 ? 0.8 : 1.25;
      console.log('[Timeline] Zooming:', zoomFactor);
      if (timelineData.onZoom) {
        timelineData.onZoom(zoomFactor);
      }
    } else {
      // Pan orizzontale
      const panAmount = event.deltaY * 1000; // Converti scroll verticale in pan orizzontale (ms)
      console.log('[Timeline] Panning:', panAmount);
      if (timelineData.onPan) {
        timelineData.onPan(panAmount);
      }
    }
  }, [timelineData]);

  /**
   * Gestisce i tasti della tastiera
   */
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (timelineData.selectedItems && timelineData.selectedItems.length > 0) {
          if (timelineData.onDeleteItems) {
            timelineData.onDeleteItems(timelineData.selectedItems);
          }
        }
        break;

      case 'Escape':
        if (timelineData.onClearSelection) {
          timelineData.onClearSelection();
        }
        break;

      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (timelineData.onSelectAll) {
            timelineData.onSelectAll();
          }
        }
        break;

      default:
        break;
    }
  }, [timelineData]);

  /**
   * Registra gli event listeners
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('wheel', handleWheel);

    // Keyboard events sul document
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleClick, handleWheel, handleKeyDown]);

  return {
    // Stati delle interazioni
    isDragging,
    isResizing,
    draggedItem,
    hoveredItem,
    hoveredTrack,
    resizeHandle,

    // Utility functions
    mouseToTime,
    mouseToTrack,
    getItemAtPosition,
    getResizeHandle
  };
};

export default useTimelineInteractions;
