import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { OLA } from "../family/ola";
import { formatShort } from "../rules/dates";
import type { MartaView } from "./types";

// Employee application under § 15, Dz.U. 2025 poz. 322 (https://eli.gov.pl/eli/DU/2025/322/ogl).
export async function martaPdf(view: MartaView | null) {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.setTitle("Wniosek o udzielenie urlopu rodzicielskiego");
  doc.setCreator("Zusik");
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await readFile(path.join(process.cwd(), "public/forms/fonts/DejaVuSans.ttf")), { subset: true });
  const page = doc.addPage([595, 842]);
  const left = 48;
  const right = 547;
  const muted = rgb(0.28, 0.32, 0.32);
  const rule = (y: number) => page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.6, color: muted });
  let y = 786;

  function paragraph(text: string, size = 11) {
    let line = "";
    const nextLine = () => {
      page.drawText(line, { x: left, y, size, font });
      y -= size + 5;
      line = "";
    };
    for (const word of text.split(" ")) {
      if (line && font.widthOfTextAtSize(line + " " + word, size) > right - left) nextLine();
      if (line) line += " ";
      for (const ch of word) {
        if (font.widthOfTextAtSize(line + ch, size) > right - left) nextLine();
        line += ch;
      }
    }
    nextLine();
    y -= 9;
  }

  const plan = view?.selected ? view.variants[view.selected] : null;
  const period = (p: { from: string; to: string }) => `od ${formatShort(p.from)} do ${formatShort(p.to)}`;
  if (!view?.confirmed) paragraph("SZKIC", 9);
  rule(y + 8);
  y -= 25;
  paragraph("Wniosek o udzielenie urlopu rodzicielskiego", 19);
  paragraph("Pracodawca: " + OLA.employer);
  paragraph("Pracownik: " + OLA.mother);
  paragraph("Dziecko: " + OLA.child);
  paragraph("Data urodzenia dziecka: " + formatShort(OLA.birthDate));
  y -= 8;
  paragraph("Proszę o udzielenie mi urlopu rodzicielskiego " + (plan ? period(plan.first) : "od __________ do __________") + " włącznie.");
  paragraph(`Dotychczas wykorzystany urlop rodzicielski lub zasiłek za odpowiadający mu okres: ${view?.previousDays ?? "____"} dni. Liczba wykorzystanych części urlopu lub wniosków o zasiłek: ${view?.previousParts ?? "____"}.`);
  y -= 8;
  paragraph("Oświadczenie dotyczące drugiego rodzica", 14);
  if (!view || !plan) {
    paragraph(`Drugi rodzic: ${OLA.father}. Do uzupełnienia po ustaleniu okresów obojga rodziców.`);
  } else {
    const other = view.secondName;
    const statement = view.selected === "together"
      ? `Drugi rodzic (${other}) zamierza korzystać z urlopu rodzicielskiego ${period(plan.second)}, równocześnie ze mną.`
      : `W okresie objętym moim wnioskiem drugi rodzic (${other}) nie zamierza korzystać z urlopu rodzicielskiego ani z odpowiadającego mu zasiłku. Planowany urlop drugiego rodzica przypada ${period(plan.second)}.`;
    paragraph((view.confirmed ? "" : "Do potwierdzenia: ") + statement);
  }
  paragraph(view?.employerHasCopy == null ? "Odpis aktu urodzenia: do potwierdzenia."
    : view.employerHasCopy ? "Odpis aktu urodzenia jest już w aktach osobowych u pracodawcy."
    : `Załącznik przekazywany osobno: kopia odpisu aktu urodzenia (${view.attachmentName}).`);
  y -= 18;
  paragraph("Data: __________________     Podpis: __________________________");
  rule(62);
  page.drawText("Wzór własny dla pracodawcy  •  § 15 rozporządzenia MRPiPS z 11.03.2025 r.", {
    x: left, y: 45, size: 9, font, color: muted,
  });
  return new Uint8Array(await doc.save());
}
