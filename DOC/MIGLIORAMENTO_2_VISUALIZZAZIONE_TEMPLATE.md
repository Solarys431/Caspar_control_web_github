# MIGLIORAMENTO 2: VISUALIZZAZIONE COMPLETA TEMPLATE ASSOCIATI

## Panoramica

Implementato sistema completo per la visualizzazione dettagliata dei template associati agli elementi STORY, sostituendo il conteggio generico con informazioni specifiche e complete su ogni template.

## Problemi Risolti

### Prima dell'Implementazione
- ❌ Visualizzazione generica: "X template" senza dettagli
- ❌ Tooltip limitati con solo nomi file
- ❌ Mancanza di informazioni su layer e configurazioni CasparCG
- ❌ Impossibilità di identificare conflitti di layer
- ❌ Nessuna indicazione dell'ordine di esecuzione

### Dopo l'Implementazione
- ✅ Visualizzazione specifica: "template1.html (L:1, CG:10), template2.html (L:2, CG:20)"
- ✅ Tooltip dettagliati con tutte le configurazioni
- ✅ Informazioni complete su layer, cgLayer, timing
- ✅ Rilevamento automatico di conflitti di layer
- ✅ Chiarezza operativa su cosa andrà in onda

## Funzionalità Implementate

### 1. Funzioni Helper per Template

#### `formatTemplateName(templateFile)`
```javascript
/**
 * Estrae il nome del file template senza il percorso completo
 * @param {string} templateFile - Percorso completo del template
 * @returns {string} - Nome del file senza percorso
 */
const formatTemplateName = (templateFile) => {
  if (!templateFile) return 'Template';
  return templateFile.split('/').pop() || templateFile;
};
```

#### `formatTemplateDisplay(template)`
```javascript
/**
 * Formatta la visualizzazione di un singolo template con layer e cgLayer
 * @param {Object} template - Oggetto template con templateFile e casparcgConfig
 * @returns {string} - Stringa formattata "nome.html (L:X, CG:Y)"
 */
const formatTemplateDisplay = (template) => {
  if (!template) return 'Template';
  
  const name = formatTemplateName(template.templateFile);
  const layer = template.casparcgConfig?.layer || '?';
  const cgLayer = template.casparcgConfig?.cgLayer || '?';
  
  return `${name} (L:${layer}, CG:${cgLayer})`;
};
```

**Esempio Output**: `"lower_third.html (L:1, CG:10)"`

### 2. Tooltip Dettagliati

#### `generateTemplateTooltip(templatesDetails, templateDetails)`
```javascript
/**
 * Genera un tooltip dettagliato per tutti i template associati
 * @param {Array} templatesDetails - Array di oggetti template
 * @param {Object} templateDetails - Template singolo (legacy)
 * @returns {string} - Tooltip completo con tutte le informazioni
 */
```

**Esempio Tooltip per Template Multipli**:
```
3 Template Associati:

1. lower_third.html
   Percorso: /templates/graphics/lower_third.html
   Canale: 1, Layer: 1, CG Layer: 10
   Play on Load: Sì, Auto Start: Sì

2. ticker.html
   Percorso: /templates/news/ticker.html
   Canale: 1, Layer: 2, CG Layer: 20
   Play on Load: No, Auto Start: Sì, Ritardo: 2s
   Dati: title, subtitle, scrollSpeed

3. logo.html
   Percorso: /templates/branding/logo.html
   Canale: 1, Layer: 3, CG Layer: 30
   Play on Load: Sì, Auto Start: No
```

### 3. Visualizzazione Principale Ottimizzata

#### `getTemplateDisplayText(templatesDetails, templateDetails, maxVisible)`
```javascript
/**
 * Genera il testo di visualizzazione principale per i template
 * @param {Array} templatesDetails - Array di oggetti template
 * @param {Object} templateDetails - Template singolo (legacy)
 * @param {number} maxVisible - Numero massimo di template da mostrare
 * @returns {string} - Testo ottimizzato per la visualizzazione principale
 */
```

**Esempi di Output**:
- **Template Singolo**: `"lower_third.html (L:1, CG:10)"`
- **Template Multipli**: `"lower_third.html (L:1, CG:10), ticker.html (L:2, CG:20), +1 altri"`
- **Molti Template**: `"template1.html (L:1, CG:10), template2.html (L:2, CG:20), +5 altri"`

### 4. Rilevamento Conflitti

#### `detectTemplateConflicts(templatesDetails)`
```javascript
/**
 * Rileva potenziali conflitti nei layer dei template
 * @param {Array} templatesDetails - Array di oggetti template
 * @returns {Array} - Array di conflitti rilevati
 */
```

**Tipi di Conflitti Rilevati**:
- **Conflitti Layer**: Stesso layer su stesso canale usato da più template
- **Conflitti CG Layer**: Stesso cgLayer su stesso layer usato da più template

**Esempio Conflitto**:
```javascript
{
  type: 'layer',
  message: 'Layer 1 su canale 1 usato da più template',
  templates: [0, 2] // Indici dei template in conflitto
}
```

### 5. Visualizzazione Migliorata nel Rundown

#### Icone Template con Tooltip
```javascript
{hasMultipleTemplates && (
  <Tooltip title={generateTemplateTooltip(item.data.templatesDetails, item.data.templateDetails)}>
    <Typography
      variant="caption"
      sx={{
        color: '#2196f3',
        fontSize: '10px',
        fontWeight: 'bold',
        opacity: 0.8,
        cursor: 'help'
      }}
    >
      {item.data.templatesDetails.length}
    </Typography>
  </Tooltip>
)}
```

#### Dettagli Template negli Elementi STORY
```javascript
{hasTemplates && (
  <Typography
    variant="caption"
    sx={{
      color: '#2196f3',
      fontSize: '0.7rem',
      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}
    title={generateTemplateTooltip(item.data.templatesDetails, item.data.templateDetails)}
  >
    🎨 {getTemplateDisplayText(item.data.templatesDetails, item.data.templateDetails, 2)}
  </Typography>
)}
```

#### Indicatore Conflitti
```javascript
{hasMultipleTemplates && detectTemplateConflicts(item.data.templatesDetails).length > 0 && (
  <Typography
    variant="caption"
    sx={{
      color: '#ff5722',
      fontSize: '0.6rem',
      display: 'block',
      fontWeight: 'bold'
    }}
    title={`Conflitti rilevati: ${detectTemplateConflicts(item.data.templatesDetails).map(c => c.message).join(', ')}`}
  >
    ⚠️ Conflitti layer rilevati
  </Typography>
)}
```

## Benefici per l'Utente

### 1. Chiarezza Operativa
- **Visibilità Immediata**: Gli utenti vedono esattamente quali template verranno mandati in onda
- **Configurazioni Chiare**: Layer e cgLayer visibili per ogni template
- **Ordine di Esecuzione**: Comprensione dell'ordine di attivazione dei template

### 2. Prevenzione Errori
- **Rilevamento Conflitti**: Identificazione automatica di conflitti di layer
- **Validazione Configurazioni**: Verifica delle impostazioni CasparCG
- **Feedback Visivo**: Indicatori di warning per configurazioni problematiche

### 3. Efficienza Produttiva
- **Informazioni Complete**: Tutti i dettagli necessari in un colpo d'occhio
- **Tooltip Dettagliati**: Accesso rapido a informazioni complete
- **Gestione Template Multipli**: Visualizzazione ottimizzata per elementi complessi

### 4. Professionalità Broadcast
- **Standard Industriali**: Visualizzazione conforme agli standard broadcast
- **Informazioni Tecniche**: Dettagli su canali, layer, timing
- **Controllo Qualità**: Verifica delle configurazioni prima della messa in onda

## Esempi Pratici

### Elemento STORY con Template Singolo
```
🎨 lower_third.html (L:1, CG:10)
```

### Elemento STORY con Template Multipli
```
🎨 lower_third.html (L:1, CG:10), ticker.html (L:2, CG:20), +2 altri
```

### Elemento STORY con Conflitti
```
🎨 template1.html (L:1, CG:10), template2.html (L:1, CG:20)
⚠️ Conflitti layer rilevati
```

### Tooltip Completo
```
3 Template Associati:

1. lower_third.html
   Percorso: /templates/graphics/lower_third.html
   Canale: 1, Layer: 1, CG Layer: 10
   Play on Load: Sì, Auto Start: Sì

2. ticker.html
   Percorso: /templates/news/ticker.html
   Canale: 1, Layer: 2, CG Layer: 20
   Play on Load: No, Auto Start: Sì, Ritardo: 2s
   Dati: title, subtitle, scrollSpeed

3. logo.html
   Percorso: /templates/branding/logo.html
   Canale: 1, Layer: 3, CG Layer: 30
   Play on Load: Sì, Auto Start: No
```

## Implementazione Tecnica

### File Modificati
- `client/src/pages/Rundown/components/RundownList.js`

### Funzioni Aggiunte
- `formatTemplateName()`: Estrazione nome file
- `formatTemplateDisplay()`: Formattazione display template
- `generateTemplateTooltip()`: Generazione tooltip dettagliati
- `getTemplateDisplayText()`: Testo visualizzazione principale
- `detectTemplateConflicts()`: Rilevamento conflitti layer

### Compatibilità
- ✅ **Retrocompatibilità**: Supporto per `templateDetails` (legacy) e `templatesDetails` (nuovo)
- ✅ **Fallback Graceful**: Gestione di dati mancanti o incompleti
- ✅ **Performance**: Calcoli ottimizzati per non impattare le prestazioni

## Conclusioni

Il **MIGLIORAMENTO 2** trasforma completamente la visualizzazione dei template nel rundown, passando da informazioni generiche a dettagli specifici e operativamente utili. Gli utenti possono ora:

- **Vedere esattamente** quali template verranno attivati
- **Comprendere le configurazioni** CasparCG per ogni template
- **Identificare problemi** prima della messa in onda
- **Gestire elementi complessi** con template multipli in modo efficiente

Il sistema fornisce una base solida per la gestione professionale di elementi STORY complessi in ambiente broadcast, migliorando significativamente l'usabilità e la sicurezza operativa del sistema CasparCG Control Web.
