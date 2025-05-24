# Guida Completa a CasparCG

## Indice

1. [Introduzione a CasparCG](#introduzione-a-casparcg)
2. [Architettura di CasparCG](#architettura-di-casparcg)
3. [Installazione e Configurazione](#installazione-e-configurazione)
4. [Protocollo AMCP](#protocollo-amcp)
5. [Riproduzione di Media](#riproduzione-di-media)
6. [Gestione dei Template Grafici](#gestione-dei-template-grafici)
7. [Controllo del Mixer](#controllo-del-mixer)
8. [Canali e Layer](#canali-e-layer)
9. [Transizioni](#transizioni)
10. [Integrazione con Hardware](#integrazione-con-hardware)
11. [Risoluzione dei Problemi](#risoluzione-dei-problemi)
12. [Casi d'Uso Avanzati](#casi-duso-avanzati)
13. [Risorse Aggiuntive](#risorse-aggiuntive)

## Introduzione a CasparCG

### Cos'è CasparCG

CasparCG è un sistema di playout video professionale open source utilizzato in ambito broadcast. È stato sviluppato originariamente dalla Swedish Broadcasting Corporation (SVT) e ora è mantenuto dalla comunità. CasparCG è progettato per la riproduzione di contenuti multimediali, grafica e testo in sovraimpressione con qualità broadcast.

### Caratteristiche Principali

- **Open Source**: Completamente gratuito e con codice sorgente disponibile
- **Qualità Broadcast**: Output video di qualità professionale
- **Flessibilità**: Supporto per vari formati media e risoluzioni
- **Grafica in Tempo Reale**: Supporto per template HTML e Flash
- **Controllo Remoto**: Protocollo AMCP per il controllo via rete
- **Multi-canale**: Supporto per più canali di output simultanei
- **Hardware Acceleration**: Utilizzo della GPU per il rendering

### Casi d'Uso Tipici

- **Studi Televisivi**: Playout di video, grafica e titoli
- **Eventi dal Vivo**: Gestione di contenuti multimediali per eventi
- **Streaming**: Produzione di contenuti per streaming online
- **Digital Signage**: Gestione di display informativi
- **Installazioni Interattive**: Controllo di installazioni multimediali

### Componenti di CasparCG

Il sistema CasparCG è composto da due componenti principali:

1. **CasparCG Server**: Il motore di playout che gestisce la riproduzione di media e grafica
2. **CasparCG Client**: L'interfaccia utente per il controllo del server

Inoltre, esistono vari client e librerie di terze parti che consentono di controllare CasparCG da diverse piattaforme e linguaggi di programmazione.

## Architettura di CasparCG

### Panoramica dell'Architettura

CasparCG è basato su un'architettura client-server. Il server CasparCG è responsabile della riproduzione di media e grafica, mentre i client si connettono al server per controllarlo. La comunicazione tra client e server avviene tramite il protocollo AMCP (Advanced Media Control Protocol) su TCP/IP.

```
+----------------+       AMCP       +----------------+
|                |  <-------------> |                |
| CasparCG Client|                  | CasparCG Server|
|                |                  |                |
+----------------+                  +----------------+
                                          |
                                          | Output
                                          v
                                    +----------------+
                                    |                |
                                    | Display/Stream |
                                    |                |
                                    +----------------+
```

### Server CasparCG

Il server CasparCG è il cuore del sistema. È responsabile per:

- Caricamento e riproduzione di file multimediali
- Rendering di template grafici
- Gestione di canali e layer
- Applicazione di effetti e transizioni
- Output video su vari dispositivi

Il server è implementato in C++ e utilizza varie librerie open source per le sue funzionalità, tra cui:

- **FFmpeg**: Per la decodifica di file multimediali
- **CEF (Chromium Embedded Framework)**: Per il rendering di template HTML
- **OpenGL**: Per il rendering grafico accelerato via GPU
- **SFML**: Per la gestione delle finestre e dell'input

### Client CasparCG

Il client CasparCG ufficiale è un'applicazione desktop che fornisce un'interfaccia utente per il controllo del server. Consente di:

- Connettersi a uno o più server CasparCG
- Sfogliare e riprodurre file multimediali
- Gestire template grafici
- Creare e gestire rundown/playlist
- Controllare parametri del mixer
- Monitorare l'output del server

### Canali e Layer

CasparCG organizza i contenuti in canali e layer:

- **Canale**: Rappresenta un output fisico (ad esempio, una scheda SDI o una finestra)
- **Layer**: Rappresenta un livello all'interno di un canale, con layer superiori che si sovrappongono a quelli inferiori

Questa organizzazione consente di comporre scene complesse sovrapponendo vari elementi (video, grafica, testo) su layer diversi all'interno dello stesso canale.

### Producers

I "producers" sono componenti interni del server CasparCG che generano contenuti per i layer. I principali tipi di producer sono:

- **Media Producer**: Riproduce file multimediali (video, audio, immagini)
- **HTML Producer**: Renderizza template HTML
- **Flash Producer**: Renderizza template Flash (deprecato nelle versioni recenti)
- **Color Producer**: Genera colori solidi
- **Route Producer**: Instrada l'output di un canale a un altro
- **Decklink Producer**: Acquisisce video da dispositivi Blackmagic Design

### Consumers

I "consumers" sono componenti che gestiscono l'output del server CasparCG. I principali tipi di consumer sono:

- **Screen Consumer**: Output su finestra
- **Decklink Consumer**: Output su dispositivi Blackmagic Design
- **Streaming Consumer**: Output su stream (RTMP, NDI, ecc.)
- **File Consumer**: Output su file
- **System Audio Consumer**: Output audio sui dispositivi audio del sistema

## Installazione e Configurazione

### Requisiti di Sistema

- **Sistema Operativo**: Windows 10/11 o Linux (supporto limitato)
- **CPU**: Intel Core i5 o superiore (consigliato i7 o superiore per 4K)
- **RAM**: 8 GB minimo (consigliato 16 GB o più per 4K)
- **GPU**: Scheda grafica compatibile con OpenGL 4.5
- **Storage**: SSD consigliato per prestazioni ottimali
- **Rete**: Gigabit Ethernet per controllo remoto e streaming

### Download e Installazione

1. Scarica l'ultima versione di CasparCG Server dal sito ufficiale o da GitHub:
   [https://github.com/CasparCG/server/releases](https://github.com/CasparCG/server/releases)

2. Estrai l'archivio in una cartella sul tuo sistema (ad esempio, `C:\CasparCG`)

3. Scarica e installa il client CasparCG:
   [https://github.com/CasparCG/client/releases](https://github.com/CasparCG/client/releases)

### Configurazione del Server

La configurazione del server CasparCG avviene tramite il file `casparcg.config` nella directory del server. Questo file XML definisce canali, consumers, template hosts e altre impostazioni.

Esempio di configurazione base:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <paths>
    <media-path>media/</media-path>
    <log-path>log/</log-path>
    <data-path>data/</data-path>
    <template-path>templates/</template-path>
    <thumbnail-path>thumbnails/</thumbnail-path>
  </paths>
  <lock-clear-phrase>secret</lock-clear-phrase>
  <channels>
    <channel>
      <video-mode>720p5000</video-mode>
      <consumers>
        <screen>
          <device>1</device>
          <aspect-ratio>16:9</aspect-ratio>
          <stretch>fill</stretch>
          <windowed>true</windowed>
        </screen>
      </consumers>
    </channel>
  </channels>
  <controllers>
    <tcp>
      <port>5250</port>
      <protocol>AMCP</protocol>
    </tcp>
  </controllers>
  <amcp>
    <media-server>
      <host>localhost</host>
      <port>8000</port>
    </media-server>
  </amcp>
</configuration>
```

#### Elementi di Configurazione Principali

- **paths**: Definisce i percorsi per media, log, dati, template e thumbnail
- **channels**: Definisce i canali di output e le loro proprietà
- **video-mode**: Definisce la risoluzione e il frame rate (es. 720p5000 = 720p a 50 fps)
- **consumers**: Definisce i consumer per l'output (screen, decklink, streaming, ecc.)
- **controllers**: Definisce i controller per il controllo remoto (TCP, OSC, ecc.)
- **amcp**: Configurazione del protocollo AMCP

### Avvio del Server

Per avviare il server CasparCG:

1. Apri una finestra del prompt dei comandi
2. Naviga alla directory del server CasparCG
3. Esegui `casparcg.exe`

Il server mostrerà i log di avvio e sarà pronto a ricevere comandi AMCP sulla porta specificata nella configurazione (default: 5250).

### Connessione del Client

Per connettere il client CasparCG al server:

1. Avvia il client CasparCG
2. Vai su File > Settings > Connections
3. Aggiungi una nuova connessione con l'host e la porta del server
4. Salva le impostazioni e connettiti al server
