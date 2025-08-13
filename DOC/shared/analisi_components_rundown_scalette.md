# Analisi Dettagliata delle Componenti Rundown e ScaletteEditor

## 1. Struttura e Architettura Generale

Il sistema è organizzato in due sezioni principali:
- **Rundown**: Gestisce la pianificazione e l'esecuzione di elementi multimediali durante una trasmissione in diretta
- **ScaletteEditor**: Permette la creazione, modifica e organizzazione degli elementi che possono poi essere inviati al Rundown

Entrambi i moduli sono implementati seguendo una struttura modulare che separa:
- Componenti UI
- Hook per la logica di business
- Utility funzionali

## 2. Analisi del Modulo Rundown

### 2.1 Struttura dei File

```
Rundown/
├── components/               # Componenti UI specifici per Rundown
│   ├── EditItemDialog.js     # Dialog per modifica elementi
│   ├── RundownClock.js       # Componente orologio e timer
│   ├── RundownDialogs.js     # Gestione centralizzata dialoghi
│   ├── RundownHeader.js      # Header con controlli e info principali
│   ├── RundownList.js        # Lista elementi del rundown
│   ├── RundownSettings.js    # Impostazioni rundown
│   ├── RundownTabs.js        # Tabs per navigazione funzionalità
│   ├── RundownTimeline.js    # Timeline visuale del rundown
│   └── StoryItemDialog.js    # Dialog specifico per elementi "Story"
├── hooks/                    # Custom hooks per la logica di business
│   ├── useRundownDialogs.js  # Gestione stato dialoghi
│   ├── useRundownItems.js    # Gestione elementi del rundown
│   ├── useRundownNotifications.js # Gestione notifiche
│   ├── useRundownPlayback.js # Controllo riproduzione
│   ├── useRundownPresence.js # Gestione utenti attivi (collaborazione)
│   └── useRundownTimers.js   # Gestione timer e countdown
├── index.js                  # Entry point (esporta RundownPage)
└── RundownPage.js            # Componente principale che orchestra tutto
```

### 2.2 Flusso di Lavoro e Funzionalità

#### Componente RundownPage.js

Il componente `RundownPage` è il punto centrale dell'applicazione Rundown. Orchestrando tutti gli altri componenti, gestisce:

1. **Caricamento e inizializzazione**:
   - Recupera l'ID del rundown dall'URL tramite `useParams`
   - Imposta il rundown attivo con `setActiveRundownId`
   - Carica le liste media e template quando la connessione a CasparCG è attiva

2. **Gestione stato e funzionalità**:
   - Utilizza `useRundown` come hook principale per accedere ai dati del rundown
   - Organizza l'interfaccia in tab (Rundown / Calendario)
   - Fornisce controlli per la visualizzazione della timeline
   - Gestisce la riproduzione tramite `useRundownPlayback`
   - Coordina i dialoghi con `useRundownDialogs`

3. **Interfaccia utente**:
   - Header con nome rundown e controlli principali
   - Visualizzazione tabellare o a timeline degli elementi
   - Orologio e controlli di riproduzione
   - Sistema di notifiche per feedback utente

#### Componente RundownList.js

`RundownList` è un componente complesso (oltre 1900 righe) che gestisce la visualizzazione tabellare degli elementi del rundown. Caratteristiche principali:

1. **Visualizzazione flessibile**:
   - Sistema di colonne configurabile con visibilità personalizzabile
   - Stili condizionali basati sullo stato degli elementi (in riproduzione, prossimo, ecc.)
   - Supporto per diversi tipi di elementi (MEDIA, TEMPLATE, STORY)

2. **Gestione interazioni**:
   - Menu contestuali per azioni specifiche per tipo di elemento
   - Controlli di riproduzione in-line per elementi multimediali
   - Filtri avanzati per elementi e colonne

3. **Integrazione con CasparCG**:
   - Visualizzazione stato riproduzione in tempo reale
   - Animazioni e indicatori visivi per elementi "on air"
   - Tooltip dettagliati per informazioni tecniche dei template

#### Hook useRundownPlayback.js

Questo hook è cruciale per l'interazione con il server CasparCG. Gestisce:

1. **Riproduzione elementi**:
   - `playMediaItem`: Riproduce elementi MEDIA con gestione template associati
   - `playTemplateItem`: Attiva template grafici con controllo layer e dati
   - `playStoryItem`: Gestisce la riproduzione di storie composte

2. **Controllo riproduzione**:
   - `stopMediaItem`: Arresta media e rimuove eventuali template collegati
   - `stopTemplateItem`: Disattiva template grafici
   - `playAll`/`stopAll`: Controlli per l'avvio/arresto dell'intero rundown

3. **Logging e gestione errori**:
   - Sistema di logging dettagliato per debug e monitoraggio
   - Gestione degli errori con feedback appropriato
   - Aggiornamento stato riproduzione elementi nel contesto

### 2.3 Integrazione con CasparCG

La comunicazione con CasparCG avviene tramite il contesto `CasparContext` che espone metodi per:

- **Comandi media**: `play`, `stop` per gestione file multimediali
- **Comandi template**: `cgAdd`, `cgPlay`, `cgStop`, `cgRemove`, `cgUpdate` per gestire grafica HTML
- **Monitoraggio**: Lettura stato playback tramite OSC per feedback in tempo reale

## 3. Analisi del Modulo ScaletteEditor

### 3.1 Struttura dei File

```
ScaletteEditor/
├── components/
│   ├── AdvancedTimeline/           # Timeline avanzata
│   │   ├── index.js                # Entry point timeline
│   │   ├── MainTimelineView.js     # Vista principale timeline
│   │   ├── Playhead.js             # Indicatore posizione attuale
│   │   ├── StoryTimelineView.js    # Timeline specifica storie
│   │   ├── TimelineCanvas.js       # Rendering canvas timeline
│   │   ├── TimelineControls.js     # Controlli zoom, pan, ecc.
│   │   └── TrackHeader.js          # Header tracce timeline
│   ├── ProfessionalTimeline/       # Implementazione alternativa timeline
│   │   ├── index.js                # Entry point
│   │   ├── TimelineControls.js     # Controlli timeline
│   │   ├── TimelinePlayhead.js     # Indicatore posizione riproduzione
│   │   ├── TimelineRuler.js        # Righello temporale
│   │   └── TimelineTrack.js        # Traccia singola timeline
│   ├── AdvancedControls.js         # Controlli avanzati editor
│   ├── CollaboratorsDialog.js      # Dialogo gestione collaboratori
│   ├── ContextualInfoPanel.js      # Pannello info contestuali
│   ├── EditableStoryContent.js     # Editor contenuto storie
│   ├── EditItemDialog.js           # Dialog modifica elementi
│   ├── ItemActionsCell.js          # Cella azioni elemento tabella
│   ├── ItemContextControls.js      # Controlli contestuali elemento
│   ├── ItemEditPanel.js            # Pannello modifica elemento
│   ├── ItemTypeIcon.js             # Icone per tipi elemento
│   ├── LiveClock.js                # Orologio tempo reale
│   ├── MediaDialog.js              # Selezione media
│   ├── PlaybackControls.js         # Controlli riproduzione
│   ├── PreviewSection.js           # Anteprima elementi
│   ├── RundownSelectorDialog.js    # Selezione rundown
│   ├── ScalettaCardView.js         # Vista a schede
│   ├── ScalettaGlobalInfoBar.js    # Barra info globale
│   ├── ScalettaItemCard.js         # Card singolo elemento
│   ├── ScalettaTable.js            # Vista tabellare
│   ├── ScalettaTableToolbar.js     # Barra strumenti tabella
│   ├── SelectionCheckbox.js        # Checkbox selezione
│   ├── SendToRundownDialog.js      # Dialog invio a rundown
│   ├── StatusBadge.js              # Badge stato elemento
│   ├── StoryContentTooltip.js      # Tooltip contenuto storie
│   ├── StoryDialog.js              # Dialog creazione storie
│   ├── TemplateDialog.js           # Dialog template
│   ├── ViewModeToggle.js           # Toggle modalità visualizzazione
│   └── WeekDaySelectDialog.js      # Dialog selezione giorno
└── [altri file non specificati nell'elenco]
```

### 3.2 Funzionalità Principali

#### Componente ScalettaTable.js

`ScalettaTable` è un componente sofisticato per la visualizzazione e manipolazione degli elementi delle scalette:

1. **Visualizzazione flessibile**:
   - Supporto per selezione multipla elementi
   - Colonne configurabili con visibilità personalizzabile
   - Stili condizionali basati su stato riproduzione e selezione

2. **Interazione avanzata**:
   - Supporto drag-and-drop per riordinamento elementi
   - Evidenziazione elemento attualmente in riproduzione
   - Indicatori visivi per elementi "ON AIR" e "NEXT"
   - Gestione del sistema di permessi basato sul ruolo utente

3. **Integrazione con playback**:
   - Hook `playbackSync` per monitoraggio stato riproduzione
   - Disabilitazione modifica per elementi in riproduzione
   - Controlli contestuali basati su stato corrente

#### Componente AdvancedTimeline

`MainTimelineView` e altri componenti della timeline implementano una visualizzazione temporale avanzata:

1. **Rendering avanzato**:
   - Utilizzo di HTML Canvas per performance ottimali
   - Zoom e pan fluidi con controlli intuitivi
   - Visualizzazione dettagliata durata e posizione elementi

2. **Interazione e modifica**:
   - Selezione, spostamento e ridimensionamento elementi
   - Rilevamento automatico conflitti temporali
   - Linee di snap per allineamento preciso

3. **Personalizzazione visiva**:
   - Codifica a colori per diversi tipi di elementi
   - Evidenziazione conflitti e sovrapposizioni
   - Righello temporale configurabile

### 3.3 Modelli di Progettazione Utilizzati

1. **Pattern di Composizione**:
   - Componenti specializzati combinati per funzionalità complesse
   - Riutilizzo di componenti base per interfacce consistenti

2. **Custom Hooks**:
   - Separazione logica di business dall'UI
   - Hooks specializzati per diverse funzionalità (dialoghi, riproduzione, notifiche)

3. **Context API**:
   - Condivisione stato globale senza prop drilling
   - Separazione contesti per diversi domini (riproduzione, autenticazione, profili)

4. **Render Props e HOC**:
   - Componenti riutilizzabili che ricevono funzioni di rendering
   - Higher-Order Components per funzionalità trasversali

## 4. Integrazione tra Rundown e ScaletteEditor

### 4.1 Flusso di Dati

1. **Creazione contenuti**:
   - Contenuti creati e organizzati in ScaletteEditor
   - Elementi configurati con parametri tecnici (canali, layer, timing)

2. **Trasferimento al Rundown**:
   - Dialogo `SendToRundownDialog` per inviare elementi selezionati
   - Trasformazione formato dati da scaletta a rundown

3. **Esecuzione**:
   - Elementi nel Rundown pronti per l'esecuzione
   - Feedback in tempo reale sullo stato di riproduzione

### 4.2 Sincronizzazione e Collaborazione

1. **Gestione utenti attivi**:
   - `useRundownPresence` per tracciare utenti attivi
   - `CollaboratorsDialog` per visualizzare e gestire collaboratori

2. **Sincronizzazione dati**:
   - Integrazione con Supabase per persistenza e sincronizzazione
   - Gestione conflitti in caso di modifiche simultanee

3. **Notifiche**:
   - Sistema notifiche in tempo reale per aggiornamenti collaborativi
   - Indicatori visivi per elementi modificati da altri utenti

## 5. Punti Critici e Ottimizzazioni Potenziali

1. **Performance**:
   - `RundownList.js` è molto esteso (>1900 righe) e potrebbe beneficiare di ulteriore modularizzazione
   - L'uso intensivo di Context API potrebbe causare re-rendering non necessari

2. **Gestione Errori**:
   - Sistema di logging avanzato già in uso, ma potrebbe beneficiare di un monitoraggio più centralizzato
   - Migliorare la gestione di scenari di errore specifici di CasparCG

3. **Ottimizzazioni UX**:
   - Migliorare la coerenza visiva tra modalità tabella e timeline
   - Fornire ulteriori indicatori visuali per lo stato globale del sistema

4. **Rifattorizzazione**:
   - Alcune funzionalità duplicate tra Rundown e ScaletteEditor potrebbero essere unificate
   - I componenti timeline duplicati (AdvancedTimeline e ProfessionalTimeline) potrebbero essere consolidati

## 6. Conclusioni

L'architettura dei moduli Rundown e ScaletteEditor è ben strutturata e modulare, con una chiara separazione tra:

- **Presentazione** (componenti UI)
- **Logica di business** (hooks personalizzati)
- **Gestione stato** (Context API)
- **Integrazioni esterne** (CasparCG, Supabase)

Il sistema implementa funzionalità avanzate per la gestione professionale dei contenuti broadcast, con particolare attenzione alla collaborazione in tempo reale e al controllo preciso della riproduzione multimediale.

I componenti sono progettati per essere riutilizzabili e configurabili, permettendo flessibilità d'uso in diversi contesti all'interno dell'applicazione.
