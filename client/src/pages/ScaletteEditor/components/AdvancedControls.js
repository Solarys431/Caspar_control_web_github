import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Grid
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LoopIcon from '@mui/icons-material/Loop';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import UpdateIcon from '@mui/icons-material/Update';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Componente per i controlli avanzati di media e template grafici
 *
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.selectedItem - Elemento selezionato nella scaletta
 * @param {Function} props.onPlaybackControl - Funzione per gestire i controlli di riproduzione
 * @param {Function} props.onTemplateControl - Funzione per gestire i controlli dei template
 * @param {boolean} props.disabled - Se i controlli sono disabilitati
 * @returns {JSX.Element} - Componente React
 */
const AdvancedControls = ({
  selectedItem,
  onPlaybackControl,
  onTemplateControl,
  disabled = false
}) => {
  const [expanded, setExpanded] = React.useState(true);

  const hasMedia = selectedItem && (selectedItem.type === 'MEDIA' ||
    (selectedItem.type === 'STORY' && selectedItem.data?.mediaDetails));

  const hasTemplates = selectedItem && (selectedItem.type === 'TEMPLATE' ||
    (selectedItem.type === 'STORY' && (selectedItem.data?.templateDetails ||
      (selectedItem.data?.templatesDetails && selectedItem.data.templatesDetails.length > 0))));

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (!selectedItem) {
    return (
      <Paper elevation={1} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Seleziona un elemento per visualizzare i controlli
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Controlli Avanzati
        </Typography>
        <IconButton size="small" onClick={handleToggleExpanded}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Content */}
      {expanded && (
        <Box sx={{ p: 1, flexGrow: 1, overflow: 'auto' }}>
          {/* Informazioni elemento selezionato */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Elemento selezionato:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {selectedItem.name || selectedItem.customName || 'Senza nome'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tipo: {selectedItem.type}
            </Typography>
          </Box>

          {/* Controlli Media */}
          {hasMedia && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                Controlli Media
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Tooltip title="Play">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => onPlaybackControl && onPlaybackControl('play')}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'primary.main' }}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Pause">
                    <IconButton
                      color="warning"
                      size="small"
                      onClick={() => onPlaybackControl && onPlaybackControl('pause')}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'warning.main' }}
                    >
                      <PauseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Resume">
                    <IconButton
                      color="success"
                      size="small"
                      onClick={() => onPlaybackControl && onPlaybackControl('resume')}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'success.main' }}
                    >
                      <PlayCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Stop">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => onPlaybackControl && onPlaybackControl('stop')}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'error.main' }}
                    >
                      <StopIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Loop">
                    <IconButton
                      color="secondary"
                      size="small"
                      onClick={() => onPlaybackControl && onPlaybackControl('loop')}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'secondary.main' }}
                    >
                      <LoopIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Retrocedi 10 Frame">
                    <IconButton
                      color="warning"
                      size="small"
                      onClick={() => onPlaybackControl && onPlaybackControl('rewind10frames')}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'warning.main' }}
                    >
                      <FastRewindIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Avanza 10 Frame">
                    <IconButton
                      color="info"
                      size="small"
                      onClick={() => onPlaybackControl && onPlaybackControl('advance10frames')}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'info.main' }}
                    >
                      <FastForwardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <Tooltip title="Pulisci Tutto il Canale">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => onPlaybackControl && onPlaybackControl('clearChannel')}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'error.main', mt: 1 }}
                    >
                      <ClearAllIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </>
          )}

          {/* Controlli Template Grafici */}
          {hasTemplates && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'secondary.main' }}>
                Controlli Template Grafici
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Tooltip title="Aggiungi Template">
                    <IconButton
                      color="success"
                      size="small"
                      onClick={() => onTemplateControl && onTemplateControl('cgAdd', selectedItem)}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'success.main' }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Riproduci Template">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => onTemplateControl && onTemplateControl('cgPlay', selectedItem)}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'primary.main' }}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Aggiorna Template">
                    <IconButton
                      color="info"
                      size="small"
                      onClick={() => onTemplateControl && onTemplateControl('cgUpdate', selectedItem)}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'info.main' }}
                    >
                      <UpdateIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Ferma Template">
                    <IconButton
                      color="warning"
                      size="small"
                      onClick={() => onTemplateControl && onTemplateControl('cgStop', selectedItem)}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'warning.main' }}
                    >
                      <StopIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <Tooltip title="Rimuovi Template">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => onTemplateControl && onTemplateControl('cgClear', selectedItem)}
                      disabled={disabled}
                      fullWidth
                      sx={{ border: 1, borderColor: 'error.main' }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </>
          )}

          {/* Messaggio se nessun controllo disponibile */}
          {!hasMedia && !hasTemplates && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nessun controllo disponibile per questo tipo di elemento
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default AdvancedControls;
