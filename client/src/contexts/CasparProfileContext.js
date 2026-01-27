/**
 * Context per la gestione dei profili CasparCG
 *
 * Questo context gestisce i profili di configurazione CasparCG,
 * permettendo di selezionare un profilo attivo e di ottenere
 * informazioni sui server associati al profilo.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../supabaseClient';

// Crea il context
const CasparProfileContext = createContext();

// Hook personalizzato per utilizzare il context
export const useCasparProfile = () => useContext(CasparProfileContext);

// Provider del context
export const CasparProfileProvider = ({ children }) => {
  const { currentUserId } = useAuth();

  // Stati per i profili
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [profileServers, setProfileServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // CORREZIONE: Ref per evitare query ripetute
  const fetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Carica i profili all'avvio con debouncing
  useEffect(() => {
    if (currentUserId && !fetchingRef.current) {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;

      // Debouncing: evita fetch ripetuti entro 1 secondo
      if (timeSinceLastFetch > 1000) {
        fetchingRef.current = true;
        lastFetchTimeRef.current = now;

        Promise.all([fetchProfiles(), fetchUserPreference()])
          .finally(() => {
            fetchingRef.current = false;
          });
      }
    }
  }, [currentUserId]);

  // Carica i server associati al profilo attivo
  useEffect(() => {
    if (activeProfileId) {
      fetchProfileServers(activeProfileId);
    }
  }, [activeProfileId]);

  // Funzione per caricare i profili
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

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

  // Funzione per caricare la preferenza dell'utente
  const fetchUserPreference = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_profile_preferences')
        .select('default_casparcg_profile_id')
        .eq('user_id', currentUserId)
        .maybeSingle(); // Usa maybeSingle invece di single per evitare errori se non ci sono righe

      if (error && error.code !== 'PGRST116') { // PGRST116 è "No rows returned"
        throw error;
      }

      if (data && data.default_casparcg_profile_id) {
        setActiveProfileId(data.default_casparcg_profile_id);
      } else {
        // CORREZIONE CRITICA: Se l'utente non ha una preferenza, cerca un profilo di default
        console.log('🔍 [CASPAR PROFILE] Ricerca profilo di default...');

        const { data: defaultProfileData, error: defaultProfileError } = await supabase
          .from('casparcg_profiles')
          .select('id')
          .eq('is_default_profile', true)
          .maybeSingle(); // CORREZIONE: Usa maybeSingle() invece di single()

        if (defaultProfileError) {
          console.warn('⚠️ [CASPAR PROFILE] Errore ricerca profilo default:', defaultProfileError);
        }

        if (defaultProfileData) {
          console.log('✅ [CASPAR PROFILE] Profilo default trovato:', defaultProfileData.id);
          setActiveProfileId(defaultProfileData.id);
        } else {
          // CORREZIONE: Se non c'è un profilo default, prendi il primo disponibile
          console.log('🔍 [CASPAR PROFILE] Nessun profilo default, ricerca primo profilo disponibile...');

          const { data: firstProfileData, error: firstProfileError } = await supabase
            .from('casparcg_profiles')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (firstProfileError) {
            console.warn('⚠️ [CASPAR PROFILE] Errore ricerca primo profilo:', firstProfileError);
          } else if (firstProfileData) {
            console.log('✅ [CASPAR PROFILE] Primo profilo trovato:', firstProfileData.id);
            setActiveProfileId(firstProfileData.id);
          } else {
            console.warn('⚠️ [CASPAR PROFILE] Nessun profilo disponibile nel database');
          }
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento delle preferenze utente:', error.message);
      setError('Errore nel caricamento delle preferenze utente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per caricare i server associati a un profilo
  const fetchProfileServers = async (profileId) => {
    try {
      setLoading(true);
      setError(null);

      // Ottieni i dettagli del profilo
      const { data: profileData, error: profileError } = await supabase
        .from('casparcg_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;

      setActiveProfile(profileData);

      // Ottieni i server associati al profilo
      const { data: serversData, error: serversError } = await supabase
        .from('profile_server_assignments')
        .select(`
          id,
          server_role_in_profile,
          config_details,
          server:server_id (id, name, host, port, purpose, is_enabled)
        `)
        .eq('profile_id', profileId)
        .order('server_role_in_profile');

      if (serversError) throw serversError;

      setProfileServers(serversData || []);
    } catch (error) {
      console.error('Errore nel caricamento dei server del profilo:', error.message);
      setError('Errore nel caricamento dei server del profilo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per cambiare il profilo attivo
  const changeActiveProfile = async (profileId) => {
    try {
      setLoading(true);
      setError(null);

      // Aggiorna lo stato locale
      setActiveProfileId(profileId);

      // Aggiorna la preferenza dell'utente nel database
      if (currentUserId) {
        const { error } = await supabase
          .from('user_profile_preferences')
          .upsert({
            user_id: currentUserId,
            default_casparcg_profile_id: profileId
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Errore nel cambio del profilo attivo:', error.message);
      setError('Errore nel cambio del profilo attivo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per ottenere un server per ruolo
  const getServerByRole = useCallback((role) => {
    return profileServers.find(assignment => assignment.server_role_in_profile === role);
  }, [profileServers]);

  // Funzione per ottenere il server di playout principale
  const getMainPlayoutServer = useCallback(() => {
    return getServerByRole('MAIN_PLAYOUT');
  }, [getServerByRole]);

  // Funzione per ottenere il server di preview
  const getPreviewServer = useCallback(() => {
    return getServerByRole('PREVIEW_POOL');
  }, [getServerByRole]);

  // Funzione per ottenere un canale di preview disponibile
  const getAvailablePreviewChannel = useCallback(() => {
    const previewServer = getPreviewServer();
    if (!previewServer) return null;

    const config = previewServer.config_details || {};
    return {
      server: previewServer.server,
      channel: config.preview_channel || 3,
      layer: config.preview_layer_start || 100,
      config
    };
  }, [getPreviewServer]);

  // Valore del context
  const value = {
    profiles,
    activeProfileId,
    activeProfile,
    profileServers,
    loading,
    error,
    fetchProfiles,
    changeActiveProfile,
    getServerByRole,
    getMainPlayoutServer,
    getPreviewServer,
    getAvailablePreviewChannel
  };

  return (
    <CasparProfileContext.Provider value={value}>
      {children}
    </CasparProfileContext.Provider>
  );
};

export default CasparProfileContext;
