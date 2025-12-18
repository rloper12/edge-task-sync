import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useConnectionContext } from '@/hooks/useConnectionContext';
import { StyleSheet } from 'react-native';

export function WifiStatusBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWifiConnected, isServerConnected } = useConnectionContext();

  // Determine connection state: red (offline), yellow (WiFi only), green (server connected)
  let backgroundColor: string;
  let textColor: string;
  let iconName: string;
  let statusText: string;

  if (!isWifiConnected) {
    // Red: Offline
    backgroundColor = colorScheme === 'dark' ? '#5a1a1a' : '#f8d7da';
    textColor = colorScheme === 'dark' ? '#ff6b6b' : '#721c24';
    iconName = 'wifi.slash';
    statusText = 'Offline';
  } else if (!isServerConnected) {
    // Yellow: WiFi connected but server not connected
    backgroundColor = colorScheme === 'dark' ? '#856404' : '#fff3cd';
    textColor = colorScheme === 'dark' ? '#ffc107' : '#856404';
    iconName = 'wifi';
    statusText = 'Connected to WiFi but not Server';
  } else {
    // Green: Server connected
    backgroundColor = colorScheme === 'dark' ? '#1a5a1a' : '#d4edda';
    textColor = colorScheme === 'dark' ? '#90ee90' : '#155724';
    iconName = 'wifi';
    statusText = 'Connected to Server';
  }

  return (
    <ThemedView
      style={[
        styles.banner,
        {
          backgroundColor,
          borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      ]}
    >
      <IconSymbol
        name={iconName}
        size={16}
        color={textColor}
      />
      <ThemedText
        style={[
          styles.bannerText,
          {
            color: textColor,
          },
        ]}
      >
        {statusText}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
