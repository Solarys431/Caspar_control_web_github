import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
  Tooltip,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * Componente per la barra delle informazioni globali della scaletta
 *
 * @param {Object} props - Proprietà del componente
 * @param {string} props.scalettaName - Nome della scaletta
 * @param {Function} props.onScalettaNameChange - Funzione per gestire il cambio del nome
 * @param {string} props.totalDuration - Durata totale della scaletta
 * @param {string} props.userRole - Ruolo dell'utente per la scaletta
 * @param {Function} props.onOpenCollaborators - Funzione per aprire il dialogo dei collaboratori
 * @param {Function} props.onOpenSettings - Funzione per aprire le impostazioni
 * @param {Function} props.onSave - Funzione per salvare la scaletta
 * @param {boolean} props.modified - Se la scaletta è stata modificata
 * @returns {JSX.Element} - Componente React
 */
const ScalettaGlobalInfoBar = ({
  scalettaName,
  onScalettaNameChange,
  totalDuration = '00:00:00',
  userRole = '',
  onOpenCollaborators,
  onOpenSettings,
  onSave,
  modified = false
}) => {
  // Verifica se l'utente può modificare la scaletta
  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Funzione per formattare il ruolo dell'utente
  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return 'Proprietario';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Visualizzatore';
      case 'playout_operator':
        return 'Operatore Playout';
      default:
        return 'Sconosciuto';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: '64px',
      }}
    >
      {/* Sezione sinistra: Nome scaletta e durata */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
        <TextField
          value={scalettaName}
          onChange={(e) => onScalettaNameChange(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            width: '300px',
            mr: 2,
            '& .MuiInputBase-input': {
              fontWeight: 'bold',
            }
          }}
          disabled={!canEdit}
          placeholder="Nome Scaletta"
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <AccessTimeIcon color="action" sx={{ mr: 0.5 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Durata Totale: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{totalDuration}</span>
          </Typography>
        </Box>

        <Chip
          label={getRoleLabel(userRole)}
          size="small"
          color={userRole === 'owner' ? 'primary' : userRole === 'editor' ? 'secondary' : 'default'}
          sx={{ mr: 1 }}
        />

        {modified && (
          <Chip
            label="Modificato"
            size="small"
            color="warning"
          />
        )}
      </Box>

      {/* Sezione destra: Pulsanti azioni */}
      <Box>
        <Tooltip title="Collaboratori">
          <IconButton onClick={onOpenCollaborators}>
            <PeopleIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Impostazioni Scaletta">
          <IconButton onClick={onOpenSettings}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Salva Modifiche">
          <span>
            <IconButton
              onClick={onSave}
              color={modified ? "primary" : "default"}
              disabled={!modified || !canEdit}
            >
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ScalettaGlobalInfoBar;
