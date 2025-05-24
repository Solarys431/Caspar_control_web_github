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
  // Utilizziamo un array di profili di esempio per ora
  const [profiles, setProfiles] = useState([
    {
      id: '1',
      name: 'Profilo Predefinito',
      is_default_profile: true
    },
    {
      id: '2',
      name: 'Profilo TG',
      is_default_profile: false
    }
  ]);

  const {
    activeProfileId,
    updateActiveProfile
  } = useCaspar();

  const [loading, setLoading] = useState(false);

  // Stato locale per il profilo selezionato
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId || '');

  // Aggiorna lo stato locale quando cambia il profilo attivo
  useEffect(() => {
    if (activeProfileId) {
      setSelectedProfileId(activeProfileId);
    }
  }, [activeProfileId]);

  // Gestisce il cambio di profilo
  const handleProfileChange = (event) => {
    const newProfileId = event.target.value;
    setSelectedProfileId(newProfileId);
    updateActiveProfile(newProfileId);
  };

  // Se non ci sono profili, non mostrare il selettore
  if (!profiles || profiles.length === 0) {
    return null;
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
      {loading && (
        <CircularProgress
          size={20}
          sx={{
            position: 'absolute',
            top: '50%',
            right: 30,
            marginTop: '-10px',
            marginRight: '-10px',
          }}
        />
      )}
    </Box>
  );
};

export default ProfileSelector;
