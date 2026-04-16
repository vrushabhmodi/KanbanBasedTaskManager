import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useNotificationSettings } from "../notification-context";
import { useTheme } from "../theme-context";

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

  const {
    enabled,
    repeatEnabled,
    startTime,
    endTime,
    repeatIntervalHours,
    setNotificationEnabled,
    setRepeatEnabled,
    setStartTime,
    setEndTime,
    setRepeatIntervalHours,
  } = useNotificationSettings();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
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
              value={repeatIntervalHours.toString()}
              onChangeText={(value) => {
                const digits = value.replace(/[^0-9]/g, "");
                const number = digits ? Math.max(1, Number(digits)) : 1;
                setRepeatIntervalHours(number);
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
      </ScrollView>
    </View>
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
  headerSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  disabledOption: {
    opacity: 0.55,
  },
});
