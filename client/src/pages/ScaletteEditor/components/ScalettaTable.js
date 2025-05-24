import React from 'react';
import {
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Box, Tooltip, Badge, Typography
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ItemActionsCell from './ItemActionsCell';

// Stile CSS per la tabella
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
    },
  },
  tableCell: {
    borderBottom: '1px solid #3d3d3d',
    padding: '4px 8px',
    fontSize: '0.8rem',
  },
  tableCellHeader: {
    borderBottom: '1px solid #3d3d3d',
    padding: '8px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
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
  visibleColumns = ['index', 'startTime', 'duration', 'location', 'name', 'file', 'notes', 'actions']
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
              <TableRow
                key={item.id}
                hover
                sx={{
                  ...tableStyles.tableRow,
                  cursor: canEdit ? 'move' : 'pointer',
                  backgroundColor: selectedItemIndex === index
                    ? 'rgba(76, 175, 80, 0.3)' // Verde per l'elemento selezionato
                    : selectedItemIndex !== -1 && index > selectedItemIndex
                      ? 'rgba(255, 152, 0, 0.15)' // Arancione chiaro per gli elementi successivi
                      : dragOverIndex === index
                        ? 'rgba(25, 118, 210, 0.12)' // Blu per il drag over
                        : 'inherit'
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
                {visibleColumns.includes('index') && (
                  <TableCell sx={tableStyles.tableCell}>{index + 1}</TableCell>
                )}
                {visibleColumns.includes('startTime') && (
                  <TableCell sx={tableStyles.tableCell}>{item.data?.timing?.startTime || '00:00:00'}</TableCell>
                )}
                {visibleColumns.includes('duration') && (
                  <TableCell sx={tableStyles.tableCell}>{item.data?.timing?.duration || '00:00:00'}</TableCell>
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
                  <TableCell sx={tableStyles.tableCell}>{item.data?.customName || 'Senza nome'}</TableCell>
                )}
                {visibleColumns.includes('file') && (
                  <TableCell sx={tableStyles.tableCell}>
                    {item.type === 'MEDIA' ? (
                      item.data?.clip
                    ) : item.type === 'TEMPLATE' ? (
                      item.data?.template
                    ) : item.type === 'STORY' ? (
                      <Box>
                        {item.data?.mediaDetails?.clipPath && (
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            Media: {item.data.mediaDetails.clipPath.split('/').pop()}
                          </Typography>
                        )}
                        {item.data?.templatesDetails && item.data.templatesDetails.length > 0 ? (
                          item.data.templatesDetails.map((template, idx) => (
                            <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem' }}>
                              Template {idx + 1}: {template.templateFile.split('/').pop()}
                            </Typography>
                          ))
                        ) : item.data?.templateDetails?.templateFile && (
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            Template: {item.data.templateDetails.templateFile.split('/').pop()}
                          </Typography>
                        )}
                      </Box>
                    ) : 'N/A'}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rimossi i bottoni duplicati */}
    </>
  );
};

export default ScalettaTable;
