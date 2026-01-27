/**
 * Configurazione del server CasparCG Control Web
 * IMPORTANTE: Configura questi valori in base al tuo ambiente
 */
const path = require('path');

// Configurazione dei percorsi
const config = {
  // Percorsi dei media (configura in base alla tua installazione CasparCG)
  mediaPaths: [
    process.env.CASPAR_MEDIA_PATH || '/path/to/caspar/media'
  ],

  // Percorso dei template
  templatePath: process.env.CASPAR_TEMPLATE_PATH || 'template/',

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
    host: process.env.CASPAR_HOST || 'localhost',
    port: parseInt(process.env.CASPAR_PORT) || 5250,
    autoReconnect: true,
    reconnectInterval: 10000,
    maxReconnectAttempts: 3,
    timeout: 15000
  },

  // Configurazione template loading
  templates: {
    mode: process.env.TEMPLATE_MODE || 'HTTP',  // 'FILE' o 'HTTP'
    httpBaseUrl: process.env.TEMPLATE_HTTP_URL || 'http://localhost:5000/templates',
    localPath: path.resolve(__dirname, '../templates')
  },

  // Configurazione assets HTTP
  assets: {
    httpBaseUrl: process.env.ASSETS_HTTP_URL || 'http://localhost:5000/assets',
    rootPath: path.resolve(__dirname, '../assets'),
    paths: {
      templates: path.resolve(__dirname, '../assets/templates'),
      media: path.resolve(__dirname, '../assets/media'),
      images: path.resolve(__dirname, '../assets/images'),
      video: path.resolve(__dirname, '../assets/video'),
      audio: path.resolve(__dirname, '../assets/audio'),
      graphics: path.resolve(__dirname, '../assets/graphics'),
      logos: path.resolve(__dirname, '../assets/logos')
    },
    supportedFormats: {
      images: ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.bmp', '.tga'],
      video: ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm'],
      audio: ['.wav', '.mp3', '.flac', '.aac', '.ogg', '.wma']
    }
  },

  // Configurazione legacy media (backward compatibility)
  media: {
    httpBaseUrl: process.env.MEDIA_HTTP_URL || 'http://localhost:5000',
    paths: {
      media: path.resolve(__dirname, '../media'),
      images: path.resolve(__dirname, '../images'),
      video: path.resolve(__dirname, '../video'),
      audio: path.resolve(__dirname, '../audio'),
      graphics: path.resolve(__dirname, '../graphics'),
      logos: path.resolve(__dirname, '../client/public')
    }
  }
};

module.exports = config;
