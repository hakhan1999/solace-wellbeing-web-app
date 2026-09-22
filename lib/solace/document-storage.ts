const DATABASE_NAME = "solace-documents";
const STORE_NAME = "files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Please close other Solace tabs and try again."));
  });
}

export async function saveDocumentFiles(
  documents: { id: string; file: File }[]
): Promise<void> {
  if (!documents.length) return;

  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readwrite"
      );

      transaction.oncomplete = () => resolve();
      transaction.onabort = () =>
        reject(transaction.error || new Error("File upload failed."));
      transaction.onerror = () =>
        reject(transaction.error || new Error("File upload failed."));

      const store = transaction.objectStore(STORE_NAME);

      documents.forEach(({ id, file }) => {
        store.put(file, id);
      });
    });
  } finally {
    database.close();
  }
}

export async function getDocumentFile(id: string): Promise<Blob> {
  const database = await openDatabase();

  try {
    return await new Promise<Blob>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(id);

      request.onsuccess = () => {
        if (request.result instanceof Blob) {
          resolve(request.result);
        } else {
          reject(new Error("This file is not available in this browser."));
        }
      };

      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}