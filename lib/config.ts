// WebSocket server configuration
// Can be overridden with WS_SERVER_URL environment variable
// For Expo: if Metro is on 10.0.0.22, use that IP for device connections
// For iOS Simulator/Web: localhost works fine
const WS_SERVER_URL = process.env.WS_SERVER_URL ||  `ws://10.0.0.22:3000/api/tasks/ws`;
const BASE_SERVER_URL = process.env.BASE_SERVER_URL || 'http://10.0.0.22:3000'

// 'ws://localhost:3000/api/tasks/ws'
export const config = {
  wsServerUrl: WS_SERVER_URL,
  baseServerUrl: BASE_SERVER_URL
} as const;
