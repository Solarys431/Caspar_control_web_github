import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useCaspar } from '../../contexts/CasparContext';

const ConnectionDialog = ({ open, onClose }) => {
  const { connected, host, port, connect, loading, error } = useCaspar();
  const [formHost, setFormHost] = useState(host || '100.74.188.128');
  const [formPort, setFormPort] = useState(port || 5250);
  const [formError, setFormError] = useState('');

  // Aggiorna i valori del form quando cambiano host e port
  useEffect(() => {
    setFormHost(host || '100.74.188.128');
    setFormPort(port || 5250);
  }, [host, port]);

  // Resetta l'errore del form quando si apre il dialog
  useEffect(() => {
    if (open) {
      setFormError('');
    }
  }, [open]);

  const handleConnect = async () => {
    // Validazione
    if (!formHost.trim()) {
      setFormError('L\'host è obbligatorio');
      return;
    }

    if (!formPort) {
      setFormError('La porta è obbligatoria');
      return;
    }

    const portNumber = parseInt(formPort);
    if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
      setFormError('La porta deve essere un numero valido (1-65535)');
      return;
    }

    // Connessione
    const result = await connect(formHost, portNumber);
    
    if (result.success) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (!connected) {
      // Se non siamo connessi, non permettere di chiudere il dialog
      setFormError('Devi connetterti a un server CasparCG per continuare');
      return;
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={connected ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2d2d2d',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle>
        Connessione a CasparCG
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Inserisci i dettagli di connessione al server CasparCG.
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        
        <TextField
          autoFocus
          margin="dense"
          id="host"
          label="Host"
          type="text"
          fullWidth
          variant="outlined"
          value={formHost}
          onChange={(e) => setFormHost(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          id="port"
          label="Porta"
          type="number"
          fullWidth
          variant="outlined"
          value={formPort}
          onChange={(e) => setFormPort(e.target.value)}
          disabled={loading}
          InputProps={{ inputProps: { min: 1, max: 65535 } }}
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleCancel} 
          color="inherit"
          disabled={loading || !connected}
        >
          Annulla
        </Button>
        
        <Button 
          onClick={handleConnect} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Connessione...' : 'Connetti'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionDialog;
