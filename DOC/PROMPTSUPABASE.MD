segui in modo preciso e meticoloso questo prompt suddividendo il lavoro nei task descritti dal prompt, e per il file jsonB devi avere come riferimento il file Struttura_JSONB_per_scaletta_items.data.md, dividi il lavoro per fasi e testa ogni sezione appena completata una fase. Per quanto riguarda il db supabase utilizza quello che ho collegato a questo progetto ed ad Augmented, tu hai accesso diretto al mio supabase.

# Richiesta di Integrazione: Scalette Collaborative con Supabase e Permessi Dinamici

**Obiettivo Principale:**
Trasformare l'attuale `ScaletteEditor` (che usa `localStorage`) in un editor di scalette multiutente collaborativo in tempo reale, utilizzando Supabase come backend per la persistenza dei dati, l'autenticazione, i permessi e gli aggiornamenti realtime. Implementare anche un sistema di permessi dinamici per l'azione critica "Invia al Rundown Effettivo".

**Contesto Applicativo:**
L'applicazione è un client React per il controllo di un server CasparCG. Esiste già un `CasparContext` per la comunicazione con CasparCG (tramite un backend Node.js che fa da ponte) e un `RundownContext` per la gestione di un rundown di playout principale (attualmente basato su `localStorage`). L'integrazione di Supabase per le scalette deve avvenire all'interno di questo client React esistente.

**Fase 1: Setup del Progetto Supabase e Integrazione Client Iniziale**

1.  **Configurazione Progetto Supabase:**
    * Creare un nuovo progetto su Supabase.
    * Ottenere l'URL del Progetto e la Chiave API `anon` pubblica.
2.  **Definizione Schema Database Supabase:**
    * Creare le seguenti tabelle con i campi e le relazioni specificate:
        * **`scalette`**:
            * `id`: `uuid` (Primary Key, default `uuid_generate_v4()`)
            * `name`: `text` (not null)
            * `created_at`: `timestamptz` (default `now()`)
            * `updated_at`: `timestamptz` (default `now()`, con trigger per auto-aggiornamento)
            * `owner_id`: `uuid` (references `auth.users(id)`, not null)
        * **`scaletta_items`**:
            * `id`: `uuid` (Primary Key, default `uuid_generate_v4()`)
            * `scaletta_id`: `uuid` (references `scalette(id)` on delete cascade, not null)
            * `item_order`: `integer` (not null, per l'ordinamento)
            * `type`: `text` (not null, es. 'MEDIA', 'TEMPLATE')
            * `name`: `text` (nome visualizzato/customName)
            * `data`: `jsonb` (not null, per dettagli specifici dell'item, vedi Struttura JSONB Proposta sotto)
            * `version`: `integer` (default `1`, not null - per locking ottimistico)
            * `created_at`: `timestamptz` (default `now()`)
            * `updated_at`: `timestamptz` (default `now()`, con trigger per auto-aggiornamento)
            * `updated_by`: `uuid` (references `auth.users(id)`, nullable)
        * **`scaletta_collaborators`**:
            * `id`: `uuid` (Primary Key, default `uuid_generate_v4()`)
            * `scaletta_id`: `uuid` (references `scalette(id)` on delete cascade, not null)
            * `user_id`: `uuid` (references `auth.users(id)` on delete cascade, not null)
            * `role`: `text` (not null, es. 'owner', 'editor', 'viewer', 'playout_operator')
            * `created_at`: `timestamptz` (default `now()`)
            * *Constraint univoco su (`scaletta_id`, `user_id`)*
        * **`playout_assignments`**:
            * `id`: `uuid` (Primary Key, default `uuid_generate_v4()`)
            * `assignment_date`: `date` (not null)
            * `user_id`: `uuid` (references `auth.users(id)` on delete cascade, not null)
            * `shift`: `text` (nullable, es. 'MATTINA', 'POMERIGGIO', 'SERA')
            * `created_at`: `timestamptz` (default `now()`)
            * *Constraint univoco su (`assignment_date`, `user_id`, `shift` se shift è not null)*
    * Abilitare l'estensione `uuid-ossp` (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`).
    * Creare i trigger per aggiornare automaticamente `updated_at` per `scalette` e `scaletta_items`.
3.  **Configurazione Row Level Security (RLS) in Supabase:**
    * Abilitare RLS per tutte le tabelle sopra menzionate.
    * Implementare policy di sicurezza che permettano:
        * Agli utenti autenticati di creare nuove scalette (diventandone `owner_id`).
        * Agli `owner_id` di leggere, aggiornare e cancellare le proprie scalette e gestire i collaboratori per esse.
        * Ai collaboratori di accedere/modificare le scalette e i loro item in base al loro `role` definito in `scaletta_collaborators`.
        * (Considerare policy specifiche per `playout_assignments` - probabilmente gestite da un ruolo admin).
4.  **Abilitazione Realtime in Supabase:**
    * Abilitare la replica per le tabelle `scaletta_items`, `scaletta_collaborators`, e `playout_assignments`.
5.  **Installazione e Configurazione Client Supabase in React:**
    * Installare `@supabase/supabase-js`.
    * Creare `src/supabaseClient.js` per inizializzare il client Supabase con URL e chiave anon.
    * Configurare le variabili d'ambiente `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY` nel file `.env`.

**Fase 2: Autenticazione Utente**

1.  **Creare `src/contexts/AuthContext.js`:**
    * Gestirà lo stato dell'utente (`user`, `currentUserId`, `loading`).
    * Fornirà funzioni `signIn(email, password)`, `signUp(email, password, metadata)`, `signOut()`.
    * Userà `supabase.auth.onAuthStateChange` per mantenere aggiornato lo stato dell'utente.
    * (Vedi codice di esempio fornito in precedenza).
2.  **Integrare `AuthProvider` in `src/App.js`** avvolgendo il router o i componenti principali.
3.  **Creare Componenti UI per Login/Registrazione/Profilo Utente:**
    * Questi componenti utilizzeranno le funzioni da `useAuth()`.
4.  **Proteggere le Route dell'Applicazione:**
    * Le sezioni che richiedono autenticazione (come `ScaletteEditor`) devono essere protette, reindirizzando gli utenti non loggati.

**Fase 3: Refactoring dell'Editor di Scalette (`src/pages/ScaletteEditor/`)**

1.  **Nuovo Componente: `ScalettaSelectorPage.js` (o simile):**
    * Questa pagina/componente verrà visualizzata prima di entrare nell'editor di una specifica scaletta.
    * **Funzionalità:**
        * Listare le scalette a cui l'utente corrente ha accesso (create da lui o a cui è collaboratore), recuperate da Supabase.
        * Permettere la creazione di una nuova scaletta (scrivendo nella tabella `scalette` e impostando l'utente corrente come `owner_id`).
        * Permettere la selezione di una scaletta esistente.
        * Una volta selezionata/creata una scaletta, navigare a `ScaletteEditor` passando l'`activeScalettaId` (es. tramite route params o stato del contesto).
        * (Opzionale) Permettere all'owner di gestire i collaboratori (CRUD sulla tabella `scaletta_collaborators` per la scaletta selezionata).
2.  **Refactoring Profondo di `src/pages/ScaletteEditor/hooks/useScalettaItems.js`:**
    * Rimuovere completamente l'utilizzo di `localStorage`.
    * L'hook ora accetterà `activeScalettaId` come argomento.
    * **Stato Interno:**
        * `scalettaItems` (array), `scalettaName` (stringa).
        * `userRoleForScaletta` (stringa, es. 'owner', 'editor', 'viewer', 'playout_operator') - ruolo dell'utente corrente *per la scaletta attiva*.
        * `editingStatusByItemId` (oggetto, per il soft lock: `{ itemId: userName }`).
        * `loading` (boolean), `error` (object/string).
    * **`WorkspaceScalettaData(idToFetch)`:**
        * Carica il nome della scaletta dalla tabella `scalette`.
        * Determina e imposta `userRoleForScaletta` interrogando `scalette.owner_id` e `scaletta_collaborators`.
        * Carica tutti gli `scaletta_items` associati all'`activeScalettaId`, ordinati per `item_order`.
        * Imposta `scalettaItems` e `scalettaName`.
    * **Sottoscrizione Realtime (useEffect):**
        * Quando `activeScalettaId` e `currentUserId` (da `useAuth`) sono validi:
            * Sottoscriversi al canale Supabase Realtime per la tabella `scaletta_items` filtrando per `scaletta_id=eq.${activeScalettaId}`.
            * Gestire gli eventi `INSERT`, `UPDATE`, `DELETE`. Nella callback:
                * Identificare se la modifica è dell'utente corrente (es. confrontando `payload.new?.updated_by` con `currentUserId` o usando un `lastHandledEventRef` per evitare doppi aggiornamenti).
                * Se la modifica è esterna, mostrare una notifica all'utente.
                * Aggiornare lo stato `scalettaItems`:
                    * **Approccio Semplice Iniziale:** Richiamare `WorkspaceScalettaData(activeScalettaId)`.
                    * **Approccio Ottimizzato (Successivo):** Applicare le modifiche (`payload.new`, `payload.old`) direttamente all'array `scalettaItems` locale per evitare un full refresh (richiede più logica di state management).
            * Sottoscriversi al canale Supabase Presence per la scaletta attiva (es. `scaletta-presence:${activeScalettaId}`).
                * Alla connessione, fare `channel.track({ editing_item_id: null, user_id: currentUserId, user_name: currentUser.displayName })`.
                * Gestire l'evento `sync` per aggiornare `editingStatusByItemId`.
            * Ricordarsi di fare `supabase.removeChannel()` nel cleanup dell'effetto.
    * **Funzioni CRUD per `scaletta_items`:**
        * `addScalettaItem(itemType, rawDataFromDialog)`:
            * Verificare i permessi (`userRoleForScaletta` deve essere 'owner' o 'editor').
            * Costruire l'oggetto `newItemPayload` come da "Struttura JSONB Proposta" (vedi mia risposta precedente), includendo `scaletta_id`, `type`, `name` (da `customName` o `originalName`), `data` (jsonb), `item_order` (calcolato come `maxOrder + 1`), `version: 1`, `updated_by: currentUserId`.
            * Chiamare `supabase.from('scaletta_items').insert(newItemPayload)`.
            * Segnare l'evento come gestito localmente per la sottoscrizione realtime (es. con `lastHandledEventRef`).
        * `updateItem(itemId, fieldsToUpdateInItemData, originalVersion, updatedNameFieldValue)`:
            * Verificare i permessi.
            * Implementare il **Locking Ottimistico**:
                1.  Leggere la `version` corrente dell'item dal DB.
                2.  Se `currentDbVersion !== originalVersion`, restituire un oggetto `{ conflict: true, latestData: currentDbItem.data, message: "Conflitto rilevato..." }`.
                3.  Altrimenti, procedere con l'update:
                    * Costruire l'oggetto `updatePayload` per Supabase.
                    * Il campo `data` (jsonb) deve essere aggiornato facendo un merge: `mergedJsonbData = { ...currentDbItem.data, ...fieldsToUpdateInItemData }`.
                    * Aggiornare `version: currentDbVersion + 1`, `updated_by: currentUserId`, `updated_at: new Date()`.
                    * Aggiornare il campo `name` diretto della tabella se `updatedNameFieldValue` è fornito.
                    * Chiamare `supabase.from('scaletta_items').update(updatePayload).eq('id', itemId).eq('version', originalVersion)`.
            * Segnare l'evento come gestito localmente.
        * `removeItem(itemId)`:
            * Verificare i permessi.
            * Chiamare `supabase.from('scaletta_items').delete().eq('id', itemId)`.
            * Segnare l'evento come gestito localmente.
        * `handleDropReorder(dragIndex, dropIndex)`:
            * Verificare i permessi.
            * Creare un array `reorderedItems` con il nuovo ordine.
            * Creare un array di oggetti `itemsToUpdate = reorderedItems.map((item, index) => ({ id: item.id, item_order: index, updated_by: currentUserId, version: item.version + 1 /* o logica di versione per riordino */ }))`.
            * Iterare su `itemsToUpdate` ed eseguire `supabase.from('scaletta_items').update({ item_order: ..., updated_by: ..., version: ... }).eq('id', ...)`. (Considerare una Edge Function per l'atomicità su molti item).
            * Aggiornare ottimisticamente lo stato `scalettaItems` locale o attendere il realtime.
    * **Funzioni per la Gestione della Scaletta (tabella `scalette`):**
        * `updateScalettaName(newName)`: Aggiorna il nome della scaletta attiva in Supabase.
    * **Restituire dallo Hook:** `scalettaItems`, `scalettaName`, `userRoleForScaletta`, `editingStatusByItemId`, `loading`, `error`, e le funzioni CRUD.
3.  **Modifiche a `src/pages/ScaletteEditor/index.js`:**
    * Utilizzare lo stato `activeScalettaId` (gestito qui o ricevuto da una pagina di selezione).
    * Chiamare `useScalettaItems(activeScalettaId)`.
    * Passare i dati e le funzioni dell'hook ai componenti figli (`ScalettaTable`, `EditItemDialog`, ecc.).
    * Implementare la logica per il pulsante "Invia al Rundown" basandosi sui permessi dinamici (vedi Fase 4).
    * Gestire la UI per la risoluzione dei conflitti quando `updateItem` restituisce `{ conflict: true }`.
4.  **Modifiche a `src/pages/ScaletteEditor/components/ScalettaTable.js`:**
    * Disabilitare i controlli di modifica (pulsanti edit/delete, drag&drop) se l'utente non ha permessi di 'owner' o 'editor'.
    * Visualizzare gli indicatori di "in uso" basati su `editingStatusByItemId` (passato come prop).
5.  **Modifiche a `src/pages/ScaletteEditor/components/EditItemDialog.js`:**
    * All'apertura (`useEffect` on `open` e `item`):
        * Salvare `item.version` e `item.data.updated_at` (se usi `updated_at` per il versioning) nello stato locale come `originalVersion`.
        * Inviare l'evento `track` di Supabase Presence per segnalare che l'item è in modifica.
    * Alla chiusura (`useEffect` cleanup o `onClose`):
        * Inviare l'evento `untrack` di Supabase Presence.
    * Al salvataggio:
        * Chiamare `hook.updateItem(item.id, modifiedFieldsInData, originalVersion, newNameFieldValue)`.
        * Gestire la risposta in caso di `{ conflict: true }` mostrando un dialogo/opzioni all'utente (Ricarica, Sovrascrivi, Annulla).
    * Rendere i campi read-only se l'utente non ha permessi di modifica.

**Fase 4: Gestione Permessi Dinamici di Playout**

1.  **Creare `src/utils/permissionsChecker.js` (o simile):**
    * Contenente la funzione `async function isCurrentUserDesignatedPlayoutOperator(userId, supabaseClient)` (che interroga la tabella `playout_assignments` per la data corrente e l' `userId`).
2.  **In `src/pages/ScaletteEditor/index.js`:**
    * Aggiungere uno stato `canCurrentUserSendToPlayout` (boolean).
    * In un `useEffect` che dipende da `currentUserId` (da `useAuth`):
        * Chiamare `isCurrentUserDesignatedPlayoutOperator(currentUserId, supabase)`.
        * Aggiornare `setCanCurrentUserSendToPlayout`.
        * (Opzionale Avanzato) Sottoscriversi a cambiamenti realtime sulla tabella `playout_assignments` (filtrata per data odierna e `currentUserId`) per aggiornare questo permesso dinamicamente senza refresh della pagina.
    * Modificare la condizione `disabled` del pulsante "Invia al Rundown":
        ```javascript
        const finalCanSendToPlayout = canCurrentUserSendToPlayout || userRoleForScaletta === 'owner' || userRoleForScaletta === 'playout_operator';
        // ...
        disabled={!finalCanSendToPlayout || ...}
        ```

**Struttura JSONB Proposta (da usare in `useScalettaItems.js` per popolare il campo `data`):**

(Come definito nella mia risposta precedente, con sezioni `generalInfo`, `timing`, `casparcgConfig`, e poi `mediaDetails` o `templateDetails` condizionali).

```javascript
// Esempio per un item MEDIA
{
  "customName": "Intro Video Completo",
  "originalName": "INTRO_FINALE_V2.mp4",
  "notes": "Usare questa versione.",
  "sourcePath": "videos/final_renders/INTRO_FINALE_V2.mp4",
  "timing": {
    "startTime": "00:00:00", "duration": "00:00:32",
    "inPoint": "00:00:00:00", "outPoint": "00:00:32:00"
  },
  "casparcgConfig": { "channel": 1, "layer": 10 },
  "mediaDetails": {
    "clipPath": "INTRO_FINALE_V2", // Nome usato da CasparCG
    "loop": false, "autoNext": false,
    "linkedTemplate": null
  },
  "templateDetails": null
}