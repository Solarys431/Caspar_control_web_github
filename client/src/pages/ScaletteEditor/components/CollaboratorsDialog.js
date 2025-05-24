/**
 * Dialog per la gestione dei collaboratori di una scaletta
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../../contexts/AuthContext';
import supabase from '../../../supabaseClient';

/**
 * Dialog per la gestione dei collaboratori di una scaletta
 *
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il dialog è aperto
 * @param {Function} props.onClose - Funzione per chiudere il dialog
 * @param {string} props.scalettaId - ID della scaletta
 * @param {string} props.scalettaName - Nome della scaletta
 * @param {boolean} props.isOwner - Se l'utente corrente è il proprietario della scaletta
 * @returns {JSX.Element} - Componente React
 */
const CollaboratorsDialog = ({ open, onClose, scalettaId, scalettaName, isOwner }) => {
  // Stati per il dialog
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);

  // Form data
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  // Context di autenticazione
  const { user } = useAuth();

  // Carica i collaboratori all'apertura del dialog
  useEffect(() => {
    if (open && scalettaId) {
      fetchCollaborators();
    }
  }, [open, scalettaId]);

  /**
   * Carica i collaboratori della scaletta
   */
  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ottieni i collaboratori
      const { data, error } = await supabase
        .from('scaletta_collaborators')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq('scaletta_id', scalettaId);

      if (error) {
        throw error;
      }

      // Array per memorizzare i dati formattati
      const formattedData = [];

      // Per ogni collaboratore, ottieni i dettagli dell'utente
      for (const item of data) {
        try {
          // Ottieni i dettagli dell'utente tramite RPC
          const { data: userData, error: userError } = await supabase
            .rpc('get_user_details', { user_id_to_find: item.user_id });

          if (userError) {
            console.error('Errore nel recupero dei dettagli utente:', userError);
            // Aggiungi comunque il collaboratore con informazioni limitate
            formattedData.push({
              id: item.id,
              userId: item.user_id,
              role: item.role,
              email: 'Email non disponibile',
              displayName: 'Utente sconosciuto',
              createdAt: new Date(item.created_at).toLocaleString()
            });
            continue;
          }

          // Se abbiamo ottenuto i dati dell'utente, aggiungi il collaboratore con tutte le informazioni
          if (userData) {
            formattedData.push({
              id: item.id,
              userId: item.user_id,
              role: item.role,
              email: userData.email || 'Email non disponibile',
              displayName: userData.display_name || userData.email?.split('@')[0] || 'Utente sconosciuto',
              createdAt: new Date(item.created_at).toLocaleString()
            });
          } else {
            // Se non abbiamo ottenuto i dati dell'utente, aggiungi il collaboratore con informazioni limitate
            formattedData.push({
              id: item.id,
              userId: item.user_id,
              role: item.role,
              email: 'Email non disponibile',
              displayName: 'Utente sconosciuto',
              createdAt: new Date(item.created_at).toLocaleString()
            });
          }
        } catch (e) {
          console.error('Errore nel recupero dei dettagli utente:', e);
          // Aggiungi comunque il collaboratore con informazioni limitate
          formattedData.push({
            id: item.id,
            userId: item.user_id,
            role: item.role,
            email: 'Email non disponibile',
            displayName: 'Utente sconosciuto',
            createdAt: new Date(item.created_at).toLocaleString()
          });
        }
      }

      setCollaborators(formattedData);
    } catch (error) {
      console.error('Errore nel caricamento dei collaboratori:', error.message);
      setError('Errore nel caricamento dei collaboratori: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiunge un nuovo collaboratore
   */
  const addCollaborator = async () => {
    try {
      if (!email.trim()) {
        setError('Inserisci un\'email valida');
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      // Cerca l'utente con l'email specificata
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_id_by_email', { email_to_find: email.trim() });

      if (userError) {
        throw userError;
      }

      if (!userData) {
        setError(`Nessun utente trovato con l'email ${email}`);
        return;
      }

      // Verifica se l'utente è già un collaboratore
      const { data: existingCollaborator, error: existingError } = await supabase
        .from('scaletta_collaborators')
        .select('id')
        .eq('scaletta_id', scalettaId)
        .eq('user_id', userData);

      if (existingError) {
        throw existingError;
      }

      if (existingCollaborator && existingCollaborator.length > 0) {
        setError('Questo utente è già un collaboratore della scaletta');
        return;
      }

      // Aggiungi il collaboratore
      const { error: insertError } = await supabase
        .from('scaletta_collaborators')
        .insert([
          {
            scaletta_id: scalettaId,
            user_id: userData,
            role: role
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      // Aggiorna la lista dei collaboratori
      await fetchCollaborators();

      // Resetta il form
      setEmail('');
      setRole('viewer');
      setAddMode(false);
      setSuccess('Collaboratore aggiunto con successo');
    } catch (error) {
      console.error('Errore nell\'aggiunta del collaboratore:', error.message);
      setError('Errore nell\'aggiunta del collaboratore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiorna il ruolo di un collaboratore
   */
  const updateCollaborator = async () => {
    try {
      if (!selectedCollaborator) return;

      setLoading(true);
      setError(null);
      setSuccess(null);

      // Aggiorna il ruolo del collaboratore
      const { error } = await supabase
        .from('scaletta_collaborators')
        .update({ role: role })
        .eq('id', selectedCollaborator.id);

      if (error) {
        throw error;
      }

      // Aggiorna la lista dei collaboratori
      await fetchCollaborators();

      // Resetta il form
      setRole('viewer');
      setEditMode(false);
      setSelectedCollaborator(null);
      setSuccess('Ruolo del collaboratore aggiornato con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento del collaboratore:', error.message);
      setError('Errore nell\'aggiornamento del collaboratore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rimuove un collaboratore
   *
   * @param {Object} collaborator - Collaboratore da rimuovere
   */
  const removeCollaborator = async (collaborator) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Rimuovi il collaboratore
      const { error } = await supabase
        .from('scaletta_collaborators')
        .delete()
        .eq('id', collaborator.id);

      if (error) {
        throw error;
      }

      // Aggiorna la lista dei collaboratori
      await fetchCollaborators();

      setSuccess('Collaboratore rimosso con successo');
    } catch (error) {
      console.error('Errore nella rimozione del collaboratore:', error.message);
      setError('Errore nella rimozione del collaboratore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renderizza il chip del ruolo
   *
   * @param {string} role - Ruolo del collaboratore
   * @returns {JSX.Element} - Chip del ruolo
   */
  const renderRoleChip = (role) => {
    switch (role) {
      case 'editor':
        return <Chip label="Editor" color="secondary" size="small" />;
      case 'playout_operator':
        return <Chip label="Operatore" color="success" size="small" />;
      default:
        return <Chip label="Visualizzatore" color="default" size="small" />;
    }
  };

  /**
   * Apre il form per modificare un collaboratore
   *
   * @param {Object} collaborator - Collaboratore da modificare
   */
  const handleEditCollaborator = (collaborator) => {
    setSelectedCollaborator(collaborator);
    setRole(collaborator.role);
    setEditMode(true);
    setAddMode(false);
  };

  /**
   * Apre il form per aggiungere un collaboratore
   */
  const handleAddCollaborator = () => {
    setAddMode(true);
    setEditMode(false);
    setSelectedCollaborator(null);
    setEmail('');
    setRole('viewer');
  };

  /**
   * Annulla l'operazione corrente
   */
  const handleCancel = () => {
    setAddMode(false);
    setEditMode(false);
    setSelectedCollaborator(null);
    setEmail('');
    setRole('viewer');
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Gestione Collaboratori - {scalettaName}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {isOwner && !addMode && !editMode && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAddCollaborator}
              disabled={loading}
            >
              Aggiungi Collaboratore
            </Button>
          </Box>
        )}

        {addMode && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Aggiungi Collaboratore
            </Typography>

            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              disabled={loading}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="role-select-label">Ruolo</InputLabel>
              <Select
                labelId="role-select-label"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="Ruolo"
                disabled={loading}
              >
                <MenuItem value="viewer">Visualizzatore</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="playout_operator">Operatore Playout</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleCancel} disabled={loading}>
                Annulla
              </Button>
              <Button
                variant="contained"
                onClick={addCollaborator}
                disabled={loading || !email.trim()}
              >
                {loading ? <CircularProgress size={24} /> : 'Aggiungi'}
              </Button>
            </Box>
          </Box>
        )}

        {editMode && selectedCollaborator && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Modifica Ruolo - {selectedCollaborator.displayName}
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel id="edit-role-select-label">Ruolo</InputLabel>
              <Select
                labelId="edit-role-select-label"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="Ruolo"
                disabled={loading}
              >
                <MenuItem value="viewer">Visualizzatore</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="playout_operator">Operatore Playout</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleCancel} disabled={loading}>
                Annulla
              </Button>
              <Button
                variant="contained"
                onClick={updateCollaborator}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Aggiorna'}
              </Button>
            </Box>
          </Box>
        )}

        <Typography variant="h6" gutterBottom>
          Collaboratori
        </Typography>

        {loading && !collaborators.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : collaborators.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            Nessun collaboratore trovato.
          </Typography>
        ) : (
          <List>
            {collaborators.map((collaborator) => (
              <React.Fragment key={collaborator.id}>
                <ListItem>
                  <ListItemText
                    primary={collaborator.displayName}
                    secondary={collaborator.email}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderRoleChip(collaborator.role)}

                    {isOwner && (
                      <>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEditCollaborator(collaborator)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => removeCollaborator(collaborator)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CollaboratorsDialog;
