"use client";

import { useEffect, useState } from "react";
import type { MartaView } from "@/lib/marta/types";

const STORE = "copies";
const CHANGED = "zusik-marta-local-copy";
const validScope = (scope: string) => /^[a-f0-9]{64}$/.test(scope);

async function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("zusik-marta-documents", 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function checkedCopy(file: File): Promise<File> {
  if (!file.size || file.size > 25 * 1024 * 1024) throw Error("Wybierz niepusty plik PDF, PNG lub JPEG do 25 MB.");
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const type =
    bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d
      ? "application/pdf"
      : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        ? "image/jpeg"
        : bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
          ? "image/png"
          : null;
  if (!type) throw Error("Ten plik nie jest rozpoznawalnym dokumentem PDF ani obrazem PNG lub JPEG.");
  return new File([file], file.name, { type, lastModified: file.lastModified });
}

export async function storeCopy(scope: string, version: number, file: File, family: "ola" | "legacy" = "ola") {
  if (!validScope(scope)) throw Error("Nie udało się potwierdzić sesji.");
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(file, family === "ola" ? [scope, "ola", version, file.name] : [scope, version, file.name]);
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
    window.dispatchEvent(new Event(CHANGED));
  } finally {
    db.close();
  }
}

async function loadCopy(scope: string, version: number, name: string, family: "ola" | "legacy"): Promise<File | null> {
  if (!validScope(scope)) return null;
  const db = await openDb();
  try {
    return await new Promise<File | null>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(family === "ola" ? [scope, "ola", version, name] : [scope, version, name]);
      req.onsuccess = () => resolve(req.result instanceof File && req.result.name === name ? req.result : null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export function AttachmentLinks({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- release each URL with the corresponding file
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url ? (
    <div>
      <a href={url} target="_blank" rel="noreferrer">
        Otwórz odpis · {file.name}
      </a>
      {" · "}
      <a href={url} download={file.name}>
        Pobierz kopię odpisu
      </a>
    </div>
  ) : null;
}

export function SavedAttachment({ view, scope }: { view: MartaView; scope: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const name = view.attachmentName;
  const family = view.attachmentFamily ?? "legacy";
  const revision = view.attachmentVersion ?? view.version - (view.submitted ? 1 : 0);
  useEffect(() => {
    if (!name) return;
    let active = true;
    const restore = () => {
      void loadCopy(scope, revision, name, family)
        .then((cached) => {
          if (active) setFile(cached);
        })
        .catch(() => {
          if (active) setError("Pamięć plików w tej przeglądarce jest niedostępna.");
        });
    };
    restore();
    window.addEventListener(CHANGED, restore);
    return () => {
      active = false;
      window.removeEventListener(CHANGED, restore);
    };
  }, [scope, name, revision, family]);
  if (!name) return null;
  return (
    <section aria-label="Lokalna kopia odpisu">
      {file ? (
        <>
          <p>Kopia odpisu jest dostępna w tej przeglądarce.</p>
          <AttachmentLinks file={file} />
        </>
      ) : (
        <label>
          Wybierz ponownie lokalny odpis „{name}”.
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={async (event) => {
              const selected = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!selected) return;
              if (selected.name !== name) {
                setError("Wybierz plik o tej samej nazwie co odpis w zatwierdzonym wniosku.");
                return;
              }
              try {
                const copy = await checkedCopy(selected);
                await storeCopy(scope, revision, copy, family);
                setFile(copy);
                setError("");
              } catch {
                setError(
                  "Nie udało się przywrócić kopii. Wybierz PDF, PNG lub JPEG i sprawdź dostęp do pamięci przeglądarki.",
                );
              }
            }}
          />
        </label>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
