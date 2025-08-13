# Code Style and Conventions

## JavaScript/React Conventions

### File Structure
- **Components**: Organized by feature in `/client/src/components/`
- **Pages**: Main views in `/client/src/pages/`
- **Contexts**: State management in `/client/src/contexts/`
- **Hooks**: Custom hooks in `/hooks/` subdirectories
- **Utils**: Utility functions in `/client/src/utils/`

### Naming Conventions
- **Components**: PascalCase (e.g., `CasparContext.js`, `RundownProvider`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase (e.g., `casparClientInstance`, `connectionDialogOpen`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `CASPARCG_TEMPLATE_PATH`, `DEBOUNCE_WINDOW_MS`)

### Component Patterns
- **Functional Components**: Uses React hooks and function components
- **Context Pattern**: Extensive use of React Context API for state management
- **Custom Hooks**: Modular hooks for specific functionality (e.g., `useMultiSelection`, `useRundownItems`)

### State Management
- **React Context**: Primary state management approach
- **Local State**: useState for component-specific state
- **Real-time State**: Socket.IO for live updates
- **Persistent State**: Supabase for database persistence

### Import Style
- **ES6 Modules**: Standard import/export syntax
- **Absolute Imports**: No specific configuration shown
- **Grouped Imports**: External libraries, internal components, contexts

## Backend Conventions

### Server Architecture
- **Express.js**: RESTful API patterns
- **Socket.IO**: Real-time event-driven communication
- **Class-based**: CasparClient as ES6 class extending EventEmitter
- **Module Exports**: CommonJS require/module.exports pattern

### Error Handling
- **Try-catch**: Extensive error handling in async operations
- **Logging**: Custom logging with timestamps and contexts
- **Event Emitters**: Error propagation through events

## Code Quality
- **ESLint**: React app configuration with `react-app` and `react-app/jest` extends
- **No TypeScript**: Pure JavaScript codebase
- **Testing**: React Testing Library setup (minimal tests currently)