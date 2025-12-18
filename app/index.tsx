import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WifiStatusBanner } from "@/components/wifi-status-banner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleViewTasks = () => {
    router.push({
      pathname: "/tasks",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.welcomeContainer}>
          <ThemedText type="title" style={styles.title}>
            Welcome
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Manage your tasks and stay organized.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.primaryButton,
              { backgroundColor: colorScheme === 'dark' ? '#0a7ea4' : colors.tint },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleViewTasks}
          >
            <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
              View Tasks
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
      <WifiStatusBanner />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 60,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 48,
    gap: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.8,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    gap: 16,
    width: "100%",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});

