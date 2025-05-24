/**
 * Configurazione del server CasparCG Control Web
 */
const path = require('path');

// Configurazione dei percorsi
const config = {
  // Percorsi dei media (come specificato nel file di configurazione CasparCG)
  mediaPaths: [
    'E:\\progetti AI\\nebula test\\nebula-tutorial\\storage\\media',
    'E:\\progetti AI\\nebula test\\caspar_control\\media'
  ],
  
  // Percorso dei template (come specificato nel file di configurazione CasparCG)
  templatePath: 'template\\',
  
  // Percorso per i file statici dell'applicazione
  staticPath: path.join(__dirname, '../client/build'),
  
  // Percorso per i loghi dell'applicazione
  logosPath: path.join(__dirname, '../client/public'),
  
  // Configurazione del server
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost'
  },
  
  // Configurazione di default per CasparCG
  caspar: {
    host: 'localhost',
    port: 5250,
    autoReconnect: true,
    reconnectInterval: 10000,
    maxReconnectAttempts: 3,
    timeout: 15000
  }
};

module.exports = config;
