import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useCalendar } from '../../contexts/CalendarContext';
import { useCaspar } from '../../contexts/CasparContext';
import { useRundown } from '../../contexts/RundownContext';
import { styled } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

// Componente per il calendario con timeline
const TimelineCalendar = () => {
  const {
    calendarData,
    playlistData,
    modified,
    addRundownToDay,
    removeRundownFromDay,
    saveCalendar,
    loadCalendar,
    clearCalendar,
    addToPlaylist,
    removeFromPlaylist,
    updatePlaylistItem,
    reorderPlaylist,
    calculateEndTime
  } = useCalendar();

  const { connected, playMedia } = useCaspar();
  const { rundownItems, addItemToRundown } = useRundown();

  // Stati per i dialoghi e i menu
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPath, setItemPath] = useState('');
  const [itemStartTime, setItemStartTime] = useState('00:00:00');
  const [itemDuration, setItemDuration] = useState('00:05:00');
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' o 'playlist'

  // Giorni della settimana in italiano
  const weekDays = {
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  };

  // Ore del giorno (dalle 00 alle 23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Stile per gli elementi della timeline
  const TimelineItem = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1),
    backgroundColor: '#3d3d3d',
    borderRadius: theme.shape.borderRadius,
    position: 'absolute',
    width: '100%',
    overflow: 'hidden',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#4d4d4d',
    }
  }));

  // Gestione del menu contestuale
  const handleMenuOpen = (event, day, item) => {
    event.stopPropagation();
    setSelectedDay(day);
    setSelectedItem(item);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Gestione del dialogo per aggiungere un elemento
  const handleAddDialogOpen = (day) => {
    setSelectedDay(day);
    setItemName('');
    setItemPath('');
    setItemStartTime('00:00:00');
    setItemDuration('00:05:00');
    setAddDialogOpen(true);
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  // Gestione del dialogo per modificare un elemento
  const handleEditDialogOpen = () => {
    if (selectedItem) {
      setItemName(selectedItem.name || '');
      setItemPath(selectedItem.path || '');
      setItemStartTime(selectedItem.startTime || '00:00:00');
      setItemDuration(selectedItem.duration || '00:05:00');
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  // Aggiunta di un elemento al calendario
  const handleAddItem = () => {
    if (selectedDay && (itemPath || itemName)) {
      const newItem = {
        id: uuidv4(),
        name: itemName || 'Elemento senza nome',
        path: itemPath,
        startTime: itemStartTime,
        duration: itemDuration,
        endTime: calculateEndTime(itemStartTime, itemDuration),
        scheduled: true,
        day: selectedDay
      };
      
      addRundownToDay(selectedDay, newItem);
      handleAddDialogClose();
    }
  };

  // Modifica di un elemento
  const handleEditItem = () => {
    if (selectedItem) {
      const updatedItem = {
        name: itemName,
        path: itemPath,
        startTime: itemStartTime,
        duration: itemDuration,
        endTime: calculateEndTime(itemStartTime, itemDuration)
      };
      
      updatePlaylistItem(selectedItem.id, updatedItem);
      handleEditDialogClose();
    }
  };

  // Rimozione di un elemento
  const handleRemoveItem = () => {
    if (selectedDay && selectedItem) {
      removeRundownFromDay(selectedDay, selectedItem.id);
      removeFromPlaylist(selectedItem.id);
      handleMenuClose();
    }
  };

  // Riproduzione di un elemento
  const handlePlayItem = () => {
    if (selectedItem && selectedItem.path && connected) {
      playMedia(selectedItem.path);
      handleMenuClose();
    }
  };

  // Calcola la posizione e l'altezza di un elemento nella timeline
  const calculateItemPosition = (startTime, duration) => {
    try {
      // Convertiamo l'orario di inizio in minuti
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      
      // Convertiamo la durata in minuti
      const [durationHours, durationMinutes] = duration.split(':').map(Number);
      const durationTotalMinutes = durationHours * 60 + durationMinutes;
      
      // Calcoliamo la posizione verticale (top) e l'altezza
      const top = (startTotalMinutes / (24 * 60)) * 100; // Percentuale dell'altezza totale
      const height = (durationTotalMinutes / (24 * 60)) * 100; // Percentuale dell'altezza totale
      
      return { top: `${top}%`, height: `${height}%` };
    } catch (error) {
      console.error('Errore nel calcolo della posizione:', error);
      return { top: '0%', height: '5%' };
    }
  };

  // Gestione del drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Se stiamo riordinando la playlist
    if (source.droppableId === 'playlist' && destination.droppableId === 'playlist') {
      reorderPlaylist(source.index, destination.index);
    }
    // Implementare altre logiche di drag and drop se necessario
  };

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: '#2d2d2d'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6">
              Calendario con Timeline
            </Typography>
            {modified && (
              <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                Modificato
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                color={currentView === 'calendar' ? 'primary' : 'inherit'}
                onClick={() => setCurrentView('calendar')}
                size="small"
              >
                Calendario
              </Button>
              
              <Button
                variant="outlined"
                color={currentView === 'playlist' ? 'primary' : 'inherit'}
                onClick={() => setCurrentView('playlist')}
                size="small"
              >
                Playlist
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={loadCalendar}
                size="small"
              >
                Carica
              </Button>

              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={saveCalendar}
                size="small"
              >
                Salva
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={clearCalendar}
                size="small"
              >
                Pulisci
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Vista Calendario */}
      {currentView === 'calendar' && (
        <Grid container spacing={2}>
          {Object.entries(weekDays).map(([day, dayName]) => (
            <Grid item xs={12} key={day}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  backgroundColor: '#2d2d2d',
                  display: 'flex',
                  flexDirection: 'column',
                  mb: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">{dayName}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleAddDialogOpen(day)}
                    color="primary"
                  >
                    <AddIcon />
                  </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ position: 'relative', height: '200px', width: '100%' }}>
                  {/* Linee orarie */}
                  {hours.map((hour) => (
                    <Box
                      key={hour}
                      sx={{
                        position: 'absolute',
                        top: `${(hour / 24) * 100}%`,
                        left: 0,
                        right: 0,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        height: '1px'
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          left: '-40px',
                          top: '-10px',
                          color: 'text.secondary'
                        }}
                      >
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </Typography>
                    </Box>
                  ))}

                  {/* Elementi del calendario */}
                  {calendarData[day].map((item) => {
                    const { top, height } = calculateItemPosition(item.startTime, item.duration);
                    return (
                      <TimelineItem
                        key={item.id}
                        sx={{
                          top,
                          height,
                          left: '40px',
                          right: 0
                        }}
                        onClick={(e) => handleMenuOpen(e, day, item)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" noWrap>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.startTime} - {item.endTime}
                          </Typography>
                        </Box>
                      </TimelineItem>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Vista Playlist */}
      {currentView === 'playlist' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              backgroundColor: '#2d2d2d',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>Playlist</Typography>
            
            <Droppable droppableId="playlist">
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ flexGrow: 1 }}
                >
                  {playlistData.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                      Nessun elemento nella playlist
                    </Typography>
                  ) : (
                    playlistData.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              p: 2,
                              mb: 1,
                              backgroundColor: '#3d3d3d',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <Box>
                              <Typography variant="body1">{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.startTime} - {item.endTime} | Durata: {item.duration}
                              </Typography>
                              {item.scheduled && (
                                <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                  Pianificato: {weekDays[item.day]}
                                </Typography>
                              )}
                            </Box>
                            
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setSelectedItem(item);
                                setSelectedDay(item.day);
                                handleMenuOpen(e, item.day, item);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Paper>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>
        </DragDropContext>
      )}

      {/* Menu contestuale per gli elementi */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handlePlayItem} disabled={!connected}>
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Riproduci</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditDialogOpen}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifica</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRemoveItem}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rimuovi</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogo per aggiungere un elemento */}
      <Dialog open={addDialogOpen} onClose={handleAddDialogClose}>
        <DialogTitle>Aggiungi Elemento a {selectedDay ? weekDays[selectedDay] : ''}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome dell'Elemento"
            fullWidth
            variant="outlined"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Percorso del File"
            fullWidth
            variant="outlined"
            value={itemPath}
            onChange={(e) => setItemPath(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Orario di Inizio (HH:MM:SS)"
                fullWidth
                variant="outlined"
                value={itemStartTime}
                onChange={(e) => setItemStartTime(e.target.value)}
                InputProps={{
                  startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Durata (HH:MM:SS)"
                fullWidth
                variant="outlined"
                value={itemDuration}
                onChange={(e) => setItemDuration(e.target.value)}
                InputProps={{
                  startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose}>Annulla</Button>
          <Button onClick={handleAddItem} variant="contained" color="primary">
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo per modificare un elemento */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Modifica Elemento</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome dell'Elemento"
            fullWidth
            variant="outlined"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Percorso del File"
            fullWidth
            variant="outlined"
            value={itemPath}
            onChange={(e) => setItemPath(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Orario di Inizio (HH:MM:SS)"
                fullWidth
                variant="outlined"
                value={itemStartTime}
                onChange={(e) => setItemStartTime(e.target.value)}
                InputProps={{
                  startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Durata (HH:MM:SS)"
                fullWidth
                variant="outlined"
                value={itemDuration}
                onChange={(e) => setItemDuration(e.target.value)}
                InputProps={{
                  startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Annulla</Button>
          <Button onClick={handleEditItem} variant="contained" color="primary">
            Salva Modifiche
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimelineCalendar;
