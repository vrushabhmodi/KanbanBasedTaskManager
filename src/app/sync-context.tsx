import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTasks } from "./task-context";
import { useNotificationSettings } from "./notification-context";
import { useTheme } from "./theme-context";
import { useGoogleDrive } from "./google-drive-context";
import { syncAppData } from "../services/sync-engine";

const SYNC_SETTINGS_KEY = "KBTM_SYNC_SETTINGS";

type SyncSettings = {
  autoSyncEnabled: boolean;
};

export type SyncContextType = {
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  triggerSync: () => Promise<void>;
};

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { tasks, setTasks } = useTasks();
  const {
    enabled,
    repeatEnabled,
    startTime,
    endTime,
    repeatIntervalHours,
  } = useNotificationSettings();
  const { themePreference } = useTheme();
  const { isSignedIn, getAccessToken } = useGoogleDrive();

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadSyncSettings() {
      try {
        const stored = await AsyncStorage.getItem(SYNC_SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<SyncSettings>;
          if (typeof parsed.autoSyncEnabled === "boolean") {
            setAutoSyncEnabled(parsed.autoSyncEnabled);
          }
        }
      } catch (error) {
        console.warn("Failed to load sync settings", error);
      } finally {
        setIsReady(true);
      }
    }

    loadSyncSettings();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    AsyncStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify({ autoSyncEnabled })).catch((error) => {
      console.warn("Failed to save sync settings", error);
    });
  }, [autoSyncEnabled, isReady]);

  const triggerSync = useCallback(async () => {
    setSyncError(null);

    if (!isSignedIn) {
      setSyncError("Please sign in to Google Drive before syncing.");
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setSyncError("Unable to obtain a valid Google Drive access token.");
      return;
    }

    setIsSyncing(true);
    try {
      const merged = await syncAppData(accessToken, tasks, {
        enabled,
        repeatEnabled,
        startTime,
        endTime,
        repeatIntervalHours,
      }, themePreference);
      setTasks(merged.tasks);
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSyncing(false);
    }
  }, [enabled, endTime, getAccessToken, isSignedIn, repeatEnabled, repeatIntervalHours, setTasks, startTime, tasks, themePreference]);

  useEffect(() => {
    if (!isSignedIn || !autoSyncEnabled) {
      return;
    }

    const syncOnStart = async () => {
      await triggerSync();
    };

    syncOnStart();
  }, [isSignedIn, autoSyncEnabled, triggerSync]);

  const value = useMemo(
    () => ({ isSyncing, lastSyncTime, syncError, autoSyncEnabled, setAutoSyncEnabled, triggerSync }),
    [autoSyncEnabled, isSyncing, lastSyncTime, syncError, triggerSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
