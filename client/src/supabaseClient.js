/**
 * Client Supabase per l'integrazione con il backend
 * 
 * Questo file inizializza il client Supabase con configurazione dinamica
 * che supporta modalità cloud e locale.
 */
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config/supabaseConfig';

// Verifica che la configurazione sia valida
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.error(
    'Errore: Configurazione Supabase non valida. ' +
    `Modalità: ${supabaseConfig.mode}, URL: ${supabaseConfig.url}`
  );
}

// Crea il client Supabase con la configurazione dinamica
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

console.log(`✅ Supabase client inizializzato in modalità ${supabaseConfig.mode}`);

export default supabase;
