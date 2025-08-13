# Project Structure

## Root Level Structure
```
casparcg-control-web/
├── client/                 # React frontend application
├── server/                 # Express.js backend application
├── database/              # Database related files
├── supabase/             # Supabase configuration and migrations
├── scripts/              # Utility scripts (e.g., database mode switching)
├── DOC/                  # Documentation (backend, frontend, shared)
├── debug/                # Debug utilities
├── package.json          # Root package configuration with scripts
├── CLAUDE.md            # AI assistant instructions
├── README.md            # Main project documentation
└── .gitignore           # Git ignore rules
```

## Client Structure (`/client/`)
```
client/
├── public/               # Static files
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── auth/       # Authentication components
│   │   ├── calendar/   # Calendar-related components
│   │   ├── dialogs/    # Modal dialogs
│   │   ├── layout/     # Layout components (Header, Sidebar)
│   │   ├── media/      # Media browser components
│   │   └── scalette/   # Scalette/rundown components
│   ├── contexts/       # React Context providers
│   │   ├── AuthContext.js
│   │   ├── CalendarContext.js
│   │   ├── CasparContext.js
│   │   ├── CasparProfileContext.js
│   │   └── RundownContext.js
│   ├── pages/          # Main application views
│   │   ├── Rundown/    # Rundown management page and components
│   │   └── ScaletteEditor/ # Advanced timeline editor
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── styles/         # Theme and styling
│   ├── config/         # Configuration files
│   ├── App.js          # Main app component
│   └── index.js        # App entry point
├── package.json        # Client dependencies and scripts
└── .gitignore         # Client-specific ignores
```

## Server Structure (`/server/`)
```
server/
├── caspar/             # CasparCG integration modules
│   ├── casparClient.js # TCP client for CasparCG communication
│   ├── oscClient.js    # OSC protocol implementation
│   └── profileManager.js # Multi-server profile management
├── config/             # Configuration files
├── server.js          # Main Express server with Socket.IO
├── config.js          # Server configuration
├── package.json       # Server dependencies
└── *.json             # Test rundown data files
```

## Key Entry Points
- **Frontend**: `client/src/index.js` → `client/src/App.js`
- **Backend**: `server/server.js`
- **Database**: Supabase integration via client/server SDKs
- **CasparCG**: `server/caspar/casparClient.js`