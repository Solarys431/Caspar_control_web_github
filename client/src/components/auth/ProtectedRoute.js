/**
 * Componente per proteggere le route che richiedono autenticazione
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente che protegge le route che richiedono autenticazione
 * 
 * @param {Object} props - Proprietà del componente
 * @param {React.ReactNode} props.children - Componenti figli
 * @returns {JSX.Element} - Componente React
 */
const ProtectedRoute = ({ children }) => {
  // Context di autenticazione
  const { user, loading } = useAuth();
  
  // Location corrente
  const location = useLocation();
  
  // Se il caricamento è in corso, mostra un loader
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // Se l'utente non è autenticato, redirect alla pagina di login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Se l'utente è autenticato, mostra i componenti figli
  return children;
};

export default ProtectedRoute;
