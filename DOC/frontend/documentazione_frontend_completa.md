# DOCUMENTAZIONE FRONTEND COMPLETA
## CasparCG Control Web - Architettura React

---

## INDICE

1. [**PANORAMICA ARCHITETTURALE**](#1-panoramica-architetturale)
2. [**STRUTTURA PROGETTO**](#2-struttura-progetto)
3. [**SISTEMA DI ROUTING**](#3-sistema-di-routing)
4. [**GESTIONE STATO GLOBALE**](#4-gestione-stato-globale)
5. [**COMPONENTI PRINCIPALI**](#5-componenti-principali)
6. [**UTILITY FUNCTIONS**](#6-utility-functions)
7. [**CUSTOM HOOKS**](#7-custom-hooks)
8. [**THEMING E STYLING**](#8-theming-e-styling)
9. [**CONFIGURAZIONE E BUILD**](#9-configurazione-e-build)
10. [**PERFORMANCE E OTTIMIZZAZIONI**](#10-performance-e-ottimizzazioni)
11. [**INTEGRAZIONE BACKEND**](#11-integrazione-backend)
12. [**BEST PRACTICES**](#12-best-practices)

---

## 1. PANORAMICA ARCHITETTURALE

### Stack Tecnologico Frontend

```javascript
// Package principali utilizzati
const frontendStack = {
  core: {
    "react": "^18.2.0",              // Framework UI principale
    "react-dom": "^18.2.0",          // Rendering DOM
    "react-router-dom": "^6.10.0"    // Routing SPA
  },
  ui: {
    "@mui/material": "^5.12.1",      // Material-UI components
    "@mui/icons-material": "^5.11.16", // Icone Material Design
    "@emotion/react": "^11.10.6",    // CSS-in-JS styling
    "@emotion/styled": "^11.10.6"    // Styled components
  },
  interaction: {
    "react-beautiful-dnd": "^13.1.1", // Drag & drop
    "react-draggable": "^4.4.6",     // Elementi draggabili
    "react-resizable": "^3.0.5",     // Elementi ridimensionabili
    "react-big-calendar": "^1.18.0"  // Calendario eventi
  },
  media: {
    "react-player": "^2.12.0",       // Player video/audio
    "hls.js": "^1.6.2"               // Streaming HLS
  },
  backend: {
    "socket.io-client": "^4.6.1",    // WebSocket client
    "@supabase/supabase-js": "^2.49.5", // Database e auth
    "axios": "^1.3.6"                // HTTP client
  },
  utilities: {
    "lodash": "^4.17.21",            // Utility functions
    "date-fns": "^4.1.0",           // Manipolazione date
    "uuid": "^9.0.0"                // Generazione UUID
  }
};
```

### Pattern Architetturali

```javascript
// Pattern principali utilizzati
const architecturalPatterns = {
  stateManagement: 'React Context + useReducer',
  componentPattern: 'Functional Components + Hooks',
  styling: 'Material-UI + Emotion CSS-in-JS',
  routing: 'React Router v6 con nested routes',
  dataFetching: 'Context providers + async/await',
  realTime: 'Socket.IO + WebSocket events',
  authentication: 'Supabase Auth + Protected Routes',
  forms: 'Controlled components + validation',
  errorHandling: 'Error boundaries + try/catch',
  testing: 'React Testing Library + Jest'
};
```

---

## 2. STRUTTURA PROGETTO

### Architettura Cartelle

```
client/
├── public/                          # File statici pubblici
│   ├── index.html                   # Template HTML principale  
│   ├── manifest.json                # PWA manifest
│   ├── favicon.ico                  # Icona applicazione
│   └── logos/                       # Loghi e icone brand
├── src/
│   ├── index.js                     # Entry point applicazione
│   ├── App.js                       # Componente root con routing
│   ├── theme.js                     # Tema Material-UI base
│   ├── supabaseClient.js            # Client configurazione Supabase
│   ├── index.css                    # Stili globali CSS
│   │
│   ├── components/                  # Componenti riutilizzabili
│   │   ├── auth/                    # Autenticazione e protezione
│   │   │   ├── ProtectedRoute.js    # Route protette da auth
│   │   │   └── LoginDialog.js       # Dialog login/registrazione
│   │   ├── broadcast/               # Componenti broadcast specifici
│   │   │   ├── RundownItem.js       # Elementi rundown broadcast
│   │   │   ├── MediaPreview.js      # Preview file media
│   │   │   ├── TemplateEditor.js    # Editor template CasparCG
│   │   │   ├── TimecodeDisplay.js   # Display timecode broadcast
│   │   │   └── StatusIndicator.js   # Indicatori stato sistema
│   │   ├── calendar/                # Componenti calendario
│   │   │   ├── CalendarView.js      # Vista calendario principale
│   │   │   ├── EventDialog.js       # Dialog eventi calendario
│   │   │   └── EventCard.js         # Card singolo evento
│   │   ├── dialogs/                 # Dialog modali riutilizzabili
│   │   │   ├── ConnectionDialog.js  # Dialog connessione CasparCG
│   │   │   ├── ConfirmDialog.js     # Dialog conferma generica
│   │   │   ├── ErrorDialog.js       # Dialog errori sistema
│   │   │   └── TemplateDialog.js    # Dialog modifica template
│   │   ├── layout/                  # Layout e struttura UI
│   │   │   ├── Header.js            # Header applicazione
│   │   │   ├── Sidebar.js           # Sidebar navigazione
│   │   │   ├── MainContent.js       # Container contenuto principale  
│   │   │   └── Footer.js            # Footer applicazione
│   │   └── shared/                  # Componenti condivisi generici
│   │       ├── LoadingSpinner.js    # Spinner caricamento
│   │       ├── ErrorBoundary.js     # Boundary gestione errori
│   │       ├── StatusBadge.js       # Badge stato colorati
│   │       ├── ActionButton.js      # Pulsanti azione broadcast
│   │       └── DataTable.js         # Tabella dati generica
│   │
│   ├── contexts/                    # Context providers stato globale
│   │   ├── AuthContext.js           # Autenticazione utenti
│   │   ├── CasparContext.js         # Connessione e controllo CasparCG
│   │   ├── RundownContext.js        # Gestione rundown broadcast
│   │   ├── CasparProfileContext.js  # Profili server CasparCG
│   │   └── CalendarContext.js       # Eventi calendario
│   │
│   ├── hooks/                       # Custom hooks riutilizzabili
│   │   └── usePlaybackSync.js       # Sincronizzazione playback
│   │
│   ├── pages/                       # Pagine principali applicazione
│   │   ├── Dashboard.js             # Dashboard principale
│   │   ├── MediaBrowser.js          # Browser file media
│   │   ├── PlayoutControl.js        # Controllo playout broadcast
│   │   ├── GraphicsEditor.js        # Editor grafica broadcast
│   │   ├── MixerControl.js          # Controllo mixer audio
│   │   ├── Rundown/                 # Sistema rundown broadcast
│   │   │   ├── index.js             # Pagina principale rundown
│   │   │   └── components/          # Componenti specifici rundown
│   │   │       ├── RundownList.js   # Lista elementi rundown
│   │   │       ├── RundownItem.js   # Singolo elemento rundown
│   │   │       ├── ItemEditor.js    # Editor elementi rundown
│   │   │       ├── AutoLoop.js      # Sistema auto-loop
│   │   │       └── RundownHeader.js # Header rundown con controlli
│   │   ├── ScaletteEditor/          # Editor scalette programmi
│   │   │   ├── index.js             # Pagina principale editor
│   │   │   └── components/          # Componenti specifici scalette
│   │   │       ├── Timeline.js      # Timeline scaletta
│   │   │       ├── ItemPanel.js     # Pannello elementi
│   │   │       ├── PreviewPanel.js  # Pannello preview
│   │   │       └── MediaLibrary.js  # Libreria media scalette
│   │   ├── ScaletteSelector.js      # Selettore scalette
│   │   ├── Settings.js              # Impostazioni applicazione
│   │   ├── CasparProfilesAdmin.js   # Amministrazione profili CasparCG
│   │   └── Auth.js                  # Pagina autenticazione login
│   │
│   ├── styles/                      # Styling e temi
│   │   └── broadcastTheme.js        # Tema professionale broadcast
│   │
│   └── utils/                       # Utility functions
│       ├── permissionsChecker.js    # Verifica permessi utenti
│       ├── rundownMigration.js      # Migrazione dati rundown
│       ├── rundownPermissionsDebugger.js # Debug permessi rundown
│       ├── rundownSyncMonitor.js    # Monitoraggio sincronizzazione
│       ├── testOscDataFix.js        # Test dati OSC
│       └── testSupabaseSync.js      # Test sincronizzazione Supabase
│
└── package.json                     # Dipendenze e scripts npm
```

---

## 3. SISTEMA DI ROUTING

### Configurazione React Router v6

```javascript
// App.js - Routing principale con autenticazione
function App() {
  return (
    <AuthProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <CssBaseline />
        <Routes>
          {/* Rotta pubblica per l'autenticazione */}
          <Route path="/auth" element={<Auth />} />

          {/* Rotte protette che richiedono autenticazione */}
          <Route path="/*" element={
            <ProtectedRoute>
              <CasparProfileProvider>
                <Header {...headerProps} />
                <Sidebar open={sidebarOpen} />
                
                <Box component="main" sx={mainStyles}>
                  <RundownProvider>
                    <CalendarProvider>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/media" element={<MediaBrowser />} />
                        <Route path="/playout" element={<PlayoutControl />} />
                        <Route path="/graphics" element={<GraphicsEditor />} />
                        <Route path="/mixer" element={<MixerControl />} />
                        <Route path="/rundown" element={<Rundown />} />
                        <Route path="/scalette" element={<ScaletteSelector />} />
                        <Route path="/scalette/:id" element={<ScaletteEditor />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/caspar-profiles-admin" element={<CasparProfilesAdmin />} />
                      </Routes>
                    </CalendarProvider>
                  </RundownProvider>
                </Box>
              </CasparProfileProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </Box>
    </AuthProvider>
  );
}
```

### Componente ProtectedRoute

```javascript
// components/auth/ProtectedRoute.js - Protezione route con autenticazione
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};
```

### Pattern di Navigazione

```javascript
// Pattern di navigazione utilizzati nell'applicazione
const navigationPatterns = {
  // Navigazione programmatica
  programmaticNavigation: {
    hook: 'useNavigate()',
    example: 'navigate("/rundown", { replace: true })'
  },
  
  // Link dichiarativi
  declarativeLinks: {
    component: 'Link / NavLink',
    example: '<NavLink to="/media" className="nav-link" />'
  },
  
  // Parametri URL
  urlParams: {
    definition: '/scalette/:id',
    extraction: 'const { id } = useParams()'
  },
  
  // Query parameters
  queryParams: {
    reading: 'const [searchParams] = useSearchParams()',
    writing: 'setSearchParams({ filter: "video" })'
  }
};
```

---

## 4. GESTIONE STATO GLOBALE

### React Context Pattern

L'applicazione utilizza il pattern React Context per la gestione dello stato globale, organizzato in contesti specializzati:

#### AuthContext - Autenticazione

```javascript
// contexts/AuthContext.js - Gestione autenticazione utenti
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Inizializzazione sessione utente
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Errore inizializzazione utente:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    initializeUser();
    
    // Listener per cambiamenti stato auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password
      });
      if (error) throw error;
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  
  const value = {
    user,
    loading,
    error,
    signIn,
    signOut
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
};
```

#### CasparContext - Controllo CasparCG

```javascript
// contexts/CasparContext.js - Connessione e controllo CasparCG
const CasparContext = createContext();

export const CasparProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [oscData, setOscData] = useState({});
  
  // Connessione WebSocket al server
  useEffect(() => {
    const initializeSocket = () => {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('✅ Connesso al server CasparCG');
        setConnected(true);
        setStatus('connected');
        setError(null);
      });
      
      newSocket.on('disconnect', () => {
        console.log('❌ Disconnesso dal server CasparCG');
        setConnected(false);
        setStatus('disconnected');
      });
      
      newSocket.on('caspar_status', (data) => {
        setStatus(data.status);
        if (data.error) {
          setError(data.error);
        }
      });
      
      newSocket.on('osc_data', (data) => {
        setOscData(prevData => ({
          ...prevData,
          ...data
        }));
      });
      
      newSocket.on('error', (error) => {
        console.error('❌ Errore socket:', error);
        setError(error.message);
      });
      
      setSocket(newSocket);
      
      return newSocket;
    };
    
    const socketInstance = initializeSocket();
    
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  // Invio comandi CasparCG
  const sendCommand = useCallback((command) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Non connesso al server CasparCG'));
        return;
      }
      
      console.log('📤 Invio comando CasparCG:', command);
      
      socket.emit('caspar_command', { command }, (response) => {
        if (response.success) {
          console.log('✅ Comando eseguito:', response);
          resolve(response);
        } else {
          console.error('❌ Errore comando:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, [socket, connected]);
  
  // Comandi specifici broadcast
  const playMedia = useCallback(async (channel, layer, clip) => {
    const command = `PLAY ${channel}-${layer} "${clip}"`;
    return await sendCommand(command);
  }, [sendCommand]);
  
  const stopLayer = useCallback(async (channel, layer) => {
    const command = `STOP ${channel}-${layer}`;
    return await sendCommand(command);
  }, [sendCommand]);
  
  const loadTemplate = useCallback(async (channel, layer, template, data = {}) => {
    const jsonData = JSON.stringify(data).replace(/"/g, '\\"');
    const command = `CG ${channel}-${layer} ADD 1 "${template}" 1 "${jsonData}"`;
    return await sendCommand(command);
  }, [sendCommand]);
  
  const value = {
    connected,
    status,
    error,
    oscData,
    sendCommand,
    playMedia,
    stopLayer,
    loadTemplate
  };
  
  return <CasparContext.Provider value={value}>{children}</CasparContext.Provider>;
};
```

#### RundownContext - Gestione Rundown

```javascript
// contexts/RundownContext.js - Sistema rundown broadcast con auto-loop
const RundownContext = createContext();

export const RundownProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [activeRundownId, setActiveRundownId] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [nextItem, setNextItem] = useState(null);
  const [isAutoLoopEnabled, setIsAutoLoopEnabled] = useState(false);
  const [useSupabaseSync, setUseSupabaseSync] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { sendCommand, oscData } = useCaspar();
  const { user } = useAuth();
  
  // Riferimenti per evitare stale closures nel loop system
  const itemsRef = useRef([]);
  const currentlyPlayingRef = useRef(null);
  const autoLoopEnabledRef = useRef(false);
  const loopTimeoutRef = useRef(null);
  
  // Aggiorna refs quando cambiano gli stati
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  
  useEffect(() => {
    currentlyPlayingRef.current = currentlyPlaying;
  }, [currentlyPlaying]);
  
  useEffect(() => {
    autoLoopEnabledRef.current = isAutoLoopEnabled;
  }, [isAutoLoopEnabled]);
  
  // Sistema auto-loop con OSC detection
  useEffect(() => {
    if (!isAutoLoopEnabled || !currentlyPlaying) return;
    
    const checkMediaEnd = () => {
      const currentItem = itemsRef.current.find(item => 
        item.id === currentlyPlayingRef.current
      );
      
      if (!currentItem) return;
      
      const channelData = oscData[`channel_${currentItem.data?.casparcgConfig?.channel || 1}`];
      
      if (channelData && channelData.foreground) {
        const { frame_total, frame_current } = channelData.foreground;
        
        // Rileva fine media (frame correnti >= frame totali - 2)
        if (frame_total > 0 && frame_current >= (frame_total - 2)) {
          console.log('🔄 [AUTO-LOOP] Fine media rilevata, avvio elemento successivo');
          playNextItem();
        }
      }
    };
    
    // Controlla ogni 100ms per responsività
    const interval = setInterval(checkMediaEnd, 100);
    
    return () => clearInterval(interval);
  }, [isAutoLoopEnabled, currentlyPlaying, oscData]);
  
  // Caricamento dati rundown da Supabase
  const loadRundownData = useCallback(async (rundownId) => {
    if (!rundownId || !useSupabaseSync) return;
    
    setLoading(true);
    try {
      const { data: rundownItems, error } = await supabase
        .from('rundown_items')
        .select('*')
        .eq('rundown_id', rundownId)
        .order('item_order');
      
      if (error) throw error;
      
      const convertedItems = rundownItems.map(convertSupabaseItemToLocal);
      setItems(convertedItems);
      
      console.log(`✅ Caricati ${convertedItems.length} elementi rundown`);
    } catch (error) {
      console.error('❌ Errore caricamento rundown:', error);
    } finally {
      setLoading(false);
    }
  }, [useSupabaseSync]);
  
  // Riproduzione elemento corrente
  const playItem = useCallback(async (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    try {
      setCurrentlyPlaying(itemId);
      
      // Aggiorna timestamp inizio riproduzione
      const updatedItem = {
        ...item,
        playingStartTime: Date.now(),
        isPlaying: true
      };
      
      setItems(prevItems => 
        prevItems.map(i => 
          i.id === itemId ? updatedItem : { ...i, isPlaying: false }
        )
      );
      
      // Comandi CasparCG basati sul tipo elemento
      if (item.type === 'MEDIA') {
        await sendCommand(`PLAY ${item.data.casparcgConfig.channel}-${item.data.casparcgConfig.layer} "${item.data.location}"`);
      } else if (item.type === 'TEMPLATE') {
        const templateData = JSON.stringify(item.data.data || {}).replace(/"/g, '\\"');
        await sendCommand(`CG ${item.data.casparcgConfig.channel}-${item.data.casparcgConfig.layer} ADD 1 "${item.data.location}" 1 "${templateData}"`);
        if (item.data.playOnLoad) {
          await sendCommand(`CG ${item.data.casparcgConfig.channel}-${item.data.casparcgConfig.layer} PLAY 1`);
        }
      }
      
      console.log(`▶️ Riproduzione avviata: ${item.name}`);
    } catch (error) {
      console.error('❌ Errore riproduzione elemento:', error);
      setCurrentlyPlaying(null);
    }
  }, [items, sendCommand]);
  
  // Riproduzione elemento successivo (auto-loop)
  const playNextItem = useCallback(() => {
    const currentIndex = itemsRef.current.findIndex(item => 
      item.id === currentlyPlayingRef.current
    );
    
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % itemsRef.current.length;
    const nextItem = itemsRef.current[nextIndex];
    
    if (nextItem) {
      console.log(`⏭️ [AUTO-LOOP] Avvio elemento successivo: ${nextItem.name}`);
      playItem(nextItem.id);
    }
  }, [playItem]);
  
  // Aggiunta nuovi elementi al rundown
  const addMedia = useCallback(async (mediaData) => {
    if (!activeRundownId || !user) return;
    
    const newItem = {
      rundown_id: activeRundownId,
      item_order: items.length,
      type: 'MEDIA',
      name: mediaData.customName || mediaData.name,
      data: {
        ...mediaData,
        casparcgConfig: {
          channel: mediaData.channel || 1,
          layer: mediaData.layer || 10
        }
      },
      updated_by: user.id
    };
    
    if (useSupabaseSync) {
      const { data, error } = await supabase
        .from('rundown_items')
        .insert([newItem])
        .select()
        .single();
      
      if (error) throw error;
      
      const convertedItem = convertSupabaseItemToLocal(data);
      setItems(prev => [...prev, convertedItem]);
    } else {
      const localItem = { ...newItem, id: generateUUID() };
      setItems(prev => [...prev, localItem]);
    }
  }, [activeRundownId, items.length, user, useSupabaseSync]);
  
  // Rimozione elementi dal rundown
  const removeItem = useCallback(async (itemId) => {
    if (useSupabaseSync) {
      const { error } = await supabase
        .from('rundown_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    }
    
    setItems(prev => prev.filter(item => item.id !== itemId));
    
    // Stop se elemento correntemente in riproduzione
    if (currentlyPlaying === itemId) {
      setCurrentlyPlaying(null);
    }
  }, [useSupabaseSync, currentlyPlaying]);
  
  const value = {
    items,
    activeRundownId,
    setActiveRundownId,
    currentlyPlaying,
    nextItem,
    isAutoLoopEnabled,
    setIsAutoLoopEnabled,
    useSupabaseSync,
    setUseSupabaseSync,
    loading,
    
    // Actions
    loadRundownData,
    playItem,
    playNextItem,
    addMedia,
    addTemplate: async (templateData) => { /* Implementazione simile ad addMedia */ },
    addStory: async (storyData) => { /* Implementazione simile ad addMedia */ },
    removeItem,
    
    // Utilities
    clearRundown: () => setItems([]),
    getItemById: (id) => items.find(item => item.id === id)
  };
  
  return <RundownContext.Provider value={value}>{children}</RundownContext.Provider>;
};
```

---

## 5. COMPONENTI PRINCIPALI

### Sistema Layout

#### Header Component

```javascript
// components/layout/Header.js - Header principale applicazione
const Header = ({ sidebarOpen, toggleSidebar, openConnectionDialog }) => {
  const { connected, status } = useCaspar();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };
  
  const handleSignOut = async () => {
    await signOut();
    handleCloseUserMenu();
  };
  
  return (
    <AppBar position="fixed" sx={{ 
      zIndex: (theme) => theme.zIndex.drawer + 1,
      backgroundColor: '#1e1e1e'
    }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          CasparCG Control Web
        </Typography>
        
        {/* Indicatore stato connessione */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <StatusIndicator 
            connected={connected} 
            status={status} 
            onClick={openConnectionDialog}
          />
        </Box>
        
        {/* Menu utente */}
        <IconButton
          size="large"
          onClick={handleUserMenu}
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseUserMenu}
        >
          <MenuItem disabled>
            <Typography variant="body2">
              {user?.email}
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
```

#### Sidebar Navigation

```javascript
// components/layout/Sidebar.js - Navigazione laterale
const Sidebar = ({ open }) => {
  const location = useLocation();
  
  const menuItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Rundown', path: '/rundown', icon: <PlaylistPlayIcon /> },
    { text: 'Scalette', path: '/scalette', icon: <EventNoteIcon /> },
    { text: 'Media Browser', path: '/media', icon: <VideoLibraryIcon /> },
    { text: 'Playout Control', path: '/playout', icon: <PlayArrowIcon /> },
    { text: 'Graphics Editor', path: '/graphics', icon: <BrushIcon /> },
    { text: 'Mixer Control', path: '/mixer', icon: <TuneIcon /> },
    { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
    { text: 'CasparCG Profiles', path: '/caspar-profiles-admin', icon: <AdminPanelSettingsIcon /> }
  ];
  
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: '#1e1e1e',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)'
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 1 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(33, 150, 243, 0.16)',
                    borderRight: '3px solid #2196f3',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.24)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};
```

### Componenti Broadcast Specifici

#### RundownItem Component

```javascript
// components/broadcast/RundownItem.js - Elemento rundown broadcast
const RundownItem = ({ item, index, isPlaying, onPlay, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { oscData } = useCaspar();
  
  // Calcolo timing real-time da dati OSC
  const getItemTiming = useMemo(() => {
    if (!isPlaying || !item.playingStartTime) return null;
    
    const channel = item.data?.casparcgConfig?.channel || 1;
    const channelData = oscData[`channel_${channel}`];
    
    if (channelData?.foreground) {
      const { frame_current, frame_total, fps } = channelData.foreground;
      const currentTime = frame_current / fps;
      const totalTime = frame_total / fps;
      const remainingTime = totalTime - currentTime;
      
      return {
        current: formatTimecode(currentTime),
        total: formatTimecode(totalTime),
        remaining: formatTimecode(remainingTime),
        progress: (currentTime / totalTime) * 100
      };
    }
    
    return null;
  }, [isPlaying, item.playingStartTime, oscData, item.data?.casparcgConfig?.channel]);
  
  const handleContextMenu = (event) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const getStatusColor = () => {
    if (isPlaying) return '#f44336'; // Rosso ON AIR
    if (item.isNext) return '#ffc107'; // Giallo NEXT
    return 'inherit';
  };
  
  const getTypeIcon = () => {
    switch (item.type) {
      case 'MEDIA': return <VideoFileIcon />;
      case 'TEMPLATE': return <BrushIcon />;
      case 'STORY': return <ArticleIcon />;
      default: return <HelpOutlineIcon />;
    }
  };
  
  return (
    <TableRow
      sx={{
        backgroundColor: isPlaying ? 'rgba(244, 67, 54, 0.1)' : 'inherit',
        borderLeft: isPlaying ? '4px solid #f44336' : 'none',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Colonna Ordine */}
      <TableCell sx={{ width: 60, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: getStatusColor() }}>
          {index + 1}
        </Typography>
      </TableCell>
      
      {/* Colonna Tipo */}
      <TableCell sx={{ width: 60, textAlign: 'center' }}>
        <Tooltip title={item.type}>
          <Box sx={{ color: getStatusColor() }}>
            {getTypeIcon()}
          </Box>
        </Tooltip>
      </TableCell>
      
      {/* Colonna Nome */}
      <TableCell>
        <Box>
          <Typography variant="subtitle2" sx={{ color: getStatusColor() }}>
            {item.name}
          </Typography>
          {item.data?.location && (
            <Typography variant="caption" color="text.secondary">
              {item.data.location}
            </Typography>
          )}
        </Box>
      </TableCell>
      
      {/* Colonna Start Time */}
      <TableCell sx={{ fontFamily: 'monospace', minWidth: 100 }}>
        <Typography variant="body2" sx={{ color: '#00ff00' }}>
          {item.data?.timing?.startTime || '00:00:00'}
        </Typography>
      </TableCell>
      
      {/* Colonna Duration con timing real-time */}
      <TableCell sx={{ fontFamily: 'monospace', minWidth: 120 }}>
        {getItemTiming ? (
          <Box>
            <Typography variant="body2" sx={{ color: '#00ff00' }}>
              {getItemTiming.current} / {getItemTiming.total}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getItemTiming.progress}
              sx={{ mt: 1, height: 4 }}
            />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: '#00ff00' }}>
            {item.data?.timing?.duration || '00:00:10'}
          </Typography>
        )}
      </TableCell>
      
      {/* Colonna Canale/Layer */}
      <TableCell sx={{ textAlign: 'center', minWidth: 80 }}>
        <Typography variant="body2">
          {item.data?.casparcgConfig?.channel || 1}-{item.data?.casparcgConfig?.layer || 10}
        </Typography>
      </TableCell>
      
      {/* Colonna Azioni */}
      <TableCell sx={{ width: 100 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Play">
            <IconButton
              size="small"
              onClick={() => onPlay(item.id)}
              disabled={isPlaying}
              sx={{ color: isPlaying ? '#f44336' : '#4caf50' }}
            >
              {isPlaying ? <StopIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
      
      {/* Menu contestuale */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => { onPlay(item.id); handleCloseMenu(); }}>
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" />
          </ListItemIcon>
          Play
        </MenuItem>
        <MenuItem onClick={() => { onEdit(item); handleCloseMenu(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Modifica
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onDelete(item.id); handleCloseMenu(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Elimina
        </MenuItem>
      </Menu>
    </TableRow>
  );
};

export default RundownItem;
```

---

## 6. UTILITY FUNCTIONS

### Sistema di Permessi

```javascript
// utils/permissionsChecker.js - Verifica permessi utenti
/**
 * Verifica se l'utente corrente è designato come operatore di playout
 */
export const isCurrentUserDesignatedPlayoutOperator = async (userId) => {
  if (!userId) return false;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('playout_assignments')
      .select('id')
      .eq('assignment_date', today)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Errore verifica permessi playout:', error.message);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Errore verifica permessi playout:', error.message);
    return false;
  }
};

/**
 * Ottiene il ruolo dell'utente per un rundown specifico
 */
export const getUserRoleForRundown = async (userId, rundownId) => {
  if (!userId || !rundownId) return null;
  
  try {
    // Verifica se è proprietario
    const { data: rundownData, error: rundownError } = await supabase
      .from('rundowns')
      .select('owner_id')
      .eq('id', rundownId)
      .single();
    
    if (rundownError) {
      console.error('Errore recupero rundown:', rundownError.message);
      return null;
    }
    
    if (rundownData.owner_id === userId) {
      return 'owner';
    }
    
    // Verifica se è collaboratore
    const { data: collaboratorData, error: collaboratorError } = await supabase
      .from('rundown_collaborators')
      .select('role')
      .eq('rundown_id', rundownId)
      .eq('user_id', userId)
      .single();
    
    if (collaboratorError) {
      if (collaboratorError.code === 'PGRST116') return null;
      console.error('Errore verifica collaboratore:', collaboratorError.message);
      return null;
    }
    
    return collaboratorData.role;
  } catch (error) {
    console.error('Errore verifica ruolo utente:', error.message);
    return null;
  }
};

/**
 * Verifica se l'utente può modificare un rundown
 */
export const canUserEditRundown = (userRole) => {
  if (!userRole) return false;
  const editableRoles = ['owner', 'editor', 'playout_operator'];
  return editableRoles.includes(userRole);
};
```

### Sistema di Migrazione

```javascript
// utils/rundownMigration.js - Migrazione dati da localStorage a Supabase
/**
 * Migra un rundown da localStorage a Supabase
 */
export const migrateRundownToSupabase = async (rundownData, userId) => {
  try {
    console.log('[RUNDOWN MIGRATION] Inizio migrazione:', rundownData.name);
    
    // Crea rundown principale
    const { data: rundownResult, error: rundownError } = await supabase
      .from('rundowns')
      .insert([{
        name: rundownData.name || 'Rundown Migrato',
        owner_id: userId
      }])
      .select('id')
      .single();
    
    if (rundownError) throw new Error(`Errore creazione rundown: ${rundownError.message}`);
    
    const rundownId = rundownResult.id;
    
    // Migra elementi
    if (rundownData.items && rundownData.items.length > 0) {
      const migratedItems = [];
      
      for (let i = 0; i < rundownData.items.length; i++) {
        const item = rundownData.items[i];
        
        try {
          const migratedItem = convertItemToSupabaseFormat(item, rundownId, i, userId);
          
          const { data: itemResult, error: itemError } = await supabase
            .from('rundown_items')
            .insert([migratedItem])
            .select('id')
            .single();
          
          if (itemError) {
            console.error(`Errore migrazione elemento ${i}:`, itemError);
            continue;
          }
          
          migratedItems.push(itemResult);
        } catch (itemError) {
          console.error(`Errore conversione elemento ${i}:`, itemError);
          continue;
        }
      }
      
      console.log(`Migrati ${migratedItems.length}/${rundownData.items.length} elementi`);
    }
    
    return {
      success: true,
      rundownId,
      message: `Rundown "${rundownData.name}" migrato con successo`
    };
    
  } catch (error) {
    console.error('[RUNDOWN MIGRATION] Errore migrazione:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Converte elemento dal formato localStorage al formato Supabase
 */
const convertItemToSupabaseFormat = (item, rundownId, order, userId) => {
  let type = item.type || 'MEDIA';
  if (!type && item.data) {
    if (item.data.template) type = 'TEMPLATE';
    else if (item.data.clip) type = 'MEDIA';
    else if (item.data.content || item.data.templatesDetails) type = 'STORY';
  }
  
  let jsonbData = {};
  
  if (type === 'MEDIA') {
    jsonbData = {
      clip: item.data?.clip || item.data?.location || '',
      channel: item.data?.channel || 1,
      layer: item.data?.layer || 10,
      customName: item.data?.customName || item.name || '',
      loop: item.data?.loop || false,
      autoNext: item.data?.autoNext || false,
      startTime: item.data?.startTime || '00:00:00',
      duration: item.data?.duration || '00:05:00',
      location: item.data?.location || item.data?.clip || ''
    };
  } else if (type === 'TEMPLATE') {
    jsonbData = {
      template: item.data?.template || item.data?.location || '',
      channel: item.data?.channel || 1,
      layer: item.data?.layer || 20,
      cgLayer: item.data?.cgLayer || 1,
      playOnLoad: item.data?.playOnLoad !== undefined ? item.data.playOnLoad : true,
      data: item.data?.data || {},
      customName: item.data?.customName || item.name || ''
    };
  }
  
  return {
    rundown_id: rundownId,
    item_order: order,
    type: type,
    name: item.name || item.data?.customName || `Elemento ${order + 1}`,
    data: jsonbData,
    updated_by: userId
  };
};
```

### Sistema di Monitoraggio

```javascript
// utils/rundownSyncMonitor.js - Monitoraggio sincronizzazione
/**
 * Monitora lo stato del rundown durante operazioni
 */
export const monitorRundownState = (rundownContext, operationName = 'Unknown') => {
  const state = {
    timestamp: new Date().toISOString(),
    operation: operationName,
    activeRundownId: rundownContext?.activeRundownId || null,
    useSupabaseSync: rundownContext?.useSupabaseSync || false,
    itemsCount: rundownContext?.items?.length || 0,
    contextAvailable: !!rundownContext,
    hasAddFunctions: {
      addMedia: typeof rundownContext?.addMedia === 'function',
      addTemplate: typeof rundownContext?.addTemplate === 'function',
      addStory: typeof rundownContext?.addStory === 'function'
    }
  };
  
  console.log(`🔍 [RUNDOWN MONITOR] ${operationName}:`, state);
  return state;
};

/**
 * Verifica sincronizzazione dopo invio elementi
 */
export const verifySyncAfterSend = async (rundownContext, expectedCount, maxWaitMs = 10000) => {
  const startTime = Date.now();
  let attempts = 0;
  
  console.log(`🔄 [SYNC VERIFIER] Verifica sincronizzazione ${expectedCount} elementi`);
  
  // Import dinamico Supabase
  let supabase = null;
  try {
    const supabaseModule = await import('../supabaseClient');
    supabase = supabaseModule.default;
  } catch (error) {
    console.warn('⚠️ [SYNC VERIFIER] Impossibile importare Supabase');
  }
  
  let databaseCount = 0;
  
  while (Date.now() - startTime < maxWaitMs) {
    attempts++;
    const currentItems = rundownContext?.items || [];
    const currentCount = currentItems.length;
    
    // Verifica database diretto
    if (supabase && rundownContext?.activeRundownId) {
      try {
        const { data: dbItems, error } = await supabase
          .from('rundown_items')
          .select('id, type, name')
          .eq('rundown_id', rundownContext.activeRundownId);
        
        if (!error && dbItems) {
          databaseCount = dbItems.length;
          
          if (databaseCount >= expectedCount && currentCount < expectedCount) {
            console.log('🔄 Database aggiornato ma stato locale no - problema real-time');
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Errore verifica database:', dbError);
      }
    }
    
    const effectiveCount = Math.max(currentCount, databaseCount);
    
    if (effectiveCount >= expectedCount) {
      return {
        success: true,
        actualCount: currentCount,
        databaseCount,
        effectiveCount,
        expectedCount,
        attempts,
        duration: Date.now() - startTime,
        syncIssue: databaseCount > currentCount
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return {
    success: false,
    actualCount: rundownContext?.items?.length || 0,
    databaseCount,
    effectiveCount: Math.max(rundownContext?.items?.length || 0, databaseCount),
    expectedCount,
    attempts,
    timeout: true
  };
};
```

---

## 7. CUSTOM HOOKS

### usePlaybackSync Hook

```javascript
// hooks/usePlaybackSync.js - Sincronizzazione stato playback
const usePlaybackSync = () => {
  const [playingItems, setPlayingItems] = useState(new Map());
  const [nextItemId, setNextItemId] = useState(null);
  const [liveItems, setLiveItems] = useState(new Set());
  const [previewItems, setPreviewItems] = useState(new Set());
  
  const lastUpdateRef = useRef(Date.now());
  const syncTimeoutRef = useRef(null);
  const { items: rundownItems } = useRundown();
  
  /**
   * Aggiorna stato di riproduzione elemento
   * Distingue tra LIVE (canale 1) e PREVIEW (canale 3)
   */
  const updatePlaybackStatus = useCallback((itemId, playbackInfo) => {
    if (!itemId || !playbackInfo) return;
    
    const now = Date.now();
    
    // Evita aggiornamenti troppo frequenti
    if (now - lastUpdateRef.current < 100) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        updatePlaybackStatus(itemId, playbackInfo);
      }, 100);
      return;
    }
    
    lastUpdateRef.current = now;
    
    // Determina tipo riproduzione basato su source e channel
    let actualStatus = playbackInfo.status;
    const isLiveEnvironment = playbackInfo.source === 'rundown' || playbackInfo.channel === 1;
    const isPreviewEnvironment = playbackInfo.source === 'scalette' || playbackInfo.channel === 3;
    
    if (actualStatus === 'PLAYING') {
      if (isLiveEnvironment) {
        actualStatus = 'LIVE';
      } else if (isPreviewEnvironment) {
        actualStatus = 'PREVIEW';
      }
    }
    
    setPlayingItems(prev => {
      const newMap = new Map(prev);
      
      if (actualStatus === 'STOPPED') {
        newMap.delete(itemId);
      } else {
        newMap.set(itemId, {
          ...playbackInfo,
          status: actualStatus,
          lastUpdate: now
        });
      }
      
      return newMap;
    });
    
    // Gestisci set LIVE e PREVIEW separatamente
    if (actualStatus === 'LIVE') {
      setLiveItems(prev => new Set([...prev, itemId]));
      setPreviewItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } else if (actualStatus === 'PREVIEW') {
      setPreviewItems(prev => new Set([...prev, itemId]));
    } else if (actualStatus === 'STOPPED') {
      setLiveItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      setPreviewItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, []);
  
  /**
   * Pulisce completamente stato di riproduzione elemento
   */
  const clearPlaybackStatus = useCallback((itemId) => {
    if (!itemId) return;
    
    setPlayingItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
    
    setLiveItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    
    setPreviewItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    
    if (nextItemId === itemId) {
      setNextItemId(null);
    }
  }, [nextItemId]);
  
  /**
   * Verifica se elemento è in riproduzione
   */
  const isItemPlaying = useCallback((itemId) => {
    const status = playingItems.get(itemId);
    return status && (status.status === 'PLAYING' || status.status === 'LIVE');
  }, [playingItems]);
  
  /**
   * Verifica se elemento è LIVE
   */
  const isItemLive = useCallback((itemId) => {
    return liveItems.has(itemId);
  }, [liveItems]);
  
  /**
   * Verifica se elemento è in PREVIEW
   */
  const isItemPreview = useCallback((itemId) => {
    return previewItems.has(itemId);
  }, [previewItems]);
  
  /**
   * Sincronizza con dati OSC
   */
  const syncWithOSC = useCallback((oscData) => {
    if (!oscData || !oscData.isConnected) return;
    
    if (rundownItems && rundownItems.length > 0) {
      rundownItems.forEach(item => {
        if (item.isPlaying) {
          updatePlaybackStatus(item.id, {
            status: 'PLAYING',
            channel: item.data?.casparcgConfig?.channel || 1,
            layer: item.data?.casparcgConfig?.layer || 1,
            startTime: item.playingStartTime || Date.now(),
            source: 'osc'
          });
        }
      });
    }
  }, [rundownItems, updatePlaybackStatus]);
  
  // Cleanup automatico stati obsoleti
  const cleanupStaleStates = useCallback(() => {
    const now = Date.now();
    const staleThreshold = 30000; // 30 secondi
    
    setPlayingItems(prev => {
      const newMap = new Map();
      
      for (const [itemId, playbackInfo] of prev.entries()) {
        if (now - playbackInfo.lastUpdate < staleThreshold) {
          newMap.set(itemId, playbackInfo);
        }
      }
      
      return newMap;
    });
  }, []);
  
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupStaleStates, 30000);
    return () => clearInterval(cleanupInterval);
  }, [cleanupStaleStates]);
  
  return {
    // Stati
    playingItems: Array.from(playingItems.entries()),
    nextItemId,
    liveItems: Array.from(liveItems),
    previewItems: Array.from(previewItems),
    
    // Funzioni controllo
    updatePlaybackStatus,
    clearPlaybackStatus,
    setNextItem: setNextItemId,
    
    // Funzioni query
    getPlaybackStatus: (itemId) => playingItems.get(itemId) || null,
    isItemPlaying,
    isItemNext: (itemId) => nextItemId === itemId,
    isItemLive,
    isItemPreview,
    getAllPlayingItems: () => Array.from(playingItems.entries()).map(([itemId, playbackInfo]) => ({
      itemId, playbackInfo
    })),
    
    // Sincronizzazione
    syncWithOSC,
    cleanupStaleStates
  };
};

export default usePlaybackSync;
```

---

## 8. THEMING E STYLING

### Sistema Broadcast Theme

```javascript
// styles/broadcastTheme.js - Tema professionale broadcast
export const broadcastColors = {
  // Colori primari broadcast
  primary: {
    main: '#1976d2',      // Blu broadcast standard
    dark: '#115293',      // Blu scuro per contrasti
    light: '#42a5f5',     // Blu chiaro per highlights
    contrastText: '#ffffff'
  },
  
  // Colori di stato operativo
  status: {
    onAir: '#f44336',     // Rosso ON AIR
    ready: '#4caf50',     // Verde READY
    warning: '#ff9800',   // Arancione WARNING
    error: '#d32f2f',     // Rosso ERROR
    next: '#ffc107',      // Giallo NEXT
    standby: '#9e9e9e',   // Grigio STANDBY
    live: '#e91e63',      // Magenta LIVE
    preview: '#673ab7'    // Viola PREVIEW
  },
  
  // Sfondo e superfici
  background: {
    primary: '#0a0a0a',   // Nero profondo principale
    secondary: '#1a1a1a', // Grigio scuro secondario
    elevated: '#2a2a2a',  // Grigio elevato per card
    panel: '#1e1e1e',     // Grigio pannelli
    header: '#0d1117',    // Nero header
    sidebar: '#161b22'    // Grigio sidebar
  },
  
  // Testi
  text: {
    primary: '#ffffff',   // Bianco principale
    secondary: '#b3b3b3', // Grigio chiaro
    disabled: '#666666',  // Grigio disabilitato
    accent: '#00d4ff',    // Ciano accent
    timecode: '#00ff00'   // Verde timecode (classico broadcast)
  }
};

// Tipografia broadcast professionale
export const broadcastTypography = {
  fontFamily: {
    primary: '"Roboto", "Helvetica", "Arial", sans-serif',
    monospace: '"Roboto Mono", "Consolas", "Monaco", monospace',
    display: '"Roboto Condensed", "Arial Narrow", sans-serif'
  },
  
  fontSize: {
    xs: '0.7rem',    // 11.2px
    sm: '0.8rem',    // 12.8px
    md: '0.875rem',  // 14px
    lg: '1rem',      // 16px
    xl: '1.125rem',  // 18px
    xxl: '1.25rem',  // 20px
    display: '1.5rem' // 24px
  }
};

// Componenti broadcast specifici
export const broadcastComponents = {
  // Stili per tabelle broadcast
  table: {
    header: {
      background: broadcastColors.background.header,
      borderBottom: `2px solid ${broadcastColors.border.accent}`,
      color: broadcastColors.text.primary,
      fontFamily: broadcastTypography.fontFamily.display,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontSize: broadcastTypography.fontSize.sm
    },
    
    row: {
      borderBottom: `1px solid ${broadcastColors.border.primary}`,
      '&:hover': {
        background: broadcastColors.background.elevated,
        transform: 'translateY(-1px)'
      },
      '&.on-air': {
        background: `${broadcastColors.status.onAir}20`,
        borderLeft: `4px solid ${broadcastColors.status.onAir}`,
        animation: 'glow 2s infinite'
      },
      '&.next': {
        background: `${broadcastColors.status.next}20`,
        borderLeft: `4px solid ${broadcastColors.status.next}`
      }
    },
    
    cellTimecode: {
      color: broadcastColors.text.timecode,
      fontSize: broadcastTypography.fontSize.sm,
      fontFamily: broadcastTypography.fontFamily.monospace,
      fontWeight: 500,
      letterSpacing: '0.5px'
    }
  },
  
  // Badge di stato
  statusBadge: {
    onAir: {
      background: broadcastColors.status.onAir,
      color: broadcastColors.text.primary,
      fontWeight: 700,
      fontSize: broadcastTypography.fontSize.xs,
      padding: '4px 8px',
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      animation: 'pulse 1.5s infinite'
    }
  }
};

// Tema Material-UI personalizzato
export const createBroadcastTheme = (mode = 'dark') => ({
  palette: {
    mode,
    primary: broadcastColors.primary,
    background: {
      default: broadcastColors.background.primary,
      paper: broadcastColors.background.secondary
    },
    text: {
      primary: broadcastColors.text.primary,
      secondary: broadcastColors.text.secondary
    }
  },
  typography: {
    fontFamily: broadcastTypography.fontFamily.primary,
    h1: {
      fontFamily: broadcastTypography.fontFamily.display,
      fontWeight: 700,
      fontSize: '2rem'
    }
  },
  components: {
    MuiTableHead: {
      styleOverrides: {
        root: broadcastComponents.table.header
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: broadcastComponents.table.row
      }
    }
  }
});
```

### Theme Base Material-UI

```javascript
// theme.js - Tema Material-UI base
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3', // Blu
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057', // Rosa
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#fff',
    },
    background: {
      paper: '#1e1e1e', // Grigio scuro
      default: '#121212', // Quasi nero
    },
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif'
    ].join(','),
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600 }
      }
    }
  }
});
```

---

## 9. CONFIGURAZIONE E BUILD

### Package.json Configuration

```json
{
  "name": "casparcg-control-web-client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.10.6",
    "@emotion/styled": "^11.10.6", 
    "@mui/icons-material": "^5.11.16",
    "@mui/material": "^5.12.1",
    "@supabase/supabase-js": "^2.49.5",
    "axios": "^1.3.6",
    "date-fns": "^4.1.0",
    "hls.js": "^1.6.2",
    "lodash": "^4.17.21",
    "react": "^18.2.0",
    "react-beautiful-dnd": "^13.1.1",
    "react-big-calendar": "^1.18.0",
    "react-dom": "^18.2.0",
    "react-draggable": "^4.4.6",
    "react-player": "^2.12.0",
    "react-resizable": "^3.0.5",
    "react-router-dom": "^6.10.0",
    "react-scripts": "5.0.1",
    "socket.io-client": "^4.6.1",
    "uuid": "^9.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "proxy": "http://100.74.188.128:5000",
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

### Entry Point Setup

```javascript
// index.js - Entry point applicazione
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import theme from './theme';
import { CasparProvider } from './contexts/CasparContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CasparProvider>
          <App />
        </CasparProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### Supabase Client Configuration

```javascript
// supabaseClient.js - Configurazione client Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Errore: Variabili ambiente Supabase mancanti. ' +
    'Definire REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
```

### PWA Manifest

```json
// public/manifest.json - Progressive Web App manifest
{
  "short_name": "CasparCG Control",
  "name": "CasparCG Control Web",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#121212"
}
```

### HTML Template

```html
<!-- public/index.html - Template HTML principale -->
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="CasparCG Control Web - Applicazione professionale per il controllo di CasparCG" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />

    <title>CasparCG Control Web</title>

    <!-- Fonts Material-UI -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />

    <!-- MediaMTX WebRTC reader -->
    <script defer src="http://100.74.188.128:8889/preview/reader.js"></script>
  </head>
  <body class="dark">
    <noscript>È necessario abilitare JavaScript per eseguire questa app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

---

## 10. PERFORMANCE E OTTIMIZZAZIONI

### Pattern di Ottimizzazione

```javascript
// Pattern di ottimizzazione utilizzati
const performancePatterns = {
  // Memoizzazione componenti
  componentMemoization: {
    technique: 'React.memo + useMemo + useCallback',
    example: `
      const RundownItem = React.memo(({ item, onPlay }) => {
        const handlePlay = useCallback(() => onPlay(item.id), [item.id, onPlay]);
        const timing = useMemo(() => calculateTiming(item), [item]);
        return <TableRow onClick={handlePlay}>{timing}</TableRow>;
      });
    `
  },
  
  // Lazy loading pagine
  lazyLoading: {
    technique: 'React.lazy + Suspense',
    example: `
      const ScaletteEditor = lazy(() => import('./pages/ScaletteEditor'));
      
      <Suspense fallback={<LoadingSpinner />}>
        <ScaletteEditor />
      </Suspense>
    `
  },
  
  // Virtualizzazione liste lunghe
  virtualization: {
    technique: 'react-window + FixedSizeList',
    usage: 'Liste rundown con 1000+ elementi'
  },
  
  // Debouncing input utente
  debouncing: {
    technique: 'lodash.debounce + useCallback',
    example: `
      const debouncedSearch = useCallback(
        debounce((query) => performSearch(query), 300),
        []
      );
    `
  },
  
  // Batching updates
  batchingUpdates: {
    technique: 'React 18 automatic batching',
    benefit: 'Múltipli setState() in un singolo re-render'
  }
};
```

### Bundle Analysis

```javascript
// Analisi bundle size (npm run build)
const bundleAnalysis = {
  totalSize: '~2.1MB (before gzip)',
  gzippedSize: '~520KB',
  mainChunks: {
    'main.[hash].js': '~800KB', // Codice applicazione
    'vendor.[hash].js': '~1.2MB', // Dipendenze terze parti
    'runtime.[hash].js': '~5KB'   // Webpack runtime
  },
  largestDependencies: [
    '@mui/material (~300KB)',
    'react (~150KB)',
    'socket.io-client (~100KB)',
    'date-fns (~80KB)',
    'lodash (~70KB)'
  ]
};
```

### Memory Management

```javascript
// Gestione memoria e cleanup
const memoryManagement = {
  // Cleanup timer e intervalli
  cleanupTimers: `
    useEffect(() => {
      const interval = setInterval(updateData, 1000);
      return () => clearInterval(interval);
    }, []);
  `,
  
  // Cleanup WebSocket connections
  cleanupSockets: `
    useEffect(() => {
      const socket = io(serverUrl);
      return () => socket.disconnect();
    }, []);
  `,
  
  // Cleanup event listeners
  cleanupListeners: `
    useEffect(() => {
      const handleResize = () => updateLayout();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  `,
  
  // Prevent memory leaks in async operations
  preventMemoryLeaks: `
    useEffect(() => {
      let isMounted = true;
      
      fetchData().then(data => {
        if (isMounted) setData(data);
      });
      
      return () => { isMounted = false; };
    }, []);
  `
};
```

---

## 11. INTEGRAZIONE BACKEND

### WebSocket Communication

```javascript
// Pattern comunicazione WebSocket con backend
const websocketIntegration = {
  // Connessione iniziale
  connection: `
    const socket = io(process.env.REACT_APP_API_URL, {
      transports: ['websocket'],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
  `,
  
  // Event listeners
  eventListeners: {
    'connect': 'Connessione stabilita',
    'disconnect': 'Connessione persa',
    'caspar_status': 'Stato server CasparCG',
    'osc_data': 'Dati real-time OSC',
    'rundown_update': 'Aggiornamento rundown',
    'error': 'Errori server'
  },
  
  // Invio comandi
  commandSending: `
    socket.emit('caspar_command', { command }, (response) => {
      if (response.success) {
        console.log('✅ Comando eseguito');
      } else {
        console.error('❌ Errore:', response.error);
      }
    });
  `
};
```

### Supabase Integration

```javascript
// Integrazione database Supabase
const supabaseIntegration = {
  // Autenticazione
  authentication: {
    signIn: `
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password
      });
    `,
    signOut: `
      const { error } = await supabase.auth.signOut();
    `,
    sessionListener: `
      supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
      });
    `
  },
  
  // Database operations
  databaseOps: {
    select: `
      const { data, error } = await supabase
        .from('rundown_items')
        .select('*')
        .eq('rundown_id', rundownId)
        .order('item_order');
    `,
    insert: `
      const { data, error } = await supabase
        .from('rundown_items')
        .insert([newItem])
        .select()
        .single();
    `,
    update: `
      const { data, error } = await supabase
        .from('rundown_items')
        .update({ name: newName })
        .eq('id', itemId);
    `,
    delete: `
      const { error } = await supabase
        .from('rundown_items')
        .delete()
        .eq('id', itemId);
    `
  },
  
  // Real-time subscriptions
  realTime: `
    const subscription = supabase
      .channel('rundown_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rundown_items'
      }, (payload) => {
        handleRealtimeUpdate(payload);
      })
      .subscribe();
  `
};
```

### REST API Integration

```javascript
// Integrazione API REST con Axios
const restApiIntegration = {
  // Configurazione base
  axiosSetup: `
    const apiClient = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Request interceptor per auth token
    apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = \`Bearer \${token}\`;
      }
      return config;
    });
  `,
  
  // Endpoints specifici
  endpoints: {
    media: {
      list: 'GET /api/media',
      upload: 'POST /api/media/upload',
      delete: 'DELETE /api/media/:id'
    },
    templates: {
      list: 'GET /api/templates',
      create: 'POST /api/templates',
      update: 'PUT /api/templates/:id'
    },
    caspar: {
      status: 'GET /api/caspar/status',
      command: 'POST /api/caspar/command',
      profiles: 'GET /api/caspar/profiles'
    }
  }
};
```

---

## 12. BEST PRACTICES

### Code Organization

```javascript
// Organizzazione codice e best practices
const codeOrganization = {
  // Struttura componenti
  componentStructure: `
    // 1. Imports
    import React, { useState, useEffect, useCallback } from 'react';
    import { Box, Typography } from '@mui/material';
    import { useRundown } from '../contexts/RundownContext';
    
    // 2. Interfaces/Types (se TypeScript)
    interface Props { ... }
    
    // 3. Component definition
    const ComponentName = ({ prop1, prop2 }) => {
      // 4. State hooks
      const [state, setState] = useState(initialValue);
      
      // 5. Context hooks
      const { data, actions } = useRundown();
      
      // 6. Memoized values
      const memoizedValue = useMemo(() => calculation(), [deps]);
      
      // 7. Callbacks
      const handleAction = useCallback(() => {}, [deps]);
      
      // 8. Effects
      useEffect(() => {
        // Effect logic
        return () => cleanup();
      }, [deps]);
      
      // 9. Render
      return <Box>Content</Box>;
    };
    
    // 10. Export
    export default ComponentName;
  `,
  
  // Naming conventions
  namingConventions: {
    components: 'PascalCase (RundownItem)',
    hooks: 'camelCase with use prefix (usePlaybackSync)',
    contexts: 'PascalCase with Context suffix (RundownContext)',
    constants: 'UPPER_SNAKE_CASE (MAX_RETRIES)',
    functions: 'camelCase (handleSubmit)',
    files: 'camelCase or kebab-case (rundownItem.js)',
    folders: 'camelCase (components/broadcast)'
  }
};

// Error handling patterns
const errorHandling = {
  // Try-catch per async operations
  asyncErrorHandling: `
    const handleAsyncOperation = async () => {
      try {
        setLoading(true);
        const result = await apiCall();
        setData(result);
      } catch (error) {
        console.error('Operation failed:', error);
        setError(error.message);
        showNotification('Errore durante operazione', 'error');
      } finally {
        setLoading(false);
      }
    };
  `,
  
  // Error boundaries
  errorBoundaries: `
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false };
      }
      
      static getDerivedStateFromError(error) {
        return { hasError: true };
      }
      
      componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
      }
      
      render() {
        if (this.state.hasError) {
          return <ErrorFallback />;
        }
        return this.props.children;
      }
    }
  `
};

// Performance best practices
const performanceBestPractices = {
  // Evitare re-render inutili
  avoidUnnecessaryRerenders: [
    'Usare React.memo per componenti puri',
    'Memoizzare callbacks con useCallback',
    'Memoizzare calcoli costosi con useMemo',
    'Evitare oggetti inline nelle props',
    'Usare refs per valori che non triggherano re-render'
  ],
  
  // Lazy loading
  lazyLoading: [
    'React.lazy per code splitting',
    'Suspense per fallback UI',
    'Preload componenti critici',
    'Dynamic imports per utilities'
  ],
  
  // Bundle optimization
  bundleOptimization: [
    'Tree shaking per eliminare codice inutilizzato',
    'Code splitting per ridurre bundle iniziale',
    'Compressione gzip/brotli',
    'Analisi bundle size regolare'
  ]
};

// Security considerations
const securityConsiderations = {
  authentication: [
    'Validazione token JWT lato client',
    'Refresh token automatico',
    'Logout su token scaduto',
    'Storage sicuro credenziali'
  ],
  
  dataValidation: [
    'Validazione input utente',
    'Sanitizzazione dati display', 
    'Prevenzione XSS',
    'Validazione permessi UI'
  ],
  
  apiCommunication: [
    'HTTPS obbligatorio',
    'Timeout requests',
    'Rate limiting awareness',
    'Error handling senza leak info'
  ]
};
```

### Testing Strategies

```javascript
// Strategie di testing
const testingStrategies = {
  // Unit testing componenti
  componentTesting: `
    import { render, screen, fireEvent } from '@testing-library/react';
    import { RundownItem } from './RundownItem';
    
    describe('RundownItem', () => {
      it('should render item name', () => {
        const mockItem = { id: '1', name: 'Test Item' };
        render(<RundownItem item={mockItem} />);
        
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      it('should call onPlay when play button clicked', () => {
        const mockOnPlay = jest.fn();
        const mockItem = { id: '1', name: 'Test Item' };
        
        render(<RundownItem item={mockItem} onPlay={mockOnPlay} />);
        
        fireEvent.click(screen.getByRole('button', { name: /play/i }));
        expect(mockOnPlay).toHaveBeenCalledWith('1');
      });
    });
  `,
  
  // Testing hooks
  hookTesting: `
    import { renderHook, act } from '@testing-library/react';
    import { usePlaybackSync } from './usePlaybackSync';
    
    describe('usePlaybackSync', () => {
      it('should update playback status', () => {
        const { result } = renderHook(() => usePlaybackSync());
        
        act(() => {
          result.current.updatePlaybackStatus('item1', {
            status: 'PLAYING',
            channel: 1
          });
        });
        
        expect(result.current.isItemPlaying('item1')).toBe(true);
      });
    });
  `,
  
  // Integration testing
  integrationTesting: `
    // Test integrazione Context + Component
    const renderWithContext = (component) => {
      return render(
        <RundownProvider>
          <CasparProvider>
            {component}
          </CasparProvider>
        </RundownProvider>
      );
    };
    
    it('should integrate rundown context with component', () => {
      renderWithContext(<RundownPage />);
      // Test interazioni tra context e componente
    });
  `
};
```

---

## CONCLUSIONE

Questa documentazione fornisce una panoramica completa dell'architettura frontend di CasparCG Control Web. L'applicazione è costruita seguendo pattern moderni React con:

### Punti di Forza Architetturali

1. **Modularità**: Componenti riutilizzabili e contexts specializzati
2. **Scalabilità**: Struttura cartelle organizzata e pattern consistenti  
3. **Performance**: Ottimizzazioni tramite memoization e lazy loading
4. **Maintainability**: Code organization chiara e best practices
5. **Real-time**: Integrazione WebSocket per broadcast requirements
6. **Professional UI**: Tema broadcast-grade con Material-UI

### Tecnologie Chiave

- **React 18** con hooks moderni e Context API
- **Material-UI v5** per componenti UI professionali
- **Socket.IO** per comunicazione real-time
- **Supabase** per database e autenticazione
- **React Router v6** per navigazione SPA

### Areas di Sviluppo Futuro

1. **TypeScript Migration**: Graduale conversione per type safety
2. **Testing Coverage**: Espansione test automatizzati
3. **PWA Features**: Miglioramento funzionalità offline
4. **Performance Monitoring**: Implementazione metriche real-time
5. **Accessibility**: Miglioramento supporto WCAG
6. **Internationalization**: Supporto multi-lingua

Questa architettura supporta efficacemente le esigenze di un sistema di controllo broadcast professionale, fornendo una base solida per sviluppi futuri e manutenzione a lungo termine.