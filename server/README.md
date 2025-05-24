# CasparCG Control Web

CasparCG Control Web è un'applicazione web professionale per il controllo completo del server CasparCG. L'applicazione consente agli utenti di gestire tutti gli aspetti del server, inclusi playout video, grafica in sovraimpressione, controllo mixer e gestione rundown/playlist.

## Caratteristiche Principali

- **Browser Media**: Visualizza e seleziona i file multimediali disponibili sul server CasparCG.
- **Controllo Playout**: Controlla la riproduzione dei file multimediali sul server CasparCG.
- **Editor Grafica**: Crea e modifica template grafici per il server CasparCG.
- **Controllo Mixer**: Regola le proprietà di posizione, scala, opacità, ecc. dei layer.
- **Rundown/Playlist**: Crea e gestisce playlist di elementi da riprodurre sul server CasparCG.
- **Tema Dark**: Interfaccia utente con tema dark per un aspetto professionale.

## Tecnologie Utilizzate

### Frontend
- **Framework**: React.js
- **UI Library**: Material-UI con tema dark personalizzato
- **State Management**: Context API
- **Comunicazione API**: Axios
- **Drag and Drop**: react-beautiful-dnd
- **Anteprima Video**: react-player

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Comunicazione con CasparCG**: Socket TCP
- **API**: RESTful
- **WebSockets**: Socket.io per aggiornamenti in tempo reale

## Requisiti

- Node.js 14.x o superiore
- CasparCG Server 2.3 o superiore

## Installazione

1. Clona il repository:
   ```
   git clone https://github.com/tuonome/casparcg-control-web.git
   ```

2. Installa le dipendenze del backend:
   ```
   cd casparcg-control-web/server
   npm install
   ```

3. Installa le dipendenze del frontend:
   ```
   cd ../client
   npm install
   ```

## Utilizzo

### Avvio del Backend

```
cd casparcg-control-web/server
npm start
```

Il server sarà in ascolto sulla porta 5000 (o sulla porta specificata nella variabile d'ambiente PORT).

### Avvio del Frontend in Modalità Sviluppo

```
cd casparcg-control-web/client
npm start
```

L'applicazione sarà disponibile all'indirizzo http://localhost:3000.

### Build del Frontend per la Produzione

```
cd casparcg-control-web/client
npm run build
```

I file di build saranno disponibili nella directory `build`.

## Connessione al Server CasparCG

1. Avvia l'applicazione
2. Nella schermata di connessione, inserisci l'host e la porta del server CasparCG
3. Clicca su "Connetti"

## Utilizzo delle Funzionalità Principali

### Browser Media
- Sfoglia i file multimediali disponibili sul server
- Visualizza anteprime dei file
- Riproduci i file direttamente o aggiungili al rundown

### Controllo Playout
- Riproduci, metti in pausa e ferma i file multimediali
- Seleziona canale e layer
- Imposta opzioni di riproduzione come loop, transizioni, ecc.

### Editor Grafica
- Crea e modifica template grafici
- Anteprima in tempo reale
- Aggiungi, riproduci, aggiorna e rimuovi template

### Controllo Mixer
- Regola posizione, scala, opacità, ecc. dei layer
- Imposta transizioni
- Visualizza in tempo reale le modifiche

### Rundown/Playlist
- Crea e gestisci playlist
- Drag and drop di elementi
- Riproduzione automatica degli elementi
- Salva e carica playlist

## Licenza

MIT

## Contatti

Per domande o supporto, contattare [tuo-indirizzo-email].

## Ringraziamenti

- [CasparCG Team](https://github.com/CasparCG) per il fantastico server CasparCG
- Tutti i contributori e la community di CasparCG
