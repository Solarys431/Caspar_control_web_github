Ecco una proposta per la struttura JSONB completa e definitiva per il campo data nella tua tabella scaletta_items su Supabase. Questa struttura cerca di consolidare e organizzare tutti i campi che hai menzionato e che sono presenti nei tuoi file, come RundownDialogs.js, EditItemDialog.js (sia per il rundown che per le scalette), RundownContext.js, e le necessità dell'editor di scalette collaborativo.

{
  // --- Sezione: Informazioni Generali dell'Elemento ---
  // Questi campi sono comuni e forniscono metadati di base sull'item.
  "customName": "Intro Video Principale", // Nome personalizzato visualizzato all'utente. Mappato da: item.data.customName (RundownContext, ScaletteEditor), rundownName (WeeklyCalendar), ecc.
  "originalName": "MAIN_INTRO_V3.mp4",    // Nome del file originale o del template base. Mappato da: item.name (RundownContext), rundownPath (WeeklyCalendar), ecc.
  "notes": "Verificare audio con regia prima della messa in onda. Durata esatta da confermare.", // Note libere sull'elemento. Mappato da: item.data.note (RundownContext), rundownNote (WeeklyCalendar), ecc.
  "sourcePath": "media/main_show/INTRO_FINALE_V3.mp4", // Percorso originale del file sorgente, per riferimento o per logiche di localizzazione. Mappato da: item.data.location (RundownContext), rundownPath (WeeklyCalendar), item.data.clip/template (ScaletteEditor).

  // --- Sezione: Timing e Durata ---
  // Raggruppa tutte le informazioni relative alla temporizzazione dell'elemento.
  "timing": {
    "startTime": "00:10:00",      // Orario di inizio previsto (HH:MM:SS). Mappato da: item.data.startTime (RundownContext), rundownStartTime (WeeklyCalendar), ecc.
    "duration": "00:01:35",       // Durata prevista dell'elemento (HH:MM:SS). Mappato da: item.data.duration (RundownContext), rundownDuration (WeeklyCalendar), ecc.
    "inPoint": "00:00:03:10",     // Punto di IN per media (HH:MM:SS:FF o HH:MM:SS). Mappato da: item.data.inPoint (RundownContext), rundownInPoint (WeeklyCalendar), ecc.
    "outPoint": "00:01:30:00"     // Punto di OUT per media (HH:MM:SS:FF o HH:MM:SS). Mappato da: item.data.outPoint (RundownContext), rundownOutPoint (WeeklyCalendar), ecc.
  },

  // --- Sezione: Configurazione CasparCG Generale ---
  // Parametri di base per la riproduzione su CasparCG, comuni a media e template.
  "casparcgConfig": {
    "channel": 1,                 // Canale CasparCG. Mappato da: item.data.channel (RundownContext), itemChannel (WeeklyCalendar), ecc.
    "layer": 10                   // Layer video CasparCG. Mappato da: item.data.layer (RundownContext), itemLayer (WeeklyCalendar), ecc.
    // Altri parametri generali CasparCG potrebbero essere aggiunti qui se necessario in futuro (es. transizioni di default).
  },

  // --- Sezione: Dettagli Specifici per Tipo MEDIA ---
  // Questo oggetto è presente e popolato SOLO se l'item.type (nella tabella principale) è 'MEDIA'.
  // Altrimenti, può essere null o omesso.
  "mediaDetails": {
    "clipPath": "INTRO_FINALE_V3", // Nome/percorso del clip come deve essere inviato a CasparCG (potrebbe essere diverso da sourcePath se ci sono convenzioni). Mappato da: item.data.clip (RundownContext), rundownPath (WeeklyCalendar per MEDIA).
    "loop": false,                 // Booleano per la riproduzione in loop. Mappato da: item.data.loop (RundownContext), itemLoop (WeeklyCalendar).
    "autoNext": false,             // Booleano per avanzamento automatico (se mantenuto da RundownContext).
    "linkedTemplate": null         // Può essere null o contenere un oggetto che descrive un template grafico annidato.
                                   // Mappato da: item.data.linkedTemplate (RundownContext), vari campi linkedTemplate* (WeeklyCalendar).
    /* Esempio di struttura per "linkedTemplate" (se presente):
    "linkedTemplate": {
      "templateFile": "templates/LOWER_THIRD_SPEAKER.ft", // Percorso del file del template annidato.
      "customName": "Sottopancia Relatore Evento",       // Nome personalizzato per questo template annidato.
      "casparcgConfig": {                                // Configurazione CasparCG specifica per il template annidato.
        "channel": 1,                                    // Canale (spesso lo stesso del media).
        "layer": 20,                                     // Layer video per il template (diverso da quello del media).
        "cgLayer": 1                                     // CG Layer specifico del template.
      },
      "playOnLoad": true,                                // Se il template deve partire automaticamente.
      "delay": 500,                                      // Ritardo in ms dopo l'inizio del media.
      "instanceData": {                                  // Dati specifici per questa istanza del template annidato.
        "f0": "Mario Rossi",
        "f1": "CEO, FutureTech Corp",
        "logoSource": "media/logos/FutureTech_Logo.png"
        // ...altri campi fX o campi definiti dal manifest del template annidato
      }
    }
    */
  },

  // --- Sezione: Dettagli Specifici per Tipo TEMPLATE ---
  // Questo oggetto è presente e popolato SOLO se l'item.type (nella tabella principale) è 'TEMPLATE'.
  // Altrimenti, può essere null o omesso.
  "templateDetails": {
    "templateFile": "templates/MAIN_TITLE_GRAPHIC.ft", // Nome/percorso del file template come deve essere inviato a CasparCG. Mappato da: item.data.template (RundownContext), rundownPath (WeeklyCalendar per TEMPLATE).
    "casparcgConfig": {                               // Configurazione CasparCG aggiuntiva/specifica per questo template.
                                                      // channel e layer video sono già in casparcgConfig generale.
      "cgLayer": 1,                                   // CG Layer specifico del template. Mappato da: item.data.cgLayer (RundownContext), itemCgLayer (WeeklyCalendar).
      "playOnLoad": true                              // Se il template deve partire al momento del CG ADD. Mappato da: item.data.playOnLoad (RundownContext), mainTemplatePlayOnLoad (WeeklyCalendar).
    },
    "autoRemove": false,                              // Se il template deve essere rimosso automaticamente dopo la sua durata (logica custom).
    "instanceData": {                                 // Dati specifici per questa istanza del template.
                                                      // Mappato da: item.data.data (RundownContext), vari campi templateField* o itemDataJson (WeeklyCalendar), templateData (GraphicsEditor).
      "mainTitle": "Benvenuti alla Conferenza",
      "subTitle": "Innovazione e Futuro",
      "backgroundColor": "#FF0000",
      "useAdvancedAnimation": true,
      "jsonData": "{\"key\":\"value\", \"nested\":{\"num\":123}}" // Per template che accettano un blocco JSON complesso.
      // ...altri campi fX o campi definiti dal manifest del template
    }
  },

  // --- Sezione: Internal Items (Solo per tipo STORY) ---
  // Array di elementi interni che compongono una storia complessa.
  // Utilizzato dalla Timeline Visuale Avanzata per gestione NLE-like.
  "internal_items": [
    {
      "id": "internal-001",                    // ID unico dell'elemento interno
      "type": "MEDIA",                         // Tipo: 'MEDIA', 'TEMPLATE', 'COMMAND', 'AUDIO'
      "name": "Video Principale",              // Nome visualizzato
      "relative_start_time": "00:00:00:00",    // Tempo di inizio relativo alla storia (HH:MM:SS:FF)
      "duration": "00:01:30:00",               // Durata dell'elemento (HH:MM:SS:FF)
      "track": 1,                              // Numero traccia per visualizzazione timeline
      "layer": 10,                             // Layer CasparCG
      "channel": 1,                            // Canale CasparCG
      "data": {                                // Dati specifici del tipo
        "clipPath": "stories/main_video.mp4",
        "inPoint": "00:00:05:00",
        "outPoint": "00:01:25:00",
        "loop": false
      }
    },
    {
      "id": "internal-002",
      "type": "TEMPLATE",
      "name": "Lower Third",
      "relative_start_time": "00:00:10:00",
      "duration": "00:00:15:00",
      "track": 2,
      "layer": 20,
      "channel": 1,
      "data": {
        "templateFile": "lower_thirds/news_lt.html",
        "cgLayer": 1,
        "playOnLoad": true,
        "instanceData": {
          "title": "Breaking News",
          "subtitle": "Aggiornamenti in tempo reale"
        }
      }
    }
  ],

  // --- Sezione: Metadati Aggiuntivi e di Stato (Opzionale) ---
  // Campi che potrebbero essere utili per la logica dell'applicazione.
  "uiHints": {
    "colorTag": "blue", // Un colore per etichettare l'item nella UI.
    "icon": "info"      // Nome di un'icona specifica per questo item.
  },
  "flags": {
    "requiresManualTrigger": false, // Se l'item necessita di un avvio manuale anche in modalità automatica.
    "isBreakingNews": false         // Esempio di flag per logiche speciali.
  }
}
```

**Note sulla Struttura:**

* **Flessibilità del JSONB:** Il bello del JSONB è che se un item MEDIA non ha un `linkedTemplate`, l'intera chiave `linkedTemplate` può essere `null` o semplicemente non esistere all'interno di `mediaDetails`. Similmente, se un item è di tipo MEDIA, l'intero oggetto `templateDetails` può essere `null` o assente, e viceversa.
* **`sourcePath` vs `clipPath`/`templateFile`:**
    * `sourcePath`: Potrebbe essere un percorso più completo o descrittivo, utile per la UI o per logiche di asset management.
    * `clipPath`/`templateFile` (dentro `mediaDetails` e `templateDetails`): È il nome/percorso esatto che CasparCG si aspetta per i comandi `PLAY` o `CG ADD`. Spesso CasparCG lavora con percorsi relativi alla sua cartella media/template e senza estensioni per alcuni tipi di file.
* **`instanceData` in `templateDetails` e `linkedTemplate`:** Questo è il contenitore per tutti i campi dinamici del template (quelli che in CasparCG sono spesso passati come `<data><componentData id="f0"><value>Testo</value></componentData>...</data>` o come JSON). La tua UI (`DynamicTemplateForm.js` o i campi specifici nei dialoghi) popolerà questo oggetto.
* **`casparcgConfig` Nidificato:** Ho messo `cgLayer` e `playOnLoad` per i template dentro un `casparcgConfig` annidato in `templateDetails` (e similarmente per `linkedTemplate`) per mantenere separati i parametri di riproduzione specifici del template dalla configurazione generale di canale/layer video. Questo offre più chiarezza.
* **Coerenza:** Cerca di essere il più coerente possibile con i nomi dei campi che già usi. Ad esempio, se usi `templateFile` nei tuoi stati React, usa `templateFile` anche nel JSONB.
* **Validazione:** Anche se JSONB è flessibile, è buona pratica validare i dati nel frontend prima di inviarli a Supabase, e potenzialmente anche a livello di database con dei `CHECK constraints` o trigger, se necessario, per i campi critici all'interno del JSONB.

Questa struttura dovrebbe coprire in modo completo tutti i dati che gestisci attualmente e offrire spazio per espansioni future. Ricorda che la chiave sarà la logica nelle tue funzioni `addScalettaItem` e `updateItem` (nell'hook `useScalettaItems.js`) per mappare correttamente i dati dai tuoi form React a questa struttura JSONB e viceversa quando leggi i dati per popolare i form di modifi