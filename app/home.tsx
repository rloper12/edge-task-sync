import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { getGroupById, placeholderGroups } from "@/data/placeholder";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [groupNumber, setGroupNumber] = useState("");

  const handleEnterGroup = () => {
    router.push({
      pathname: "/tasks",
      params: { groupId: placeholderGroups[1].id },
    });
  };

  const handleEnterGroupNumber = () => {
    if (!groupNumber.trim()) {
      return;
    }

    const groupId = groupNumber.trim().startsWith("group-")
      ? groupNumber.trim()
      : `group-${groupNumber.trim()}`;

    const group = getGroupById(groupId);
    if (group) {
      router.push({
        pathname: "/tasks",
        params: { groupId: group.id },
      });
      setGroupNumber("");
    } else {
      // If group not found, still navigate but show error on tasks page
      router.push({
        pathname: "/tasks",
        params: { groupId: groupId },
      });
      setGroupNumber("");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.welcomeContainer}>
          <ThemedText type="title" style={styles.title}>
            Welcome
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Organize your tasks by groups. Enter your group number to get started.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Enter Group Number</ThemedText>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.icon,
                },
              ]}
              value={groupNumber}
              onChangeText={setGroupNumber}
              placeholder="eg. 1234"
              placeholderTextColor={colors.icon}
              keyboardType="default"
              returnKeyType="go"
              onSubmitEditing={handleEnterGroupNumber}
            />
          </View>
        </ThemedView>

        <ThemedView style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              { borderColor: colors.tint },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleEnterGroup}
          >
            <ThemedText style={[styles.buttonText, { color: colors.tint }]}>
              Enter Group
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
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
  inputContainer: {
    width: "100%",
    marginBottom: 32,
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 56,
  },
  goButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    minWidth: 70,
  },
  goButtonDisabled: {
    opacity: 0.5,
  },
  goButtonText: {
    fontSize: 18,
    fontWeight: "600",
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
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
