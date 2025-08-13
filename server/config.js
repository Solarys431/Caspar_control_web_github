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
  },

  // 🔥 CONFIGURAZIONE TEMPLATE LOADING MODES
  templates: {
    mode: 'HTTP',  // 'FILE' o 'HTTP'
    httpBaseUrl: 'http://100.64.211.9:5000/templates',  // URL base per modalità HTTP
    localPath: path.resolve(__dirname, '../templates')   // Path locale template
  },

  // 🔥 CONFIGURAZIONE ASSETS HTTP SERVING (Struttura Organizzata)
  assets: {
    httpBaseUrl: 'http://100.64.211.9:5000/assets',     // URL base assets organizzati
    rootPath: path.resolve(__dirname, '../assets'),      // Assets root folder
    paths: {
      templates: path.resolve(__dirname, '../assets/templates'),  // Template HTML
      media: path.resolve(__dirname, '../assets/media'),         // Media generici
      images: path.resolve(__dirname, '../assets/images'),       // Immagini
      video: path.resolve(__dirname, '../assets/video'),         // Video  
      audio: path.resolve(__dirname, '../assets/audio'),         // Audio
      graphics: path.resolve(__dirname, '../assets/graphics'),   // Assets grafici
      logos: path.resolve(__dirname, '../assets/logos')          // Loghi
    },
    supportedFormats: {
      images: ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.bmp', '.tga'],
      video: ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm'],
      audio: ['.wav', '.mp3', '.flac', '.aac', '.ogg', '.wma']
    }
  },

  // 🔄 BACKWARD COMPATIBILITY - Configurazione legacy media  
  media: {
    httpBaseUrl: 'http://100.64.211.9:5000',  // URL base per vecchi endpoint
    paths: {
      media: path.resolve(__dirname, '../media'),        // Media generici
      images: path.resolve(__dirname, '../images'),      // Immagini
      video: path.resolve(__dirname, '../video'),        // Video  
      audio: path.resolve(__dirname, '../audio'),        // Audio
      graphics: path.resolve(__dirname, '../graphics'),  // Assets grafici
      logos: path.resolve(__dirname, '../client/public') // Loghi pubblici
    }
  }
};

module.exports = config;
