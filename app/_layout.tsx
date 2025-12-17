import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { WebSocketContextProvider } from '@/hooks/useWebSocketContext';
import { WifiContextProvider } from '@/hooks/useWifiContext';
import { initializeDatabase } from '@/lib/data/local/sqlite';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initializeDatabase();
  }, []);



  return (
    <WifiContextProvider>
      <WebSocketContextProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen 
              name="tasks" 
              options={{ 
                title: 'Tasks',
                headerShown: true,
              }} 
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </WebSocketContextProvider>
    </WifiContextProvider>
  );
}
