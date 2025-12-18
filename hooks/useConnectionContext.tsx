import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ConnectionContext = {
  isWifiConnected: boolean;
  isServerConnected: boolean;
  setIsServerConnected: (connected: boolean) => void;
}

const ConnectionContext = createContext<ConnectionContext | null>(null);

export const useConnectionContext = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnectionContext must be used inside of ConnectionContextProvider");
  }
  return context;
}

export const ConnectionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isWifiConnected, setIsWifiConnected] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  
  useEffect(() => {
    // Check initial connection status
    NetInfo.fetch().then(state => {
      setIsWifiConnected(state.isConnected === true && state.type === 'wifi');
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const wifiConnected = state.isConnected === true && state.type === 'wifi';
      setIsWifiConnected(wifiConnected);
      
      if (wifiConnected) {
        console.log('Connected to WIFI - WebSocket will connect automatically');
      } else {
        console.log('Disconnected from WIFI - WebSocket will disconnect');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
  
  const contextValue = useMemo(() => ({
    isWifiConnected,
    isServerConnected,
    setIsServerConnected
  }), [isWifiConnected, isServerConnected]);
  
  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}
