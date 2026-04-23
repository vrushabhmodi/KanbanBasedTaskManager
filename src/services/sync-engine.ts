import { createSyncPayload, mergeSyncPayloads, AppSyncPayload, NotificationSyncSettings } from "./app-state";
import { downloadDriveFile, uploadDriveFile } from "./google-drive-service";
import { Task } from "../app/types";

export async function syncAppData(
  accessToken: string,
  tasks: Task[],
  settings: NotificationSyncSettings,
  themePreference: "dark" | "light" | "system",
  deletedTaskIds: string[] = []
): Promise<AppSyncPayload> {
  const localPayload = createSyncPayload(tasks, settings, themePreference, deletedTaskIds);
  const remoteContent = await downloadDriveFile(accessToken);

  let mergedPayload: AppSyncPayload = localPayload;
  if (remoteContent) {
    try {
      const remotePayload = JSON.parse(remoteContent) as AppSyncPayload;
      mergedPayload = mergeSyncPayloads(localPayload, remotePayload);
    } catch (error) {
      console.warn("Unable to parse remote sync payload", error);
    }
  }

  await uploadDriveFile(accessToken, JSON.stringify(mergedPayload));
  return mergedPayload;
}
