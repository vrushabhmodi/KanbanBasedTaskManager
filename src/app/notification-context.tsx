import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type NotificationSettings = {
  enabled: boolean;
  repeatEnabled: boolean;
  startTime: string;
  endTime: string;
  repeatIntervalHours: number;
};

type NotificationContextType = NotificationSettings & {
  setNotificationEnabled: (enabled: boolean) => void;
  setRepeatEnabled: (enabled: boolean) => void;
  setStartTime: (value: string) => void;
  setEndTime: (value: string) => void;
  setRepeatIntervalHours: (value: number) => void;
};

const NOTIFICATION_STORAGE_KEY = "KBTM_NOTIFICATION_SETTINGS";

const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  repeatEnabled: false,
  startTime: "09:00",
  endTime: "21:00",
  repeatIntervalHours: 2,
};

const NotificationContext = createContext<NotificationContextType | null>(null);

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value) && value.slice(0, 2) >= "00" && value.slice(0, 2) <= "23" && value.slice(3) >= "00" && value.slice(3) <= "59";
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(defaultNotificationSettings.enabled);
  const [repeatEnabled, setRepeatEnabled] = useState(defaultNotificationSettings.repeatEnabled);
  const [startTime, setStartTime] = useState(defaultNotificationSettings.startTime);
  const [endTime, setEndTime] = useState(defaultNotificationSettings.endTime);
  const [repeatIntervalHours, setRepeatIntervalHours] = useState(defaultNotificationSettings.repeatIntervalHours);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const savedValue = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (!savedValue) {
          return;
        }

        const savedSettings = JSON.parse(savedValue) as Partial<NotificationSettings>;

        if (typeof savedSettings.enabled === "boolean") {
          setEnabled(savedSettings.enabled);
        }

        if (typeof savedSettings.repeatEnabled === "boolean") {
          setRepeatEnabled(savedSettings.repeatEnabled);
        }

        if (typeof savedSettings.startTime === "string" && isValidTime(savedSettings.startTime)) {
          setStartTime(savedSettings.startTime);
        }

        if (typeof savedSettings.endTime === "string" && isValidTime(savedSettings.endTime)) {
          setEndTime(savedSettings.endTime);
        }

        if (typeof savedSettings.repeatIntervalHours === "number" && savedSettings.repeatIntervalHours >= 1) {
          setRepeatIntervalHours(savedSettings.repeatIntervalHours);
        }
      } catch (error) {
        console.warn("Failed to load notification settings", error);
      } finally {
        setIsReady(true);
      }
    }

    loadSettings();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const settings: NotificationSettings = {
      enabled,
      repeatEnabled,
      startTime,
      endTime,
      repeatIntervalHours,
    };

    AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings)).catch((error) => {
      console.warn("Failed to save notification settings", error);
    });
  }, [enabled, repeatEnabled, startTime, endTime, repeatIntervalHours, isReady]);

  const value = useMemo(
    () => ({
      enabled,
      repeatEnabled,
      startTime,
      endTime,
      repeatIntervalHours,
      setNotificationEnabled: setEnabled,
      setRepeatEnabled,
      setStartTime,
      setEndTime,
      setRepeatIntervalHours: (value: number) => {
        setRepeatIntervalHours(value >= 1 ? value : 1);
      },
    }),
    [enabled, repeatEnabled, startTime, endTime, repeatIntervalHours]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationSettings() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationSettings must be used within a NotificationProvider");
  }
  return context;
}
