/**
 * npm run kamil:docs
 * Generates Kamil's fictional birth certificate in two versions of the same page:
 *   public/demo/kamil/odpis-aktu-urodzenia.pdf        PDF with a text layer
 *   public/demo/kamil/odpis-aktu-urodzenia-skan.jpg   scan of that page (tilt, paper tint, noise)
 *   public/demo/kamil/odpis-aktu-urodzenia-plama.jpg  same scan with an ink blot over one digit of the date
 * Tests import the generators to change the date and re-read both versions.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fontkit from "@pdf-lib/fontkit";
import { GlobalFonts, createCanvas } from "@napi-rs/canvas";
import { PDFDocument, rgb } from "pdf-lib";
import { formatShort } from "../src/lib/rules/dates";
import { kamilCertificate, type BirthCertificateData } from "../src/lib/kamil/profile";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT = path.join(ROOT, "public/forms/fonts/DejaVuSans.ttf");
const FONT_BOLD = path.join(ROOT, "public/forms/fonts/DejaVuSans-Bold.ttf");

const W = 595;
const H = 842;

interface Line {
  text: string;
  x: number | "center";
  top: number;
  size: number;
  bold?: boolean;
  /** Marks the value of the birth date row (used to place the blot). */
  id?: "birth_date";
}

/** One layout for both versions, in PDF points with the origin at the top-left. */
export function certificateLayout(data: BirthCertificateData): Line[] {
  const rows: [string, string, Line["id"]?][] = [
    ["Nazwisko", data.childLastName],
    ["Imię (imiona)", data.childFirstName],
    ["Płeć", data.sex],
    ["Data urodzenia", formatShort(data.birthDate), "birth_date"],
    ["Miejsce urodzenia", data.birthPlace],
    ["Numer PESEL", data.childPesel],
  ];
  const parents: [string, string][] = [
    ["Imię ojca", data.fatherFirstName],
    ["Nazwisko ojca", data.fatherLastName],
    ["Imię matki", data.motherFirstName],
    ["Nazwisko matki", data.motherLastName],
    ["Nazwisko rodowe matki", data.motherMaidenName],
  ];
  const lines: Line[] = [
    { text: "RZECZPOSPOLITA POLSKA", x: "center", top: 70, size: 11 },
    { text: "ODPIS SKRÓCONY AKTU URODZENIA", x: "center", top: 100, size: 16, bold: true },
    { text: "Urząd Stanu Cywilnego w Krakowie · akt nr 1234/2026", x: "center", top: 126, size: 10 },
    { text: "DANE DZIECKA", x: 70, top: 180, size: 11, bold: true },
  ];
  let top = 214;
  for (const [label, value, id] of rows) {
    lines.push({ text: label, x: 70, top, size: 12 });
    lines.push({ text: value, x: 280, top, size: 13, bold: true, id });
    top += 34;
  }
  top += 20;
  lines.push({ text: "DANE RODZICÓW", x: 70, top, size: 11, bold: true });
  top += 34;
  for (const [label, value] of parents) {
    lines.push({ text: label, x: 70, top, size: 12 });
    lines.push({ text: value, x: 280, top, size: 13, bold: true });
    top += 34;
  }
  lines.push({ text: "Data sporządzenia odpisu 25.05.2026", x: 70, top: top + 40, size: 10 });
  lines.push({
    text: "DOKUMENT FIKCYJNY · WYŁĄCZNIE DO DEMONSTRACJI ZUSIKA · OSOBY I NUMERY SĄ ZMYŚLONE",
    x: "center",
    top: 790,
    size: 8,
  });
  return lines;
}

export async function makeCertificatePdf(data: BirthCertificateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle("Odpis skrócony aktu urodzenia (fikcyjny)");
  pdf.setProducer("Zusik demo");
  pdf.setCreationDate(new Date("2026-05-25T10:00:00Z"));
  pdf.setModificationDate(new Date("2026-05-25T10:00:00Z"));
  const regular = await pdf.embedFont(readFileSync(FONT), { subset: true });
  const bold = await pdf.embedFont(readFileSync(FONT_BOLD), { subset: true });
  const page = pdf.addPage([W, H]);
  page.drawRectangle({ x: 40, y: 40, width: W - 80, height: H - 80, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 1 });
  for (const line of certificateLayout(data)) {
    const font = line.bold ? bold : regular;
    const width = font.widthOfTextAtSize(line.text, line.size);
    const x = line.x === "center" ? (W - width) / 2 : line.x;
    page.drawText(line.text, { x, y: H - line.top, size: line.size, font, color: rgb(0.1, 0.1, 0.12) });
  }
  return pdf.save({ useObjectStreams: false });
}

/** Small deterministic PRNG, so the scan is identical between runs. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  GlobalFonts.registerFromPath(FONT, "DejaVu Sans");
  GlobalFonts.registerFromPath(FONT_BOLD, "DejaVu Sans Bold");
  fontsReady = true;
}

export interface ScanOptions {
  /** Index of the character in the birth date value ("20.05.2026") to cover with an ink blot. */
  blotCharIndex?: number;
  scale?: number;
}

/** "Scan" of the same page: the layout drawn on a tinted, slightly rotated, noisy raster. */
export function makeCertificateScan(data: BirthCertificateData, options: ScanOptions = {}): Buffer {
  registerFonts();
  const scale = options.scale ?? 2;
  const canvas = createCanvas(Math.round(W * scale), Math.round(H * scale));
  const ctx = canvas.getContext("2d");
  const random = rng(20260520);
  ctx.fillStyle = "#f3efe6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((0.45 * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#8c8c8c";
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.fillStyle = "#1d1d22";
  for (const line of certificateLayout(data)) {
    ctx.font = `${line.size}px "${line.bold ? "DejaVu Sans Bold" : "DejaVu Sans"}"`;
    const width = ctx.measureText(line.text).width;
    const x = line.x === "center" ? (W - width) / 2 : line.x;
    ctx.fillText(line.text, x, line.top);
    if (line.id === "birth_date" && options.blotCharIndex !== undefined) {
      const before = ctx.measureText(line.text.slice(0, options.blotCharIndex)).width;
      const charWidth = ctx.measureText(line.text[options.blotCharIndex]).width;
      ctx.save();
      ctx.fillStyle = "#24242a";
      ctx.beginPath();
      ctx.ellipse(x + before + charWidth / 2, line.top - line.size * 0.38, charWidth * 0.75, line.size * 0.62, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#1d1d22";
    }
  }
  ctx.restore();
  // Paper noise: light speckles and a few dark dots.
  for (let i = 0; i < 9000; i++) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const dark = random() < 0.08;
    ctx.fillStyle = dark ? "rgba(40,40,40,0.35)" : "rgba(255,255,255,0.5)";
    ctx.fillRect(x, y, dark ? 1.2 : 1.6, dark ? 1.2 : 1.6);
  }
  return canvas.toBuffer("image/jpeg", 82);
}

async function main() {
  const out = path.join(ROOT, "public/demo/kamil");
  const data = kamilCertificate();
  writeFileSync(path.join(out, "odpis-aktu-urodzenia.pdf"), await makeCertificatePdf(data));
  writeFileSync(path.join(out, "odpis-aktu-urodzenia-skan.jpg"), makeCertificateScan(data));
  writeFileSync(path.join(out, "odpis-aktu-urodzenia-plama.jpg"), makeCertificateScan(data, { blotCharIndex: 4 }));
  console.log(`kamil:docs: wrote 3 files to ${path.relative(ROOT, out)} (birth date ${data.birthDate})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: Error) => {
    console.error(`kamil:docs: FAILED — ${error.message}`);
    process.exit(1);
  });
}
