import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
  // Tooltip non utilizzato
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RepeatIcon from '@mui/icons-material/Repeat';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MovieIcon from '@mui/icons-material/Movie';
import BrushIcon from '@mui/icons-material/Brush';
import LinkIcon from '@mui/icons-material/Link';
import { useRundown } from '../../../contexts/RundownContext';

import useRundownPlayback from '../hooks/useRundownPlayback';

/**
 * Componente per l'intestazione del rundown con controlli principali.
 */
const RundownHeader = ({
  rundownName,
  modified,
  scheduledPlayback,
  items,
  connected,
  showNotification,
  dialogsState,
  playAll,
  stopAll
}) => {
  const {
    setRundownName,
    toggleScheduledPlayback,
    sortItemsByStartTime,
    saveRundown,
    loadRundown,
    clearRundown,
    setAutoPlay,
    autoPlay
  } = useRundown();

  const {
    handleAddMenuOpen,
    handleAddMenuClose,
    handleAddMediaDialogOpen,
    handleAddTemplateDialogOpen,
    handleAddMediaWithTemplateDialogOpen,
    setAddMediaDialogOpen,
    setSettingsDialogOpen,
    addMenuAnchorEl
  } = dialogsState;

  const {
    playItem
  } = useRundownPlayback();

  // Gestione del salvataggio del rundown
  const handleSaveRundown = () => {
    try {
      saveRundown();
      showNotification('Rundown salvato con successo', 'success');
    } catch (error) {
      showNotification(`Errore nel salvataggio del rundown: ${error.message}`, 'error');
    }
  };

  // Gestione del caricamento di un rundown
  const handleLoadRundown = () => {
    try {
      loadRundown();
      showNotification('Rundown caricato con successo', 'success');
    } catch (error) {
      showNotification(`Errore nel caricamento del rundown: ${error.message}`, 'error');
    }
  };

  // Pulizia del rundown
  const handleClearRundown = () => {
    if (window.confirm('Sei sicuro di voler rimuovere tutti gli elementi dal rundown?')) {
      clearRundown();
      showNotification('Rundown pulito', 'success');
    }
  };

  // Riproduzione automatica del rundown
  const handleAutoPlay = async () => {
    if (!connected || items.length === 0) return;

    try {
      setAutoPlay(true);
      if (playAll) {
        await playAll();
        console.log('Riproduzione automatica avviata');
      }
      showNotification('Riproduzione automatica avviata', 'success');
    } catch (error) {
      console.error('Errore nella riproduzione automatica:', error);
      showNotification(`Errore nell'avvio della riproduzione automatica: ${error.message}`, 'error');
    }
  };

  // Arresto della riproduzione automatica
  const handleStopAutoPlay = () => {
    try {
      setAutoPlay(false);
      if (stopAll) {
        stopAll();
        console.log('Riproduzione automatica fermata');
      }
      showNotification('Riproduzione automatica fermata', 'success');
    } catch (error) {
      console.error('Errore nell\'arresto della riproduzione automatica:', error);
      showNotification(`Errore nell'arresto della riproduzione automatica: ${error.message}`, 'error');
    }
  };

  // Riproduzione in loop del primo elemento
  const handlePlayLoop = () => {
    if (!connected || items.length === 0) return;

    try {
      if (playItem) {
        playItem(items[0]);
        console.log('Riproduzione in loop avviata');
      }
      showNotification(`Riproduzione in loop avviata: ${items[0].data.customName || items[0].name}`, 'success');
    } catch (error) {
      console.error('Errore nella riproduzione in loop:', error);
      showNotification(`Errore nella riproduzione in loop: ${error.message}`, 'error');
    }
  };

  return (
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
          <TextField
            label="Nome Rundown"
            variant="outlined"
            fullWidth
            value={rundownName}
            onChange={(e) => setRundownName(e.target.value)}
            size="small"
          />
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
              startIcon={<FolderOpenIcon />}
              onClick={handleLoadRundown}
              size="small"
            >
              Carica
            </Button>

            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveRundown}
              disabled={items.length === 0}
              size="small"
            >
              Salva
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearRundown}
              disabled={items.length === 0}
              size="small"
            >
              Pulisci
            </Button>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Controlli per la riproduzione pianificata */}
            {scheduledPlayback ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={toggleScheduledPlayback}
                size="small"
              >
                Stop Pianificazione
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={toggleScheduledPlayback}
                disabled={!connected || items.length === 0}
                size="small"
              >
                Avvia Pianificazione
              </Button>
            )}

            <Button
              variant="outlined"
              color="primary"
              onClick={sortItemsByStartTime}
              disabled={items.length === 0}
              size="small"
            >
              Ordina per Orario
            </Button>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {autoPlay ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleStopAutoPlay}
                size="small"
              >
                Stop Auto
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleAutoPlay}
                disabled={!connected || items.length === 0}
                size="small"
              >
                Auto Play
              </Button>
            )}

            <Button
              variant="contained"
              color="secondary"
              startIcon={<RepeatIcon />}
              onClick={handlePlayLoop}
              disabled={!connected || items.length === 0}
              size="small"
            >
              Play Loop
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMenuOpen}
                disabled={!connected}
                size="small"
              >
                Aggiungi
              </Button>

              {scheduledPlayback && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<AccessTimeIcon />}
                  onClick={() => {
                    // Apri il dialog di aggiunta media con l'orario corrente preimpostato
                    setAddMediaDialogOpen(true);
                    // Imposta un timeout per permettere al dialog di aprirsi prima di impostare il valore
                    setTimeout(() => {
                      const timeInput = document.getElementById('mediaStartTime');
                      if (timeInput) {
                        const now = new Date();
                        const timeString = now.toTimeString().substring(0, 8); // HH:MM:SS
                        timeInput.value = timeString;
                      }
                    }, 100);
                  }}
                  disabled={!connected}
                  size="small"
                >
                  Aggiungi Ora
                </Button>
              )}
            </Box>

            <IconButton
              color="primary"
              onClick={() => setSettingsDialogOpen(true)}
              size="small"
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      {/* Menu di aggiunta */}
      <Menu
        anchorEl={addMenuAnchorEl}
        open={Boolean(addMenuAnchorEl)}
        onClose={handleAddMenuClose}
      >
        <MenuItem onClick={handleAddMediaDialogOpen}>
          <ListItemIcon>
            <MovieIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Aggiungi Media" />
        </MenuItem>
        <MenuItem onClick={handleAddTemplateDialogOpen}>
          <ListItemIcon>
            <BrushIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Aggiungi Template" />
        </MenuItem>
        <MenuItem onClick={handleAddMediaWithTemplateDialogOpen}>
          <ListItemIcon>
            <LinkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Aggiungi Media con Template" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default RundownHeader;