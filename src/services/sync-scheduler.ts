import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { syncAppData } from "./sync-engine";
import { NotificationSyncSettings } from "./app-state";
import { Task } from "../app/types";

const BACKGROUND_SYNC_TASK_NAME = "KBTM_BACKGROUND_SYNC";
const TASKS_STORAGE_KEY = "KBTM_TASKS";
const DELETED_TASKS_STORAGE_KEY = "KBTM_DELETED_TASKS";
const NOTIFICATION_STORAGE_KEY = "KBTM_NOTIFICATION_SETTINGS";
const THEME_STORAGE_KEY = "KBTM_THEME_PREFERENCE";
const SYNC_SETTINGS_KEY = "KBTM_SYNC_SETTINGS";
const GOOGLE_AUTH_STORAGE_KEY = "KBTM_GOOGLE_DRIVE_AUTH";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_CLIENT_ID_ANDROID = "847777426689-a3f579i6464qmvfcpkdp490k8b9jd0on.apps.googleusercontent.com"; // release client ID

type SyncSettings = {
  autoSyncEnabled: boolean;
};

type StoredAuthState = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

async function refreshAccessToken(refreshToken: string): Promise<StoredAuthState | null> {
  try {
    const body = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID_ANDROID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      return null;
    }

    const tokenResult = await response.json();
    if (!tokenResult.access_token) {
      return null;
    }

    return {
      accessToken: tokenResult.access_token,
      refreshToken,
      expiresAt: Date.now() + (Number(tokenResult.expires_in || 3600) * 1000),
    };
  } catch (error) {
    console.warn("Unable to refresh Google Drive access token", error);
    return null;
  }
}

export async function registerBackgroundSyncTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK_NAME, {
        minimumInterval: 24 * 60 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (error) {
    console.warn("Failed to register background sync task", error);
  }
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK_NAME, async () => {
  try {
    const syncSettingsValue = await AsyncStorage.getItem(SYNC_SETTINGS_KEY);
    const syncSettings = syncSettingsValue
      ? (JSON.parse(syncSettingsValue) as Partial<SyncSettings>)
      : { autoSyncEnabled: true };

    if (syncSettings.autoSyncEnabled === false) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const authValue = await AsyncStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
    if (!authValue) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    let authState = JSON.parse(authValue) as StoredAuthState;
    if (!authState.accessToken) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    if (authState.expiresAt && Date.now() > authState.expiresAt - 30000) {
      if (!authState.refreshToken) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const refreshed = await refreshAccessToken(authState.refreshToken);
      if (!refreshed) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      authState = { ...authState, ...refreshed };
      await AsyncStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(authState));
    }

    const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    const tasks = tasksJson ? (JSON.parse(tasksJson) as Task[]) : [];

    const deletedIdsJson = await AsyncStorage.getItem(DELETED_TASKS_STORAGE_KEY);
    const deletedTaskIds = deletedIdsJson ? (JSON.parse(deletedIdsJson) as string[]) : [];

    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const settings = settingsJson
      ? (JSON.parse(settingsJson) as NotificationSyncSettings)
      : {
          enabled: false,
          repeatEnabled: false,
          startTime: "09:00",
          endTime: "21:00",
          repeatIntervalHours: 2,
        };

    const themePreference = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as "dark" | "light" | "system" | null;
    const themeValue = themePreference === "dark" || themePreference === "light" || themePreference === "system" ? themePreference : "system";
    const accessToken = authState.accessToken as string;

    const mergedPayload = await syncAppData(accessToken, tasks, settings, themeValue, deletedTaskIds);

    await Promise.all([
      AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(mergedPayload.tasks)),
      AsyncStorage.setItem(DELETED_TASKS_STORAGE_KEY, JSON.stringify(mergedPayload.deletedTaskIds || [])),
    ]);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.warn("Background sync task failed", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
