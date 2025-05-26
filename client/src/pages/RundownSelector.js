/**
 * Componente per la selezione e gestione dei rundown
 * Segue gli stessi pattern di ScaletteSelector per consistenza
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../supabaseClient';

/**
 * Componente per la selezione dei rundown
 */
const RundownSelector = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Stati per i rundown
  const [rundowns, setRundowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stati per il dialog di creazione
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRundownName, setNewRundownName] = useState('');

  // Stati per il menu delle azioni
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedRundown, setSelectedRundown] = useState(null);

  /**
   * Carica i rundown dal database
   */
  const fetchRundowns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Approccio in due passaggi per evitare ricorsione nelle policy RLS
      // 1. Prima otteniamo i rundown di cui l'utente è proprietario
      const { data: ownedRundowns, error: ownedError } = await supabase
        .from('rundowns')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          owner_id
        `)
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (ownedError) {
        throw ownedError;
      }

      // 2. Poi otteniamo i rundown di cui l'utente è collaboratore
      const { data: collaboratorData, error: collaboratorError } = await supabase
        .from('rundown_collaborators')
        .select(`
          rundown_id,
          role,
          rundowns:rundown_id (
            id,
            name,
            created_at,
            updated_at,
            owner_id
          )
        `)
        .eq('user_id', user.id);

      if (collaboratorError) {
        throw collaboratorError;
      }

      // Formatta i dati dei rundown di cui l'utente è proprietario
      const ownedFormattedData = ownedRundowns.map(rundown => ({
        ...rundown,
        isOwner: true,
        role: 'owner'
      }));

      // Formatta i dati dei rundown di cui l'utente è collaboratore
      const collaboratorFormattedData = collaboratorData
        .filter(item => item.rundowns) // Filtra elementi con rundown validi
        .map(item => ({
          ...item.rundowns,
          isOwner: false,
          role: item.role
        }));

      // Combina i due array evitando duplicati
      const allRundowns = [...ownedFormattedData];
      collaboratorFormattedData.forEach(collabRundown => {
        if (!allRundowns.find(owned => owned.id === collabRundown.id)) {
          allRundowns.push(collabRundown);
        }
      });

      // Ordina per data di aggiornamento
      allRundowns.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      setRundowns(allRundowns);
    } catch (error) {
      console.error('Errore nel caricamento dei rundown:', error.message);
      setError('Errore nel caricamento dei rundown: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // Carica i rundown all'avvio
  useEffect(() => {
    if (user?.id) {
      fetchRundowns();
    }
  }, [user?.id, fetchRundowns]);

  /**
   * Crea un nuovo rundown
   */
  const createRundown = async () => {
    try {
      if (!newRundownName.trim()) {
        setError('Inserisci un nome per il rundown');
        return;
      }

      setLoading(true);
      setError(null);

      // Crea il rundown
      const { data, error } = await supabase
        .from('rundowns')
        .insert([
          { name: newRundownName, owner_id: user.id }
        ])
        .select('id');

      if (error) {
        throw error;
      }

      // Chiudi il dialog e resetta il form
      setCreateDialogOpen(false);
      setNewRundownName('');

      // Aggiorna la lista dei rundown
      await fetchRundowns();

      // Naviga all'editor del rundown appena creato
      if (data && data.length > 0) {
        navigate(`/rundown/${data[0].id}`);
      }
    } catch (error) {
      console.error('Errore nella creazione del rundown:', error.message);
      setError('Errore nella creazione del rundown: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina un rundown
   */
  const deleteRundown = async (rundownId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo rundown? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('rundowns')
        .delete()
        .eq('id', rundownId);

      if (error) {
        throw error;
      }

      // Aggiorna la lista
      await fetchRundowns();
    } catch (error) {
      console.error('Errore nell\'eliminazione del rundown:', error.message);
      setError('Errore nell\'eliminazione del rundown: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestisce l'apertura del menu delle azioni
   */
  const handleMenuOpen = (event, rundown) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedRundown(rundown);
  };

  /**
   * Gestisce la chiusura del menu delle azioni
   */
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedRundown(null);
  };

  /**
   * Formatta la data per la visualizzazione
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Ottiene il colore del chip basato sul ruolo
   */
  const getRoleChipColor = (role) => {
    switch (role) {
      case 'owner':
        return 'primary';
      case 'editor':
        return 'secondary';
      case 'playout_operator':
        return 'success';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  /**
   * Ottiene l'etichetta del ruolo in italiano
   */
  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return 'Proprietario';
      case 'editor':
        return 'Editor';
      case 'playout_operator':
        return 'Operatore';
      case 'viewer':
        return 'Visualizzatore';
      default:
        return role;
    }
  };

  if (loading && rundowns.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          I Miei Rundown
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
        >
          Nuovo Rundown
        </Button>
      </Box>

      {/* Messaggio di errore */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Lista dei rundown */}
      <Grid container spacing={3}>
        {rundowns.map((rundown) => (
          <Grid item xs={12} sm={6} md={4} key={rundown.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1, mr: 1 }}>
                    {rundown.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, rundown)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={getRoleLabel(rundown.role)}
                    color={getRoleChipColor(rundown.role)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Aggiornato: {formatDate(rundown.updated_at)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Creato: {formatDate(rundown.created_at)}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<PlayIcon />}
                  onClick={() => navigate(`/rundown/${rundown.id}`)}
                >
                  Apri
                </Button>
                {rundown.isOwner && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/rundown/${rundown.id}/edit`)}
                  >
                    Modifica
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Messaggio se non ci sono rundown */}
      {rundowns.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nessun rundown trovato
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crea il tuo primo rundown per iniziare
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Crea Rundown
          </Button>
        </Box>
      )}

      {/* Dialog per creare un nuovo rundown */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crea Nuovo Rundown</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Rundown"
            fullWidth
            variant="outlined"
            value={newRundownName}
            onChange={(e) => setNewRundownName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                createRundown();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button onClick={createRundown} variant="contained">Crea</Button>
        </DialogActions>
      </Dialog>

      {/* Menu delle azioni */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/rundown/${selectedRundown?.id}`);
          handleMenuClose();
        }}>
          <PlayIcon sx={{ mr: 1 }} />
          Apri
        </MenuItem>
        {selectedRundown?.isOwner && (
          <>
            <MenuItem onClick={() => {
              navigate(`/rundown/${selectedRundown?.id}/edit`);
              handleMenuClose();
            }}>
              <EditIcon sx={{ mr: 1 }} />
              Modifica
            </MenuItem>
            <MenuItem onClick={() => {
              // TODO: Implementare dialog di condivisione
              handleMenuClose();
            }}>
              <ShareIcon sx={{ mr: 1 }} />
              Condividi
            </MenuItem>
            <MenuItem onClick={() => {
              deleteRundown(selectedRundown?.id);
              handleMenuClose();
            }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Elimina
            </MenuItem>
          </>
        )}
      </Menu>
    </Container>
  );
};

export default RundownSelector;
