# Guida Completa alla Configurazione di CasparCG

## Indice

1. [Introduzione](#introduzione)
2. [Struttura del File di Configurazione](#struttura-del-file-di-configurazione)
3. [Configurazione di Base](#configurazione-di-base)
4. [Configurazione dei Percorsi](#configurazione-dei-percorsi)
5. [Configurazione dei Canali](#configurazione-dei-canali)
6. [Configurazione dei Consumer](#configurazione-dei-consumer)
7. [Configurazione dei Controller](#configurazione-dei-controller)
8. [Configurazione Avanzata](#configurazione-avanzata)
9. [Esempi di Configurazione](#esempi-di-configurazione)
10. [Risoluzione dei Problemi](#risoluzione-dei-problemi)

## Introduzione

Il file di configurazione di CasparCG (`casparcg.config`) è un file XML che definisce tutti gli aspetti del comportamento del server. Una corretta configurazione è essenziale per ottenere prestazioni ottimali e funzionalità complete.

Questa guida descrive in dettaglio tutte le variabili di configurazione disponibili, il loro significato e i valori possibili, con esempi pratici per vari scenari di utilizzo.

### Posizione del File di Configurazione

Il file `casparcg.config` si trova nella directory principale di CasparCG Server. Se il file non esiste, CasparCG creerà un file di configurazione predefinito al primo avvio.

### Formato del File

Il file di configurazione è in formato XML e deve essere ben formato per essere valido. Un errore di sintassi può impedire l'avvio del server.

## Struttura del File di Configurazione

La struttura di base del file di configurazione è la seguente:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <paths>
    <!-- Configurazione dei percorsi -->
  </paths>
  <lock-clear-phrase><!-- Frase per sbloccare il comando CLEAR --></lock-clear-phrase>
  <channels>
    <!-- Configurazione dei canali -->
  </channels>
  <controllers>
    <!-- Configurazione dei controller -->
  </controllers>
  <amcp>
    <!-- Configurazione AMCP -->
  </amcp>
  <osc>
    <!-- Configurazione OSC -->
  </osc>
  <thumbnails>
    <!-- Configurazione delle miniature -->
  </thumbnails>
  <ffmpeg>
    <!-- Configurazione FFmpeg -->
  </ffmpeg>
  <html>
    <!-- Configurazione HTML -->
  </html>
  <log-level><!-- Livello di log --></log-level>
</configuration>
```

## Configurazione di Base

### Elemento `<log-level>`

Definisce il livello di dettaglio dei log generati dal server.

**Valori possibili**:
- `trace`: Informazioni estremamente dettagliate (massimo dettaglio)
- `debug`: Informazioni di debug
- `info`: Informazioni generali (default)
- `warning`: Solo avvisi
- `error`: Solo errori
- `fatal`: Solo errori fatali

**Esempio**:
```xml
<log-level>info</log-level>
```

### Elemento `<lock-clear-phrase>`

Definisce una frase di sicurezza necessaria per eseguire il comando `CLEAR` che pulisce tutti i canali. Questo è un meccanismo di sicurezza per evitare cancellazioni accidentali.

**Esempio**:
```xml
<lock-clear-phrase>secret</lock-clear-phrase>
```

Per eseguire il comando `CLEAR` con questa configurazione, è necessario utilizzare:
```
CLEAR secret
```

## Configurazione dei Percorsi

L'elemento `<paths>` definisce i percorsi delle directory utilizzate da CasparCG.

### Elemento `<media-path>`

Definisce il percorso della directory contenente i file multimediali (video, audio, immagini).

**Esempio**:
```xml
<media-path>media/</media-path>
```

È possibile specificare più percorsi media:
```xml
<media-path>media/</media-path>
<media-path>D:/ExternalMedia/</media-path>
```

### Elemento `<log-path>`

Definisce il percorso della directory per i file di log.

**Esempio**:
```xml
<log-path>log/</log-path>
```

### Elemento `<data-path>`

Definisce il percorso della directory per i dati generati dal server.

**Esempio**:
```xml
<data-path>data/</data-path>
```

### Elemento `<template-path>`

Definisce il percorso della directory contenente i template HTML/Flash.

**Esempio**:
```xml
<template-path>templates/</template-path>
```

### Elemento `<thumbnail-path>`

Definisce il percorso della directory per le miniature generate.

**Esempio**:
```xml
<thumbnail-path>thumbnails/</thumbnail-path>
```

### Esempio Completo di Configurazione dei Percorsi

```xml
<paths>
  <media-path>media/</media-path>
  <log-path>log/</log-path>
  <data-path>data/</data-path>
  <template-path>templates/</template-path>
  <thumbnail-path>thumbnails/</thumbnail-path>
</paths>
```

## Configurazione dei Canali

L'elemento `<channels>` contiene la configurazione di tutti i canali di output. Ogni canale è definito da un elemento `<channel>`.

### Elemento `<channel>`

Definisce un singolo canale di output.

**Attributi**:
- Nessuno (i canali sono numerati in base all'ordine di apparizione)

**Elementi figli**:
- `<video-mode>`: Modalità video (risoluzione e frame rate)
- `<consumers>`: Definisce i consumer (output) per il canale
- `<producers>`: Definisce i producer (input) disponibili per il canale
- `<straight-alpha-output>`: Abilita/disabilita l'output alpha straight
- `<channel-layout>`: Layout dei canali audio

### Elemento `<video-mode>`

Definisce la risoluzione e il frame rate del canale.

**Valori possibili**:
- `PAL`: 720x576 a 25 fps (interlacciato)
- `NTSC`: 720x486 a 29.97 fps (interlacciato)
- `576p2500`: 720x576 a 25 fps (progressivo)
- `720p2398`: 1280x720 a 23.98 fps
- `720p2400`: 1280x720 a 24 fps
- `720p2500`: 1280x720 a 25 fps
- `720p2997`: 1280x720 a 29.97 fps
- `720p3000`: 1280x720 a 30 fps
- `720p5000`: 1280x720 a 50 fps
- `720p5994`: 1280x720 a 59.94 fps
- `720p6000`: 1280x720 a 60 fps
- `1080i5000`: 1920x1080 a 25 fps (interlacciato)
- `1080i5994`: 1920x1080 a 29.97 fps (interlacciato)
- `1080i6000`: 1920x1080 a 30 fps (interlacciato)
- `1080p2398`: 1920x1080 a 23.98 fps
- `1080p2400`: 1920x1080 a 24 fps
- `1080p2500`: 1920x1080 a 25 fps
- `1080p2997`: 1920x1080 a 29.97 fps
- `1080p3000`: 1920x1080 a 30 fps
- `1080p5000`: 1920x1080 a 50 fps
- `1080p5994`: 1920x1080 a 59.94 fps
- `1080p6000`: 1920x1080 a 60 fps
- `2160p2398`: 3840x2160 a 23.98 fps
- `2160p2400`: 3840x2160 a 24 fps
- `2160p2500`: 3840x2160 a 25 fps
- `2160p2997`: 3840x2160 a 29.97 fps
- `2160p3000`: 3840x2160 a 30 fps
- `2160p5000`: 3840x2160 a 50 fps
- `2160p5994`: 3840x2160 a 59.94 fps
- `2160p6000`: 3840x2160 a 60 fps

È anche possibile specificare una modalità video personalizzata:
```xml
<video-mode>
  <width>1920</width>
  <height>1080</height>
  <field-mode>progressive</field-mode> <!-- progressive o interlaced -->
  <time-scale>25000</time-scale>
  <duration>1000</duration>
</video-mode>
```

**Esempio**:
```xml
<video-mode>1080p5000</video-mode>
```

### Elemento `<straight-alpha-output>`

Definisce se l'output alpha deve essere "straight" (non premoltiplicato) o "premultiplied" (default).

**Valori possibili**:
- `false`: Alpha premoltiplicato (default)
- `true`: Alpha straight

**Esempio**:
```xml
<straight-alpha-output>false</straight-alpha-output>
```

### Elemento `<channel-layout>`

Definisce il layout dei canali audio.

**Valori possibili**:
- `mono`
- `stereo` (default)
- `matrix`
- `film`
- `smpte`
- `quad`
- `5.0`
- `5.1`
- `7.0`
- `7.1`

**Esempio**:
```xml
<channel-layout>stereo</channel-layout>
```

### Esempio Completo di Configurazione di un Canale

```xml
<channel>
  <video-mode>1080p5000</video-mode>
  <straight-alpha-output>false</straight-alpha-output>
  <channel-layout>stereo</channel-layout>
  <consumers>
    <!-- Configurazione dei consumer -->
  </consumers>
</channel>
```

## Configurazione dei Consumer

L'elemento `<consumers>` all'interno di un canale definisce i consumer (output) per quel canale. Ogni consumer è definito da un elemento specifico.

### Elemento `<screen>`

Definisce un consumer per l'output su schermo (finestra).

**Elementi figli**:
- `<device>`: Indice del dispositivo di visualizzazione (0 = primario)
- `<aspect-ratio>`: Rapporto d'aspetto (es. "16:9")
- `<stretch>`: Modalità di stretching (fill, uniform, uniform_to_fill)
- `<windowed>`: Se true, l'output è in una finestra, altrimenti a schermo intero
- `<key-only>`: Se true, mostra solo il canale alpha
- `<vsync>`: Se true, abilita la sincronizzazione verticale
- `<borderless>`: Se true, la finestra non ha bordi
- `<interactive>`: Se true, la finestra accetta input
- `<always-on-top>`: Se true, la finestra rimane sempre in primo piano
- `<x>`: Posizione X della finestra
- `<y>`: Posizione Y della finestra
- `<width>`: Larghezza della finestra
- `<height>`: Altezza della finestra

**Esempio**:
```xml
<screen>
  <device>0</device>
  <aspect-ratio>16:9</aspect-ratio>
  <stretch>uniform</stretch>
  <windowed>true</windowed>
  <key-only>false</key-only>
  <vsync>false</vsync>
  <borderless>false</borderless>
  <interactive>true</interactive>
  <always-on-top>false</always-on-top>
  <x>0</x>
  <y>0</y>
  <width>1280</width>
  <height>720</height>
</screen>
```

### Elemento `<decklink>`

Definisce un consumer per l'output su dispositivi Blackmagic Design DeckLink.

**Elementi figli**:
- `<device>`: Indice del dispositivo DeckLink per l'output fill
- `<key-device>`: Indice del dispositivo DeckLink per l'output key
- `<embedded-audio>`: Se true, l'audio è embedded nell'output SDI
- `<latency>`: Modalità di latenza (normal, low, default)
- `<keyer>`: Tipo di keyer (external, internal, default)
- `<key-only>`: Se true, invia solo il segnale key
- `<buffer-depth>`: Profondità del buffer (1-16)
- `<genlock>`: Se true, abilita il genlock

**Esempio**:
```xml
<decklink>
  <device>1</device>
  <key-device>2</key-device>
  <embedded-audio>true</embedded-audio>
  <latency>normal</latency>
  <keyer>external</keyer>
  <key-only>false</key-only>
  <buffer-depth>3</buffer-depth>
  <genlock>true</genlock>
</decklink>
```

### Elemento `<bluefish>`

Definisce un consumer per l'output su dispositivi Bluefish444.

**Elementi figli**:
- `<device>`: Indice del dispositivo Bluefish
- `<embedded-audio>`: Se true, l'audio è embedded nell'output SDI
- `<key-only>`: Se true, invia solo il segnale key
- `<keyer>`: Tipo di keyer (external, internal, default)
- `<key-device>`: Indice del dispositivo per l'output key

**Esempio**:
```xml
<bluefish>
  <device>1</device>
  <embedded-audio>true</embedded-audio>
  <key-only>false</key-only>
  <keyer>external</keyer>
  <key-device>2</key-device>
</bluefish>
```

### Elemento `<system-audio>`

Definisce un consumer per l'output audio sui dispositivi audio del sistema.

**Elementi figli**:
- `<channel-layout>`: Layout dei canali audio
- `<latency>`: Latenza in millisecondi

**Esempio**:
```xml
<system-audio>
  <channel-layout>stereo</channel-layout>
  <latency>200</latency>
</system-audio>
```

### Elemento `<stream>`

Definisce un consumer per lo streaming.

**Elementi figli**:
- `<path>`: URL del server di streaming
- `<args>`: Argomenti FFmpeg per la codifica

**Esempio**:
```xml
<stream>
  <path>rtmp://streaming-server/live/stream</path>
  <args>-format flv -c:v libx264 -b:v 1000k -c:a aac -b:a 128k</args>
</stream>
```

### Elemento `<file>`

Definisce un consumer per l'output su file.

**Elementi figli**:
- `<path>`: Percorso del file di output
- `<codec>`: Codec video
- `<args>`: Argomenti FFmpeg aggiuntivi

**Esempio**:
```xml
<file>
  <path>output.mp4</path>
  <codec>libx264</codec>
  <args>-b:v 5000k -b:a 128k</args>
</file>
```

### Elemento `<ndi>`

Definisce un consumer per l'output NDI (Network Device Interface).

**Elementi figli**:
- `<name>`: Nome della fonte NDI
- `<allow-fields>`: Se true, consente l'output interlacciato

**Esempio**:
```xml
<ndi>
  <name>CasparCG</name>
  <allow-fields>false</allow-fields>
</ndi>
```

### Esempio Completo di Configurazione dei Consumer

```xml
<consumers>
  <screen>
    <device>0</device>
    <aspect-ratio>16:9</aspect-ratio>
    <stretch>uniform</stretch>
    <windowed>true</windowed>
  </screen>
  <decklink>
    <device>1</device>
    <embedded-audio>true</embedded-audio>
    <latency>normal</latency>
  </decklink>
  <system-audio>
    <channel-layout>stereo</channel-layout>
    <latency>200</latency>
  </system-audio>
</consumers>
```

## Configurazione dei Controller

L'elemento `<controllers>` definisce i controller per il controllo remoto del server.

### Elemento `<tcp>`

Definisce un controller TCP per il protocollo AMCP.

**Elementi figli**:
- `<port>`: Porta TCP (default: 5250)
- `<protocol>`: Protocollo (AMCP)

**Esempio**:
```xml
<tcp>
  <port>5250</port>
  <protocol>AMCP</protocol>
</tcp>
```

### Elemento `<osc>`

Definisce un controller OSC (Open Sound Control).

**Elementi figli**:
- `<port>`: Porta UDP per la ricezione di messaggi OSC
- `<predefined-clients>`: Elenco di client predefiniti
  - `<predefined-client>`: Definizione di un client predefinito
    - `<address>`: Indirizzo IP del client
    - `<port>`: Porta UDP del client

**Esempio**:
```xml
<osc>
  <port>6250</port>
  <predefined-clients>
    <predefined-client>
      <address>127.0.0.1</address>
      <port>5253</port>
    </predefined-client>
  </predefined-clients>
</osc>
```

### Esempio Completo di Configurazione dei Controller

```xml
<controllers>
  <tcp>
    <port>5250</port>
    <protocol>AMCP</protocol>
  </tcp>
  <osc>
    <port>6250</port>
    <predefined-clients>
      <predefined-client>
        <address>127.0.0.1</address>
        <port>5253</port>
      </predefined-client>
    </predefined-clients>
  </osc>
</controllers>
```

## Configurazione Avanzata

### Elemento `<amcp>`

Definisce la configurazione del protocollo AMCP.

**Elementi figli**:
- `<media-server>`: Configurazione del media server
  - `<host>`: Host del media server
  - `<port>`: Porta del media server

**Esempio**:
```xml
<amcp>
  <media-server>
    <host>localhost</host>
    <port>8000</port>
  </media-server>
</amcp>
```

### Elemento `<thumbnails>`

Definisce la configurazione delle miniature.

**Elementi figli**:
- `<generate-thumbnails>`: Se true, genera automaticamente miniature
- `<width>`: Larghezza delle miniature
- `<height>`: Altezza delle miniature

**Esempio**:
```xml
<thumbnails>
  <generate-thumbnails>true</generate-thumbnails>
  <width>256</width>
  <height>144</height>
</thumbnails>
```

### Elemento `<ffmpeg>`

Definisce la configurazione di FFmpeg.

**Elementi figli**:
- `<producer>`: Configurazione del producer FFmpeg
  - `<auto-deinterlace>`: Se true, deinterlaccia automaticamente i video interlacciati
  - `<threads>`: Numero di thread per la decodifica
  - `<filter>`: Filtro FFmpeg da applicare

**Esempio**:
```xml
<ffmpeg>
  <producer>
    <auto-deinterlace>true</auto-deinterlace>
    <threads>4</threads>
    <filter>yadif=0:-1</filter>
  </producer>
</ffmpeg>
```

### Elemento `<html>`

Definisce la configurazione del renderer HTML.

**Elementi figli**:
- `<remote-debugging-port>`: Porta per il debug remoto
- `<enable-gpu>`: Se true, abilita l'accelerazione GPU
- `<angle-backend>`: Backend ANGLE (default, d3d11, d3d9, opengl, opengles)

**Esempio**:
```xml
<html>
  <remote-debugging-port>9222</remote-debugging-port>
  <enable-gpu>true</enable-gpu>
  <angle-backend>default</angle-backend>
</html>
```

## Esempi di Configurazione

### Configurazione Minima

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <paths>
    <media-path>media/</media-path>
    <log-path>log/</log-path>
    <data-path>data/</data-path>
    <template-path>templates/</template-path>
  </paths>
  <channels>
    <channel>
      <video-mode>720p5000</video-mode>
      <consumers>
        <screen>
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
</configuration>
```

### Configurazione per Broadcast

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <paths>
    <media-path>D:/Media/</media-path>
    <log-path>D:/Logs/</log-path>
    <data-path>D:/Data/</data-path>
    <template-path>D:/Templates/</template-path>
    <thumbnail-path>D:/Thumbnails/</thumbnail-path>
  </paths>
  <lock-clear-phrase>broadcast</lock-clear-phrase>
  <channels>
    <channel>
      <video-mode>1080i5000</video-mode>
      <straight-alpha-output>false</straight-alpha-output>
      <channel-layout>stereo</channel-layout>
      <consumers>
        <decklink>
          <device>1</device>
          <key-device>2</key-device>
          <embedded-audio>true</embedded-audio>
          <latency>normal</latency>
          <keyer>external</keyer>
          <key-only>false</key-only>
          <buffer-depth>3</buffer-depth>
          <genlock>true</genlock>
        </decklink>
        <screen>
          <device>0</device>
          <aspect-ratio>16:9</aspect-ratio>
          <stretch>uniform</stretch>
          <windowed>true</windowed>
          <key-only>false</key-only>
          <vsync>false</vsync>
        </screen>
      </consumers>
    </channel>
    <channel>
      <video-mode>1080i5000</video-mode>
      <straight-alpha-output>false</straight-alpha-output>
      <channel-layout>stereo</channel-layout>
      <consumers>
        <decklink>
          <device>3</device>
          <embedded-audio>true</embedded-audio>
          <latency>normal</latency>
        </decklink>
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
  <thumbnails>
    <generate-thumbnails>true</generate-thumbnails>
    <width>256</width>
    <height>144</height>
  </thumbnails>
  <ffmpeg>
    <producer>
      <auto-deinterlace>true</auto-deinterlace>
      <threads>8</threads>
    </producer>
  </ffmpeg>
  <html>
    <remote-debugging-port>9222</remote-debugging-port>
    <enable-gpu>true</enable-gpu>
  </html>
  <log-level>info</log-level>
</configuration>
```

### Configurazione per Streaming

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <paths>
    <media-path>media/</media-path>
    <log-path>log/</log-path>
    <data-path>data/</data-path>
    <template-path>templates/</template-path>
  </paths>
  <channels>
    <channel>
      <video-mode>720p5000</video-mode>
      <consumers>
        <screen>
          <windowed>true</windowed>
        </screen>
        <stream>
          <path>rtmp://streaming-server/live/stream</path>
          <args>-format flv -c:v libx264 -b:v 2500k -maxrate 2500k -bufsize 5000k -c:a aac -b:a 128k -ar 44100 -preset veryfast -profile:v main -level 3.1</args>
        </stream>
      </consumers>
    </channel>
  </channels>
  <controllers>
    <tcp>
      <port>5250</port>
      <protocol>AMCP</protocol>
    </tcp>
  </controllers>
  <ffmpeg>
    <producer>
      <auto-deinterlace>true</auto-deinterlace>
      <threads>4</threads>
    </producer>
  </ffmpeg>
  <log-level>info</log-level>
</configuration>
```

### Configurazione per NDI

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <paths>
    <media-path>media/</media-path>
    <log-path>log/</log-path>
    <data-path>data/</data-path>
    <template-path>templates/</template-path>
  </paths>
  <channels>
    <channel>
      <video-mode>1080p5000</video-mode>
      <consumers>
        <screen>
          <windowed>true</windowed>
        </screen>
        <ndi>
          <name>CasparCG Output</name>
          <allow-fields>false</allow-fields>
        </ndi>
      </consumers>
    </channel>
  </channels>
  <controllers>
    <tcp>
      <port>5250</port>
      <protocol>AMCP</protocol>
    </tcp>
  </controllers>
  <log-level>info</log-level>
</configuration>
```

## Risoluzione dei Problemi

### Problemi Comuni di Configurazione

#### Il Server Non Si Avvia

**Possibili cause**:
1. **File di configurazione non valido**: Verificare che il file XML sia ben formato
2. **Percorsi non validi**: Verificare che i percorsi specificati esistano
3. **Dispositivi non disponibili**: Verificare che i dispositivi hardware specificati siano disponibili

**Soluzione**:
1. Controllare i log del server nella directory `log/`
2. Verificare la sintassi XML del file di configurazione
3. Ripristinare una configurazione funzionante precedente

#### Errori di Dispositivo DeckLink

**Possibili cause**:
1. **Indice di dispositivo errato**: L'indice del dispositivo non corrisponde a un dispositivo disponibile
2. **Modalità video non supportata**: La modalità video specificata non è supportata dal dispositivo
3. **Driver non aggiornati**: I driver DeckLink non sono aggiornati

**Soluzione**:
1. Verificare gli indici dei dispositivi con Blackmagic Design Desktop Video Setup
2. Verificare le modalità video supportate dal dispositivo
3. Aggiornare i driver DeckLink

#### Problemi di Prestazioni

**Possibili cause**:
1. **Troppe miniature**: La generazione automatica di miniature può influire sulle prestazioni
2. **Troppi thread FFmpeg**: Un numero eccessivo di thread può causare problemi
3. **Modalità video troppo pesante**: La modalità video potrebbe essere troppo pesante per l'hardware

**Soluzione**:
1. Disabilitare la generazione automatica di miniature:
   ```xml
   <thumbnails>
     <generate-thumbnails>false</generate-thumbnails>
   </thumbnails>
   ```
2. Ottimizzare il numero di thread FFmpeg:
   ```xml
   <ffmpeg>
     <producer>
       <threads>4</threads>
     </producer>
   </ffmpeg>
   ```
3. Ridurre la risoluzione o il frame rate:
   ```xml
   <video-mode>720p5000</video-mode>
   ```

### Verifica della Configurazione

Per verificare che la configurazione sia corretta, è possibile:

1. Avviare CasparCG con l'opzione `--help` per vedere le opzioni disponibili
2. Avviare CasparCG con l'opzione `--log-level trace` per ottenere log dettagliati
3. Utilizzare un editor XML con validazione per verificare la sintassi del file

### Backup della Configurazione

È consigliabile mantenere backup regolari del file di configurazione:

1. Creare una copia del file `casparcg.config` prima di apportare modifiche
2. Utilizzare un sistema di controllo versione per tracciare le modifiche
3. Documentare le modifiche apportate alla configurazione
