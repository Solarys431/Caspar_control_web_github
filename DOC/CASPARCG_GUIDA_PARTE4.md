## Canali e Layer

### Concetto di Canali

In CasparCG, un canale rappresenta un output fisico o virtuale. Ogni canale può essere indirizzato a un dispositivo di output diverso, come:

- Una finestra sullo schermo
- Un'uscita SDI tramite scheda Blackmagic Design
- Un flusso di streaming
- Un file

I canali sono definiti nel file di configurazione `casparcg.config` e sono numerati a partire da 1. Ogni canale ha una risoluzione e un frame rate specifici, definiti dal parametro `video-mode`.

Esempio di configurazione di canali:

```xml
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
  <channel>
    <video-mode>1080i5000</video-mode>
    <consumers>
      <decklink>
        <device>1</device>
        <key-device>2</key-device>
        <embedded-audio>true</embedded-audio>
        <latency>normal</latency>
        <keyer>external</keyer>
        <key-only>false</key-only>
      </decklink>
    </consumers>
  </channel>
</channels>
```

In questo esempio, il canale 1 è configurato per l'output su una finestra dello schermo a 720p 50Hz, mentre il canale 2 è configurato per l'output su una scheda Blackmagic Design a 1080i 50Hz.

### Concetto di Layer

All'interno di ogni canale, CasparCG supporta più layer. I layer sono numerati a partire da 1 e sono sovrapposti in ordine crescente, con i layer numerati più alti che appaiono sopra quelli numerati più bassi.

I layer consentono di comporre scene complesse sovrapponendo vari elementi:

- Layer 1: Background video
- Layer 2: Grafica di sfondo
- Layer 3: Lower third
- Layer 4: Logo
- Layer 5: Ticker

Ogni layer può contenere un solo producer alla volta (video, immagine, template, ecc.). Quando si riproduce un nuovo elemento su un layer, l'elemento precedente viene sostituito.

### Indirizzamento di Canali e Layer

Per indirizzare un canale e un layer specifici nei comandi AMCP, si utilizza la sintassi `[canale]-[layer]`:

```
PLAY 1-1 background
PLAY 1-2 logo
CG 1-3 ADD 1 lower_third 1 "<templateData><text>Breaking News</text></templateData>"
```

In questo esempio:
- `1-1` si riferisce al canale 1, layer 1
- `1-2` si riferisce al canale 1, layer 2
- `1-3` si riferisce al canale 1, layer 3

### Gestione dei Layer

#### Pulizia dei Layer

Per pulire un layer specifico, si utilizza il comando `CLEAR`:

```
CLEAR 1-3
```

Per pulire tutti i layer di un canale:

```
CLEAR 1
```

#### Scambio di Layer

Per scambiare il contenuto di due layer, si utilizza il comando `SWAP`:

```
SWAP 1-1 1-2
```

Questo comando scambia il contenuto del layer 1 con quello del layer 2 nel canale 1.

#### Routing tra Layer

È possibile instradare l'output di un canale a un layer di un altro canale utilizzando il producer `route://`:

```
PLAY 1-10 route://2
```

Questo comando instrada l'output del canale 2 al layer 10 del canale 1.

### Strategie di Utilizzo dei Layer

#### Organizzazione Logica

È consigliabile organizzare i layer in modo logico e coerente:

- Layer 1-5: Contenuti principali (video, immagini)
- Layer 6-10: Grafica di sfondo
- Layer 11-15: Grafica in primo piano (lower thirds, loghi)
- Layer 16-20: Overlay (ticker, orologi)

#### Riutilizzo dei Layer

Per ottimizzare le risorse, è consigliabile riutilizzare i layer quando possibile:

```
PLAY 1-1 video1
LOADBG 1-1 video2 MIX 25
```

Invece di:

```
PLAY 1-1 video1
PLAY 1-2 video2
```

#### Layer Dedicati

Per elementi che devono rimanere sempre visibili, è consigliabile utilizzare layer dedicati:

```
PLAY 1-20 logo
```

Il logo rimarrà visibile indipendentemente dai cambiamenti nei layer inferiori.

### Limiti e Considerazioni

- CasparCG supporta fino a 999 layer per canale, ma per motivi di prestazioni è consigliabile limitarsi a un numero ragionevole (20-30)
- Ogni layer consuma risorse GPU, quindi un numero eccessivo di layer può influire sulle prestazioni
- I layer sono renderizzati in ordine crescente, quindi i layer con numeri più alti appaiono sopra quelli con numeri più bassi
- I layer vuoti non consumano risorse significative

## Transizioni

### Introduzione alle Transizioni

Le transizioni in CasparCG consentono di passare da un contenuto all'altro in modo fluido e professionale. CasparCG supporta vari tipi di transizioni, che possono essere applicate sia a livello di comandi media (PLAY, LOADBG) sia a livello di comandi mixer.

### Tipi di Transizioni

#### Transizioni di Base

CasparCG supporta i seguenti tipi di transizioni di base:

- **CUT**: Taglio netto, senza transizione
- **MIX**: Dissolvenza incrociata (cross-fade)
- **PUSH**: Transizione a spinta
- **WIPE**: Transizione a tendina
- **SLIDE**: Transizione a scorrimento

#### Transizioni Personalizzate

Oltre alle transizioni di base, è possibile creare transizioni personalizzate utilizzando i comandi mixer o template grafici.

### Transizioni nei Comandi Media

Le transizioni possono essere specificate nei comandi `PLAY` e `LOADBG`:

```
PLAY [canale]-[layer] [nome_clip] [transizione] [durata_transizione]
LOADBG [canale]-[layer] [nome_clip] [transizione] [durata_transizione] [auto]
```

Esempi:

```
PLAY 1-1 video MIX 25
LOADBG 1-1 video PUSH 25 AUTO
```

#### Parametro AUTO

Il parametro `AUTO` nel comando `LOADBG` fa sì che il clip precaricato venga riprodotto automaticamente quando il clip corrente termina:

```
LOADBG 1-1 video2 MIX 25 AUTO
```

### Transizioni con il Mixer

Le transizioni possono essere create anche utilizzando i comandi mixer, specificando una durata di transizione:

```
MIXER 1-1 OPACITY 1 0
MIXER 1-1 OPACITY 0 25
```

Questo crea un fade-out di 25 frame.

### Esempi di Transizioni

#### Dissolvenza Incrociata (Cross-Fade)

```
PLAY 1-1 video1
LOADBG 1-1 video2 MIX 25
PLAY 1-1
```

Oppure:

```
PLAY 1-1 video1
LOADBG 1-1 video2 MIX 25 AUTO
```

#### Fade to Black

```
PLAY 1-1 video
MIXER 1-1 OPACITY 1 0
MIXER 1-1 OPACITY 0 25
```

#### Transizione a Spinta (Push)

```
PLAY 1-1 video1
LOADBG 1-1 video2 PUSH 25
PLAY 1-1
```

#### Transizione a Tendina (Wipe)

```
PLAY 1-1 video1
LOADBG 1-1 video2 WIPE 25
PLAY 1-1
```

#### Transizione a Scorrimento (Slide)

```
PLAY 1-1 video1
LOADBG 1-1 video2 SLIDE 25
PLAY 1-1
```

### Transizioni Avanzate con il Mixer

#### Zoom Out / Zoom In

```
PLAY 1-1 video1
MIXER 1-1 FILL 0 0 1 1 0
MIXER 1-1 FILL 0.25 0.25 0.5 0.5 25
LOADBG 1-1 video2
PLAY 1-1
MIXER 1-1 FILL 0.25 0.25 0.5 0.5 0
MIXER 1-1 FILL 0 0 1 1 25
```

#### Rotazione

```
PLAY 1-1 video1
MIXER 1-1 ROTATION 0 0
MIXER 1-1 ROTATION 90 25
LOADBG 1-1 video2
PLAY 1-1
MIXER 1-1 ROTATION 90 0
MIXER 1-1 ROTATION 180 25
```

#### Transizione con Opacità

```
PLAY 1-1 video1
PLAY 1-2 video2
MIXER 1-2 OPACITY 0 0
MIXER 1-2 OPACITY 1 25
CLEAR 1-1
```

### Transizioni con Template Grafici

I template grafici possono essere utilizzati per creare transizioni personalizzate:

1. Creare un template HTML con un'animazione di transizione
2. Utilizzare il template come transizione tra due clip

Esempio:

```
PLAY 1-1 video1
CG 1-2 ADD 1 transition 1
CG 1-2 PLAY 1
LOADBG 1-1 video2
```

Il template di transizione può utilizzare JavaScript per controllare quando riprodurre il secondo video:

```javascript
function play() {
    // Avvia l'animazione di transizione
    startTransition();
    
    // Dopo un certo tempo, invia il comando per riprodurre il secondo video
    setTimeout(function() {
        try {
            window.casparcg.sendCommand('PLAY 1-1');
            
            // Dopo che il secondo video è stato avviato, rimuovi il template
            setTimeout(function() {
                try {
                    window.casparcg.sendCommand('CG 1-2 REMOVE 1');
                } catch (e) {
                    console.log('Error sending command:', e);
                }
            }, 500);
        } catch (e) {
            console.log('Error sending command:', e);
        }
    }, 1000); // Tempo in millisecondi
}
```

### Best Practices per le Transizioni

1. **Durata delle Transizioni**:
   - Utilizzare durate appropriate per il contesto (25-50 frame per transizioni standard)
   - Evitare transizioni troppo lunghe che possono annoiare lo spettatore
   - Considerare il frame rate del canale quando si specificano le durate

2. **Coerenza**:
   - Utilizzare transizioni coerenti all'interno della stessa produzione
   - Standardizzare i tipi e le durate delle transizioni

3. **Prestazioni**:
   - Evitare transizioni troppo complesse che possono influire sulle prestazioni
   - Testare le transizioni su hardware reale
   - Monitorare l'utilizzo della CPU e della GPU durante le transizioni

4. **Pianificazione**:
   - Pianificare le transizioni in anticipo
   - Precaricamento di contenuti per transizioni fluide
   - Coordinare le transizioni tra layer diversi

## Integrazione con Hardware

### Dispositivi Blackmagic Design

CasparCG supporta nativamente i dispositivi Blackmagic Design tramite l'SDK DeckLink. Questi dispositivi consentono l'input e l'output di video professionale in vari formati (SDI, HDMI).

#### Configurazione di Dispositivi DeckLink

La configurazione dei dispositivi DeckLink avviene nel file `casparcg.config`:

```xml
<channel>
  <video-mode>1080i5000</video-mode>
  <consumers>
    <decklink>
      <device>1</device>
      <key-device>2</key-device>
      <embedded-audio>true</embedded-audio>
      <latency>normal</latency>
      <keyer>external</keyer>
      <key-only>false</key-only>
    </decklink>
  </consumers>
</channel>
```

Parametri principali:
- `device`: Indice del dispositivo DeckLink per l'output fill
- `key-device`: Indice del dispositivo DeckLink per l'output key (per keying esterno)
- `embedded-audio`: Abilita l'audio embedded nell'output SDI
- `latency`: Modalità di latenza (normal, low, default)
- `keyer`: Tipo di keyer (external, internal, default)
- `key-only`: Se true, invia solo il segnale key

#### Input da Dispositivi DeckLink

Per acquisire video da dispositivi DeckLink, si utilizza il producer `decklink`:

```
PLAY 1-1 decklink://1
```

Questo comando acquisisce video dal dispositivo DeckLink 1 e lo riproduce sul canale 1, layer 1.

#### Output su Dispositivi DeckLink

L'output su dispositivi DeckLink è configurato come consumer nel file `casparcg.config`. Non sono necessari comandi AMCP specifici per l'output, in quanto il canale invia automaticamente il suo output ai consumer configurati.

#### Keying con Dispositivi DeckLink

CasparCG supporta sia il keying interno che quello esterno:

- **Keying Interno**: CasparCG compone il fill e il key internamente e invia solo il segnale composito
- **Keying Esterno**: CasparCG invia separatamente i segnali fill e key a due dispositivi DeckLink, e il keying viene eseguito da un dispositivo esterno (mixer video)

Configurazione per keying esterno:

```xml
<decklink>
  <device>1</device>
  <key-device>2</key-device>
  <keyer>external</keyer>
  <key-only>false</key-only>
</decklink>
```

### Streaming e Rete

CasparCG supporta vari protocolli di streaming per l'input e l'output di video su rete.

#### Streaming Output

CasparCG può inviare il suo output a vari servizi di streaming tramite il consumer `stream`:

```xml
<channel>
  <video-mode>720p5000</video-mode>
  <consumers>
    <stream>
      <path>rtmp://streaming-server/live/stream</path>
      <args>-format flv -c:v libx264 -b:v 1000k -c:a aac -b:a 128k</args>
    </stream>
  </consumers>
</channel>
```

Parametri principali:
- `path`: URL del server di streaming
- `args`: Argomenti FFmpeg per la codifica

#### Streaming Input

CasparCG può acquisire video da vari servizi di streaming:

```
PLAY 1-1 rtmp://streaming-server/live/stream
```

#### NDI (Network Device Interface)

CasparCG supporta NDI per la trasmissione di video su rete locale:

```xml
<channel>
  <video-mode>1080p5000</video-mode>
  <consumers>
    <ndi>
      <name>CasparCG</name>
      <allow-fields>false</allow-fields>
    </ndi>
  </consumers>
</channel>
```

Per acquisire video da una fonte NDI:

```
PLAY 1-1 ndi://computer/source
```

### Audio

CasparCG supporta vari dispositivi audio per l'input e l'output.

#### Audio Embedded

L'audio può essere embedded nell'output SDI:

```xml
<decklink>
  <device>1</device>
  <embedded-audio>true</embedded-audio>
</decklink>
```

#### Audio System

CasparCG può inviare l'audio ai dispositivi audio del sistema:

```xml
<channel>
  <video-mode>1080p5000</video-mode>
  <consumers>
    <system-audio>
      <channel-layout>stereo</channel-layout>
      <latency>200</latency>
    </system-audio>
  </consumers>
</channel>
```

#### Controllo del Volume

Il volume audio può essere controllato tramite il comando `MIXER VOLUME`:

```
MIXER 1-1 VOLUME 0.8 0
```

### Sincronizzazione e Genlock

Per produzioni broadcast professionali, è importante sincronizzare l'output di CasparCG con altri dispositivi.

#### Genlock

I dispositivi DeckLink supportano il genlock per la sincronizzazione con segnali di riferimento esterni:

```xml
<decklink>
  <device>1</device>
  <genlock>true</genlock>
</decklink>
```

#### Latenza

La latenza può essere regolata per bilanciare reattività e stabilità:

```xml
<decklink>
  <device>1</device>
  <latency>normal</latency> <!-- normal, low, default -->
</decklink>
```

### Controllo Remoto

CasparCG può essere controllato remotamente tramite vari protocolli.

#### AMCP su TCP

Il protocollo AMCP è accessibile tramite TCP:

```xml
<controllers>
  <tcp>
    <port>5250</port>
    <protocol>AMCP</protocol>
  </tcp>
</controllers>
```

#### OSC (Open Sound Control)

CasparCG può inviare e ricevere messaggi OSC:

```xml
<controllers>
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

### Integrazione con Sistemi di Automazione

CasparCG può essere integrato con vari sistemi di automazione broadcast.

#### Integrazione con Nebula

[Nebula](https://github.com/nebulabroadcast) è un sistema di automazione broadcast open source che può controllare CasparCG:

1. Configurare Nebula per comunicare con CasparCG tramite AMCP
2. Creare rundown in Nebula
3. Nebula invierà automaticamente i comandi AMCP a CasparCG

#### Integrazione con vMix

[vMix](https://www.vmix.com/) è un software di produzione video che può essere integrato con CasparCG:

1. Utilizzare l'output NDI di CasparCG come input in vMix
2. Utilizzare script in vMix per inviare comandi AMCP a CasparCG

#### Integrazione con Bitfocus Companion

[Bitfocus Companion](https://bitfocus.io/companion) è un software per il controllo di dispositivi broadcast che supporta CasparCG:

1. Installare il modulo CasparCG in Companion
2. Configurare pulsanti per inviare comandi AMCP a CasparCG
3. Utilizzare Companion con Stream Deck per il controllo fisico

### Best Practices per l'Integrazione Hardware

1. **Compatibilità**:
   - Verificare la compatibilità dei dispositivi con CasparCG
   - Utilizzare driver aggiornati
   - Testare l'integrazione in un ambiente di test prima della produzione

2. **Prestazioni**:
   - Monitorare l'utilizzo delle risorse
   - Ottimizzare le impostazioni di codifica per lo streaming
   - Utilizzare hardware dedicato per produzioni critiche

3. **Ridondanza**:
   - Implementare sistemi di backup
   - Testare scenari di failover
   - Documentare le procedure di emergenza

4. **Sicurezza**:
   - Limitare l'accesso ai controller AMCP
   - Utilizzare firewall per proteggere i server
   - Implementare autenticazione dove possibile
