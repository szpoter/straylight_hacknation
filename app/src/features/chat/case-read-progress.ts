"use client";

import type { LocalCasePage } from "./case-evidence";

const database = "zusik-case-read-v1";
const store = "pages";
const retention = 24 * 60 * 60 * 1000;

function connect() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(store).createIndex("expiry", "expiresAt");
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("storage_blocked"));
    request.onsuccess = () => resolve(request.result);
  });
}

function change(db: IDBDatabase, action: (pages: IDBObjectStore) => void) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    action(tx.objectStore(store));
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(tx.error);
  });
}

export async function clearCaseReadProgress(caseId: string) {
  const db = await connect();
  try {
    await change(db, pages => pages.delete(IDBKeyRange.bound([caseId], [caseId, []])));
  } finally { db.close(); }
}

export async function openCaseProgress(caseId: string, clientDocumentId: string) {
  // A reselected source and this tab's session are required before the reader opens cached OCR.
  const keyName = "zusik-case-read-tab-key-v1";
  const stored = sessionStorage.getItem(keyName);
  const bytes = stored ? Uint8Array.from(atob(stored), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(32));
  if (!stored) sessionStorage.setItem(keyName, btoa(String.fromCharCode(...bytes)));
  const key = await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
  const tabDigest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const tabId = Array.from(tabDigest, byte => byte.toString(16).padStart(2, "0")).join("");
  const db = await connect();
  const path = [caseId, tabId, clientDocumentId];
  const range = IDBKeyRange.bound(path, [...path, []]);
  try {
    await change(db, pages => {
      const cursor = pages.index("expiry").openKeyCursor(IDBKeyRange.upperBound(Date.now()));
      cursor.onsuccess = () => {
        if (cursor.result) { pages.delete(cursor.result.primaryKey); cursor.result.continue(); }
      };
    });
  } catch (error) { db.close(); throw error; }
  const additionalData = (page: number) => new TextEncoder().encode(JSON.stringify([...path, page]));
  return {
    async save(page: LocalCasePage) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: additionalData(page.page) }, key,
        new TextEncoder().encode(JSON.stringify(page)));
      await change(db, pages => pages.put({ iv, cipher, expiresAt: Date.now() + retention }, [...path, page.page]));
    },
    async load(number: number): Promise<LocalCasePage | undefined> {
      type Entry = { iv: Uint8Array<ArrayBuffer>; cipher: ArrayBuffer; expiresAt: number };
      const entry = await new Promise<Entry | undefined>((resolve, reject) => {
        const req = db.transaction(store).objectStore(store).get([...path, number]);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (!entry || entry.expiresAt <= Date.now()) return;
      try {
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: entry.iv, additionalData: additionalData(number) }, key, entry.cipher);
        return JSON.parse(new TextDecoder().decode(plain)) as LocalCasePage;
      } catch { return; }
    },
    clear: () => change(db, pages => pages.delete(range)),
    close: () => db.close(),
  };
}
