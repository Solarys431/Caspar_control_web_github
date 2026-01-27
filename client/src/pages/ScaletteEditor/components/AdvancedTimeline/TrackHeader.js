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
  ListItemText
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ColorLens as ColorIcon
} from '@mui/icons-material';

/**
 * Componente per l'intestazione di una traccia nella timeline
 * Mostra informazioni e controlli per ogni traccia
 */
const TrackHeader = ({
  track,
  height = 50,
  onTrackToggle,
  onTrackSolo,
  onTrackMute,
  onTrackLock,
  onTrackEdit,
  onTrackDelete,
  onTrackColorChange,
  onAddItem
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);

  /**
   * Gestisce l'apertura del menu contestuale
   */
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  /**
   * Gestisce la chiusura del menu contestuale
   */
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  /**
   * Ottiene l'icona per il tipo di traccia
   */
  const getTrackTypeIcon = () => {
    if (track.allowedTypes.includes('MEDIA')) return '🎬';
    if (track.allowedTypes.includes('TEMPLATE')) return '🎨';
    if (track.allowedTypes.includes('AUDIO')) return '🔊';
    if (track.allowedTypes.includes('COMMAND')) return '⚙️';
    return '📄';
  };

  /**
   * Ottiene il colore di sfondo della traccia
   */
  const getTrackBackgroundColor = () => {
    if (!track.visible) return 'rgba(128, 128, 128, 0.1)';
    if (track.solo) return 'rgba(255, 193, 7, 0.1)';
    if (track.muted) return 'rgba(244, 67, 54, 0.1)';
    return 'rgba(255, 255, 255, 0.02)';
  };

  return (
    <Box
      sx={{
        height: `${height}px`,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: getTrackBackgroundColor(),
        position: 'relative',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.05)'
        }
      }}
    >
      {/* Barra colorata laterale */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          bgcolor: track.color || '#4CAF50',
          opacity: track.visible ? 1 : 0.3
        }}
      />

      {/* Header principale */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        px: 1, 
        gap: 0.5,
        minHeight: '32px'
      }}>
        {/* Icona tipo traccia */}
        <Typography sx={{ fontSize: '14px', minWidth: '20px' }}>
          {getTrackTypeIcon()}
        </Typography>

        {/* Nome traccia */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body2" 
            noWrap
            sx={{ 
              fontWeight: 'medium',
              opacity: track.visible ? 1 : 0.5,
              fontSize: '12px'
            }}
          >
            {track.name}
          </Typography>
          
          {/* Info canale/layer */}
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: '10px' }}
          >
            CH{track.channel}-L{track.layer}
          </Typography>
        </Box>

        {/* Menu opzioni */}
        <IconButton 
          size="small" 
          onClick={handleMenuOpen}
          sx={{ p: 0.25 }}
        >
          <MoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Controlli traccia */}
      {height > 40 && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: 1, 
          gap: 0.25,
          height: '24px'
        }}>
          {/* Visibilità */}
          <Tooltip title={track.visible ? "Nascondi traccia" : "Mostra traccia"}>
            <IconButton 
              size="small" 
              onClick={() => onTrackToggle && onTrackToggle(track.id)}
              sx={{ p: 0.25 }}
            >
              {track.visible ? 
                <VisibilityIcon fontSize="small" /> : 
                <VisibilityOffIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>

          {/* Mute */}
          <Tooltip title={track.muted ? "Unmute traccia" : "Mute traccia"}>
            <IconButton 
              size="small" 
              onClick={() => onTrackMute && onTrackMute(track.id)}
              color={track.muted ? "error" : "default"}
              sx={{ p: 0.25 }}
            >
              {track.muted ? 
                <VolumeOffIcon fontSize="small" /> : 
                <VolumeUpIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>

          {/* Lock */}
          <Tooltip title={track.locked ? "Sblocca traccia" : "Blocca traccia"}>
            <IconButton 
              size="small" 
              onClick={() => onTrackLock && onTrackLock(track.id)}
              color={track.locked ? "warning" : "default"}
              sx={{ p: 0.25 }}
            >
              {track.locked ? 
                <LockIcon fontSize="small" /> : 
                <LockOpenIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>

          {/* Numero elementi */}
          {track.items && track.items.length > 0 && (
            <Chip 
              label={track.items.length}
              size="small"
              sx={{ 
                height: '16px', 
                fontSize: '9px',
                '& .MuiChip-label': { px: 0.5 }
              }}
            />
          )}
        </Box>
      )}

      {/* Solo indicator */}
      {track.solo && (
        <Box
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            borderRadius: '2px',
            px: 0.5,
            py: 0.25,
            fontSize: '8px',
            fontWeight: 'bold'
          }}
        >
          SOLO
        </Box>
      )}

      {/* Menu contestuale */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: '180px' }
        }}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          onAddItem && onAddItem(track.id);
        }}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Aggiungi elemento" />
        </MenuItem>

        <MenuItem onClick={() => {
          handleMenuClose();
          onTrackEdit && onTrackEdit(track.id);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Modifica traccia" />
        </MenuItem>

        <MenuItem onClick={() => {
          handleMenuClose();
          onTrackColorChange && onTrackColorChange(track.id);
        }}>
          <ListItemIcon>
            <ColorIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Cambia colore" />
        </MenuItem>

        <MenuItem 
          onClick={() => {
            handleMenuClose();
            onTrackSolo && onTrackSolo(track.id);
          }}
          disabled={track.locked}
        >
          <ListItemIcon>
            <VolumeUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={track.solo ? "Disabilita Solo" : "Solo traccia"} />
        </MenuItem>

        <MenuItem 
          onClick={() => {
            handleMenuClose();
            onTrackDelete && onTrackDelete(track.id);
          }}
          disabled={track.locked}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Elimina traccia" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

/**
 * Variante compatta del TrackHeader per spazi ridotti
 */
export const CompactTrackHeader = ({ track, height = 30, ...props }) => {
  return (
    <Box
      sx={{
        height: `${height}px`,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        px: 0.5,
        gap: 0.5,
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        position: 'relative'
      }}
    >
      {/* Barra colorata */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          bgcolor: track.color || '#4CAF50'
        }}
      />

      {/* Nome traccia compatto */}
      <Typography 
        variant="caption" 
        noWrap
        sx={{ 
          flex: 1,
          fontSize: '10px',
          fontWeight: 'medium'
        }}
      >
        {track.name}
      </Typography>

      {/* Controlli essenziali */}
      <IconButton 
        size="small" 
        onClick={() => props.onTrackToggle && props.onTrackToggle(track.id)}
        sx={{ p: 0.125 }}
      >
        {track.visible ? 
          <VisibilityIcon sx={{ fontSize: '12px' }} /> : 
          <VisibilityOffIcon sx={{ fontSize: '12px' }} />
        }
      </IconButton>
    </Box>
  );
};

export default TrackHeader;
