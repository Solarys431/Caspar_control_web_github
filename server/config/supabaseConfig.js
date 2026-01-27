// Configurazione dinamica di Supabase per il server
// IMPORTANTE: Configurare le variabili d'ambiente nel file .env
require('dotenv').config({ path: '../.env' });

const getSupabaseConfig = () => {
  const mode = process.env.SUPABASE_MODE || 'cloud';

  if (mode === 'local') {
    return {
      url: process.env.SUPABASE_LOCAL_URL || 'http://127.0.0.1:55321',
      serviceKey: process.env.SUPABASE_LOCAL_SERVICE_KEY || 'your-local-service-key',
      mode: 'local'
    };
  } else {
    // Cloud mode richiede configurazione tramite variabili d'ambiente
    const url = process.env.SUPABASE_CLOUD_URL;
    const serviceKey = process.env.SUPABASE_CLOUD_SERVICE_KEY;

    if (!url || !serviceKey) {
      console.error('⚠️ Supabase cloud config mancante! Configura SUPABASE_CLOUD_URL e SUPABASE_CLOUD_SERVICE_KEY nel file .env');
    }

    return {
      url: url || 'https://your-project.supabase.co',
      serviceKey: serviceKey || 'your-service-key',
      mode: 'cloud'
    };
  }
};

const supabaseConfig = getSupabaseConfig();

// Debug info
console.log(`🔧 Server Supabase Config: ${supabaseConfig.mode} mode`);
console.log(`📍 URL: ${supabaseConfig.url}`);

module.exports = { supabaseConfig };
