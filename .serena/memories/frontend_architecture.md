# Frontend Architecture - Detailed Analysis

## Core Context Architecture

### CasparContext.js - Main CasparCG Integration Context
**Location**: `client/src/contexts/CasparContext.js`

This is the most crucial context, handling all CasparCG server communication and real-time OSC data.

#### Key State Variables:
- **Connection Management**: `connected`, `host`, `port`, `socket`
- **Profile Management**: `activeProfileId`, `previewSessionId`
- **OSC Data**: `oscConnected`, `oscData`, `timecodes`, `mediaLengths`
- **Media/Templates**: `mediaList`, `templateList`
- **UI State**: `loading`, `error`, `logs`

#### Critical Features:

1. **OSC Performance Optimization**:
   - Implements batching and throttling for OSC updates (200ms throttle)
   - Uses `oscUpdateBatchRef` and `oscThrottleTimerRef` to prevent UI flooding
   - Processes multiple OSC state changes in batches via `processBatchedOscUpdates()`

2. **Dual Server Communication**:
   - Socket.IO connection to Express backend server (default: 100.74.188.128:5000)
   - Backend handles TCP connection to CasparCG server (default port 5250)
   - Preview session management for multi-server environments

3. **Command System**:
   - `sendCommand()`: Standard AMCP commands
   - `sendControlCommand()`: High-priority control commands
   - Preview commands with session management
   - CG (Character Generator) commands for graphics templates

4. **Real-time Data Processing**:
   - OSC timecode updates for precise playback control
   - Frame-accurate position tracking
   - Media length and duration calculations
   - Playback state monitoring (play/pause/stop)

#### Key Methods:
- `connectToCaspar()`: Profile-based or direct connection
- `requestPreviewSession()`: Preview server session management
- `fetchManifest()`: Template configuration retrieval
- `casparCgAdd/Update/Remove()`: Graphics template control

### RundownContext.js - Playlist Management
**Location**: `client/src/contexts/RundownContext.js`

Manages rundown/playlist functionality with real-time collaboration features.

### AuthContext.js - User Authentication
**Location**: `client/src/contexts/AuthContext.js`

Handles user authentication via Supabase.

### CalendarContext.js - Scheduling
**Location**: `client/src/contexts/CalendarContext.js`

Calendar integration for broadcast scheduling.

## Component Architecture

### Pages Structure
- **Dashboard**: Main overview page
- **RundownPage**: Playlist management with real-time collaboration
- **ScaletteEditor**: Advanced timeline-based editor with professional broadcast features
- **MediaLibrary**: Media file management and browsing
- **GraphicsEditor**: Template editor for CG graphics

### Specialized Components

#### Rundown Management (`/pages/Rundown/`)
- **RundownList.js**: Main playlist interface with drag-and-drop
- **RundownTimeline.js**: Timeline visualization
- **RundownSettings.js**: Configuration and preferences
- **RundownClock.js**: Live broadcast clock

#### ScaletteEditor (`/pages/ScaletteEditor/`)
Advanced timeline editor with:
- **AdvancedTimeline/**: Professional timeline view with multi-track support
- **ProfessionalTimeline/**: Broadcast-grade timeline interface
- Multiple view modes (card, table, timeline)
- Real-time collaboration via Supabase presence
- Timeline rendering with Canvas-based visualization

### Custom Hooks Architecture

#### ScaletteEditor Hooks:
- `useScalettaItems.js`: Item management and CRUD operations
- `useTimelineRendering.js`: Canvas-based timeline visualization
- `useMultiSelection.js`: Multi-item selection handling
- `useOscData.js`: OSC data integration for timeline
- `useScalettaPresence.js`: Real-time collaboration presence

#### Rundown Hooks:
- `useRundownPlayback.js`: Playback control and automation
- `useRundownTimers.js`: Timing and scheduling
- `useRundownPresence.js`: Collaborative editing presence

## Real-time Communication

### Socket.IO Events Handled:
- `caspar:connected/disconnected/error`: CasparCG connection status
- `osc:state/timecode/frame/length`: Real-time playback data
- `preview:request_session`: Preview server management
- Supabase real-time subscriptions for collaborative features

## Theme and Styling

### Broadcast Theme (`styles/broadcastTheme.js`)
Professional broadcast-focused Material-UI theme with:
- Dark color scheme optimized for broadcast environments
- Custom color palette for status indicators
- Typography designed for control room readability
- Component overrides for broadcast-specific UI patterns