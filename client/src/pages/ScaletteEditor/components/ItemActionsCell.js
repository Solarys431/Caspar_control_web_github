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
              color="primary"
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
                  color="success"
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Pausa">
                <IconButton
                  size="small"
                  onClick={() => onPauseItem(item)}
                  color="warning"
                >
                  <PauseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Stop">
                <IconButton
                  size="small"
                  onClick={() => onStopItem(item)}
                  color="error"
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
                  color="success"
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Stop">
                <IconButton
                  size="small"
                  onClick={() => onStopTemplate(item)}
                  color="error"
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
                  color="success"
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Stop">
                <IconButton
                  size="small"
                  onClick={() => onStopStory(item)}
                  color="error"
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
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ItemActionsCell;
