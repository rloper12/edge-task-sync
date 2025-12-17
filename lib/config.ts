// WebSocket server configuration
// Can be overridden with WS_SERVER_URL environment variable
const WS_SERVER_URL = process.env.WS_SERVER_URL || 'ws://localhost:3000/api/tasks/ws';

export const config = {
  wsServerUrl: WS_SERVER_URL,
};
