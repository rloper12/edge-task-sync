# Edge Task Sync

A local-first task management application with real-time synchronization across multiple devices via WebSocket. Built with React Native (Expo), SQLite, and Bun.

## Table of Contents

- [App Overview](#app-overview)
- [System Architecture](#system-architecture)
- [File Layout](#file-layout)
- [Connection & Running Guide](#connection--running-guide)

## App Overview

### What is Edge Task Sync?

Edge Task Sync is a task management application that prioritizes local data storage and offline functionality. The app maintains a local SQLite database on each device and synchronizes changes with a central server when a WiFi connection is available. This ensures users can always access and modify their tasks, even when offline.

### Key Design Decisions

#### 1. **Local-First Architecture**
- **Always read from local database**: The app never blocks on network requests for reading data
- **Immediate UI updates**: All mutations update the local database first, providing instant feedback
- **Offline-first**: The app is fully functional without network connectivity

#### 2. **Connection-Dependent Mutations**
- **Server connected**: Mutations are broadcast via WebSocket to all connected clients AND applied locally
- **Server disconnected**: Mutations are applied locally only, queued for sync when connection is restored
- **Automatic sync on server connect**: When a WebSocket connection is established, the client sends all local tasks to the server for synchronization

#### 3. **Timestamp-Based Conflict Resolution**
- Tasks include `createdAt` and `updatedAt` timestamps
- During sync, conflicts are resolved by comparing timestamps (newer version wins)
- Server merges local and server tasks, keeping the most recent version of each task

#### 4. **WebSocket Real-Time Synchronization**
- Uses WebSocket for bidirectional, real-time communication
- All mutations (add, update, delete) are broadcast to all connected clients
- Clients receive updates and apply them to their local database automatically

#### 5. **WiFi-Only Connection Policy**
- WebSocket connections are only established when connected to WiFi
- Uses `@react-native-community/netinfo` to monitor network state
- Automatically connects/disconnects based on WiFi availability

### Important Notes / Future improvement

- **No Authentication**: The current implementation does not include user authentication. All clients share the same task database.
- **No Groups/Data Partition**: Currently all tasks exist for all users. Would want to add groups that users can join and authenticate into.
- **Reconnection Strategy**: Implements exponential backoff with a maximum of 5 reconnection attempts. This retry does not function in the case the server goes offline and then back up.
- **Data Size**: Current implementation sends entire data set to sync. Optimally, you'd want to send only changed data to minimize payload and sync compute.
- **Stale Data**: Current implementation syncs all data reguardless of how old/stale it is. Ideally you'd want to introduce a limit on how old data can be.
- **Global State Pattern**: The `tasksController.ts` uses a global state pattern to track WebSocket connection status. This is noted as a TODO for improvement.
- **Error Handling**: Network errors are logged silently to avoid showing error overlays for expected network disconnections.


## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile App (Expo)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React Native UI                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  Home Screen │  │ Tasks Screen │  │  Components  │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │   │
│  └─────────┼─────────────────┼──────────────────┼──────────┘   │
│            │                 │                  │                │
│  ┌─────────▼─────────────────▼──────────────────▼──────────┐   │
│  │              Tasks Controller (tasksController.ts)        │   │
│  │  • Routes mutations based on connection status           │   │
│  │  • Always reads from local database                      │   │
│  └─────────┬────────────────────────────────────────────────┘   │
│            │                                                      │
│  ┌─────────▼────────────────────────────────────────────────┐   │
│  │         Local Data Layer (lib/data/local/)               │   │
│  │  • SQLite database (expo-sqlite)                        │   │
│  │  • CRUD operations for tasks                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Connection Management                             │   │
│  │  ┌──────────────────┐  ┌────────────────────────────┐   │   │
│  │  │ ConnectionContext│  │  WebSocketContext          │   │   │
│  │  │ • WiFi monitoring│  │  • WebSocket connection    │   │   │
│  │  │ • NetInfo        │  │  • Message handling        │   │   │
│  │  └──────────────────┘  │  • Auto-reconnect          │   │   │
│  │                        └────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ WebSocket (ws://)
                                │ (WiFi only)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Server (Bun + Hono)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              WebSocket Handler                           │   │
│  │  • Client connection management                          │   │
│  │  • Message routing (sync, add, update, delete)           │   │
│  │  • Broadcast to all connected clients                    │   │
│  └─────────┬────────────────────────────────────────────────┘   │
│            │                                                      │
│  ┌─────────▼────────────────────────────────────────────────┐   │
│  │         Server Data Layer (lib/data/server/)            │   │
│  │  • SQLite database (Bun native)                         │   │
│  │  • CRUD operations                                     │   │
│  │  • Conflict resolution (timestamp-based)                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              HTTP Endpoints                              │   │
│  │  • GET /api/tasks - List all tasks                      │   │
│  │  • GET /api/tasks/:id - Get single task                 │   │
│  │  • GET /db-view - Database viewer (web UI)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Reading Tasks
```
UI Component → tasksController.getAllTasks() → local/tasks.getAllTasks() → SQLite → UI
```

#### Adding a Task (Server Connected)
```
UI → tasksController.addTask() → WebSocket.send({type: "add"}) 
  → Server receives → Server saves to DB → Server broadcasts to all clients
  → Other clients receive → Update local DB → UI updates
  → Original client → local/tasks.addTask() → SQLite → UI updates
```

#### Adding a Task (Server Disconnected)
```
UI → tasksController.addTask() → local/tasks.addTask() → SQLite → UI updates
(Queued for sync when connection restored)
```

#### Synchronization Flow
```
Client connects → WebSocket opens → Client sends {type: "sync", data: allLocalTasks}
  → Server merges local + server tasks (timestamp comparison)
  → Server saves merged results → Server broadcasts merged results
  → Client receives → Replaces all local tasks with merged results → UI updates
```

## File Layout

```
edge-task-sync/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Home screen
│   └── tasks.tsx                # Tasks management screen
│
├── components/                   # Reusable React components
│   ├── external-link.tsx        # External link component
│   ├── sync-success-toast.tsx  # Toast notification for sync
│   ├── themed-text.tsx          # Theme-aware text component
│   ├── themed-view.tsx          # Theme-aware view component
│   ├── wifi-status-banner.tsx  # Connection status indicator
│   └── ui/                      # UI primitives
│       ├── collapsible.tsx
│       ├── icon-symbol.tsx
│       └── icon-symbol.ios.tsx
│
├── constants/
│   └── theme.ts                 # Theme colors and constants
│
├── hooks/                       # Custom React hooks
│   ├── use-color-scheme.ts     # Color scheme detection
│   ├── use-color-scheme.web.ts # Web-specific color scheme
│   ├── use-theme-color.ts       # Theme color hook
│   ├── useConnectionContext.tsx # WiFi/connection state
│   ├── useSyncNotificationContext.tsx # Sync notification state
│   └── useWebSocketContext.tsx  # WebSocket connection
│
├── lib/
│   ├── config.ts                # Server configuration
│   ├── data/
│   │   ├── tasksController.ts   # Main controller - routes
│   │   ├── local/               # Local (client) data layer
│   │   │   ├── sqlite.ts        # SQLite database initialization
│   │   │   └── tasks.ts         # Local task CRUD operations
│   │   └── server/              # Server data layer
│   │       ├── sqlite.ts        # Server SQLite database
│   │       └── serverTasks.ts   # Server task CRUD operations
│
├── types/
│   └── task.ts                  # Task TypeScript interface
│
├── views/
│   └── db-view.html             # Database viewer web UI
│
├── big-peer.ts                  # Server entry point(Bun + Hono)
├── server.db                    # Server SQLite database file
├── app.json                     # Expo configuration
├── package.json                 # Dependencies and scripts
└── tsconfig.json                # TypeScript configuration
```

### Key Files Explained

- **`app/_layout.tsx`**: Sets up React context providers (ConnectionContext, WebSocketContext) and initializes the local database
- **`lib/data/tasksController.ts`**: Central controller that decides whether to broadcast mutations via WebSocket based on connection status
- **`hooks/useWebSocketContext.tsx`**: Manages WebSocket lifecycle, reconnection logic, and message handling
- **`hooks/useConnectionContext.tsx`**: Monitors WiFi connection status using NetInfo
- **`big-peer.ts`**: Bun server that handles WebSocket connections, HTTP endpoints, and database operations
- **`lib/config.ts`**: Configuration for WebSocket server URL (configured via `.env` file)

## Connection & Running Guide

### Prerequisites

- **Node.js** (v18+) or **Bun** (latest)
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (for iOS) or **Android Emulator** (for Android), or a physical device
- Devices/emulators and server must be on the same WiFi network

### Step 1: Install Dependencies

```bash
# Install client dependencies
npm install
# or
bun install
```

### Step 2: Configure Server URL

Create a `.env` file in the project root (you can copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set your server configuration:

```env
# Expo requires EXPO_PUBLIC_ prefix for client-side environment variables
EXPO_PUBLIC_WS_SERVER_URL=ws://localhost:3000/api/tasks/ws
EXPO_PUBLIC_BASE_SERVER_URL=http://localhost:3000

# Server-side variables (used by Bun server)
PORT=3000
WS_SERVER_URL=ws://localhost:3000/api/tasks/ws
BASE_SERVER_URL=http://localhost:3000
```

**Important**: 
- **Expo Requirement**: Client-side variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the React Native app
- For **iOS Simulator/Web/Android Emulator**: Use `localhost` (default)
- For **physical devices**: Replace `localhost` with your machine's local IP address in **both** `EXPO_PUBLIC_*` and regular variables

To find your IP address:
- **macOS/Linux**: Run `ifconfig` or `ip addr` and look for your WiFi adapter's IP
- **Windows**: Run `ipconfig` and look for IPv4 Address under your WiFi adapter

Example for a physical device:
```env
EXPO_PUBLIC_WS_SERVER_URL=ws://192.168.1.100:3000/api/tasks/ws
EXPO_PUBLIC_BASE_SERVER_URL=http://192.168.1.100:3000
WS_SERVER_URL=ws://192.168.1.100:3000/api/tasks/ws
BASE_SERVER_URL=http://192.168.1.100:3000
```

### Step 3: Start the Server

In one terminal, start the Bun server:

```bash
# Using Bun (recommended)
bun run dev:big-peer

# Or run directly
bun run --hot big-peer.ts
```

The server will start on port 3000 (or the port specified in `PORT` environment variable). You should see:

```
Server running on http://0.0.0.0:3000
Database viewer: http://localhost:3000/db-view
WebSocket endpoint: ws://localhost:3000/api/tasks/ws
```

### Step 4: Start the Expo App

In another terminal, start the Expo development server:

```bash
npm start
# or
expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan the QR code with Expo Go app on your physical device
- Press `w` for web browser

### Step 5: Verify Connection

1. **Check WiFi Status**: The app displays a status banner at the bottom:
   - 🔴 **Red**: Offline (no WiFi)
   - 🟡 **Yellow**: WiFi connected but server not connected
   - 🟢 **Green**: Connected to server

2. **Test Synchronization**:
   - Open the app on multiple devices/emulators
   - Create a task on one device
   - It should appear on all other connected devices within seconds
   - Disconnect WiFi and create a task - it should only appear locally
   - Reconnect WiFi - tasks should sync automatically

3. - **Database Viewer**: The server includes a web-based database viewer accessible at `/db-view` for debugging and monitoring.

### Troubleshooting

#### Server Not Connecting

1. **Check Configuration**: Ensure `.env` file has the correct server URL (use your IP for physical devices, localhost for simulators)
2. **Check Firewall**: Ensure port 3000 is not blocked
3. **Check Network**: Ensure server and devices are on the same WiFi network
4. **Check Server Logs**: Look for connection errors in the server terminal

#### WebSocket Connection Fails

1. **Verify Server is Running**: Check that `big-peer.ts` is running and shows the WebSocket endpoint
2. **Check URL Format**: Ensure the WebSocket URL uses `ws://` (not `http://`)
3. **Test in Browser**: Open `http://localhost:3000/db-view` (or your IP) in a browser to verify server accessibility
4. **Check Configuration**: Verify your `.env` file has the correct `WS_SERVER_URL` for your setup (localhost for simulators, your IP for physical devices)

#### Tasks Not Syncing

1. **Check Connection Status**: Look at the WiFi status banner - should be green
2. **Check Server Logs**: Verify messages are being received on the server
3. **Check Browser Console**: Look for WebSocket errors in the Expo debugger
4. **Verify Database**: Use the `/db-view` endpoint to see server-side tasks

### Database Viewer

Access the database viewer at `http://YOUR_IP:3000/db-view` to:
- View all tasks stored on the server
- Monitor real-time updates via WebSocket
- Debug synchronization issues

### Environment Variables

Configuration is managed via the `.env` file. The following variables are available:

```bash
# Client-side variables (React Native/Expo)
# Note: Expo requires EXPO_PUBLIC_ prefix for client-side access
EXPO_PUBLIC_WS_SERVER_URL=ws://localhost:3000/api/tasks/ws
EXPO_PUBLIC_BASE_SERVER_URL=http://localhost:3000

# Server-side variables (Bun server)
PORT=3000
WS_SERVER_URL=ws://localhost:3000/api/tasks/ws
BASE_SERVER_URL=http://localhost:3000
```

**Important Notes**:
- **Expo Requirement**: Variables used in the React Native client must be prefixed with `EXPO_PUBLIC_`
- After modifying `.env`, restart the Expo development server for changes to take effect
- These can also be set as system environment variables, which will override the `.env` file values
- Use `localhost` for simulators/emulators, or your machine's IP for physical devices

### Development Tips

- **Hot Reload**: Both the server (`bun run --hot`) and Expo support hot reloading
- **Database Reset**: Delete `server.db` to reset the server database
- **Local Database**: Each client has its own SQLite database (`mydb.db` in Expo)
- **Logging**: Check browser console (Expo) and server terminal for detailed logs

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
