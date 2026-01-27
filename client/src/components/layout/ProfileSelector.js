/**
 * Componente per la selezione del profilo CasparCG
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Typography,
  Chip
} from '@mui/material';
import { useCaspar } from '../../contexts/CasparContext';

/**
 * Componente per la selezione del profilo CasparCG
 *
 * @returns {JSX.Element} - Componente React
 */
const ProfileSelector = () => {
  // CORREZIONE: Carica profili reali dal server tramite Socket.IO
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);

  const {
    activeProfileId,
    updateActiveProfile,
    socket,
    addLog
  } = useCaspar();

  const [loading, setLoading] = useState(false);

  // Stato locale per il profilo selezionato
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId || '');

  // CORREZIONE: Carica profili dal server all'avvio
  useEffect(() => {
    if (socket) {
      loadProfilesFromServer();
    }
  }, [socket]);

  // Aggiorna lo stato locale quando cambia il profilo attivo
  useEffect(() => {
    if (activeProfileId) {
      setSelectedProfileId(activeProfileId);
    }
  }, [activeProfileId]);

  // CORREZIONE: Funzione per caricare profili dal server
  const loadProfilesFromServer = () => {
    if (!socket) {
      console.warn('Socket non disponibile per caricare profili');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('🔄 [PROFILE_SELECTOR] Richiesta profili al server...');

    socket.emit('profiles:list', (response) => {
      setLoading(false);

      if (response.success) {
        console.log('✅ [PROFILE_SELECTOR] Profili ricevuti dal server:', response.profiles);
        setProfiles(response.profiles || []);

        if (typeof addLog === 'function') {
          addLog(`Caricati ${response.profiles?.length || 0} profili CasparCG dal server`);
        }

        // Se non c'è un profilo attivo e ci sono profili disponibili, seleziona il primo di default
        if (!activeProfileId && response.profiles && response.profiles.length > 0) {
          const defaultProfile = response.profiles.find(p => p.is_default_profile) || response.profiles[0];
          setSelectedProfileId(defaultProfile.id);
          updateActiveProfile(defaultProfile.id);
        }
      } else {
        console.error('❌ [PROFILE_SELECTOR] Errore caricamento profili:', response.message);
        setError(response.message || 'Errore nel caricamento dei profili');

        if (typeof addLog === 'function') {
          addLog(`Errore caricamento profili: ${response.message}`, 'error');
        }
      }
    });
  };

  // Gestisce il cambio di profilo
  const handleProfileChange = (event) => {
    const newProfileId = event.target.value;
    setSelectedProfileId(newProfileId);
    updateActiveProfile(newProfileId);
  };

  // CORREZIONE: Gestione migliore dei casi di errore e caricamento
  if (loading) {
    return (
      <Box sx={{ minWidth: 180, mr: 2, display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
        <Typography variant="body2" sx={{ color: 'white' }}>
          Caricamento profili...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minWidth: 180, mr: 2 }}>
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          Errore: {error}
        </Typography>
      </Box>
    );
  }

  // Se non ci sono profili, mostra messaggio informativo
  if (!profiles || profiles.length === 0) {
    return (
      <Box sx={{ minWidth: 180, mr: 2 }}>
        <Typography variant="body2" sx={{ color: 'warning.main' }}>
          Nessun profilo disponibile
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 180, mr: 2 }}>
      <FormControl fullWidth size="small" variant="outlined">
        <InputLabel id="profile-selector-label" sx={{ color: 'white' }}>
          Profilo CasparCG
        </InputLabel>
        <Select
          labelId="profile-selector-label"
          id="profile-selector"
          value={selectedProfileId}
          onChange={handleProfileChange}
          label="Profilo CasparCG"
          disabled={loading}
          sx={{
            color: 'white',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
            '.MuiSvgIcon-root': {
              color: 'white',
            }
          }}
        >
          {profiles.map((profile) => (
            <MenuItem key={profile.id} value={profile.id}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  {profile.name}
                </Typography>
                {profile.is_default_profile && (
                  <Chip
                    label="Default"
                    color="primary"
                    size="small"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ProfileSelector;
