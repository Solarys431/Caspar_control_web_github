// Configurazione dinamica di Supabase per supportare modalità cloud e locale

const getSupabaseConfig = () => {
  const mode = process.env.SUPABASE_MODE || 'cloud';
  
  if (mode === 'local') {
    return {
      url: process.env.REACT_APP_SUPABASE_LOCAL_URL || 'http://127.0.0.1:55321',
      anonKey: process.env.REACT_APP_SUPABASE_LOCAL_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      mode: 'local'
    };
  } else {
    return {
      url: process.env.REACT_APP_SUPABASE_CLOUD_URL || 'https://wkqhkxzzozgxwkvrindq.supabase.co',
      anonKey: process.env.REACT_APP_SUPABASE_CLOUD_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcWhreHp6b3pneHdrdnJpbmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MjY4MzcsImV4cCI6MjA1NDEwMjgzN30.LTpdORwgVZIgoI3qtR2WmhZCYMVRL0JQyhabSmrgEJk',
      mode: 'cloud'
    };
  }
};

export const supabaseConfig = getSupabaseConfig();

// Debug info
console.log(`🔧 Supabase Config: ${supabaseConfig.mode} mode`);
console.log(`📍 URL: ${supabaseConfig.url}`);