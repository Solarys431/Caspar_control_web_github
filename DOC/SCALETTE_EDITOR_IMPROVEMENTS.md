# Miglioramenti Editor di Scalette - CasparCG Control Web

## Problemi Risolti

### 1. Template Multipli Non Riprodotti
**Problema**: Quando si premeva play su una storia con template grafici multipli e un media, solo il primo template veniva riprodotto.

**Soluzione**:
- Modificata la logica di riproduzione in `index.js` (righe 1011-1058)
- Sostituito `forEach` con un loop `for...of` asincrono
- Aggiunto delay tra template per evitare conflitti (100ms)
- Ogni template ora utilizza un layer univoco (baseLayer + index)
- Resa la funzione `handlePlayTemplate` asincrona per gestire correttamente le Promise
- Migliorata la gestione degli errori con try/catch

### 2. Controlli Template Grafici Mancanti
**Problema**: Nei controlli della preview mancavano i controlli specifici per i template grafici.

**Soluzione**:
- Esteso `PlaybackControls.js` con nuovi controlli per template:
  - CG Add (Aggiungi Template)
  - CG Play (Riproduci Template)
  - CG Update (Aggiorna Template)
  - CG Stop (Ferma Template)
  - CG Clear (Rimuovi Template)
- Aggiunta prop `showTemplateControls` per mostrare/nascondere i controlli
- Aggiunta prop `onTemplateControl` per gestire le azioni sui template

### 3. Comando Loop e Resume Mancanti
**Problema**: Mancava il comando loop per i media e il comando resume non era implementato correttamente.

**Soluzione**:
- Aggiunto comando `loop` in `usePreviewPlayer.js`
- Il comando loop utilizza `PLAY [channel]-[layer] "[media]" LOOP`
- Migliorata l'implementazione del comando `resume` esistente
- Aggiunto bottone Loop nei controlli di riproduzione

### 4. Finestra Preview Non Flottante
**Problema**: La finestra di anteprima utilizzava un Dialog fisso non trascinabile.

**Soluzione**:
- Installata dipendenza `react-draggable`
- Sostituito Dialog con componente `Draggable` + `Paper`
- Aggiunta barra di trascinamento con icona drag indicator
- Finestra ora completamente trascinabile e ridimensionabile
- Mantiene posizione durante l'uso
- Stile migliorato con elevazione e header colorato

## File Modificati

### 1. `index.js` (Editor Principale)
- Migliorata logica riproduzione template multipli
- Resa asincrona la funzione `handlePlayTemplate`
- Aggiunta gestione errori robusta
- Passaggio di `handleTemplateControl` al PreviewSection

### 2. `components/PlaybackControls.js`
- Aggiunti controlli per template grafici
- Nuove icone e tooltip
- Separazione visiva tra controlli media e template
- Supporto per modalità compatta

### 3. `hooks/usePreviewPlayer.js`
- Aggiunta funzione `handleTemplateControl` asincrona
- Implementato comando loop
- Migliorata gestione comandi CasparCG per template
- Aggiunto supporto per layer dedicati ai template

### 4. `components/PreviewSection.js`
- Sostituito Dialog con finestra draggable
- Aggiunta barra di trascinamento
- Migliorato layout e stile
- Integrati controlli template nella UI
- Rimossi import non utilizzati

## Comandi CasparCG Utilizzati

### Template Grafici
- `CG [channel]-[layer] ADD [cg-layer] "[template]" [play-on-load] [data]`
- `CG [channel]-[layer] PLAY [cg-layer]`
- `CG [channel]-[layer] UPDATE [cg-layer] [data]`
- `CG [channel]-[layer] STOP [cg-layer]`
- `CG [channel]-[layer] REMOVE [cg-layer]`

### Media
- `PLAY [channel]-[layer] "[media]" LOOP` (nuovo comando loop)
- Comandi esistenti: PLAY, PAUSE, RESUME, STOP, SEEK

## Configurazione Layer

### Template Multipli
- Ogni template utilizza un layer univoco: `baseLayer + index`
- Evita conflitti tra template sullo stesso layer
- Configurazione automatica dei layer in base all'ordine

### Preview
- Media: Canale di preview configurato
- Template: Layer 2 dedicato per template nella preview
- CG Layer: 1 (default, configurabile)

## Test e Verifica

Per testare le modifiche:

1. **Template Multipli**:
   - Creare una storia con media + 2+ template
   - Configurare template su layer diversi
   - Premere play e verificare che tutti i template vengano riprodotti

2. **Controlli Template**:
   - Selezionare un template nella preview
   - Verificare che appaiano i controlli CG
   - Testare ogni comando (Add, Play, Update, Stop, Clear)

3. **Comando Loop**:
   - Riprodurre un media
   - Premere il bottone Loop
   - Verificare che il media si ripeta

4. **Finestra Draggable**:
   - Aprire preview in finestra separata
   - Trascinare la finestra usando la barra superiore
   - Verificare che rimanga nella posizione impostata

## Note Tecniche

- Tutte le modifiche sono backward compatible
- Gestione errori migliorata con logging dettagliato
- Performance ottimizzate con delay controllati
- UI responsive e accessibile
- Codice modulare e manutenibile

## Aggiornamenti Implementati (24/05/2025)

### 1. Finestra Preview Draggable ✅
- **Problema risolto**: Finestra preview non trascinabile
- **Soluzione**: Sostituito Dialog con componente Draggable + Paper
- **Miglioramenti**:
  - Finestra completamente trascinabile usando react-draggable
  - Barra di trascinamento con icona drag indicator
  - Classe `no-drag` per contenuti non trascinabili
  - Rimossi bounds="parent" per libertà di movimento

### 2. Nuovo Componente AdvancedControls ✅
- **Posizione**: Tra PreviewSection e ContextualInfoPanel (layout 4 colonne)
- **Funzionalità**:
  - Controlli media: Play, Pause, Resume, Stop, Loop, Avanza 10 Frame
  - Controlli template: CG Add, CG Play, CG Update, CG Stop, CG Clear
  - Interfaccia compatta con tooltip informativi
  - Visualizzazione condizionale basata sul tipo di elemento selezionato
  - Design responsive con griglia Material-UI

### 3. Comando Avanzamento 10 Frame ✅
- **Implementazione**: Nuovo comando `advance10frames` in usePreviewPlayer.js
- **Logica**:
  - Ottiene frame corrente dai dati OSC
  - Calcola nuovo frame (corrente + 10)
  - Utilizza comando `LOAD channel-layer "media" SEEK newFrame`
  - Gestione errori robusta

### 4. Comando Loop Implementato ✅
- **Comando CasparCG**: `PLAY channel-layer "media" LOOP`
- **Integrazione**: Aggiunto nei controlli di riproduzione
- **Funzionalità**: Attiva/disattiva loop del media corrente

### 5. Comando Resume Verificato ✅
- **Comando CasparCG**: `RESUME channel-layer`
- **Implementazione**: Già correttamente implementato
- **Gestione**: Supporta sia sessioni preview che comandi diretti

### 6. Template Multipli Migliorati ✅
- **Problema risolto**: Solo il primo template veniva riprodotto
- **Soluzioni implementate**:
  - Loop asincrono `for...of` invece di `forEach`
  - Layer univoci per ogni template (baseLayer + index)
  - Delay di 100ms tra template per evitare conflitti
  - Funzione `handlePlayTemplate` resa asincrona
  - Gestione errori migliorata con try/catch

### 7. Layout Migliorato ✅
- **Modifica**: Da 3 a 4 colonne nell'area superiore
- **Distribuzione**:
  - Preview: md={3}
  - Item Control: md={3}
  - Advanced Controls: md={3} (nuovo)
  - Info Contestuali: md={3}
- **Responsive**: Mantiene xs={12} per dispositivi mobili

## Comandi CasparCG Utilizzati

### Media
- `PLAY channel-layer "media"` - Riproduzione standard
- `PLAY channel-layer "media" LOOP` - Riproduzione con loop
- `PAUSE channel-layer` - Pausa
- `RESUME channel-layer` - Riprendi
- `STOP channel-layer` - Stop
- `LOAD channel-layer "media" SEEK frame` - Carica e vai a frame specifico

### Template Grafici
- `CG channel-layer ADD cg-layer "template" play-on-load data` - Aggiungi template
- `CG channel-layer PLAY cg-layer` - Riproduci template
- `CG channel-layer UPDATE cg-layer data` - Aggiorna template
- `CG channel-layer STOP cg-layer` - Ferma template
- `CG channel-layer REMOVE cg-layer` - Rimuovi template

## Dipendenze Aggiunte

- `react-draggable`: Per finestra preview trascinabile

## File Modificati

1. **server/server.js**: Correzione percorso template CasparCG
2. **components/AdvancedControls.js**: Nuovo componente controlli avanzati
3. **components/PreviewSection.js**: Finestra draggable e integrazione controlli
4. **components/PlaybackControls.js**: Controlli template e comando loop
5. **hooks/usePreviewPlayer.js**: Comandi avanzati e template control
6. **index.js**: Layout 4 colonne e integrazione AdvancedControls

## Test Completati ✅

- ✅ Compilazione senza errori
- ✅ Server Node.js funzionante
- ✅ Connessione CasparCG attiva
- ✅ Comandi CLS e TLS risolti
- ✅ Template multipli in riproduzione
- ✅ Finestra preview trascinabile
- ✅ Controlli avanzati visibili

## Prossimi Passi

1. Test funzionale completo dei nuovi controlli
2. Verifica comando avanzamento 10 frame con media in riproduzione
3. Test template multipli con timing diversi
4. Ottimizzazione performance se necessario
