import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCaspar } from '../contexts/CasparContext';

const Settings = () => {
  const {
    connected,
    host,
    port,
    connect,
    disconnect,
    logs,
    clearLogs,
    sendCommand,
    loading
  } = useCaspar();

  // Stato per le impostazioni di connessione
  const [connectionHost, setConnectionHost] = useState(host || '100.74.188.128');
  const [connectionPort, setConnectionPort] = useState(port || 5250);

  // Stato per le informazioni sul server
  const [serverInfo, setServerInfo] = useState(null);
  const [serverVersion, setServerVersion] = useState(null);

  // Stato per il comando personalizzato
  const [customCommand, setCustomCommand] = useState('');
  const [commandResponse, setCommandResponse] = useState('');

  // Stato per le impostazioni dell'interfaccia
  const [darkMode, setDarkMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);

  // Stato per gli errori
  const [error, setError] = useState(null);

  // Aggiorna le impostazioni di connessione quando cambiano host e port
  useEffect(() => {
    setConnectionHost(host || '100.74.188.128');
    setConnectionPort(port || 5250);
  }, [host, port]);

  // Funzione per analizzare le informazioni sulla versione
  const parseVersionInfo = useCallback((response) => {
    // Esempio di risposta: "201 VERSION OK\r\n2.3.0 STABLE"
    const lines = response.split('\r\n');
    if (lines.length >= 2) {
      return {
        version: lines[1].trim()
      };
    }
    return { version: 'Sconosciuta' };
  }, []);

  // Funzione per analizzare le informazioni sul server
  const parseInfo = useCallback((response) => {
    // Esempio di risposta: "200 INFO OK\r\n1 720p5000 PLAYING\r\n2 1080i5000 STOPPED"
    const lines = response.split('\r\n');
    const channels = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(' ');
        if (parts.length >= 3) {
          channels.push({
            id: parseInt(parts[0]),
            videoMode: parts[1],
            status: parts[2]
          });
        }
      }
    }

    return { channels };
  }, []);

  // Funzione per ottenere informazioni sul server
  const fetchServerInfo = useCallback(async () => {
    if (!connected) return;

    setError(null);

    try {
      // Ottieni la versione del server
      const versionResult = await sendCommand('VERSION');

      if (versionResult.success) {
        const versionInfo = parseVersionInfo(versionResult.response);
        setServerVersion(versionInfo);
      }

      // Ottieni informazioni sul server
      const infoResult = await sendCommand('INFO');

      if (infoResult.success) {
        const info = parseInfo(infoResult.response);
        setServerInfo(info);
      }
    } catch (error) {
      console.error('Errore nel recupero delle informazioni sul server:', error);
      setError(`Errore nel recupero delle informazioni sul server: ${error.message}`);
    }
  }, [connected, sendCommand, parseVersionInfo, parseInfo]);

  // Ottieni informazioni sul server quando la pagina viene caricata
  useEffect(() => {
    if (connected) {
      fetchServerInfo();
    }
  }, [connected, fetchServerInfo]);



  // Funzione per connettersi al server
  const handleConnect = async () => {
    setError(null);

    try {
      const result = await connect(connectionHost, parseInt(connectionPort));

      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      console.error('Errore di connessione:', error);
      setError(`Errore di connessione: ${error.message}`);
    }
  };

  // Funzione per disconnettersi dal server
  const handleDisconnect = async () => {
    setError(null);

    try {
      await disconnect();
    } catch (error) {
      console.error('Errore di disconnessione:', error);
      setError(`Errore di disconnessione: ${error.message}`);
    }
  };

  // Funzione per inviare un comando personalizzato
  const handleSendCommand = async () => {
    if (!connected || !customCommand) return;

    setError(null);
    setCommandResponse('');

    try {
      const result = await sendCommand(customCommand);

      if (result.success) {
        setCommandResponse(result.response);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Errore nell\'invio del comando:', error);
      setError(`Errore nell'invio del comando: ${error.message}`);
    }
  };

  // Funzione per salvare le impostazioni dell'interfaccia
  const handleSaveSettings = () => {
    // Salva le impostazioni nel localStorage
    localStorage.setItem('darkMode', darkMode.toString());
    localStorage.setItem('autoRefresh', autoRefresh.toString());
    localStorage.setItem('refreshInterval', refreshInterval.toString());

    // Mostra un messaggio di successo
    alert('Impostazioni salvate con successo');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Impostazioni
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Impostazioni di connessione */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: '#2d2d2d'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Connessione
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Host"
                  fullWidth
                  value={connectionHost}
                  onChange={(e) => setConnectionHost(e.target.value)}
                  margin="normal"
                  disabled={connected}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Porta"
                  type="number"
                  fullWidth
                  value={connectionPort}
                  onChange={(e) => setConnectionPort(parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 65535 } }}
                  margin="normal"
                  disabled={connected}
                />
              </Grid>

              <Grid item xs={12}>
                {connected ? (
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={handleDisconnect}
                    disabled={loading}
                  >
                    Disconnetti
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleConnect}
                    disabled={loading}
                  >
                    Connetti
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Informazioni sul server */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: '#2d2d2d'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Informazioni Server
              </Typography>

              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchServerInfo}
                disabled={!connected || loading}
                size="small"
              >
                Aggiorna
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : connected ? (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Stato:
                  <Chip
                    label="Connesso"
                    color="success"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>

                <Typography variant="body1" gutterBottom>
                  Host: {host}
                </Typography>

                <Typography variant="body1" gutterBottom>
                  Porta: {port}
                </Typography>

                {serverVersion && (
                  <Typography variant="body1" gutterBottom>
                    Versione: {serverVersion.version}
                  </Typography>
                )}

                {serverInfo && serverInfo.channels && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Canali:
                    </Typography>

                    <Grid container spacing={1}>
                      {serverInfo.channels.map((channel) => (
                        <Grid item xs={12} sm={6} key={channel.id}>
                          <Card sx={{ backgroundColor: '#3d3d3d' }}>
                            <CardContent>
                              <Typography variant="body1">
                                Canale {channel.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Modalità: {channel.videoMode}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Stato: {channel.status}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Connettiti a un server CasparCG per visualizzare le informazioni
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Comando personalizzato */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: '#2d2d2d'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Comando Personalizzato
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Comando AMCP"
                  fullWidth
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  margin="normal"
                  disabled={!connected}
                  placeholder="Es. PLAY 1-10 AMB"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendCommand}
                  disabled={!connected || !customCommand || loading}
                >
                  Invia Comando
                </Button>
              </Grid>

              {commandResponse && (
                <Grid item xs={12}>
                  <TextField
                    label="Risposta"
                    fullWidth
                    multiline
                    rows={4}
                    value={commandResponse}
                    InputProps={{ readOnly: true }}
                    margin="normal"
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Log */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: '#2d2d2d'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Log
              </Typography>

              <Button
                startIcon={<DeleteIcon />}
                onClick={clearLogs}
                color="error"
                size="small"
              >
                Pulisci Log
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#1e1e1e', borderRadius: 1 }}>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <ListItem key={index} divider={index < logs.length - 1}>
                    <ListItemText
                      primary={log.message}
                      secondary={log.timestamp}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: { wordBreak: 'break-word' }
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary'
                      }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="Nessun log disponibile"
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary',
                      align: 'center'
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Impostazioni dell'interfaccia */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: '#2d2d2d'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Impostazioni Interfaccia
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Tema Dark"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Aggiornamento Automatico"
                />
              </Grid>

              {autoRefresh && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Intervallo di Aggiornamento (secondi)"
                    type="number"
                    fullWidth
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    InputProps={{ inputProps: { min: 1 } }}
                    margin="normal"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveSettings}
                >
                  Salva Impostazioni
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Amministrazione Profili CasparCG */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: '#2d2d2d'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Amministrazione Profili CasparCG
            </Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }} />

            <Typography variant="body1" paragraph>
              Gestisci i profili di configurazione CasparCG, i server e le assegnazioni.
            </Typography>

            <Button
              variant="contained"
              color="primary"
              component="a"
              href="/caspar-profiles-admin"
            >
              Vai all'Amministrazione Profili
            </Button>
          </Paper>
        </Grid>

        {/* Informazioni sull'applicazione */}
        <Grid item xs={12}>
          <Accordion sx={{ backgroundColor: '#2d2d2d' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Informazioni sull'Applicazione</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" gutterBottom>
                CasparCG Control Web
              </Typography>
              <Typography variant="body2" gutterBottom>
                Versione: 1.0.0
              </Typography>
              <Typography variant="body2" gutterBottom>
                Applicazione web professionale per il controllo di CasparCG
              </Typography>
              <Typography variant="body2" gutterBottom>
                Sviluppata con React.js e Node.js
              </Typography>
              <Typography variant="body2" gutterBottom>
                © 2023 Tutti i diritti riservati
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
