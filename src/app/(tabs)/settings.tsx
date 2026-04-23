import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useNotificationSettings } from "../notification-context";
import { useTheme } from "../theme-context";
import { useGoogleDrive } from "../google-drive-context";
import { useSync } from "../sync-context";

type ThemeOption = {
  key: "dark" | "light" | "system";
  title: string;
  description: string;
};

const themeOptions: ThemeOption[] = [
  { key: "dark", title: "Dark", description: "Use the dark theme for the app." },
  { key: "light", title: "Light", description: "Use a bright, colorful light theme." },
  { key: "system", title: "System default", description: "Match the device appearance setting." },
];

export default function SettingsScreen() {
  const { themePreference, setThemePreference, colors } = useTheme();
  const [repeatIntervalInput, setRepeatIntervalInput] = useState("");

  const {
    enabled,
    repeatEnabled,
    startTime,
    endTime,
    repeatIntervalHours,
    permissionDenied,
    scheduledCount,
    setNotificationEnabled,
    setRepeatEnabled,
    setStartTime,
    setEndTime,
    setRepeatIntervalHours,
  } = useNotificationSettings();

  const { isSignedIn, isLoading: isAuthLoading, userEmail, signIn, signOut } = useGoogleDrive();
  const { isSyncing, lastSyncTime, syncError, autoSyncEnabled, setAutoSyncEnabled, triggerSync } = useSync();

  // Sync local input state with setting value
  useEffect(() => {
    setRepeatIntervalInput(repeatIntervalHours?.toString() || "1");
  }, [repeatIntervalHours]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerSection, { backgroundColor: colors.background }]}> 
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Settings</Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>App Theme</Text>

        <View style={[styles.optionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        {themeOptions.map((option) => {
          const selected = option.key === themePreference;
          return (
            <Pressable
              key={option.key}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? colors.accent : colors.surfaceAlt,
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setThemePreference(option.key)}
            >
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>{option.title}</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{option.description}</Text>
              </View>
              <MaterialCommunityIcons
                name={selected ? "radiobox-marked" : "radiobox-blank"}
                size={24}
                color={selected ? colors.background : colors.textSecondary}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 24 }]}>Task reminders</Text>

      <View style={[styles.optionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={styles.optionRow}>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Enable task reminders</Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>Receive alerts for today’s pending tasks during your chosen notification window.</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setNotificationEnabled}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={enabled ? colors.surface : colors.surfaceAlt}
          />
        </View>

        {permissionDenied && (
          <Text style={[styles.permissionWarning, { color: colors.danger }]}>Notification permission is blocked. Allow notifications from your device settings to use reminders.</Text>
        )}

        {enabled && (
          <Text style={[styles.scheduledInfo, { color: colors.textSecondary }]}>{scheduledCount} notification{scheduledCount !== 1 ? 's' : ''} scheduled.</Text>
        )}

        {enabled && (
          <Pressable
            style={[styles.testButton, { backgroundColor: colors.accent }]}
            onPress={async () => {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Test notification",
                  body: "This is a test reminder.",
                  sound: "default",
                },
                trigger: null, // Send immediately
              });
            }}
          >
            <Text style={[styles.testButtonText, { color: colors.accentText }]}>Send test notification</Text>
          </Pressable>
        )}

        <View style={[styles.optionSetting, !enabled && styles.disabledOption]}>
          <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Start time</Text>
          <TextInput
            value={startTime}
            onChangeText={(value) => setStartTime(value)}
            placeholder="09:00"
            placeholderTextColor={colors.placeholder}
            style={[styles.timeInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            maxLength={5}
            editable={enabled}
          />
        </View>

        <View style={[styles.optionSetting, !enabled && styles.disabledOption]}>
          <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>End time</Text>
          <TextInput
            value={endTime}
            onChangeText={(value) => setEndTime(value)}
            placeholder="21:00"
            placeholderTextColor={colors.placeholder}
            style={[styles.timeInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
            maxLength={5}
            editable={enabled}
          />
        </View>

        <View style={[styles.optionRow, !enabled && styles.disabledOption]}> 
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Repeat notifications</Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>Send reminders on a repeating schedule after the first notification.</Text>
          </View>
          <Switch
            value={repeatEnabled}
            onValueChange={setRepeatEnabled}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={repeatEnabled ? colors.surface : colors.surfaceAlt}
            disabled={!enabled}
          />
        </View>

        <View style={[styles.optionSetting, (!enabled || !repeatEnabled) && styles.disabledOption]}>
          <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Repeat every</Text>
          <View style={styles.repeatRow}>
            <TextInput
              value={repeatIntervalInput}
              onChangeText={(value) => {
                // Allow empty values during typing
                const digits = value.replace(/[^0-9]/g, "");
                setRepeatIntervalInput(digits);
              }}
              onBlur={() => {
                // When focus is lost, ensure minimum value of 1
                const number = Math.max(1, Number(repeatIntervalInput) || 1);
                setRepeatIntervalHours(number);
                setRepeatIntervalInput(number.toString());
              }}
              onFocus={() => {
                // When focused, sync with current setting value
                setRepeatIntervalInput(repeatIntervalHours?.toString() || "1");
              }}
              placeholder="2"
              placeholderTextColor={colors.placeholder}
              style={[styles.repeatInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
              keyboardType="numeric"
              maxLength={2}
              editable={enabled && repeatEnabled}
            />
            <Text style={[styles.repeatUnit, { color: colors.textSecondary }]}>hours</Text>
          </View>
        </View>

        <Text style={[styles.optionDescription, { color: colors.textSecondary, marginTop: 8 }]}>Notifications are only sent between the start and end times, and only if you have pending tasks today.</Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 24 }]}>Google Drive Sync</Text>
      <View style={[styles.optionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={styles.optionRow}>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Sync with Google Drive</Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>Back up your tasks and app settings to your Drive account.</Text>
          </View>
          {isAuthLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.syncButton,
                { backgroundColor: isSignedIn ? colors.surfaceAlt : colors.accent },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.88 },
              ]}
              onPress={isSignedIn ? signOut : signIn}
            >
              <Text style={[styles.syncButtonText, { color: isSignedIn ? colors.textPrimary : colors.accentText }]}>
                {isSignedIn ? "Sign out" : "Sign in"}
              </Text>
            </Pressable>
          )}
        </View>

        {isSignedIn && (
          <Text style={[styles.optionDescription, { color: colors.textSecondary, marginBottom: 12 }]}>Connected as {userEmail ?? "Google user"}.</Text>
        )}

        <View style={[styles.optionRow, { paddingVertical: 12 }]}> 
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Daily auto sync</Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>When signed in, sync will run automatically once per day.</Text>
          </View>
          <Switch
            value={autoSyncEnabled}
            onValueChange={setAutoSyncEnabled}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={autoSyncEnabled ? colors.surface : colors.surfaceAlt}
            disabled={!isSignedIn}
          />
        </View>

        {isSignedIn && autoSyncEnabled && (
          <Text style={[styles.optionDescription, { color: colors.textSecondary, marginBottom: 12, fontStyle: 'italic' }]}>
            Background sync is enabled and will run daily
          </Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.syncButton,
            { backgroundColor: colors.accent },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.88 },
          ]}
          onPress={triggerSync}
          disabled={!isSignedIn || isSyncing}
        >
          <Text style={[styles.syncButtonText, { color: colors.accentText }]}>Sync now</Text>
        </Pressable>

        {lastSyncTime && (
          <Text style={[styles.optionDescription, { color: colors.textSecondary, marginTop: 10 }]}>Last synced {new Date(lastSyncTime).toLocaleString()}</Text>
        )}

        {syncError && (
          <Text style={[styles.permissionWarning, { color: colors.danger, marginTop: 10 }]}>{syncError}</Text>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
  },
  optionsContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 12,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  optionSetting: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "transparent",
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  timeInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  repeatRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  repeatInput: {
    width: 72,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    marginRight: 10,
  },
  repeatUnit: {
    fontSize: 15,
    fontWeight: "600",
  },
  permissionWarning: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  scheduledInfo: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  testButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  syncButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  disabledOption: {
    opacity: 0.55,
  },
});
