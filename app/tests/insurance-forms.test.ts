import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { afterEach, expect, it, vi } from "vitest";
import { validate } from "@/features/documents/flow";
import { renderFormPdf } from "@/features/documents/pdf";
import { insuranceForms } from "@/lib/demo/forms-insurance";
import { averagedDeadline } from "@/lib/forms/maternity-period";
import { sha256Hex } from "@/lib/forms/zam-fill";
import { ZAM_CELL, ZAM_MAP, ZAM_TEMPLATE_SHA256, type ZamSlot } from "@/lib/forms/zam-map";

const zam = insuranceForms["zasilek-macierzynski"];
const letter = insuranceForms["ubezpieczenie-dziecka"];
const asset = (file: string) => new Uint8Array(readFileSync(path.resolve(__dirname, "../public/forms", file)));
const template = asset("zam-2026-10-24.pdf");
const fonts = { regular: asset("fonts/DejaVuSans.ttf"), bold: asset("fonts/DejaVuSans-Bold.ttf") };
const options = { recipient: "Do pracodawcy", date: "2026-11-22" };
const values = {
  rodzic: "Łucja Nowak-Lis", identyfikator: "PESEL", rodzic_pesel: "90051212349", rodzic_data: "1990-05-12", drugi_rodzic: "Michał Lis",
  drugi_id: "PESEL", drugi_pesel: "44051401359", dziecko: "Róża Lis", dziecko_pesel: "26311000009",
  pesel_nadany: "Tak", data_urodzenia: "2026-11-10", miejsce_urodzenia: "Łódź", caly_okres: "Tak",
  od: "2026-11-10", liczba_dzieci: "1", pracodawca: "Drukarnia Łódź", platnik: "ZUS", nip: "5250001003",
  ulica: "Łąkowa", dom: "8", kod: "90-001", miejscowosc: "Łódź", rachunek: "PL61 1090 1014 0000 0712 1981 2874",
  wyplata: "Na rachunek bankowy", uprawnienie_od: "2026-11-10", pokrewienstwo: "Dziecko własne", gospodarstwo: "Tak",
  ten_sam_adres: "Nie", adres_dziecka: "ul. Żabia 3, 90-001 Łódź", orzeczenie: "Brak orzeczenia", wymaga_zgloszenia: "Tak",
  zalaczniki: "Kopia odpisu aktu urodzenia", za_zyciem: "Róża",
  zus_ade: "AE:PL-53124-39628-ICTSU-20", email_kadr: "kadry@example.test", adres_pocztowy: "ul. Testowa 1, 90-001 Łódź",
};

function useTemplate(bytes: Uint8Array = template) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    expect(url).toBe("/forms/zam-2026-10-24.pdf");
    return new Response(Uint8Array.from(bytes));
  }));
}
afterEach(() => vi.unstubAllGlobals());

async function pdfText(bytes: Uint8Array) {
  const doc = await getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  const pages = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const { items } = await (await doc.getPage(n)).getTextContent();
      pages.push(items.flatMap(i => "str" in i && i.str.trim() ? [{ str: i.str, x: i.transform[4], y: i.transform[5] }] : []));
    }
    return pages;
  } finally { await doc.destroy(); }
}

function slotText(pages: Awaited<ReturnType<typeof pdfText>>, name: ZamSlot) {
  const s = ZAM_MAP[name];
  const w = s.type === "cells" ? s.count * ZAM_CELL : s.type === "text" ? s.w : ZAM_CELL;
  const h = s.type === "text" ? s.h : 17.4;
  return pages[s.page - 1].filter(i => i.x >= s.x && i.x < s.x + w && i.y >= s.y && i.y < s.y + h).map(i => i.str).join("");
}

it("prints the mother's ZAM on the verified unmodified form, with only the relevant check marks", async () => {
  expect(await sha256Hex(template)).toBe(ZAM_TEMPLATE_SHA256);
  expect((await PDFDocument.load(template)).getForm().getFields()).toHaveLength(0);
  expect(validate(zam, values, options.date)).toEqual({});
  useTemplate();
  const pages = await pdfText(await renderFormPdf(zam, values, options, fonts));
  expect(pages).toHaveLength(7);
  for (const [slot, expected] of Object.entries({
    father_first_name: "ŁUCJA", father_last_name: "NOWAK-LIS", payer_name: "DRUKARNIA ŁÓDŹ",
    bank_account: "61109010140000071219812874", maternity_period: "10.11.2026 – 29.03.2027",
    maternity_end: "29032027", maternity_check: "X", full_leave_intent: "X", reason_birth: "X",
    paternity_check: "", insurance_yes: "", other_title_no: "", certificate_check: "X",
    certificate_names: "RÓŻA", mother_first_name: "MICHAŁ", sign_date: "22112026",
  })) expect(slotText(pages, slot as ZamSlot), slot).toBe(expected);
  expect(slotText(pages, "child_data")).toContain("RÓŻA LIS10.11.2026, ŁÓDŹPESEL: 26311000009");
});

it("preserves all children in a multiple birth and replaces stale conditional identifiers", async () => {
  useTemplate();
  const second = "Jan Lis, 10.11.2026, Łódź, nie nadano PESEL";
  const edited = { ...values, liczba_dzieci: "2", pozostale_dzieci: second, pesel_nadany: "Nie", identyfikator: "Dokument tożsamości",
    rodzic_dokument: "PASZPORT AB123456", rodzic_data: "1990-05-12", drugi_id: "Dokument tożsamości", drugi_dokument: "PASZPORT ZZ0001",
    drugi_data: "1991-06-13", caly_okres: "Nie", wyplata: "Przekazem pocztowym", za_zyciem: "" };
  const pages = await pdfText(await renderFormPdf(zam, edited, options, fonts));
  expect(pages).toHaveLength(8);
  expect(pages[7].map(i => i.str).join(" ")).toContain(second);
  expect(slotText(pages, "maternity_period")).toBe("10.11.2026 – 14.06.2027");
  expect(slotText(pages, "applicant_birth")).toBe("12051990");
  expect(slotText(pages, "second_parent_document")).toBe("PASZPORT ZZ0001");
  expect(slotText(pages, "child_data")).not.toContain(values.dziecko_pesel);
  for (const key of ["full_leave_intent", "bank_account", "father_pesel", "mother_pesel", "certificate_check"] as const) expect(slotText(pages, key)).toBe("");
});

it.each(["Tak", "Nie"])("full-leave intent %s changes page 2 while page 5 keeps only applicable entries", async (choice) => {
  useTemplate();
  const original = await pdfText(template);
  const filled = await pdfText(await renderFormPdf(zam, { ...values, caly_okres: choice }, options, fonts));
  expect(slotText(filled, "maternity_check")).toBe("X");
  expect(slotText(filled, "full_leave_intent")).toBe(choice === "Tak" ? "X" : "");
  // Above the second parent's details (y=413) are hospital discharge, paternity and parental/supplementary requests.
  expect(filled[4].filter(item => item.y > 413)).toEqual(original[4].filter(item => item.y > 413));
  expect(slotText(filled, "mother_last_name")).toBe("LIS");
  expect(slotText(filled, "sign_date")).toBe("22112026");
});

it("checks the 21-day deadline with weekends and holidays, periods and sibling data", () => {
  expect(averagedDeadline("2026-12-03")).toBe("2026-12-28");
  expect(averagedDeadline("2026-03-16")).toBe("2026-04-07");
  expect(averagedDeadline("2026-05-14")).toBe("2026-06-05");
  expect(averagedDeadline("2026-11-10")).toBe("2026-12-01");
  expect(validate(zam, values, "2026-12-01")).toEqual({});
  expect(validate(zam, values, "2026-12-02")).toHaveProperty("caly_okres");
  expect(validate(zam, { ...values, caly_okres: "Nie" }, "2026-12-02")).toEqual({});
  expect(validate(zam, { ...values, do: "2027-03-30" }, options.date)).toHaveProperty("do");
  expect(validate(zam, { ...values, liczba_dzieci: "3" }, options.date)).toHaveProperty("pozostale_dzieci");
});

it("addresses direct ZUS delivery only to the benefit payer and e-mail only to the employer", () => {
  for (const channel of zam.channels.filter(c => c !== "email")) expect(zam.validateChannel?.(values, channel)).toEqual({});
  expect(zam.validateChannel?.(values, "email")?.platnik).toMatch(/kopia.*podpisany wydruk/);
  expect(zam.validateChannel?.({ ...values, platnik: "Pracodawca" }, "email")).toEqual({});
  for (const channel of ["pue", "zus", "edoreczenia"] as const) expect(zam.validateChannel?.({ ...values, platnik: "Pracodawca" }, channel)).toHaveProperty("platnik");
  expect(zam.recipientFor?.(values, "edoreczenia")).toContain(values.zus_ade);
  expect(zam.recipientFor?.(values, "email")).toBe("Drukarnia Łódź · kadry@example.test");
  expect(zam.recipientFor?.(values, "poczta")).toContain("Zakład Ubezpieczeń Społecznych · " + values.adres_pocztowy);
  for (const channel of letter.channels) expect(letter.validateChannel?.(values, channel)).toEqual({});
  expect(letter.validateChannel?.({ ...values, email_kadr: "" }, "email")).toHaveProperty("email_kadr");
  expect(letter.recipientFor?.(values, "poczta")).toContain(values.pracodawca);
  expect(letter.channels).not.toContain("pue");
});

it("prints the employee's signed-letter layout with actual dates, address and attachments", async () => {
  expect(validate(letter, values, options.date)).toEqual({});
  expect(validate(letter, { ...values, rodzic_data: "" }, options.date)).toHaveProperty("rodzic_data");
  expect(validate(letter, { ...values, wymaga_zgloszenia: "Nie" }, options.date)).toHaveProperty("wymaga_zgloszenia");
  const pages = await pdfText(await renderFormPdf(letter, values, options, fonts));
  expect(pages).toHaveLength(1);
  const content = pages[0].map(i => i.str).join(" ").replace(/\s+/g, " ");
  for (const expected of [values.rodzic, values.pracodawca, "22 listopada 2026", values.dziecko_pesel,
    values.adres_dziecka, "10.11.2026", "12.05.1990", "Dziecko własne (kod 11)", "brak (kod 0)", values.zalaczniki, "podpis wnioskodawcy"]) expect(content).toContain(expected);
  expect(letter.letter?.({ ...values, ten_sam_adres: "Tak" }, options.date).join(" ")).not.toContain(values.adres_dziecka);
});

it.each([
  ["Dziecko własne", "11"], ["Dziecko przysposobione", "11"], ["Dziecko małżonka", "11"],
  ["Wnuk lub wnuczka", "21"], ["Dziecko w rodzinie zastępczej", "21"],
  ["Dziecko objęte opieką prawną", "21"], ["Dziecko w rodzinnym domu dziecka", "21"],
])("includes the ZCNA kinship code for %s", (pokrewienstwo, code) => {
  const v = { ...values, pokrewienstwo, rodzice_bez_ubezpieczenia: "Tak" };
  expect(validate(letter, v, options.date)).toEqual({});
  expect(letter.letter?.(v, options.date).join(" ")).toContain(pokrewienstwo + " (kod " + code + ")");
  const errors = validate(letter, { ...v, rodzice_bez_ubezpieczenia: "Nie" }, options.date);
  expect(Boolean(errors.rodzice_bez_ubezpieczenia)).toBe(pokrewienstwo === "Wnuk lub wnuczka");
});

it.each([
  ["Orzeczenie dla dziecka poniżej 16 lat", "4"], ["Stopień lekki", "1"], ["Stopień umiarkowany", "2"], ["Stopień znaczny", "3"],
])("uses the certificate type %s for a child with a disability ruling", (rodzaj_orzeczenia, code) => {
  const v = { ...values, orzeczenie: "Dziecko ma orzeczenie o niepełnosprawności", rodzaj_orzeczenia };
  expect(validate(letter, { ...v, rodzaj_orzeczenia: "" }, options.date)).toHaveProperty("rodzaj_orzeczenia");
  const errors = validate(letter, v, options.date);
  expect(Boolean(errors.rodzaj_orzeczenia)).toBe(code !== "4");
  if (code !== "4") expect(validate(letter, { ...v, data_urodzenia: "2010-11-22" }, options.date)).toEqual({});
  expect(letter.letter?.(v, options.date).join(" ")).toContain(rodzaj_orzeczenia + " (kod " + code + ")");
  expect(letter.letter?.({ ...values, rodzaj_orzeczenia }, options.date).join(" ")).toContain("brak (kod 0)");
});
