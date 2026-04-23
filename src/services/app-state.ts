import { Task } from "../app/types";

export type NotificationSyncSettings = {
  enabled: boolean;
  repeatEnabled: boolean;
  startTime: string;
  endTime: string;
  repeatIntervalHours: number;
};

export type AppSyncPayload = {
  version: number;
  timestamp: string;
  tasks: Task[];
  settings: NotificationSyncSettings;
  themePreference: "dark" | "light" | "system";
};

function ensureTaskLastModified(task: Task): Task {
  return {
    ...task,
    lastModified: task.lastModified ?? new Date().toISOString(),
  };
}

function compareModifiedDates(a: Task, b: Task) {
  const aTime = Date.parse(a.lastModified);
  const bTime = Date.parse(b.lastModified);
  return aTime - bTime;
}

export function createSyncPayload(
  tasks: Task[],
  settings: NotificationSyncSettings,
  themePreference: "dark" | "light" | "system"
): AppSyncPayload {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    tasks: tasks.map(ensureTaskLastModified),
    settings,
    themePreference,
  };
}

export function mergeSyncPayloads(local: AppSyncPayload, remote: AppSyncPayload): AppSyncPayload {
  const taskMap = new Map<string, Task>();

  local.tasks.forEach((task) => {
    taskMap.set(task.id, ensureTaskLastModified(task));
  });

  remote.tasks.forEach((remoteTask) => {
    const existing = taskMap.get(remoteTask.id);
    const normalizedRemote = ensureTaskLastModified(remoteTask);

    if (!existing) {
      taskMap.set(normalizedRemote.id, normalizedRemote);
      return;
    }

    const newerTask = compareModifiedDates(existing, normalizedRemote) >= 0 ? existing : normalizedRemote;
    taskMap.set(normalizedRemote.id, {
      ...newerTask,
      completed: existing.completed || normalizedRemote.completed,
      lastModified: newerTask.lastModified,
    });
  });

  const mergedTasks = Array.from(taskMap.values()).sort((a, b) => compareModifiedDates(b, a));

  return {
    version: Math.max(local.version, remote.version) + 1,
    timestamp: new Date().toISOString(),
    tasks: mergedTasks,
    settings: local.settings ?? remote.settings,
    themePreference: local.themePreference || remote.themePreference,
  };
}
