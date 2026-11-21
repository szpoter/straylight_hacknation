import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import { formatShort } from "../rules/dates";
import type { MartaView } from "./types";

export async function martaPdf(view: MartaView) {
  if (!view.selected || !view.confirmed) throw new Error("confirmation_required");
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await readFile(path.join(process.cwd(), "public/forms/fonts/DejaVuSans.ttf")), { subset: true });
  const page = doc.addPage([595, 842]);
  const { first, second } = view.variants[view.selected];
  let y = 785;
  function paragraph(text: string, size = 11) {
    let line = "";
    for (const word of text.split(" ")) {
      if (line && font.widthOfTextAtSize(line + " " + word, size) > 490) {
        page.drawText(line, { x: 50, y, size, font }); y -= size + 5; line = "";
      }
      line = line ? line + " " + word : word;
    }
    page.drawText(line, { x: 50, y, size, font }); y -= size + 15;
  }
  paragraph("Dane demonstracyjne • egzemplarz do wydruku");
  paragraph(view.firstName);
  paragraph("Do pracodawcy: Studio Lipa");
  paragraph("Wniosek o udzielenie urlopu rodzicielskiego", 17);
  paragraph("Proszę o udzielenie mi urlopu rodzicielskiego od " + formatShort(first.from) + " do " + formatShort(first.to) + " włącznie. Dziecko: " + view.childName + ".");
  paragraph("Dotychczas wykorzystany urlop rodzicielski lub zasiłek za odpowiadający mu okres: " + view.previousDays + " dni, w " + view.previousParts + " częściach.");
  paragraph("Oświadczenie o drugim rodzicu", 14);
  paragraph("Drugi rodzic (" + view.secondName + ") zamierza korzystać z urlopu rodzicielskiego od " + formatShort(second.from) + " do " + formatShort(second.to) + " włącznie.");
  paragraph(view.employerHasCopy ? "Odpis aktu urodzenia jest już w aktach osobowych u pracodawcy." : "Załącznik przekazywany osobno: kopia odpisu aktu urodzenia (" + view.attachmentName + ").");
  paragraph("Data i podpis osoby składającej wniosek: _____________________________");
  return new Uint8Array(await doc.save());
}
