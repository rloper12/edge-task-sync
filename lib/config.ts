// WebSocket server configuration
// Configure via .env file or environment variables
// For physical devices: use your machine's local IP address
// For iOS Simulator/Web/Android Emulator: localhost works fine
// 
// Note: Expo requires EXPO_PUBLIC_ prefix for client-side environment variables
const WS_SERVER_URL = process.env.EXPO_PUBLIC_WS_SERVER_URL || process.env.WS_SERVER_URL || 'ws://localhost:3000/api/tasks/ws';
const BASE_SERVER_URL = process.env.EXPO_PUBLIC_BASE_SERVER_URL || process.env.BASE_SERVER_URL || 'http://localhost:3000';

export const config = {
  wsServerUrl: WS_SERVER_URL,
  baseServerUrl: BASE_SERVER_URL
} as const;
