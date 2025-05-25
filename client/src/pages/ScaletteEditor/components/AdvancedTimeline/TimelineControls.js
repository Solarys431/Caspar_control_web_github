import React, { useState } from 'react';
import {
  Box,
  Paper,
  Slider,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipPrevious as PrevIcon,
  SkipNext as NextIcon,
  Replay as ReplayIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { msToTimecode, timecodeToMs } from '../../utils/timelineUtils';

/**
 * Componente per i controlli della timeline
 * Include controlli di riproduzione, zoom, griglia e impostazioni
 */
const TimelineControls = ({
  timelineData,
  viewMode = 'main',
  oscData,
  onToggleControls,
  onPlay,
  onPause,
  onStop,
  onSeek
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Determina i dati della timeline corrente
  const currentData = viewMode === 'main' ? timelineData.mainTimelineData : timelineData.storyTimelineData;
  const currentZoom = viewMode === 'main' ? timelineData.mainTimelineZoom : timelineData.storyTimelineZoom;
  const currentStart = viewMode === 'main' ? timelineData.mainTimelineStart : timelineData.storyTimelineStart;
  const currentWidth = viewMode === 'main' ? timelineData.mainTimelineWidth : timelineData.storyTimelineWidth;

  /**
   * Gestisce il cambio di zoom tramite slider
   */
  const handleZoomChange = (event, newValue) => {
    const zoomValue = newValue / 100;
    if (viewMode === 'main') {
      timelineData.setMainZoom(zoomValue);
    } else {
      timelineData.setStoryZoom(zoomValue);
    }
  };

  /**
   * Gestisce il seek sulla timeline
   */
  const handleSeek = (event, newValue) => {
    const seekTime = (newValue / 100) * currentData.duration;
    if (onSeek) {
      onSeek(seekTime);
    }
  };

  /**
   * Calcola la posizione corrente come percentuale
   */
  const getCurrentPosition = () => {
    if (!oscData?.timecode || oscData.timecode === '00:00:00:00') return 0;
    const currentTimeMs = timecodeToMs(oscData.timecode);
    return Math.min(100, (currentTimeMs / currentData.duration) * 100);
  };

  /**
   * Gestisce il cambio della dimensione della griglia
   */
  const handleGridSizeChange = (event) => {
    const newSize = parseInt(event.target.value);
    timelineData.setGridSize(newSize);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      {/* Barra controlli principale */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        gap: 1,
        minHeight: '48px'
      }}>
        {/* Controlli di riproduzione */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Precedente">
            <IconButton size="small">
              <PrevIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Play">
            <IconButton
              size="small"
              onClick={() => {
                console.log('[Timeline] Play button clicked');
                if (onPlay) onPlay();
              }}
              color="primary"
            >
              <PlayIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Pausa">
            <IconButton
              size="small"
              onClick={() => {
                console.log('[Timeline] Pause button clicked');
                if (onPause) onPause();
              }}
              color="warning"
            >
              <PauseIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Stop">
            <IconButton
              size="small"
              onClick={() => {
                console.log('[Timeline] Stop button clicked');
                if (onStop) onStop();
              }}
              color="error"
            >
              <StopIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Successivo">
            <IconButton size="small">
              <NextIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Riavvolgi">
            <IconButton size="small">
              <ReplayIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Timecode corrente */}
        <Box sx={{ minWidth: '100px' }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          >
            {oscData?.timecode || '00:00:00:00'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Posizione
          </Typography>
        </Box>

        {/* Slider posizione */}
        <Box sx={{ flex: 1, mx: 2 }}>
          <Slider
            value={getCurrentPosition()}
            onChange={handleSeek}
            min={0}
            max={100}
            size="small"
            sx={{
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {msToTimecode(currentStart, 25, false)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {msToTimecode(currentData.duration, 25, false)}
            </Typography>
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Controlli zoom */}
        <Box sx={{ minWidth: '120px' }}>
          <Typography variant="caption" color="text.secondary">
            Zoom: {Math.round(currentZoom * 100)}%
          </Typography>
          <Slider
            value={currentZoom * 100}
            onChange={handleZoomChange}
            min={10}
            max={1000}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Toggle griglia */}
        <FormControlLabel
          control={
            <Switch
              checked={timelineData.snapToGrid}
              onChange={(e) => timelineData.setSnapToGrid(e.target.checked)}
              size="small"
            />
          }
          label="Griglia"
          sx={{ m: 0 }}
        />

        {/* Pulsante impostazioni avanzate */}
        <Tooltip title="Impostazioni avanzate">
          <IconButton
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            color={showAdvanced ? "primary" : "default"}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        {/* Toggle espansione */}
        <Tooltip title={expanded ? "Comprimi" : "Espandi"}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Controlli avanzati */}
      <Collapse in={showAdvanced}>
        <Box sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Impostazioni Timeline
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Dimensione griglia */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Griglia</InputLabel>
              <Select
                value={timelineData.gridSize}
                onChange={handleGridSizeChange}
                label="Griglia"
              >
                <MenuItem value={40}>1 Frame (40ms)</MenuItem>
                <MenuItem value={100}>100ms</MenuItem>
                <MenuItem value={250}>250ms</MenuItem>
                <MenuItem value={500}>500ms</MenuItem>
                <MenuItem value={1000}>1 Secondo</MenuItem>
                <MenuItem value={5000}>5 Secondi</MenuItem>
                <MenuItem value={10000}>10 Secondi</MenuItem>
              </Select>
            </FormControl>

            {/* Informazioni timeline */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Elementi: {currentData.items.length}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Durata: {msToTimecode(currentData.duration, 25, false)}
              </Typography>
              {currentData.conflicts.length > 0 && (
                <>
                  <br />
                  <Typography variant="caption" color="error">
                    Conflitti: {currentData.conflicts.length}
                  </Typography>
                </>
              )}
            </Box>

            {/* Statistiche OSC */}
            {oscData && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  OSC: {oscData.isConnected ? 'Connesso' : 'Disconnesso'}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  FPS: {oscData.fps || 25}
                </Typography>
                {oscData.duration && (
                  <>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      Durata Media: {oscData.duration}
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>

      {/* Pannello espanso con informazioni dettagliate */}
      <Collapse in={expanded}>
        <Box sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Informazioni Dettagliate
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {/* Elementi selezionati */}
            {timelineData.selectedItems.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  Elementi Selezionati
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {timelineData.selectedItems.length} elementi selezionati
                </Typography>
              </Box>
            )}

            {/* Tracce (solo per timeline storie) */}
            {viewMode === 'story' && timelineData.storyTimelineData.tracks && (
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  Tracce
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {timelineData.storyTimelineData.tracks.length} tracce attive
                </Typography>
              </Box>
            )}

            {/* Vista corrente */}
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Vista Corrente
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {msToTimecode(currentStart, 25, false)} - {msToTimecode(currentStart + currentWidth, 25, false)}
              </Typography>
            </Box>

            {/* Performance */}
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Performance
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Zoom: {Math.round(currentZoom * 100)}% | Griglia: {timelineData.gridSize}ms
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default TimelineControls;
