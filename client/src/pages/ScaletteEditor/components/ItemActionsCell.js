/**
 * Componente per la cella delle azioni nella tabella degli elementi della scaletta
 * Estrae la logica complessa di rendering condizionale dei pulsanti di azione
 */
import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// RICHIESTA 2: Tema broadcast professionale
import { broadcastColors, broadcastAnimations } from '../../../styles/broadcastTheme';

/**
 * Componente per la cella delle azioni nella tabella degli elementi della scaletta
 *
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.item - Elemento della scaletta
 * @param {boolean} props.canEdit - Se l'utente può modificare l'elemento
 * @param {Object} props.editingStatusByItemId - Stato di modifica degli elementi
 * @param {Function} props.onEditItem - Funzione per modificare un elemento
 * @param {Function} props.onPlayItem - Funzione per riprodurre un elemento
 * @param {Function} props.onPauseItem - Funzione per mettere in pausa un elemento
 * @param {Function} props.onStopItem - Funzione per fermare un elemento
 * @param {Function} props.onRemoveItem - Funzione per rimuovere un elemento
 * @param {Function} props.onPlayTemplate - Funzione per riprodurre un template
 * @param {Function} props.onStopTemplate - Funzione per fermare un template
 * @param {Function} props.onRemoveTemplate - Funzione per rimuovere un template
 * @param {Function} props.onPlayStory - Funzione per riprodurre una storia
 * @param {Function} props.onStopStory - Funzione per fermare una storia
 * @param {boolean} props.isPlayoutOperator - Se l'utente è un operatore di playout
 * @returns {JSX.Element} - Componente React
 */
const ItemActionsCell = ({
  item,
  canEdit,
  editingStatusByItemId,
  onEditItem,
  onPlayItem,
  onPauseItem,
  onStopItem,
  onRemoveItem,
  onPlayTemplate,
  onStopTemplate,
  onRemoveTemplate,
  onPlayStory,
  onStopStory,
  isPlayoutOperator
}) => {
  // Verifica se l'elemento è in fase di modifica
  const isBeingEdited = editingStatusByItemId && editingStatusByItemId[item.id];

  // Determina se mostrare i controlli di playout
  const showPlayoutControls = isPlayoutOperator || canEdit;

  // Rendering condizionale in base al tipo di elemento
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      {/* Pulsante di modifica */}
      {canEdit && (
        <Tooltip title={isBeingEdited ? `In modifica da ${editingStatusByItemId[item.id].userName}` : "Modifica"}>
          <span>
            <IconButton
              size="small"
              onClick={() => onEditItem(item)}
              disabled={!!isBeingEdited}
              sx={{
                background: `linear-gradient(135deg, ${broadcastColors.primary.main} 0%, ${broadcastColors.primary.dark} 100%)`,
                color: broadcastColors.text.primary,
                border: `1px solid ${broadcastColors.primary.main}`,
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${broadcastColors.primary.light} 0%, ${broadcastColors.primary.main} 100%)`,
                  transform: 'scale(1.05)',
                  boxShadow: `0 0 8px ${broadcastColors.primary.main}60`
                },
                '&:disabled': {
                  background: broadcastColors.background.secondary,
                  color: broadcastColors.text.disabled,
                  border: `1px solid ${broadcastColors.border.primary}`
                }
              }}
            >
              {isBeingEdited ? <CircularProgress size={20} /> : <EditIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Controlli specifici per tipo di elemento */}
      {showPlayoutControls && (
        <>
          {item.type === 'MEDIA' && (
            <>
              <Tooltip title="Play">
                <IconButton
                  size="small"
                  onClick={() => onPlayItem(item)}
                  sx={{
                    background: `linear-gradient(135deg, ${broadcastColors.status.ready} 0%, #388e3c 100%)`,
                    color: broadcastColors.text.primary,
                    border: `1px solid ${broadcastColors.status.ready}`,
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${broadcastColors.status.ready} 0%, #2e7d32 100%)`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 0 8px ${broadcastColors.status.ready}60`
                    }
                  }}
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Pausa">
                <IconButton
                  size="small"
                  onClick={() => onPauseItem(item)}
                  sx={{
                    background: `linear-gradient(135deg, ${broadcastColors.status.warning} 0%, #e6a100 100%)`,
                    color: broadcastColors.text.primary,
                    border: `1px solid ${broadcastColors.status.warning}`,
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${broadcastColors.status.warning} 0%, #cc8f00 100%)`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 0 8px ${broadcastColors.status.warning}60`
                    }
                  }}
                >
                  <PauseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Stop">
                <IconButton
                  size="small"
                  onClick={() => onStopItem(item)}
                  sx={{
                    background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #c62828 100%)`,
                    color: broadcastColors.text.primary,
                    border: `1px solid ${broadcastColors.status.error}`,
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #b71c1c 100%)`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 0 8px ${broadcastColors.status.error}60`
                    }
                  }}
                >
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          {item.type === 'TEMPLATE' && (
            <>
              <Tooltip title="Play">
                <IconButton
                  size="small"
                  onClick={() => onPlayTemplate(item)}
                  sx={{
                    background: `linear-gradient(135deg, ${broadcastColors.status.ready} 0%, #388e3c 100%)`,
                    color: broadcastColors.text.primary,
                    border: `1px solid ${broadcastColors.status.ready}`,
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${broadcastColors.status.ready} 0%, #2e7d32 100%)`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 0 8px ${broadcastColors.status.ready}60`
                    }
                  }}
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Stop">
                <IconButton
                  size="small"
                  onClick={() => onStopTemplate(item)}
                  sx={{
                    background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #c62828 100%)`,
                    color: broadcastColors.text.primary,
                    border: `1px solid ${broadcastColors.status.error}`,
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #b71c1c 100%)`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 0 8px ${broadcastColors.status.error}60`
                    }
                  }}
                >
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          {item.type === 'STORY' && (
            <>
              <Tooltip title="Play">
                <IconButton
                  size="small"
                  onClick={() => onPlayStory(item)}
                  sx={{
                    background: `linear-gradient(135deg, ${broadcastColors.status.ready} 0%, #388e3c 100%)`,
                    color: broadcastColors.text.primary,
                    border: `1px solid ${broadcastColors.status.ready}`,
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${broadcastColors.status.ready} 0%, #2e7d32 100%)`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 0 8px ${broadcastColors.status.ready}60`
                    }
                  }}
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Stop">
                <IconButton
                  size="small"
                  onClick={() => onStopStory(item)}
                  sx={{
                    background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #c62828 100%)`,
                    color: broadcastColors.text.primary,
                    border: `1px solid ${broadcastColors.status.error}`,
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #b71c1c 100%)`,
                      transform: 'scale(1.05)',
                      boxShadow: `0 0 8px ${broadcastColors.status.error}60`
                    }
                  }}
                >
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </>
      )}

      {/* Pulsante di eliminazione */}
      {canEdit && (
        <Tooltip title="Elimina">
          <IconButton
            size="small"
            onClick={() => {
              if (item.type === 'TEMPLATE') {
                onRemoveTemplate(item);
              } else {
                onRemoveItem(item.id);
              }
            }}
            disabled={!!isBeingEdited}
            sx={{
              background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #c62828 100%)`,
              color: broadcastColors.text.primary,
              border: `1px solid ${broadcastColors.status.error}`,
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #b71c1c 100%)`,
                transform: 'scale(1.05)',
                boxShadow: `0 0 8px ${broadcastColors.status.error}60`
              },
              '&:disabled': {
                background: broadcastColors.background.secondary,
                color: broadcastColors.text.disabled,
                border: `1px solid ${broadcastColors.border.primary}`
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ItemActionsCell;
