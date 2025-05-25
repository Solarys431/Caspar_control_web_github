import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Typography,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  ViewList as TableIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon
} from '@mui/icons-material';
import MainTimelineView from './MainTimelineView';
import StoryTimelineView from './StoryTimelineView';
import TimelineControls from './TimelineControls';
import useTimelineData from '../../hooks/useTimelineData';
import useOscData from '../../hooks/useOscData';

/**
 * Componente principale della Timeline Visuale Avanzata
 * Gestisce sia la timeline principale che quella interna delle storie
 */
const AdvancedTimeline = ({
  items = [],
  selectedItem = null,
  onItemSelect,
  onItemUpdate,
  onItemPlay,
  onItemStop,
  onViewModeChange,
  previewChannel = 3,
  previewLayer = 1
}) => {
  // Stati locali
  const [viewMode, setViewMode] = useState('main'); // 'main' | 'story'
  const [showControls, setShowControls] = useState(true);

  // Hook per dati timeline
  const timelineData = useTimelineData(items, viewMode === 'story' ? selectedItem : null);

  // Hook per dati OSC (per playhead sincronizzato)
  const oscData = useOscData(previewChannel, previewLayer);

  /**
   * Gestisce il cambio di modalità di visualizzazione
   */
  const handleViewModeChange = useCallback((_, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      if (onViewModeChange) {
        onViewModeChange(newMode);
      }
    }
  }, [onViewModeChange]);

  /**
   * Gestisce la selezione di un elemento
   */
  const handleItemSelect = useCallback((itemId, multiSelect = false) => {
    timelineData.toggleItemSelection(itemId, multiSelect);

    if (onItemSelect) {
      const item = viewMode === 'main'
        ? items.find(i => i.id === itemId)
        : selectedItem?.data?.internal_items?.find(i => i.id === itemId);
      onItemSelect(item);
    }
  }, [timelineData, onItemSelect, viewMode, items, selectedItem]);

  /**
   * Gestisce l'aggiornamento di posizione di un elemento
   */
  const handleItemMove = useCallback((itemId, newStartTimeMs) => {
    const updateData = viewMode === 'main'
      ? timelineData.updateMainItemPosition(itemId, newStartTimeMs)
      : timelineData.updateInternalItemPosition(itemId, newStartTimeMs);

    if (updateData && onItemUpdate) {
      onItemUpdate(updateData);
    }
  }, [timelineData, viewMode, onItemUpdate]);

  /**
   * Gestisce il resize di un elemento
   */
  const handleItemResize = useCallback((itemId, newStartTimeMs, newDurationMs) => {
    const positionUpdate = viewMode === 'main'
      ? timelineData.updateMainItemPosition(itemId, newStartTimeMs)
      : timelineData.updateInternalItemPosition(itemId, newStartTimeMs);

    const durationUpdate = timelineData.updateItemDuration(itemId, newDurationMs, viewMode === 'story');

    if (onItemUpdate) {
      // Combina gli aggiornamenti
      const combinedUpdate = {
        ...positionUpdate,
        updates: {
          ...positionUpdate?.updates,
          ...durationUpdate?.updates
        }
      };
      onItemUpdate(combinedUpdate);
    }
  }, [timelineData, viewMode, onItemUpdate]);

  /**
   * Gestisce il double-click su un elemento
   */
  const handleItemDoubleClick = useCallback((item) => {
    if (viewMode === 'main' && item.type === 'STORY') {
      // Apri la timeline interna della storia
      setViewMode('story');
      if (onItemSelect) {
        onItemSelect(item);
      }
    }
  }, [viewMode, onItemSelect]);

  /**
   * Gestisce la riproduzione di un elemento
   */
  const handleItemPlay = useCallback((item) => {
    if (onItemPlay) {
      onItemPlay(item);
    }
  }, [onItemPlay]);

  /**
   * Gestisce lo stop di un elemento
   */
  const handleItemStop = useCallback((item) => {
    if (onItemStop) {
      onItemStop(item);
    }
  }, [onItemStop]);

  /**
   * Torna alla timeline principale
   */
  const handleBackToMain = useCallback(() => {
    setViewMode('main');
    if (onViewModeChange) {
      onViewModeChange('main');
    }
  }, [onViewModeChange]);

  // Determina quale timeline mostrare
  const currentTimelineData = viewMode === 'main' ? timelineData.mainTimelineData : timelineData.storyTimelineData;

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header con controlli */}
      <Box sx={{
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        {/* Toggle modalità visualizzazione */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="main">
            <TimelineIcon fontSize="small" />
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              Scaletta
            </Typography>
          </ToggleButton>
          <ToggleButton
            value="story"
            disabled={!selectedItem || selectedItem.type !== 'STORY'}
          >
            <TableIcon fontSize="small" />
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              Storia
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Titolo della vista corrente */}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {viewMode === 'main'
            ? 'Timeline Scaletta'
            : `Timeline Storia: ${selectedItem?.name || 'Sconosciuta'}`
          }
        </Typography>

        {/* Controlli zoom */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Zoom Out">
            <IconButton
              size="small"
              onClick={() => {
                if (viewMode === 'main') {
                  timelineData.setMainZoom(timelineData.mainTimelineZoom * 0.8);
                } else {
                  timelineData.setStoryZoom(timelineData.storyTimelineZoom * 0.8);
                }
              }}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Typography variant="caption" sx={{ minWidth: '40px', textAlign: 'center' }}>
            {Math.round((viewMode === 'main' ? timelineData.mainTimelineZoom : timelineData.storyTimelineZoom) * 100)}%
          </Typography>

          <Tooltip title="Zoom In">
            <IconButton
              size="small"
              onClick={() => {
                if (viewMode === 'main') {
                  timelineData.setMainZoom(timelineData.mainTimelineZoom * 1.2);
                } else {
                  timelineData.setStoryZoom(timelineData.storyTimelineZoom * 1.2);
                }
              }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Adatta alla finestra">
            <IconButton
              size="small"
              onClick={() => {
                // Calcola zoom per adattare tutto il contenuto
                const duration = currentTimelineData.duration;
                const optimalZoom = duration > 0 ? (24 * 60 * 60 * 1000) / duration : 1;

                if (viewMode === 'main') {
                  timelineData.setMainZoom(optimalZoom);
                } else {
                  timelineData.setStoryZoom(optimalZoom);
                }
              }}
            >
              <FitScreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Toggle griglia */}
        <Tooltip title={timelineData.snapToGrid ? "Disabilita griglia" : "Abilita griglia"}>
          <IconButton
            size="small"
            color={timelineData.snapToGrid ? "primary" : "default"}
            onClick={() => timelineData.setSnapToGrid(!timelineData.snapToGrid)}
          >
            {timelineData.snapToGrid ? <GridOnIcon fontSize="small" /> : <GridOffIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Area principale timeline */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {viewMode === 'main' ? (
          <MainTimelineView
            timelineData={timelineData}
            oscData={oscData}
            onItemSelect={handleItemSelect}
            onItemMove={handleItemMove}
            onItemResize={handleItemResize}
            onItemDoubleClick={handleItemDoubleClick}
            onItemPlay={handleItemPlay}
            onItemStop={handleItemStop}
          />
        ) : (
          <StoryTimelineView
            timelineData={timelineData}
            oscData={oscData}
            selectedStory={selectedItem}
            onItemSelect={handleItemSelect}
            onItemMove={handleItemMove}
            onItemResize={handleItemResize}
            onItemPlay={handleItemPlay}
            onItemStop={handleItemStop}
            onBackToMain={handleBackToMain}
          />
        )}
      </Box>

      {/* Controlli timeline (opzionali) */}
      {showControls && (
        <TimelineControls
          timelineData={timelineData}
          viewMode={viewMode}
          oscData={oscData}
          onToggleControls={() => setShowControls(!showControls)}
          onPlay={() => {
            console.log('[Timeline] Global play triggered');
            // Implementa logica di play globale se necessaria
          }}
          onPause={() => {
            console.log('[Timeline] Global pause triggered');
            // Implementa logica di pause globale se necessaria
          }}
          onStop={() => {
            console.log('[Timeline] Global stop triggered');
            // Implementa logica di stop globale se necessaria
          }}
          onSeek={(timeMs) => {
            console.log('[Timeline] Seek to:', timeMs);
            // Implementa logica di seek se necessaria
          }}
        />
      )}
    </Paper>
  );
};

export default AdvancedTimeline;
