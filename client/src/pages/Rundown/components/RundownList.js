import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Checkbox,
  FormControlLabel,
  Divider,
  Button
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MovieIcon from '@mui/icons-material/Movie';
import BrushIcon from '@mui/icons-material/Brush';
import RepeatIcon from '@mui/icons-material/Repeat';
import LinkIcon from '@mui/icons-material/Link'; // Icona per il template annidato
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SourceIcon from '@mui/icons-material/Source'; // Icona per elementi esplosi
import FilterListIcon from '@mui/icons-material/FilterList'; // Icona per filtro
import { keyframes } from '@mui/system';
import { useRundown } from '../../../contexts/RundownContext';
import useRundownTimers from '../hooks/useRundownTimers';
import { format } from 'date-fns';


// Definizione dell'animazione di pulsazione per ON AIR
const pulseAnimationGreen = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(76, 175, 80, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
`;

// MODIFICA/AGGIUNTA START: Animazione per NEXT UP (opzionale)
const pulseAnimationYellow = keyframes`
  0% { opacity: 0.7; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.7; transform: scale(0.98); }
`;
// MODIFICA/AGGIUNTA END

/**
 * Componente per la visualizzazione della lista degli elementi del rundown.
 */
const RundownList = ({
  items,
  // playingItems, // playingItems non è più passato come prop, si usa item.isPlaying
  // currentTime, // Non direttamente usato qui, ma tramite useRundownTimers se necessario
  scheduledPlayback, // Usato per la visualizzazione della timeline delle ore
  connected,
  showNotification,
  dialogsState,
  // removeItem, // Prese da useRundown
  // updateItem // Prese da useRundown
}) => {
  const {
    playItem,
    stopItem,
    removeItem // Ora preso dal contesto
    // updateItem, // updateItem non è usato direttamente qui, ma in EditItemDialog
    // calculateEndTime non utilizzato
  } = useRundown();

  const {
    formatPlayingTime,
    calculateCountdown
  } = useRundownTimers();

  const {
    handleContextMenu,
    handleItemMenuOpen,
    handleEditItemDialogOpen,
    // handleLinkTemplateDialogOpen // Assicurati che sia definito in dialogsState se usato nel menu
  } = dialogsState;

   // MODIFICA/AGGIUNTA START: Logica per identificare l'elemento "NEXT"
  const playingItemIndex = items.findIndex(item => item.isPlaying);
  let nextItemId = null;
  if (playingItemIndex !== -1 && playingItemIndex < items.length - 1) {
    nextItemId = items[playingItemIndex + 1].id;
  }
  // MODIFICA/AGGIUNTA END

  // Stati per il filtro degli elementi esplosi
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    showExplodedItems: true,
    showRegularItems: true,
    filterByScaletta: null
  });

  // Estrai le scalette uniche dagli elementi esplosi
  const uniqueScalette = React.useMemo(() => {
    const scalette = new Set();
    items.forEach(item => {
      if (item.data && item.data.sourceInfo && item.data.sourceInfo.sourceScalettaName) {
        scalette.add(item.data.sourceInfo.sourceScalettaName);
      }
    });
    return Array.from(scalette);
  }, [items]);

  // Riproduzione di un item
  const handlePlayItem = async (item) => {
    if (!connected) {
        showNotification('Non connesso a CasparCG.', 'warning');
        return;
    }
    try {
      await playItem(item);
      showNotification(`Riproduzione avviata: ${item.data.customName || item.name}`, 'success');
    } catch (error) {
      showNotification(`Errore nella riproduzione: ${error.message}`, 'error');
    }
  };

  // Arresto di un item
  const handleStopItem = async (item) => {
    if (!connected) {
        showNotification('Non connesso a CasparCG.', 'warning');
        return;
    }
    try {
      await stopItem(item);
      showNotification(`Riproduzione fermata: ${item.data.customName || item.name}`, 'success');
    } catch (error) {
      showNotification(`Errore nell'arresto: ${error.message}`, 'error');
    }
  };

  // Apertura del menu di filtro
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  // Chiusura del menu di filtro
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };

  // Gestione del cambio di filtro
  const handleFilterChange = (filterType, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [filterType]: value
    }));
    handleFilterMenuClose();
  };

  // Gestione del filtro per scaletta
  const handleFilterByScaletta = (scalettaName) => {
    setFilterOptions(prev => ({
      ...prev,
      filterByScaletta: prev.filterByScaletta === scalettaName ? null : scalettaName
    }));
    handleFilterMenuClose();
  };

  // Filtra gli elementi in base alle opzioni di filtro
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // Verifica se l'elemento è esploso (ha sourceInfo)
      const isExploded = item.data && item.data.sourceInfo;

      // Filtra in base alle opzioni showExplodedItems e showRegularItems
      if (isExploded && !filterOptions.showExplodedItems) {
        return false;
      }

      if (!isExploded && !filterOptions.showRegularItems) {
        return false;
      }

      // Filtra in base alla scaletta selezionata
      if (filterOptions.filterByScaletta && isExploded) {
        return item.data.sourceInfo.sourceScalettaName === filterOptions.filterByScaletta;
      }

      return true;
    });
  }, [items, filterOptions]);

  return (
    <>
      {/* Menu contestuale */}
      <Menu
        open={Boolean(dialogsState.contextMenu)}
        onClose={dialogsState.handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          dialogsState.contextMenu
            ? { top: dialogsState.contextMenu.mouseY, left: dialogsState.contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
            handlePlayItem(dialogsState.contextMenu.item);
          }
          dialogsState.handleContextMenuClose();
        }}>
          <ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Riproduci" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
            handleStopItem(dialogsState.contextMenu.item);
          }
          dialogsState.handleContextMenuClose();
        }}>
          <ListItemIcon><StopIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Ferma" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
            dialogsState.handleEditItemDialogOpen(dialogsState.contextMenu.item.id);
          }
          dialogsState.handleContextMenuClose();
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Modifica" />
        </MenuItem>
        {/* Opzione "Collega Template" nel menu contestuale (se l'item è MEDIA) */}
        {dialogsState.contextMenu && dialogsState.contextMenu.item && dialogsState.contextMenu.item.type === 'MEDIA' && (
          <MenuItem onClick={() => {
            if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
              // Assicurati che handleLinkTemplateDialogOpen sia disponibile e chiamato correttamente
              if (dialogsState.handleLinkTemplateDialogOpen) {
                dialogsState.handleLinkTemplateDialogOpen(dialogsState.contextMenu.item.id);
              } else {
                console.warn("handleLinkTemplateDialogOpen non è definito in dialogsState");
                showNotification("Funzione collega template non disponibile.", "warning");
              }
            }
            dialogsState.handleContextMenuClose();
          }}>
            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Collega/Modifica Template Annidato" />
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
            removeItem(dialogsState.contextMenu.item.id); // Usa la funzione dal context
            showNotification('Elemento rimosso dal rundown', 'success');
          }
          dialogsState.handleContextMenuClose();
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Rimuovi" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* Menu dell'elemento (pulsante con 3 puntini) */}
      <Menu
        anchorEl={dialogsState.itemMenuAnchorEl}
        open={Boolean(dialogsState.itemMenuAnchorEl)}
        onClose={dialogsState.handleItemMenuClose}
      >
        <MenuItem onClick={() => {
          const item = items.find(it => it.id === dialogsState.selectedItemId);
          if (item) handlePlayItem(item);
          dialogsState.handleItemMenuClose();
        }}>
          <ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Riproduci" />
        </MenuItem>
        <MenuItem onClick={() => {
          const item = items.find(it => it.id === dialogsState.selectedItemId);
          if (item) handleStopItem(item);
          dialogsState.handleItemMenuClose();
        }}>
          <ListItemIcon><StopIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Ferma" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (dialogsState.selectedItemId) {
            dialogsState.handleEditItemDialogOpen(dialogsState.selectedItemId);
          }
          dialogsState.handleItemMenuClose();
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Modifica" />
        </MenuItem>
        {/* Opzione "Collega Template" nel menu dell'item (se l'item è MEDIA) */}
        {dialogsState.selectedItemId && items.find(it => it.id === dialogsState.selectedItemId)?.type === 'MEDIA' && (
          <MenuItem onClick={() => {
            if (dialogsState.selectedItemId) {
               if (dialogsState.handleLinkTemplateDialogOpen) {
                dialogsState.handleLinkTemplateDialogOpen(dialogsState.selectedItemId);
              } else {
                console.warn("handleLinkTemplateDialogOpen non è definito in dialogsState per il menu item");
                showNotification("Funzione collega template non disponibile.", "warning");
              }
            }
            dialogsState.handleItemMenuClose();
          }}>
            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Collega/Modifica Template Annidato" />
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (dialogsState.selectedItemId) {
            removeItem(dialogsState.selectedItemId); // Usa la funzione dal context
            showNotification('Elemento rimosso dal rundown', 'success');
          }
          dialogsState.handleItemMenuClose();
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Rimuovi" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* Intestazione della tabella con filtro */}
      <Box sx={{
        display: 'flex',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #444',
        p: 1,
        fontWeight: 'bold',
        fontSize: '0.9rem',
        position: 'sticky', // Per mantenere l'intestazione visibile durante lo scroll
        top: 0,           // Attacca all'inizio del contenitore scrollabile
        zIndex: 7,       // Assicura che sia sopra gli item della lista
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <Box sx={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>#</Box>
          <Box sx={{ width: '80px', flexShrink: 0 }}>START</Box>
          <Box sx={{ width: '80px', flexShrink: 0 }}>DURATION</Box>
          <Box sx={{ width: '230px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'  }}>LOCATION</Box>
          <Box sx={{ flexGrow: 1, minWidth: '150px' }}>FILE / TEMPLATE</Box>
          <Box sx={{ width: '130px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>NOTE</Box>
          <Box sx={{ width: '80px', textAlign: 'center', flexShrink: 0 }}>IN</Box>
          <Box sx={{ width: '20px', flexShrink: 0 }}></Box> {/* Spazio vuoto tra IN e OUT */}
          <Box sx={{ width: '80px', textAlign: 'center', flexShrink: 0 }}>OUT</Box>
          <Box sx={{ width: '100px', textAlign: 'center', flexShrink: 0 }}>COUNTDOWN</Box>
          <Box sx={{ width: '100px', textAlign: 'center', flexShrink: 0 }}>STATO</Box>
          <Box sx={{ width: '120px', textAlign: 'center', flexShrink: 0 }}>AZIONI</Box>
        </Box>

        {/* Bottone di filtro */}
        <Box>
          <Tooltip title="Filtra elementi">
            <IconButton
              size="small"
              onClick={handleFilterMenuOpen}
              color={filterOptions.filterByScaletta || !filterOptions.showExplodedItems || !filterOptions.showRegularItems ? "primary" : "default"}
              sx={{ ml: 1 }}
            >
              <Badge
                badgeContent={uniqueScalette.length}
                color="secondary"
                invisible={uniqueScalette.length === 0}
              >
                <FilterListIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Menu di filtro */}
          <Menu
            anchorEl={filterMenuAnchorEl}
            open={Boolean(filterMenuAnchorEl)}
            onClose={handleFilterMenuClose}
          >
            <MenuItem>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterOptions.showRegularItems}
                    onChange={(e) => handleFilterChange('showRegularItems', e.target.checked)}
                  />
                }
                label="Mostra elementi normali"
              />
            </MenuItem>
            <MenuItem>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterOptions.showExplodedItems}
                    onChange={(e) => handleFilterChange('showExplodedItems', e.target.checked)}
                  />
                }
                label="Mostra elementi esplosi"
              />
            </MenuItem>

            {uniqueScalette.length > 0 && (
              <>
                <Divider />
                <MenuItem disabled>
                  <Typography variant="caption">Filtra per scaletta</Typography>
                </MenuItem>
                {uniqueScalette.map(scaletta => (
                  <MenuItem
                    key={scaletta}
                    onClick={() => handleFilterByScaletta(scaletta)}
                    selected={filterOptions.filterByScaletta === scaletta}
                  >
                    <ListItemIcon>
                      <SourceIcon fontSize="small" color={filterOptions.filterByScaletta === scaletta ? "primary" : "inherit"} />
                    </ListItemIcon>
                    <ListItemText
                      primary={scaletta}
                      primaryTypographyProps={{
                        noWrap: true,
                        style: { maxWidth: '200px' }
                      }}
                    />
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Visualizzazione delle ore nel rundown (non modificata in questo task) */}
      {/* ... */}

      <Box sx={{
        // height: 'calc(100vh - 350px)', // L'altezza potrebbe necessitare aggiustamenti
        overflowY: 'auto', // Scroll verticale per la lista
        flexGrow: 1
      }}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => {
            // MODIFICA/AGGIUNTA START: Determinare se l'item è ON AIR o NEXT
            const isPlaying = item.isPlaying;
            const isNext = item.id === nextItemId;
            // MODIFICA/AGGIUNTA END

            // Verifica se l'elemento è esploso (ha sourceInfo)
            const isExploded = item.data && item.data.sourceInfo;
            const isMediaWithLinkedTemplate = item.type === 'MEDIA' && item.data.linkedTemplate && item.data.linkedTemplate.template;
            // MODIFICA/AGGIUNTA START: Logica per itemBackgroundColor e leftBorderStyle
            let itemBackgroundColor = 'transparent';
            // Applica lo sfondo alternato solo se l'item non è né ON AIR né NEXT
            if (index % 2 === 0 && !isPlaying && !isNext) {
                itemBackgroundColor = 'rgba(255, 255, 255, 0.03)';
            }

            let itemStyles = {}; // Per stili aggiuntivi come animazioni o boxShadow
            // leftBorderStyle non utilizzato, ma manteniamo la logica per riferimenti futuri

            if (isPlaying) {
              itemBackgroundColor = item.type === 'MEDIA' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(33, 150, 243, 0.25)';
              // Bordo gestito direttamente nel Box sx
              itemStyles.boxShadow = '0 0 8px rgba(76, 175, 80, 0.3)'; // Ombra verde per ON AIR
              // itemStyles.animation = `${pulseAnimationGreen} 1.5s infinite ease-in-out`; // Descommenta per animazione ON AIR
            } else if (isNext) {
              itemBackgroundColor = 'rgba(255, 193, 7, 0.25)'; // Sfondo giallo ambrato per NEXT UP (Preview)
              // Bordo gestito direttamente nel Box sx
              itemStyles.boxShadow = '0 0 8px rgba(255, 193, 7, 0.3)'; // Ombra gialla per NEXT
              // itemStyles.animation = `${pulseAnimationYellow} 2s infinite ease-in-out alternate`; // Descommenta per animazione NEXT
            } else if (isMediaWithLinkedTemplate) {
                // Applica uno sfondo e bordo distintivo per media con template annidati che non sono ON AIR o NEXT
                if (itemBackgroundColor === 'transparent') itemBackgroundColor = 'rgba(161, 136, 127, 0.08)'; // Sfondo leggermente marroncino/grigio
                // Bordo gestito direttamente nel Box sx
            }
            // MODIFICA/AGGIUNTA END

            // Colore di sfondo distintivo per media con template annidato
            if (isMediaWithLinkedTemplate && !item.isPlaying) {
                itemBackgroundColor = 'rgba(100, 100, 0, 0.1)'; // Esempio: giallo scuro trasparente
            } else if (isMediaWithLinkedTemplate && item.isPlaying) {
                itemBackgroundColor = 'rgba(100, 100, 0, 0.25)'; // Più scuro quando in play
            }


            return (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                backgroundColor: itemBackgroundColor,
                borderLeft: item.isPlaying
                  ? (item.type === 'MEDIA' ? '4px solid #4caf50' : '4px solid #2196f3')
                  : (isMediaWithLinkedTemplate ? '4px solid #FFC107' : 'none'), // Bordo giallo per media con template
                pl: item.isPlaying || isMediaWithLinkedTemplate ? 1 : 2,
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: item.isPlaying ? '0 0 8px rgba(255, 255, 255, 0.1)' : 'none',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)' // Hover più evidente
                }
              }}
              onClick={() => handleEditItemDialogOpen(item.id)}
              onContextMenu={(e) => handleContextMenu(e, item)}
              onDoubleClick={() => handlePlayItem(item)}
            >
              {/* Numero di riga */}
              <Box sx={{ width: '40px', textAlign: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                {index + 1}
              </Box>

              {/* Orario di inizio */}
              <Box sx={{
                width: '80px',
                fontFamily: 'monospace',
                color: scheduledPlayback ? '#4caf50' : 'inherit',
                fontWeight: scheduledPlayback ? 'bold' : 'normal',
                flexShrink: 0
              }}>
                {item.data.startTime || '00:00:00'}
              </Box>

              {/* Durata */}
              <Box sx={{ width: '80px', fontFamily: 'monospace', flexShrink: 0 }}>
                {item.data.duration || (item.type === 'MEDIA' ? '00:05:00' : '00:01:00')}
              </Box>

              {/* Location */}
              <Tooltip title={item.data.location || (item.type === 'MEDIA' ? item.data.clip : item.data.template)}>
                <Box sx={{
                    width: '230px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.85rem',
                    opacity: 0.8,
                    flexShrink: 0,
                    pr:1 // padding right per evitare sovrapposizione con prossimo campo
                }}>
                    {item.data.location || (item.type === 'MEDIA' ? item.data.clip : item.data.template)}
                </Box>
              </Tooltip>


              {/* Nome del file / Template */}
              <Box sx={{
                flexGrow: 1,
                minWidth: '150px', // Per evitare che diventi troppo piccolo
                display: 'flex',
                alignItems: 'center',
                fontWeight: isPlaying || isNext ? 'bold' : 'normal', // MODIFICA/AGGIUNTA
                color: item.isPlaying
                  ? (item.type === 'MEDIA' ? '#4caf50' : '#2196f3')
                  : 'inherit',
                overflow: 'hidden', // Per gestire l'overflow del contenuto interno
              }}>
                {/* Indicatore di riproduzione */}
                {item.isPlaying && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: item.type === 'MEDIA' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                      mr: 1,
                      animation: `${pulseAnimationGreen} 1.5s infinite ease-in-out`,
                      flexShrink: 0,
                    }}
                  >
                    <PlayArrowIcon fontSize="small" color={item.type === 'MEDIA' ? 'success' : 'primary'} />
                  </Box>
                )}

                {/* MODIFICA/AGGIUNTA START: Indicatore per NEXT */}
                 {isNext && (
                  <Tooltip title="Prossimo in play">
                    <FiberManualRecordIcon fontSize="small" sx={{ color: '#FFC107', mr: 0.5, animation: `${pulseAnimationYellow} 1.8s infinite ease-in-out alternate` }} />
                  </Tooltip>
                )}
                {/* MODIFICA/AGGIUNTA END */}

                {/* Icona del tipo di elemento */}
                {item.type === 'MEDIA' ?
                  <MovieIcon
                    fontSize="small"
                    sx={{
                      mr: 0.5, // Ridotto margine
                      color: item.isPlaying ? '#4caf50' : (isMediaWithLinkedTemplate ? '#FFC107' : 'inherit'),
                      opacity: item.isPlaying ? 1 : 0.7,
                      flexShrink: 0,
                    }}
                  /> :
                  <BrushIcon
                    fontSize="small"
                    sx={{
                      mr: 0.5, // Ridotto margine
                      color: item.isPlaying ? '#2196f3' : 'inherit',
                      opacity: item.isPlaying ? 1 : 0.7,
                      flexShrink: 0,
                    }}
                  />
                }
                {/* Icona per template annidato */}
                {isMediaWithLinkedTemplate && (
                    <Tooltip title={`Template Annidato: ${item.data.linkedTemplate.name || 'Non specificato'}`}>
                        <LinkIcon
                            fontSize="small"
                            sx={{
                                color: item.isPlaying ? '#4caf50' : '#FFC107', // Giallo per distinguerlo
                                ml: 0.5, // Margine sinistro per separarlo dall'icona media
                                mr: 0.5,
                                flexShrink: 0,
                            }}
                        />
                    </Tooltip>
                )}


                {/* Nome dell'elemento e dettagli template annidato */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden', // Per gestire l'ellipsis sul nome
                  flexGrow: 1, // Permette a questo box di crescere
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: item.isPlaying ? 'bold' : 'normal',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mr: 1
                      }}
                      title={item.data.customName || item.name} // Tooltip per nome completo
                    >
                      {item.data.customName || item.name}
                    </Typography>

                    {/* Etichetta per elementi esplosi */}
                    {isExploded && (
                      <Tooltip
                        title={`Elemento esploso dalla scaletta "${item.data.sourceInfo.sourceScalettaName}" del ${format(new Date(item.data.sourceInfo.sourceDay), 'dd/MM/yyyy')}`}
                        arrow
                      >
                        <Chip
                          icon={<SourceIcon fontSize="small" />}
                          label={item.data.sourceInfo.sourceScalettaName}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{
                            height: '20px',
                            '& .MuiChip-label': {
                              px: 1,
                              fontSize: '0.7rem',
                              maxWidth: '100px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            },
                            '& .MuiChip-icon': {
                              fontSize: '0.8rem',
                              ml: 0.5
                            }
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>

                  {isMediaWithLinkedTemplate && (
                    <Typography variant="caption" sx={{ color: '#FFC107', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                title={item.data.linkedTemplate.name}
                    >
                        + {item.data.linkedTemplate.name || 'Template Ann.'} (L: {item.data.linkedTemplate.layer}, CG: {item.data.linkedTemplate.cgLayer})
                    </Typography>
                  )}

                  {item.isPlaying && item.playingStartTime && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: item.type === 'MEDIA' ? '#4caf50' : '#2196f3',
                        fontSize: '0.7rem'
                      }}
                    >
                      In onda: {formatPlayingTime(item.playingStartTime)}
                    </Typography>
                  )}
                </Box>

                {/* Indicatori aggiuntivi (Loop) */}
                <Box sx={{ display: 'flex', ml: 'auto', flexShrink: 0, alignItems: 'center' }}>
                  {item.data.loop && (
                    <Tooltip title="Loop">
                      <RepeatIcon fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                    </Tooltip>
                  )}
                  {/* Rimosso l'indicatore di linkedTemplates da qui perché ora è integrato vicino all'icona principale */}
                </Box>
              </Box>

              {/* Note */}
              <Tooltip title={item.data.note || ''}>
                <Box sx={{
                    width: '130px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.85rem',
                    opacity: 0.8,
                    flexShrink: 0,
                    pr: 1, // padding right
                }}>
                    {item.data.note || ''}
                </Box>
              </Tooltip>

              {/* Punto di ingresso */}
              <Box sx={{ width: '80px', textAlign: 'center', fontFamily: 'monospace', flexShrink: 0 }}>
                {item.data.inPoint || '00:00:00'}
              </Box>

              <Box sx={{ width: '20px', flexShrink: 0 }}></Box> {/* Spazio */}

              {/* Punto di uscita */}
              <Box sx={{ width: '80px', textAlign: 'center', fontFamily: 'monospace', flexShrink: 0 }}>
                {item.data.outPoint || ''}
              </Box>

              {/* Countdown */}
              <Box sx={{
                width: '100px',
                textAlign: 'center',
                fontFamily: 'monospace',
                color: isPlaying ? '#ff5722' : (isNext ? '#FFC107' : 'inherit'), // MODIFICA/AGGIUNTA: Colore per NEXT
                fontWeight: item.isPlaying ? 'bold' : 'normal',
                flexShrink: 0
              }}>
                {item.isPlaying && item.data.outPoint ? (
                  <Box sx={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {calculateCountdown(item)}
                  </Box>
                ) : (
                  item.data.outPoint && item.data.inPoint ? (
                    <Box sx={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      opacity: 0.7
                    }}>
                      {calculateCountdown(item)}
                    </Box>
                  ) : null
                )}
              </Box>

              {/* Stato */}
              <Box sx={{
                width: '100px',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0
              }}>
                {item.isPlaying ? (
                  <Box sx={{
                    backgroundColor: item.type === 'MEDIA' ? '#4caf50' : '#2196f3',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
                    animation: `${pulseAnimationYellow} 1.5s infinite ease-in-out`,
                    minWidth: '70px',
                    justifyContent: 'center'
                  }}>
                    <PlayArrowIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                    ON AIR
                  </Box>
                  // MODIFICA/AGGIUNTA START: Chip "NEXT"
                ) : isNext ? (
                    <Chip label="NEXT" color="warning" size="small" variant="outlined" sx={{borderColor: '#FFC107', color:'#FFC107', fontWeight:'bold', backgroundColor: 'rgba(255, 193, 7, 0.1)'}}/>
                // MODIFICA/AGGIUNTA END
                ) : isExploded ? (
                    <Tooltip title={`Elemento esploso dalla scaletta "${item.data.sourceInfo.sourceScalettaName}"`}>
                      <Chip
                        icon={<SourceIcon fontSize="small" />}
                        label="ESPLOSO"
                        color="primary"
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: '#2196f3',
                          color:'#2196f3',
                          fontWeight:'bold',
                          backgroundColor: 'rgba(33, 150, 243, 0.1)'
                        }}
                      />
                    </Tooltip>
                ) : null}
              </Box>

              {/* Azioni */}
              <Box sx={{ width: '120px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <Tooltip title="Riproduci">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayItem(item);
                    }}
                    disabled={!connected}
                    sx={{
                      mx: 0.5,
                      color: item.type === 'MEDIA' ? '#4caf50' : '#2196f3',
                      '&:hover': {
                        backgroundColor: item.type === 'MEDIA' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)'
                      }
                    }}
                  >
                    <PlayArrowIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Ferma">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStopItem(item);
                    }}
                    disabled={!connected || !item.isPlaying} // Disabilitato se non connesso o non in play
                    sx={{ mx: 0.5 }}
                  >
                    <StopIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Menu">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemMenuOpen(e, item.id);
                    }}
                    sx={{ mx: 0.5 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )})
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            {items.length === 0 ? (
              <>
                <Typography variant="body1">
                  Nessun elemento nel rundown
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Clicca su 'Aggiungi' per aggiungere elementi
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1">
                  Nessun elemento corrisponde ai filtri selezionati
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Modifica i filtri per visualizzare gli elementi
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFilterOptions({
                    showExplodedItems: true,
                    showRegularItems: true,
                    filterByScaletta: null
                  })}
                  sx={{ mt: 2 }}
                >
                  Reimposta filtri
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>
    </>
  );
};

export default RundownList;
