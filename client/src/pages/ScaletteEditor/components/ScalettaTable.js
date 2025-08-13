import React from 'react';
import {
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Box, Tooltip, Badge, Typography
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ItemActionsCell from './ItemActionsCell';
import ItemTypeIcon from './ItemTypeIcon';
import StatusBadge, { useItemStatus } from './StatusBadge';
import StoryContentTooltip from './StoryContentTooltip';
import { ItemSelectionCheckbox } from './SelectionCheckbox';

/**
 * Componente per una singola riga della tabella
 */
const ScalettaTableRow = React.memo(({
  item,
  index,
  selectedItemIndex,
  dragOverIndex,
  canEdit,
  editingStatusByItemId,
  visibleColumns,
  selectedItemsSet,
  onSelectItem,
  onItemSelectionChange,
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
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  playbackSync // RICHIESTA 1: Hook per sincronizzazione stato riproduzione
}) => {
  const itemStatus = useItemStatus(item, editingStatusByItemId);

  // RICHIESTA 1: Determina lo stato di riproduzione dell'elemento
  const isPlaying = playbackSync ? playbackSync.isItemPlaying(item.id) : false;
  const isNext = playbackSync ? playbackSync.isItemNext(item.id) : false;
  const isLive = playbackSync ? playbackSync.isItemLive(item.id) : false;
  const playbackStatus = playbackSync ? playbackSync.getPlaybackStatus(item.id) : null;

  // RICHIESTA 1: Determina se l'elemento può essere modificato (non in onda)
  const canEditItem = canEdit && !isLive && !isPlaying;

  return (
    <TableRow
      key={item.id}
      hover
      sx={{
        ...tableStyles.tableRow,
        cursor: canEditItem ? 'move' : 'pointer',
        // RICHIESTA 1: Colori basati sullo stato di riproduzione
        backgroundColor: isLive || isPlaying
          ? 'rgba(244, 67, 54, 0.2)' // Rosso per elementi ON AIR/PLAYING
          : isNext
            ? 'rgba(255, 193, 7, 0.2)' // Giallo per elemento NEXT
            : selectedItemIndex === index
              ? 'rgba(76, 175, 80, 0.3)' // Verde per l'elemento selezionato
              : selectedItemIndex !== -1 && index > selectedItemIndex
                ? 'rgba(255, 152, 0, 0.15)' // Arancione chiaro per gli elementi successivi
                : dragOverIndex === index
                  ? 'rgba(25, 118, 210, 0.12)' // Blu per il drag over
                  : 'inherit',
        // RICHIESTA 1: Bordo per elementi in onda
        border: isLive || isPlaying ? '2px solid #f44336' : 'none',
        // RICHIESTA 1: Opacità ridotta se non modificabile
        opacity: (!canEditItem && (isLive || isPlaying)) ? 0.8 : 1
      }}
      className={dragOverIndex === index ? 'drag-over' : 'drag-item'}
      draggable={canEdit}
      onClick={() => {
        console.log("Click sulla riga della tabella, indice:", index);
        onSelectItem(index);
      }}
      onDragStart={canEdit ? (e) => onDragStart(e, index) : null}
      onDragOver={canEdit ? (e) => onDragOver(e, index) : null}
      onDragEnd={canEdit ? onDragEnd : null}
      onDrop={canEdit ? (e) => onDrop(e, index) : null}
    >
      {/* Checkbox selezione elemento */}
      <TableCell sx={tableStyles.tableCell}>
        <ItemSelectionCheckbox
          checked={selectedItemsSet.has(item.id)}
          onChange={(checked) => onItemSelectionChange && onItemSelectionChange(item.id, checked)}
          itemId={item.id}
          itemName={item.data?.customName || item.name}
          size="small"
        />
      </TableCell>

      {visibleColumns.includes('index') && (
        <TableCell sx={tableStyles.tableCell}>{index + 1}</TableCell>
      )}
      {visibleColumns.includes('startTime') && (
        <TableCell sx={tableStyles.tableCell}>{item.data?.timing?.startTime || '00:00:00'}</TableCell>
      )}
      {visibleColumns.includes('duration') && (
        <TableCell sx={tableStyles.tableCell}>{item.data?.timing?.duration || '-'}</TableCell>
      )}
      {visibleColumns.includes('location') && (
        <TableCell sx={tableStyles.tableCell}>
          {item.data?.location ||
           (item.data?.casparcgConfig ?
            `CH${item.data?.casparcgConfig?.channel}-L${item.data?.casparcgConfig?.layer}` :
            'N/A')}
        </TableCell>
      )}
      {visibleColumns.includes('name') && (
        <TableCell sx={tableStyles.enhancedNameCell}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Icona tipo elemento */}
            <ItemTypeIcon
              type={item.type}
              size="small"
              showLabel={false}
            />

            {/* RICHIESTA 1: Indicatori di stato riproduzione */}
            {(isLive || isPlaying) && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f44336',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                    '100%': { opacity: 1 }
                  }
                }}
              >
                ON AIR
              </Box>
            )}

            {isNext && !isPlaying && !isLive && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}
              >
                NEXT
              </Box>
            )}

            {/* Nome con tooltip per STORY */}
            {item.type === 'STORY' && item.data?.content ? (
              <StoryContentTooltip
                content={item.data.content}
                title={item.data?.customName || item.name}
                item={item}
                onClick={() => canEditItem ? onEditItem(item) : null}
              >
                <Typography variant="body2" sx={{
                  fontWeight: 500,
                  cursor: canEditItem ? 'pointer' : 'default',
                  color: (!canEditItem && (isLive || isPlaying)) ? 'text.disabled' : 'inherit',
                  '&:hover': canEditItem ? {
                    color: 'warning.main',
                    textDecoration: 'underline'
                  } : {}
                }}
                title={(!canEditItem && (isLive || isPlaying)) ? 'Elemento in onda - modifica non consentita' : ''}
                >
                  {item.data?.customName || 'Storia senza nome'}
                </Typography>
              </StoryContentTooltip>
            ) : (
              <Typography variant="body2" sx={{
                fontWeight: 500,
                color: (!canEditItem && (isLive || isPlaying)) ? 'text.disabled' : 'inherit'
              }}
              title={(!canEditItem && (isLive || isPlaying)) ? 'Elemento in onda - modifica non consentita' : ''}
              >
                {item.data?.customName || 'Senza nome'}
              </Typography>
            )}

            {/* Status badge */}
            <StatusBadge
              status={itemStatus}
              size="small"
              variant="minimal"
              showLabel={false}
            />
          </Box>
        </TableCell>
      )}
      {visibleColumns.includes('file') && (
        <TableCell sx={tableStyles.tableCell}>
          {item.type === 'MEDIA' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ItemTypeIcon type="MEDIA" size="small" variant="icon" showLabel={false} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {item.data?.clip || 'N/A'}
              </Typography>
            </Box>
          ) : item.type === 'TEMPLATE' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ItemTypeIcon type="TEMPLATE" size="small" variant="icon" showLabel={false} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {item.data?.template || item.data?.templateDetails?.templateFile?.split('/').pop() || 'N/A'}
              </Typography>
            </Box>
          ) : item.type === 'STORY' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {item.data?.mediaDetails?.clipPath && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ItemTypeIcon type="MEDIA" size="small" variant="icon" showLabel={false} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {item.data.mediaDetails.clipPath.split('/').pop()}
                  </Typography>
                </Box>
              )}
              {item.data?.templatesDetails && item.data.templatesDetails.length > 0 ? (
                item.data.templatesDetails.map((template, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ItemTypeIcon type="TEMPLATE" size="small" variant="icon" showLabel={false} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {template.templateFile.split('/').pop()}
                    </Typography>
                  </Box>
                ))
              ) : item.data?.templateDetails?.templateFile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ItemTypeIcon type="TEMPLATE" size="small" variant="icon" showLabel={false} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {item.data.templateDetails.templateFile.split('/').pop()}
                  </Typography>
                </Box>
              )}
              {!item.data?.mediaDetails?.clipPath &&
               !item.data?.templatesDetails?.length &&
               !item.data?.templateDetails?.templateFile && (
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.disabled', fontStyle: 'italic' }}>
                  Nessun file associato
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
              N/A
            </Typography>
          )}
        </TableCell>
      )}
      {visibleColumns.includes('notes') && (
        <TableCell sx={tableStyles.tableCell}>{item.data?.notes || ''}</TableCell>
      )}
      {visibleColumns.includes('outPoint') && (
        <TableCell sx={tableStyles.tableCell}>{item.data?.timing?.outPoint || '00:00:00'}</TableCell>
      )}
      {visibleColumns.includes('inPoint') && (
        <TableCell sx={tableStyles.tableCell}>{item.data?.timing?.inPoint || '00:00:00'}</TableCell>
      )}
      {visibleColumns.includes('actions') && (
        <TableCell sx={tableStyles.tableCell}>
        {/* Mostra l'indicatore di modifica se l'elemento è in modifica da un altro utente */}
        {editingStatusByItemId[item.id] && (
          <Tooltip title={`In modifica da ${editingStatusByItemId[item.id].userName}`}>
            <Badge color="warning" variant="dot">
              <PersonIcon fontSize="small" />
            </Badge>
          </Tooltip>
        )}

        {/* Utilizziamo il nuovo componente ItemActionsCell */}
        <ItemActionsCell
          item={item}
          canEdit={canEdit}
          editingStatusByItemId={editingStatusByItemId}
          onEditItem={onEditItem}
          onPlayItem={onPlayItem}
          onPauseItem={onPauseItem}
          onStopItem={onStopItem}
          onRemoveItem={onRemoveItem}
          onPlayTemplate={onPlayTemplate}
          onStopTemplate={onStopTemplate}
          onRemoveTemplate={onRemoveTemplate}
          onPlayStory={onPlayStory}
          onStopStory={onStopStory}
          isPlayoutOperator={true}
        />
      </TableCell>
      )}
    </TableRow>
  );
});

// Stile CSS per la tabella con miglioramenti estetici
const tableStyles = {
  stickyHeader: {
    backgroundColor: '#1e1e1e',
    color: 'white',
    fontWeight: 'bold',
  },
  tableRow: {
    '&:nth-of-type(odd)': {
      backgroundColor: '#2d2d2d',
    },
    '&:hover': {
      backgroundColor: '#3d3d3d',
      transform: 'translateY(-1px)',
      transition: 'all 0.2s ease-in-out',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    },
    transition: 'all 0.2s ease-in-out',
  },
  tableCell: {
    borderBottom: '1px solid #3d3d3d',
    padding: '6px 12px',
    fontSize: '0.85rem',
    verticalAlign: 'middle',
  },
  tableCellHeader: {
    borderBottom: '1px solid #3d3d3d',
    padding: '12px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  enhancedNameCell: {
    borderBottom: '1px solid #3d3d3d',
    padding: '6px 12px',
    fontSize: '0.85rem',
    verticalAlign: 'middle',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
    },
  },
};

/**
 * Componente per la tabella degli elementi della scaletta
 *
 * @param {Object} props - Proprietà del componente
 * @param {Array} props.items - Elementi della scaletta
 * @param {number} props.selectedItemIndex - Indice dell'elemento selezionato
 * @param {number} props.dragOverIndex - Indice dell'elemento su cui si sta trascinando
 * @param {Function} props.onSelectItem - Funzione per selezionare un elemento
 * @param {Function} props.onEditItem - Funzione per modificare un elemento
 * @param {Function} props.onPlayItem - Funzione per riprodurre un elemento
 * @param {Function} props.onPauseItem - Funzione per mettere in pausa un elemento
 * @param {Function} props.onStopItem - Funzione per fermare un elemento
 * @param {Function} props.onRemoveItem - Funzione per rimuovere un elemento
 * @param {Function} props.onPlayTemplate - Funzione per riprodurre un template
 * @param {Function} props.onStopTemplate - Funzione per fermare un template
 * @param {Function} props.onRemoveTemplate - Funzione per rimuovere un template
 * @param {Function} props.onDragStart - Funzione per iniziare il trascinamento
 * @param {Function} props.onDragOver - Funzione per il trascinamento sopra un elemento
 * @param {Function} props.onDragEnd - Funzione per terminare il trascinamento
 * @param {Function} props.onDrop - Funzione per il rilascio
 * @param {Function} props.onPlaySelected - Funzione per riprodurre l'elemento selezionato
 * @param {Function} props.onSendToRundown - Funzione per inviare la scaletta al rundown
 * @param {string} props.userRole - Ruolo dell'utente per la scaletta corrente
 * @param {Object} props.editingStatusByItemId - Stato di modifica degli elementi
 * @param {boolean} props.isPlayoutOperator - Se l'utente è un operatore di playout
 * @param {Array} props.visibleColumns - Array delle colonne visibili
 * @param {Set} props.selectedItemsSet - Set degli ID elementi selezionati
 * @param {Function} props.onItemSelectionChange - Callback per cambio selezione elemento
 * @returns {JSX.Element} - Componente React
 */
const ScalettaTable = ({
  items,
  selectedItemIndex,
  dragOverIndex,
  onSelectItem,
  onEditItem,
  onPlayItem,
  onPauseItem,
  onStopItem,
  onRemoveItem,
  onPlayTemplate,
  onStopTemplate,
  onRemoveTemplate,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  // onPlaySelected,
  // onSendToRundown,
  userRole = '',
  editingStatusByItemId = {},
  // isPlayoutOperator = false,
  onPlayStory,
  onStopStory,
  visibleColumns = ['index', 'startTime', 'duration', 'location', 'name', 'file', 'notes', 'actions'],
  selectedItemsSet = new Set(),
  onItemSelectionChange,
  playbackSync // RICHIESTA 1: Hook per sincronizzazione stato riproduzione
}) => {
  // Verifica se l'utente può modificare la scaletta
  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Verifica se l'utente può inviare la scaletta al rundown
  // const canSendToRundown = userRole === 'owner' || userRole === 'playout_operator' || isPlayoutOperator;
  return (
    <>
      {/* Tabella degli elementi della scaletta */}
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {/* Colonna checkbox selezione */}
              <TableCell width="40px" sx={tableStyles.tableCellHeader}>
                {/* Header vuoto per checkbox - il SelectAll è nel toolbar */}
              </TableCell>

              {visibleColumns.includes('index') && (
                <TableCell width="50px" sx={tableStyles.tableCellHeader}>#</TableCell>
              )}
              {visibleColumns.includes('startTime') && (
                <TableCell sx={tableStyles.tableCellHeader}>Start</TableCell>
              )}
              {visibleColumns.includes('duration') && (
                <TableCell sx={tableStyles.tableCellHeader}>Duration</TableCell>
              )}
              {visibleColumns.includes('location') && (
                <TableCell sx={tableStyles.tableCellHeader}>Location</TableCell>
              )}
              {visibleColumns.includes('name') && (
                <TableCell sx={tableStyles.tableCellHeader}>Nome</TableCell>
              )}
              {visibleColumns.includes('file') && (
                <TableCell sx={tableStyles.tableCellHeader}>File</TableCell>
              )}
              {visibleColumns.includes('notes') && (
                <TableCell sx={tableStyles.tableCellHeader}>Note</TableCell>
              )}
              {visibleColumns.includes('outPoint') && (
                <TableCell sx={tableStyles.tableCellHeader}>Out</TableCell>
              )}
              {visibleColumns.includes('inPoint') && (
                <TableCell sx={tableStyles.tableCellHeader}>In</TableCell>
              )}
              {visibleColumns.includes('actions') && (
                <TableCell width="100px" sx={tableStyles.tableCellHeader}>Azioni</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <ScalettaTableRow
                key={item.id}
                item={item}
                index={index}
                selectedItemIndex={selectedItemIndex}
                dragOverIndex={dragOverIndex}
                canEdit={canEdit}
                editingStatusByItemId={editingStatusByItemId}
                visibleColumns={visibleColumns}
                selectedItemsSet={selectedItemsSet}
                onSelectItem={onSelectItem}
                onItemSelectionChange={onItemSelectionChange}
                onEditItem={onEditItem}
                onPlayItem={onPlayItem}
                onPauseItem={onPauseItem}
                onStopItem={onStopItem}
                onRemoveItem={onRemoveItem}
                onPlayTemplate={onPlayTemplate}
                onStopTemplate={onStopTemplate}
                onRemoveTemplate={onRemoveTemplate}
                onPlayStory={onPlayStory}
                onStopStory={onStopStory}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
                playbackSync={playbackSync}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rimossi i bottoni duplicati */}
    </>
  );
};

export default ScalettaTable;
