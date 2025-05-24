## Gestione dei Template Grafici

### Introduzione ai Template Grafici

I template grafici sono uno degli aspetti più potenti di CasparCG, consentendo di creare grafica dinamica e interattiva per le produzioni broadcast. CasparCG supporta due tipi principali di template:

1. **Template HTML**: Basati su tecnologie web standard (HTML5, CSS3, JavaScript)
2. **Template Flash**: Basati su Adobe Flash (deprecato nelle versioni recenti)

I template grafici possono essere utilizzati per vari scopi:
- Lower thirds (titoli e sottotitoli)
- Ticker e crawl di notizie
- Loghi e watermark
- Grafici e diagrammi
- Orologi e timer
- Scoreboard per eventi sportivi
- Animazioni e transizioni personalizzate

### Template HTML

I template HTML sono il metodo moderno e consigliato per creare grafica in CasparCG. Utilizzano il motore di rendering Chromium Embedded Framework (CEF) per visualizzare pagine web come grafica.

#### Struttura di un Template HTML

Un template HTML è essenzialmente una pagina web con alcune funzioni JavaScript specifiche per interagire con CasparCG. La struttura di base è la seguente:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CasparCG Template</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: transparent;
        }
        #text {
            font-family: Arial, sans-serif;
            font-size: 36px;
            color: white;
            text-shadow: 2px 2px 2px black;
            position: absolute;
            bottom: 50px;
            left: 50px;
        }
    </style>
</head>
<body>
    <div id="text"></div>
    
    <script>
        // Funzione per ricevere dati dal server CasparCG
        function update(data) {
            document.getElementById('text').innerHTML = data.text || '';
        }
        
        // Funzione per avviare l'animazione
        function play() {
            // Codice per l'animazione
        }
        
        // Funzione per fermare l'animazione
        function stop() {
            // Codice per fermare l'animazione
        }
        
        // Funzione per passare al passo successivo
        function next() {
            // Codice per il passo successivo
        }
    </script>
</body>
</html>
```

#### Funzioni JavaScript Richieste

I template HTML devono implementare alcune funzioni JavaScript per interagire con CasparCG:

- `update(data)`: Chiamata quando il template riceve nuovi dati
- `play()`: Chiamata quando il template deve iniziare l'animazione
- `stop()`: Chiamata quando il template deve fermare l'animazione
- `next()`: Chiamata quando il template deve passare al passo successivo

#### Utilizzo di Template HTML

Per utilizzare un template HTML, si seguono questi passaggi:

1. Creare il file HTML e salvarlo nella directory `templates` del server CasparCG
2. Utilizzare i comandi CG per caricare, riprodurre e aggiornare il template

Esempio di comandi:

```
CG 1-1 ADD 1 my_template 1 "<templateData><text>Hello World</text></templateData>"
CG 1-1 PLAY 1
CG 1-1 UPDATE 1 "<templateData><text>New Text</text></templateData>"
CG 1-1 STOP 1
CG 1-1 REMOVE 1
```

#### Passaggio di Dati ai Template

I dati vengono passati ai template in formato XML o JSON. Il formato XML è il più comune:

```xml
<templateData>
    <text>Hello World</text>
    <color>#FF0000</color>
    <position>bottom</position>
</templateData>
```

Nel template, questi dati sono accessibili tramite la funzione `update(data)`:

```javascript
function update(data) {
    document.getElementById('text').innerHTML = data.text || '';
    document.getElementById('text').style.color = data.color || 'white';
    document.getElementById('text').style.bottom = (data.position === 'bottom') ? '50px' : '200px';
}
```

#### Animazioni nei Template HTML

Le animazioni nei template HTML possono essere create utilizzando:
- CSS Animations
- CSS Transitions
- JavaScript Animations
- Librerie come GSAP, Anime.js, ecc.

Esempio di animazione con CSS:

```html
<style>
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    #text {
        opacity: 0;
    }
    
    #text.animate {
        animation: fadeIn 1s forwards;
    }
</style>

<script>
    function play() {
        document.getElementById('text').classList.add('animate');
    }
    
    function stop() {
        document.getElementById('text').classList.remove('animate');
    }
</script>
```

#### Responsive Design nei Template

I template dovrebbero essere progettati per adattarsi a diverse risoluzioni. Si possono utilizzare:
- Unità relative (%, vh, vw)
- Media queries
- JavaScript per calcolare dimensioni e posizioni

Esempio:

```html
<style>
    #text {
        font-size: 5vh;
        bottom: 10vh;
        left: 5vw;
    }
    
    @media (min-width: 1920px) {
        #text {
            font-size: 6vh;
        }
    }
</style>
```

### Template Flash (Deprecato)

I template Flash sono il metodo legacy per creare grafica in CasparCG. Sono basati su Adobe Flash, che è stato deprecato. Si consiglia di utilizzare template HTML per nuovi progetti.

#### Struttura di un Template Flash

Un template Flash è un file SWF con alcune funzioni ActionScript specifiche per interagire con CasparCG.

#### Funzioni ActionScript Richieste

I template Flash devono implementare alcune funzioni ActionScript per interagire con CasparCG:

- `SetData(data)`: Chiamata quando il template riceve nuovi dati
- `Play()`: Chiamata quando il template deve iniziare l'animazione
- `Stop()`: Chiamata quando il template deve fermare l'animazione
- `Next()`: Chiamata quando il template deve passare al passo successivo

#### Utilizzo di Template Flash

L'utilizzo di template Flash è simile a quello dei template HTML:

```
CG 1-1 ADD 1 my_flash_template 1 "<templateData><text>Hello World</text></templateData>"
CG 1-1 PLAY 1
CG 1-1 UPDATE 1 "<templateData><text>New Text</text></templateData>"
CG 1-1 STOP 1
CG 1-1 REMOVE 1
```

### Gestione Avanzata dei Template

#### Layer CG

I comandi CG utilizzano un concetto di "layer CG" che è diverso dai layer di canale. Un layer CG è un indice all'interno di un layer di canale. Questo consente di avere più template grafici sullo stesso layer di canale.

Esempio:

```
CG 1-1 ADD 1 lower_third 1 "<templateData><text>Presenter</text></templateData>"
CG 1-1 ADD 2 logo 1 "<templateData><position>top-right</position></templateData>"
CG 1-1 ADD 3 ticker 1 "<templateData><text>Breaking News</text></templateData>"
```

Questo esempio aggiunge tre template diversi al canale 1, layer 1, su layer CG 1, 2 e 3 rispettivamente.

#### Invocazione di Metodi

Il comando `CG INVOKE` consente di chiamare metodi personalizzati nei template:

```
CG 1-1 INVOKE 1 "myCustomMethod()"
```

Questo è utile per implementare funzionalità personalizzate nei template.

#### Gestione degli Eventi

I template possono comunicare con il server CasparCG tramite eventi. Nei template HTML, si può utilizzare:

```javascript
window.onbeforeunload = function() {
    try {
        window.casparcg.sendCommand('PLAY 1-2 EMPTY');
    } catch (e) {
        console.log('Error sending command:', e);
    }
    return null;
};
```

### Best Practices per i Template

1. **Ottimizzazione delle Prestazioni**:
   - Minimizzare l'uso di animazioni complesse
   - Evitare operazioni DOM intensive
   - Utilizzare la GPU per le animazioni (transform, opacity)
   - Precaricamento di risorse (immagini, font)

2. **Organizzazione dei Template**:
   - Utilizzare una struttura di directory logica
   - Nominare i template in modo descrittivo
   - Documentare i parametri accettati dai template

3. **Compatibilità**:
   - Testare i template su diverse risoluzioni
   - Evitare dipendenze esterne (CDN)
   - Utilizzare tecnologie web standard

4. **Riutilizzabilità**:
   - Creare template modulari
   - Utilizzare parametri per personalizzare l'aspetto
   - Implementare funzionalità comuni in librerie condivise

## Controllo del Mixer

### Introduzione al Mixer

Il mixer di CasparCG è un componente potente che consente di manipolare e comporre layer video e grafici. Permette di:

- Posizionare e ridimensionare i layer
- Applicare effetti come opacità, luminosità, contrasto
- Creare transizioni fluide tra stati diversi
- Comporre scene complesse combinando più layer

### Concetti di Base del Mixer

#### Coordinate e Dimensioni

Il mixer di CasparCG utilizza un sistema di coordinate normalizzato (0-1) per posizionare e dimensionare i layer:

- `(0,0)` è l'angolo in alto a sinistra
- `(1,1)` è l'angolo in basso a destra
- I valori possono essere anche negativi o maggiori di 1 per posizionare i layer parzialmente fuori dallo schermo

#### Trasformazioni

Le trasformazioni principali che possono essere applicate ai layer sono:

- **Fill**: Posizione e scala
- **Clip**: Ritaglio
- **Opacity**: Trasparenza
- **Brightness**: Luminosità
- **Contrast**: Contrasto
- **Saturation**: Saturazione
- **Rotation**: Rotazione
- **Volume**: Volume audio

#### Transizioni

Le transizioni del mixer consentono di passare gradualmente da uno stato all'altro. La durata delle transizioni è specificata in frame.

### Comandi Mixer Dettagliati

#### MIXER FILL

Il comando `MIXER FILL` è uno dei più utilizzati e consente di posizionare e ridimensionare un layer:

```
MIXER [canale]-[layer] FILL [x] [y] [x-scale] [y-scale] [duration]
```

Dove:
- `x` e `y` sono le coordinate del punto in alto a sinistra (0-1)
- `x-scale` e `y-scale` sono i fattori di scala (0-1)
- `duration` è la durata della transizione in frame

Esempi:

1. Posizionare un layer al centro dello schermo a metà della sua dimensione originale:
```
MIXER 1-1 FILL 0.25 0.25 0.5 0.5 0
```

2. Creare un picture-in-picture nell'angolo in basso a destra:
```
MIXER 1-1 FILL 0.7 0.7 0.3 0.3 0
```

3. Animare un layer dal centro dello schermo all'angolo in alto a sinistra:
```
MIXER 1-1 FILL 0.25 0.25 0.5 0.5 0
MIXER 1-1 FILL 0 0 0.3 0.3 50
```

#### MIXER CLIP

Il comando `MIXER CLIP` consente di ritagliare un layer, mostrando solo una parte di esso:

```
MIXER [canale]-[layer] CLIP [x] [y] [width] [height] [duration]
```

Dove:
- `x` e `y` sono le coordinate del punto in alto a sinistra del ritaglio (0-1)
- `width` e `height` sono la larghezza e l'altezza del ritaglio (0-1)
- `duration` è la durata della transizione in frame

Esempi:

1. Mostrare solo la metà superiore di un layer:
```
MIXER 1-1 CLIP 0 0 1 0.5 0
```

2. Creare un effetto di "wipe" da sinistra a destra:
```
MIXER 1-1 CLIP 0 0 0 1 0
MIXER 1-1 CLIP 0 0 1 1 50
```

#### MIXER OPACITY

Il comando `MIXER OPACITY` consente di impostare la trasparenza di un layer:

```
MIXER [canale]-[layer] OPACITY [value] [duration]
```

Dove:
- `value` è il valore di opacità (0-1, dove 0 è trasparente e 1 è opaco)
- `duration` è la durata della transizione in frame

Esempi:

1. Impostare un layer semi-trasparente:
```
MIXER 1-1 OPACITY 0.5 0
```

2. Creare un fade-in:
```
MIXER 1-1 OPACITY 0 0
MIXER 1-1 OPACITY 1 25
```

3. Creare un fade-out:
```
MIXER 1-1 OPACITY 1 0
MIXER 1-1 OPACITY 0 25
```

#### MIXER BRIGHTNESS

Il comando `MIXER BRIGHTNESS` consente di regolare la luminosità di un layer:

```
MIXER [canale]-[layer] BRIGHTNESS [value] [duration]
```

Dove:
- `value` è il valore di luminosità (0-1, dove 0 è nero e 1 è normale)
- `duration` è la durata della transizione in frame

Esempi:

1. Aumentare la luminosità di un layer:
```
MIXER 1-1 BRIGHTNESS 1.5 0
```

2. Creare un effetto di "flash":
```
MIXER 1-1 BRIGHTNESS 1 0
MIXER 1-1 BRIGHTNESS 2 12
MIXER 1-1 BRIGHTNESS 1 12
```

#### MIXER CONTRAST

Il comando `MIXER CONTRAST` consente di regolare il contrasto di un layer:

```
MIXER [canale]-[layer] CONTRAST [value] [duration]
```

Dove:
- `value` è il valore di contrasto (0-1, dove 0 è grigio e 1 è normale)
- `duration` è la durata della transizione in frame

Esempio:

```
MIXER 1-1 CONTRAST 1.5 0
```

#### MIXER SATURATION

Il comando `MIXER SATURATION` consente di regolare la saturazione di un layer:

```
MIXER [canale]-[layer] SATURATION [value] [duration]
```

Dove:
- `value` è il valore di saturazione (0-1, dove 0 è bianco e nero e 1 è normale)
- `duration` è la durata della transizione in frame

Esempi:

1. Convertire un layer in bianco e nero:
```
MIXER 1-1 SATURATION 0 0
```

2. Aumentare la saturazione di un layer:
```
MIXER 1-1 SATURATION 1.5 0
```

#### MIXER ROTATION

Il comando `MIXER ROTATION` consente di ruotare un layer:

```
MIXER [canale]-[layer] ROTATION [angle] [duration]
```

Dove:
- `angle` è l'angolo di rotazione in gradi
- `duration` è la durata della transizione in frame

Esempi:

1. Ruotare un layer di 45 gradi:
```
MIXER 1-1 ROTATION 45 0
```

2. Creare un'animazione di rotazione continua:
```
MIXER 1-1 ROTATION 0 0
MIXER 1-1 ROTATION 360 100
```

#### MIXER VOLUME

Il comando `MIXER VOLUME` consente di regolare il volume audio di un layer:

```
MIXER [canale]-[layer] VOLUME [value] [duration]
```

Dove:
- `value` è il valore di volume (0-1, dove 0 è muto e 1 è normale)
- `duration` è la durata della transizione in frame

Esempi:

1. Abbassare il volume di un layer:
```
MIXER 1-1 VOLUME 0.5 0
```

2. Creare un fade-out audio:
```
MIXER 1-1 VOLUME 1 0
MIXER 1-1 VOLUME 0 50
```

### Combinazione di Comandi Mixer

I comandi mixer possono essere combinati per creare effetti complessi:

1. Picture-in-picture con bordo trasparente:
```
MIXER 1-1 FILL 0.7 0.7 0.25 0.25 0
MIXER 1-1 OPACITY 0.8 0
```

2. Zoom in con aumento di luminosità:
```
MIXER 1-1 FILL 0.25 0.25 0.5 0.5 0
MIXER 1-1 BRIGHTNESS 1 0
MIXER 1-1 FILL 0 0 1 1 50
MIXER 1-1 BRIGHTNESS 1.2 50
```

3. Rotazione con fade-in:
```
MIXER 1-1 ROTATION 45 0
MIXER 1-1 OPACITY 0 0
MIXER 1-1 OPACITY 1 25
```

### Tecniche Avanzate del Mixer

#### Keyframing

Sebbene CasparCG non supporti direttamente il keyframing, è possibile simularlo inviando una sequenza di comandi mixer con diverse durate:

```
MIXER 1-1 FILL 0 0 1 1 0
MIXER 1-1 FILL 0.1 0.1 0.8 0.8 25
MIXER 1-1 FILL 0.2 0.2 0.6 0.6 25
MIXER 1-1 FILL 0.3 0.3 0.4 0.4 25
MIXER 1-1 FILL 0.4 0.4 0.2 0.2 25
```

#### Composizione di Layer

La composizione di layer consente di creare scene complesse combinando più layer:

1. Background video:
```
PLAY 1-1 background
```

2. Logo in sovraimpressione:
```
PLAY 1-2 logo
MIXER 1-2 FILL 0.8 0.1 0.15 0.15 0
```

3. Lower third:
```
CG 1-3 ADD 1 lower_third 1 "<templateData><text>Breaking News</text></templateData>"
```

4. Ticker in basso:
```
CG 1-4 ADD 1 ticker 1 "<templateData><text>Latest updates...</text></templateData>"
MIXER 1-4 FILL 0 0.9 1 0.1 0
```

#### Effetti di Transizione Personalizzati

È possibile creare effetti di transizione personalizzati combinando vari comandi mixer:

1. Transizione a spirale:
```
LOADBG 1-1 next_video
MIXER 1-1 FILL 0.5 0.5 0 0 0
MIXER 1-1 ROTATION 0 0
PLAY 1-1 next_video
MIXER 1-1 FILL 0.5 0.5 1 1 50
MIXER 1-1 ROTATION 720 50
```

2. Transizione a diamante:
```
LOADBG 1-1 next_video
MIXER 1-1 CLIP 0.5 0.5 0 0 0
PLAY 1-1 next_video
MIXER 1-1 CLIP 0 0 1 1 50
```

### Best Practices per il Mixer

1. **Ottimizzazione delle Prestazioni**:
   - Limitare il numero di layer attivi contemporaneamente
   - Evitare transizioni troppo complesse
   - Utilizzare durate di transizione appropriate

2. **Organizzazione dei Layer**:
   - Utilizzare layer diversi per elementi diversi
   - Mantenere una gerarchia logica (background su layer inferiori, grafica su layer superiori)
   - Documentare l'utilizzo dei layer

3. **Transizioni Fluide**:
   - Utilizzare durate di transizione appropriate
   - Coordinare le transizioni tra layer diversi
   - Testare le transizioni su hardware reale

4. **Riutilizzabilità**:
   - Creare script o macro per effetti comuni
   - Standardizzare le posizioni e le dimensioni
   - Utilizzare template per layout comuni
