# COMPONENTI CORE DELL'APPLICAZIONE

## PANORAMICA ARCHITETTURALE

L'applicazione CasparCG Control Web utilizza un'architettura React moderna basata su componenti funzionali con hooks. La struttura è organizzata in cartelle tematiche che raggruppano componenti con funzionalità correlate.

### Principi di Design
- **Separazione delle responsabilità**: Ogni componente ha una funzione specifica
- **Riutilizzabilità**: Componenti modulari e configurabili
- **Context-based state management**: Utilizzo di React Context per lo stato globale
- **Material-UI theming**: Interfaccia coerente con tema scuro personalizzato
- **Real-time communication**: Integrazione Socket.IO per aggiornamenti live

---

## 1. COMPONENTI DI AUTENTICAZIONE (`/auth`)

### LoginForm.js
**Scopo**: Gestione dell'accesso utente al sistema

**Props Interface**:
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}
```

**Funzionalità Core**:
- Validazione client-side dei campi email/password
- Integrazione con `AuthContext` per autenticazione Supabase
- Feedback visivo durante il caricamento (CircularProgress)
- Gestione errori con Alert Material-UI
- Transizione fluida verso registrazione

**Pattern Utilizzati**:
- Controlled components per input validation
- Error boundaries con stato locale per errori form
- Loading states per UX durante API calls

**Dipendenze Context**: `AuthContext` (signIn, loading, error)

### ProtectedRoute.js
**Scopo**: HOC per proteggere route che richiedono autenticazione

**Props Interface**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Funzionalità Core**:
- Guard pattern per controllo autenticazione
- Redirect automatico a `/auth` se non autenticato
- Loading spinner durante verifica autenticazione
- Preservazione della location per redirect post-login

**Pattern Utilizzati**:
- Higher-Order Component pattern
- React Router navigation guards
- Loading states per transizioni fluide

### RegisterForm.js
**Scopo**: Registrazione nuovi utenti

**Funzionalità Core**:
- Validazione password strength (min 6 caratteri)
- Conferma password con validazione match
- Campo display name opzionale con fallback email
- Gestione metadati utente per Supabase

**Validazioni Implementate**:
- Email format validation (browser native)
- Password length validation
- Password confirmation match
- Required fields validation

---

## 2. COMPONENTI DI LAYOUT (`/layout`)

### Header.js
**Scopo**: Barra di navigazione principale con controlli sistema

**Dipendenze Context**: 
- `CasparContext` (connected, host, port, disconnect)
- `AuthContext` (user, signOut)

**Funzionalità Core**:
- **Status di connessione**: Chip visivo per stato CasparCG (verde/rosso)
- **Profile selector**: Integrazione ProfileSelector per multi-server
- **User menu**: Avatar utente con dropdown (impostazioni, logout)
- **Quick actions**: Connetti/disconnetti server CasparCG
- **Brand identity**: Logo e titolo applicazione

**Material-UI Components**:
- AppBar con posizione fixed e z-index drawer
- Chip per status indicators
- Menu/MenuItem per user dropdown
- Avatar con initial letter dell'utente
- IconButton per azioni rapide

### Sidebar.js
**Scopo**: Menu di navigazione laterale dell'applicazione

**Funzionalità Core**:
- **Navigation items**: 8 sezioni principali (Dashboard, Media, Playout, ecc.)
- **Active state**: Highlighting della pagina corrente
- **Tooltips**: Descrizioni dettagliate per ogni sezione
- **External link**: Documentazione CasparCG (wiki)

**Menu Structure**:
```javascript
const menuItems = [
  { text: 'Dashboard', path: '/', icon: DashboardIcon },
  { text: 'Browser Media', path: '/media', icon: MovieIcon },
  { text: 'Controllo Playout', path: '/playout', icon: PlayArrowIcon },
  { text: 'Editor Grafica', path: '/graphics', icon: BrushIcon },
  { text: 'Controllo Mixer', path: '/mixer', icon: TuneIcon },
  { text: 'Rundown', path: '/rundown', icon: PlaylistPlayIcon },
  { text: 'Editor Scalette', path: '/scalette', icon: EditIcon },
  { text: 'Impostazioni', path: '/settings', icon: SettingsIcon }
];
```

**Design Pattern**:
- Persistent drawer con larghezza fissa (240px)
- Dark theme (#1e1e1e background)
- Selected state con primary color highlight
- Hover effects per feedback interattivo

### ProfileSelector.js
**Scopo**: Selezione profilo CasparCG per multi-server management

**Dipendenze Context**: `CasparContext` (activeProfileId, updateActiveProfile, socket, addLog)

**Funzionalità Core**:
- **Real-time profile loading**: Caricamento profili via Socket.IO
- **Default profile detection**: Auto-selezione profilo predefinito
- **Error handling**: Gestione errori caricamento con feedback visivo
- **Loading states**: Indicatori per operazioni asincrone

**Socket.IO Integration**:
```javascript
socket.emit('profiles:list', (response) => {
  if (response.success) {
    setProfiles(response.profiles || []);
    // Auto-select default profile logic
  }
});
```

**Error Handling**:
- Loading spinner durante caricamento
- Error message per fallimenti
- Warning per nessun profilo disponibile
- Retry logic integrata

---

## 3. COMPONENTI MEDIA (`/media`)

### MediaBrowser.js
**Scopo**: Browser per file multimediali CasparCG

**Dipendenze Context**: 
- `CasparContext` (connected, mediaList, getMediaList)
- `RundownContext` (addMedia)

**Funzionalità Core**:
- **File type detection**: Categorizzazione automatica (video, audio, immagini)
- **Search functionality**: Filtro real-time per nome file
- **Type filtering**: Menu dropdown per filtrare per tipo media
- **Direct actions**: Aggiungi a rundown, play preview
- **Grid layout**: Visualizzazione responsive con card

**File Type Detection Logic**:
```javascript
const getFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  if (['mp4', 'mov', 'avi', 'wmv', 'mkv'].includes(extension)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) return 'image';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) return 'audio';
  return 'other';
};
```

**UI Components**:
- Search bar con clear button
- Filter chips per tipi di file
- Card layout per ogni media item
- Action buttons (Add, Play) per ogni item

### TemplateBrowser.js
**Scopo**: Browser per template grafici CasparCG

**Funzionalità Core**:
- **Template categorization**: Lower third, ticker, logo, text
- **Smart defaults**: Dati predefiniti basati su tipo template
- **Integration ready**: Direct add to rundown con CG layer

**Template Data Mapping**:
```javascript
const getDefaultData = (templateType) => {
  switch (templateType) {
    case 'ticker': return { text: 'Testo del ticker' };
    case 'lowerthird': return { title: 'Titolo', subtitle: 'Sottotitolo' };
    case 'logo': return { position: 'topright' };
    default: return {};
  }
};
```

**CasparCG Integration**:
- Channel/Layer assignment (default: channel 1, layer 20)
- CG Layer management (default: cgLayer 1)
- Template data pre-population

---

## 4. COMPONENTI SCALETTE (`/scalette`)

### TemplateEditor.js
**Scopo**: Editor avanzato per template grafici con preview live

**Dipendenze Context**: `CasparContext` (connected, cgAdd, cgUpdate, cgStop)

**Funzionalità Core**:
- **Dynamic field generation**: Campi form basati su tipo template
- **Live preview**: Anteprima real-time su canale dedicato (channel 3)
- **Field validation**: Validazione dinamica per diversi tipi input
- **State management**: Gestione valori form con aggiornamenti live

**Template Field Mapping**:
```javascript
const getTemplateFields = (templateName) => {
  if (name.includes('ticker')) {
    return [{ name: 'text', label: 'Testo', type: 'text', defaultValue: 'Testo del ticker' }];
  }
  if (name.includes('lower') && name.includes('third')) {
    return [
      { name: 'title', label: 'Titolo', type: 'text', defaultValue: 'Titolo' },
      { name: 'subtitle', label: 'Sottotitolo', type: 'text', defaultValue: 'Sottotitolo' }
    ];
  }
  // Altri mapping...
};
```

**Preview System**:
- **Dedicated channel**: Usa channel 3 per preview
- **Real-time updates**: cgUpdate per modifiche live
- **Play/Stop controls**: Gestione stato preview
- **Error handling**: Feedback per errori CasparCG

### TemplateSelector.js
**Scopo**: Selettore template con categorizzazione e filtri

**Funzionalità Core**:
- **Chip-based filtering**: Filtri visivi per categoria template
- **Icon mapping**: Icone specifiche per tipo template
- **Smart categorization**: Riconoscimento automatico tipo da nome
- **Direct selection**: Callback per selezione template

**Category Icons**:
```javascript
const getTemplateIcon = (template) => {
  const type = getTemplateType(template);
  switch (type) {
    case 'ticker': return <TickerIcon />;
    case 'lower_third': return <LowerThirdIcon />;
    case 'logo': return <LogoIcon />;
    case 'text': return <TextIcon />;
    default: return <TemplateIcon />;
  }
};
```

---

## 5. COMPONENTI SPECIALIZZATI

### PreviewPlayer.js
**Scopo**: Player video WebRTC per preview live CasparCG

**Props Interface**:
```typescript
interface PreviewPlayerProps {
  sourceUdpUrl?: string;
  webrtcSignalingUrl?: string;
  showLatency?: boolean;
}
```

**Funzionalità Core**:
- **WebRTC streaming**: Integrazione MediaMTXWebRTCReader
- **Automatic reconnection**: Retry logic con exponential backoff
- **Latency monitoring**: Display real-time latency in ms
- **Connection status**: Indicatori visivi stato connessione
- **Page visibility handling**: Riconnessione automatica tab focus

**WebRTC Integration**:
```javascript
const reader = new window.MediaMTXWebRTCReader({
  url: new URL('/preview/whep', webrtcSignalingUrl),
  onTrack: (ev) => {
    videoRef.current.srcObject = ev.streams[0];
    setIsConnected(true);
  },
  onLatency: (ms) => setLatency(ms),
  onError: (err) => handleReconnection()
});
```

**Resilience Features**:
- Max 3 tentativi di riconnessione
- 2 secondi delay tra tentativi
- Page visibility API per riconnessione su focus
- Custom events per reinit manuale

### ConnectionDialog.js
**Scopo**: Dialog per configurazione connessione CasparCG

**Funzionalità Core**:
- **Server configuration**: Host/Port input con validazione
- **Connection status**: Impedisce chiusura se non connesso
- **Form validation**: Validazione porta (1-65535) e host required
- **Error feedback**: Display errori connessione e form

**Validation Logic**:
```javascript
const validateConnection = () => {
  if (!formHost.trim()) return 'L\'host è obbligatorio';
  const portNumber = parseInt(formPort);
  if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
    return 'La porta deve essere un numero valido (1-65535)';
  }
  return null;
};
```

---

## 6. COMPONENTI CALENDARIO

### TimelineCalendar.js
**Scopo**: Calendario timeline avanzato per programmazione

**Dipendenze Context**: 
- `CalendarContext` (calendarData, playlistData, addRundownToDay, etc.)
- `CasparContext` (connected, playMedia)
- `RundownContext` (rundownItems, addItemToRundown)

**Funzionalità Core**:
- **Timeline visualization**: Visualizzazione oraria 24h per giorno
- **Drag & Drop**: Riordino elementi con react-beautiful-dnd
- **Dual view**: Modalità calendario e playlist
- **Time calculation**: Calcolo automatico end time e posizionamento
- **CRUD operations**: Completo create/read/update/delete elementi

**Timeline Positioning Logic**:
```javascript
const calculateItemPosition = (startTime, duration) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  
  const [durationHours, durationMinutes] = duration.split(':').map(Number);
  const durationTotalMinutes = durationHours * 60 + durationMinutes;
  
  const top = (startTotalMinutes / (24 * 60)) * 100;
  const height = (durationTotalMinutes / (24 * 60)) * 100;
  
  return { top: `${top}%`, height: `${height}%` };
};
```

**Calendar Features**:
- 7 giorni settimana con timeline verticale
- Elementi posizionati proportionalmente
- Linee orarie per riferimento visivo
- Context menu per azioni elemento
- Drag & drop per riordinamento

---

## PATTERN ARCHITETTURALI COMUNI

### 1. Context Integration Pattern
Tutti i componenti seguono il pattern di integrazione Context:
```javascript
const { 
  contextData, 
  contextActions, 
  loading, 
  error 
} = useContext();
```

### 2. Loading States Pattern
Gestione consistente degli stati di caricamento:
```javascript
{loading ? (
  <CircularProgress />
) : data.length === 0 ? (
  <EmptyState />
) : (
  <DataDisplay data={data} />
)}
```

### 3. Error Boundary Pattern
Gestione errori con feedback visivo:
```javascript
{error && (
  <Alert severity="error">
    {error}
  </Alert>
)}
```

### 4. Form Validation Pattern
Validazione form con stato locale:
```javascript
const [formError, setFormError] = useState('');
const handleSubmit = () => {
  const validation = validateForm();
  if (validation.error) {
    setFormError(validation.message);
    return;
  }
  // Proceed with submission
};
```

### 5. Socket.IO Integration Pattern
Comunicazione real-time standardizzata:
```javascript
useEffect(() => {
  if (socket) {
    socket.emit('request_data', callback);
    socket.on('data_update', handleUpdate);
    return () => socket.off('data_update', handleUpdate);
  }
}, [socket]);
```

---

## INTEGRAZIONE MATERIAL-UI

### Theme Consistency
- **Dark theme**: Background #2d2d2d, #1e1e1e per sidebar
- **Primary color**: Blue (#2196f3) per azioni principali
- **Typography**: Variant standardizzate (h6, body1, body2, caption)
- **Elevation**: Paper elevation 3 per componenti principali

### Component Library Usage
- **Forms**: TextField, Select, Button con variant outlined
- **Navigation**: AppBar, Drawer, Menu, MenuItem
- **Feedback**: Alert, CircularProgress, Tooltip
- **Layout**: Grid, Box, Paper per struttura responsive
- **Actions**: IconButton, Fab per azioni rapide

### Responsive Design
- **Breakpoints**: xs, sm, md, lg per layout adattivo
- **Grid system**: Material-UI Grid per layout responsive
- **Typography**: Responsive font scaling
- **Spacing**: Theme spacing units per consistency

---

## CONCLUSIONI

L'architettura dei componenti di CasparCG Control Web dimostra:

1. **Modularità**: Componenti specializzati e riutilizzabili
2. **Scalabilità**: Pattern consistenti per aggiunta nuove funzionalità
3. **Manutenibilità**: Separazione chiara delle responsabilità
4. **User Experience**: Feedback visivo e stati di loading consistenti
5. **Real-time**: Integrazione Socket.IO per aggiornamenti live
6. **Professional UI**: Material-UI per interfaccia broadcast-ready

La struttura supporta efficacemente le esigenze di una applicazione broadcast professionale con gestione multi-server, preview live, e controllo real-time di CasparCG Server.