# CONTEXT E STATE MANAGEMENT - CasparCG Control Web

## INTRODUZIONE ARCHITETTURALE

CasparCG Control Web implementa un sofisticato sistema di gestione dello stato basato su React Context API, progettato per gestire comunicazione real-time, broadcasting automation e sincronizzazione multi-utente. L'architettura è costruita su 5 Context provider principali che gestiscono diversi domini dell'applicazione.

## HIERARCHY E COMPOSIZIONE CONTEXT

### Provider Tree Structure
```
App
├── AuthProvider (Autenticazione Supabase)
├── CasparProvider (Core CasparCG Communication)
├── CasparProfileProvider (Configurazione Server)
├── RundownProvider (Broadcasting Automation)
└── CalendarProvider (Schedulazione Programmazione)
```

## 1. CASPARCG CONTEXT (Core Integration)

### Responsabilità
- **Comunicazione TCP/UDP**: Gestione connessioni AMCP (port 5250) e OSC (port 6250)
- **Socket.IO Integration**: Bridge real-time tra frontend e backend Node.js
- **Command Pipeline**: Sistema prioritario per comandi CasparCG (PLAY, STOP, CG, MIXER)
- **OSC Data Management**: Monitoraggio real-time timecode, frame count, media status
- **Preview Session Management**: Sistema sessioni temporanee per preview media

### State Shape
```typescript
interface CasparContextState {
  // Connection State
  connected: boolean;
  host: string;
  port: number;
  socket: Socket.IO.Client;
  loading: boolean;
  error: string | null;

  // Media & Templates
  mediaList: string[];
  templateList: string[];

  // OSC Real-time Data
  oscConnected: boolean;
  oscData: { [channelLayer: string]: OSCChannelData };
  timecodes: { [channelLayer: string]: string };
  mediaLengths: { [channelLayer: string]: MediaLength };

  // Profile Management
  activeProfileId: string | null;
  previewSessionId: string | null;

  // Logging System
  logs: LogEntry[];
}

interface OSCChannelData {
  frame: number;
  fps: number;
  path: string;
  length: number;
  duration: string;
  paused: boolean;
  loop: boolean;
}
```

### Actions/Methods Esposti
```javascript
// Connection Management
connectToCaspar(host, port, profileId?, serverRole?)
disconnectFromCaspar()
requestPreviewSession()

// Media Control (High Priority)
play(channel, layer, clip, options)
pause(channel, layer)
resume(channel, layer)
stop(channel, layer)
loadbg(channel, layer, clip, options)
clear(channel, layer)

// Graphics Control
cgAdd(channel, layer, cgLayer, template, playOnLoad, data)
cgPlay(channel, layer, cgLayer)
cgStop(channel, layer, cgLayer)
cgRemove(channel, layer, cgLayer)
cgUpdate(channel, layer, cgLayer, data)
cgInvoke(channel, layer, cgLayer, method)

// Mixer Control
mixer(channel, layer, property, value, duration, tween)

// Utility Functions
getTimecode(channel, layer)
getOscData(channel, layer)
getMediaDuration(channel, layer)
getMediaLength(channel, layer)
fetchManifest(templateName)
```

### Socket.IO Integration Pattern
```javascript
useEffect(() => {
  const socket = io(configuredServerUrl, {
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    timeout: 20000,
    transports: ['websocket']
  });

  // Real-time Event Handlers
  socket.on('caspar:connected', handleCasparConnected);
  socket.on('osc:timecode', handleTimecodeUpdate);
  socket.on('osc:frame', handleFrameUpdate);
  socket.on('osc:length', handleMediaLengthUpdate);
  
  return () => socket.disconnect();
}, []);
```

### OSC Data Processing (Critical Fix)
```javascript
// PROBLEMA 1 FIX: Estrazione valore primitivo OSC
socket.on('osc:frame', (data) => {
  const frameValue = typeof data.frame === 'number' 
    ? data.frame 
    : (data.frame || 0);
    
  setOscData(prev => ({
    ...prev,
    [`${data.channel}-${data.layer}`]: {
      ...prev[`${data.channel}-${data.layer}`],
      frame: frameValue // Solo valore numerico
    }
  }));
});
```

## 2. RUNDOWN CONTEXT (Broadcasting Automation)

### Responsabilità
- **Auto-Loop System**: Sistema completamente riscritto con OSC-based media end detection
- **Sequential Playback**: Automazione playlist con timing frame-accurate
- **Dynamic Timing Updates**: Aggiornamento real-time START TIME e DURATION columns
- **Multi-item Management**: Gestione MEDIA, TEMPLATE, STORY items
- **Supabase Sync**: Sincronizzazione real-time rundown collaborativi

### State Shape
```typescript
interface RundownContextState {
  // Core Rundown Data
  items: RundownItem[];
  currentItem: RundownItem | null;
  rundownName: string;
  modified: boolean;
  activeRundownId: string | null;

  // Auto-Play System
  autoPlay: boolean;
  currentPlayingIndex: number;
  loopEnabled: boolean;
  rundownIsLooping: boolean;
  playingItems: string[];
  nextItemPrepared: string | null;

  // Sync & Migration
  useSupabaseSync: boolean;
  migrationCompleted: boolean;

  // Scheduling
  scheduledPlayback: boolean;
  dayStartTime: string;
  currentTime: Date;
  timeIndicatorPosition: number;
}

interface RundownItem {
  id: string;
  name: string;
  type: 'MEDIA' | 'TEMPLATE' | 'STORY';
  data: MediaData | TemplateData | StoryData;
  isPlaying: boolean;
  playingStartTime: Date | null;
  duration?: string;
  startTime?: string;
}
```

### Auto-Loop System (Complete Rewrite)
```javascript
// CORREZIONE STALE CLOSURE: Flag di controllo con useRef
const loopControlRef = useRef({ 
  running: false, 
  shouldLoop: false, 
  currentIndex: 0,
  timerId: null 
});

const playAll = useCallback((enableLoop = false) => {
  // Stop eventuali loop precedenti
  if (loopControlRef.current.timerId) {
    clearTimeout(loopControlRef.current.timerId);
  }
  
  loopControlRef.current = {
    running: true,
    shouldLoop: enableLoop,
    currentIndex: 0,
    timerId: null
  };

  const executeSequence = () => {
    const playNext = () => {
      if (!loopControlRef.current.running) return;
      
      const currentIndex = loopControlRef.current.currentIndex;
      
      // Gestione fine playlist con loop
      if (currentIndex >= items.length) {
        if (loopControlRef.current.shouldLoop) {
          loopControlRef.current.currentIndex = 0;
          setRundownIsLooping(true);
          setTimeout(() => {
            setRundownIsLooping(false);
            playNext();
          }, 1500);
          return;
        }
        // Fine senza loop
        loopControlRef.current.running = false;
        setAutoPlay(false);
        return;
      }

      const currentItem = items[currentIndex];
      playItem(currentItem).then(() => {
        // OSC-Based Media End Detection
        startOSCMonitoring(currentItem);
      });
    };
    playNext();
  };
  
  executeSequence();
}, [items, playItem]);
```

### OSC-Based Media End Detection
```javascript
const startOSCMonitoring = (currentItem) => {
  const channelLayer = `${currentItem.data?.channel}-${currentItem.data?.layer}`;
  
  const monitorOSC = () => {
    if (!loopControlRef.current.running) return;
    
    const oscChannelData = oscData[channelLayer];
    if (!oscChannelData) {
      // Fallback a timer fisso se OSC non disponibile
      setTimeout(() => {
        loopControlRef.current.currentIndex++;
        playNext();
      }, durationMs);
      return;
    }

    // FRAME-BASED DETECTION
    const currentFrame = oscChannelData.frame;
    const totalFrames = oscChannelData.length;
    
    if (currentFrame && totalFrames) {
      const frameProgress = currentFrame / totalFrames;
      const isNearEnd = frameProgress >= 0.98; // 98% completato
      
      if (isNearEnd || currentFrame >= totalFrames - 2) {
        // Media finito - aggiorna durata effettiva
        const actualDuration = calculateActualDuration(currentItem);
        updateItemDuration(currentItem.id, actualDuration);
        
        loopControlRef.current.currentIndex++;
        playNext();
        return;
      }
    }
    
    // Continua monitoraggio
    setTimeout(monitorOSC, 1000);
  };
  
  monitorOSC();
};
```

### Dynamic Timing Updates
```javascript
// AGGIORNAMENTO DINAMICO: START TIME durante playback
const updateItemPlayingStatus = useCallback((itemId, isPlayingStatus) => {
  const now = new Date();
  const currentTimeString = now.toTimeString().substring(0, 8);
  
  setItems(prevItems =>
    prevItems.map(item =>
      item.id === itemId
        ? { 
            ...item, 
            isPlaying: isPlayingStatus, 
            playingStartTime: isPlayingStatus ? now : null,
            data: isPlayingStatus ? {
              ...item.data,
              startTime: currentTimeString, // Update START TIME
              lastPlayTime: now.toISOString()
            } : item.data
          }
        : item
    )
  );
}, []);
```

## 3. AUTH CONTEXT (Supabase Authentication)

### Responsabilità
- **User Session Management**: Gestione sessioni utente con Supabase Auth
- **Authentication Flow**: Login, registrazione, logout
- **Session Persistence**: Mantenimento sessione tra refresh
- **Auth State Sync**: Sincronizzazione stato autenticazione

### State Shape
```typescript
interface AuthContextState {
  user: User | null;
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
}
```

### Implementation Pattern
```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session recovery on app start
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
      setLoading(false);
    };
    
    getSession();
    
    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );
    
    return () => authListener.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    });
    return { success: !error, data, error: error?.message };
  };
};
```

## 4. CASPAR PROFILE CONTEXT (Server Configuration)

### Responsabilità
- **Multi-Server Management**: Gestione configurazioni server multipli
- **Profile Selection**: Selezione profilo attivo per broadcast
- **Server Role Assignment**: Assegnazione ruoli (MAIN_PLAYOUT, PREVIEW_POOL)
- **Preview Session Allocation**: Allocazione automatica canali preview

### State Shape
```typescript
interface CasparProfileContextState {
  profiles: Profile[];
  activeProfileId: string | null;
  activeProfile: Profile | null;
  profileServers: ProfileServerAssignment[];
  loading: boolean;
  error: string | null;
}

interface ProfileServerAssignment {
  id: string;
  server_role_in_profile: 'MAIN_PLAYOUT' | 'PREVIEW_POOL';
  config_details: ServerConfig;
  server: {
    id: string;
    name: string;
    host: string;
    port: number;
    purpose: string;
    is_enabled: boolean;
  };
}
```

### Auto-Profile Selection Logic
```javascript
const fetchUserPreference = async () => {
  const { data } = await supabase
    .from('user_profile_preferences')
    .select('default_casparcg_profile_id')
    .eq('user_id', currentUserId)
    .maybeSingle();

  if (data?.default_casparcg_profile_id) {
    setActiveProfileId(data.default_casparcg_profile_id);
  } else {
    // Fallback a profilo default
    const { data: defaultProfile } = await supabase
      .from('casparcg_profiles')
      .select('id')
      .eq('is_default_profile', true)
      .maybeSingle();
      
    if (defaultProfile) {
      setActiveProfileId(defaultProfile.id);
    } else {
      // Fallback a primo profilo disponibile
      const { data: firstProfile } = await supabase
        .from('casparcg_profiles')
        .select('id')
        .order('created_at')
        .limit(1)
        .maybeSingle();
        
      if (firstProfile) {
        setActiveProfileId(firstProfile.id);
      }
    }
  }
};
```

## 5. CALENDAR CONTEXT (Schedulazione)

### Responsabilità
- **Weekly Schedule Management**: Gestione schedulazione settimanale
- **Rundown Scheduling**: Pianificazione rundown con orari precisi
- **Playlist Generation**: Generazione playlist giornaliere
- **Time Calculation**: Calcolo automatico orari fine basato su durata

### State Shape
```typescript
interface CalendarContextState {
  calendarData: { [isoDate: string]: ScheduledRundown[] };
  playlistData: PlaylistItem[];
  modified: boolean;
}

interface ScheduledRundown {
  id: string;
  name: string;
  startTime: string; // HH:MM:SS
  duration: string;  // HH:MM:SS
  endTime: string;   // Calculated
  day: string;       // ISO date
  scheduled: boolean;
}
```

### Time Calculation Logic
```javascript
const calculateEndTime = (startTime, duration) => {
  const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number);
  const [durationHours, durationMinutes, durationSeconds] = duration.split(':').map(Number);
  
  const startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;
  const durationTotalSeconds = durationHours * 3600 + durationMinutes * 60 + durationSeconds;
  const endTotalSeconds = startTotalSeconds + durationTotalSeconds;
  
  const endHours = Math.floor(endTotalSeconds / 3600);
  const endMinutes = Math.floor((endTotalSeconds % 3600) / 60);
  const endSeconds = endTotalSeconds % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
};
```

## PATTERN DI COMUNICAZIONE REAL-TIME

### Socket.IO Event Flow
```
Frontend Context → Socket.IO Client → Backend Server → CasparCG Server
     ↓                                      ↓              ↓
Real-time UI ← Socket.IO Events ← OSC/AMCP Responses ← Media Status
```

### Error Handling Centralizzato
```javascript
// Pattern comune per error handling nei Context
const handleAsyncOperation = async (operation, errorMessage) => {
  try {
    setLoading(true);
    setError(null);
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error(errorMessage, error);
    setError(error.message);
    if (typeof addLog === 'function') {
      addLog(`${errorMessage}: ${error.message}`, 'error');
    }
    return { success: false, error: error.message };
  } finally {
    setLoading(false);
  }
};
```

### Performance Optimizations

#### Debouncing per Query Ripetute
```javascript
// CasparProfileContext - Evita fetch ripetuti
const fetchingRef = useRef(false);
const lastFetchTimeRef = useRef(0);

useEffect(() => {
  if (currentUserId && !fetchingRef.current) {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (timeSinceLastFetch > 1000) { // Debouncing 1s
      fetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      Promise.all([fetchProfiles(), fetchUserPreference()])
        .finally(() => { fetchingRef.current = false; });
    }
  }
}, [currentUserId]);
```

#### Memoization per State Derivato
```javascript
// RundownContext - Stabilizza activeRundownId
const activeRundownId = useMemo(() => {
  return urlActiveRundownId || externalActiveRundownId;
}, [urlActiveRundownId, externalActiveRundownId]);
```

## INTEGRAZIONE SUPABASE REAL-TIME

### Row Level Security (RLS)
```sql
-- Esempio policy per rundown collaborativi
CREATE POLICY "Users can access their rundowns"
ON rundown_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM rundowns 
    WHERE rundowns.id = rundown_items.rundown_id 
    AND rundowns.created_by = auth.uid()
  )
);
```

### Real-time Subscriptions
```javascript
// Pattern per sottoscrizioni real-time
useEffect(() => {
  if (!activeRundownId) return;
  
  const subscription = supabase
    .channel(`rundown:${activeRundownId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'rundown_items',
      filter: `rundown_id=eq.${activeRundownId}`
    }, handleRealTimeUpdate)
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [activeRundownId]);
```

## TESTING E DEBUGGING

### Context Testing Pattern
```javascript
// Test helper per Context providers
const renderWithProviders = (ui, { initialState = {} } = {}) => {
  const Wrapper = ({ children }) => (
    <AuthProvider>
      <CasparProvider>
        <RundownProvider>
          {children}
        </RundownProvider>
      </CasparProvider>
    </AuthProvider>
  );
  
  return render(ui, { wrapper: Wrapper });
};
```

### Debug Logging System
```javascript
// Sistema di logging centralizzato
const addLog = useCallback((message, level = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  setLogs(prevLogs => [
    { timestamp, message: `[${level.toUpperCase()}] ${message}` }, 
    ...prevLogs.slice(0, 199)
  ]);
}, []);
```

## CONCLUSIONI ARCHITETTURALI

L'architettura Context-based di CasparCG Control Web offre:

1. **Separazione delle Responsabilità**: Ogni Context gestisce un dominio specifico
2. **Real-time Performance**: Socket.IO e OSC integration per aggiornamenti <100ms
3. **Collaborative Features**: Supabase real-time per editing multi-utente
4. **Fault Tolerance**: Error boundaries e fallback mechanisms
5. **Scalability**: Pattern modulari per estensioni future

La recente riscrittura del sistema auto-loop con OSC-based media end detection rappresenta un significativo miglioramento in termini di accuratezza timing e riduzione di stale closure bugs, fornendo una base solida per broadcasting automation professionale.