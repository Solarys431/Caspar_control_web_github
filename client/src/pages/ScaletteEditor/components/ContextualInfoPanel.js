import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Grid,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import BrushIcon from '@mui/icons-material/Brush';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotesIcon from '@mui/icons-material/Notes';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

/**
 * Componente per il pannello di informazioni contestuali
 *
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.selectedItem - Item selezionato
 * @param {Array} props.nextItems - Prossimi elementi nella scaletta
 * @param {string} props.remainingTime - Tempo rimanente dell'item in preview
 * @param {Array} props.systemLogs - Log di sistema
 * @param {Object} props.oscData - Dati OSC in tempo reale
 * @param {Function} props.onSelectItem - Funzione per selezionare un item
 * @param {Function} props.onExpandPanel - Funzione per espandere il pannello
 * @returns {JSX.Element} - Componente React
 */
const ContextualInfoPanel = ({
  selectedItem,
  nextItems = [],
  remainingTime = '00:00:00',
  systemLogs = [],
  oscData = {},
  onSelectItem,
  onExpandPanel
}) => {
  // Stato per la tab attiva
  const [activeTab, setActiveTab] = useState(0);

  // Gestione del cambio di tab
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Verifica se c'è un item selezionato
  const hasSelectedItem = !!selectedItem;

  // Determina il tipo di item
  const itemType = selectedItem?.type || '';
  const isMedia = itemType === 'MEDIA';
  const isTemplate = itemType === 'TEMPLATE';

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header con titolo e controlli */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Info Contestuali
        </Typography>
        <Tooltip title="Espandi pannello">
          <IconButton size="small" onClick={onExpandPanel}>
            <FullscreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs di navigazione */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '40px' }}
      >
        <Tab icon={isMedia ? <MovieIcon fontSize="small" /> : <BrushIcon fontSize="small" />} label="Dettagli" sx={{ minHeight: '40px', py: 0 }} />
        <Tab icon={<SkipNextIcon fontSize="small" />} label="Prossimi" sx={{ minHeight: '40px', py: 0 }} />
        <Tab icon={<NotesIcon fontSize="small" />} label="Note" sx={{ minHeight: '40px', py: 0 }} />
        <Tab icon={<AccessTimeIcon fontSize="small" />} label="Timers" sx={{ minHeight: '40px', py: 0 }} />
        <Tab icon={<ErrorIcon fontSize="small" />} label="Log" sx={{ minHeight: '40px', py: 0 }} />
      </Tabs>

      {/* Contenuto delle tabs */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {/* Tab: Dettagli Media/Template */}
        {activeTab === 0 && (
          <Box>
            {!hasSelectedItem ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                Nessun item selezionato
              </Typography>
            ) : isMedia ? (
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dettagli Media
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">File:</Typography>
                  <Typography variant="body2" noWrap>{selectedItem.data?.clip || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Durata:</Typography>
                  <Typography variant="body2" fontFamily="monospace">{selectedItem.data?.duration || '00:00:00'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">In Point:</Typography>
                  <Typography variant="body2" fontFamily="monospace">{selectedItem.data?.inPoint || '00:00:00'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Out Point:</Typography>
                  <Typography variant="body2" fontFamily="monospace">{selectedItem.data?.outPoint || '00:00:00'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Canale:</Typography>
                  <Typography variant="body2">{selectedItem.data?.channel || '1'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Layer:</Typography>
                  <Typography variant="body2">{selectedItem.data?.layer || '10'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Loop:</Typography>
                  <Typography variant="body2">{selectedItem.data?.loop ? 'Sì' : 'No'}</Typography>
                </Grid>
              </Grid>
            ) : isTemplate ? (
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dettagli Template
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Template:</Typography>
                  <Typography variant="body2" noWrap>{selectedItem.data?.template || selectedItem.data?.templateDetails?.templateFile?.split('/').pop() || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Canale:</Typography>
                  <Typography variant="body2">{selectedItem.data?.channel || '1'}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Layer:</Typography>
                  <Typography variant="body2">{selectedItem.data?.layer || '20'}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">CG Layer:</Typography>
                  <Typography variant="body2">{selectedItem.data?.cgLayer || '1'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Play on Load:</Typography>
                  <Typography variant="body2">{selectedItem.data?.playOnLoad ? 'Sì' : 'No'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dati Template
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.default' }}>
                    <Typography variant="body2" fontFamily="monospace" sx={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedItem.data?.data || {}, null, 2)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                Tipo di item non supportato
              </Typography>
            )}
          </Box>
        )}

        {/* Tab: Prossimi Elementi */}
        {activeTab === 1 && (
          <List dense disablePadding>
            {nextItems.length === 0 ? (
              <ListItem>
                <ListItemText primary="Nessun elemento successivo" />
              </ListItem>
            ) : (
              nextItems.map((item, index) => (
                <ListItem
                  key={item.id}
                  button
                  onClick={() => onSelectItem(item)}
                  divider={index < nextItems.length - 1}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    {item.type === 'MEDIA' ? <MovieIcon fontSize="small" /> : <BrushIcon fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.data?.customName || item.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" fontFamily="monospace">
                          {item.data?.duration || '00:00:00'}
                        </Typography>
                        <Chip
                          label={item.type}
                          size="small"
                          color={item.type === 'MEDIA' ? 'primary' : 'secondary'}
                          sx={{ height: '16px', fontSize: '0.6rem' }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        )}

        {/* Tab: Note Produzione */}
        {activeTab === 2 && (
          <Box sx={{ p: 1 }}>
            {!hasSelectedItem ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Nessun item selezionato
              </Typography>
            ) : (
              <TextField
                label="Note"
                multiline
                rows={6}
                fullWidth
                value={selectedItem.data?.notes || ''}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                }}
              />
            )}
          </Box>
        )}

        {/* Tab: Timers Ausiliari */}
        {activeTab === 3 && (
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tempo Rimanente
            </Typography>
            <Typography variant="h4" fontFamily="monospace" color="primary" sx={{ textAlign: 'center', mb: 2 }}>
              {remainingTime}
            </Typography>

            <Divider sx={{ my: 1 }} />

            {/* Dati OSC in tempo reale */}
            <Typography variant="subtitle2" gutterBottom>
              Dati OSC Live
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Timecode:</Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {oscData.timecode || '00:00:00:00'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Frame:</Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {oscData.frame?.frame || '0'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Durata:</Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {oscData.length?.timecode || '00:00:00:00'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Stato:</Typography>
                <Chip
                  label={oscData.paused ? 'PAUSED' : (oscData.timecode !== '00:00:00:00' ? 'PLAYING' : 'STOPPED')}
                  size="small"
                  color={oscData.paused ? 'warning' : (oscData.timecode !== '00:00:00:00' ? 'success' : 'default')}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" gutterBottom>
              Conto alla Rovescia
            </Typography>
            <TextField
              label="Orario Target"
              type="time"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 1, // 1 secondo
              }}
              sx={{ mb: 1 }}
            />
          </Box>
        )}

        {/* Tab: Log di Sistema */}
        {activeTab === 4 && (
          <List dense disablePadding sx={{ maxHeight: '100%', overflow: 'auto' }}>
            {systemLogs.length === 0 ? (
              <ListItem>
                <ListItemText primary="Nessun log disponibile" />
              </ListItem>
            ) : (
              systemLogs.map((log, index) => (
                <ListItem
                  key={index}
                  divider={index < systemLogs.length - 1}
                  sx={{
                    bgcolor: log.type === 'error' ? 'error.dark' :
                            log.type === 'warning' ? 'warning.dark' : 'inherit',
                    opacity: 0.8
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    <InfoIcon fontSize="small" color={log.type === 'error' ? 'error' : log.type === 'warning' ? 'warning' : 'info'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={log.message}
                    secondary={log.timestamp}
                    primaryTypographyProps={{
                      variant: 'body2',
                      style: { whiteSpace: 'normal', wordBreak: 'break-word' }
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption'
                    }}
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ContextualInfoPanel;
