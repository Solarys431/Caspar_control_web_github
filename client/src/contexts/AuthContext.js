/**
 * Context per la gestione dell'autenticazione con Supabase
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../supabaseClient';

// Creazione del context
const AuthContext = createContext();

/**
 * Provider per il context di autenticazione
 * 
 * @param {Object} props - Proprietà del componente
 * @param {React.ReactNode} props.children - Componenti figli
 * @returns {JSX.Element} - Provider del context
 */
export const AuthProvider = ({ children }) => {
  // Stati per l'autenticazione
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effetto per controllare la sessione corrente all'avvio
  useEffect(() => {
    // Funzione per ottenere la sessione corrente
    const getSession = async () => {
      try {
        setLoading(true);
        
        // Ottieni la sessione corrente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          // Ottieni i dati dell'utente
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw userError;
          }
          
          setUser(user);
        }
      } catch (error) {
        console.error('Errore nel recupero della sessione:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();
    
    // Sottoscrizione agli eventi di cambio stato dell'autenticazione
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    // Pulizia della sottoscrizione
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  /**
   * Funzione per effettuare il login
   * 
   * @param {string} email - Email dell'utente
   * @param {string} password - Password dell'utente
   * @returns {Promise<Object>} - Risultato del login
   */
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Errore durante il login:', error.message);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Funzione per registrare un nuovo utente
   * 
   * @param {string} email - Email dell'utente
   * @param {string} password - Password dell'utente
   * @param {Object} metadata - Metadati aggiuntivi dell'utente
   * @returns {Promise<Object>} - Risultato della registrazione
   */
  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Errore durante la registrazione:', error.message);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Funzione per effettuare il logout
   * 
   * @returns {Promise<Object>} - Risultato del logout
   */
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Errore durante il logout:', error.message);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  // Valore del context
  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    // Utility per ottenere l'ID dell'utente corrente
    currentUserId: user ? user.id : null
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook per utilizzare il context di autenticazione
 * 
 * @returns {Object} - Valore del context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  
  return context;
};

export default AuthContext;
