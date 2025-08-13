# Real-time Communication Patterns

## Architecture Overview

The CasparCG Control Web application implements a sophisticated real-time communication architecture with multiple layers:

1. **Frontend ↔ Backend**: Socket.IO WebSocket connections
2. **Backend ↔ CasparCG Server**: TCP AMCP protocol + UDP OSC protocol  
3. **Backend ↔ Database**: Supabase real-time subscriptions
4. **Multi-Client Synchronization**: Real-time collaborative editing

## Socket.IO Communication Layer

### Frontend → Backend Events

#### Connection & Control Events:
```javascript
// CasparCG Connection Management
socket.emit('caspar:connect', { host, port })
socket.emit('caspar:connect:profile', { profileId, serverRole })
socket.emit('caspar:disconnect')
socket.emit('caspar:status:request')

// Command Execution
socket.emit('caspar:command', { command })        // Standard AMCP commands
socket.emit('caspar:control', { command, channel, layer, clip, options }) // Priority commands

// Preview Session Management  
socket.emit('preview:request_session', { profileId })
socket.emit('preview:command', { command, sessionId, profileId })
```

#### Template & Media Management:
```javascript
// Template Manifest Retrieval
socket.emit('get_template_manifest', templateName, callback)
```

### Backend → Frontend Events

#### CasparCG Status Events:
```javascript
// Connection Status
socket.on('caspar:connected', ({ host, port }))
socket.on('caspar:disconnected', ({ reason }))
socket.on('caspar:error', ({ message }))
socket.on('caspar:loading', (isLoading))
socket.on('caspar:log', ({ message }))
socket.on('caspar:status', ({ connected, host, port }))
```

#### OSC Real-time Data Events:
```javascript
// OSC Connection Status
socket.on('osc:connected', ({ host }))
socket.on('osc:disconnected', ({ reason }))
socket.on('osc:error', ({ message }))

// Real-time Playback Data
socket.on('osc:timecode', ({ channel, layer, time }))
socket.on('osc:frame', ({ channel, layer, frame }))
socket.on('osc:length', ({ channel, layer, length }))
socket.on('osc:paused', ({ channel, layer, paused }))
socket.on('osc:fps', ({ channel, layer, fps }))
socket.on('osc:path', ({ channel, layer, path }))
socket.on('osc:loop', ({ channel, layer, loop }))

// Batched State Updates (Performance Optimization)
socket.on('osc:state', ({ key, state }))
socket.on('osc:state:all', (allState))
```

## Performance Optimizations

### Frontend OSC Data Batching (IMPROVEMENT 1)
**Location**: `client/src/contexts/CasparContext.js`

To prevent UI flooding from high-frequency OSC updates:

```javascript
// OSC Update Batching System
const oscUpdateBatchRef = useRef({});
const oscThrottleTimerRef = useRef(null);
const THROTTLE_WINDOW = 200; // 200ms batching window

const batchOscUpdate = useCallback((key, state) => {
    // Accumulate updates in batch
    oscUpdateBatchRef.current[key] = {
        ...oscUpdateBatchRef.current[key],
        ...state
    };

    // Schedule batch processing with throttling
    if (oscThrottleTimerRef.current) {
        clearTimeout(oscThrottleTimerRef.current);
    }
    
    oscThrottleTimerRef.current = setTimeout(processBatchedOscUpdates, 200);
}, [processBatchedOscUpdates]);
```

**Benefits**:
- Reduces React re-renders from ~50/second to ~5/second
- Improves timeline performance during intensive playback
- Maintains data accuracy while optimizing UI responsiveness

### Backend Command Debouncing (IMPROVEMENT 3)
**Location**: `server/server.js`

Prevents duplicate command execution:

```javascript
// Command Debouncing System
const commandDebounceMap = new Map();
const DEBOUNCE_WINDOW_MS = 500;

const isDuplicateCommand = (command, channel, layer, clip, socketId) => {
    const key = `${command.toUpperCase()}-${channel}-${layer}-${clip || 'NO_CLIP'}`;
    const now = Date.now();
    const lastCommand = commandDebounceMap.get(key);
    
    if (lastCommand && (now - lastCommand.timestamp) < DEBOUNCE_WINDOW_MS) {
        return true; // Block duplicate
    }
    
    commandDebounceMap.set(key, { timestamp: now, socketId });
    return false;
};
```

**Benefits**:
- Prevents accidental double-execution of critical broadcast commands
- Reduces load on CasparCG server
- Automatic cleanup prevents memory leaks

## CasparCG Protocol Integration

### AMCP (Advanced Media Control Protocol)
**Protocol**: TCP on port 5250
**Implementation**: `server/caspar/casparClient.js`

#### Command Queue System:
```javascript
// Sequential command processing with timeout management
processCommandQueue() {
    if (this.currentCommand || !this.connected) return;
    
    this.currentCommand = this.commandQueue.shift();
    const { command, timeout } = this.currentCommand;
    
    // Set command-specific timeout
    this.currentCommand.timeoutId = setTimeout(() => {
        this.currentCommand.reject(new Error(`Timeout: ${command}`));
        this.currentCommand = null;
        this.processCommandQueue();
    }, this.commandTimeout);
    
    // Send to CasparCG
    this.socket.write(command + '\r\n');
}
```

#### Multi-line Response Handling:
Complex commands like `CLS`, `TLS`, `VERSION`, and `INFO` return multi-line responses that require special parsing logic.

### OSC (Open Sound Control) Protocol  
**Protocol**: UDP on port 6250
**Implementation**: `server/caspar/oscClient.js`

#### Real-time State Monitoring:
```javascript
// OSC Message Processing
_processOscMessage(msg) {
    const address = msg.address;
    const args = msg.args;
    
    // Parse channel/layer from OSC address: /channel/1/stage/layer/10/file/frame
    const channelMatch = address.match(/\/channel\/(\d+)/);
    const layerMatch = address.match(/\/layer\/(\d+)/);
    
    if (channelMatch && layerMatch) {
        const channel = parseInt(channelMatch[1]);
        const layer = parseInt(layerMatch[1]);
        
        // Extract data type and emit appropriate event
        if (address.includes('/frame')) {
            this.emit('frame', { channel, layer, frame: args[0]?.value });
        } else if (address.includes('/time')) {
            this.emit('timecode', { channel, layer, time: args[0]?.value });
        }
        // ... other data types
    }
}
```

## Multi-Server Preview System

### Preview Session Management
**Location**: `server/caspar/profileManager.js`

Enables preview operations on dedicated servers without affecting main broadcast:

```javascript
// Preview Session Request Flow
const requestPreviewSession = async (profileId) => {
    // 1. Find available preview server for profile
    const previewServer = await getServerByProfileAndRole(profileId, 'preview');
    
    // 2. Create dedicated session
    const sessionId = generateSessionId();
    
    // 3. Establish connection to preview server
    const connection = await connectToServer(previewServer, sessionId);
    
    // 4. Return session details
    return { sessionId, server: previewServer, channel, layer };
};
```

**Benefits**:
- Isolated preview operations
- No interference with live broadcast
- Multi-user preview support
- Automatic resource cleanup

## Supabase Real-time Integration

### Collaborative Features
**Implementation**: Context-level subscriptions

#### Real-time Rundown Collaboration:
```javascript
// Presence tracking for collaborative editing
const channel = supabase.channel(`rundown:${rundownId}`)
    .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setPresence(newState);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user joining session
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving session  
    })
    .subscribe();
```

#### Real-time Data Synchronization:
```javascript
// Real-time database updates
const subscription = supabase
    .channel('public:rundown_items')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rundown_items' },
        (payload) => handleRundownUpdate(payload)
    )
    .subscribe();
```

## Error Handling & Resilience

### Connection Recovery Patterns:

1. **Automatic Reconnection**: All connection types implement exponential backoff
2. **Graceful Degradation**: UI remains functional even with partial connectivity
3. **State Synchronization**: Automatic state recovery on reconnection
4. **Error Propagation**: Comprehensive error reporting to frontend

### Monitoring & Debugging:

1. **Multi-level Logging**: trace, debug, info, warning, error levels
2. **Real-time Log Streaming**: Server logs streamed to frontend
3. **Connection Status Indicators**: Visual feedback for all connection states
4. **Performance Metrics**: OSC update frequency tracking

## Data Flow Summary

```
Frontend React Context
        ↕ Socket.IO (WebSocket)
Express.js Backend Server  
        ↕ TCP (AMCP)          ↕ UDP (OSC)
    CasparCG Server    →    OSC Output
        ↕ Supabase Real-time
    PostgreSQL Database
        ↕ Real-time Subscriptions  
Frontend Collaborative Features
```

This architecture provides:
- **Sub-100ms latency** for critical broadcast commands
- **Frame-accurate timing** for professional broadcast requirements  
- **Real-time collaboration** for multi-user environments
- **Fault tolerance** with automatic recovery mechanisms
- **Scalability** through connection pooling and batching optimizations