import { birth, child, childPesel, parent, parentPesel, payout, YES_NO, type FormDef, type FormField } from "./form-fields";
import { todayInPoland } from "./dates";
import { cleanId, incomeYear, rows, singleReasons, srErrors, srPeople } from "../forms/sr2-data";
import { isValidPesel } from "../ocr/identifiers";
import { addMonths, isValidIso } from "../rules/dates";

type Values = Record<string, string>;
const text = (id: string, label: string, required = true, hint?: string): FormField => ({ id, label, type: "text", required, hint });
const choice = (id: string, label: string, options = YES_NO): FormField => ({
  id, label, type: options.length > 3 ? "select" : "radio", options, required: true,
});
const when = (field: FormField, id: string, equals = "Tak"): FormField => ({ ...field, showIf: { field: id, equals } });
const list = (id: string, label: string, hint: string, required = false): FormField => ({ ...text(id, label, required, hint), type: "textarea" });
const status = choice("stan_cywilny", "Stan cywilny", ["Panna", "Kawaler", "Zamężna", "Żonaty", "Rozwiedziona", "Rozwiedziony", "W separacji", "Wdowa", "Wdowiec"]);
const parentDob: FormField = { id: "rodzic_data", label: "Twoja data urodzenia", type: "date", required: true };
const citizen = text("rodzic_obywatelstwo", "Twoje obywatelstwo");
const childCitizen = text("dziecko_obywatelstwo", "Obywatelstwo dziecka");
const email = text("email", "Adres e-mail");
const phone = text("telefon", "Numer telefonu");
const foreignFields = (flag: string, prefix: string): FormField[] => [
  when(text(prefix + "_podroz", "Dokument przekroczenia granicy", true, "Rodzaj, seria, numer, państwo wydania i data przekroczenia granicy. Przy dokumencie oznaczonym jako inny przygotuj kopię."), flag),
  when(text(prefix + "_legalnosc", "Dokument legalnego pobytu", true, "Rodzaj i status pobytu, seria, numer, data wydania i ważności (jeśli dotyczy). Przy innym dokumencie dołącz kopię."), flag),
];
const statement = choice("oswiadczenie", "Potwierdzam prawdziwość danych i znajomość warunków świadczenia. Jestem świadoma/świadomy odpowiedzialności karnej za złożenie fałszywego oświadczenia.", ["Potwierdzam"]);

function contactErrors(v: Values, today: string) {
  const errors: Values = {};
  if (v.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = "Wpisz pełny adres e-mail.";
  if (v.telefon?.trim() && !/^\+?[\d ()-]+$/.test(v.telefon.trim())) errors.telefon = "Wpisz numer telefonu z numerem kierunkowym.";
  if (v.telefon?.trim() && !/^\d{7,15}$/.test(v.telefon.replace(/[+\s()-]/g, ""))) errors.telefon = "Sprawdź liczbę cyfr telefonu.";
  for (const key of ["rodzic_data", "data_urodzenia"]) {
    if (v[key] && (!isValidIso(v[key]) || v[key] > today)) errors[key] = "Podaj prawidłową datę urodzenia do dzisiejszego dnia.";
  }
  return errors;
}

function availablePeriods(day: string) {
  const month = Number(day.slice(5, 7));
  const start = Number(day.slice(0, 4)) - Number(month < 6);
  const years = month >= 2 && month < 6 ? [start, start + 1] : [start];
  return years.map(y => `${y}/${y + 1}`);
}

const swr: FormDef = {
  name: "Wniosek rodzica o świadczenie wychowawcze 800+ (SW-R)",
  fidelity: "Elektroniczny wniosek matki lub ojca do ZUS. Okres trwa od 1 czerwca do 31 maja. Nowy wniosek można składać od 1 lutego.",
  channels: ["pue", "mzus", "bank", "empatia"], pdf: "none",
  sections: [
    { id: "ty", title: "Rodzic składający wniosek", fields: [
      { id: "okres", label: "Okres świadczeniowy", type: "select", required: true, get options() { return availablePeriods(todayInPoland()); } },
      choice("rola", "Dla dziecka jestem", ["Matką", "Ojcem"]), parent(), parentPesel, parentDob, citizen, status,
      list("adres", "Twój adres zamieszkania", "Podaj kraj, kod pocztowy, miejscowość, ulicę i numer domu lub lokalu.", true), email, phone,
      choice("spoza_ue", "Czy masz wyłącznie obywatelstwo państwa spoza UE, EFTA i Wielkiej Brytanii?"),
      ...foreignFields("spoza_ue", "rodzic"),
      when(text("aktywnosc", "Aktywność zawodowa lub podstawa zwolnienia", true, "Podaj status, kraj ubezpieczenia i tytuł opłacania składek. Przy pracy za granicą przygotuj potwierdzenie aktywności."), "spoza_ue"),
    ] },
    { id: "koordynacja", title: "Rodzina i świadczenia zagraniczne", fields: [
      text("praca", "Twój status zawodowy"), text("drugi_status", "Status zawodowy drugiego rodzica lub małżonka", true, "Jeśli nie dotyczy, wpisz „nie dotyczy”."),
      text("drugi_rodzic", "Dane drugiego rodzica lub małżonka", false, "Imię, nazwisko i PESEL, jeśli je podajesz."),
      { ...choice("zagranica", "Czy pracujesz lub pobierasz świadczenia w innym państwie UE, EFTA lub Wielkiej Brytanii?"), hint: "W sprawach brytyjskich zaznacz „Nie”, jeśli pierwszy pobyt w UK rozpoczął się po 31 grudnia 2020 r." },
      when(list("zagranica_dane", "Twoje dane do koordynacji", "Dla każdego kraju podaj zagraniczny identyfikator, adres, rodzaj pracy, dane i adres pracodawcy, okres zatrudnienia lub rodzaj i okres świadczenia.", true), "zagranica"),
      choice("drugi_zagranica", "Czy drugi rodzic lub małżonek mieszka, pracuje lub pobiera świadczenia w takim państwie?", ["Tak", "Nie", "Nie wiem"]),
      when(list("drugi_zagranica_dane", "Dane drugiego rodzica do koordynacji", "Dla każdej osoby podaj imię, nazwisko, państwo, identyfikator, adres i datę rozpoczęcia pobytu, okres, formę zatrudnienia, dane pracodawcy lub rodzaj świadczenia.", true), "drugi_zagranica"),
      choice("wniosek_zagranica", "Czy złożono wniosek o świadczenie rodzinne za granicą?"),
      when(text("wniosek_zagranica_dane", "Dziecko, kraj, instytucja i okres zagranicznego wniosku"), "wniosek_zagranica"),
    ] },
    { id: "dziecko", title: "Dzieci objęte wnioskiem", fields: [
      child, childPesel, birth, childCitizen, choice("wspolne", "Czy dziecko mieszka z Tobą i pozostaje na Twoim utrzymaniu?"),
      choice("adres_wspolny", "Czy adres zamieszkania dziecka jest taki sam jak Twój?"),
      when(text("adres_dziecka", "Adres zamieszkania dziecka"), "adres_wspolny", "Nie"),
      choice("naprzemienna", "Czy sąd orzekł opiekę naprzemienną?"),
      when(choice("wyrok", "Dołącz kopię orzeczenia sądu o opiece naprzemiennej", ["Dołączam orzeczenie"]), "naprzemienna"),
      choice("swiadczenie_zagranica", "Czy za granicą przysługuje świadczenie o podobnym charakterze?", ["Tak", "Nie", "Nie wiem"]),
      when(text("swiadczenie_dane", "Państwo, rodzaj i okres świadczenia"), "swiadczenie_zagranica"),
      choice("dziecko_zagraniczne", "Czy dziecko ma wyłącznie obywatelstwo państwa spoza UE, EFTA i Wielkiej Brytanii?"),
      ...foreignFields("dziecko_zagraniczne", "dziecko"),
      when(text("dziecko_nauka", "Edukacja dziecka", true, "Podaj szkołę/przedszkole lub podstawę zwolnienia, np. wiek dziecka. Przy odroczeniu lub innej formie nauki przygotuj potwierdzenie."), "dziecko_zagraniczne"),
      when(text("dziecko_orzeczenie", "Orzeczenie o niepełnosprawności", true, "Podaj numer i stopień, jeśli dotyczy, albo wpisz „brak”."), "dziecko_zagraniczne"),
      list("kolejne_sw", "Kolejne dzieci", "Każde w osobnym wierszu: imię i nazwisko | PESEL | obywatelstwo | data urodzenia (RRRR-MM-DD) | opieka, świadczenia zagraniczne i dokumenty dotyczące tego dziecka."),
      choice("wszystkie", "Potwierdzam wspólne zamieszkanie, utrzymanie wymienionych dzieci oraz brak okoliczności wyłączających prawo.", ["Potwierdzam"]),
    ] },
    { id: "wyplata", title: "Wypłata i oświadczenie", fields: [
      choice("rodzaj_konta", "Rachunek do wypłaty", ["Rachunek w Polsce", "Rachunek zagraniczny (adres za granicą)"]),
      when({ ...payout[1] }, "rodzaj_konta", "Rachunek w Polsce"),
      when(text("iban", "Rachunek w UE, EFTA lub Wielkiej Brytanii", true, "IBAN z kodem kraju"), "rodzaj_konta", "Rachunek zagraniczny (adres za granicą)"),
      when(text("bic", "Kod BIC/SWIFT banku"), "rodzaj_konta", "Rachunek zagraniczny (adres za granicą)"),
      statement,
    ] },
  ],
  validate(v, today) {
    const errors = contactErrors(v, today);
    if (isValidIso(v.data_urodzenia) && addMonths(v.data_urodzenia, 216) <= today.slice(0, 7) + "-01") errors.data_urodzenia = "Świadczenie przysługuje do ukończenia przez dziecko 18 lat.";
    if (v.wspolne === "Nie") errors.wspolne = "SW-R przysługuje rodzicowi, z którym dziecko mieszka i który je utrzymuje.";
    if (v.okres && !availablePeriods(today).includes(v.okres)) errors.okres = "Wybierz okres dostępny w dniu składania wniosku.";
    if (v.rodzaj_konta?.startsWith("Rachunek zagraniczny")) {
      const iban = (v.iban ?? "").replace(/\s/g, "").toUpperCase();
      const allowed = "AT BE BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT NL NO PT RO SK SI ES SE CH GB".split(" ");
      if (iban && (!allowed.includes(iban.slice(0, 2)) || !/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban))) errors.iban = "Wpisz IBAN rachunku w UE, EFTA lub Wielkiej Brytanii.";
      if (v.bic && !/^[A-Z]{6}[A-Z\d]{2}([A-Z\d]{3})?$/i.test(v.bic.trim())) errors.bic = "BIC ma 8 albo 11 znaków.";
    }
    const extra = rows(v.kolejne_sw);
    if (extra.some(r => r.length !== 5 || r.some(cell => !cell) || !isValidPesel(cleanId(r[1])) || !isValidIso(r[3]) || r[3] > today)) errors.kolejne_sw = "Sprawdź układ wiersza, datę urodzenia i PESEL każdego dziecka.";
    const ids = [v.dziecko_pesel, ...extra.map(r => r[1])].map(id => cleanId(id));
    if (new Set(ids).size !== ids.length) errors.kolejne_sw = "Każde dziecko wpisz tylko raz.";
    return errors;
  },
};

function address(prefix: string): FormField[] {
  return [text(prefix + "_gmina", "Gmina lub dzielnica"), text(prefix + "_kod", "Kod pocztowy"),
    text(prefix + "_miasto", "Miejscowość"), text(prefix + "_ulica", "Ulica", false),
    text(prefix + "_dom", "Numer domu"), text(prefix + "_lokal", "Numer mieszkania", false)];
}
function names(prefix: "rodzic" | "dziecko"): FormField[] {
  return ["imie", "nazwisko"].map((key, i) => ({
    ...text(prefix + "_" + key, (i ? "Nazwisko" : "Imię") + (prefix === "dziecko" ? " dziecka" : " wnioskodawcy")),
    prefill: ctx => {
      const parts = (prefix === "dziecko" ? ctx.childName : ctx.parentName)?.trim().split(/\s+/);
      return i ? parts?.slice(1).join(" ") : parts?.[0];
    },
  }));
}

const sr2: FormDef = {
  name: "Wniosek o jednorazową zapomogę z tytułu urodzenia się dziecka (SR-2)",
  fidelity: "Ministerialny wzór SR-2(10). Podpisz wniosek i każde oświadczenie na wydruku. W Emp@tii wypełnij wniosek elektroniczny.",
  channels: ["empatia", "gmina", "poczta"], pdf: "official",
  recipientFor: v => v.urzad || "Urząd gminy",
  buildOfficial: async (v, date, fonts) => (await import("../forms/sr2-pdf")).buildSr2(v, date, fonts),
  validateChannel: (v, channel): Values => channel === "empatia" && !v.email?.trim() ? { email: "Przy składaniu przez Emp@tię podaj adres e-mail." } : {},
  sections: [
    { id: "organ", title: "Organ gminy właściwej dla Twojego adresu", fields: [
      text("urzad", "Nazwa organu", true, "Wójt, burmistrz albo prezydent miasta."), ...address("urzad"),
    ] },
    { id: "ty", title: "Wnioskodawca", fields: [
      choice("rola", "W jakim charakterze składasz wniosek?", ["Rodzic biologiczny", "Rodzic adopcyjny", "Opiekun prawny", "Opiekun faktyczny", "Opiekun tymczasowy", "Opiekun wskazany przez władze kraju pochodzenia"]),
      ...names("rodzic"), { ...parentPesel, required: false }, text("rodzic_dokument", "Seria i numer dokumentu, jeśli nie masz PESEL", false),
      parentDob, citizen, status, ...address("adres"), { ...phone, required: false }, { ...email, required: false, hint: "Obowiązkowy przy wysyłce przez Emp@tię." },
    ] },
    { id: "dziecko", title: "Dzieci objęte wnioskiem", fields: [
      ...names("dziecko"), { ...childPesel, required: false }, text("dziecko_dokument", "Dokument dziecka, jeśli nie ma PESEL", false), birth, childCitizen,
      list("kolejne_dzieci", "Kolejne dzieci objęte wnioskiem", "Każde w osobnym wierszu: imię | nazwisko | PESEL lub dok: seria i numer | data urodzenia RRRR-MM-DD | obywatelstwo."),
    ] },
    { id: "rodzina", title: "Skład rodziny i ubezpieczenie", fields: [
      list("rodzina", "Pozostali członkowie rodziny", "Wpisz małżonka lub drugiego rodzica i pozostałe osoby zaliczane do rodziny. Siebie i dzieci z wniosku wpisujemy automatycznie (z wyłączeniem dzieci pod opieką prawną). Każdy w osobnym wierszu: imię | nazwisko | PESEL lub dok: seria i numer | pokrewieństwo."),
      choice("skladki", "Organ składek zdrowotnych rodziny", ["ZUS", "KRUS", "ZUS i KRUS", "Inny", "ZUS i inny", "KRUS i inny", "ZUS, KRUS i inny", "Brak"]),
      text("skladki_inny", "Nazwa i adres innego organu składek", false),
    ] },
    { id: "dochody", title: "Dochody rodziny", fields: [
      { ...text("alimenty", "Łączna kwota alimentów zapłaconych innym osobom w roku bazowym (zł)"), get hint() { return `Wpisz 0, jeśli ich nie było. Rok bazowy dla wniosku składanego teraz to ${incomeYear(todayInPoland())}.`; } },
      choice("nieopodatkowane", "Czy w roku bazowym ktoś z rodziny uzyskał dochody wymienione w ZSR-05?"),
      when(list("dochody_osoby", "Dochody do oświadczeń ZSR-05", "Każdy dochód w osobnym wierszu: PESEL lub dok: seria i numer członka rodziny | rodzaj dochodu | kwota roczna w zł.", true), "nieopodatkowane"),
      choice("rolne", "Czy w roku bazowym rodzina uzyskała dochód z gospodarstwa rolnego?"),
      when(list("hektary_osoby", "Gospodarstwa do oświadczeń ZSR-07", "Dla każdego właściciela w osobnym wierszu: PESEL lub dok: seria i numer | powierzchnia w hektarach przeliczeniowych (do 4 miejsc po przecinku).", true), "rolne"),
      choice("utrata", "Czy w roku bazowym lub później ktoś z rodziny utracił dochód?"),
      choice("uzyskanie", "Czy w roku bazowym lub później ktoś z rodziny uzyskał nowy dochód?"),
    ] },
    { id: "dokumenty", title: "Dokumenty do dołączenia i oświadczenia", fields: [
      when({ ...choice("zaswiadczenie", "Dołączam zaświadczenie od lekarza lub położnej o opiece od najpóźniej 10. tygodnia ciąży do porodu"), hint: "Zaświadczenie dokumentuje opiekę w każdym trymestrze." }, "rola", "Rodzic biologiczny"),
      choice("samotnie", "Czy samotnie wychowujesz dziecko?"),
      when(choice("alimenty_tytul", "Dokument dotyczący alimentów od drugiego rodzica", singleReasons), "samotnie"),
      choice("pobyt_dokument", "Czy dołączasz dokument potwierdzający prawo pobytu w Polsce?"),
      list("inne_zalaczniki", "Inne dołączane dokumenty", "Wpisz nazwę każdego dokumentu w osobnym wierszu."),
      choice("zagranica_sr", "Potwierdzam, że członkowi rodziny nie przysługuje na to dziecko świadczenie z tytułu urodzenia za granicą.", ["Potwierdzam"]),
      statement, text("miejscowosc", "Miejscowość podpisania wniosku"),
    ] },
    { id: "wyplata", title: "Wypłata", fields: payout },
  ],
  validate(v, today) {
    const errors = { ...contactErrors(v, today), ...srErrors(v, today) };
    if (v.skladki?.toLowerCase().includes("inny") && !v.skladki_inny?.trim()) errors.skladki_inny = "Wpisz nazwę i adres jednostki.";
    if (v.rola === "Rodzic biologiczny") {
      const late = (date?: string) => date && isValidIso(date) && today > addMonths(date, 12);
      if (late(v.data_urodzenia)) errors.data_urodzenia = "Termin wynosi 12 miesięcy od urodzenia dziecka.";
      if (srPeople(v).children.slice(1).some(c => late(c.birth))) errors.kolejne_dzieci = "Sprawdź termin 12 miesięcy od urodzenia każdego dziecka.";
    }
    return errors;
  },
};

export const benefitsForms: Record<string, FormDef> = { "800plus": swr, becikowe: sr2 };
