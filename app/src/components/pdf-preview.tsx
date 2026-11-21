"use client";

import { useEffect, useState } from "react";

interface Props {
  load: (signal: AbortSignal) => Promise<Blob>;
  title: string;
  filename: string;
  label: string;
}

// Callers key this component by the document revision so obsolete links disappear immediately.
export function PdfPreview({ load, title, filename, label }: Props) {
  const [loadRevision] = useState(() => load);
  const [file, setFile] = useState<{ url: string } | { error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let url: string | undefined;
    loadRevision(controller.signal).then(pdf => {
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(pdf);
      setFile({ url });
    }).catch(error => {
      if (controller.signal.aborted) return;
      const message = error?.name === "TemplateMismatchError"
        ? "Wzór ZAM się zmienił. Trzeba ponownie sprawdzić położenie pól."
        : "Nie udało się przygotować podglądu. Odśwież sprawę lub spróbuj ponownie.";
      setFile({ error: message });
    });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [loadRevision, attempt]);

  if (!file) return <p role="status">Przygotowuję podgląd PDF…</p>;
  if ("error" in file) return (
    <p role="alert">
      {file.error}{" "}
      <button type="button" onClick={() => { setFile(null); setAttempt(n => n + 1); }}>Ponów podgląd</button>
    </p>
  );
  return (
    <div>
      <iframe src={file.url + "#toolbar=0&navpanes=0&view=FitH"} title={title}
        style={{ width: "100%", height: "clamp(320px, 65dvh, 800px)", border: "1px solid #d4d7dd", borderRadius: 4 }} />
      <a href={file.url} download={filename}>{label}</a>
    </div>
  );
}
