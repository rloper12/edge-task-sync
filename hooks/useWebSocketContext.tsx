import { SyncSuccessToast } from '@/components/sync-success-toast';
import { config } from '@/lib/config';
import * as localTasksModule from '@/lib/data/local/tasks';
import { setWebSocketConnection } from '@/lib/data/tasksController';
import { Task } from '@/types/task';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useConnectionContext } from './useConnectionContext';

type WebSocketMessage = 
  | { type: 'sync'; data: Task[] }
  | { type: 'add'; data: Task }
  | { type: 'update'; data: Task }
  | { type: 'delete'; data: { id: string; success?: boolean } }
  | { type: 'connected'; message: string }
  | { type: 'error'; message: string; details?: any };

type WebSocketContextType = {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (message: WebSocketMessage) => Promise<void>;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used inside of WebSocketContextProvider');
  }
  return context;
};

export const WebSocketContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { isWifiConnected, setIsServerConnected } = useConnectionContext();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isSyncingRef = useRef(false);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const INITIAL_RECONNECT_DELAY = 1000; // 1 second

  const sendMessage = useCallback(async (message: WebSocketMessage): Promise<void> => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleServerMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data as string);
      
      switch (message.type) {
        case 'connected':
          console.log('WebSocket connected:', message.message);
          break;

        case 'sync':
          console.log('Received sync response:', message.data.length, 'tasks');
          const syncedTasks = message.data;
          
          // Remove all local tasks
          const currentLocalTasks = localTasksModule.getAllTasks();
          for (const localTask of currentLocalTasks) {
            localTasksModule.deleteTask(localTask.id);
          }
          // Add all synced tasks from server
          for (const task of syncedTasks) {
            localTasksModule.addTask(task);
          }
          
          isSyncingRef.current = false;
          // Show success toast
          setSyncSuccessMessage(`Sync successful: ${syncedTasks.length} task${syncedTasks.length !== 1 ? 's' : ''} synced`);
          break;

        case 'add':
          console.log('Received add broadcast:', message.data.id);
          const existingTask = localTasksModule.getTask(message.data.id);
          if (!existingTask) {
            localTasksModule.addTask(message.data);
          } else {
            if (message.data.updatedAt > existingTask.updatedAt) {
              const { id, ...updates } = message.data;
              localTasksModule.updateTask(message.data.id, updates);
            }
          }
          break;

        case 'update':
          console.log('Received update broadcast:', message.data.id);
          const taskToUpdate = localTasksModule.getTask(message.data.id);
          if (taskToUpdate) {
            // Update if server version is newer or same
            if (message.data.updatedAt >= taskToUpdate.updatedAt) {
              const { id, ...updates } = message.data;
              localTasksModule.updateTask(message.data.id, updates);
            }
          } else {
            // Task doesn't exist locally, add it
            localTasksModule.addTask(message.data);
          }
          break;

        case 'delete':
          console.log('Received delete broadcast:', message.data.id);
          localTasksModule.deleteTask(message.data.id);
          break;

        case 'error':
          // Log silently to avoid showing error overlays for expected network issues
          console.log('WebSocket error (handled):', message.message, message.details);
          isSyncingRef.current = false;
          break;

        default:
          console.warn('Unknown message type:', (message as any).type);
      }
    } catch (error) {
      // Log parsing errors silently to avoid showing error overlays
      console.log('Error parsing WebSocket message (handled):', error);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (!isWifiConnected) {
      return;
    }

    setIsConnecting(true);
    console.log('Connecting to WebSocket:', config.wsServerUrl);

    try {
      const ws = new WebSocket(config.wsServerUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection opened');
        setIsConnected(true);
        setIsConnecting(false);
        setIsServerConnected(true);
        reconnectAttemptsRef.current = 0;
        
        setWebSocketConnection(true, sendMessage);
        
        // Trigger sync after connection is established
        if (!isSyncingRef.current) {
          isSyncingRef.current = true;
          const allLocalTasks = localTasksModule.getAllTasks();
          ws.send(JSON.stringify({ type: 'sync', data: allLocalTasks }));
        }
      };

      ws.onmessage = handleServerMessage;

      ws.onerror = (error) => {
        // Log as info instead of error since WiFi disconnection is expected behavior
        console.log('WebSocket connection error (expected when WiFi disconnects):', error);
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        setIsServerConnected(false);
        wsRef.current = null;
        
        // Update with connection status
        setWebSocketConnection(false, null);

        // Attempt to reconnect if WiFi is still connected and we haven't exceeded max attempts
        if (isWifiConnected && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.log('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      // Log connection failures silently to avoid showing error overlays
      console.log('Failed to create WebSocket (handled):', error);
      setIsConnecting(false);
    }
  }, [isWifiConnected, handleServerMessage, sendMessage, setIsServerConnected]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setIsServerConnected(false);
    
    // Update controller with connection status
    setWebSocketConnection(false, null);
  }, [setIsServerConnected]);

  // Connect/disconnect based on WiFi status
  useEffect(() => {
    if (isWifiConnected) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isWifiConnected, connect, disconnect]);

  const contextValue = useMemo(() => ({
    isConnected,
    isConnecting,
    sendMessage,
  }), [isConnected, isConnecting, sendMessage]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
      <SyncSuccessToast
        visible={syncSuccessMessage !== null}
        message={syncSuccessMessage || ''}
        onHide={() => setSyncSuccessMessage(null)}
      />
    </WebSocketContext.Provider>
  );
};
