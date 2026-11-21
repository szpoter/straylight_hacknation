import { randomUUID } from "node:crypto";
import { labels } from "@/lib/sickness/read";
import { sicknessService } from "@/lib/sickness/server";
import { currentSessionId, errorResponse, NO_STORE } from "@/lib/zusik/server";

export const runtime = "nodejs";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await currentSessionId();
    const { id } = await ctx.params;
    const p = session && /^[0-9a-f]{64}$/.test(id) ? await sicknessService().evidence(session, id) : null;
    if (!p) return new Response("Nie znaleziono dokumentu.", { status: 404, headers: NO_STORE });
    const lines = p.text
      .split("\n")
      .map((s) => (s.startsWith("Ustalenie:") ? "<mark>" + escape(s) + "</mark>" : escape(s)));
    const title = escape(labels[p.kind]);
    const nonce = randomUUID();
    // Original page image stays in the importing browser, keyed by this session-bound evidence URL.
    const showOriginal = `
      const request = indexedDB.open("zusik-sickness-evidence", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("pages");
      request.onsuccess = () => {
        const db = request.result;
        const get = db.transaction("pages").objectStore("pages").get(location.pathname);
        get.onsuccess = async () => {
          const original = get.result;
          db.close();
          if (!(original instanceof Blob)) return;
          const main = document.querySelector("main");
          if (original.type === "image/jpeg") {
            const image = document.createElement("img");
            image.alt = "Oryginalna strona z zaimportowanego dokumentu";
            image.style.maxWidth = "100%";
            image.src = URL.createObjectURL(original);
            main.append(image);
          } else if (original.type === "text/plain") {
            const text = document.createElement("pre");
            text.textContent = await original.text();
            main.append(text);
          }
        };
      };`;
    return new Response(
      '<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
        title +
        "</title><body><main><p>Dokument demonstracyjny · strona " +
        p.page +
        "</p><h1>" +
        title +
        "</h1>" +
        (p.manual ? "<p>Fakty wskazane i potwierdzone ręcznie przez rodzica.</p>" : "") +
        '<pre style="white-space:pre-wrap;line-height:1.75">' +
        lines.join("\n") +
        '</pre><a href="/app/chorobowe">Wróć do sprawy</a></main><script nonce="' +
        nonce +
        '">' +
        showOriginal +
        "</script></body></html>",
      {
        headers: {
          ...NO_STORE,
          "content-type": "text/html; charset=utf-8",
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'none'; style-src 'unsafe-inline'; img-src blob:; script-src 'nonce-" +
            nonce +
            "'; frame-ancestors 'self'; base-uri 'none'",
        },
      },
    );
  } catch (e) {
    return errorResponse(e, randomUUID().slice(0, 8));
  }
}
