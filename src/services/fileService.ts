import * as FileSystem from 'expo-file-system/legacy';

const FS: any = FileSystem;
const ATTACHMENTS_DIR = FS.documentDirectory + 'attachments/';

export async function ensureDir() {
  const dirInfo = await FS.getInfoAsync(ATTACHMENTS_DIR);
  if (!dirInfo.exists) {
    await FS.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
  }
}

export async function saveAttachment(uri: string, name: string): Promise<{ id: string; uri: string }> {
  await ensureDir();
  const ext = name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
  const dest = ATTACHMENTS_DIR + fileName;
  await FS.copyAsync({ from: uri, to: dest });
  return { id: fileName, uri: dest };
}

export async function deleteAttachment(uri: string) {
  const fileInfo = await FS.getInfoAsync(uri);
  if (fileInfo.exists) {
    await FS.deleteAsync(uri, { idempotent: true });
  }
}