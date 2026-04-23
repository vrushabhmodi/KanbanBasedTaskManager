const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const SYNC_FILE_NAME = "kbtm-sync.json";

function authHeader(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function findDriveFileId(accessToken: string): Promise<string | null> {
  const query = `name='${SYNC_FILE_NAME}' and trashed = false`;
  const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,modifiedTime)&pageSize=1`;

  const response = await fetch(url, {
    headers: {
      ...authHeader(accessToken),
    },
  });

  if (!response.ok) {
    throw new Error(`Drive query failed with ${response.status}`);
  }

  const result = await response.json();
  return result.files?.[0]?.id ?? null;
}

export async function downloadDriveFile(accessToken: string): Promise<string | null> {
  const fileId = await findDriveFileId(accessToken);
  if (!fileId) {
    return null;
  }

  const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      ...authHeader(accessToken),
    },
  });

  if (!response.ok) {
    throw new Error(`Drive download failed with ${response.status}`);
  }

  return response.text();
}

async function uploadContentToDrive(accessToken: string, content: string, fileId?: string) {
  const boundary = "-------314159265358979323846";
  const metadata = {
    name: SYNC_FILE_NAME,
    mimeType: "application/json",
  };
  const multipartBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const url = fileId
    ? `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=multipart`
    : `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;

  const response = await fetch(url, {
    method: fileId ? "PATCH" : "POST",
    headers: {
      ...authHeader(accessToken),
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    throw new Error(`Drive upload failed with ${response.status}`);
  }

  return response.json();
}

export async function uploadDriveFile(accessToken: string, content: string): Promise<void> {
  const fileId = await findDriveFileId(accessToken);
  await uploadContentToDrive(accessToken, content, fileId ?? undefined);
}
