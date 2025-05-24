/**
 * Componente per il form di login
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
 * Form di login
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Function} props.onSuccess - Callback chiamata al login con successo
 * @param {Function} props.onRegisterClick - Callback per passare alla registrazione
 * @returns {JSX.Element} - Componente React
 */
const LoginForm = ({ onSuccess, onRegisterClick }) => {
  // Stati per il form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  // Context di autenticazione
  const { signIn, loading, error } = useAuth();
  
  /**
   * Gestisce il submit del form
   * 
   * @param {Event} e - Evento submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione base
    if (!email || !password) {
      setFormError('Inserisci email e password');
      return;
    }
    
    // Reset degli errori
    setFormError('');
    
    // Tentativo di login
    const result = await signIn(email, password);
    
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
        Accedi a CasparCG Control Web
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
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Accedi'}
        </Button>
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2">
            Non hai un account?{' '}
            <Button 
              color="primary" 
              onClick={onRegisterClick}
              disabled={loading}
            >
              Registrati
            </Button>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default LoginForm;
