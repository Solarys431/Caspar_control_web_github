# Guida alle Ottimizzazioni OSC - Sistema Broadcast-Grade

## 📋 Panoramica

Il sistema OSC di CasparCG Control Web è stato completamente ottimizzato utilizzando i pattern di SuperConductor per ottenere performance broadcast-grade e risolvere i problemi di sovraccarico CPU nell'editor scalette.

## 🚀 Ottimizzazioni Implementate

### 1. **Hook OSC Ottimizzato (useOscDataOptimizedFixed)**

**Problema Risolto**: `useOscDataAdvanced` causava sovraccarico CPU con aggiornamenti ogni 100ms (10 FPS costanti).

**Soluzione Implementata**:
- **setInterval ottimizzato** con throttling intelligente (100ms per preview, 200ms per altri)
- **Comparazione semplificata** per evitare blocchi con lodash.isEqual
- **Debouncing avanzato** per richieste dati mancanti
- **Logging condizionale** solo per debug e canali prioritari

**Correzioni Critiche Applicate**:
- ✅ Rimossa dipendenza da `requestMediaInfo` non esistente
- ✅ Aggiunta `requestMediaInfo` al CasparContext
- ✅ Semplificata logica di comparazione stato
- ✅ Corretti errori di sintassi e dipendenze circolari

```javascript
// Pattern SuperConductor implementato
const updateLoop = useCallback(() => {
  frameCount.current++;
  const throttleInterval = getThrottleInterval();

  // Aggiorna solo quando necessario (throttling intelligente)
  if (lowLatencyMode.current || frameCount.current % throttleInterval === 0) {
    reconcileState();
  }

  animationFrameId.current = requestAnimationFrame(updateLoop);
}, [oscConnected, reconcileState, getThrottleInterval]);
```

### 2. **Sistema di Priorità per Canali**

**Canale Preview (3)**: Priorità massima
- Bassa latenza: 1 frame (60 FPS)
- Normale: 3 frame (20 FPS)

**Altri Canali**: Priorità normale
- Bassa latenza: 3 frame (20 FPS)
- Normale: 5 frame (12 FPS)

### 3. **Debouncing Avanzato**

**Richieste Dati Mancanti**:
- Massimo 1 richiesta ogni 5 secondi
- Solo per canali prioritari
- Evita spam di richieste INFO

### 4. **Logging Condizionale**

**Riduzione Overhead**:
- Logging solo per canali preview in development
- Eliminati console.log in produzione
- Logging solo per cambiamenti significativi

### 5. **Comparazione Profonda**

**Evita Re-render Inutili**:
```javascript
// Aggiorna stato solo se ci sono cambiamenti significativi
if (!_.isEqual(lastStateRef.current, newState)) {
  lastStateRef.current = newState;
  setState(newState);
}
```

## 📊 Monitor Performance

### Componente OscPerformanceMonitor

Strumento di debug per monitorare le performance in tempo reale:

```javascript
<OscPerformanceMonitor
  channel={3}
  layer={1}
  enabled={true}
  compact={true}
/>
```

**Metriche Monitorate**:
- FPS effettivo
- Numero aggiornamenti/render
- Intervalli di aggiornamento (min/max/medio)
- Stato bassa latenza
- Dati OSC correnti

## 🔧 Configurazione

### Abilitare Monitor Performance

Nel componente `ItemContextControls`:

```javascript
<ItemContextControls
  selectedItem={selectedItem}
  previewChannel={3}
  previewLayer={1}
  showPerformanceMonitor={true} // Debug: abilita monitor
/>
```

### Parametri di Throttling

Modificabili in `useOscDataOptimized.js`:

```javascript
const getThrottleInterval = useCallback(() => {
  if (isHighPriorityChannel()) {
    return lowLatencyMode.current ? 1 : 3; // Preview: 1-3 frame
  }
  return lowLatencyMode.current ? 3 : 5; // Altri: 3-5 frame
}, [isHighPriorityChannel]);
```

## 📈 Risultati Attesi

### Performance Migliorate

1. **Riduzione CPU**: Da ~30% a ~5% durante riproduzione
2. **FPS Stabile**: 15-20 FPS per canali preview, 10-12 FPS per altri
3. **Eliminazione Vibrazioni**: Interfaccia fluida senza pulsazioni
4. **Responsività**: Bassa latenza automatica durante riproduzione

### Indicatori di Successo

- **FPS Effettivo ≥ 15**: Performance ottimali
- **FPS Effettivo 10-14**: Performance buone
- **FPS Effettivo 5-9**: Performance lente (da ottimizzare)
- **FPS Effettivo < 5**: Performance critiche

## 🛠️ Troubleshooting

### Performance Lente

1. **Verifica Canale**: Assicurati che il canale preview sia 3
2. **Controlla Logging**: Disabilita logging in produzione
3. **Monitor Throttling**: Verifica intervalli di aggiornamento
4. **Bassa Latenza**: Controlla attivazione automatica

### Debug Avanzato

```javascript
// Abilita logging dettagliato
if (process.env.NODE_ENV === 'development') {
  console.log('[OSC Debug] Performance stats:', performanceStats);
}
```

## 🔄 Migrazione da Sistema Precedente

### Sostituzione Hook

```javascript
// PRIMA (problematico)
import useOscDataAdvanced from './useOscDataAdvanced';

// DOPO (ottimizzato)
import useOscData from './useOscData'; // Ora usa useOscDataOptimized
```

### Compatibilità API

L'API rimane identica, nessuna modifica necessaria nei componenti esistenti.

## 📚 Pattern SuperConductor Utilizzati

1. **requestAnimationFrame Loop**: Aggiornamenti fluidi sincronizzati con display
2. **Throttling Adattivo**: Frequenza basata su priorità e stato
3. **Comparazione Profonda**: Evita aggiornamenti inutili
4. **Sistema di Priorità**: Canali diversi, performance diverse
5. **Debouncing Intelligente**: Richieste dati con controllo frequenza

## 🎯 Best Practices

1. **Usa sempre useOscData**: Non importare direttamente useOscDataOptimized
2. **Monitor Performance**: Abilita solo per debug, non in produzione
3. **Canali Preview**: Usa sempre canale 3 per preview
4. **Logging Condizionale**: Solo in development per canali prioritari
5. **Throttling Personalizzato**: Modifica intervalli solo se necessario

## 🔮 Sviluppi Futuri

1. **WebWorkers**: Spostare elaborazione OSC in background
2. **Caching Intelligente**: Cache dati media per ridurre richieste
3. **Predizione Stato**: Anticipare cambiamenti di stato
4. **Compressione Dati**: Ridurre payload OSC
5. **Metriche Avanzate**: Telemetria performance in tempo reale
