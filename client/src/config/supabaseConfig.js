// Configurazione dinamica di Supabase per supportare modalità cloud e locale
// IMPORTANTE: Configurare le variabili d'ambiente nel file .env

const getSupabaseConfig = () => {
  const mode = process.env.SUPABASE_MODE || 'cloud';

  if (mode === 'local') {
    return {
      url: process.env.REACT_APP_SUPABASE_LOCAL_URL || 'http://127.0.0.1:55321',
      anonKey: process.env.REACT_APP_SUPABASE_LOCAL_ANON_KEY || 'your-local-anon-key',
      mode: 'local'
    };
  } else {
    // Cloud mode richiede configurazione tramite variabili d'ambiente
    const url = process.env.REACT_APP_SUPABASE_CLOUD_URL;
    const anonKey = process.env.REACT_APP_SUPABASE_CLOUD_ANON_KEY;

    if (!url || !anonKey) {
      console.error('⚠️ Supabase cloud config mancante! Configura REACT_APP_SUPABASE_CLOUD_URL e REACT_APP_SUPABASE_CLOUD_ANON_KEY nel file .env');
    }

    return {
      url: url || 'https://your-project.supabase.co',
      anonKey: anonKey || 'your-anon-key',
      mode: 'cloud'
    };
  }
};

export const supabaseConfig = getSupabaseConfig();

// Debug info
console.log(`🔧 Supabase Config: ${supabaseConfig.mode} mode`);
console.log(`📍 URL: ${supabaseConfig.url}`);
