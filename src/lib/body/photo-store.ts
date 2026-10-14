const DB_NAME = "yeah-buddy-body";
const STORE = "photos";

export interface BodyPhoto {
  date: string;
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("photo db"));
  });
}

export async function saveBodyPhoto(date: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, date);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("photo save"));
  });
  db.close();
}

export async function listBodyPhotos(): Promise<BodyPhoto[]> {
  const db = await openDb();
  const photos = await new Promise<BodyPhoto[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).openCursor();
    const rows: BodyPhoto[] = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(rows);
        return;
      }
      if (typeof cursor.key === "string" && cursor.value instanceof Blob) {
        rows.push({ date: cursor.key, blob: cursor.value });
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error ?? new Error("photo list"));
  });
  db.close();
  return photos.sort((left, right) => left.date.localeCompare(right.date));
}

export async function deleteBodyPhoto(date: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(date);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("photo delete"));
  });
  db.close();
}
