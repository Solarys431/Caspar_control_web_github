## Protocollo AMCP

### Introduzione al Protocollo AMCP

AMCP (Advanced Media Control Protocol) è il protocollo principale utilizzato per controllare il server CasparCG. È un protocollo testuale basato su TCP/IP che consente ai client di inviare comandi al server e ricevere risposte.

Il protocollo AMCP è progettato per essere:
- Semplice da implementare
- Facile da debuggare (essendo testuale)
- Estensibile per nuove funzionalità
- Compatibile con vari linguaggi di programmazione

### Sintassi di Base

I comandi AMCP seguono una sintassi generale:

```
COMANDO [canale]-[layer] [parametri]
```

Dove:
- `COMANDO` è il comando AMCP (es. PLAY, STOP, CLEAR)
- `canale` è il numero del canale (a partire da 1)
- `layer` è il numero del layer (a partire da 1)
- `parametri` sono i parametri specifici del comando

Esempio:
```
PLAY 1-1 AMB loop
```
Questo comando riproduce il file "AMB" sul canale 1, layer 1, in loop.

### Connessione al Server

Per inviare comandi AMCP al server CasparCG, è necessario stabilire una connessione TCP alla porta del server (default: 5250):

```
telnet localhost 5250
```

Una volta connessi, è possibile inviare comandi AMCP e ricevere risposte dal server.

### Risposte del Server

Le risposte del server CasparCG seguono un formato standard:

```
XXX [informazioni]
```

Dove `XXX` è un codice di risposta a tre cifre:
- `2XX`: Successo
- `4XX`: Errore del client
- `5XX`: Errore del server

Esempi di risposte:
```
200 OK
201 [informazioni]
400 ERROR
501 [informazioni sull'errore]
```

### Categorie di Comandi AMCP

I comandi AMCP sono organizzati in diverse categorie:

1. **Comandi di Base**: Per la riproduzione e il controllo di media
2. **Comandi di Query**: Per ottenere informazioni dal server
3. **Comandi di Template**: Per la gestione di template grafici
4. **Comandi di Mixer**: Per il controllo del mixer
5. **Comandi di Routing**: Per il routing di segnali tra canali
6. **Comandi di Sistema**: Per il controllo del server stesso

### Comandi di Base

#### PLAY

Riproduce un file multimediale su un canale e layer specifici.

```
PLAY [canale]-[layer] [nome_clip] [loop] [transizione] [durata_transizione] [auto]
```

Esempi:
```
PLAY 1-1 my_video
PLAY 1-1 my_video LOOP
PLAY 1-1 my_video CUT 20
PLAY 1-1 my_video MIX 12 AUTO
```

#### STOP

Ferma la riproduzione su un canale e layer specifici.

```
STOP [canale]-[layer]
```

Esempio:
```
STOP 1-1
```

#### CLEAR

Pulisce un canale o un layer specifico.

```
CLEAR [canale]-[layer]
```

Esempi:
```
CLEAR 1
CLEAR 1-1
```

#### LOAD

Carica un file multimediale in un canale e layer senza riprodurlo.

```
LOAD [canale]-[layer] [nome_clip]
```

Esempio:
```
LOAD 1-1 my_video
```

#### LOADBG

Carica un file multimediale in background, pronto per essere riprodotto quando il clip corrente termina.

```
LOADBG [canale]-[layer] [nome_clip] [loop] [transizione] [durata_transizione] [auto]
```

Esempi:
```
LOADBG 1-1 my_video
LOADBG 1-1 my_video LOOP
LOADBG 1-1 my_video MIX 12
LOADBG 1-1 my_video MIX 12 AUTO
```

#### PAUSE

Mette in pausa la riproduzione su un canale e layer specifici.

```
PAUSE [canale]-[layer]
```

Esempio:
```
PAUSE 1-1
```

#### RESUME

Riprende la riproduzione su un canale e layer specifici.

```
RESUME [canale]-[layer]
```

Esempio:
```
RESUME 1-1
```

### Comandi di Query

#### INFO

Ottiene informazioni sul server o su un canale specifico.

```
INFO [canale]
```

Esempi:
```
INFO
INFO 1
```

#### CLS

Ottiene la lista dei file multimediali disponibili.

```
CLS
```

#### TLS

Ottiene la lista dei template disponibili.

```
TLS
```

#### VERSION

Ottiene la versione del server CasparCG.

```
VERSION
```

#### DIAG

Esegue una diagnostica sul server e restituisce i risultati.

```
DIAG
```

### Comandi di Template

#### CG ADD

Aggiunge un template grafico a un canale e layer specifici.

```
CG [canale]-[layer] ADD [cg-layer] [template] [play-on-load] [data]
```

Esempi:
```
CG 1-1 ADD 1 my_template 1
CG 1-1 ADD 1 my_template 1 "<templateData><text>Hello World</text></templateData>"
```

#### CG PLAY

Riproduce un template grafico su un canale e layer specifici.

```
CG [canale]-[layer] PLAY [cg-layer]
```

Esempio:
```
CG 1-1 PLAY 1
```

#### CG STOP

Ferma un template grafico su un canale e layer specifici.

```
CG [canale]-[layer] STOP [cg-layer]
```

Esempio:
```
CG 1-1 STOP 1
```

#### CG NEXT

Attiva il passo successivo in un template grafico.

```
CG [canale]-[layer] NEXT [cg-layer]
```

Esempio:
```
CG 1-1 NEXT 1
```

#### CG UPDATE

Aggiorna i dati di un template grafico.

```
CG [canale]-[layer] UPDATE [cg-layer] [data]
```

Esempio:
```
CG 1-1 UPDATE 1 "<templateData><text>New Text</text></templateData>"
```

#### CG INVOKE

Invoca un metodo su un template grafico.

```
CG [canale]-[layer] INVOKE [cg-layer] [method]
```

Esempio:
```
CG 1-1 INVOKE 1 "play()"
```

#### CG REMOVE

Rimuove un template grafico.

```
CG [canale]-[layer] REMOVE [cg-layer]
```

Esempio:
```
CG 1-1 REMOVE 1
```

### Comandi di Mixer

#### MIXER FILL

Regola la posizione e la scala di un layer.

```
MIXER [canale]-[layer] FILL [x] [y] [x-scale] [y-scale] [duration]
```

Dove:
- `x` e `y` sono le coordinate del punto in alto a sinistra (0-1)
- `x-scale` e `y-scale` sono i fattori di scala (0-1)
- `duration` è la durata della transizione in frame

Esempio:
```
MIXER 1-1 FILL 0.25 0.25 0.5 0.5 25
```
Questo comando posiziona il layer a 1/4 dello schermo dall'angolo in alto a sinistra e lo ridimensiona al 50% della sua dimensione originale, con una transizione di 25 frame.

#### MIXER CLIP

Ritaglia un layer.

```
MIXER [canale]-[layer] CLIP [x] [y] [width] [height] [duration]
```

Dove:
- `x` e `y` sono le coordinate del punto in alto a sinistra del ritaglio (0-1)
- `width` e `height` sono la larghezza e l'altezza del ritaglio (0-1)
- `duration` è la durata della transizione in frame

Esempio:
```
MIXER 1-1 CLIP 0.25 0.25 0.5 0.5 25
```
Questo comando ritaglia il layer mostrando solo il rettangolo che inizia a 1/4 dello schermo dall'angolo in alto a sinistra e ha dimensioni pari alla metà della larghezza e dell'altezza originali, con una transizione di 25 frame.

#### MIXER OPACITY

Imposta l'opacità di un layer.

```
MIXER [canale]-[layer] OPACITY [value] [duration]
```

Dove:
- `value` è il valore di opacità (0-1, dove 0 è trasparente e 1 è opaco)
- `duration` è la durata della transizione in frame

Esempio:
```
MIXER 1-1 OPACITY 0.5 25
```
Questo comando imposta l'opacità del layer al 50%, con una transizione di 25 frame.

#### MIXER BRIGHTNESS

Regola la luminosità di un layer.

```
MIXER [canale]-[layer] BRIGHTNESS [value] [duration]
```

Dove:
- `value` è il valore di luminosità (0-1)
- `duration` è la durata della transizione in frame

Esempio:
```
MIXER 1-1 BRIGHTNESS 1.5 25
```

#### MIXER CONTRAST

Regola il contrasto di un layer.

```
MIXER [canale]-[layer] CONTRAST [value] [duration]
```

Dove:
- `value` è il valore di contrasto (0-1)
- `duration` è la durata della transizione in frame

Esempio:
```
MIXER 1-1 CONTRAST 1.5 25
```

#### MIXER SATURATION

Regola la saturazione di un layer.

```
MIXER [canale]-[layer] SATURATION [value] [duration]
```

Dove:
- `value` è il valore di saturazione (0-1)
- `duration` è la durata della transizione in frame

Esempio:
```
MIXER 1-1 SATURATION 1.5 25
```

#### MIXER ROTATION

Ruota un layer.

```
MIXER [canale]-[layer] ROTATION [angle] [duration]
```

Dove:
- `angle` è l'angolo di rotazione in gradi
- `duration` è la durata della transizione in frame

Esempio:
```
MIXER 1-1 ROTATION 45 25
```
Questo comando ruota il layer di 45 gradi, con una transizione di 25 frame.

#### MIXER VOLUME

Regola il volume audio di un layer.

```
MIXER [canale]-[layer] VOLUME [value] [duration]
```

Dove:
- `value` è il valore di volume (0-1)
- `duration` è la durata della transizione in frame

Esempio:
```
MIXER 1-1 VOLUME 0.8 25
```

## Riproduzione di Media

### Formati Supportati

CasparCG supporta vari formati di file multimediali grazie all'utilizzo di FFmpeg. I formati principali includono:

- **Video**: MP4, MOV, MXF, AVI, WMV
- **Audio**: WAV, MP3, AAC
- **Immagini**: PNG, JPEG, TGA, BMP, TIFF
- **Streaming**: RTMP, NDI, Decklink

Per prestazioni ottimali, si consiglia di utilizzare:
- Codec video: H.264, ProRes, DNxHD
- Codec audio: PCM, AAC
- Container: MP4, MOV

### Organizzazione dei Media

I file multimediali devono essere posizionati nella directory `media` del server CasparCG o in una directory specificata nel file di configurazione. È possibile organizzare i file in sottodirectory per una migliore gestione.

Esempio di struttura:
```
media/
  ├── videos/
  │   ├── news_intro.mp4
  │   └── weather_background.mp4
  ├── graphics/
  │   ├── logo.png
  │   └── lower_third.png
  └── audio/
      ├── jingle.wav
      └── background_music.mp3
```

### Riproduzione di Base

Per riprodurre un file multimediale, si utilizza il comando `PLAY`:

```
PLAY [canale]-[layer] [nome_clip]
```

Esempio:
```
PLAY 1-1 videos/news_intro
```

Nota: Non è necessario specificare l'estensione del file, CasparCG la determinerà automaticamente.

### Riproduzione in Loop

Per riprodurre un file in loop, si aggiunge il parametro `LOOP`:

```
PLAY [canale]-[layer] [nome_clip] LOOP
```

Esempio:
```
PLAY 1-1 videos/weather_background LOOP
```

### Riproduzione con Transizioni

Per riprodurre un file con una transizione, si aggiungono i parametri `[transizione]` e `[durata_transizione]`:

```
PLAY [canale]-[layer] [nome_clip] [transizione] [durata_transizione]
```

Tipi di transizione disponibili:
- `CUT`: Taglio netto (default)
- `MIX`: Dissolvenza incrociata
- `PUSH`: Transizione a spinta
- `WIPE`: Transizione a tendina
- `SLIDE`: Transizione a scorrimento

Esempio:
```
PLAY 1-1 videos/news_intro MIX 25
```
Questo comando riproduce il file con una dissolvenza incrociata di 25 frame.

### Precaricamento di Media

Per precaricamento di un file multimediale in background, si utilizza il comando `LOADBG`:

```
LOADBG [canale]-[layer] [nome_clip] [loop] [transizione] [durata_transizione] [auto]
```

Esempio:
```
LOADBG 1-1 videos/weather_background MIX 25 AUTO
```
Questo comando precarica il file e lo riproduce automaticamente quando il clip corrente termina, con una dissolvenza incrociata di 25 frame.

### Controllo della Riproduzione

Per controllare la riproduzione, si utilizzano i comandi:

- `PAUSE [canale]-[layer]`: Mette in pausa la riproduzione
- `RESUME [canale]-[layer]`: Riprende la riproduzione
- `STOP [canale]-[layer]`: Ferma la riproduzione
- `CLEAR [canale]-[layer]`: Pulisce il layer

Esempi:
```
PAUSE 1-1
RESUME 1-1
STOP 1-1
CLEAR 1-1
```

### Riproduzione di Immagini

Le immagini vengono riprodotte come i video, ma rimangono statiche:

```
PLAY 1-1 graphics/logo
```

### Riproduzione di Audio

I file audio possono essere riprodotti su un layer:

```
PLAY 1-1 audio/jingle
```

Per riprodurre solo l'audio di un file video:

```
PLAY 1-1 videos/news_intro AUDIO
```

### Riproduzione di Stream

CasparCG può riprodurre stream da varie fonti:

```
PLAY 1-1 rtmp://streaming-server/live/stream
PLAY 1-1 ndi://computer/source
PLAY 1-1 decklink://1
```

### Riproduzione di Colori Solidi

Per riprodurre un colore solido, si utilizza il producer `EMPTY`:

```
PLAY 1-1 EMPTY
MIXER 1-1 FILL 0 0 1 1 0
MIXER 1-1 OPACITY 1 0
MIXER 1-1 BRIGHTNESS 1 0
MIXER 1-1 CONTRAST 1 0
MIXER 1-1 SATURATION 0 0
```

Oppure il producer `#COLOR`:

```
PLAY 1-1 #COLOR
```

### Riproduzione di Sequenze di Immagini

Per riprodurre una sequenza di immagini, si utilizza la sintassi:

```
PLAY 1-1 sequence/frame[0-100].png
```

Questo comando riproduce le immagini da `frame0.png` a `frame100.png` nella directory `sequence`.

### Riproduzione con Seek

Per iniziare la riproduzione da un punto specifico, si utilizza il parametro `SEEK`:

```
PLAY 1-1 videos/news_intro SEEK 10
```
Questo comando inizia la riproduzione dal frame 10.
