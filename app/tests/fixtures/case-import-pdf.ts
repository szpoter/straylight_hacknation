import { PDFDocument } from "pdf-lib";

// Independently selectable attachments for the ordinary chat path; all values are synthetic.
export async function syntheticCasePdf(which: "covered" | "excluded" | "payroll") {
  const pdf = await PDFDocument.create();
  function add(lines: string[]) {
    const page = pdf.addPage([820, 680]);
    lines.forEach((line, i) => page.drawText(line, { x: 30, y: 630 - i * 30, size: 14 }));
  }
  if (which === "payroll") {
    add(["Z-3 - zaswiadczenie platnika", "Stan na dzien: 25.06.2026",
      "Warunki zatrudnienia: pelny etat, stale wynagrodzenie, pelne miesiace",
      "Miesiac nalezny | Wynagrodzenie brutto | Skladki potracone",
      ...Array.from({length: 12}, (_, i) => {
        const month = new Date(Date.UTC(2025, 5 + i, 1)).toISOString().slice(0, 7);
        return month + " | 6 000,00 | 822,60";
      }),
    ]);
  } else {
    add(["Wniosek o zasilek macierzynski", "Okres wnioskowany: od 25.06.2026 do 08.07.2026", "Data zlozenia wniosku: 26.06.2026", "Wybrany wariant: 100% / 70%"]);
    add(["Zaswiadczenie o porodzie", "Data porodu: 25.06.2026"]);
    add(["Poswiadczenie ubezpieczenia", "Stan na dzien: 25.06.2026", "Tytul ubezpieczenia: pracownik",
      "Liczba ubezpieczonych na dzien 30.11.2025: 21",
      ...(which === "covered" ? ["Ubezpieczenie chorobowe: podlega"] :
        ["Ubezpieczenie chorobowe: nie podlega", "Inne tytuly ubezpieczenia: brak", "Wyjatki po ustaniu ubezpieczenia: brak"]),
    ]);
    add(["Decyzja", "Przyznano swiadczenie 99 999,99 zl", "Miesiac nalezny | Wynagrodzenie brutto", "2026-02 | 99999,99"]);
  }
  return Uint8Array.from(await pdf.save());
}
