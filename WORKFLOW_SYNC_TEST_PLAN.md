# 🧪 PIANO DI TEST WORKFLOW SINCRONIZZAZIONE SCALETTE-RUNDOWN

## 📋 OBIETTIVO
Verificare il workflow completo di sincronizzazione tra Editor Scalette e Rundown per garantire un flusso operativo end-to-end robusto e affidabile.

## 🔧 CORREZIONI IMPLEMENTATE

### **1. Gestione Rundown Attivo Migliorata**
- ✅ Verifica timeout per impostazione rundown attivo
- ✅ Retry logic con 5 tentativi e 200ms di attesa
- ✅ Gestione errori robusta con rollback automatico
- ✅ Logging dettagliato per debugging

### **2. Verifica Sincronizzazione Elementi**
- ✅ Controllo return value delle funzioni addMedia/addTemplate/addStory
- ✅ Verifica post-invio della sincronizzazione Supabase
- ✅ Timeout di 1 secondo per permettere sincronizzazione
- ✅ Warning se elementi inviati ma rundown vuoto

### **3. Gestione Errori Migliorata**
- ✅ Try-catch per ogni elemento processato
- ✅ Continuazione processamento anche con errori singoli
- ✅ Logging specifico per ogni tipo di errore
- ✅ Messaggi utente informativi

## 🧪 SCENARI DI TEST

### **TEST 1: Workflow Base Completo**
```
1. Creare scaletta con elementi MEDIA, TEMPLATE, STORY
2. Salvare e verificare sincronizzazione Supabase
3. Cliccare "Invia al Rundown"
4. Verificare apertura RundownSelectorDialog
5. Selezionare rundown esistente o crearne uno nuovo
6. Verificare impostazione rundown attivo
7. Verificare apertura SendToRundownDialog
8. Confermare invio elementi
9. Verificare elementi nel rundown di destinazione
10. Verificare sincronizzazione real-time
```

### **TEST 2: Gestione Permessi**
```
1. Utente con ruolo 'viewer' su scaletta
   → Deve essere bloccato all'invio
2. Utente con ruolo 'owner' su scaletta ma 'viewer' su rundown
   → Deve essere bloccato alla selezione rundown
3. Utente con ruolo 'editor' su entrambi
   → Deve procedere normalmente
4. Utente 'playout_operator'
   → Deve avere accesso completo
```

### **TEST 3: Gestione Conflitti**
```
1. Inviare elementi al rundown
2. Modificare elementi nella scaletta
3. Inviare nuovamente gli stessi elementi
4. Verificare rilevamento conflitti
5. Testare opzioni:
   - Sovrascrivi tutto
   - Salta conflitti
   - Converti canali
```

### **TEST 4: Gestione Errori di Rete**
```
1. Disconnettere Supabase durante invio
2. Verificare fallback a localStorage
3. Riconnettere e verificare sincronizzazione
4. Testare timeout di rete
5. Verificare messaggi errore utente
```

### **TEST 5: Sincronizzazione Real-time**
```
1. Aprire rundown su due browser diversi
2. Inviare elementi da scaletta su browser 1
3. Verificare apparizione elementi su browser 2
4. Modificare elementi su browser 2
5. Verificare aggiornamenti su browser 1
```

## 🔍 PUNTI DI VERIFICA SPECIFICI

### **Logs da Monitorare**
```
✅ [SCALETTE EDITOR] Rundown selezionato: {id}
✅ [SCALETTE EDITOR] Rundown attivo verificato: {id}
✅ [RUNDOWN_CONTEXT] Dati rundown caricati per ID esterno: {id}
✅ [SCALETTE EDITOR] Sincronizzazione Supabase verificata
```

### **Errori da Intercettare**
```
❌ Timeout: Rundown attivo non impostato correttamente
❌ Elemento {type} non aggiunto correttamente al rundown
❌ Possibile problema di sincronizzazione: elementi inviati ma rundown vuoto
❌ Non hai i permessi per modificare il rundown di destinazione
```

### **Database da Verificare**
```sql
-- Verifica elementi nel rundown
SELECT * FROM rundown_items WHERE rundown_id = '{rundown_id}' ORDER BY item_order;

-- Verifica permessi utente
SELECT * FROM rundown_collaborators WHERE rundown_id = '{rundown_id}' AND user_id = '{user_id}';

-- Verifica struttura dati elementi
SELECT id, type, name, data FROM rundown_items WHERE rundown_id = '{rundown_id}';
```

## 📊 METRICHE DI SUCCESSO

### **Performance**
- ⏱️ Impostazione rundown attivo: < 2 secondi
- ⏱️ Invio elementi: < 5 secondi per 10 elementi
- ⏱️ Sincronizzazione real-time: < 1 secondo

### **Affidabilità**
- 🎯 Successo invio elementi: 100%
- 🎯 Sincronizzazione Supabase: 100%
- 🎯 Gestione permessi: 100%
- 🎯 Gestione conflitti: 100%

### **Usabilità**
- 👤 Messaggi errore comprensibili
- 👤 Feedback visivo durante operazioni
- 👤 Stato operazioni sempre visibile
- 👤 Rollback automatico in caso errore

## 🚀 ESECUZIONE TEST

### **Comando Test Automatico**
```bash
# Avvia test end-to-end
npm run test:e2e:workflow

# Test specifico sincronizzazione
npm run test:sync:scalette-rundown

# Test permessi
npm run test:permissions:workflow
```

### **Test Manuale**
1. Aprire DevTools Console
2. Seguire scenari di test
3. Monitorare logs specifici
4. Verificare database Supabase
5. Documentare risultati

## 📝 CHECKLIST FINALE

- [ ] Workflow base funziona end-to-end
- [ ] Permessi verificati correttamente
- [ ] Conflitti gestiti appropriatamente
- [ ] Errori di rete gestiti con fallback
- [ ] Sincronizzazione real-time attiva
- [ ] Performance entro limiti accettabili
- [ ] Messaggi utente informativi
- [ ] Database Supabase consistente
- [ ] Logs dettagliati per debugging
- [ ] Rollback automatico funzionante
