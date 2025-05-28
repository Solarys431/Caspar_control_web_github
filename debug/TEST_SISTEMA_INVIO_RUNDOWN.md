# 🧪 TEST SISTEMA INVIO RUNDOWN

## 📋 CHECKLIST TEST FUNZIONALITÀ

### **PREREQUISITI**
- [ ] Utente autenticato in Supabase
- [ ] Scaletta con almeno 3 elementi (MEDIA, TEMPLATE, STORY)
- [ ] Connessione CasparCG attiva
- [ ] Database Supabase configurato con policy RLS

### **TEST 1: Invio con Rundown Attivo** 
**Scenario**: Utente proprietario scaletta + rundown attivo

**Passi:**
1. [ ] Aprire editor scalette
2. [ ] Verificare che ci sia un rundown attivo (indicatore in alto)
3. [ ] Selezionare alcuni elementi (o tutti)
4. [ ] Cliccare "Invia al Rundown"
5. [ ] Verificare apertura dialogo conferma
6. [ ] Confermare invio

**Risultato Atteso:**
- [ ] ✅ Dialogo di conferma si apre immediatamente
- [ ] ✅ Elementi vengono processati correttamente
- [ ] ✅ Messaggio di successo con conteggio elementi
- [ ] ✅ Elementi appaiono nel rundown di destinazione

**Log da Verificare:**
```
🎯 DEBUG: Apertura Dialogo Invio Rundown
✅ Permessi verificati sul rundown di destinazione
🚀 DEBUG: Invio al Rundown con Gestione Conflitti
📊 RIEPILOGO INVIO: X elementi inviati con successo
```

### **TEST 2: Invio senza Rundown Attivo**
**Scenario**: Utente proprietario scaletta + nessun rundown attivo

**Passi:**
1. [ ] Aprire editor scalette
2. [ ] Verificare che NON ci sia un rundown attivo
3. [ ] Selezionare alcuni elementi
4. [ ] Cliccare "Invia al Rundown"
5. [ ] Verificare apertura dialogo selezione rundown
6. [ ] Selezionare un rundown esistente o crearne uno nuovo
7. [ ] Confermare selezione

**Risultato Atteso:**
- [ ] ✅ Dialogo selezione rundown si apre
- [ ] ✅ Lista rundown disponibili mostrata
- [ ] ✅ Permessi utente indicati correttamente
- [ ] ✅ Dopo selezione, si apre dialogo conferma invio
- [ ] ✅ Invio procede normalmente

**Log da Verificare:**
```
❌ Nessun rundown attivo, apertura selettore rundown
🎯 Rundown selezionato: [nome]
✅ Rundown attivo impostato: [id]
```

### **TEST 3: Creazione Nuovo Rundown**
**Scenario**: Creazione rundown al volo durante invio

**Passi:**
1. [ ] Aprire dialogo selezione rundown
2. [ ] Spuntare "Crea nuovo rundown"
3. [ ] Inserire nome rundown
4. [ ] Cliccare "Crea"
5. [ ] Verificare che il nuovo rundown appaia nella lista
6. [ ] Selezionarlo e procedere

**Risultato Atteso:**
- [ ] ✅ Nuovo rundown creato in Supabase
- [ ] ✅ Utente automaticamente proprietario
- [ ] ✅ Rundown selezionato automaticamente
- [ ] ✅ Permessi di modifica garantiti

### **TEST 4: Gestione Permessi Insufficienti**
**Scenario**: Utente senza permessi adeguati

**Passi:**
1. [ ] Accedere con utente che ha solo permessi "viewer" su scaletta
2. [ ] Tentare di inviare al rundown
3. [ ] Verificare messaggio di errore

**Risultato Atteso:**
- [ ] ❌ Errore: "Non hai i permessi per inviare la scaletta al rundown"
- [ ] ❌ Dialogo non si apre

**Test Aggiuntivo - Permessi Rundown:**
1. [ ] Utente con permessi scaletta ma viewer su rundown
2. [ ] Tentare invio
3. [ ] Verificare errore specifico

**Risultato Atteso:**
- [ ] ❌ Errore: "Non hai i permessi per modificare il rundown di destinazione"

### **TEST 5: Gestione Conflitti**
**Scenario**: Elementi con nomi duplicati nel rundown

**Passi:**
1. [ ] Inviare alcuni elementi al rundown
2. [ ] Modificare leggermente gli stessi elementi nella scaletta
3. [ ] Tentare di inviarli nuovamente
4. [ ] Verificare rilevamento conflitti
5. [ ] Testare opzioni "Sovrascrivi" e "Salta"

**Risultato Atteso:**
- [ ] ✅ Conflitti rilevati e mostrati nel dialogo
- [ ] ✅ Opzioni di gestione funzionanti
- [ ] ✅ Conteggio corretto elementi saltati/sovrascritti

### **TEST 6: Gestione Errori di Rete**
**Scenario**: Problemi di connessione durante invio

**Passi:**
1. [ ] Iniziare invio elementi
2. [ ] Simulare disconnessione rete (dev tools)
3. [ ] Verificare gestione errore

**Risultato Atteso:**
- [ ] ❌ Errore di rete catturato e mostrato
- [ ] ❌ Processo interrotto gracefully
- [ ] ❌ Stato UI ripristinato

### **TEST 7: Invio Tramite Calendario**
**Scenario**: Flusso alternativo via calendario

**Passi:**
1. [ ] Cliccare "Invia al Calendario"
2. [ ] Selezionare giorno settimana
3. [ ] Verificare conversione canali al canale 1
4. [ ] Verificare elementi nel calendario

**Risultato Atteso:**
- [ ] ✅ Elementi convertiti al canale playout
- [ ] ✅ Timing mappato correttamente
- [ ] ✅ Note preservate

## 🔧 DEBUGGING

### **Console Logs da Monitorare**
```javascript
// Apertura dialogo
🎯 DEBUG: Apertura Dialogo Invio Rundown

// Verifica permessi
🔍 Verifica permessi rundown di destinazione: [id]
👤 Ruolo utente sul rundown: [role]

// Processamento
🚀 DEBUG: Invio al Rundown con Gestione Conflitti
📦 Processando elemento X/N: [dettagli]

// Risultati
📊 RIEPILOGO INVIO CON GESTIONE CONFLITTI:
   - Elementi ricevuti: X
   - Elementi inviati con successo: X
   - Elementi saltati: X
   - Elementi sovrascritti: X
```

### **Errori Comuni da Verificare**
1. **"Supabase non ha i permessi per modificare questo rundown"**
   - ✅ RISOLTO: Verifica permessi implementata

2. **"Nessun rundown attivo"**
   - ✅ RISOLTO: Dialogo selezione implementato

3. **Elementi non arrivano al rundown**
   - ✅ RISOLTO: Gestione errori migliorata

## 📊 METRICHE DI SUCCESSO

- [ ] **100% dei test base passano**
- [ ] **Gestione errori robusta**
- [ ] **UX fluida e intuitiva**
- [ ] **Permessi sicuri e verificati**
- [ ] **Logging completo per debugging**

## 🎯 PROSSIMI PASSI

Dopo aver completato tutti i test:
1. [ ] Documentare eventuali bug trovati
2. [ ] Ottimizzare performance se necessario
3. [ ] Aggiungere test automatizzati
4. [ ] Preparare deployment in produzione
