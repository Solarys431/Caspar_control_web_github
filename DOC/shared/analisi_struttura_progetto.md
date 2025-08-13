# Analisi Struttura Progetto CasparCG Control Web

## Panoramica Generale

Il progetto "CasparCG Control Web" è un'applicazione web professionale per il controllo di CasparCG con tema dark. L'architettura è basata su una struttura client-server:

- **Frontend**: Applicazione React con Material UI per l'interfaccia utente
- **Backend**: Server Node.js con Express che fa da ponte tra l'interfaccia web e il server CasparCG
- **Database**: Utilizzo di Supabase come backend database

## Struttura delle Directory

```
caspar_control_web_github/
├── client/              # Applicazione frontend React
├── server/              # Server Node.js/Express
├── database/            # Script SQL e schemi per database
├── DOC/                 # Documentazione
├── debug/               # File di debug
└── package.json         # Configurazione NPM principale
```

## Analisi Dettagliata

### 1. Client (Frontend)

La directory `client/` contiene l'applicazione React con la seguente struttura:

```
client/
├── public/             # Assets pubblici
└── src/                # Codice sorgente React
    ├── components/     # Componenti riutilizzabili
    │   ├── auth/       # Componenti per autenticazione
    │   ├── calendar/   # Componenti per gestione calendario
    │   ├── dialogs/    # Finestre di dialogo modali
    │   ├── layout/     # Componenti di layout (Header, Sidebar)
    │   ├── media/      # Componenti per gestione media
    │   └── scalette/   # Componenti per gestione scalette
    ├── contexts/       # Context API React per gestione dello stato
    ├── hooks/          # Hook personalizzati
    ├── pages/          # Pagine/Viste dell'applicazione
    │   ├── Rundown/    # Componenti per gestione rundown
    │   └── ScaletteEditor/ # Editor scalette
    ├── styles/         # Stili CSS globali
    ├── utils/          # Utility functions
    ├── App.js          # Componente principale
    ├── index.js        # Entry point
    ├── supabaseClient.js # Configurazione client Supabase
    └── theme.js        # Tema Material UI personalizzato
```

#### Principali Pagine dell'Applicazione

Il frontend è organizzato in diverse pagine che forniscono funzionalità specifiche:

1. **Dashboard** - Panoramica generale
2. **MediaBrowser** - Gestione dei file multimediali
3. **PlayoutControl** - Controllo della riproduzione
4. **GraphicsEditor** - Editor per la grafica
5. **MixerControl** - Controllo del mixer
6. **Rundown** - Gestione dei rundown
7. **ScaletteSelector/Editor** - Gestione e modifica delle scalette
8. **Settings** - Impostazioni dell'applicazione
9. **CasparProfilesAdmin** - Gestione dei profili CasparCG
10. **Auth** - Autenticazione utente

#### Gestione dello Stato

L'applicazione utilizza React Context API per la gestione dello stato attraverso vari provider:
- `AuthProvider` - Gestione autenticazione
- `RundownProvider` - Gestione stato dei rundown
- `CasparProfileProvider` - Gestione dei profili CasparCG
- `CalendarProvider` - Gestione del calendario

### 2. Server (Backend)

La directory `server/` contiene il backend Node.js che gestisce la comunicazione con CasparCG:

```
server/
├── caspar/              # Moduli specifici per CasparCG
│   ├── casparClient.js  # Client per CasparCG
│   ├── oscClient.js     # Client per protocollo OSC
│   └── profileManager.js # Gestione dei profili
├── config.js            # Configurazione del server
└── server.js            # Entry point principale del server
```

Il server gestisce:
- Connessione con CasparCG tramite protocollo AMCP
- Comunicazione OSC per feedback in tempo reale
- WebSocket tramite Socket.IO per comunicazione real-time con il client
- Gestione dei template e dei comandi per CasparCG

### 3. Database

La directory `database/` contiene gli script SQL per la creazione e la gestione del database:

```
database/
├── fix_rls_story_items.sql  # Script SQL per la gestione dei permessi
└── rundown_schema.sql       # Schema del database per i rundown
```

Il progetto utilizza Supabase come backend database, configurato tramite il client presente in `client/src/supabaseClient.js`.

### 4. Documentazione

La directory `DOC/` contiene la documentazione del progetto.

### 5. Configurazione Globale

Il file `package.json` nella root del progetto configura le dipendenze principali e gli script per gestire l'applicazione:

- Avvio contemporaneo di client e server
- Installazione di tutte le dipendenze
- Build del client

## Funzionalità Principali

1. **Autenticazione** - Sistema di login basato su Supabase
2. **Gestione Media** - Navigazione e gestione dei file multimediali
3. **Controllo Playout** - Interfaccia per controllare la riproduzione CasparCG
4. **Editor Grafico** - Creazione e gestione della grafica
5. **Gestione Rundown** - Creazione e gestione delle sequenze di riproduzione
6. **Mixer Control** - Controllo del mixer video
7. **Gestione Scalette** - Editor per scalette di produzione
8. **Impostazioni** - Configurazione dell'applicazione
9. **Gestione Profili CasparCG** - Amministrazione dei profili di configurazione

## Tecnologie Utilizzate

### Frontend
- React.js
- React Router per la navigazione
- Material UI per l'interfaccia
- Socket.IO client per comunicazione real-time
- React Big Calendar per la gestione del calendario
- Context API per la gestione dello stato

### Backend
- Node.js
- Express.js
- Socket.IO per WebSockets
- OSC per comunicazione con CasparCG

### Database
- Supabase (PostgreSQL)

### Altri
- HLS.js per lo streaming video
- Date-fns per la manipolazione delle date

## Flusso di Lavoro dell'Applicazione

1. L'utente si autentica tramite la pagina Auth
2. Il frontend comunica con il backend tramite API REST e WebSockets
3. Il backend si connette al server CasparCG tramite il protocollo AMCP
4. Il frontend riceve aggiornamenti in tempo reale sullo stato di CasparCG tramite WebSocket
5. I dati persistenti come rundown e scalette sono memorizzati in Supabase

## Considerazioni sull'Architettura

L'architettura del progetto segue un approccio modulare con separazione chiara tra:
- Interfaccia utente (client React)
- Logica di business e comunicazione (server Node.js)
- Persistenza dei dati (database Supabase)

Questa separazione permette:
1. Manutenibilità e scalabilità del codice
2. Riutilizzo dei componenti
3. Separazione delle responsabilità tra frontend e backend
4. Aggiornamenti indipendenti dei vari moduli

## Possibili Aree di Miglioramento

1. Implementazione di test automatici
2. Documentazione più dettagliata delle API
3. Containerizzazione con Docker per semplificare il deployment
4. Implementazione di cache per migliorare le prestazioni
5. Monitoraggio degli errori e logging avanzato
