# 🧪 TEST CORREZIONI SINCRONIZZAZIONE SUPABASE

## 📋 CHECKLIST TEST COMPLETA

### **PREREQUISITI**
- [ ] Utente autenticato: `5d9357c9-57b2-46ad-9dd2-81be872ca3ed`
- [ ] Scaletta con elementi STORY (almeno 3)
- [ ] Connessione Supabase attiva
- [ ] Database con policy RLS configurate

---

## **TEST 1: Correzione Query Supabase** 
**Scenario**: Apertura dialogo selezione rundown

### **Passi:**
1. [ ] Aprire editor scalette
2. [ ] Cliccare "Invia al Rundown" (senza rundown attivo)
3. [ ] Verificare apertura `RundownSelectorDialog`
4. [ ] Osservare caricamento rundown disponibili

### **Risultato Atteso:**
- [ ] ✅ Dialogo si apre senza errori
- [ ] ✅ Lista rundown caricata correttamente
- [ ] ✅ Nessun errore "failed to parse logic tree" nella console
- [ ] ✅ Permessi utente mostrati correttamente

### **Log da Verificare:**
```javascript
// PRIMA (ERRORE):
// failed to parse logic tree ((owner_id.eq.5d9357c9-57b2-46ad-9dd2-81be872ca3ed,rundown_collaborators.user_id.eq.5d9357c9-57b2-46ad-9dd2-81be872ca3ed))

// DOPO (SUCCESSO):
// Query separata per rundown di proprietà: SUCCESS
// Query separata per rundown di collaborazione: SUCCESS
// Combinazione risultati: X rundown trovati
```

---

## **TEST 2: Sincronizzazione Elementi STORY**
**Scenario**: Invio elementi STORY al rundown

### **Passi:**
1. [ ] Selezionare elementi STORY nella scaletta
2. [ ] Cliccare "Invia al Rundown"
3. [ ] Selezionare/creare rundown di destinazione
4. [ ] Confermare invio nel dialogo
5. [ ] Verificare elementi nel rundown di destinazione

### **Risultato Atteso:**
- [ ] ✅ Elementi STORY processati correttamente
- [ ] ✅ Elementi salvati in Supabase (tabella `rundown_items`)
- [ ] ✅ Elementi visibili nel rundown di destinazione
- [ ] ✅ Sincronizzazione real-time funzionante

### **Log da Verificare:**
```javascript
// Console logs attesi:
🔄 [RUNDOWN CONTEXT] Aggiunta storia tramite Supabase: [storyData]
✅ [RUNDOWN CONTEXT] Storia aggiunta con successo a Supabase: [newItem]
📊 RIEPILOGO INVIO: X elementi STORY inviati con successo
```

### **Verifica Database:**
```sql
-- Verifica inserimento in Supabase
SELECT id, name, type, data->>'customName' as custom_name 
FROM rundown_items 
WHERE rundown_id = '[rundown_id]' 
AND type = 'STORY' 
ORDER BY item_order;
```

---

## **TEST 3: Gestione Permessi**
**Scenario**: Verifica permessi multi-livello

### **Test 3A: Permessi Scaletta + Rundown**
1. [ ] Utente proprietario scaletta + proprietario rundown
2. [ ] Tentare invio elementi
3. [ ] Verificare successo

**Risultato Atteso:**
- [ ] ✅ Invio completato con successo

### **Test 3B: Permessi Insufficienti Scaletta**
1. [ ] Utente viewer su scaletta
2. [ ] Tentare invio elementi
3. [ ] Verificare blocco

**Risultato Atteso:**
- [ ] ❌ Errore: "Non hai i permessi per inviare la scaletta al rundown"

### **Test 3C: Permessi Insufficienti Rundown**
1. [ ] Utente con permessi scaletta ma viewer su rundown
2. [ ] Tentare invio elementi
3. [ ] Verificare blocco

**Risultato Atteso:**
- [ ] ❌ Errore: "Non hai i permessi per modificare il rundown di destinazione"

---

## **TEST 4: Creazione Nuovo Rundown**
**Scenario**: Creazione rundown durante invio

### **Passi:**
1. [ ] Aprire dialogo selezione rundown
2. [ ] Spuntare "Crea nuovo rundown"
3. [ ] Inserire nome: "Test Rundown Automatico"
4. [ ] Cliccare "Crea"
5. [ ] Verificare creazione e selezione automatica

### **Risultato Atteso:**
- [ ] ✅ Nuovo rundown creato in Supabase
- [ ] ✅ Utente automaticamente proprietario
- [ ] ✅ Rundown selezionato per invio
- [ ] ✅ Permessi di modifica garantiti

---

## **TEST 5: Fallback localStorage**
**Scenario**: Comportamento con Supabase non disponibile

### **Passi:**
1. [ ] Simulare disconnessione Supabase (dev tools)
2. [ ] Tentare invio elementi STORY
3. [ ] Verificare fallback localStorage

### **Risultato Atteso:**
- [ ] ✅ Fallback a localStorage attivato
- [ ] ✅ Elementi aggiunti localmente
- [ ] ✅ Messaggio di fallback nel log

### **Log da Verificare:**
```javascript
❌ [RUNDOWN CONTEXT] Errore aggiunta storia a Supabase: [error]
📁 [RUNDOWN CONTEXT] Aggiunta storia tramite localStorage (fallback): [storyData]
```

---

## **TEST 6: Sincronizzazione Real-time**
**Scenario**: Verifica aggiornamenti in tempo reale

### **Passi:**
1. [ ] Aprire rundown in due browser/tab diversi
2. [ ] Inviare elementi da scaletta nel primo browser
3. [ ] Verificare apparizione elementi nel secondo browser

### **Risultato Atteso:**
- [ ] ✅ Elementi appaiono automaticamente nel secondo browser
- [ ] ✅ Ordine elementi corretto
- [ ] ✅ Dati completi sincronizzati

---

## **TEST 7: Gestione Errori Avanzata**
**Scenario**: Comportamento con errori vari

### **Test 7A: Rundown Inesistente**
1. [ ] Tentare invio a rundown cancellato
2. [ ] Verificare gestione errore

### **Test 7B: Permessi Revocati Durante Invio**
1. [ ] Iniziare invio
2. [ ] Revocare permessi durante processo
3. [ ] Verificare gestione errore

### **Test 7C: Dati Malformati**
1. [ ] Inviare elementi con dati corrotti
2. [ ] Verificare gestione errore

**Risultato Atteso per tutti:**
- [ ] ✅ Errori catturati e gestiti
- [ ] ✅ Messaggi informativi mostrati
- [ ] ✅ Stato UI ripristinato correttamente

---

## 🔧 DEBUGGING

### **Console Logs Chiave**
```javascript
// Apertura dialogo selezione
🎯 DEBUG: Apertura Dialogo Invio Rundown
❌ Nessun rundown attivo, apertura selettore rundown

// Query Supabase corrette
🔍 Query separata per rundown di proprietà: SUCCESS
🔍 Query separata per rundown di collaborazione: SUCCESS
📊 Combinazione risultati: X rundown trovati

// Sincronizzazione STORY
🔄 [RUNDOWN CONTEXT] Aggiunta storia tramite Supabase
✅ [RUNDOWN CONTEXT] Storia aggiunta con successo a Supabase

// Fallback
❌ [RUNDOWN CONTEXT] Errore aggiunta storia a Supabase
📁 [RUNDOWN CONTEXT] Aggiunta storia tramite localStorage (fallback)
```

### **Verifica Database**
```sql
-- Rundown creati
SELECT id, name, owner_id, created_at 
FROM rundowns 
WHERE owner_id = '5d9357c9-57b2-46ad-9dd2-81be872ca3ed'
ORDER BY created_at DESC;

-- Elementi STORY inseriti
SELECT r.name as rundown_name, ri.name as item_name, ri.type, ri.data->>'customName'
FROM rundown_items ri
JOIN rundowns r ON ri.rundown_id = r.id
WHERE ri.type = 'STORY' 
AND ri.updated_by = '5d9357c9-57b2-46ad-9dd2-81be872ca3ed'
ORDER BY ri.created_at DESC;
```

---

## 📊 CRITERI DI SUCCESSO

### **Funzionalità Critiche**
- [ ] **Query Supabase**: 100% successo senza errori parsing
- [ ] **Sincronizzazione STORY**: 100% elementi salvati in database
- [ ] **Permessi**: Verifica corretta in tutti gli scenari
- [ ] **Real-time**: Sincronizzazione immediata tra client
- [ ] **Fallback**: Funzionamento con Supabase offline

### **Performance**
- [ ] **Caricamento rundown**: < 2 secondi
- [ ] **Invio elementi**: < 5 secondi per 10 elementi
- [ ] **Sincronizzazione**: < 1 secondo per aggiornamenti

### **Robustezza**
- [ ] **Gestione errori**: Nessun crash dell'applicazione
- [ ] **Recovery**: Ripristino automatico dopo errori temporanei
- [ ] **Logging**: Informazioni complete per debugging

---

## 🎯 RISULTATO FINALE ATTESO

✅ **Sistema di sincronizzazione Supabase completamente funzionante**
✅ **Flusso di invio scalette → rundown ripristinato**
✅ **Gestione permessi sicura e robusta**
✅ **Esperienza utente fluida e intuitiva**

Tutte le correzioni implementate dovrebbero risolvere i problemi di sincronizzazione e permettere il corretto funzionamento del sistema di invio scalette al rundown.
