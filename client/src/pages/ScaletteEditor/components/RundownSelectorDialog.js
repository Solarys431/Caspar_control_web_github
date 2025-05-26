/**
 * Dialogo per selezionare il rundown di destinazione per l'invio
 * Include verifica permessi e creazione nuovo rundown
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Alert,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  PlaylistPlay as PlaylistPlayIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import supabase from '../../../supabaseClient';
import { canUserEditRundown } from '../../../utils/permissionsChecker';

/**
 * Dialogo per selezione rundown di destinazione
 */
const RundownSelectorDialog = ({
  open = false,
  onClose,
  onConfirm,
  loading = false
}) => {
  // Stati locali
  const [rundowns, setRundowns] = useState([]);
  const [selectedRundown, setSelectedRundown] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [loadingRundowns, setLoadingRundowns] = useState(false);
  const [createNew, setCreateNew] = useState(false);
  const [newRundownName, setNewRundownName] = useState('');
  const [error, setError] = useState(null);

  // Contesto autenticazione
  const { currentUserId } = useAuth();

  // Carica i rundown disponibili
  useEffect(() => {
    if (open && currentUserId) {
      loadAvailableRundowns();
    }
  }, [open, currentUserId]);

  /**
   * Carica i rundown disponibili per l'utente
   */
  const loadAvailableRundowns = async () => {
    try {
      setLoadingRundowns(true);
      setError(null);

      // CORREZIONE CRITICA: Query corretta per ottenere rundown di cui l'utente è proprietario o collaboratore
      // Prima otteniamo i rundown di cui l'utente è proprietario
      const { data: ownedRundowns, error: ownedError } = await supabase
        .from('rundowns')
        .select(`
          id,
          name,
          owner_id,
          created_at,
          rundown_collaborators (
            user_id,
            role
          )
        `)
        .eq('owner_id', currentUserId);

      if (ownedError) {
        throw ownedError;
      }

      // Poi otteniamo i rundown di cui l'utente è collaboratore
      const { data: collaboratorRundowns, error: collaboratorError } = await supabase
        .from('rundown_collaborators')
        .select(`
          rundown_id,
          role,
          rundowns (
            id,
            name,
            owner_id,
            created_at
          )
        `)
        .eq('user_id', currentUserId);

      if (collaboratorError) {
        throw collaboratorError;
      }

      // Combina i risultati evitando duplicati
      const rundownsMap = new Map();

      // Aggiungi rundown di proprietà
      ownedRundowns?.forEach(rundown => {
        rundownsMap.set(rundown.id, {
          ...rundown,
          userRole: 'owner'
        });
      });

      // Aggiungi rundown di collaborazione
      collaboratorRundowns?.forEach(collab => {
        if (collab.rundowns && !rundownsMap.has(collab.rundowns.id)) {
          rundownsMap.set(collab.rundowns.id, {
            ...collab.rundowns,
            userRole: collab.role,
            rundown_collaborators: [{ user_id: currentUserId, role: collab.role }]
          });
        }
      });

      const rundownsData = Array.from(rundownsMap.values());

      // Verifica i permessi per ogni rundown (usa il ruolo già ottenuto)
      const permissions = {};
      for (const rundown of rundownsData || []) {
        const userRole = rundown.userRole || 'viewer';
        permissions[rundown.id] = {
          role: userRole,
          canEdit: canUserEditRundown(userRole)
        };
      }

      setRundowns(rundownsData || []);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Errore nel caricamento dei rundown:', error);
      setError(`Errore nel caricamento dei rundown: ${error.message}`);
    } finally {
      setLoadingRundowns(false);
    }
  };

  /**
   * Crea un nuovo rundown
   */
  const handleCreateNewRundown = async () => {
    if (!newRundownName.trim()) {
      setError('Il nome del rundown è obbligatorio');
      return;
    }

    try {
      setLoadingRundowns(true);
      setError(null);

      const { data: newRundown, error: createError } = await supabase
        .from('rundowns')
        .insert([
          {
            name: newRundownName.trim(),
            owner_id: currentUserId
          }
        ])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Aggiungi il nuovo rundown alla lista
      setRundowns(prev => [newRundown, ...prev]);
      setUserPermissions(prev => ({
        ...prev,
        [newRundown.id]: {
          role: 'owner',
          canEdit: true
        }
      }));

      // Seleziona automaticamente il nuovo rundown
      setSelectedRundown(newRundown);
      setCreateNew(false);
      setNewRundownName('');
    } catch (error) {
      console.error('Errore nella creazione del rundown:', error);
      setError(`Errore nella creazione del rundown: ${error.message}`);
    } finally {
      setLoadingRundowns(false);
    }
  };

  /**
   * Gestisce la conferma della selezione
   */
  const handleConfirm = () => {
    if (!selectedRundown) {
      setError('Seleziona un rundown di destinazione');
      return;
    }

    const permissions = userPermissions[selectedRundown.id];
    if (!permissions?.canEdit) {
      setError('Non hai i permessi per modificare il rundown selezionato');
      return;
    }

    onConfirm(selectedRundown);
  };

  /**
   * Ottiene l'icona per il ruolo utente
   */
  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <PersonIcon color="primary" />;
      case 'editor':
      case 'playout_operator':
        return <GroupIcon color="secondary" />;
      default:
        return <LockIcon color="disabled" />;
    }
  };

  /**
   * Ottiene il colore del chip per il ruolo
   */
  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return 'primary';
      case 'editor':
        return 'secondary';
      case 'playout_operator':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PlaylistPlayIcon color="primary" />
          <Typography variant="h6">
            Seleziona Rundown di Destinazione
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Seleziona il rundown dove inviare gli elementi della scaletta.
          Puoi modificare solo i rundown di cui sei proprietario, editor o playout operator.
        </Typography>

        {/* Opzione per creare nuovo rundown */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={createNew}
                onChange={(e) => setCreateNew(e.target.checked)}
                disabled={loadingRundowns}
              />
            }
            label="Crea nuovo rundown"
          />

          {createNew && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Nome nuovo rundown"
                value={newRundownName}
                onChange={(e) => setNewRundownName(e.target.value)}
                size="small"
                fullWidth
                disabled={loadingRundowns}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNewRundown}
                disabled={loadingRundowns || !newRundownName.trim()}
              >
                Crea
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Lista rundown disponibili */}
        {loadingRundowns ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {rundowns.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="Nessun rundown disponibile"
                  secondary="Crea un nuovo rundown per iniziare"
                />
              </ListItem>
            ) : (
              rundowns.map((rundown) => {
                const permissions = userPermissions[rundown.id];
                const isSelected = selectedRundown?.id === rundown.id;
                const canEdit = permissions?.canEdit || false;

                return (
                  <ListItem key={rundown.id} disablePadding>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => setSelectedRundown(rundown)}
                      disabled={!canEdit}
                    >
                      <ListItemIcon>
                        {getRoleIcon(permissions?.role)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {rundown.name}
                            </Typography>
                            {canEdit && (
                              <CheckCircleIcon color="success" fontSize="small" />
                            )}
                            {!canEdit && (
                              <WarningIcon color="warning" fontSize="small" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Chip
                              label={permissions?.role || 'viewer'}
                              size="small"
                              color={getRoleColor(permissions?.role)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Creato: {new Date(rundown.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
        >
          Annulla
        </Button>

        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || !selectedRundown || !userPermissions[selectedRundown?.id]?.canEdit}
          startIcon={loading ? <CircularProgress size={20} /> : <PlaylistPlayIcon />}
          color="primary"
        >
          {loading ? 'Invio in corso...' : 'Conferma Selezione'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RundownSelectorDialog;
