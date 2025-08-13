# Suggested Commands

## Installation Commands
```bash
# Install all dependencies (root, server, and client)
npm run install-all

# Install dependencies separately
cd server && npm install
cd client && npm install
```

## Development Commands
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

## Build Commands
```bash
# Build client for production
npm run build
cd client && npm run build
```

## Test Commands
```bash
# Run client tests
cd client && npm test
```

## Supabase Database Mode Switching
```bash
# Check current database mode
npm run supabase:status

# Switch to cloud database
npm run supabase:cloud

# Switch to local database  
npm run supabase:local
```

## System Commands (macOS/Darwin)
```bash
# File operations
ls -la          # List files with details
find . -name    # Find files by name
grep -r         # Search in files recursively

# Process management
lsof -ti:3000   # Find process using port 3000
kill -9 $(lsof -ti:3000)  # Kill process on port 3000

# Git operations
git status      # Check git status
git log --oneline  # View commit history
git diff        # Show changes
```