// Thin IndexedDB wrapper for stashing a pre-auth file.

const DB_NAME = "plain_pending";
const STORE = "files";
const FILE_KEY = "pending_file";
const META_KEY = "plain_pending_meta";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePendingFile(
  file: File,
  meta: { model: string; speakerCount: string },
) {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, FILE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  sessionStorage.setItem(
    META_KEY,
    JSON.stringify({ name: file.name, size: file.size, ...meta }),
  );
}

export async function loadPendingFile(): Promise<File | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(FILE_KEY);
      req.onsuccess = () => resolve((req.result as File) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export function loadPendingMeta() {
  try {
    const raw = sessionStorage.getItem(META_KEY);
    return raw
      ? (JSON.parse(raw) as {
          name: string;
          size: number;
          model: string;
          speakerCount: string;
        })
      : null;
  } catch {
    return null;
  }
}

export async function clearPending() {
  sessionStorage.removeItem(META_KEY);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(FILE_KEY);
  } catch {
    // best-effort
  }
}
