# Task Completion Checklist

## When a coding task is completed, run these commands:

### Frontend Tasks
```bash
# Navigate to client directory
cd client

# Run tests (if any exist)
npm test

# Build to check for errors
npm run build

# Check for linting issues (if configured)
npm run lint # (if available)
```

### Backend Tasks  
```bash
# Navigate to server directory
cd server

# Test server startup
npm start # (verify no errors)

# Check with nodemon for development
npm run dev # (if making changes)
```

### Full Application Testing
```bash
# From root directory - start both frontend and backend
npm start

# Verify application loads at http://localhost:3000
# Verify backend API responds at http://localhost:5000
```

### Database Tasks (Supabase)
```bash
# Check current database mode
npm run supabase:status

# Test database connection by running the application
```

### Git Operations (if needed)
```bash
# Check status before committing
git status

# View changes
git diff

# Add and commit changes
git add .
git commit -m "descriptive message"
```

## Pre-deployment Checklist
1. All tests pass
2. Production build succeeds (`npm run build`)
3. No console errors in browser
4. CasparCG connection works (if available)
5. Supabase integration functional
6. Socket.IO real-time features working