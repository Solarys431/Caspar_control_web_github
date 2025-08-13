# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installation
```bash
# Install all dependencies (root, server, and client)
npm run install-all

# Install dependencies separately
cd server && npm install
cd client && npm install
```

### Development
```bash
# Start both server and client concurrently
npm start

# Start with preview mode (includes additional features)
npm start:preview

# Start components individually
npm run server    # Backend only
npm run client    # Frontend only

# Development with auto-reload (server)
cd server && npm run dev
```

### Building
```bash
# Build client for production
npm run build
cd client && npm run build
```

### Testing
```bash
# Run client tests
cd client && npm test
```

### Supabase Mode Switching
```bash
# Check current mode
npm run supabase:status

# Switch to cloud database
npm run supabase:cloud

# Switch to local database
npm run supabase:local
```

## Architecture Overview

This is a **CasparCG Control Web Application** - a professional broadcast playout control system with a React frontend and Node.js backend.

### Core Architecture
- **Frontend**: React 18 + Material-UI with custom dark theme
- **Backend**: Express.js server with Socket.IO for real-time communication
- **Database**: Supabase (PostgreSQL) for data persistence
- **Broadcast Control**: Direct TCP connection to CasparCG Server
- **Real-time Features**: Socket.IO for live updates and OSC protocol support

### Key Components Structure

#### Client (`/client/src/`)
- **Contexts**: State management using React Context API
  - `CasparContext.js`: CasparCG server connection and control
  - `RundownContext.js`: Rundown/playlist management
  - `AuthContext.js`: User authentication
  - `CalendarContext.js`: Calendar and scheduling features
- **Pages**: Main application views (Dashboard, Rundown, ScaletteEditor, etc.)
- **Components**: Reusable UI components organized by feature

#### Server (`/server/`)
- **caspar/**: CasparCG integration modules
  - `casparClient.js`: Direct TCP communication with CasparCG
  - `oscClient.js`: OSC protocol implementation
  - `profileManager.js`: CasparCG server profile management
- **server.js**: Main Express server with Socket.IO setup

### Database Integration
- Uses Supabase for data persistence
- Environment variables required:
  - `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (backend)
  - `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` (frontend)

### CasparCG Integration
- Direct TCP connection to CasparCG Server (default: localhost:5250)
- OSC (Open Sound Control) protocol support for advanced control
- Profile-based configuration for multiple CasparCG instances
- Real-time media browser and playout control

## Key Development Patterns

### State Management
- Uses React Context API extensively
- Real-time synchronization via Socket.IO
- Supabase real-time subscriptions for collaborative features

### Component Organization
- Page-level components in `/pages/`
- Feature-specific components grouped in subdirectories
- Shared components in `/components/`
- Custom hooks in `/hooks/` directories

### Styling
- Material-UI with custom dark theme (`theme.js`, `broadcastTheme.js`)
- Professional broadcast-focused design
- Responsive layout with sidebar navigation

## Configuration

### Environment Setup
Three `.env` files are used:
- Root `.env`: Global configuration
- `server/.env`: Backend-specific variables (Supabase service key)
- `client/.env`: Frontend-specific variables (Supabase anon key)

### CasparCG Configuration
- Default connection: localhost:5250
- Configuration in `server/config.js`
- Media paths and template paths configurable
- Profile-based multi-server support

## Development Notes

### Real-time Features
- Socket.IO connections established on both client and server
- OSC protocol for advanced CasparCG control
- Supabase real-time subscriptions for collaborative editing

### Broadcast-Specific Features
- **Rundown Management**: Playlist creation and execution
- **Media Browser**: CasparCG media file management
- **Graphics Control**: Template-based graphics overlay
- **Mixer Control**: Layer positioning, scaling, effects
- **Calendar Integration**: Scheduling and timeline management

### Testing Considerations
- Uses React Testing Library for frontend tests
- CasparCG connection testing may require mock server
- Real-time features require Socket.IO testing setup