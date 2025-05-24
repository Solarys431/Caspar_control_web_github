ATTENZIONE CURSOR: Questo è un refactoring complesso. Procedi con cautela, file per file o per gruppi di funzionalità. Fai riferimento ai file esistenti che ti ho fornito (RundownContext.js attuale, ScaletteEditor/index.js, useScalettaItems.js, ScaletteSelector.js, WeeklyCalendar.js) per la logica da migrare e adattare.

Plaintext

Ciao Cursor,

Vogliamo rifattorizzare completamente la gestione delle scalette (rundowns) nella nostra applicazione React per centralizzare tutte le interazioni con Supabase in un unico React Context: `client/src/contexts/RundownContext.js`. Questo context diventerà la fonte di verità per i dati delle scalette e dei loro elementi (`scaletta_items`), gestendo CRUD, Realtime per gli items, e il playback CasparCG.

**Obiettivo Principale:**
Modifica `client/src/contexts/RundownContext.js` (attualmente basato su localStorage) per implementare l'architettura descritta nel "Piano Dettagliato per l'Implementazione (Opzione A)" che ti è stato fornito in precedenza (lo riassumo qui sotto). Successivamente, adatta i componenti `client/src/pages/ScaletteEditor/index.js`, `client/src/pages/ScaletteSelector.js`, e `client/src/components/calendar/WeeklyCalendar.js` per utilizzare questo nuovo context. Il file `client/src/pages/ScaletteEditor/hooks/useScalettaItems.js` dovrà essere fuso nel nuovo `RundownContext.js` e poi eliminato.

**Specifiche per il Nuovo `client/src/contexts/RundownContext.js`:**

* **Rimuovi completamente la persistenza su `localStorage`** per i dati principali delle scalette.
* **Importa e usa `supabaseClient`** (da `client/src/supabaseClient.js`) e `useAuth` (da `client/src/contexts/AuthContext.js`).
* **Stato da Gestire:**
    * `rundownsList: []` (lista di { `id`, `name`, `user_id`, `updated_at`, `scheduled_datetime` }).
    * `currentRundown: null | { id, name, items: [], user_id, scheduled_datetime, ... }` (gli `items` sono oggetti completi dalla tabella `scaletta_items`).
    * `isLoadingList`, `isLoadingCurrentRundown`, `isSavingRundown` (booleani).
    * `error: null | string`.
    * `isNewRundownActive: false` (flag booleano).
    * `realtimeChannelRef = useRef(null)`, `lastHandledEventRef = useRef(null)`.
    * Stati per il playback CasparCG (es. `currentPlayingItem`, `playbackStatus`), adattati per `currentRundown.items`.
* **Funzionalità Chiave da Implementare (tutte asincrone dove interagiscono con Supabase):**
    1.  **`WorkspaceRundownsList()`**: Carica `rundownsList` da Supabase (tabella `rundowns`, filtrate per utente o basate su RLS, ordinate per `updated_at DESC`).
    2.  **`initializeNewRundownForEditor(name, pregeneratedId = null, scheduledTime = null)`**: Inizializza `currentRundown` in memoria per una nuova scaletta, imposta `isNewRundownActive = true`. Non salva su DB. Restituisce `{id, name, scheduled_datetime}`.
    3.  **`loadRundownIntoEditor(rundownId)`**: Carica i metadati di `rundowns` e tutti i suoi `scaletta_items` da Supabase in `currentRundown`. Imposta `isNewRundownActive = false`. Iscrive agli eventi Realtime per gli items di questa scaletta (usa logica da `useScalettaItems.js` per `_subscribeToRundownItems` e `_handleRealtimeEvent`).
    4.  **`saveCurrentRundown()`**:
        * Se `isNewRundownActive`: `INSERT` `currentRundown` (metadati) in `rundowns`. Poi `INSERT` tutti i `currentRundown.items` in `scaletta_items`. Imposta `isNewRundownActive = false`. Aggiorna `rundownsList`. Iscrivi a Realtime.
        * Se `!isNewRundownActive`: `UPDATE rundowns` (per `name`, `scheduled_datetime`, `updated_at`). Le modifiche agli items sono già state gestite dalle funzioni CRUD per items. Aggiorna `rundownsList` se necessario.
    5.  **`updateCurrentRundownMetadata(metadataUpdates)`**: Aggiorna lo stato di `currentRundown` con i nuovi metadati (es. `{ name: 'nuovo nome' }`). Non salva direttamente.
    6.  **Funzioni CRUD per `currentRundown.items` (fondono la logica da `useScalettaItems.js` per chiamate Supabase, aggiornamento stato locale `currentRundown.items`, e gestione `lastHandledEventRef` per Realtime):**
        * `addItemToCurrentRundown(itemData, type)`
        * `updateItemInCurrentRundown(itemId, updates)`
        * `deleteItemFromCurrentRundown(itemId)`
        * `updateItemsOrderInCurrentRundown(orderedItems)` (aggiorna `item_order` di più items).
    7.  **`createRundownForList(name, scheduledTime = null)`**: `INSERT` una nuova riga in `rundowns` e restituisce l'oggetto scaletta creato. Aggiorna `rundownsList`.
    8.  **`deleteRundownFromList(rundownId)`**: `DELETE` da `rundowns` (DB farà cascade su `scaletta_items`). Aggiorna `rundownsList`. Se era la `currentRundown`, chiama `clearCurrentRundownState`.
    9.  **`clearCurrentRundownState()`**: Resetta `currentRundown`, `isNewRundownActive`, disiscrive da Realtime.
    10. **Funzioni di Playback CasparCG**: Adatta quelle esistenti (`playItem`, `stopItem`, `addMedia` -> `addItemToCurrentRundown` ecc.) per operare su `currentRundown.items`. Mantieni la logica di interazione con `CasparContext`.
    11. **Rimuovi completamente** le vecchie funzioni `saveRundown` (download JSON) e `loadRundown` (upload JSON) o rinominale in `exportCurrentRundownAsJson` e `importRundownFromJsonToCurrent` se devono essere mantenute, assicurandoti che operino solo su `currentRundown`.

**Specifiche per `client/src/pages/ScaletteEditor/index.js`:**

* **Rimuovi l'uso di `useRundown` (vecchio context) e di `useScalettaItems`**.
* **Rimuovi le chiamate dirette a `supabaseClient`** per caricare/salvare la scaletta e i suoi items.
* **Usa il nuovo `RundownContext`** per ottenere: `currentRundown`, `isLoadingCurrentRundown`, `isSavingRundown`, `isNewRundownActive`, e tutte le funzioni rilevanti (`loadRundownIntoEditor`, `initializeNewRundownForEditor`, `saveCurrentRundown`, `updateCurrentRundownMetadata`, funzioni CRUD per items, `clearCurrentRundownState`, funzioni di playback).
* **Adatta `useEffect` di caricamento:** Al mount/cambio `rundownId` (da `useParams`), chiama `initializeNewRundownForEditor` (se `rundownId === 'new'`) o `loadRundownIntoEditor(rundownId)`. Al unmount, chiama `clearCurrentRundownState`.
* **Interfaccia Utente:**
    * `ScalettaGlobalInfoBar` visualizza `currentRundown.name` e usa `(newName) => updateCurrentRundownMetadata({ name: newName })` per modificarlo.
    * `ScalettaTable` visualizza `currentRundown.items` e usa le funzioni CRUD per items dal context.
    * Il pulsante "Salva" (o "Salva su Cloud") chiama `saveCurrentRundown()`.

**Specifiche per `client/src/pages/ScaletteSelector.js`:**

* **Rimuovi l'uso di `useRundown` (vecchio context).**
* **Usa il nuovo `RundownContext`** per ottenere: `rundownsList`, `isLoadingList`, e le funzioni `WorkspaceRundownsList`, `createRundownForList`, `deleteRundownFromList`.
* **Logica:**
    * Carica `rundownsList` al mount.
    * Permetti la creazione di una nuova scaletta tramite `createRundownForList`, poi naviga all'editor con il nuovo ID.
    * Permetti l'eliminazione tramite `deleteRundownFromList`.
    * Permetti l'apertura navigando all'editor con l'ID selezionato.

**Specifiche per `client/src/components/calendar/WeeklyCalendar.js`:**

* **Rimuovi le chiamate dirette a `supabaseClient` per caricare la lista `rundowns` o creare `rundowns`.**
* **Usa il nuovo `RundownContext`** per:
    * Ottenere `rundownsList` e `WorkspaceRundownsList` per popolare il selettore di scalette quando si modifica un evento.
    * Chiamare `createRundownForList(name, eventDate)` quando l'utente vuole creare una nuova scaletta da associare a un evento del calendario. Usa l'ID della scaletta restituita per aggiornare il campo `rundown_id` dell'evento.

**Eliminazione File:**
* Una volta che la sua logica è stata completamente fusa nel nuovo `RundownContext.js`, il file `client/src/pages/ScaletteEditor/hooks/useScalettaItems.js` può essere eliminato.

**Punti Chiave e Note:**
* Assicurati che tutte le chiamate a Supabase gestiscano correttamente `async/await` e gli errori (`try/catch`).
* La gestione di `isNewRundownActive` è cruciale per la logica `INSERT` vs `UPDATE` in `saveCurrentRundown`.
* La sincronizzazione Realtime per gli items deve essere attivata solo per `currentRundown` e disattivata quando `currentRundown` viene pulita o cambiata.
* Presta attenzione alle dipendenze degli `useEffect` e `useCallback` per evitare loop o stale closures.
* L'obiettivo è avere un flusso di dati chiaro e centralizzato attraverso il nuovo `RundownContext`.

Per favore, implementa queste modifiche. Inizia con la struttura e le funzioni principali di `RundownContext.js`, poi adatta `ScaletteSelector.js`, seguito da `ScaletteEditor/index.js`, e infine `WeeklyCalendar.js`. Testare ogni componente dopo le modifiche è fondamentale.