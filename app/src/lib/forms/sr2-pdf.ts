import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, rgb, type PDFPage } from "pdf-lib";
import type { ApplicationFonts } from "./application-pdf";
import { sha256Hex } from "./zam-fill";
import { cleanId, incomeYear, rows, srPeople, type SrPerson } from "./sr2-data";

export const SR_HASH = {
  "sr-2": "e67eefd7679f4335beef645b0c36053dd9ca967d4f5746117d58bf72a5e28e74",
  "sr-2z": "3fb9d5f1deaa5602dd79d0244af8ae8468d22dd70e2150258c119e885effb827",
  "zsr-05": "e5e922c317179b7a8ca5b4b27a37c0ccc14b5bb3efac3826a92ae9159e790844",
  "zsr-07": "621dfff9ec26aa44709f1f16cfbb94b81f915fce42be99c03641f4338a65ea61",
};

async function template(name: keyof typeof SR_HASH) {
  const response = await fetch(`/forms/${name}.pdf`);
  if (!response.ok) throw Error(`Nie udało się pobrać druku ${name.toUpperCase()}.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (await sha256Hex(bytes) !== SR_HASH[name]) throw Error(`Wzór ${name.toUpperCase()} zmienił się i wymaga sprawdzenia mapy pól.`);
  return PDFDocument.load(bytes);
}

export async function buildSr2(v: Record<string, string>, date: string, fonts: ApplicationFonts) {
  const doc = await PDFDocument.create();
  doc.setTitle("SR-2 · Jednorazowa zapomoga z tytułu urodzenia się dziecka");
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(fonts.regular, { subset: true });
  const sources = new Map<keyof typeof SR_HASH, PDFDocument>();
  async function append(name: keyof typeof SR_HASH) {
    const src = sources.get(name) ?? await template(name);
    sources.set(name, src);
    const pages = await doc.copyPages(src, src.getPageIndices());
    for (const page of pages) {
      // SR-2 zawiera wyłącznie widget podpisu wydawcy. Eksport jest nowym egzemplarzem do podpisu na papierze.
      if (name === "sr-2") page.node.delete(PDFName.of("Annots"));
      doc.addPage(page);
    }
    return pages;
  }
  // Współrzędne w punktach od lewej i od góry strony, na linii bazowej tekstu.
  function print(p: PDFPage, x: number, baseline: number, value?: string, width = 478, upper = true) {
    if (!value?.trim()) return;
    const line = (upper ? value.toLocaleUpperCase("pl") : value).replace(/\s+/g, " ").trim();
    const size = Math.min(10, width / font.widthOfTextAtSize(line, 1));
    if (size < 5) throw Error(`Za długi tekst w polu druku: „${line.slice(0, 25)}…”. Skróć wpis.`);
    p.drawText(line, { x, y: p.getHeight() - baseline, size, font, color: rgb(0.04, 0.14, 0.35) });
  }
  function cells(p: PDFPage, x: number, baseline: number, val: string, step = 13.2) {
    [...val].forEach((c, i) => print(p, x + i * step + (step - font.widthOfTextAtSize(c, 10)) / 2, baseline, c));
  }
  function identity(p: PDFPage, person: SrPerson, x: number, y: number, docX: number, step: number) {
    if (/^dok:/i.test(person.id)) print(p, docX, y, person.id.slice(4), 191);
    else cells(p, x, y, person.id, step);
  }
  const digits = (iso?: string) => iso?.split("-").reverse().join("") ?? "";
  const dateLabel = date.split("-").reverse().join(".");
  const { applicant, children, family } = srPeople(v);
  const [front, kids, family1, family2, changes, payment, sign] = await append("sr-2");
  function address(prefix: string, off: number) {
    print(front, 51, 266 + off, v[prefix + "_gmina"]);
    const code = v[prefix + "_kod"].replace("-", "");
    cells(front, 50, 293 + off, code.slice(0, 2));
    cells(front, 86, 293 + off, code.slice(2));
    print(front, 150, 292 + off, v[prefix + "_miasto"], 383);
    print(front, 51, 318 + off, v[prefix + "_ulica"]);
    print(front, 51, 344 + off, v[prefix + "_dom"], 96);
    print(front, 163, 344 + off, v[prefix + "_lokal"], 96);
  }
  print(front, 51, 201, v.urzad);
  address("urzad", 0);
  address("adres", 352.2);
  print(front, 51, 441, applicant.first);
  print(front, 51, 466, applicant.last);
  identity(front, applicant, 50, 493, 345, 13.2);
  cells(front, 218, 493, digits(applicant.birth));
  print(front, 51, 518, applicant.citizen, 315);
  print(front, 51, 544, v.stan_cywilny, 315);
  print(front, 289, 696, v.telefon, 137);
  print(front, 51, 721, v.email, 475, false);
  children.slice(0, 4).forEach((person, i) => {
    const off = i * 139.94;
    print(kids, 51, 114 + off, person.first);
    print(kids, 51, 140 + off, person.last);
    identity(kids, person, 50, 166 + off, 345, 13.2);
    cells(kids, 218, 166 + off, digits(person.birth));
    print(kids, 51, 191 + off, person.citizen, 315);
  });
  family.slice(0, 6).forEach((person, i) => {
    const p = i < 4 ? family1 : family2;
    const y = i < 4 ? 218 + 142.85 * i : 105 + 142.3 * (i - 4);
    print(p, 51, y, person.first);
    print(p, 51, y + 25.5, person.last);
    identity(p, person, 50, y + 51.4, 219, 13.2);
    print(p, 51, y + 76.4, person.relation, 380);
  });
  const ins = v.skladki.toLowerCase();
  if (ins.includes("zus")) print(family2, 68, 400, "X");
  if (ins.includes("krus")) print(family2, 236, 400, "X");
  if (ins === "brak") print(family2, 431, 400, "X");
  if (ins.includes("inny")) {
    print(family2, 68, 427, "X");
    print(family2, 47, 457, v.skladki_inny);
  }
  const year = String(incomeYear(date));
  cells(family2, 315.5, 550, year);
  function decimal(val: string, whole: number, fraction: number) {
    const [a, b = ""] = val.replace(",", ".").split(".");
    return a.padStart(whole, " ") + b.padEnd(fraction, "0");
  }
  cells(family2, 413.4, 550, decimal(v.alimenty, 6, 2));
  print(family2, v.nieopodatkowane === "Tak" ? 68 : 109, 614, "X");
  print(family2, v.rolne === "Tak" ? 68 : 109, 675, "X");
  print(changes, v.utrata === "Tak" ? 68 : 308, 82, "X");
  print(changes, v.uzyskanie === "Tak" ? 68 : 285, 287, "X");
  if (v.wyplata === "Na rachunek bankowy") cells(payment, 51, 650, v.rachunek.replace(/[\s-]/g, "").replace(/^PL/i, ""), 12.78);
  print(sign, 54, 226.5, v.miejscowosc, 258);
  print(sign, 334, 226.5, dateLabel, 93);

  const attachments: string[] = [];
  if (v.rola === "Rodzic biologiczny") attachments.push("Zaświadczenie lekarza lub położnej o opiece w ciąży");
  else attachments.push("Dokument potwierdzający opiekę lub przysposobienie");
  if (v.samotnie === "Tak") attachments.push(v.alimenty_tytul);
  if (v.utrata === "Tak") attachments.push("Dokumenty potwierdzające utratę dochodu");
  if (v.uzyskanie === "Tak") attachments.push("Dokumenty potwierdzające uzyskanie dochodu");
  if (v.pobyt_dokument === "Tak") attachments.push("Dokument potwierdzający prawo pobytu");
  const sr2zCount = Math.max(0, Math.ceil((children.length - 4) / 4), Math.ceil((family.length - 6) / 4));
  if (sr2zCount) attachments.push(`SR-2Z (${sr2zCount} szt.)`);

  function annexPerson(p: PDFPage, person: SrPerson, y: number, kind: "child" | "family" | "income") {
    print(p, 28, y, person.first, 528);
    print(p, 28, y + 28.1, person.last, 528);
    identity(p, person, 26, y + 56.3, kind === "child" ? 350 : 212, 15.35);
    if (kind === "child") {
      cells(p, 210, y + 56.3, digits(person.birth), 15.3);
      print(p, 28, y + 84.4, person.citizen, 330);
    } else if (kind === "family") print(p, 28, y + 84.4, person.relation, 390);
  }
  function annexSignature(p: PDFPage, y: number) {
    print(p, 28, y, v.miejscowosc, 265);
    print(p, 330, y, dateLabel, 108);
  }
  for (let n = 0; n < sr2zCount; n++) {
    const [p1, p2, p3] = await append("sr-2z");
    annexPerson(p1, applicant, 270, "child");
    print(p1, 28, 382, v.stan_cywilny, 325);
    const start = n * 4;
    children.slice(4 + start, 8 + start).forEach((person, i) =>
      annexPerson(i < 2 ? p1 : p2, person, [509, 672, 93, 256][i], "child"));
    family.slice(6 + start, 10 + start).forEach((person, i) =>
      annexPerson(i === 0 ? p2 : p3, person, [694, 74, 237, 400][i], "family"));
    annexSignature(p3, 713);
  }

  function declarant(p: PDFPage, id: string, y: number) {
    annexPerson(p, applicant, y, "income");
    const member = family.find(person => person.id === id);
    if (!member) throw Error("Sprawdź identyfikator członka rodziny w załączniku.");
    if (member.id !== applicant.id) annexPerson(p, member, y + 127.8, "income");
  }
  if (v.nieopodatkowane === "Tak") {
    const entries = Map.groupBy(rows(v.dochody_osoby), r => cleanId(r[0]));
    let count = 0;
    for (const [id, incomes] of entries) {
      for (let n = 0; n < incomes.length; n += 5) {
        const portion = incomes.slice(n, n + 5);
        const [p1, , p3] = await append("zsr-05");
        declarant(p1, id, 252);
        cells(p1, 366.5, 491, year, 15.35);
        let cents = 0;
        portion.forEach(([, title, amount], i) => {
          const y = 566 + i * 47.28;
          print(p1, 39, y, title, 361);
          cells(p1, 439.2, y, decimal(amount, 6, 2), 15.35);
          cents += Math.round(Number(amount.replace(",", ".")) * 100);
        });
        cells(p1, 153.6, 514, decimal((cents / 100).toFixed(2), 6, 2), 15.35);
        annexSignature(p3, 422);
        count++;
      }
    }
    attachments.push(`ZSR-05 (${count} szt.)`);
  }
  if (v.rolne === "Tak") {
    const farms = rows(v.hektary_osoby);
    for (const [id, hectares] of farms) {
      const [p] = await append("zsr-07");
      declarant(p, cleanId(id), 220);
      cells(p, 194.5, 457, year, 15.35);
      cells(p, 367, 480, decimal(hectares, 4, 4), 15.35);
      annexSignature(p, 610);
    }
    attachments.push(`ZSR-07 (${farms.length} szt.)`);
  }
  attachments.push(...(v.inne_zalaczniki || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean));
  const first = attachments.length > 4 ? [...attachments.slice(0, 3), "Dalsze dokumenty wymieniono w dołączonym wykazie."] : attachments;
  first.forEach((item, i) => print(sign, 65, 89 + i * 19.8, item, 467));
  for (let i = 3; attachments.length > 4 && i < attachments.length; i += 28) {
    const p = doc.addPage([595.28, 841.89]);
    print(p, 50, 72, "SR-2 · Dalszy wykaz dołączanych dokumentów");
    print(p, 50, 95, [applicant.first, applicant.last, dateLabel].join(" · "));
    attachments.slice(i, i + 28).forEach((item, index) => print(p, 50, 134 + index * 22, `${i + index + 1}. ${item}`));
  }
  return doc.save();
}
