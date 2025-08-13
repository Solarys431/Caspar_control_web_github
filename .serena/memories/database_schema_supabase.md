# Database Schema and Supabase Integration

## Supabase Configuration

### Dual Mode Support
The application supports both **cloud** and **local** Supabase instances with dynamic configuration switching.

#### Cloud Configuration:
- **URL**: `https://wkqhkxzzozgxwkvrindq.supabase.co`
- **Environment Variables**: 
  - `REACT_APP_SUPABASE_CLOUD_URL`
  - `REACT_APP_SUPABASE_CLOUD_ANON_KEY`
  - `SUPABASE_SERVICE_KEY` (backend only)

#### Local Configuration:
- **URL**: `http://127.0.0.1:55321`
- **Environment Variables**:
  - `REACT_APP_SUPABASE_LOCAL_URL` 
  - `REACT_APP_SUPABASE_LOCAL_ANON_KEY`
- **Ports**:
  - API: 55321
  - Database: 55322
  - Studio: 55323
  - Inbucket (Email): 55324

### Mode Switching System
**Location**: `scripts/switch-supabase-mode.js`

The application includes automated scripts for switching between cloud and local databases:
```bash
npm run supabase:cloud    # Switch to cloud database
npm run supabase:local    # Switch to local database  
npm run supabase:status   # Check current mode
```

## Database Schema (Inferred from Code Analysis)

### Core Tables

#### `casparcg_profiles` Table
**Purpose**: Stores CasparCG server profile configurations for multi-server environments.

**Key Fields**:
- `id`: Primary key
- `name`: Profile name
- `is_default_profile`: Boolean flag for default profile selection
- Additional configuration fields for server settings

**Usage**: 
- Profile management in `CasparProfileContext.js`
- Multi-server environment support
- Default profile fallback mechanism

#### `user_profile_preferences` Table  
**Purpose**: User-specific preferences for CasparCG profile selection.

**Key Fields**:
- `user_id`: Foreign key to users table
- `default_casparcg_profile_id`: Foreign key to casparcg_profiles table

**Relationships**:
- Links users to their preferred CasparCG profiles
- Enables personalized broadcast environment settings

#### `profile_server_assignments` Table
**Purpose**: Maps profiles to specific server configurations and roles.

**Key Fields**:
- Profile assignments with server roles (main, preview, backup)
- Server configuration details
- Role-based access control

### Real-time Features

#### Supabase Realtime Integration
The application uses Supabase's real-time subscriptions for:

1. **Collaborative Editing**: 
   - Real-time rundown/playlist updates
   - Multi-user presence tracking
   - Concurrent editing conflict resolution

2. **Live Updates**:
   - Profile configuration changes
   - Server status updates
   - User preference synchronization

#### Real-time Configuration:
```toml
[realtime]
enabled = true
# Real-time subscriptions for collaborative features
```

## Authentication System

### Supabase Auth Configuration
```toml
[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
jwt_expiry = 3600
enable_signup = true
enable_refresh_token_rotation = true
minimum_password_length = 6
```

#### Authentication Features:
- **User Registration/Login**: Email-based authentication
- **Session Management**: 1-hour JWT tokens with refresh rotation
- **Profile Preferences**: User-specific CasparCG profile selections
- **Role-based Access**: Different access levels for broadcast operations

### AuthContext Integration
**Location**: `client/src/contexts/AuthContext.js`

Provides authenticated user context throughout the application, enabling:
- User-specific profile preferences
- Collaborative editing permissions
- Personalized broadcast settings

## Data Flow Architecture

### Frontend → Database:
1. **Profile Selection**: User selects preferred CasparCG profile
2. **Preference Storage**: Choice saved to `user_profile_preferences`
3. **Real-time Sync**: Changes propagated via Supabase real-time
4. **Context Update**: Frontend contexts updated with new preferences

### Backend → Database:
1. **Profile Management**: Server configurations stored in `casparcg_profiles`
2. **Assignment Management**: Role assignments in `profile_server_assignments`
3. **User Preference Retrieval**: Backend queries user preferences for server selection

## Performance Optimizations

### Database Query Patterns:
- **Fallback Logic**: Default profile → first available profile hierarchy
- **Efficient Queries**: Uses `maybeSingle()` to handle optional records
- **Error Handling**: Graceful degradation with comprehensive error catching
- **Caching**: Frontend context caching to minimize database calls

### Real-time Subscription Management:
- **Selective Subscriptions**: Only subscribe to relevant data changes
- **Connection Pooling**: Efficient WebSocket connection management
- **Automatic Reconnection**: Handles network interruptions gracefully

## Storage Configuration

### File Storage Settings:
```toml
[storage]
enabled = true
file_size_limit = "50MiB"
```

**Usage**: 
- Template storage for CasparCG graphics
- Media file metadata storage
- User-uploaded content management

## Development vs Production

### Local Development:
- Full Supabase stack running locally
- Database seeding for test data
- Email testing via Inbucket
- Real-time development with hot reload

### Production (Cloud):
- Hosted Supabase cloud instance
- Production authentication
- Scaled database performance
- Production-ready real-time subscriptions

The database architecture provides a robust foundation for professional broadcast operations with multi-user collaboration, real-time updates, and comprehensive profile management.