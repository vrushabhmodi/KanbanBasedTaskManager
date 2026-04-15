import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";

type ThemePreference = "dark" | "light" | "system";
type ThemeMode = "dark" | "light";

type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  tabBar: string;
  tabBarBorder: string;
  textPrimary: string;
  textSecondary: string;
  muted: string;
  accent: string;
  accentText: string;
  accentPositive: string;
  accentInfo: string;
  danger: string;
  inputBackground: string;
  placeholder: string;
  overlay: string;
};

type ThemeContextType = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  themeMode: ThemeMode;
  colors: ThemeColors;
};

const THEME_STORAGE_KEY = "KBTM_THEME_PREFERENCE";

const themeColors: Record<ThemeMode, ThemeColors> = {
  dark: {
    background: "#0B1120",
    surface: "#111827",
    surfaceAlt: "#1E293B",
    border: "#334155",
    tabBar: "#0F172A",
    tabBarBorder: "#334155",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    muted: "#64748B",
    accent: "#F59E0B",
    accentText: "#0F172A",
    accentPositive: "#10B981",
    accentInfo: "#2563EB",
    danger: "#DC2626",
    inputBackground: "#111827",
    placeholder: "#94A3B8",
    overlay: "rgba(0, 0, 0, 0.45)",
  },
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceAlt: "#E2E8F0",
    border: "#CBD5E1",
    tabBar: "#FFFFFF",
    tabBarBorder: "#E2E8F0",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    muted: "#64748B",
    accent: "#F59E0B",
    accentText: "#0F172A",
    accentPositive: "#10B981",
    accentInfo: "#3B82F6",
    danger: "#DC2626",
    inputBackground: "#FFFFFF",
    placeholder: "#64748B",
    overlay: "rgba(15, 23, 42, 0.1)",
  },
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemScheme(): ThemeMode {
  const scheme = Appearance.getColorScheme();
  return scheme === "light" ? "light" : "dark";
}

function resolveThemeMode(preference: ThemePreference, systemScheme: ThemeMode): ThemeMode {
  return preference === "system" ? systemScheme : preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState<ThemeMode>(getSystemScheme());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadPreference() {
      try {
        const savedValue = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedValue === "dark" || savedValue === "light" || savedValue === "system") {
          setThemePreference(savedValue);
        }
      } catch (error) {
        console.warn("Failed to load theme preference", error);
      } finally {
        setIsReady(true);
      }
    }

    loadPreference();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setSystemScheme(colorScheme === "light" ? "light" : "dark");
      }
    });

    return () => {
      subscription.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    AsyncStorage.setItem(THEME_STORAGE_KEY, themePreference).catch((error) => {
      console.warn("Failed to save theme preference", error);
    });
  }, [themePreference, isReady]);

  const themeMode = resolveThemeMode(themePreference, systemScheme);
  const colors = themeColors[themeMode];

  const value = useMemo(
    () => ({ themePreference, setThemePreference, themeMode, colors }),
    [colors, themeMode, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
