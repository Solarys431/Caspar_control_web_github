# Backend Architecture - Detailed Analysis

## Core Server Architecture

### Main Server (`server/server.js`)
**Location**: `server/server.js`

The backend is built on Express.js with Socket.IO for real-time communication, serving as the bridge between the React frontend and CasparCG broadcast server.

#### Key Components:

1. **Express Server Setup**:
   - CORS configuration for frontend communication
   - Morgan logging for HTTP requests
   - Static file serving for production builds
   - JSON/URL-encoded body parsing

2. **Socket.IO Real-time Communication**:
   - Bidirectional communication with React frontend
   - Real-time OSC data streaming
   - Command debouncing system (500ms window) to prevent duplicate commands
   - Connection management for multiple clients

3. **Command Debouncing System (IMPROVEMENT 3)**:
   - `commandDebounceMap`: Prevents duplicate commands within 500ms window
   - `generateDebounceKey()`: Creates unique keys for command tracking
   - `isDuplicateCommand()`: Validates commands against recent history
   - Automatic cleanup of old entries to prevent memory leaks

## CasparCG Integration Layer

### CasparClient Class (`server/caspar/casparClient.js`)
**Location**: `server/caspar/casparClient.js`

Professional-grade TCP client for CasparCG AMCP (Advanced Media Control Protocol) communication.

#### Architecture Features:

1. **Robust Connection Management**:
   - Extends EventEmitter for event-driven architecture
   - Auto-reconnection with exponential backoff
   - Connection timeout handling (15s default)
   - Manual/automatic disconnect modes

2. **Command Queue System**:
   - Sequential command processing with timeout management
   - Multi-line response handling for complex commands (CLS, TLS, VERSION, INFO)
   - Command-specific timeout configuration (10s default)
   - Response parsing with buffer management

3. **Protocol Implementation**:
   - Full AMCP protocol support
   - Media list retrieval (CLS command)
   - Template list retrieval (TLS command)
   - Character Generator (CG) commands for graphics
   - Mixer commands for layer control
   - Keep-alive mechanism (VERSION command every 8s)

4. **Advanced Response Handling**:
   ```javascript
   // Multi-line command support with state tracking
   isMultiline: commandString.startsWith('CLS') || 
                commandString.startsWith('TLS') || 
                commandString.startsWith('INFO') || 
                commandString === 'VERSION'
   ```

#### Key Methods:
- `connect()`: Establishes TCP connection with timeout handling
- `sendCommand()`: Queued command execution with response parsing
- `processCommandQueue()`: Sequential command processing
- `_parseClsTlsResponse()`: Specialized parsing for list commands
- `play/pause/resume/stop/clear()`: Playback control commands
- `cgAdd/cgUpdate/cgRemove()`: Graphics template management
- `mixer()`: Layer property control

### OscClient Class (`server/caspar/oscClient.js`)
**Location**: `server/caspar/oscClient.js`

OSC (Open Sound Control) client for real-time CasparCG state monitoring.

#### Features:
- UDP socket communication on port 6250
- Real-time timecode, frame position, and playback state monitoring
- Auto-reconnection system
- State change event broadcasting to frontend
- Batch processing for performance optimization

### Profile Manager (`server/caspar/profileManager.js`)
**Location**: `server/caspar/profileManager.js`

Multi-server environment management for complex broadcast setups.

#### Capabilities:
- Multiple CasparCG server profiles
- Role-based server assignments (main, preview, backup)
- Preview session management
- Supabase integration for persistent configuration
- Dynamic server switching

## Database Integration

### Supabase Configuration
**Environment Variables**:
- `SUPABASE_URL`: Database connection endpoint
- `SUPABASE_SERVICE_KEY`: Backend service authentication
- `SUPABASE_ANON_KEY`: Frontend client authentication (in client/.env)

### Configuration Management
**Location**: `server/config.js`
- Server port configuration
- CasparCG connection defaults
- Template and media paths
- OSC port settings

## Socket.IO Event Architecture

### Frontend → Backend Events:
- `caspar:connect`: Direct CasparCG connection request
- `caspar:connect:profile`: Profile-based connection
- `caspar:command`: Standard AMCP command execution
- `caspar:control`: High-priority control commands
- `preview:request_session`: Preview server session request
- `preview:command`: Preview-specific commands

### Backend → Frontend Events:
- `caspar:connected/disconnected/error`: Connection status updates
- `osc:state/timecode/frame/length/paused`: Real-time playback data
- `osc:connected/disconnected/error`: OSC status updates
- `caspar:loading`: Operation status indicators

## Performance Optimizations

1. **OSC Data Batching**: Frontend batches OSC updates with 200ms throttling
2. **Command Debouncing**: Backend prevents duplicate commands within 500ms
3. **Connection Pooling**: Reuses TCP connections for multiple commands
4. **Buffer Management**: Efficient TCP data buffer processing
5. **Event Cleanup**: Automatic cleanup of stale event listeners

## Error Handling Strategy

1. **Connection Resilience**: Auto-reconnection for both CasparCG and OSC
2. **Command Timeout**: Individual command timeout handling
3. **Graceful Degradation**: Continues operation with reduced functionality
4. **Comprehensive Logging**: Multi-level logging (trace, debug, info, warning, error)
5. **State Recovery**: Automatic state synchronization on reconnection

## Template System Integration

### Manifest Processing:
- Dynamic template configuration loading
- JSON manifest parsing for template parameters
- Template validation and error handling
- Real-time template data updates via CG commands

The backend serves as a robust, production-ready bridge between web interfaces and professional broadcast equipment, with comprehensive error handling, performance optimization, and real-time data synchronization.