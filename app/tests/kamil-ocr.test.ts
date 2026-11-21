import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker, type Worker } from "tesseract.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commandSchema, type Candidate } from "@/lib/kamil/contract";
import { kamilCertificate } from "@/lib/kamil/profile";
import { extractBirthCertificate, type ReadResult } from "@/lib/ocr/birth-certificate";
import { wordsFromPdfItems, wordsFromTesseract, type PdfTextItem, type TesseractWord } from "@/lib/ocr/words";
import { makeCertificatePdf, makeCertificateScan } from "../scripts/kamil-demo-docs";

const ROOT = path.resolve(__dirname, "..");

async function readPdf(bytes: Uint8Array, fileName = "odpis.pdf"): Promise<ReadResult> {
  const doc = await getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  const words = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const { width, height } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    words.push(...wordsFromPdfItems(content.items as PdfTextItem[], p, width, height));
  }
  return { fileName, method: "pdf_text", words };
}

let worker: Worker;
async function readScan(jpeg: Buffer, fileName = "skan.jpg"): Promise<ReadResult> {
  const { data } = await worker.recognize(jpeg, {}, { blocks: true });
  const flat: TesseractWord[] = [];
  for (const block of data.blocks ?? [])
    for (const para of block.paragraphs) for (const line of para.lines) flat.push(...(line.words as TesseractWord[]));
  // The scan is A4 at scale 2.
  return { fileName, method: "ocr", words: wordsFromTesseract(flat, 1, 1190, 1684) };
}

const byKey = (list: Candidate[]) => Object.fromEntries(list.map((c) => [c.key, c]));

beforeAll(async () => {
  worker = await createWorker("pol", 1, { langPath: path.join(ROOT, "public/ocr/lang"), cacheMethod: "none", gzip: true });
}, 60_000);
afterAll(async () => {
  await worker?.terminate();
});

describe("step 1 · reading Kamil's document", () => {
  it("PDF with a text layer: reads values with page and position, no review needed", async () => {
    const data = kamilCertificate();
    const fields = byKey(extractBirthCertificate(await readPdf(await makeCertificatePdf(data))));
    expect(fields.child_birth_date.value).toBe("2026-05-20");
    expect(fields.child_first_name.value).toBe("ANTONI");
    expect(fields.child_last_name.value).toBe("WRONA");
    expect(fields.child_birth_place.value).toBe("KRAKÓW");
    expect(fields.child_pesel.value).toBe(data.childPesel);
    expect(fields.mother_first_name.value).toBe("ZOFIA");
    const origin = fields.child_birth_date.origin;
    if (origin.kind !== "document") throw new Error("expected document origin");
    expect(origin.method).toBe("pdf_text");
    expect(origin.page).toBe(1);
    // Value column starts at x = 280 pt of 595, the row at 214 + 3 × 34 pt of 842.
    expect(origin.box.x).toBeCloseTo(280 / 595, 2);
    expect(origin.box.y).toBeGreaterThan(0.33);
    expect(origin.box.y).toBeLessThan(0.38);
    expect(Object.values(fields).every((c) => !c.needsReview)).toBe(true);
  });

  it("scan of the same page: OCR gives the same values and the same place on the page", async () => {
    const data = kamilCertificate();
    const pdf = byKey(extractBirthCertificate(await readPdf(await makeCertificatePdf(data))));
    const scan = byKey(extractBirthCertificate(await readScan(makeCertificateScan(data))));
    for (const key of [
      "child_birth_date",
      "child_first_name",
      "child_last_name",
      "child_birth_place",
      "child_pesel",
      "mother_first_name",
      "mother_last_name",
    ]) {
      expect(scan[key]?.value, key).toBe(pdf[key].value);
      expect(scan[key].needsReview, `${key}: ${scan[key].reason}`).toBe(false);
    }
    const a = pdf.child_birth_date.origin;
    const b = scan.child_birth_date.origin;
    if (a.kind !== "document" || b.kind !== "document") throw new Error("expected document origins");
    expect(b.method).toBe("ocr");
    expect(Math.abs(a.box.x - b.box.x)).toBeLessThan(0.02);
    expect(Math.abs(a.box.y - b.box.y)).toBeLessThan(0.02);
  }, 60_000);

  it("after the date changes in the document, both versions read the new date", async () => {
    const changed = kamilCertificate("2026-05-27");
    const pdf = byKey(extractBirthCertificate(await readPdf(await makeCertificatePdf(changed))));
    const scan = byKey(extractBirthCertificate(await readScan(makeCertificateScan(changed))));
    expect(pdf.child_birth_date.value).toBe("2026-05-27");
    expect(scan.child_birth_date.value).toBe("2026-05-27");
    expect(scan.child_birth_date.needsReview).toBe(false);
  }, 60_000);

  it("an illegible digit marks the field for review instead of guessing", async () => {
    const scan = byKey(extractBirthCertificate(await readScan(makeCertificateScan(kamilCertificate(), { blotCharIndex: 4 }))));
    expect(scan.child_birth_date.needsReview).toBe(true);
    expect(scan.child_birth_date.reason).toBeTruthy();
    // The rest of the document is still usable.
    expect(scan.child_first_name.needsReview).toBe(false);
  }, 60_000);

  it("a date that disagrees with the child's PESEL is flagged on both fields", () => {
    const read: ReadResult = {
      fileName: "x.pdf",
      method: "pdf_text",
      words: [
        { text: "Data", page: 1, box: { x: 0.1, y: 0.3, w: 0.05, h: 0.015 }, confidence: 100 },
        { text: "urodzenia", page: 1, box: { x: 0.16, y: 0.3, w: 0.1, h: 0.015 }, confidence: 100 },
        { text: "21.05.2026", page: 1, box: { x: 0.47, y: 0.3, w: 0.12, h: 0.015 }, confidence: 100 },
        { text: "Numer", page: 1, box: { x: 0.1, y: 0.4, w: 0.06, h: 0.015 }, confidence: 100 },
        { text: "PESEL", page: 1, box: { x: 0.17, y: 0.4, w: 0.06, h: 0.015 }, confidence: 100 },
        { text: kamilCertificate().childPesel, page: 1, box: { x: 0.47, y: 0.4, w: 0.15, h: 0.015 }, confidence: 100 },
      ],
    };
    const fields = byKey(extractBirthCertificate(read));
    expect(fields.child_birth_date.needsReview).toBe(true);
    expect(fields.child_birth_date.reason).toMatch(/PESEL/);
  });
});

describe("privacy · private competition files stay out of the public demo", () => {
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  }

  it("public demo files and the Kamil module contain only fictional data", () => {
    const files = [...walk(path.join(ROOT, "public/demo/kamil")), ...walk(path.join(ROOT, "src/lib/kamil"))];
    for (const file of files) {
      const text = readFileSync(file).toString("latin1");
      for (const pattern of [/Lu_3/, /Chrz_2/, /Materia.y hackathonowe/i]) {
        expect(pattern.test(text), `${file} ~ ${pattern}`).toBe(false);
      }
    }
  });

  it("the Kamil module never talks to Qdrant", () => {
    for (const file of walk(path.join(ROOT, "src/lib/kamil"))) {
      expect(readFileSync(file, "utf8")).not.toMatch(/from\s+["'][^"']*qdrant/i);
    }
  });

  it("the API accepts field values and positions, never the document itself", () => {
    const parsed = commandSchema.parse({
      type: "set_candidates",
      opKey: "op-12345678",
      image: "data:image/jpeg;base64,AAAA",
      candidates: [],
    });
    expect(parsed).not.toHaveProperty("image");
  });
});
