import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type WifiContext = {
  isWifiConnected: boolean;
}

const WifiContext = createContext<WifiContext | null>(null);

export const useWifiContext = () => {
  const context = useContext(WifiContext);
  if (!context) {
    throw new Error("useWifiContext must be used inside of WifiContextProvider");
  }
  return context;
}

export const WifiContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isWifiConnected, setIsWifiConnected] = useState(false);
  
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
    isWifiConnected
  }), [isWifiConnected]);
  
  return (
    <WifiContext.Provider value={contextValue}>
      {children}
    </WifiContext.Provider>
  );
}

