/**
 * Pagina per la selezione e gestione delle scalette
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../supabaseClient';

/**
 * Pagina per la selezione e gestione delle scalette
 *
 * @returns {JSX.Element} - Componente React
 */
const ScaletteSelector = () => {
  // Stati per la pagina
  const [scalette, setScalette] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newScalettaName, setNewScalettaName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScaletta, setSelectedScaletta] = useState(null);

  // Hook di navigazione
  const navigate = useNavigate();

  // Context di autenticazione
  const { user } = useAuth();

  /**
   * Carica le scalette dal database
   */
  const fetchScalette = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Approccio in due passaggi per evitare ricorsione nelle policy RLS
      // 1. Prima otteniamo le scalette di cui l'utente è proprietario
      const { data: ownedScalette, error: ownedError } = await supabase
        .from('scalette')
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

      // 2. Poi otteniamo le scalette di cui l'utente è collaboratore
      const { data: collaboratorData, error: collaboratorError } = await supabase
        .from('scaletta_collaborators')
        .select(`
          scaletta_id,
          role,
          scalette:scaletta_id (
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

      // Formatta i dati delle scalette di cui l'utente è proprietario
      const ownedFormattedData = ownedScalette.map(scaletta => ({
        ...scaletta,
        isOwner: true,
        role: 'owner'
      }));

      // Formatta i dati delle scalette di cui l'utente è collaboratore
      const collaboratorFormattedData = collaboratorData
        .filter(item => item.scalette) // Filtra eventuali scalette nulle
        .map(item => ({
          ...item.scalette,
          isOwner: false,
          role: item.role
        }));

      // Combina i due set di dati e rimuovi eventuali duplicati
      const combinedData = [
        ...ownedFormattedData,
        ...collaboratorFormattedData
      ].filter((scaletta, index, self) =>
        index === self.findIndex(s => s.id === scaletta.id)
      );

      // Ordina per data di aggiornamento
      combinedData.sort((a, b) =>
        new Date(b.updated_at) - new Date(a.updated_at)
      );

      setScalette(combinedData);
    } catch (error) {
      console.error('Errore nel caricamento delle scalette:', error.message);
      setError('Errore nel caricamento delle scalette: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user, setScalette, setLoading, setError]);

  // Carica le scalette all'avvio
  useEffect(() => {
    fetchScalette();
  }, [fetchScalette]);

  /**
   * Crea una nuova scaletta
   */
  const createScaletta = async () => {
    try {
      if (!newScalettaName.trim()) {
        setError('Inserisci un nome per la scaletta');
        return;
      }

      setLoading(true);
      setError(null);

      // Crea la scaletta senza usare .select() per evitare ricorsione
      const { data, error } = await supabase
        .from('scalette')
        .insert([
          { name: newScalettaName, owner_id: user.id }
        ])
        .select('id'); // Seleziona solo l'ID per evitare ricorsione

      if (error) {
        throw error;
      }

      // Chiudi il dialog e resetta il form
      setCreateDialogOpen(false);
      setNewScalettaName('');

      // Aggiorna la lista delle scalette
      await fetchScalette();

      // Naviga all'editor della scaletta appena creata
      if (data && data.length > 0) {
        navigate(`/scalette/${data[0].id}`);
      }
    } catch (error) {
      console.error('Errore nella creazione della scaletta:', error.message);
      setError('Errore nella creazione della scaletta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una scaletta
   */
  const deleteScaletta = async () => {
    try {
      if (!selectedScaletta) return;

      setLoading(true);
      setError(null);

      // Elimina la scaletta
      const { error } = await supabase
        .from('scalette')
        .delete()
        .eq('id', selectedScaletta.id);

      if (error) {
        throw error;
      }

      // Chiudi il dialog e resetta la selezione
      setDeleteDialogOpen(false);
      setSelectedScaletta(null);

      // Aggiorna la lista delle scalette
      await fetchScalette();
    } catch (error) {
      console.error('Errore nell\'eliminazione della scaletta:', error.message);
      setError('Errore nell\'eliminazione della scaletta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apre l'editor di una scaletta
   *
   * @param {Object} scaletta - Scaletta da aprire
   */
  const openScaletta = (scaletta) => {
    navigate(`/scalette/${scaletta.id}`);
  };

  /**
   * Renderizza il chip del ruolo
   *
   * @param {string} role - Ruolo dell'utente
   * @returns {JSX.Element} - Chip del ruolo
   */
  const renderRoleChip = (role) => {
    switch (role) {
      case 'owner':
        return <Chip label="Proprietario" color="primary" size="small" />;
      case 'editor':
        return <Chip label="Editor" color="secondary" size="small" />;
      case 'playout_operator':
        return <Chip label="Operatore" color="success" size="small" />;
      default:
        return <Chip label="Visualizzatore" color="default" size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Le mie scalette
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Nuova scaletta
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {loading && !scalette.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : scalette.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            Nessuna scaletta trovata. Crea la tua prima scaletta!
          </Typography>
        ) : (
          <List>
            {scalette.map((scaletta) => (
              <React.Fragment key={scaletta.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      {renderRoleChip(scaletta.role)}
                      <Tooltip title="Apri scaletta">
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => openScaletta(scaletta)}
                          sx={{ ml: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {scaletta.isOwner && (
                        <Tooltip title="Elimina scaletta">
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => {
                              setSelectedScaletta(scaletta);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={scaletta.name}
                    secondary={`Aggiornata: ${new Date(scaletta.updated_at).toLocaleString()}`}
                    onClick={() => openScaletta(scaletta)}
                    sx={{ cursor: 'pointer' }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Dialog per la creazione di una nuova scaletta */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Crea nuova scaletta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Inserisci un nome per la nuova scaletta.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Nome scaletta"
            type="text"
            fullWidth
            variant="outlined"
            value={newScalettaName}
            onChange={(e) => setNewScalettaName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button
            onClick={createScaletta}
            variant="contained"
            disabled={loading || !newScalettaName.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per l'eliminazione di una scaletta */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Elimina scaletta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler eliminare la scaletta "{selectedScaletta?.name}"? Questa azione non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
          <Button
            onClick={deleteScaletta}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Elimina'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScaletteSelector;
