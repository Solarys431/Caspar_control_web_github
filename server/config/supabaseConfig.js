// Configurazione dinamica di Supabase per il server
require('dotenv').config({ path: '../.env' });

const getSupabaseConfig = () => {
  const mode = process.env.SUPABASE_MODE || 'cloud';
  
  if (mode === 'local') {
    return {
      url: process.env.SUPABASE_LOCAL_URL || 'http://127.0.0.1:55321',
      serviceKey: process.env.SUPABASE_LOCAL_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      mode: 'local'
    };
  } else {
    return {
      url: process.env.SUPABASE_CLOUD_URL || 'https://wkqhkxzzozgxwkvrindq.supabase.co',
      serviceKey: process.env.SUPABASE_CLOUD_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcWhreHp6b3pneHdrdnJpbmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MjY4MzcsImV4cCI6MjA1NDEwMjgzN30.LTpdORwgVZIgoI3qtR2WmhZCYMVRL0JQyhabSmrgEJk',
      mode: 'cloud'
    };
  }
};

const supabaseConfig = getSupabaseConfig();

// Debug info
console.log(`🔧 Server Supabase Config: ${supabaseConfig.mode} mode`);
console.log(`📍 URL: ${supabaseConfig.url}`);

module.exports = { supabaseConfig };