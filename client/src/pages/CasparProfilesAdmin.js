/**
 * Pagina di amministrazione dei profili CasparCG
 *
 * Questa pagina permette di gestire i profili di configurazione CasparCG,
 * i server CasparCG e le assegnazioni dei server ai profili.
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  // Grid, // Non utilizzato per ora
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  // DialogContentText, // Non utilizzato per ora
  DialogActions,
  // Divider, // Non utilizzato per ora
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// import LinkIcon from '@mui/icons-material/Link'; // Non utilizzato per ora
// import LinkOffIcon from '@mui/icons-material/LinkOff'; // Non utilizzato per ora
import { useAuth } from '../contexts/AuthContext';
import supabase from '../supabaseClient';

/**
 * Componente TabPanel per gestire le tab
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Pagina di amministrazione dei profili CasparCG
 */
const CasparProfilesAdmin = () => {
  const { user, currentUserId } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Stati per i server CasparCG
  const [servers, setServers] = useState([]);
  const [serverDialogOpen, setServerDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [serverFormData, setServerFormData] = useState({
    name: '',
    host: '',
    port: 5250,
    purpose: '',
    is_enabled: true
  });

  // Stati per i profili CasparCG
  const [profiles, setProfiles] = useState([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    description: '',
    is_default_profile: false
  });

  // Stati per le assegnazioni server-profilo
  const [assignments, setAssignments] = useState([]);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentFormData, setAssignmentFormData] = useState({
    profile_id: '',
    server_id: '',
    server_role_in_profile: '',
    config_details: {}
  });

  // Stati generici
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verifica se l'utente è admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.rpc('is_admin', { user_id: currentUserId });
        if (error) throw error;
        setIsAdmin(data);

        if (!data) {
          setError('Accesso negato. Solo gli amministratori possono gestire i profili CasparCG.');
        }
      } catch (error) {
        console.error('Errore nel controllo dei permessi admin:', error.message);
        setError('Errore nel controllo dei permessi: ' + error.message);
      }
    };

    checkAdminStatus();
  }, [user, currentUserId]);

  // Carica i dati all'avvio
  useEffect(() => {
    if (isAdmin) {
      fetchServers();
      fetchProfiles();
      fetchAssignments();
    }
  }, [isAdmin]);

  // Gestione delle tab
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Funzioni per i server CasparCG
  const fetchServers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('casparcg_servers')
        .select('*')
        .order('name');

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error('Errore nel caricamento dei server:', error.message);
      setError('Errore nel caricamento dei server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleServerDialogOpen = (server = null) => {
    if (server) {
      setEditingServer(server);
      setServerFormData({
        name: server.name,
        host: server.host,
        port: server.port,
        purpose: server.purpose || '',
        is_enabled: server.is_enabled
      });
    } else {
      setEditingServer(null);
      setServerFormData({
        name: '',
        host: '',
        port: 5250,
        purpose: '',
        is_enabled: true
      });
    }
    setServerDialogOpen(true);
  };

  const handleServerDialogClose = () => {
    setServerDialogOpen(false);
    setEditingServer(null);
  };

  const handleServerFormChange = (e) => {
    const { name, value, checked } = e.target;
    setServerFormData(prev => ({
      ...prev,
      [name]: name === 'is_enabled' ? checked : value
    }));
  };

  const handleServerFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingServer) {
        // Aggiornamento server esistente
        const { error } = await supabase
          .from('casparcg_servers')
          .update(serverFormData)
          .eq('id', editingServer.id);

        if (error) throw error;
      } else {
        // Creazione nuovo server
        const { error } = await supabase
          .from('casparcg_servers')
          .insert(serverFormData);

        if (error) throw error;
      }

      // Ricarica i server
      await fetchServers();
      handleServerDialogClose();
    } catch (error) {
      console.error('Errore nel salvataggio del server:', error.message);
      setError('Errore nel salvataggio del server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleServerDelete = async (serverId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo server? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('casparcg_servers')
        .delete()
        .eq('id', serverId);

      if (error) throw error;

      // Ricarica i server
      await fetchServers();
    } catch (error) {
      console.error('Errore nell\'eliminazione del server:', error.message);
      setError('Errore nell\'eliminazione del server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per i profili CasparCG
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('casparcg_profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Errore nel caricamento dei profili:', error.message);
      setError('Errore nel caricamento dei profili: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileDialogOpen = (profile = null) => {
    if (profile) {
      setEditingProfile(profile);
      setProfileFormData({
        name: profile.name,
        description: profile.description || '',
        is_default_profile: profile.is_default_profile
      });
    } else {
      setEditingProfile(null);
      setProfileFormData({
        name: '',
        description: '',
        is_default_profile: false
      });
    }
    setProfileDialogOpen(true);
  };

  const handleProfileDialogClose = () => {
    setProfileDialogOpen(false);
    setEditingProfile(null);
  };

  const handleProfileFormChange = (e) => {
    const { name, value, checked } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: name === 'is_default_profile' ? checked : value
    }));
  };

  const handleProfileFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Se stiamo impostando questo profilo come default, dobbiamo rimuovere il flag default dagli altri profili
      if (profileFormData.is_default_profile) {
        const { error: updateError } = await supabase
          .from('casparcg_profiles')
          .update({ is_default_profile: false })
          .neq('id', editingProfile ? editingProfile.id : '00000000-0000-0000-0000-000000000000');

        if (updateError) throw updateError;
      }

      if (editingProfile) {
        // Aggiornamento profilo esistente
        const { error } = await supabase
          .from('casparcg_profiles')
          .update(profileFormData)
          .eq('id', editingProfile.id);

        if (error) throw error;
      } else {
        // Creazione nuovo profilo
        const { error } = await supabase
          .from('casparcg_profiles')
          .insert(profileFormData);

        if (error) throw error;
      }

      // Ricarica i profili
      await fetchProfiles();
      handleProfileDialogClose();
    } catch (error) {
      console.error('Errore nel salvataggio del profilo:', error.message);
      setError('Errore nel salvataggio del profilo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileDelete = async (profileId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo profilo? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('casparcg_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      // Ricarica i profili
      await fetchProfiles();
    } catch (error) {
      console.error('Errore nell\'eliminazione del profilo:', error.message);
      setError('Errore nell\'eliminazione del profilo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per le assegnazioni server-profilo
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_server_assignments')
        .select(`
          id,
          server_role_in_profile,
          config_details,
          profile:profile_id (id, name),
          server:server_id (id, name, host, port)
        `)
        .order('server_role_in_profile');

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Errore nel caricamento delle assegnazioni:', error.message);
      setError('Errore nel caricamento delle assegnazioni: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentDialogOpen = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setAssignmentFormData({
        profile_id: assignment.profile.id,
        server_id: assignment.server.id,
        server_role_in_profile: assignment.server_role_in_profile,
        config_details: assignment.config_details || {}
      });
    } else {
      setEditingAssignment(null);
      setAssignmentFormData({
        profile_id: '',
        server_id: '',
        server_role_in_profile: '',
        config_details: {}
      });
    }
    setAssignmentDialogOpen(true);
  };

  const handleAssignmentDialogClose = () => {
    setAssignmentDialogOpen(false);
    setEditingAssignment(null);
  };

  const handleAssignmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfigDetailsChange = (e) => {
    const { name, value } = e.target;
    setAssignmentFormData(prev => ({
      ...prev,
      config_details: {
        ...prev.config_details,
        [name]: name.includes('_layer') || name.includes('_channel') || name.includes('_port') ?
          parseInt(value, 10) : value
      }
    }));
  };

  const handleAssignmentFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Prepara i dati per l'inserimento/aggiornamento
      const assignmentData = {
        profile_id: assignmentFormData.profile_id,
        server_id: assignmentFormData.server_id,
        server_role_in_profile: assignmentFormData.server_role_in_profile,
        config_details: assignmentFormData.config_details
      };

      if (editingAssignment) {
        // Aggiornamento assegnazione esistente
        const { error } = await supabase
          .from('profile_server_assignments')
          .update(assignmentData)
          .eq('id', editingAssignment.id);

        if (error) throw error;
      } else {
        // Creazione nuova assegnazione
        const { error } = await supabase
          .from('profile_server_assignments')
          .insert(assignmentData);

        if (error) throw error;
      }

      // Ricarica le assegnazioni
      await fetchAssignments();
      handleAssignmentDialogClose();
    } catch (error) {
      console.error('Errore nel salvataggio dell\'assegnazione:', error.message);
      setError('Errore nel salvataggio dell\'assegnazione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentDelete = async (assignmentId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa assegnazione? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profile_server_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      // Ricarica le assegnazioni
      await fetchAssignments();
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'assegnazione:', error.message);
      setError('Errore nell\'eliminazione dell\'assegnazione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Rendering dell'interfaccia utente
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Amministrazione Profili CasparCG</Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          Accesso negato. Solo gli amministratori possono gestire i profili CasparCG.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Amministrazione Profili CasparCG</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs profili casparcg">
          <Tab label="Server CasparCG" />
          <Tab label="Profili" />
          <Tab label="Assegnazioni" />
        </Tabs>

        {/* Tab Server CasparCG */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Server CasparCG</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleServerDialogOpen()}
            >
              Aggiungi Server
            </Button>
          </Box>

          {loading && <CircularProgress sx={{ display: 'block', m: 'auto' }} />}

          <List>
            {servers.map((server) => (
              <ListItem key={server.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {server.name}
                      {!server.is_enabled && (
                        <Chip
                          label="Disabilitato"
                          color="error"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {`${server.host}:${server.port}`}
                      </Typography>
                      {server.purpose && (
                        <Chip
                          label={server.purpose}
                          color="info"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Modifica">
                    <IconButton edge="end" onClick={() => handleServerDialogOpen(server)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton edge="end" onClick={() => handleServerDelete(server.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Tab Profili */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Profili CasparCG</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleProfileDialogOpen()}
            >
              Aggiungi Profilo
            </Button>
          </Box>

          {loading && <CircularProgress sx={{ display: 'block', m: 'auto' }} />}

          <List>
            {profiles.map((profile) => (
              <ListItem key={profile.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {profile.name}
                      {profile.is_default_profile && (
                        <Chip
                          label="Default"
                          color="success"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={profile.description}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Modifica">
                    <IconButton edge="end" onClick={() => handleProfileDialogOpen(profile)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton edge="end" onClick={() => handleProfileDelete(profile.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Tab Assegnazioni */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Assegnazioni Server-Profilo</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleAssignmentDialogOpen()}
            >
              Aggiungi Assegnazione
            </Button>
          </Box>

          {loading && <CircularProgress sx={{ display: 'block', m: 'auto' }} />}

          <List>
            {assignments.map((assignment) => (
              <ListItem key={assignment.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" component="span">
                        {`${assignment.profile.name} → ${assignment.server.name}`}
                      </Typography>
                      <Chip
                        label={assignment.server_role_in_profile}
                        color="primary"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" component="span">
                      {`${assignment.server.host}:${assignment.server.port} - ${JSON.stringify(assignment.config_details || {})}`}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Modifica">
                    <IconButton edge="end" onClick={() => handleAssignmentDialogOpen(assignment)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton edge="end" onClick={() => handleAssignmentDelete(assignment.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Paper>

      {/* Dialog per aggiungere/modificare server */}
      <Dialog open={serverDialogOpen} onClose={handleServerDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingServer ? 'Modifica Server' : 'Aggiungi Server'}</DialogTitle>
        <form onSubmit={handleServerFormSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Nome Server"
              type="text"
              fullWidth
              value={serverFormData.name}
              onChange={handleServerFormChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="host"
              label="Host"
              type="text"
              fullWidth
              value={serverFormData.host}
              onChange={handleServerFormChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="port"
              label="Porta"
              type="number"
              fullWidth
              value={serverFormData.port}
              onChange={handleServerFormChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="purpose"
              label="Scopo (opzionale)"
              type="text"
              fullWidth
              value={serverFormData.purpose}
              onChange={handleServerFormChange}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={serverFormData.is_enabled}
                  onChange={handleServerFormChange}
                  name="is_enabled"
                />
              }
              label="Abilitato"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleServerDialogClose}>Annulla</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingServer ? 'Aggiorna' : 'Aggiungi'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog per aggiungere/modificare profili */}
      <Dialog open={profileDialogOpen} onClose={handleProfileDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProfile ? 'Modifica Profilo' : 'Aggiungi Profilo'}</DialogTitle>
        <form onSubmit={handleProfileFormSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Nome Profilo"
              type="text"
              fullWidth
              value={profileFormData.name}
              onChange={handleProfileFormChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Descrizione (opzionale)"
              type="text"
              fullWidth
              value={profileFormData.description}
              onChange={handleProfileFormChange}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={profileFormData.is_default_profile}
                  onChange={handleProfileFormChange}
                  name="is_default_profile"
                />
              }
              label="Profilo Predefinito"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleProfileDialogClose}>Annulla</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingProfile ? 'Aggiorna' : 'Aggiungi'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog per aggiungere/modificare assegnazioni */}
      <Dialog open={assignmentDialogOpen} onClose={handleAssignmentDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAssignment ? 'Modifica Assegnazione' : 'Aggiungi Assegnazione'}</DialogTitle>
        <form onSubmit={handleAssignmentFormSubmit}>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="profile-select-label">Profilo</InputLabel>
              <Select
                labelId="profile-select-label"
                name="profile_id"
                value={assignmentFormData.profile_id}
                onChange={handleAssignmentFormChange}
                required
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="server-select-label">Server</InputLabel>
              <Select
                labelId="server-select-label"
                name="server_id"
                value={assignmentFormData.server_id}
                onChange={handleAssignmentFormChange}
                required
              >
                {servers.map((server) => (
                  <MenuItem key={server.id} value={server.id}>
                    {server.name} ({server.host}:{server.port})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="role-select-label">Ruolo nel Profilo</InputLabel>
              <Select
                labelId="role-select-label"
                name="server_role_in_profile"
                value={assignmentFormData.server_role_in_profile}
                onChange={handleAssignmentFormChange}
                required
              >
                <MenuItem value="MAIN_PLAYOUT">MAIN_PLAYOUT</MenuItem>
                <MenuItem value="PREVIEW_POOL">PREVIEW_POOL</MenuItem>
                <MenuItem value="BACKUP_PLAYOUT">BACKUP_PLAYOUT</MenuItem>
                <MenuItem value="GRAPHICS_ONLY">GRAPHICS_ONLY</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle1" gutterBottom>
              Dettagli di Configurazione
            </Typography>

            {assignmentFormData.server_role_in_profile === 'PREVIEW_POOL' && (
              <>
                <TextField
                  margin="dense"
                  name="preview_channel"
                  label="Canale Preview"
                  type="number"
                  fullWidth
                  value={assignmentFormData.config_details.preview_channel || 3}
                  onChange={handleConfigDetailsChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  name="preview_layer_start"
                  label="Layer Iniziale"
                  type="number"
                  fullWidth
                  value={assignmentFormData.config_details.preview_layer_start || 100}
                  onChange={handleConfigDetailsChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  name="num_preview_layers"
                  label="Numero di Layer"
                  type="number"
                  fullWidth
                  value={assignmentFormData.config_details.num_preview_layers || 5}
                  onChange={handleConfigDetailsChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  name="udp_stream_port_start"
                  label="Porta UDP Iniziale"
                  type="number"
                  fullWidth
                  value={assignmentFormData.config_details.udp_stream_port_start || 6250}
                  onChange={handleConfigDetailsChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  name="web_rtc_path_prefix"
                  label="Prefisso Path WebRTC"
                  type="text"
                  fullWidth
                  value={assignmentFormData.config_details.web_rtc_path_prefix || 'previews/default/slot_'}
                  onChange={handleConfigDetailsChange}
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAssignmentDialogClose}>Annulla</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingAssignment ? 'Aggiorna' : 'Aggiungi'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CasparProfilesAdmin;