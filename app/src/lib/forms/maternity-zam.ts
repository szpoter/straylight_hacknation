import { formatShort, isValidIso } from "../rules/dates";
import { maternityEnd } from "./maternity-period";
import { ZAM_FORM } from "../kamil/sources";
import type { ApplicationFonts } from "./application-pdf";
import { fillZam } from "./zam-fill";
import type { ZamValues } from "./zam-map";

type Values = Record<string, string>;
const digits = (s = "") => s.replace(/\D/g, "");
const dateCells = (s = "") => isValidIso(s) ? digits(formatShort(s)) : "";
const upper = (s = "") => s.trim().toLocaleUpperCase("pl");
const nameParts = (name = "") => {
  const [first, ...last] = upper(name).split(/\s+/);
  return [first, last.join(" ")];
};

export async function buildMaternityZam(v: Values, date: string, fonts: ApplicationFonts): Promise<Uint8Array> {
  const [first, last] = nameParts(v.rodzic);
  const [otherFirst, otherLast] = nameParts(v.drugi_rodzic);
  const end = v.do || maternityEnd(v);
  const extraChildren = v.liczba_dzieci !== "1" ? v.pozostale_dzieci?.trim() : "";
  const childData = [
    upper(v.dziecko),
    [formatShort(v.data_urodzenia), upper(v.miejsce_urodzenia)].join(", "),
    v.dziecko_pesel && v.pesel_nadany !== "Nie" ? "PESEL: " + digits(v.dziecko_pesel) : "",
    extraChildren ? "DANE POZOSTAŁYCH DZIECI W ZAŁĄCZNIKU." : "",
  ].filter(Boolean).join("\n");

  const values: ZamValues = {
    father_first_name: first, father_last_name: last,
    father_pesel: v.identyfikator === "Dokument tożsamości" ? "" : digits(v.rodzic_pesel),
    applicant_birth: v.identyfikator === "Dokument tożsamości" ? dateCells(v.rodzic_data) : "",
    applicant_document: v.identyfikator === "Dokument tożsamości" ? upper(v.rodzic_dokument) : "",
    father_street: upper(v.ulica), father_house: upper(v.dom), father_flat: upper(v.lokal),
    father_postcode: upper(v.kod), father_city: upper(v.miejscowosc), applicant_country: upper(v.panstwo),
    payer_nip: digits(v.nip), payer_name: upper(v.pracodawca),
    bank_account: v.wyplata === "Na rachunek bankowy" ? digits(v.rachunek) : "",
    maternity_check: "X", maternity_period: formatShort(v.od) + " – " + formatShort(end),
    maternity_end: dateCells(end), reason_birth: "X", child_data: childData,
    full_leave_intent: v.caly_okres === "Tak" ? "X" : "",
    certificate_check: v.za_zyciem?.trim() ? "X" : "", certificate_names: upper(v.za_zyciem),
    mother_first_name: otherFirst, mother_last_name: otherLast,
    mother_pesel: v.drugi_id === "Dokument tożsamości" ? "" : digits(v.drugi_pesel),
    second_parent_document: v.drugi_id === "Dokument tożsamości" ? upper(v.drugi_dokument) : "",
    second_parent_birth: v.drugi_id === "Dokument tożsamości" ? dateCells(v.drugi_data) : "",
    sign_date: dateCells(date),
  };
  const response = await fetch(ZAM_FORM.templatePath);
  if (!response.ok) throw new Error("Nie udało się pobrać wzoru ZAM.");
  const bytes = await fillZam(new Uint8Array(await response.arrayBuffer()), fonts.regular, values);
  if (!extraChildren) return bytes;

  // The official box has four lines. Keep all siblings' details on a signed continuation sheet.
  const { buildApplicationPdf } = await import("./application-pdf");
  const { PDFDocument } = await import("pdf-lib");
  const annex = await PDFDocument.load(await buildApplicationPdf({
    title: "Załącznik do ZAM — dane pozostałych dzieci z tego porodu",
    sender: v.rodzic, addressee: v.platnik === "ZUS" ? "Zakład Ubezpieczeń Społecznych" : v.pracodawca, date: formatShort(date), marks: [],
    paragraphs: [extraChildren],
  }, fonts));
  const pdf = await PDFDocument.load(bytes);
  for (const p of await pdf.copyPages(annex, annex.getPageIndices())) pdf.addPage(p);
  return pdf.save();
}
