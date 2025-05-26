# Implementazione Sincronizzazione Rundown con Supabase

## Panoramica

Questo documento descrive l'implementazione della sincronizzazione del rundown on-air con Supabase, seguendo gli stessi pattern e best practice già implementati nell'editor di scalette.

## Architettura Implementata

### 1. Schema Database

**File**: `database/rundown_schema.sql`

Tabelle create:
- `rundowns`: Tabella principale per i rundown (simile a `scalette`)
- `rundown_items`: Elementi del rundown (simile a `scaletta_items`)
- `rundown_collaborators`: Collaboratori del rundown (simile a `scaletta_collaborators`)

**Caratteristiche**:
- Row Level Security (RLS) configurato
- Trigger per `updated_at` automatico
- Indici per performance
- Realtime abilitato per tutte le tabelle

### 2. Hook di Sincronizzazione

**File**: `client/src/pages/Rundown/hooks/useRundownItems.js`

**Funzionalità**:
- Caricamento dati rundown da Supabase
- Sottoscrizioni real-time per sincronizzazione
- Funzioni CRUD (addMediaItem, addTemplateItem, updateItem, removeItem)
- Gestione conflitti con versioning ottimistico
- Gestione eventi duplicati

**Pattern seguiti**:
- Identico a `useScalettaItems` per consistenza
- Gestione eventi real-time con deduplicazione
- Logging dettagliato per debug
- Error handling robusto

### 3. Gestione Presenza

**File**: `client/src/pages/Rundown/hooks/useRundownPresence.js`

**Funzionalità**:
- Tracking utenti attivi sul rundown
- Indicatori di editing in tempo reale
- Gestione join/leave utenti
- Prevenzione conflitti di modifica simultanea

### 4. Sistema Permessi

**File**: `client/src/utils/permissionsChecker.js` (esteso)

**Nuove funzioni aggiunte**:
- `getUserRoleForRundown(userId, rundownId)`
- `canUserEditRundown(userRole)`
- `canUserViewRundown(userRole)`
- `isCurrentUserDesignatedPlayoutOperatorForRundown(userId)`

**Ruoli supportati**:
- `owner`: Proprietario del rundown
- `editor`: Può modificare il rundown
- `viewer`: Solo visualizzazione
- `playout_operator`: Operatore di playout con permessi speciali

### 5. Componente Selezione Rundown

**File**: `client/src/pages/RundownSelector.js`

**Funzionalità**:
- Lista rundown dell'utente (proprietario + collaboratore)
- Creazione nuovi rundown
- Gestione permessi per azioni
- Menu contestuale per azioni avanzate
- Design consistente con ScaletteSelector

### 6. Migrazione Dati

**File**: `client/src/utils/rundownMigration.js`

**Funzionalità**:
- Migrazione automatica da localStorage a Supabase
- Conversione formato dati
- Preservazione struttura esistente
- Cleanup localStorage post-migrazione
- Gestione errori durante migrazione

## Fasi di Implementazione

### ✅ Fase 1: Schema Database
- [x] Creazione tabelle rundown
- [x] Configurazione RLS policies
- [x] Setup realtime
- [x] Indici per performance

### ✅ Fase 2: Hook Sincronizzazione
- [x] Hook useRundownItems base
- [x] Sottoscrizioni real-time
- [x] Funzioni CRUD
- [x] Gestione presenza

### ✅ Fase 3: Sistema Permessi
- [x] Estensione permissionsChecker
- [x] Ruoli e policy
- [x] Controlli accesso

### ✅ Fase 4: Componenti UI
- [x] RundownSelector
- [x] Migrazione dati
- [x] Documentazione

### ✅ Fase 5: Integrazione (Completata)
- [x] Modifica RundownContext per usare useRundownItems
- [x] Aggiornamento componenti esistenti
- [x] Indicatori sincronizzazione UI
- [x] Sistema migrazione automatica

## Testing e Validazione

### Test Implementati

**File**: `client/src/utils/testSupabaseSync.js`

**Funzioni di test disponibili**:
- `testSupabaseConnection()`: Verifica connessione database
- `testCreateRundown(userId)`: Test creazione rundown
- `testAddRundownItem(rundownId, userId)`: Test aggiunta elementi
- `testReadRundownItems(rundownId)`: Test lettura elementi
- `testCleanup(rundownId)`: Cleanup dati di test
- `runFullSyncTest(userId)`: Test completo end-to-end
- `testRealtimeSubscription(rundownId)`: Test sottoscrizioni real-time

### Come Eseguire i Test

```javascript
import { runFullSyncTest } from './utils/testSupabaseSync';

// Esegui test completo (sostituisci con ID utente reale)
const results = await runFullSyncTest('user-id-here');
console.log('Risultati test:', results);
```

## Prossimi Passi per Ottimizzazione

### 1. Performance
- [ ] Implementare debouncing per aggiornamenti frequenti
- [ ] Aggiungere caching intelligente per query ripetute
- [ ] Ottimizzare query con indici specifici
- [ ] Implementare paginazione per rundown con molti elementi

### 2. Robustezza
- [ ] Retry automatico per operazioni fallite
- [ ] Gestione avanzata errori di rete
- [ ] Backup automatico localStorage
- [ ] Conflict resolution avanzata

### 3. Funzionalità Avanzate
- [ ] Editing collaborativo real-time con cursori
- [ ] Cronologia modifiche (audit trail)
- [ ] Commenti e annotazioni
- [ ] Notifiche push per modifiche

### 4. Monitoraggio
- [ ] Metriche performance real-time
- [ ] Dashboard stato sincronizzazione
- [ ] Alerting per errori critici
- [ ] Analytics utilizzo

## Struttura Dati JSONB

Il campo `data` in `rundown_items` mantiene la stessa struttura del RundownContext esistente:

```json
{
  "clip": "path/to/media.mp4",
  "channel": 1,
  "layer": 10,
  "customName": "Nome Personalizzato",
  "loop": false,
  "autoNext": false,
  "linkedTemplate": null,
  "startTime": "00:00:00",
  "duration": "00:05:00",
  "location": "path/to/media.mp4",
  "note": "Note aggiuntive",
  "inPoint": "00:00:00",
  "outPoint": "",
  "notificationSent": false,
  "errorCount": 0,
  "lastError": null,
  "lastPlayTime": null
}
```

## Compatibilità

L'implementazione mantiene:
- **Backward compatibility** con formato dati esistente
- **API consistency** con pattern delle scalette
- **Performance** equivalente o superiore
- **Robustezza** nella gestione errori

## Sicurezza

- **Row Level Security** per isolamento dati
- **Validazione permessi** su ogni operazione
- **Audit trail** con `updated_by` e timestamp
- **Prevenzione** accessi non autorizzati

## Monitoraggio

Logging implementato per:
- Eventi real-time
- Operazioni CRUD
- Errori e conflitti
- Performance metrics

## Utilizzo del Sistema

### Migrazione Automatica

Il sistema rileva automaticamente rundown esistenti in localStorage e li migra a Supabase al primo accesso di un utente autenticato.

### Modalità di Funzionamento

1. **Supabase Sync**: Quando l'utente è autenticato e la connessione è disponibile
2. **Fallback localStorage**: Quando non c'è connessione o utente non autenticato
3. **Migrazione Trasparente**: Conversione automatica da localStorage a Supabase

### Indicatori UI

- **Chip "Sync"**: Sincronizzazione Supabase attiva
- **Chip "Offline"**: Modalità localStorage
- **Chip "Modificato"**: Rundown con modifiche non salvate
- **Chip "Errore"**: Problemi di sincronizzazione

### API Compatibilità

L'API del `RundownContext` rimane identica, garantendo compatibilità con tutti i componenti esistenti.

## Conclusioni

L'implementazione fornisce una base solida e production-ready per la sincronizzazione del rundown con Supabase, seguendo le best practice già consolidate nel progetto.

### Caratteristiche Principali

✅ **Sincronizzazione Real-time**: Eventi INSERT/UPDATE/DELETE sincronizzati
✅ **Migrazione Automatica**: Da localStorage a Supabase senza perdita dati
✅ **Fallback Offline**: Funzionamento garantito anche senza connessione
✅ **API Compatibility**: Nessuna modifica ai componenti esistenti
✅ **Security First**: RLS policies e validazione permessi
✅ **Performance Optimized**: Indici e query ottimizzate
✅ **Collaborative Editing**: Supporto multi-utente con presenza

La struttura modulare permette un'integrazione graduale senza disruption del sistema esistente, mantenendo la stessa affidabilità e performance dell'editor di scalette.
