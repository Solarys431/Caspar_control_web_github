# Documentazione Completa Sistema UI Pages - CasparCG Control Web

## Indice

1. [Panoramica Architettura UI](#panoramica-architettura-ui)
2. [Routing e Navigazione](#routing-e-navigazione)
3. [Pagine Principali](#pagine-principali)
4. [Sistema Rundown](#sistema-rundown)
5. [Sistema ScaletteEditor](#sistema-scaletteeditor)
6. [Componenti UI Avanzati](#componenti-ui-avanzati)
7. [Pattern e Best Practices](#pattern-e-best-practices)
8. [Theming Broadcast Professionale](#theming-broadcast-professionale)

---

## Panoramica Architettura UI

Il sistema UI di CasparCG Control Web è costruito con **React 18** e **Material-UI v5**, seguendo pattern professionali per applicazioni broadcast real-time.

### Stack Frontend Principale
```javascript
{
  "react": "^18.2.0",              // Core React con Concurrent Features
  "@mui/material": "^5.12.1",      // Material-UI v5 - Componenti UI
  "@emotion/react": "^11.10.6",    // CSS-in-JS per theming
  "socket.io-client": "^4.6.1",    // Real-time updates
  "react-router-dom": "^6.10.0",   // Client-side routing
  "react-beautiful-dnd": "^13.1.1", // Drag & drop per timeline
  "react-big-calendar": "^1.18.0",  // Calendar component
  "date-fns": "^4.1.0"             // Date utilities per broadcast
}
```

### Architettura Context Provider Nidificata
```javascript
// App.js - Struttura provider annidata per state management
<BrowserRouter>
  <ThemeProvider theme={broadcastTheme}>
    <AuthProvider>
      <CasparProfileProvider>
        <CasparProvider>
          <RundownProvider>
            <CalendarProvider>
              <App />
            </CalendarProvider>
          </RundownProvider>  
        </CasparProvider>
      </CasparProfileProvider>
    </AuthProvider>
  </ThemeProvider>
</BrowserRouter>
```

---

## Routing e Navigazione

### File: `/client/src/pages/index.js`

Sistema di routing centralizzato con React Router v6:

```javascript
const Pages = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />           // Dashboard principale
      <Route path="/rundown" element={<Rundown />} />      // Sistema Rundown
      <Route path="/media" element={<MediaBrowser />} />   // Browser media
      <Route path="/templates" element={<TemplateBrowser />} />
      <Route path="/settings" element={<Settings />} />    // Configurazioni
      <Route path="/scalette" element={<ScaletteEditor />} /> // Editor timeline
    </Routes>
  );
};
```

**Pattern di navigazione:**
- **Lazy loading** componenti per performance
- **Protected routes** con AuthContext
- **Deep linking** per sessioni collaborative
- **State preservation** durante navigazione

---

## Pagine Principali

### 1. Dashboard (`Dashboard.js`)

**Funzionalità:**
- **Stato connessione CasparCG** con indicatori real-time
- **Monitoraggio server** (versione, canali, video mode)  
- **Log system** con circular buffer per performance
- **Server info refresh** con polling controllato

**UI Components:**
```javascript
// Layout responsive con Grid MUI
<Grid container spacing={3}>
  {/* Connection Status */}
  <Grid item xs={12} md={6}>
    <Paper sx={{ backgroundColor: '#2d2d2d' }}>
      <Chip 
        label={connected ? 'Connesso' : 'Non connesso'}
        color={connected ? 'success' : 'error'} 
      />
    </Paper>
  </Grid>
  
  {/* Channel Status Cards */}
  <Grid item xs={12} md={6}>
    {channels.map(channel => (
      <Card key={channel.id} sx={{ backgroundColor: '#3d3d3d' }}>
        <Chip label={channel.status} color={getStatusColor(channel.status)} />
      </Card>
    ))}
  </Grid>
</Grid>
```

**Pattern Real-time:**
- Hook personalizzati per **CasparContext**
- **Automatic refresh** con useEffect cleanup
- **Error boundaries** per graceful degradation

### 2. Settings (`Settings.js`)

**Sezioni principali:**
- **Connection Management** - Host/port CasparCG
- **Server Information** - Version, channels, status
- **Custom Commands** - AMCP command tester
- **Log Management** - System logs con clear function
- **Interface Settings** - Dark mode, auto-refresh
- **Profile Administration** - Link to CasparCG profiles

**UI Patterns:**
```javascript
// Accordion per sezioni collassabili
<Accordion sx={{ backgroundColor: '#2d2d2d' }}>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Typography variant="h6">Informazioni Applicazione</Typography>
  </AccordionSummary>
  <AccordionDetails>
    {/* Dettagli versione, copyright, etc */}
  </AccordionDetails>
</Accordion>
```

### 3. MediaBrowser (`MediaBrowser.js`)

**Funzionalità avanzate:**
- **Folder tree navigation** con icone per tipo file
- **File type detection** automatica (video, audio, immagini)
- **Search filtering** real-time
- **Preview integration** con channel/layer selection
- **Tab system** per Media/Template

**UI Components:**
```javascript
// File browser con folder sidebar
<Grid container spacing={3}>
  <Grid item xs={12} md={3}>
    {/* Folder navigation tree */}
    <List>
      {folders.map(folder => (
        <ListItem onClick={() => handleSelectFolder(folder)}>
          <ListItemIcon><FolderIcon /></ListItemIcon>
          <ListItemText primary={folder.split('/').pop()} />
        </ListItem>
      ))}
    </List>
  </Grid>
  
  <Grid item xs={12} md={9}>
    {/* File cards con action buttons */}
    <Grid container spacing={2}>
      {filteredMediaList.map(file => (
        <Card sx={{ border: isPlaying ? '2px solid #4caf50' : 'none' }}>
          <CardContent>
            {getFileIcon(fileName)}
            <Typography>{fileName}</Typography>
            <Chip label={fileType} color="primary" />
          </CardContent>
          <CardActions>
            <Button startIcon={<PlayArrowIcon />}>Play</Button>
            <Button startIcon={<AddIcon />}>Rundown</Button>
          </CardActions>
        </Card>
      ))}
    </Grid>
  </Grid>
</Grid>
```

### 4. Auth (`Auth.js`)

**Componente di autenticazione:**
- **Form switching** tra Login/Register
- **Success message** handling
- **Redirect logic** post-autenticazione
- **Supabase integration** seamless

---

## Sistema Rundown

### Architettura Rundown (`/pages/Rundown/`)

#### RundownPage.js (Componente Principale)
```javascript
const RundownPage = () => {
  // Hook principali
  const { connected, mediaList, templateList } = useCaspar();
  const {
    items, rundownName, modified, playingItems,
    currentTime, scheduledPlayback, timeIndicatorPosition,
    removeItem, updateItem
  } = useRundown();

  // Stati UI
  const [tabValue, setTabValue] = useState(0); // Rundown/Calendar
  const [timelineView, setTimelineView] = useState('24h');
  
  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      <RundownHeader {...headerProps} />
      <RundownTabs tabValue={tabValue} handleTabChange={handleTabChange} />
      
      {/* Contenuto principale */}
      {tabValue === 0 && (
        <Box sx={{ backgroundColor: '#2d2d2d' }}>
          <Box sx={{ display: 'flex' }}>
            <RundownClock connected={connected} />
            <RundownTimeline {...timelineProps} />
          </Box>
          <RundownList {...listProps} />
        </Box>
      )}
      
      {/* Calendar view */}
      {tabValue === 1 && <WeeklyCalendar />}
      
      <RundownDialogs {...dialogProps} />
    </Box>
  );
};
```

#### RundownHeader.js (Controlli Principali)

**Funzionalità broadcast:**
- **Nome rundown** editabile in real-time
- **Indicatori stato** (Supabase sync, modifiche, errori)
- **Controlli riproduzione** (Play All, Stop All, Auto Play)
- **Loop system** avanzato con OSC monitoring
- **Scheduled playback** per automazione
- **Menu aggiunta** elementi (Media, Template, Media+Template)

```javascript
// Controlli broadcast professionali
<Grid container spacing={2} alignItems="center">
  <Grid item xs={12} md={6}>
    <TextField 
      label="Nome Rundown"
      value={rundownName}
      onChange={(e) => setRundownName(e.target.value)}
    />
    
    {/* Status indicators */}
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Chip icon={<CloudIcon />} label="Sync" color="success" />
      {modified && <Chip label="Modificato" color="warning" />}
    </Box>
  </Grid>
  
  <Grid item xs={12} md={6}>
    <Box sx={{ display: 'flex', gap: 1 }}>
      {/* Playback controls */}
      <Button startIcon={<PlayArrowIcon />} onClick={handleAutoPlay}>
        Auto Play
      </Button>
      <Button startIcon={<LoopIcon />} onClick={handlePlayAllWithLoop}>
        Auto Loop
      </Button>
      <Button startIcon={<AddIcon />} onClick={handleAddMenuOpen}>
        Aggiungi
      </Button>
    </Box>
  </Grid>
</Grid>
```

#### RundownList.js (Lista Elementi)

**Sistema colonne configurabile:**
```javascript
const RUNDOWN_COLUMNS = [
  { id: 'index', label: '#', width: '40px', required: true },
  { id: 'startTime', label: 'START', width: '80px' },
  { id: 'duration', label: 'DURATION', width: '80px' },
  { id: 'location', label: 'LOCATION', width: '230px' },
  { id: 'fileTemplate', label: 'FILE / TEMPLATE', width: 'flexGrow', required: true },
  { id: 'notes', label: 'NOTE', width: '130px' },
  { id: 'actions', label: 'AZIONI', width: '120px', required: true }
];
```

**Rendering dinamico elementi:**
```javascript
// Header broadcast professionale
<Box sx={{
  background: broadcastColors.gradients.header,
  borderBottom: `2px solid ${broadcastColors.border.accent}`,
  fontFamily: '"Roboto Condensed", "Arial Narrow", sans-serif',
  textTransform: 'uppercase',
  position: 'sticky',
  top: 0,
  zIndex: 7
}}>
  {visibleColumnConfigs.map(column => (
    <Box sx={{ 
      width: column.width === 'flexGrow' ? undefined : column.width,
      flexGrow: column.width === 'flexGrow' ? 1 : 0,
      textAlign: 'center',
      fontWeight: 'bold'
    }}>
      {column.label}
    </Box>
  ))}
</Box>

// Elementi con stato broadcast
{filteredItems.map((item, index) => {
  const isPlaying = item.isPlaying || isLive;
  const isNext = item.data?.itemState === 'next';
  
  return (
    <Box sx={{
      backgroundColor: item.isPlaying 
        ? `${broadcastColors.status.onAir}20`
        : isNext 
          ? `${broadcastColors.status.next}20` 
          : 'transparent',
      borderLeft: item.isPlaying 
        ? `4px solid ${broadcastColors.status.onAir}` 
        : isNext 
          ? `4px solid ${broadcastColors.status.next}` 
          : 'none',
      animation: item.isPlaying ? 'onAirGlow 2s infinite' : 'none'
    }}>
      {/* Rendering colonne dinamico */}
      {visibleColumnConfigs.map(column => 
        renderColumnContent(column.id, item, index, itemProps)
      )}
    </Box>
  );
})}
```

#### RundownTimeline.js (Timeline Visuale)

**Timeline 24h con indicatore tempo:**
```javascript
// Fasce orarie responsive
<Box sx={{ position: 'relative', height: '30px' }}>
  {Array.from({ length: 24 }, (_, i) => (
    <Box key={i} sx={{
      position: 'absolute',
      left: i === 0 ? '5px' : `calc(${(i / 24) * 100}% - 10px)`,
      fontSize: '0.7rem',
      fontWeight: 'bold',
      color: 'rgba(255, 255, 255, 0.8)'
    }}>
      {`${i.toString().padStart(2, '0')}:00`}
    </Box>
  ))}
  
  {/* Indicatore tempo corrente */}
  <Box sx={{
    position: 'absolute',
    left: `${timeIndicatorPosition}%`,
    width: '3px',
    height: '100%',
    backgroundColor: '#ff5722',
    boxShadow: '0 0 8px #ff5722',
    zIndex: 10
  }} />
  
  {/* Elementi pianificati */}
  {scheduledPlayback && items.map(item => (
    <Tooltip title={`${item.name} (${item.data.startTime})`}>
      <Box sx={{
        position: 'absolute',
        left: `${startPosition}%`,
        width: `${widthPercentage}%`,
        height: '20px',
        backgroundColor: item.isPlaying 
          ? 'rgba(76, 175, 80, 0.9)' 
          : 'rgba(76, 175, 80, 0.7)',
        cursor: 'pointer'
      }} />
    </Tooltip>
  ))}
</Box>
```

---

## Sistema ScaletteEditor

### Architettura ScaletteEditor (`/pages/ScaletteEditor/`)

**Componente principale ultra-avanzato per editing timeline broadcast.**

#### index.js (Core ScaletteEditor)
```javascript
const ScaletteEditor = () => {
  // Context e hooks principali
  const { connected, getMediaList, getTemplateList } = useContext(CasparContext);
  const rundownContext = useRundown();
  const { currentUserId } = useAuth();
  
  // Hooks personalizzati per funzionalità avanzate
  const previewPlayer = usePreviewPlayer(3); // Canale 3 per preview
  const scalettaItems = useScalettaItems();
  const dialogs = useDialogs();
  const multiSelection = useMultiSelection(scalettaItems.scalettaItems);
  const playbackSync = usePlaybackSync(); // Sincronizzazione real-time
  
  // Stati UI avanzati
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'
  const [tableViewMode, setTableViewMode] = useState('compact');
  const [visibleColumns, setVisibleColumns] = useState([...]);
  const [topAreaHeight, setTopAreaHeight] = useState(300);
  
  return (
    <Grid container sx={{ height: '100vh' }}>
      {/* Area superiore ridimensionabile */}
      <Grid item xs={12} sx={{ height: `${topAreaHeight}px` }}>
        <Grid container sx={{ height: '100%' }}>
          <Grid item xs={8}>
            <PreviewSection {...previewProps} />
          </Grid>
          <Grid item xs={4}>
            <ScalettaGlobalInfoBar {...infoProps} />
          </Grid>
        </Grid>
        
        {/* Drag handle per ridimensionamento */}
        <Box
          ref={resizeHandleRef}
          sx={{
            height: '4px',
            cursor: 'row-resize',
            backgroundColor: '#444',
            '&:hover': { backgroundColor: '#666' }
          }}
        />
      </Grid>
      
      {/* Area principale */}
      <Grid item xs={12} sx={{ 
        height: `calc(100vh - ${topAreaHeight}px - 4px)`,
        overflow: 'hidden'
      }}>
        <ScalettaTableToolbar {...toolbarProps} />
        
        {viewMode === 'table' ? (
          <ScalettaTable {...tableProps} />
        ) : (
          <ProfessionalTimeline {...timelineProps} />
        )}
      </Grid>
    </Grid>
  );
};
```

#### ScalettaTable.js (Tabella Avanzata)

**Tabella broadcast con funzionalità professionali:**

```javascript
const ScalettaTableRow = React.memo(({
  item, index, playbackSync, // Altri props...
}) => {
  // Stati riproduzione real-time
  const isPlaying = playbackSync?.isItemPlaying(item.id) || false;
  const isLive = playbackSync?.isItemLive(item.id) || false;
  const isNext = playbackSync?.isItemNext(item.id) || false;
  
  return (
    <TableRow sx={{
      // Colori dinamici basati su stato
      backgroundColor: isLive || isPlaying
        ? 'rgba(244, 67, 54, 0.2)' // Rosso ON AIR
        : isNext
          ? 'rgba(255, 193, 7, 0.2)' // Giallo NEXT
          : selectedItemIndex === index
            ? 'rgba(76, 175, 80, 0.3)' // Verde selezionato
            : 'inherit',
      border: isLive || isPlaying ? '2px solid #f44336' : 'none',
      cursor: 'move'
    }}>
      
      {/* Checkbox selezione multipla */}
      <TableCell>
        <ItemSelectionCheckbox
          checked={selectedItemsSet.has(item.id)}
          onChange={(checked) => onItemSelectionChange(item.id, checked)}
        />
      </TableCell>
      
      {/* Colonne dinamiche basate su visibilità */}
      {visibleColumns.includes('name') && (
        <TableCell sx={tableStyles.enhancedNameCell}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ItemTypeIcon type={item.type} />
            
            {/* Indicatori stato ON AIR */}
            {(isLive || isPlaying) && (
              <Box sx={{
                backgroundColor: '#f44336',
                color: 'white',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                animation: 'pulse 1.5s infinite'
              }}>
                ON AIR
              </Box>
            )}
            
            <Typography variant="body2">
              {item.data?.customName || 'Senza nome'}
            </Typography>
            
            <StatusBadge status={itemStatus} />
          </Box>
        </TableCell>
      )}
      
      {/* Actions con controlli broadcast */}
      <TableCell>
        <ItemActionsCell
          item={item}
          canEdit={!isLive && !isPlaying} // Non modificabile se ON AIR
          onPlayItem={onPlayItem}
          onStopItem={onStopItem}
        />
      </TableCell>
    </TableRow>
  );
});
```

#### PreviewSection.js (Anteprima Avanzata)

**Sistema preview con controlli professionali:**

```javascript
const PreviewSection = ({ previewState, onPlaybackControl }) => {
  const {
    previewMedia, previewExpanded, playbackStatus,
    progressValue, currentTimecode, remainingTime, previewOscData
  } = previewState;
  
  // Stati avanzati per preview
  const [isPinned, setIsPinned] = useState(false);
  const [isPopOut, setIsPopOut] = useState(false);
  const [inPoint, setInPoint] = useState('00:00:00:00');
  const [outPoint, setOutPoint] = useState('00:03:30:00');
  
  return (
    <Paper elevation={isPinned ? 6 : 1} sx={{
      height: '100%',
      border: isPinned ? '1px solid' : 'none',
      borderColor: 'primary.main'
    }}>
      {/* Header con controlli */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1">Anteprima</Typography>
          <Chip 
            label={playbackStatus}
            color={playbackStatus === 'PLAYING' ? 'success' : 'default'}
            sx={{ ml: 1 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex' }}>
          <Tooltip title={isPinned ? "Sblocca" : "Blocca"}>
            <IconButton onClick={() => setIsPinned(!isPinned)}>
              {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Apri in finestra separata">
            <IconButton onClick={() => setIsPopOut(!isPopOut)}>
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={previewExpanded ? "Riduci" : "Espandi"}>
            <IconButton onClick={onToggleExpand}>
              {previewExpanded ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Player area */}
      <Collapse in={!isCollapsed}>
        <Box sx={{ p: 2 }}>
          <PreviewPlayer
            media={previewMedia}
            template={previewTemplate}
            expanded={previewExpanded}
            onPlaybackControl={onPlaybackControl}
          />
          
          {/* Progress bar con timecode */}
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progressValue}
              sx={{ height: 8, borderRadius: 5 }}
            />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: 1,
              fontFamily: 'monospace'
            }}>
              <Typography variant="caption">{currentTimecode}</Typography>
              <Typography variant="caption">{remainingTime}</Typography>
            </Box>
          </Box>
          
          {/* IN/OUT Points */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <TextField
                label="IN Point"
                value={inPoint}
                onChange={(e) => setInPoint(e.target.value)}
                size="small"
                fullWidth
                InputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="OUT Point"
                value={outPoint}
                onChange={(e) => setOutPoint(e.target.value)}
                size="small"
                fullWidth
                InputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};
```

---

## Componenti UI Avanzati

### 1. Selettori e Browser

#### RundownSelector.js
```javascript
const RundownSelector = () => {
  const [rundowns, setRundowns] = useState([]);
  const { user } = useAuth();
  
  // Fetch rundowns con gestione collaboratori
  const fetchRundowns = useCallback(async () => {
    // Query complessa per rundown + collaboratori
    const { data: ownedRundowns } = await supabase
      .from('rundowns')
      .select('*')
      .eq('owner_id', user.id);
      
    const { data: collaboratorData } = await supabase
      .from('rundown_collaborators')
      .select(`rundown_id, role, rundowns:rundown_id (*)`)
      .eq('user_id', user.id);
    
    // Combina e formatta dati
    const allRundowns = [...ownedRundowns, ...collaboratorFormattedData];
    setRundowns(allRundowns);
  }, [user.id]);
  
  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {rundowns.map(rundown => (
          <Grid item xs={12} sm={6} md={4} key={rundown.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6">{rundown.name}</Typography>
                <Chip 
                  label={getRoleLabel(rundown.role)}
                  color={getRoleChipColor(rundown.role)}
                />
                <Typography variant="body2" color="text.secondary">
                  Aggiornato: {formatDate(rundown.updated_at)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button startIcon={<PlayIcon />} 
                        onClick={() => navigate(`/rundown/${rundown.id}`)}>
                  Apri
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
```

### 2. Dialog e Modal Avanzati

Pattern comuni per dialog broadcast:
```javascript
// Dialog con validazione e loading states
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState({});

<Dialog open={dialogOpen} onClose={onClose} maxWidth="md" fullWidth>
  <DialogTitle>
    {title}
    {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
  </DialogTitle>
  
  <DialogContent>
    {errors.general && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {errors.general}
      </Alert>
    )}
    
    <TextField
      label="Nome"
      value={name}
      onChange={(e) => setName(e.target.value)}
      error={!!errors.name}
      helperText={errors.name}
      fullWidth
      margin="normal"
    />
  </DialogContent>
  
  <DialogActions>
    <Button onClick={onClose} disabled={loading}>
      Annulla
    </Button>
    <Button 
      onClick={handleSubmit} 
      variant="contained" 
      disabled={loading || !isValid}
    >
      {loading ? 'Salvando...' : 'Salva'}
    </Button>
  </DialogActions>
</Dialog>
```

---

## Pattern e Best Practices

### 1. Context Integration Pattern
```javascript
// Hook personalizzato per accesso Context
const useRundownOperations = () => {
  const {
    items, addItem, removeItem, updateItem,
    playItem, stopItem, playAll, stopAll
  } = useRundown();
  
  const { connected, sendCommand } = useCaspar();
  const { showNotification } = useNotifications();
  
  // Wrapper con error handling
  const safePlayItem = async (item) => {
    if (!connected) {
      showNotification('Non connesso a CasparCG', 'warning');
      return;
    }
    
    try {
      await playItem(item);
      showNotification(`Riproduzione avviata: ${item.name}`, 'success');
    } catch (error) {
      showNotification(`Errore: ${error.message}`, 'error');
    }
  };
  
  return { items, safePlayItem, /* altri metodi */ };
};
```

### 2. Real-time Update Pattern
```javascript
// Component con Socket.IO integration
const RundownComponent = () => {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    // Listeners per eventi real-time
    socket.on('rundown:item_added', (newItem) => {
      setItems(prev => [...prev, newItem]);
    });
    
    socket.on('rundown:item_updated', (updatedItem) => {
      setItems(prev => prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
    });
    
    socket.on('caspar:status_changed', (status) => {
      // Aggiorna UI in base a cambi stato CasparCG
      updateUIBasedOnCasparStatus(status);
    });
    
    return () => {
      socket.off('rundown:item_added');
      socket.off('rundown:item_updated');  
      socket.off('caspar:status_changed');
    };
  }, []);
  
  return (
    <Box>
      {items.map(item => (
        <RundownItem 
          key={item.id} 
          item={item}
          isPlaying={item.isPlaying}
          onPlay={() => handlePlay(item)}
        />
      ))}
    </Box>
  );
};
```

### 3. Error Boundary Pattern
```javascript
// Error boundary per componenti broadcast
class BroadcastErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Broadcast Error:', error, errorInfo);
    // Log to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Errore Sistema Broadcast
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Si è verificato un errore. Verificare la connessione CasparCG.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Ricarica Applicazione
          </Button>
        </Box>
      );
    }
    
    return this.props.children;
  }
}
```

### 4. Performance Optimization Pattern
```javascript
// Memoization per componenti pesanti
const RundownItem = React.memo(({ item, onPlay, onStop }) => {
  // Calcoli costosi memoizzati
  const itemStatus = useMemo(() => {
    return calculateItemStatus(item);
  }, [item.id, item.status, item.lastUpdate]);
  
  // Callbacks memoizzati per evitare re-render
  const handlePlay = useCallback(() => {
    onPlay(item.id);
  }, [onPlay, item.id]);
  
  return (
    <Card sx={{ 
      backgroundColor: item.isPlaying ? '#e8f5e8' : 'transparent'
    }}>
      <CardContent>
        <Typography variant="h6">{item.name}</Typography>
        <Chip label={itemStatus} />
      </CardContent>
      <CardActions>
        <Button onClick={handlePlay}>Play</Button>
        <Button onClick={() => onStop(item.id)}>Stop</Button>
      </CardActions>
    </Card>
  );
});

// Context splitting per performance
const PlaybackDataContext = React.createContext();
const PlaybackCommandsContext = React.createContext();

// Evita re-render quando cambiano solo i comandi
const PlaybackProvider = ({ children }) => {
  const [playbackData, setPlaybackData] = useState({});
  
  const commands = useMemo(() => ({
    play: (itemId) => { /* comando play */ },
    stop: (itemId) => { /* comando stop */ }
  }), []); // Memoizzato senza dipendenze
  
  return (
    <PlaybackDataContext.Provider value={playbackData}>
      <PlaybackCommandsContext.Provider value={commands}>
        {children}
      </PlaybackCommandsContext.Provider>
    </PlaybackDataContext.Provider>
  );
};
```

---

## Theming Broadcast Professionale

### Tema Base (broadcastTheme.js)
```javascript
const broadcastTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: '#2196f3',      // Broadcast blue
      light: '#64b5f6',
      dark: '#1976d2'
    },
    background: {
      default: '#121212',    // Deep dark
      paper: '#1e1e1e',      // Card background
      elevated: '#2d2d2d'    // Elevated surfaces
    },
    success: { main: '#4caf50' },  // ON-AIR green
    error: { main: '#f44336' },    // Error red
    warning: { main: '#ff9800' },  // Warning amber
    info: { main: '#00bcd4' }      // Info cyan
  },
  
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h4: { 
      fontFamily: '"Roboto Condensed", "Arial Narrow", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    h6: { fontWeight: 600 },
    
    // Font broadcast per timecode
    monospace: {
      fontFamily: '"Roboto Mono", "Consolas", "Monaco", monospace',
      fontWeight: 'medium',
      letterSpacing: '0.5px'
    }
  },
  
  // Colori customizzati broadcast
  broadcastColors: {
    status: {
      onAir: '#4caf50',      // Verde ON AIR
      next: '#ff9800',       // Arancione NEXT
      ready: '#2196f3',      // Blu READY
      error: '#f44336',      // Rosso ERROR
      warning: '#ff9800'     // Giallo WARNING
    },
    
    gradients: {
      onAir: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
      next: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      header: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
    },
    
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#666666',
      timecode: '#00ff00',   // Verde fosforescente per timecode
      fontFamily: '"Roboto", "Arial", sans-serif'
    },
    
    border: {
      primary: 'rgba(255, 255, 255, 0.12)',
      accent: '#2196f3'
    }
  },
  
  // Animazioni broadcast
  broadcastAnimations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)'
    }
  },
  
  components: {
    // Button overrides per look broadcast
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 600,
          transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)'
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }
        }
      }
    },
    
    // Card overrides
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          '&:hover': {
            borderColor: '#2196f3',
            boxShadow: '0 4px 16px rgba(33, 150, 243, 0.2)'
          }
        }
      }
    },
    
    // Table broadcast styling
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)'
          },
          '&:hover': {
            backgroundColor: 'rgba(33, 150, 243, 0.1)'
          }
        }
      }
    }
  }
});
```

### Utilizzo Tema in Componenti
```javascript
// Hook per accesso tema broadcast
const useBroadcastTheme = () => {
  const theme = useTheme();
  return {
    colors: theme.broadcastColors,
    animations: theme.broadcastAnimations,
    // Utility functions
    getStatusColor: (status) => theme.broadcastColors.status[status],
    getGradient: (type) => theme.broadcastColors.gradients[type]
  };
};

// Componente con theming broadcast
const BroadcastButton = ({ status, children, ...props }) => {
  const { colors, animations } = useBroadcastTheme();
  
  return (
    <Button
      {...props}
      sx={{
        background: status === 'onAir' 
          ? colors.gradients.onAir
          : status === 'next'
            ? colors.gradients.next
            : 'default',
        color: colors.text.primary,
        transition: `all ${animations.duration.normal} ${animations.easing.standard}`,
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: `0 0 12px ${colors.status[status]}60`
        }
      }}
    >
      {children}
    </Button>
  );
};
```

---

## Conclusioni

Il sistema UI di CasparCG Control Web rappresenta un'implementazione avanzata di interfacce broadcast professionali con:

### Punti di Forza Architetturali:
- **Context-based state management** scalabile
- **Real-time updates** con Socket.IO seamless
- **Component isolation** con error boundaries
- **Performance optimization** con memoization
- **Responsive design** per multi-device usage

### Pattern UI Broadcast:
- **Status indicators** real-time per ON AIR/NEXT
- **Timeline interfaces** professionali con drag&drop
- **Preview systems** avanzati con OSC integration
- **Multi-selection** e bulk operations
- **Collaborative editing** con presence indicators

### Tecnologie Moderne:
- **React 18** con Concurrent Features
- **Material-UI v5** con theming broadcast
- **TypeScript-ready** architecture
- **WebRTC integration** per preview
- **Supabase real-time** per collaboration

Questa architettura fornisce una base solida per sviluppo UI broadcast professionale, garantendo scalabilità, performance e user experience ottimale per operatori in ambienti live ad alta pressione.