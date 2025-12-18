import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWifiContext } from '@/hooks/useWifiContext';
import { StyleSheet } from 'react-native';

export function WifiStatusBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWifiConnected } = useWifiContext();

  return (
    <ThemedView
      style={[
        styles.banner,
        {
          backgroundColor: isWifiConnected
            ? colorScheme === 'dark' ? '#1a5a1a' : '#d4edda'
            : colorScheme === 'dark' ? '#5a1a1a' : '#f8d7da',
          borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      ]}
    >
      <IconSymbol
        name={isWifiConnected ? 'wifi' : 'wifi.slash'}
        size={16}
        color={isWifiConnected
          ? colorScheme === 'dark' ? '#90ee90' : '#155724'
          : colorScheme === 'dark' ? '#ff6b6b' : '#721c24'}
      />
      <ThemedText
        style={[
          styles.bannerText,
          {
            color: isWifiConnected
              ? colorScheme === 'dark' ? '#90ee90' : '#155724'
              : colorScheme === 'dark' ? '#ff6b6b' : '#721c24',
          },
        ]}
      >
        {isWifiConnected ? 'Connected to WiFi' : 'Offline'}
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
