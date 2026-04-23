import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

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
  permissionGranted: boolean;
  permissionDenied: boolean;
  permissionStatus: Notifications.PermissionStatus | null;
  scheduledCount: number;
};

const NOTIFICATION_STORAGE_KEY = "KBTM_NOTIFICATION_SETTINGS";

const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  repeatEnabled: false,
  startTime: "09:00",
  endTime: "21:00",
  repeatIntervalHours: 2,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NotificationContext = createContext<NotificationContextType | null>(null);

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value) && value.slice(0, 2) >= "00" && value.slice(0, 2) <= "23" && value.slice(3) >= "00" && value.slice(3) <= "59";
}

function parseTime(value: string) {
  if (!isValidTime(value)) {
    return null;
  }

  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  return { hour, minute };
}

function getMinuteValues(startTime: string, endTime: string, intervalHours: number, repeatEnabled: boolean) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (!start || !end) {
    return [];
  }

  if (!repeatEnabled) {
    return [start.hour * 60 + start.minute];
  }

  const intervalMinutes = Math.max(1, Math.floor(intervalHours)) * 60;
  if (intervalMinutes <= 0) {
    return [start.hour * 60 + start.minute];
  }

  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  const values: number[] = [];

  if (endMinutes >= startMinutes) {
    let current = startMinutes;
    while (current <= endMinutes) {
      values.push(current);
      current += intervalMinutes;
    }
  } else {
    let current = startMinutes;
    while (current < 24 * 60) {
      values.push(current);
      current += intervalMinutes;
    }
    current = current % (24 * 60);
    while (current <= endMinutes) {
      values.push(current);
      current += intervalMinutes;
    }
  }

  return values.length > 0 ? values : [startMinutes];
}

function buildNotificationContent() {
  const content = {
    title: "Task reminder",
    body: "Open the app to check your pending tasks for today.",
    sound: "default",
  } as const;

  if (Platform.OS === "android") {
    return {
      ...content,
      channelId: "task-reminders",
    };
  }

  return content;
}

async function createAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync("task-reminders", {
      name: "Task reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF9F1C",
    });
  } catch (error) {
    console.warn("Failed to create notification channel", error);
  }
}

async function ensurePermissions() {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === Notifications.PermissionStatus.GRANTED) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === Notifications.PermissionStatus.GRANTED;
  } catch (error) {
    console.warn("Notification permission check failed", error);
    return false;
  }
}

function getUpcomingMinuteValues(startTime: string, endTime: string, intervalHours: number, repeatEnabled: boolean) {
  const allMinutes = getMinuteValues(startTime, endTime, intervalHours, repeatEnabled);
  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes();

  const futureMinutes = allMinutes.filter((value) => value > currentMinute);
  if (futureMinutes.length > 0) {
    return futureMinutes;
  }

  return allMinutes;
}

async function scheduleTaskNotifications(enabled: boolean, repeatEnabled: boolean, startTime: string, endTime: string, repeatIntervalHours: number) {
  if (!enabled || !isValidTime(startTime) || !isValidTime(endTime)) {
    return 0;
  }

  if (Platform.OS === "web") {
    return 0;
  }

  const minutes = getUpcomingMinuteValues(startTime, endTime, repeatIntervalHours, repeatEnabled);
  if (minutes.length === 0) {
    return 0;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  await createAndroidChannel();

  await Promise.all(
    minutes.map((minuteValue) => {
      const hour = Math.floor(minuteValue / 60);
      const minute = minuteValue % 60;

      return Notifications.scheduleNotificationAsync({
        content: buildNotificationContent(),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    })
  );

  return minutes.length;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(defaultNotificationSettings.enabled);
  const [repeatEnabled, setRepeatEnabled] = useState(defaultNotificationSettings.repeatEnabled);
  const [startTime, setStartTime] = useState(defaultNotificationSettings.startTime);
  const [endTime, setEndTime] = useState(defaultNotificationSettings.endTime);
  const [repeatIntervalHours, setRepeatIntervalHours] = useState(defaultNotificationSettings.repeatIntervalHours);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
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
        console.warn("Failed to load notification settings (this may be expected in development)", error);
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
      console.warn("Failed to save notification settings (this may be expected in development)", error);
    });
  }, [enabled, repeatEnabled, startTime, endTime, repeatIntervalHours, isReady]);

  useEffect(() => {
    async function loadPermissionState() {
      const existing = await Notifications.getPermissionsAsync();
      setPermissionGranted(existing.status === Notifications.PermissionStatus.GRANTED);
      setPermissionStatus(existing.status);
    }

    if (isReady) {
      loadPermissionState();
    }
  }, [isReady]);

  useEffect(() => {
    async function syncNotifications() {
      if (!isReady) {
        return;
      }

      if (!enabled) {
        if (Platform.OS !== "web") {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
        setScheduledCount(0);
        return;
      }

      const permission = await ensurePermissions();
      setPermissionGranted(permission);
      setPermissionStatus(permission ? Notifications.PermissionStatus.GRANTED : Notifications.PermissionStatus.DENIED);

      if (!permission) {
        setEnabled(false);
        setScheduledCount(0);
        return;
      }

      const count = await scheduleTaskNotifications(enabled, repeatEnabled, startTime, endTime, repeatIntervalHours);
      setScheduledCount(count);
    }

    syncNotifications();
  }, [enabled, repeatEnabled, startTime, endTime, repeatIntervalHours, isReady]);

  const value = useMemo(
    () => ({
      enabled,
      repeatEnabled,
      startTime,
      endTime,
      repeatIntervalHours,
      permissionGranted,
      permissionDenied: permissionStatus === Notifications.PermissionStatus.DENIED,
      permissionStatus,
      scheduledCount,
      setNotificationEnabled: setEnabled,
      setRepeatEnabled,
      setStartTime,
      setEndTime,
      setRepeatIntervalHours: (value: number) => {
        setRepeatIntervalHours(value >= 1 ? value : 1);
      },
    }),
    [enabled, repeatEnabled, startTime, endTime, repeatIntervalHours, permissionGranted, permissionStatus, scheduledCount]
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
