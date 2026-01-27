/**
 * Componente per il form di registrazione
 */
import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Form di registrazione
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Function} props.onSuccess - Callback chiamata alla registrazione con successo
 * @param {Function} props.onLoginClick - Callback per passare al login
 * @returns {JSX.Element} - Componente React
 */
const RegisterForm = ({ onSuccess, onLoginClick }) => {
  // Stati per il form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState('');
  
  // Context di autenticazione
  const { signUp, loading, error } = useAuth();
  
  /**
   * Gestisce il submit del form
   * 
   * @param {Event} e - Evento submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione base
    if (!email || !password || !confirmPassword) {
      setFormError('Compila tutti i campi richiesti');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Le password non corrispondono');
      return;
    }
    
    if (password.length < 6) {
      setFormError('La password deve essere di almeno 6 caratteri');
      return;
    }
    
    // Reset degli errori
    setFormError('');
    
    // Metadati utente
    const metadata = {
      display_name: displayName || email.split('@')[0]
    };
    
    // Tentativo di registrazione
    const result = await signUp(email, password, metadata);
    
    if (result.success) {
      // Callback di successo
      if (onSuccess) {
        onSuccess();
      }
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Registrati a CasparCG Control Web
      </Typography>
      
      {/* Mostra errori */}
      {(formError || error) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError || error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        
        <TextField
          margin="normal"
          fullWidth
          id="displayName"
          label="Nome visualizzato"
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={loading}
          helperText="Opzionale, verrà usato il nome utente dell'email se non specificato"
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Conferma password"
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Registrati'}
        </Button>
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2">
            Hai già un account?{' '}
            <Button 
              color="primary" 
              onClick={onLoginClick}
              disabled={loading}
            >
              Accedi
            </Button>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RegisterForm;
