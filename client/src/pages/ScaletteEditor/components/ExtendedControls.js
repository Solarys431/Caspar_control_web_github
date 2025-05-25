import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Tabs,
  Tab,
  Chip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  TextField
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import ReplayIcon from '@mui/icons-material/Replay';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import AddIcon from '@mui/icons-material/Add';
import UpdateIcon from '@mui/icons-material/Update';
import ClearIcon from '@mui/icons-material/Clear';
import MovieIcon from '@mui/icons-material/Movie';
import BrushIcon from '@mui/icons-material/Brush';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import InfoIcon from '@mui/icons-material/Info';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LayersIcon from '@mui/icons-material/Layers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Componente per i controlli estesi che sostituisce AdvancedControls e ContextualInfoPanel
 * Design professionale su 2 colonne
 */
const ExtendedControls = ({
  selectedItem,
  nextItems = [],
  onPlaybackControl,
  onTemplateControl,
  disabled = false,
  remainingTime,
  systemLogs = [],
  oscData = {},
  onSelectItem
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [trimFrame, setTrimFrame] = useState(0);

  // Determina se l'elemento selezionato ha media o template
  const hasMedia = selectedItem && (
    selectedItem.type === 'MEDIA' ||
    (selectedItem.type === 'STORY' && selectedItem.data?.mediaDetails?.clipPath)
  );

  const hasTemplates = selectedItem && (
    selectedItem.type === 'TEMPLATE' ||
    (selectedItem.type === 'STORY' && (
      selectedItem.data?.templateDetails?.templateFile ||
      (selectedItem.data?.templatesDetails && selectedItem.data.templatesDetails.length > 0)
    ))
  );

  // Funzione per ottenere l'icona del tipo di elemento
  const getItemIcon = (type) => {
    switch (type) {
      case 'MEDIA':
        return <MovieIcon fontSize="small" />;
      case 'TEMPLATE':
        return <BrushIcon fontSize="small" />;
      case 'STORY':
        return <TextFieldsIcon fontSize="small" />;
      default:
        return <PlayArrowIcon fontSize="small" />;
    }
  };

  // Funzione per ottenere il colore del tipo di elemento
  const getItemColor = (type) => {
    switch (type) {
      case 'MEDIA':
        return 'primary';
      case 'TEMPLATE':
        return 'secondary';
      case 'STORY':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Funzione per gestire il trim del media
  const handleTrimMedia = () => {
    if (!selectedItem || !onPlaybackControl || trimFrame < 0) {
      console.warn('Impossibile eseguire trim: dati non validi');
      return;
    }

    // Esegui il trim utilizzando la logica LOAD + SEEK
    onPlaybackControl('trim', { targetFrame: trimFrame });
    console.log(`Trim media al frame: ${trimFrame}`);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}
    >
      {/* Header con tabs compatto */}
      <Box sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: '40px',
            '& .MuiTab-root': {
              minHeight: '40px',
              fontSize: '0.8rem',
              fontWeight: 'medium',
              py: 0.5
            }
          }}
        >
          <Tab
            label="Controlli"
            icon={<PlayArrowIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            label="Info"
            icon={<InfoIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            label="Prossimi"
            icon={<SkipNextIcon fontSize="small" />}
            iconPosition="start"
            disabled={nextItems.length === 0}
          />
        </Tabs>
      </Box>

      {/* Contenuto */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1.5 }}>
        {/* Tab Controlli */}
        {activeTab === 0 && (
          <Stack spacing={1.5}>
            {/* Controlli Media */}
            {hasMedia && (
              <Box sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                bgcolor: 'background.default'
              }}>
                <Typography variant="subtitle2" sx={{
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}>
                  <MovieIcon fontSize="small" />
                  Controlli Media
                </Typography>

                {/* Controlli principali in una riga compatta */}
                <Grid container spacing={0.5}>
                  <Grid item xs={1.8}>
                    <Tooltip title="Play">
                      <IconButton
                        color="success"
                        size="small"
                        onClick={() => onPlaybackControl && onPlaybackControl('play')}
                        disabled={disabled}
                        sx={{
                          width: '100%',
                          height: '32px',
                          minHeight: '32px',
                          border: 1,
                          borderColor: 'success.main',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'success.light', color: 'white' }
                        }}
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={1.8}>
                    <Tooltip title="Pause">
                      <IconButton
                        color="warning"
                        size="small"
                        onClick={() => onPlaybackControl && onPlaybackControl('pause')}
                        disabled={disabled}
                        sx={{
                          width: '100%',
                          height: '32px',
                          minHeight: '32px',
                          border: 1,
                          borderColor: 'warning.main',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'warning.light', color: 'white' }
                        }}
                      >
                        <PauseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={1.8}>
                    <Tooltip title="Resume">
                      <IconButton
                        color="info"
                        size="small"
                        onClick={() => onPlaybackControl && onPlaybackControl('resume')}
                        disabled={disabled}
                        sx={{
                          width: '100%',
                          height: '32px',
                          minHeight: '32px',
                          border: 1,
                          borderColor: 'info.main',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'info.light', color: 'white' }
                        }}
                      >
                        <ReplayIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={1.8}>
                    <Tooltip title="Stop">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => onPlaybackControl && onPlaybackControl('stop')}
                        disabled={disabled}
                        sx={{
                          width: '100%',
                          height: '32px',
                          minHeight: '32px',
                          border: 1,
                          borderColor: 'error.main',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'error.light', color: 'white' }
                        }}
                      >
                        <StopIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={1.8}>
                    <Tooltip title="Clear Channel">
                      <IconButton
                        color="secondary"
                        size="small"
                        onClick={() => onPlaybackControl && onPlaybackControl('clearChannel')}
                        disabled={disabled}
                        sx={{
                          width: '100%',
                          height: '32px',
                          minHeight: '32px',
                          border: 1,
                          borderColor: 'secondary.main',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'secondary.light', color: 'white' }
                        }}
                      >
                        <ClearAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Box sx={{ display: 'flex', gap: 0.5, height: '32px' }}>
                      <TextField
                        label="Frame"
                        type="number"
                        size="small"
                        value={trimFrame}
                        onChange={(e) => setTrimFrame(Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={disabled}
                        inputProps={{ min: 0, step: 1 }}
                        sx={{
                          flex: 1,
                          '& .MuiInputBase-root': {
                            height: '32px',
                            fontSize: '0.8rem'
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                      <Tooltip title="Trim - Posiziona al frame specificato">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={handleTrimMedia}
                          disabled={disabled || trimFrame < 0}
                          sx={{
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            border: 1,
                            borderColor: 'info.main',
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'info.light', color: 'white' }
                          }}
                        >
                          <ContentCutIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Controlli Template */}
            {hasTemplates && (
              <Box sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default'
              }}>
                <Typography variant="subtitle2" sx={{
                  p: 1.5,
                  pb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'secondary.main',
                  fontWeight: 'bold'
                }}>
                  <BrushIcon fontSize="small" />
                  Template Grafici
                </Typography>

                {/* Template multipli per storie */}
                {selectedItem.type === 'STORY' && selectedItem.data?.templatesDetails && selectedItem.data.templatesDetails.length > 0 && (
                  <Box sx={{ px: 1.5, pb: 1.5 }}>
                    {selectedItem.data.templatesDetails.map((template, index) => (
                      <Accordion key={index} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            minHeight: '40px',
                            '& .MuiAccordionSummary-content': {
                              alignItems: 'center',
                              gap: 1
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'medium', flexGrow: 1 }}>
                            Template {index + 1}: {template.templateFile?.split('/').pop() || 'Senza nome'}
                          </Typography>
                          <Chip
                            icon={<LayersIcon fontSize="small" />}
                            label={`L${template.casparcgConfig?.layer || 'N/A'}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <Grid container spacing={0.5}>
                            <Grid item xs={2.4}>
                              <Tooltip title="Add">
                                <IconButton
                                  color="success"
                                  size="small"
                                  onClick={() => onTemplateControl && onTemplateControl('cgAdd', selectedItem, { templateIndex: index })}
                                  disabled={disabled}
                                  sx={{
                                    width: '100%',
                                    height: '28px',
                                    minHeight: '28px',
                                    border: 1,
                                    borderColor: 'success.main',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'success.light', color: 'white' }
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                            <Grid item xs={2.4}>
                              <Tooltip title="Play">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => onTemplateControl && onTemplateControl('cgPlay', selectedItem, { templateIndex: index })}
                                  disabled={disabled}
                                  sx={{
                                    width: '100%',
                                    height: '28px',
                                    minHeight: '28px',
                                    border: 1,
                                    borderColor: 'primary.main',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'primary.light', color: 'white' }
                                  }}
                                >
                                  <PlayArrowIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                            <Grid item xs={2.4}>
                              <Tooltip title="Update">
                                <IconButton
                                  color="info"
                                  size="small"
                                  onClick={() => onTemplateControl && onTemplateControl('cgUpdate', selectedItem, { templateIndex: index })}
                                  disabled={disabled}
                                  sx={{
                                    width: '100%',
                                    height: '28px',
                                    minHeight: '28px',
                                    border: 1,
                                    borderColor: 'info.main',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'info.light', color: 'white' }
                                  }}
                                >
                                  <UpdateIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                            <Grid item xs={2.4}>
                              <Tooltip title="Stop">
                                <IconButton
                                  color="warning"
                                  size="small"
                                  onClick={() => onTemplateControl && onTemplateControl('cgStop', selectedItem, { templateIndex: index })}
                                  disabled={disabled}
                                  sx={{
                                    width: '100%',
                                    height: '28px',
                                    minHeight: '28px',
                                    border: 1,
                                    borderColor: 'warning.main',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'warning.light', color: 'white' }
                                  }}
                                >
                                  <StopIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                            <Grid item xs={2.4}>
                              <Tooltip title="Clear">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => onTemplateControl && onTemplateControl('cgClear', selectedItem, { templateIndex: index })}
                                  disabled={disabled}
                                  sx={{
                                    width: '100%',
                                    height: '28px',
                                    minHeight: '28px',
                                    border: 1,
                                    borderColor: 'error.main',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'error.light', color: 'white' }
                                  }}
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}

                {/* Template singolo */}
                {(selectedItem.type === 'TEMPLATE' ||
                  (selectedItem.type === 'STORY' && selectedItem.data?.templateDetails && !selectedItem.data?.templatesDetails?.length)) && (
                  <Box sx={{ px: 1.5, pb: 1.5 }}>
                    <Grid container spacing={0.5}>
                      <Grid item xs={2.4}>
                        <Tooltip title="Add">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => onTemplateControl && onTemplateControl('cgAdd', selectedItem)}
                            disabled={disabled}
                            sx={{
                              width: '100%',
                              height: '28px',
                              minHeight: '28px',
                              border: 1,
                              borderColor: 'success.main',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'success.light', color: 'white' }
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={2.4}>
                        <Tooltip title="Play">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => onTemplateControl && onTemplateControl('cgPlay', selectedItem)}
                            disabled={disabled}
                            sx={{
                              width: '100%',
                              height: '28px',
                              minHeight: '28px',
                              border: 1,
                              borderColor: 'primary.main',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'primary.light', color: 'white' }
                            }}
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={2.4}>
                        <Tooltip title="Update">
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => onTemplateControl && onTemplateControl('cgUpdate', selectedItem)}
                            disabled={disabled}
                            sx={{
                              width: '100%',
                              height: '28px',
                              minHeight: '28px',
                              border: 1,
                              borderColor: 'info.main',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'info.light', color: 'white' }
                            }}
                          >
                            <UpdateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={2.4}>
                        <Tooltip title="Stop">
                          <IconButton
                            color="warning"
                            size="small"
                            onClick={() => onTemplateControl && onTemplateControl('cgStop', selectedItem)}
                            disabled={disabled}
                            sx={{
                              width: '100%',
                              height: '28px',
                              minHeight: '28px',
                              border: 1,
                              borderColor: 'warning.main',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'warning.light', color: 'white' }
                            }}
                          >
                            <StopIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={2.4}>
                        <Tooltip title="Clear">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => onTemplateControl && onTemplateControl('cgClear', selectedItem)}
                            disabled={disabled}
                            sx={{
                              width: '100%',
                              height: '28px',
                              minHeight: '28px',
                              border: 1,
                              borderColor: 'error.main',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'error.light', color: 'white' }
                            }}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            )}

            {/* Messaggio se nessun controllo disponibile */}
            {!hasMedia && !hasTemplates && (
              <Box sx={{
                textAlign: 'center',
                py: 4,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Seleziona un elemento per visualizzare i controlli
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Tab Dettagli */}
        {activeTab === 1 && (
          <Stack spacing={1.5}>
            {selectedItem ? (
              <>
                {/* Header elemento */}
                <Box sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  bgcolor: 'background.default'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getItemIcon(selectedItem.type)}
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                      {selectedItem.name || selectedItem.data?.customName || 'Elemento senza nome'}
                    </Typography>
                    <Chip
                      label={selectedItem.type}
                      size="small"
                      color={getItemColor(selectedItem.type)}
                    />
                  </Box>

                  {/* Dettagli specifici per tipo */}
                  {selectedItem.type === 'STORY' && (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {selectedItem.data?.mediaDetails && (
                        <Typography variant="body2" color="text.secondary">
                          📹 Media: {selectedItem.data.mediaDetails.clipPath?.split('/').pop()}
                        </Typography>
                      )}
                      {selectedItem.data?.templatesDetails && selectedItem.data.templatesDetails.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                            🎨 Template ({selectedItem.data.templatesDetails.length}):
                          </Typography>
                          {selectedItem.data.templatesDetails.map((template, index) => (
                            <Typography key={index} variant="body2" color="text.secondary" sx={{ ml: 2, fontSize: '0.8rem' }}>
                              • {template.templateFile?.split('/').pop()} (L{template.casparcgConfig?.layer})
                            </Typography>
                          ))}
                        </Box>
                      )}
                      {selectedItem.data?.templateDetails && (
                        <Typography variant="body2" color="text.secondary">
                          🎨 Template: {selectedItem.data.templateDetails.templateFile?.split('/').pop()}
                        </Typography>
                      )}
                    </Stack>
                  )}

                  {selectedItem.type === 'MEDIA' && (
                    <Typography variant="body2" color="text.secondary">
                      📹 File: {selectedItem.data?.clipPath?.split('/').pop()}
                    </Typography>
                  )}

                  {selectedItem.type === 'TEMPLATE' && (
                    <Typography variant="body2" color="text.secondary">
                      🎨 File: {selectedItem.data?.templateFile?.split('/').pop()}
                    </Typography>
                  )}

                  {selectedItem.data?.notes && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                        📝 Note:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {selectedItem.data.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Info aggiuntive */}
                {remainingTime && (
                  <Box sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                    bgcolor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Tempo rimanente: {remainingTime}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{
                textAlign: 'center',
                py: 4,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Nessun elemento selezionato
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Tab Prossimi */}
        {activeTab === 2 && (
          <Stack spacing={1}>
            {nextItems.length > 0 ? (
              nextItems.map((item, index) => (
                <Box
                  key={item.id}
                  onClick={() => onSelectItem && onSelectItem(item)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                    bgcolor: 'background.default',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                      transform: 'translateY(-1px)',
                      boxShadow: 1
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Badge badgeContent={index + 1} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}>
                      {getItemIcon(item.type)}
                    </Badge>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }} noWrap>
                        {item.name || item.data?.customName || 'Senza nome'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={item.type}
                          size="small"
                          color={getItemColor(item.type)}
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {item.data?.startTime || '00:00:00'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{
                textAlign: 'center',
                py: 4,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Nessun elemento successivo
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default ExtendedControls;
