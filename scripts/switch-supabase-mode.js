#!/usr/bin/env node
/**
 * Script per cambiare la modalità di Supabase tra cloud e locale
 * 
 * Uso: node scripts/switch-supabase-mode.js [cloud|local]
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../.env');

function switchSupabaseMode(mode) {
  if (!['cloud', 'local'].includes(mode)) {
    console.error('❌ Modalità non valida. Usa "cloud" o "local"');
    process.exit(1);
  }

  try {
    // Leggi il file .env
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    
    // Aggiorna SUPABASE_MODE
    const updatedContent = envContent.replace(
      /SUPABASE_MODE=.*/,
      `SUPABASE_MODE=${mode}`
    );

    // Scrivi il file aggiornato
    fs.writeFileSync(ENV_FILE, updatedContent);
    
    console.log(`✅ Modalità Supabase cambiata a: ${mode}`);
    
    if (mode === 'cloud') {
      console.log('🌐 Ora l\'applicazione si connetterà al database cloud');
      console.log('📍 URL: https://wkqhkxzzozgxwkvrindq.supabase.co');
    } else {
      console.log('🏠 Ora l\'applicazione si connetterà al database locale');
      console.log('📍 URL: http://127.0.0.1:55321');
      console.log('💡 Assicurati che Supabase locale sia avviato: supabase start');
    }
    
    console.log('\n🔄 Riavvia l\'applicazione per applicare i cambiamenti');
    
  } catch (error) {
    console.error('❌ Errore durante il cambio di modalità:', error.message);
    process.exit(1);
  }
}

// Parsing degli argomenti
const args = process.argv.slice(2);
const mode = args[0];

if (!mode) {
  console.log('📋 Uso: node scripts/switch-supabase-mode.js [cloud|local]');
  console.log('\nMoalità disponibili:');
  console.log('  cloud  - Usa il database Supabase cloud');
  console.log('  local  - Usa il database Supabase locale');
  
  // Mostra modalità attuale
  try {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const currentMode = envContent.match(/SUPABASE_MODE=(.*)/)?.[1] || 'non definita';
    console.log(`\n🎯 Modalità attuale: ${currentMode}`);
  } catch (error) {
    console.log('\n⚠️  Impossibile leggere la modalità attuale');
  }
  
  process.exit(0);
}

switchSupabaseMode(mode);