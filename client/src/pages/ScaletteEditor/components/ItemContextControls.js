import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import useOscData from '../hooks/useOscData';

/**
 * Componente per le informazioni contestuali dell'item selezionato
 * Pannello informativo con timing e progressione del media in tempo reale
 *
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.selectedItem - Item selezionato
 * @param {Object} props.playbackStatus - Stato di riproduzione
 * @param {number} props.previewChannel - Canale di preview per i dati OSC
 * @param {number} props.previewLayer - Layer di preview per i dati OSC
 * @param {Function} props.onUpdateItem - Callback per aggiornare l'item selezionato
 * @returns {JSX.Element} - Componente React
 */
const ItemContextControls = ({
  selectedItem,
  playbackStatus = 'STOPPED',
  previewChannel = 3,
  previewLayer = 1,
  onUpdateItem
}) => {
  // Ottieni i dati OSC in tempo reale
  const oscData = useOscData(previewChannel, previewLayer);

  // Verifica se c'è un item selezionato
  const hasSelectedItem = !!selectedItem;

  // Determina il tipo di item
  const itemType = selectedItem?.type || '';
  const isMedia = itemType === 'MEDIA';

  // Usa i dati OSC per le informazioni di timing - CORRETTI
  const currentTimecode = oscData?.timecode || '00:00:00:00';
  const totalDuration = oscData?.duration || '00:00:00:00'; // Usa duration dal hook, non totalDuration
  const remainingTime = oscData?.remainingTime || '00:00:00:00'; // Calcolata dal hook
  const progressValue = oscData?.progress || 0; // Percentuale calcolata dal hook

  // Determina lo stato di playback più accurato basandosi sui dati OSC
  const actualPlaybackStatus = (() => {
    if (!oscData?.isConnected) return 'STOPPED';
    if (currentTimecode === '00:00:00:00') return 'STOPPED';
    if (oscData?.paused === true) return 'PAUSED';
    if (currentTimecode !== '00:00:00:00' && progressValue > 0) return 'PLAYING';
    return playbackStatus; // Fallback al valore originale
  })();

  // Logica di riproduzione e validazione dati OSC
  const isPlaying = actualPlaybackStatus === 'PLAYING';
  const hasValidOscData = oscData?.isConnected && (currentTimecode !== '00:00:00:00' || progressValue > 0);

  // Mostra la barra di progresso prominente quando in riproduzione
  // Anche con progresso simbolico (durata sconosciuta) o timecode valido
  const showProgressBar = isPlaying && hasValidOscData && (progressValue > 0 || currentTimecode !== '00:00:00:00');

  // Mostra le sezioni di timing per elementi media o quando abbiamo dati OSC validi
  const showTimingSections = isMedia || hasValidOscData;

  // Funzioni per gestire l'impostazione dei punti IN/OUT
  const handleSetInPoint = () => {
    if (!selectedItem || !onUpdateItem || !currentTimecode || currentTimecode === '00:00:00:00') {
      console.warn('[ItemContextControls] Impossibile impostare punto IN: dati non validi', {
        hasSelectedItem: !!selectedItem,
        hasOnUpdateItem: !!onUpdateItem,
        currentTimecode
      });
      return;
    }

    console.log('[ItemContextControls] Impostazione punto IN:', {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      currentTimecode,
      currentData: selectedItem.data
    });

    // Aggiorna l'item con il nuovo punto IN
    const updates = {
      ...selectedItem.data,
      inPoint: currentTimecode,
      // Se esiste la struttura timing, aggiorna anche quella
      timing: selectedItem.data.timing ? {
        ...selectedItem.data.timing,
        inPoint: currentTimecode
      } : undefined
    };

    console.log('[ItemContextControls] Dati aggiornati per punto IN:', updates);
    onUpdateItem(selectedItem.id, updates);
    console.log(`[ItemContextControls] Punto IN impostato a: ${currentTimecode} per item ${selectedItem.id}`);
  };

  const handleSetOutPoint = () => {
    if (!selectedItem || !onUpdateItem || !currentTimecode || currentTimecode === '00:00:00:00') {
      console.warn('[ItemContextControls] Impossibile impostare punto OUT: dati non validi', {
        hasSelectedItem: !!selectedItem,
        hasOnUpdateItem: !!onUpdateItem,
        currentTimecode
      });
      return;
    }

    console.log('[ItemContextControls] Impostazione punto OUT:', {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      currentTimecode,
      currentData: selectedItem.data
    });

    // Aggiorna l'item con il nuovo punto OUT
    const updates = {
      ...selectedItem.data,
      outPoint: currentTimecode,
      // Se esiste la struttura timing, aggiorna anche quella
      timing: selectedItem.data.timing ? {
        ...selectedItem.data.timing,
        outPoint: currentTimecode
      } : undefined
    };

    console.log('[ItemContextControls] Dati aggiornati per punto OUT:', updates);
    onUpdateItem(selectedItem.id, updates);
    console.log(`[ItemContextControls] Punto OUT impostato a: ${currentTimecode} per item ${selectedItem.id}`);
  };



  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header con titolo dell'item */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 1,
        pb: 0.5,
        px: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0
      }}>
        <Typography variant="body2" fontWeight="medium" noWrap sx={{ fontSize: '0.8rem' }}>
          {hasSelectedItem ? (selectedItem.data?.customName || selectedItem.name || 'Item Selezionato') : 'Nessun item selezionato'}
        </Typography>
        <Chip
          label={actualPlaybackStatus}
          size="small"
          sx={{
            height: '20px',
            fontSize: '0.65rem',
            '& .MuiChip-label': {
              px: 0.5
            }
          }}
          color={
            actualPlaybackStatus === 'PLAYING' ? 'success' :
            actualPlaybackStatus === 'PAUSED' ? 'warning' :
            'default'
          }
        />
      </Box>

      {/* Container scrollabile per il contenuto */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        px: 1,
        pb: 1,
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '2px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255,255,255,0.5)',
        },
      }}>
        {hasSelectedItem ? (
          <>
          {/* Barra di progresso prominente - solo quando in riproduzione */}
          {showProgressBar && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 'medium', fontSize: '0.7rem' }}>
                ⏱️ Progressione in Tempo Reale
              </Typography>
              <Box sx={{
                p: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.main',
                boxShadow: '0 2px 6px rgba(76, 175, 80, 0.15)'
              }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.max(0, progressValue))}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 0.5,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'success.main',
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)',
                      transition: 'transform 0.1s ease-in-out'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'success.main', fontSize: '0.7rem' }}>
                    {currentTimecode}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'success.main', fontSize: '0.8rem' }}>
                    {Math.round(progressValue)}%
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    {totalDuration}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Timing dettagliato con dati OSC */}
          {showTimingSections && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 'medium', fontSize: '0.7rem' }}>
                🕐 Timing Dettagliato (OSC)
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 0.8,
                p: 1,
                bgcolor: 'background.default',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2, fontSize: '0.65rem' }}>
                    Tempo Corrente
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main', fontSize: '0.75rem' }}>
                    {currentTimecode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2, fontSize: '0.65rem' }}>
                    Tempo Rimanente
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'warning.main', fontSize: '0.75rem' }}>
                    {remainingTime}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2, fontSize: '0.65rem' }}>
                    Durata Totale
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.75rem' }}>
                    {totalDuration}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2, fontSize: '0.65rem' }}>
                    Stato
                  </Typography>
                  <Typography variant="caption" sx={{
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    color: actualPlaybackStatus === 'PLAYING' ? 'success.main' :
                           actualPlaybackStatus === 'PAUSED' ? 'warning.main' : 'text.secondary'
                  }}>
                    {actualPlaybackStatus}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Punti IN/OUT con controlli interattivi */}
          {showTimingSections && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 'medium', fontSize: '0.7rem' }}>
                📍 Punti IN/OUT
              </Typography>
              <Box sx={{
                p: 1,
                bgcolor: 'background.default',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                {/* Punto IN */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Punto IN
                    </Typography>
                    {onUpdateItem && currentTimecode !== '00:00:00:00' && (
                      <Tooltip title="Imposta punto IN al timecode corrente">
                        <IconButton
                          size="small"
                          onClick={handleSetInPoint}
                          sx={{
                            p: 0.3,
                            color: 'info.main',
                            '&:hover': { bgcolor: 'info.main', color: 'white' }
                          }}
                        >
                          <SkipPreviousIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: 'info.main',
                    fontSize: '0.75rem',
                    display: 'block'
                  }}>
                    {selectedItem.data?.timing?.inPoint || selectedItem.data?.inPoint || '00:00:00:00'}
                  </Typography>
                </Box>

                {/* Punto OUT */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Punto OUT
                    </Typography>
                    {onUpdateItem && currentTimecode !== '00:00:00:00' && (
                      <Tooltip title="Imposta punto OUT al timecode corrente">
                        <IconButton
                          size="small"
                          onClick={handleSetOutPoint}
                          sx={{
                            p: 0.3,
                            color: 'info.main',
                            '&:hover': { bgcolor: 'info.main', color: 'white' }
                          }}
                        >
                          <SkipNextIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: 'info.main',
                    fontSize: '0.75rem',
                    display: 'block'
                  }}>
                    {selectedItem.data?.timing?.outPoint || selectedItem.data?.outPoint || totalDuration}
                  </Typography>
                </Box>

                {/* Indicatore timecode corrente per riferimento */}
                {currentTimecode !== '00:00:00:00' && (
                  <Box sx={{
                    mt: 1,
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    textAlign: 'center'
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
                      Timecode Corrente
                    </Typography>
                    <Typography variant="caption" sx={{
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: 'primary.main',
                      fontSize: '0.7rem'
                    }}>
                      {currentTimecode}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </>
      ) : (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            textAlign: 'center',
            color: 'text.secondary'
          }}>
            <InfoIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              Seleziona un elemento dalla scaletta per visualizzare le informazioni dettagliate di timing
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ItemContextControls;
