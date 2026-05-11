"use client";

import type { Meeting } from "@/types";

const dbName = "relo-offline";
const storeName = "meeting-queue";

export async function queueMeeting(meeting: Meeting) {
  const db = await openDb();
  await tx(db, "readwrite", (store) => store.put({ ...meeting, synced: false }));
}

export async function getQueuedMeetings(): Promise<Meeting[]> {
  const db = await openDb();
  return tx<Meeting[]>(db, "readonly", (store) => store.getAll());
}

export async function clearQueuedMeeting(id: string) {
  const db = await openDb();
  await tx(db, "readwrite", (store) => store.delete(id));
}

export async function syncQueuedMeetings(onSync: (meeting: Meeting) => Promise<void> | void) {
  const meetings = await getQueuedMeetings();
  for (const meeting of meetings) {
    await onSync(meeting);
    await clearQueuedMeeting(meeting.id);
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    transaction.oncomplete = () => resolve(request && "result" in request ? request.result : (undefined as T));
    transaction.onerror = () => reject(transaction.error);
  });
}
