import { readFileSync } from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it, vi } from "vitest";
import { renderFormPdf, pdfFilename } from "@/features/documents/pdf";
import type { FormDef } from "@/lib/demo/forms";

const font = (name: string) => new Uint8Array(readFileSync(path.resolve(__dirname, "../public/forms/fonts", name)));
const fonts = { regular: font("DejaVuSans.ttf"), bold: font("DejaVuSans-Bold.ttf") };
const opts = { recipient: "Do pracodawcy", date: "2026-11-21" };
const values = { rodzic: "Łucja Przykładowa", pracodawca: "Firma Przykładowa", miejscowosc: "Łódź", od: "2027-01-04", kopia: "Dołączam" };
const letter: FormDef = {
  name: "Wniosek o udzielenie urlopu",
  fidelity: "Pismo do pracodawcy",
  channels: ["pracodawca"],
  pdf: "letter",
  sections: [{ id: "wniosek", title: "Dane wniosku", fields: [
    { id: "rodzic", label: "Imię i nazwisko", type: "text", required: true },
    { id: "pracodawca", label: "Pracodawca", type: "text" },
    { id: "miejscowosc", label: "Miejscowość", type: "text" },
    { id: "od", label: "Urlop od", type: "date", required: true },
    { id: "kopia", label: "Odpis aktu", type: "radio", options: ["Dołączam", "W aktach"] },
    { id: "uwagi", label: "Uwagi o załączniku", type: "textarea", showIf: { field: "kopia", equals: "Dołączam" } },
  ] }],
  letter: (v) => [
    `Proszę o udzielenie urlopu od ${v.od || "…………"}.`,
    v.kopia === "Dołączam" ? "Załączam odpis aktu." : "Odpis znajduje się w aktach.",
    v.uwagi || "",
  ],
};

async function pages(bytes: Uint8Array): Promise<string[]> {
  const pdf = await getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  try {
    const out: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out.push(content.items.map(item => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " "));
    }
    return out;
  } finally {
    await pdf.destroy();
  }
}

describe("PDF wniosku z Dokumentów", () => {
  it("drukuje pismo z nagłówkiem, treścią, załącznikami i miejscem na podpis", async () => {
    const result = await pages(await renderFormPdf(letter, values, opts, fonts));
    expect(result).toHaveLength(1);
    for (const fragment of [letter.name, values.rodzic, values.pracodawca, "Łódź, 21 listopada 2026", "Proszę o udzielenie urlopu od 2027-01-04.", "Załączam odpis aktu.", "podpis wnioskodawcy", "Strona 1 z 1"]) {
      expect(result[0]).toContain(fragment);
    }
    expect(result[0]).not.toMatch(/SZKIC|KOREKTA|Urlop od|undefined|null/);
  });

  it("zaznacza niepełne pisma i korekty, pomija ukryte wcześniejsze odpowiedzi", async () => {
    const [text] = await pages(await renderFormPdf(letter, { ...values, od: "", kopia: "W aktach", uwagi: "Dawna odpowiedź" }, { ...opts, correction: true }, fonts));
    expect(text).toContain("SZKIC");
    expect(text).toContain("KOREKTA");
    expect(text).toContain("Odpis znajduje się w aktach.");
    expect(text).not.toContain("Dawna odpowiedź");
    expect(pdfFilename(letter, true)).toBe("wniosek-o-udzielenie-urlopu-korekta.pdf");
  });

  it("zachowuje długie wielowierszowe pisma i zastępuje niedostępne znaki", async () => {
    const uwagi = Array.from({ length: 95 }, (_, i) => `Wpis nr ${i + 1}.`).join("\r\n");
    const result = await pages(await renderFormPdf(letter, { ...values, rodzic: "Anna 👶\tPrzykładowa", uwagi }, opts, fonts));
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toContain("Anna ? Przykładowa");
    expect(result.join(" ")).toContain("Wpis nr 95.");
    expect(result.at(-1)).toContain("podpis wnioskodawcy");
    for (let i = 0; i < result.length; i++) expect(result[i]).toContain(`Strona ${i + 1} z ${result.length}`);
  });

  it("używa mapy urzędowej wyłącznie dla kompletnych danych, kanał online nie może pobrać pliku", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const buildOfficial = vi.fn().mockResolvedValue(bytes);
    const official = { ...letter, pdf: "official" as const, buildOfficial };
    expect(await renderFormPdf(official, values, opts, fonts)).toBe(bytes);
    expect(buildOfficial).toHaveBeenCalledWith({ ...values, uwagi: "" }, opts.date, fonts);
    await expect(renderFormPdf(official, { ...values, rodzic: "" }, opts, fonts)).rejects.toThrow();
    await expect(renderFormPdf({ ...letter, pdf: "none" }, values, opts, fonts)).rejects.toThrow();
    expect(buildOfficial).toHaveBeenCalledTimes(1);
  });
});
