/**
 * Client Supabase per l'integrazione con il backend
 * 
 * Questo file inizializza il client Supabase con l'URL e la chiave anonima
 * definiti nelle variabili d'ambiente.
 */
import { createClient } from '@supabase/supabase-js';

// Ottieni le variabili d'ambiente
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verifica che le variabili d'ambiente siano definite
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Errore: Variabili d\'ambiente Supabase mancanti. ' +
    'Assicurati di aver definito REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY ' +
    'nel file .env o .env.local'
  );
}

// Crea il client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
