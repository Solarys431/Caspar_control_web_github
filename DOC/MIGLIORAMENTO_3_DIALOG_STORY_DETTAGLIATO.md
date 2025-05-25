# MIGLIORAMENTO 3: DIALOG DETTAGLIATO PER ELEMENTI IMPORTATI

## Panoramica

Implementato sistema completo di dialog avanzato per la visualizzazione e modifica degli elementi STORY complessi importati dall'editor scalette, con supporto per elementi con media e template multipli.

## Problemi Risolti

### Prima dell'Implementazione
- ❌ Nessun modo per visualizzare dettagli completi degli elementi STORY importati
- ❌ Impossibilità di modificare configurazioni CasparCG per template multipli
- ❌ Mancanza di informazioni di origine per elementi esplosi
- ❌ Nessuna anteprima della configurazione finale che andrà in onda
- ❌ Gestione limitata di elementi complessi con media + template multipli

### Dopo l'Implementazione
- ✅ Dialog completo e professionale per elementi STORY
- ✅ Modifica avanzata di tutte le configurazioni CasparCG
- ✅ Visualizzazione dettagliata delle informazioni di origine
- ✅ Anteprima completa della configurazione finale
- ✅ Gestione completa di elementi complessi con validazione

## Funzionalità Implementate

### 1. Nuovo Componente StoryItemDialog

#### Struttura del Dialog
```javascript
/**
 * Dialog dettagliato per la visualizzazione e modifica degli elementi STORY importati
 * dall'editor scalette con supporto completo per elementi complessi (media + template multipli)
 */
const StoryItemDialog = ({ 
  open, 
  onClose, 
  item, 
  onSave, 
  onDelete,
  connected 
}) => {
```

#### Caratteristiche Principali
- **Design Responsive**: Si adatta al contenuto (singolo template vs multipli)
- **Sezioni Organizzate**: Media, Template(s), Timing, Origine, Anteprima
- **Validazione in Tempo Reale**: Controllo configurazioni CasparCG
- **Gestione Modifiche**: Sistema di tracking delle modifiche con conferma

### 2. Sezioni del Dialog

#### A. Header Intelligente
```javascript
<DialogTitle sx={{ 
  display: 'flex', 
  alignItems: 'center', 
  gap: 1,
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
}}>
  <ArticleIcon color="primary" />
  <Box sx={{ flexGrow: 1 }}>
    <Typography variant="h6">Dettagli Elemento STORY</Typography>
    <Typography variant="caption" color="text.secondary">
      {item.data?.customName || item.name}
    </Typography>
  </Box>
  {isImported && (
    <Chip icon={<SourceIcon />} label="IMPORTATO" color="primary" variant="outlined" />
  )}
  {templateConflicts.length > 0 && (
    <Chip icon={<WarningIcon />} label="CONFLITTI" color="error" variant="outlined" />
  )}
</DialogTitle>
```

**Caratteristiche Header**:
- Icona e titolo dinamici
- Sottotitolo con nome personalizzato
- Chip di stato per elementi importati
- Indicatori di conflitto template

#### B. Sezione Media
```javascript
{hasMedia && (
  <Accordion expanded={expandedSections.media}>
    <AccordionSummary>
      <MovieIcon color="success" />
      <Typography variant="h6">Media</Typography>
      <Chip label={formatTemplateName(item.data.mediaDetails.clipPath)} />
    </AccordionSummary>
    <AccordionDetails>
      {/* Campi per percorso file, punti IN/OUT, durata, loop */}
    </AccordionDetails>
  </Accordion>
)}
```

**Campi Media**:
- **Percorso File Media**: TextField per il percorso completo
- **Punto IN**: Campo timecode con placeholder "00:00:00:00"
- **Punto OUT**: Campo timecode con placeholder "00:00:05:00"
- **Durata**: Campo durata con placeholder "00:05:00"
- **Loop**: Switch per attivazione loop

#### C. Sezione Template (Avanzata)
```javascript
{hasTemplates && (
  <Accordion expanded={expandedSections.templates}>
    <AccordionSummary>
      <BrushIcon color="primary" />
      <Typography variant="h6">Template</Typography>
      <Chip label={hasMultipleTemplates ? `${item.data.templatesDetails.length} template` : '1 template'} />
      {templateConflicts.length > 0 && (
        <Chip icon={<WarningIcon />} label={`${templateConflicts.length} conflitti`} color="error" />
      )}
    </AccordionSummary>
    <AccordionDetails>
      {/* Lista template con configurazioni individuali */}
    </AccordionDetails>
  </Accordion>
)}
```

**Gestione Template Multipli**:
- **Lista Template**: Ogni template in un Paper separato
- **Configurazioni CasparCG**: Canale, Layer, CG Layer per ogni template
- **Controlli Timing**: Play on Load, Auto Start per ogni template
- **Azioni Template**: Modifica e eliminazione (per template multipli)
- **Aggiungi Template**: Pulsante per aggiungere nuovi template

#### D. Sezione Timing e Configurazione
```javascript
<Accordion expanded={expandedSections.timing}>
  <AccordionSummary>
    <ScheduleIcon color="info" />
    <Typography variant="h6">Timing e Configurazione</Typography>
  </AccordionSummary>
  <AccordionDetails>
    {/* Campi per nome, orario, note, location */}
  </AccordionDetails>
</Accordion>
```

**Campi Timing**:
- **Nome Personalizzato**: TextField per nome custom
- **Orario di Inizio**: Campo timecode "00:00:00"
- **Note**: TextField multiline per note
- **Location**: TextField per location/percorso

#### E. Sezione Informazioni di Origine (Solo Elementi Importati)
```javascript
{isImported && (
  <Accordion expanded={expandedSections.origin}>
    <AccordionSummary>
      <SourceIcon color="primary" />
      <Typography variant="h6">Informazioni di Origine</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <List>
        <ListItem>
          <ListItemIcon><InfoIcon /></ListItemIcon>
          <ListItemText
            primary="Scaletta di Origine"
            secondary={item.data.sourceInfo.sourceScalettaName}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><ScheduleIcon /></ListItemIcon>
          <ListItemText
            primary="Data di Origine"
            secondary={format(new Date(item.data.sourceInfo.sourceDay), 'dd/MM/yyyy')}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><ScheduleIcon /></ListItemIcon>
          <ListItemText
            primary="Importato il"
            secondary={item.data.sourceInfo.importedAt ? 
              format(new Date(item.data.sourceInfo.importedAt), 'dd/MM/yyyy HH:mm:ss') : 
              'Data non disponibile'
            }
          />
        </ListItem>
      </List>
    </AccordionDetails>
  </Accordion>
)}
```

#### F. Sezione Anteprima Configurazione
```javascript
<Accordion expanded={expandedSections.preview}>
  <AccordionSummary>
    <PreviewIcon color="secondary" />
    <Typography variant="h6">Anteprima Configurazione</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
      <Typography variant="subtitle2">Configurazione che andrà in onda:</Typography>
      
      {hasMedia && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" color="success.main">
            📹 Media: {formatTemplateName(item.data.mediaDetails.clipPath)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Durata: {item.data.duration} | IN: {item.data.inPoint} | OUT: {item.data.outPoint}
          </Typography>
        </Box>
      )}
      
      {hasTemplates && (
        <Box>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            🎨 Template ({hasMultipleTemplates ? item.data.templatesDetails.length : 1}):
          </Typography>
          {(item.data.templatesDetails || [item.data.templateDetails]).filter(Boolean).map((template, index) => (
            <Typography key={index} variant="caption" color="text.secondary">
              {index + 1}. {formatTemplateDisplay(template)}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  </AccordionDetails>
</Accordion>
```

### 3. Sistema di Gestione Stato

#### Stati del Dialog
```javascript
const [editedItem, setEditedItem] = useState(null);
const [hasChanges, setHasChanges] = useState(false);
const [expandedSections, setExpandedSections] = useState({
  media: true,
  templates: true,
  timing: false,
  origin: false,
  preview: false
});
```

#### Gestione Modifiche
```javascript
const handleFieldChange = (path, value) => {
  if (!editedItem) return;

  const newItem = { ...editedItem };
  const pathArray = path.split('.');
  let current = newItem;

  // Naviga fino al penultimo livello
  for (let i = 0; i < pathArray.length - 1; i++) {
    if (!current[pathArray[i]]) {
      current[pathArray[i]] = {};
    }
    current = current[pathArray[i]];
  }

  // Imposta il valore finale
  current[pathArray[pathArray.length - 1]] = value;

  setEditedItem(newItem);
  setHasChanges(true);
};
```

### 4. Integrazione con RundownList

#### Gestione Apertura Dialog
```javascript
// MIGLIORAMENTO 3: Gestione del dialog dettagliato per elementi STORY
const handleStoryDialogOpen = (item) => {
  // Verifica che sia un elemento STORY complesso
  if (item.type === 'STORY' && (
    (item.data?.mediaDetails?.clipPath) ||
    (item.data?.templateDetails?.templateFile) ||
    (item.data?.templatesDetails?.length > 0)
  )) {
    setSelectedStoryItem(item);
    setStoryDialogOpen(true);
  }
};
```

#### Click Handler Intelligente
```javascript
onClick={() => {
  // MIGLIORAMENTO 3: Apri dialog specifico per elementi STORY complessi
  if (item.type === 'STORY' && (isComplexStory || isExploded)) {
    handleStoryDialogOpen(item);
  } else {
    handleEditItemDialogOpen(item.id);
  }
}}
```

#### Rendering Dialog
```javascript
{/* MIGLIORAMENTO 3: Dialog dettagliato per elementi STORY */}
<StoryItemDialog
  open={storyDialogOpen}
  onClose={handleStoryDialogClose}
  item={selectedStoryItem}
  onSave={handleStoryItemSave}
  onDelete={handleStoryItemDelete}
  connected={connected}
/>
```

### 5. Rilevamento Conflitti Template

#### Integrazione con Sistema di Rilevamento
```javascript
// Rileva conflitti nei template
const templateConflicts = hasMultipleTemplates ? 
  detectTemplateConflicts(item?.data?.templatesDetails) : [];
```

#### Visualizzazione Conflitti
```javascript
{/* Alert per conflitti template */}
{templateConflicts.length > 0 && (
  <Alert severity="warning" sx={{ m: 2, mb: 0 }}>
    <Typography variant="body2" fontWeight="bold">
      Conflitti rilevati nei template:
    </Typography>
    {templateConflicts.map((conflict, index) => (
      <Typography key={index} variant="caption" display="block">
        • {conflict.message}
      </Typography>
    ))}
  </Alert>
)}
```

## Benefici per l'Utente

### 1. Controllo Completo
- **Visibilità Totale**: Accesso a tutti i dettagli dell'elemento STORY
- **Modifica Avanzata**: Possibilità di modificare ogni aspetto della configurazione
- **Gestione Template Multipli**: Controllo individuale di ogni template

### 2. Sicurezza Operativa
- **Rilevamento Conflitti**: Identificazione automatica di problemi di configurazione
- **Validazione in Tempo Reale**: Controllo delle modifiche durante l'editing
- **Anteprima Configurazione**: Visualizzazione di cosa andrà effettivamente in onda

### 3. Efficienza Produttiva
- **Interface Organizzata**: Sezioni logiche per diversi aspetti dell'elemento
- **Gestione Modifiche**: Sistema di tracking con conferma per modifiche importanti
- **Informazioni di Origine**: Tracciabilità completa per elementi importati

### 4. Professionalità Broadcast
- **Standard Industriali**: Interface conforme agli standard broadcast professionali
- **Controllo Granulare**: Accesso a tutte le configurazioni CasparCG
- **Workflow Integrato**: Integrazione seamless con il sistema rundown esistente

## Esempi Pratici

### Elemento STORY con Media e Template Singolo
```
Header: "Dettagli Elemento STORY" + Chip "IMPORTATO"
├── Sezione Media: video.mp4 (IN: 00:00:05, OUT: 00:01:30, Loop: No)
├── Sezione Template: lower_third.html (L:1, CG:10, Play on Load: Sì)
├── Sezione Timing: Nome: "Notizia Principale", Orario: 20:00:00
├── Sezione Origine: Scaletta "TG Sera" del 15/01/2024
└── Anteprima: 📹 video.mp4 + 🎨 lower_third.html (L:1, CG:10)
```

### Elemento STORY con Template Multipli e Conflitti
```
Header: "Dettagli Elemento STORY" + Chip "CONFLITTI"
├── Alert: "Conflitti rilevati: Layer 1 su canale 1 usato da più template"
├── Sezione Template: 3 template
│   ├── Template 1: lower_third.html (L:1, CG:10)
│   ├── Template 2: ticker.html (L:1, CG:20) ⚠️ Conflitto Layer
│   └── Template 3: logo.html (L:2, CG:30)
└── Anteprima: 🎨 Template (3): lower_third.html (L:1, CG:10), ticker.html (L:1, CG:20), logo.html (L:2, CG:30)
```

## Implementazione Tecnica

### File Creati
- `client/src/pages/Rundown/components/StoryItemDialog.js`

### File Modificati
- `client/src/pages/Rundown/components/RundownList.js`

### Dipendenze Aggiunte
- Accordion, AccordionSummary, AccordionDetails
- Alert, Switch, FormControlLabel
- List, ListItem, ListItemText, ListItemIcon
- Paper (per template individuali)

### Funzioni Helper Utilizzate
- `formatTemplateName()`: Estrazione nome file
- `formatTemplateDisplay()`: Formattazione display template
- `generateTemplateTooltip()`: Tooltip dettagliati
- `detectTemplateConflicts()`: Rilevamento conflitti

### Integrazione con Contesto
- `useRundown()`: Per removeItem
- `showNotification()`: Per feedback utente
- `connected`: Per stato connessione CasparCG

## Conclusioni

Il **MIGLIORAMENTO 3** completa la trasformazione del sistema rundown fornendo un controllo completo e professionale degli elementi STORY complessi. Il dialog offre:

- **Gestione Completa**: Controllo totale su tutti gli aspetti degli elementi STORY
- **Sicurezza Operativa**: Rilevamento e prevenzione di conflitti di configurazione
- **Efficienza Produttiva**: Interface organizzata e workflow ottimizzato
- **Professionalità Broadcast**: Standard industriali per ambiente di produzione

Il sistema è ora completo e pronto per l'uso in ambiente di produzione broadcast professionale, fornendo agli operatori tutti gli strumenti necessari per gestire elementi complessi con sicurezza e efficienza.
