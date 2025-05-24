/**
 * Pagina di autenticazione
 */
import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';

/**
 * Pagina di autenticazione con form di login e registrazione
 * 
 * @returns {JSX.Element} - Componente React
 */
const Auth = () => {
  // Stati per la pagina
  const [isLogin, setIsLogin] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Hook di navigazione e location
  const navigate = useNavigate();
  const location = useLocation();
  
  // Context di autenticazione
  const { user, loading } = useAuth();
  
  // Redirect se l'utente è già autenticato
  useEffect(() => {
    if (user && !loading) {
      // Redirect alla pagina richiesta o alla home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);
  
  /**
   * Gestisce il successo del login
   */
  const handleLoginSuccess = () => {
    // Il redirect verrà gestito dall'useEffect
  };
  
  /**
   * Gestisce il successo della registrazione
   */
  const handleRegisterSuccess = () => {
    setSuccessMessage('Registrazione completata! Controlla la tua email per confermare l\'account.');
    // Torna al form di login
    setIsLogin(true);
  };
  
  /**
   * Passa al form di registrazione
   */
  const handleRegisterClick = () => {
    setIsLogin(false);
    setSuccessMessage('');
  };
  
  /**
   * Passa al form di login
   */
  const handleLoginClick = () => {
    setIsLogin(true);
    setSuccessMessage('');
  };
  
  // Se l'utente è già autenticato, non mostrare nulla durante il redirect
  if (user && !loading) {
    return null;
  }
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          CasparCG Control Web
        </Typography>
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        {isLogin ? (
          <LoginForm 
            onSuccess={handleLoginSuccess} 
            onRegisterClick={handleRegisterClick} 
          />
        ) : (
          <RegisterForm 
            onSuccess={handleRegisterSuccess} 
            onLoginClick={handleLoginClick} 
          />
        )}
      </Box>
    </Container>
  );
};

export default Auth;
