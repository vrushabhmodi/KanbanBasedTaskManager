import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Settings</Text>
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
});
