import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Collapse,
  Button
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import PreviewPlayer from '../../../components/PreviewPlayer';
import PlaybackControls from './PlaybackControls';

/**
 * Componente per la sezione di anteprima
 *
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.previewState - Stato della preview
 * @param {Function} props.onPlaybackControl - Funzione per gestire i controlli di riproduzione
 * @param {Function} props.onToggleExpand - Funzione per espandere/ridurre la preview
 * @param {Object} props.controls - Controlli aggiuntivi per la preview
 * @param {boolean} props.controls.pin - Se mostrare il controllo per fissare la preview
 * @param {boolean} props.controls.popOut - Se mostrare il controllo per aprire la preview in una finestra separata
 * @param {boolean} props.controls.collapse - Se mostrare il controllo per collassare la preview
 * @returns {JSX.Element} - Componente React
 */
const PreviewSection = ({
  previewState,
  onPlaybackControl,
  onToggleExpand,
  controls = {
    pin: false,
    popOut: false,
    collapse: false
  }
}) => {
  const {
    previewMedia,
    previewTemplate,
    previewExpanded,
    playbackStatus,
    progressValue,
    currentTimecode,
    remainingTime,
    previewOscData,
    handleTemplateControl
  } = previewState;

  // Stati locali per i controlli aggiuntivi
  const [isPinned, setIsPinned] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPopOut, setIsPopOut] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 600, height: 400 });

  // Stati per i campi IN e OUT
  const [inPoint, setInPoint] = useState('00:00:00:00');
  const [outPoint, setOutPoint] = useState(
    previewOscData && previewOscData.length && previewOscData.length.timecode
      ? previewOscData.length.timecode
      : '00:03:30:00'
  );

  // Effetto per aggiornare i campi di IN e OUT quando previewOscData cambia
  useEffect(() => {
    if (previewOscData) {
      // Aggiorna il campo OUT con la durata totale del media
      if (previewOscData.length && previewOscData.length.timecode) {
        const mediaDuration = previewOscData.length.timecode;
        setOutPoint(mediaDuration);
        console.log("PreviewSection - Durata media aggiornata:", mediaDuration);

        // Aggiorna anche il campo DOM per compatibilità
        const outPointField = document.getElementById('outPointField');
        if (outPointField) {
          outPointField.value = mediaDuration;
        }
      }

      // Log per debug
      console.log("PreviewSection - Dati OSC aggiornati:", previewOscData);
    } else {
      // Se non abbiamo dati OSC, mantieni il valore di default
      console.log("PreviewSection - Nessun dato OSC disponibile");
    }
  }, [previewOscData]);

  // Gestione del pin
  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  // Gestione del collasso
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Gestione del pop-out
  const handleTogglePopOut = () => {
    const newPopOutState = !isPopOut;
    setIsPopOut(newPopOutState);

    // Se stiamo chiudendo il pop-out, forza la reinizializzazione del WebRTC nella finestra principale
    if (!newPopOutState) {
      console.log('[PreviewSection] Pop-out chiuso, reinizializzazione WebRTC in corso...');
      // Piccolo delay per permettere al DOM di aggiornarsi
      setTimeout(() => {
        // Forza il re-render del PreviewPlayer nella finestra principale
        // Questo trigger un nuovo useEffect nel PreviewPlayer
        window.dispatchEvent(new Event('webrtc-reinit'));
      }, 100);
    }
  };

  // Gestione della visualizzazione dei dettagli
  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // Gestione del ridimensionamento della finestra
  const handleResize = (_, { size }) => {
    setWindowSize(size);
  };

  return (
    <>
      <Paper
        elevation={isPinned ? 6 : 1}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: isPinned ? '1px solid' : 'none',
          borderColor: 'primary.main',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header della preview */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Anteprima
            </Typography>
            {previewMedia && (
              <Chip
                label={playbackStatus}
                size="small"
                color={playbackStatus === 'PLAYING' ? 'success' : playbackStatus === 'PAUSED' ? 'warning' : 'default'}
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex' }}>
            {controls.pin && (
              <Tooltip title={isPinned ? "Sblocca" : "Blocca"}>
                <IconButton size="small" onClick={handleTogglePin}>
                  {isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}

            {controls.popOut && (
              <Tooltip title="Apri in finestra separata">
                <IconButton size="small" onClick={handleTogglePopOut}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title={previewExpanded ? "Riduci" : "Espandi"}>
              <IconButton size="small" onClick={onToggleExpand}>
                {previewExpanded ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {controls.collapse && (
              <Tooltip title={isCollapsed ? "Espandi" : "Comprimi"}>
                <IconButton size="small" onClick={handleToggleCollapse}>
                  {isCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Collapse in={!isCollapsed} collapsedSize={0} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Player di anteprima */}
          <Box sx={{
            height: previewExpanded ? '250px' : '180px',
            transition: 'height 0.3s ease',
            position: 'relative'
          }}>
            <PreviewPlayer
              sourceUdpUrl="udp://100.74.188.128:5004?pkt_size=1316"
              webrtcSignalingUrl="http://100.74.188.128:8889"
              showLatency
            />
          </Box>

          {/* Barra di avanzamento */}
          <Box sx={{ px: 1, pt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progressValue || 0}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: playbackStatus === 'PLAYING' ? 'primary.main' :
                                  playbackStatus === 'PAUSED' ? 'warning.main' : 'grey.500'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {currentTimecode || '00:00:00:00'}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {remainingTime || '00:00:00:00'}
              </Typography>
            </Box>
          </Box>

          {/* Controlli di riproduzione */}
          <Box sx={{ px: 1, py: 0.5 }}>
            <PlaybackControls
              onPlaybackControl={onPlaybackControl}
              onTemplateControl={handleTemplateControl}
              disabled={!previewMedia}
              compact={true}
              showTemplateControls={!!previewTemplate}
            />
          </Box>

          {/* Pulsante per mostrare/nascondere i dettagli */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 0.5
          }}>
            <Button
              size="small"
              onClick={handleToggleDetails}
              endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ fontSize: '0.75rem' }}
            >
              {showDetails ? 'Nascondi Dettagli' : 'Mostra Dettagli'}
            </Button>
          </Box>

          {/* Dettagli aggiuntivi */}
          <Collapse in={showDetails}>
            <Box sx={{ p: 1, pt: 0 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Punto IN:</Typography>
                  <TextField
                    size="small"
                    value={inPoint}
                    onChange={(e) => {
                      // Validazione del formato timecode
                      const timecodeRegex = /^([0-9]{2}):([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
                      if (timecodeRegex.test(e.target.value) || e.target.value === "") {
                        setInPoint(e.target.value || "00:00:00:00");
                      }
                    }}
                    sx={{ mt: 0.5, width: '100%' }}
                    inputProps={{ style: { fontSize: '0.8rem', padding: '6px 8px' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Punto OUT:</Typography>
                  <TextField
                    size="small"
                    value={outPoint}
                    onChange={(e) => {
                      // Validazione del formato timecode
                      const timecodeRegex = /^([0-9]{2}):([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
                      if (timecodeRegex.test(e.target.value) || e.target.value === "") {
                        setOutPoint(e.target.value || "00:03:30:00");
                      }
                    }}
                    sx={{ mt: 0.5, width: '100%' }}
                    inputProps={{ style: { fontSize: '0.8rem', padding: '6px 8px' } }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Collapse>
      </Paper>

      {/* Finestra flottante draggable e ridimensionabile per la modalità pop-out */}
      {isPopOut && (
        <Draggable
          handle=".drag-handle"
          defaultPosition={{ x: 100, y: 100 }}
          cancel=".no-drag"
        >
          <Resizable
            width={windowSize.width}
            height={windowSize.height}
            onResize={handleResize}
            minConstraints={[400, 300]}
            maxConstraints={[1200, 800]}
            resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'e', 'w', 'n']}
          >
            <Paper
              elevation={8}
              sx={{
                position: 'fixed',
                width: `${windowSize.width}px`,
                height: `${windowSize.height}px`,
                maxWidth: '90vw',
                maxHeight: '90vh',
                zIndex: 1300,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
            {/* Header draggable */}
            <Box
              className="drag-handle"
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                cursor: 'move',
                userSelect: 'none'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DragIndicatorIcon fontSize="small" />
                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                  Anteprima: {previewMedia
                    ? (typeof previewMedia === 'string'
                      ? previewMedia.split('/').pop()
                      : previewMedia.path.split('/').pop())
                    : 'Nessun media selezionato'}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={handleTogglePopOut}
                sx={{ color: 'inherit' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Content */}
            <Box className="no-drag" sx={{ p: 2, overflow: 'auto', flexGrow: 1 }}>
              <Box className="no-drag" sx={{ height: '300px', mb: 2 }}>
                <PreviewPlayer
                  sourceUdpUrl="udp://100.74.188.128:5004?pkt_size=1316"
                  webrtcSignalingUrl="http://100.74.188.128:8889"
                  showLatency
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressValue || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: playbackStatus === 'PLAYING' ? 'primary.main' :
                                      playbackStatus === 'PAUSED' ? 'warning.main' : 'grey.500'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {currentTimecode || '00:00:00:00'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {remainingTime || '00:00:00:00'}
                  </Typography>
                </Box>
              </Box>

              <PlaybackControls
                onPlaybackControl={onPlaybackControl}
                onTemplateControl={handleTemplateControl}
                disabled={!previewMedia}
                showTemplateControls={!!previewTemplate}
                compact={true}
              />

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Punto IN:</Typography>
                  <TextField
                    size="small"
                    value={inPoint}
                    onChange={(e) => {
                      // Validazione del formato timecode
                      const timecodeRegex = /^([0-9]{2}):([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
                      if (timecodeRegex.test(e.target.value) || e.target.value === "") {
                        setInPoint(e.target.value || "00:00:00:00");
                      }
                    }}
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Punto OUT:</Typography>
                  <TextField
                    size="small"
                    value={outPoint}
                    onChange={(e) => {
                      // Validazione del formato timecode
                      const timecodeRegex = /^([0-9]{2}):([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
                      if (timecodeRegex.test(e.target.value) || e.target.value === "") {
                        setOutPoint(e.target.value || "00:03:30:00");
                      }
                    }}
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
          </Resizable>
        </Draggable>
      )}
    </>
  );
};

export default PreviewSection;
