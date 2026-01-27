import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Card,
  CardContent,
  CardActions,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCaspar } from '../contexts/CasparContext';

const Dashboard = () => {
  const {
    connected,
    host,
    port,
    logs,
    sendCommand,
    loading
  } = useCaspar();

  const [serverInfo, setServerInfo] = useState(null);
  const [channels, setChannels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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

  // Funzione per analizzare le informazioni sui canali
  const parseChannelsInfo = useCallback((response) => {
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

    return channels;
  }, []);

  // Funzione per ottenere informazioni sul server
  const fetchServerInfo = useCallback(async () => {
    setRefreshing(true);

    try {
      // Ottieni la versione del server
      const versionResult = await sendCommand('VERSION');

      if (versionResult.success) {
        const versionInfo = parseVersionInfo(versionResult.response);
        setServerInfo(versionInfo);
      }

      // Ottieni informazioni sui canali
      const infoResult = await sendCommand('INFO');

      if (infoResult.success) {
        const channelsInfo = parseChannelsInfo(infoResult.response);
        setChannels(channelsInfo);
      }
    } catch (error) {
      console.error('Errore nel recupero delle informazioni sul server:', error);
    } finally {
      setRefreshing(false);
    }
  }, [sendCommand, parseVersionInfo, parseChannelsInfo]);

  // Ottieni informazioni sul server quando la pagina viene caricata
  useEffect(() => {
    if (connected) {
      fetchServerInfo();
    }
  }, [connected, fetchServerInfo]);

  // Funzione per ottenere il colore dello stato del canale
  const getStatusColor = (status) => {
    switch (status) {
      case 'PLAYING':
        return 'success';
      case 'STOPPED':
        return 'error';
      case 'PAUSED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stato della connessione */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#2d2d2d'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Stato Connessione
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                Stato:
                <Chip
                  label={connected ? 'Connesso' : 'Non connesso'}
                  color={connected ? 'success' : 'error'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>

              {connected && (
                <>
                  <Typography variant="body1" gutterBottom>
                    Host: {host}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Porta: {port}
                  </Typography>
                </>
              )}
            </Box>

            {connected && serverInfo && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Versione: {serverInfo.version}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Canali */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#2d2d2d'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Canali
              </Typography>

              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchServerInfo}
                disabled={refreshing || loading || !connected}
                size="small"
              >
                {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {refreshing ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : connected ? (
              channels.length > 0 ? (
                <Grid container spacing={2}>
                  {channels.map((channel) => (
                    <Grid item xs={12} sm={6} key={channel.id}>
                      <Card sx={{ backgroundColor: '#3d3d3d' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Canale {channel.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Modalità video: {channel.videoMode}
                          </Typography>
                          <Chip
                            label={channel.status}
                            color={getStatusColor(channel.status)}
                            size="small"
                          />
                        </CardContent>
                        <CardActions>
                          <Button size="small" color="primary">
                            Dettagli
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Nessun canale trovato. Clicca su "Aggiorna" per ottenere informazioni sui canali.
                </Typography>
              )
            ) : (
              <Typography variant="body1" color="text.secondary">
                Connettiti a un server CasparCG per visualizzare le informazioni sui canali.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Log recenti */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: '#2d2d2d'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Log Recenti
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#1e1e1e', borderRadius: 1 }}>
              {logs.length > 0 ? (
                logs.slice(-20).map((log, index) => (
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
      </Grid>
    </Box>
  );
};

export default Dashboard;
