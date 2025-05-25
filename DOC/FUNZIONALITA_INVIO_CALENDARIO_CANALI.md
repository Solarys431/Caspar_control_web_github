# Funzionalità di Conversione Canali per Invio al Calendario

## Panoramica

È stata implementata una funzionalità critica nel Rundown Editor che risolve automaticamente il problema della configurazione dei canali CasparCG quando si inviano le scalette al calendario settimanale.

## Problemi Risolti

**Situazione precedente:**
1. **Canali CasparCG:** Nel Rundown Editor si utilizza il canale 3 per l'anteprima, ma quando si inviava la scaletta al calendario, tutti gli elementi mantenevano il canale 3 invece del canale 1 necessario per la messa in onda
2. **Campi Timing:** I campi timing (startTime, duration, inPoint, outPoint) erano memorizzati nella struttura JSONB sotto `item.data.timing` ma il calendario si aspettava di trovarli direttamente in `item.data`

**Soluzioni implementate:**
1. **Conversione automatica canali:** Tutti i canali vengono convertiti al canale 1 prima dell'invio al calendario
2. **Mapping campi timing:** I campi timing vengono mappati dalla struttura JSONB al formato flat atteso dal calendario
3. **Preservazione configurazione locale:** La configurazione dell'editor rimane invariata (continua a usare il canale 3 per l'anteprima)
4. **Modifica solo dati inviati:** Non altera la configurazione dell'editor, modifica solo i dati inviati al calendario

## Funzionalità Implementate

### 1. Funzione `convertItemsToPlayoutChannel()`

**Scopo:** Converte tutti gli item della scaletta per l'invio al calendario

**Caratteristiche:**
- Clone profondo degli item per evitare modifiche alla configurazione locale
- Aggiornamento ricorsivo di tutti i riferimenti ai canali CasparCG
- Mapping dei campi timing dalla struttura JSONB al formato flat
- Gestione di tutti i tipi di elementi (MEDIA, TEMPLATE, STORY)
- Gestione robusta degli errori

**Conversioni canali:**
- `item.data.casparcgConfig.channel` (configurazione generale)
- `item.data.mediaDetails.channel` (per elementi MEDIA)
- `item.data.templateDetails.casparcgConfig.channel` (per elementi TEMPLATE)
- `item.data.templatesDetails[].casparcgConfig.channel` (per template multipli nelle STORY)

**Mapping campi timing:**
- `item.data.timing.startTime` → `item.data.startTime`
- `item.data.timing.duration` → `item.data.duration`
- `item.data.timing.inPoint` → `item.data.inPoint`
- `item.data.timing.outPoint` → `item.data.outPoint`

**Campi essenziali garantiti:**
- `item.data.startTime` (default: '00:00:00')
- `item.data.duration` (default: '00:01:00')
- `item.data.customName` (fallback al nome dell'item)
- `item.data.clip` (per elementi MEDIA)
- `item.data.template` (per elementi TEMPLATE)

### 2. Funzione `testChannelConversion()`

**Scopo:** Verifica che la conversione dei canali e il mapping dei campi timing siano avvenuti correttamente

**Caratteristiche:**
- Test automatico di tutti i canali convertiti
- Verifica del mapping dei campi timing
- Controllo dei campi essenziali per il calendario
- Logging dettagliato per debugging
- Report completo di successo/fallimento

**Verifiche effettuate:**
- Conversione di tutti i canali al valore target
- Mapping corretto dei campi timing dalla struttura JSONB
- Presenza dei campi essenziali (startTime, duration, customName)
- Presenza dei campi specifici per tipo (clip per MEDIA, template per TEMPLATE)

### 3. Integrazione nel Flusso di Invio

**Processo:**
1. L'utente clicca sul pulsante "Calendario" nel Rundown Editor
2. Il sistema converte automaticamente tutti gli item al canale 1
3. Viene eseguito un test di verifica della conversione
4. I dati convertiti vengono inviati al calendario
5. La configurazione locale dell'editor rimane invariata

## Utilizzo

### Per l'Utente Finale

1. **Configurazione dell'Editor:**
   - Continua a configurare gli elementi con il canale desiderato per l'anteprima (solitamente 3)
   - Non è necessario modificare manualmente i canali prima dell'invio

2. **Invio al Calendario:**
   - Clicca sul pulsante "Calendario" come sempre
   - Il sistema converte automaticamente tutti i canali al canale 1
   - Verifica nel log di sistema la conferma della conversione

3. **Verifica:**
   - Controlla i log di sistema per confermare la conversione
   - Messaggio di successo: "✅ Conversione completata: X/Y canali → canale 1, Z/W campi timing mappati"
   - Messaggio di warning: "⚠️ Conversione parziale: X/Y canali convertiti, Z/W campi timing mappati"
   - Tutti gli elementi nel calendario useranno il canale 1 per la messa in onda e avranno i campi timing correttamente mappati

### Per lo Sviluppatore

**Logging dettagliato:**
```javascript
// Nel browser console, durante l'invio al calendario:
🔍 Test Conversione per Calendario
📋 Item 1: Nome_Item (MEDIA)
  ✅ casparcgConfig.channel: 1 (convertito)
  ✅ mediaDetails.channel: 1 (convertito)
  ✅ timing.startTime → data.startTime: 00:10:00 (mappato)
  ✅ timing.duration → data.duration: 00:01:35 (mappato)
  ✅ timing.inPoint → data.inPoint: 00:00:03:10 (mappato)
  ✅ timing.outPoint → data.outPoint: 00:01:30:00 (mappato)
  ✅ Campo essenziale startTime: 00:10:00
  ✅ Campo essenziale duration: 00:01:35
  ✅ Campo essenziale customName: Nome_Item
  ✅ Campo clip per MEDIA: video_file.mp4
📊 Riepilogo conversione:
   - Canali trovati: 2
   - Canali convertiti: 2
   - Campi timing mappati: 4/4
   - Successo canali: ✅
   - Successo timing: ✅
```

## Vantaggi

1. **Automatizzazione:** Elimina la necessità di modificare manualmente i canali
2. **Sicurezza:** Non altera la configurazione locale dell'editor
3. **Robustezza:** Gestione degli errori e verifica automatica
4. **Trasparenza:** Logging dettagliato per debugging e verifica
5. **Compatibilità:** Funziona con tutti i tipi di elementi esistenti

## Strutture Dati Supportate

La funzionalità gestisce correttamente tutte le strutture JSONB definite nella documentazione:

- **Elementi MEDIA:** Conversione di `casparcgConfig.channel` e `mediaDetails.channel`
- **Elementi TEMPLATE:** Conversione di `casparcgConfig.channel` e `templateDetails.casparcgConfig.channel`
- **Elementi STORY:** Conversione ricorsiva di tutti i canali in:
  - Media associati alla storia
  - Template singoli associati
  - Template multipli (`templatesDetails[]`)

## Note Tecniche

- **Metodo di cloning:** Utilizza `JSON.parse(JSON.stringify())` per il deep cloning
- **Aggiornamento ricorsivo:** Trova e aggiorna tutti i riferimenti ai canali nell'intera struttura dati
- **Fallback:** In caso di errore nella conversione, mantiene l'item originale
- **Performance:** Ottimizzato per gestire scalette con molti elementi

## Estensibilità

La funzione `convertItemsToPlayoutChannel()` può essere facilmente estesa per:
- Convertire altri parametri oltre ai canali (es. server, layer)
- Supportare configurazioni più complesse
- Integrare logiche di mapping personalizzate

## Testing

Per testare la funzionalità:
1. Crea una scaletta con elementi di diversi tipi
2. Configura i canali con valori diversi da 1
3. Invia la scaletta al calendario
4. Verifica nei log che tutti i canali siano stati convertiti a 1
5. Controlla che la configurazione locale dell'editor sia rimasta invariata
