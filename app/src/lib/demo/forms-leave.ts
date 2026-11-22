import { addDays, addMonths, daysBetween, formatShort, isValidIso } from "../rules/dates";
import { limitsFor, MATERNITY_PARAMETERS } from "../rules/maternity";
import { birth, child, employer, parent, YES_NO, type FormDef, type FormField } from "./form-fields";

type Values = Record<string, string>;

const letter = { channels: ["pracodawca", "email"], pdf: "letter" } satisfies Pick<FormDef, "channels" | "pdf">;
const date = (id: string, label: string): FormField => ({ id, label, type: "date", required: true });
const choice = (id: string, label: string, options: string[]): FormField => ({ id, label, type: "select", required: true, options });
const town: FormField = { id: "miejscowosc", label: "Miejscowość sporządzenia pisma", type: "text", required: true };
const sender = { id: "ty", title: "Pracownik i pracodawca", fields: [parent(), employer, town] };
const start = date("od", "Pierwszy dzień urlopu");
const end = date("do", "Ostatni dzień urlopu (włącznie)");
const attach = ["Dołączam do wniosku", "Dokument jest już w aktach osobowych"];
const birthRecord = { ...choice("odpis", "Odpis skrócony aktu urodzenia lub dokument zagraniczny (może być kopia)", attach),
  hint: "Do zagranicznego dokumentu dołącz tłumaczenie na polski, chyba że ma zastosowanie zwolnienie z § 21 rozporządzenia." };
const blank = "…………";
const writtenDate = (iso: string) => isValidIso(iso) ? formatShort(iso) : blank;
const period = (from: string, to: string) => `od ${writtenDate(from)} do ${writtenDate(to)} włącznie`;
const docStatus = (label: string, status: string) => `${label} — ${status || blank}.`;
const childLabel = (v: Values) => `${v.dziecko || blank} (data urodzenia ${writtenDate(v.data_urodzenia)})`;

function timing(v: Values, today: string, notice: number): Values {
  const errors: Values = {};
  if (isValidIso(v.od) && isValidIso(today) && daysBetween(today, v.od) < notice) errors.od = `Złóż wniosek co najmniej ${notice} dni przed rozpoczęciem.`;
  if (isValidIso(v.od) && isValidIso(v.do) && v.do < v.od) errors.do = "Koniec okresu musi przypadać w dniu rozpoczęcia lub później.";
  if (isValidIso(v.od) && isValidIso(v.data_urodzenia) && v.od < v.data_urodzenia) errors.od = "Okres nie może się zaczynać przed urodzeniem dziecka.";
  if (isValidIso(v.data_urodzenia) && v.data_urodzenia > today) errors.data_urodzenia = "Podaj rzeczywistą datę urodzenia z dokumentu dziecka.";
  return errors;
}

const firstWeek = "1 tydzień";
const bothWeeks = "2 tygodnie";
const usedFather = ["Nie korzystałem", "Wykorzystałem 1 tydzień", "Wykorzystałem 2 tygodnie"];
const fatherEnd = (v: Values) => isValidIso(v.od) && [firstWeek, bothWeeks].includes(v.okres)
  ? addDays(v.od, v.okres === firstWeek ? 6 : 13) : "";
const births = "Urodzenie dziecka";
const adoption = "Przysposobienie";
const foster = "Niezawodowa rodzina zastępcza";
const situation = (options: string[]) => choice("sytuacja", "W jakiej sytuacji wnioskujesz?", options);

const parentsHistory = [
  { id: "wykorzystane_moje", label: "Ile dni urlopu lub zasiłku rodzicielskiego wykorzystałeś lub wykorzystałaś?", hint: "Wpisz 0, jeśli to pierwszy wniosek. Licz tylko dni z podstawowej puli, bez dni wydłużenia za pracę.", type: "text", required: true },
  { id: "wykorzystane_drugiego", label: "Ile dni z tej samej puli wykorzystał drugi rodzic?", type: "text", required: true },
  choice("liczba_czesci", "Liczba dotychczas wykorzystanych części urlopu lub wniosków o zasiłek obojga rodziców", ["0", "1", "2", "3", "4", "5"]),
  { id: "poprzednie_okresy", label: "Daty poprzednich części (jeśli były)", hint: "Wpisz okresy od–do oraz rodzica, którego dotyczyły.", type: "textarea" },
] satisfies FormField[];
const one = "Jedno dziecko";
const multiple = "Dwoje lub więcej dzieci";
const minimum = "9 tygodni urlopu na warunkach macierzyńskiego przy przyjęciu na wychowanie";
const extension = "Korzystam z uprawnienia „Za życiem”";
const currentPool = (v: Values) => {
  const limits = limitsFor({ children: v.liczba_dzieci === multiple ? 2 : 1, zaZyciem: v.za_zyciem === extension });
  return v.liczba_dzieci === minimum ? (v.za_zyciem === extension ? 62 : 38) : limits.parentalPoolWeeks;
};

function validateParental(v: Values, today: string): Values {
  const errors = timing(v, today, 21);
  if (v.sytuacja === births && v.liczba_dzieci === minimum) errors.liczba_dzieci = "Dla porodu wybierz liczbę dzieci urodzonych przy jednym porodzie.";
  if (isValidIso(v.data_urodzenia) && isValidIso(v.do)) {
    const until = v.sytuacja === adoption ? addDays(addMonths(v.data_urodzenia, 14 * 12), -1)
      : v.sytuacja === foster ? addDays(addMonths(v.data_urodzenia, (v.odroczenie === "Tak" ? 10 : 7) * 12), -1)
      : `${Number(v.data_urodzenia.slice(0, 4)) + 6}-12-31`;
    if (v.do > until) errors.do = `W tej sytuacji ostatni dzień urlopu to najpóźniej ${writtenDate(until)}.`;
  }
  if (v.sytuacja !== births && isValidIso(v.przyjecie) && isValidIso(v.od) && v.od < v.przyjecie) errors.od = "Urlop nie może się zacząć przed przyjęciem dziecka na wychowanie.";
  for (const key of ["wykorzystane_moje", "wykorzystane_drugiego"]) {
    if (v[key] && !/^\d+$/.test(v[key].trim())) errors[key] = "Wpisz liczbę dni cyframi, np. 0 albo 14.";
  }
  const previous = Number(v.wykorzystane_moje) + Number(v.wykorzystane_drugiego);
  if (previous > 0 && !v.poprzednie_okresy?.trim()) errors.poprzednie_okresy = "Wymień wykorzystane okresy urlopu lub zasiłku.";
  if (v.liczba_czesci === "5") errors.liczba_czesci = "Rodzice wykorzystali już wszystkie pięć części.";
  else if (Number.isFinite(previous) && v.liczba_czesci && (previous > 0) !== (Number(v.liczba_czesci) > 0)) errors.liczba_czesci = "Liczba części nie pasuje do wykorzystanych dni. Przy 0 dni wybierz 0, a gdy dni były wykorzystane, co najmniej 1.";
  let concurrent = 0;
  if (v.drugi === "Tak" && isValidIso(v.drugi_od) && isValidIso(v.drugi_do)) {
    concurrent = daysBetween(v.drugi_od, v.drugi_do) + 1;
    if (v.drugi_od < v.od || v.drugi_od > v.do) errors.drugi_od = "Podaj początek wspólnego okresu w granicach tego wniosku.";
    if (concurrent <= 0 || v.drugi_do > v.do) errors.drugi_do = "Podaj koniec wspólnego okresu w granicach tego wniosku.";
  }
  if (v.liczba_dzieci && v.za_zyciem && isValidIso(v.od) && isValidIso(v.do) && !errors.do) {
    const request = daysBetween(v.od, v.do) + 1;
    const pool = currentPool(v);
    const personal = (pool - MATERNITY_PARAMETERS.exclusiveWeeks) * 7;
    if (request + Number(v.wykorzystane_moje) > personal) errors.do = "Ten okres wchodzi w 9 tygodni zarezerwowanych dla drugiego rodzica.";
    else if (Number(v.wykorzystane_drugiego) + concurrent > personal || previous + request + concurrent > pool * 7) errors.do = `Po uwzględnieniu urlopu drugiego rodzica przekraczasz dostępny wymiar (wspólna pula: ${pool} tyg.).`;
  }
  return errors;
}

function validWork(raw: string): boolean {
  // Kadry mogą uzgodnić także np. 1/5 etatu — wykaz typowych wymiarów nie jest zamknięty.
  const ratio = /^(\d+)\s*\/\s*(\d+)$/.exec(raw.trim());
  const value = ratio ? Number(ratio[1]) / Number(ratio[2]) : /^\d+(?:[.,]\d+)?$/.test(raw.trim()) ? Number(raw.trim().replace(",", ".")) : NaN;
  return value > 0 && value <= 0.5;
}

export const leaveForms: Record<string, FormDef> = {
  "macierzynski-przed": {
    ...letter,
    name: "Wniosek o udzielenie części urlopu macierzyńskiego przed porodem",
    fidelity: "Przekaż pismo pracodawcy przed rozpoczęciem urlopu. Możesz zacząć do 6 tygodni przed przewidywaną datą porodu.",
    sections: [sender, { id: "urlop", title: "Urlop przed porodem", fields: [
      { ...date("termin", "Przewidywana data porodu z zaświadczenia"), prefill: c => c.dueDate }, start,
      choice("zaswiadczenie", "Kopia zaświadczenia lekarskiego o przewidywanej dacie porodu", attach),
    ] }],
    validate(v, today) {
      const errors: Values = {};
      if (isValidIso(v.termin) && isValidIso(v.od)) {
        const before = daysBetween(v.od, v.termin);
        if (before < 1 || before > MATERNITY_PARAMETERS.maxWeeksBeforeBirth * 7) errors.od = "Wybierz dzień w ciągu 6 tygodni przed przewidywaną datą porodu.";
        else if (v.od < today) errors.od = "Wybierz dzisiejszą lub przyszłą datę rozpoczęcia urlopu.";
      }
      return errors;
    },
    letter: v => [
      `Na podstawie art. 180 § 2 Kodeksu pracy wnoszę o udzielenie mi części urlopu macierzyńskiego od ${writtenDate(v.od)} przed przewidywaną datą porodu ${writtenDate(v.termin)}.`,
      docStatus("Załącznik: kopia zaświadczenia lekarskiego o przewidywanej dacie porodu", v.zaswiadczenie),
    ],
  },
  "urlop-ojcowski": {
    ...letter,
    name: "Wniosek o udzielenie urlopu ojcowskiego",
    fidelity: "Złóż wniosek u pracodawcy co najmniej 7 dni przed urlopem. W tym piśmie podajesz jeden okres urlopu.",
    sections: [
      { ...sender, fields: [{ ...parent("Imię i nazwisko ojca"), prefill: c => c.secondParentName }, { ...employer, label: "Pracodawca ojca", prefill: undefined }, town] },
      { id: "dziecko", title: "Dziecko", fields: [child, birth, situation([births, adoption]),
        { ...date("adopcja", "Data uprawomocnienia się postanowienia o przysposobieniu"), showIf: { field: "sytuacja", equals: adoption } }] },
      { id: "urlop", title: "Okres i dokumenty", fields: [start, choice("okres", "Długość wnioskowanej części", [firstWeek, bothWeeks]),
        choice("wykorzystany", "Czy korzystałeś już z urlopu ojcowskiego na to dziecko?", usedFather), birthRecord,
        { ...choice("postanowienie", "Kopia prawomocnego postanowienia o przysposobieniu", attach), showIf: { field: "sytuacja", equals: adoption } }] },
    ],
    validate(v, today) {
      const errors = timing({ ...v, do: "" }, today, 7);
      const last = fatherEnd(v);
      const since = v.sytuacja === adoption ? v.adopcja : v.data_urodzenia;
      if (last && isValidIso(since) && (v.od < since || last >= addMonths(since, MATERNITY_PARAMETERS.paternityMonths))) errors.od = "Cały urlop musi przypadać w ciągu 12 miesięcy od urodzenia lub prawomocnego przysposobienia.";
      if (last && v.sytuacja === adoption && isValidIso(v.data_urodzenia) && last >= addMonths(v.data_urodzenia, 14 * 12)) errors.od = "Urlop musi się zakończyć przed 14. urodzinami dziecka.";
      if (v.wykorzystany === usedFather[2] || (v.wykorzystany === usedFather[1] && v.okres === bothWeeks)) errors.okres = "Łącznie możesz wykorzystać do dwóch tygodni urlopu ojcowskiego.";
      return errors;
    },
    letter: v => [
      `Na podstawie art. 182³ Kodeksu pracy wnoszę o urlop ojcowski ${period(v.od, fatherEnd(v))}. Dziecko: ${childLabel(v)}.`,
      `Oświadczenie o dotychczasowym urlopie ojcowskim na to dziecko: ${v.wykorzystany || blank}.`,
      docStatus("Załącznik: odpis skrócony aktu urodzenia lub odpowiadający mu dokument zagraniczny (albo kopia)", v.odpis),
      ...(v.sytuacja === adoption ? [docStatus(`Załącznik: kopia postanowienia o przysposobieniu, prawomocnego od ${writtenDate(v.adopcja)}`, v.postanowienie)] : []),
    ],
  },
  rodzicielski: {
    ...letter,
    name: "Wniosek o udzielenie urlopu rodzicielskiego",
    fidelity: "Złóż pismo co najmniej 21 dni przed planowanym początkiem urlopu. Aby pracować podczas urlopu, złóż również osobny wniosek o łączenie urlopu z pracą.",
    sections: [sender, { id: "dziecko", title: "Dziecko i wymiar urlopu", fields: [child, birth, situation([births, adoption, foster]),
      choice("liczba_dzieci", "Podstawa wymiaru urlopu", [one, multiple, minimum]),
      choice("za_zyciem", "Wymiar urlopu", ["Podstawowy", extension]),
      { ...choice("odroczenie", "Czy odroczono obowiązek szkolny dziecka?", YES_NO), showIf: { field: "sytuacja", equals: foster } },
      { ...date("przyjecie_adopcja", "Data przyjęcia dziecka na wychowanie"), showIf: { field: "sytuacja", equals: adoption } },
      { ...date("przyjecie_piecza", "Data przyjęcia dziecka pod pieczę"), showIf: { field: "sytuacja", equals: foster } },
    ] }, { id: "urlop", title: "Wnioskowany okres i poprzednie części", fields: [start, end, ...parentsHistory,
      choice("drugi", "Czy drugi rodzic zamierza korzystać z urlopu rodzicielskiego lub zasiłku za ten okres równocześnie?", YES_NO),
      { ...date("drugi_od", "Początek wspólnego okresu"), showIf: { field: "drugi", equals: "Tak" } },
      { ...date("drugi_do", "Koniec wspólnego okresu"), showIf: { field: "drugi", equals: "Tak" } },
    ] }, { id: "zalaczniki", title: "Załączniki", fields: [
      { ...birthRecord, showIf: { field: "sytuacja", equals: births } },
      { ...choice("sad", "Kopia wniosku z poświadczeniem sądu lub zaświadczenie sądu o wystąpieniu o przysposobienie", attach), showIf: { field: "sytuacja", equals: adoption } },
      { ...choice("piecza", "Kopia prawomocnego orzeczenia o umieszczeniu w rodzinie zastępczej lub umowy ze starostą", attach), showIf: { field: "sytuacja", equals: foster } },
      { ...choice("zaswiadczenie", "Kopia zaświadczenia „Za życiem”", attach), showIf: { field: "za_zyciem", equals: extension } },
    ] }],
    validate(v, today) { return validateParental({ ...v, przyjecie: v.sytuacja === adoption ? v.przyjecie_adopcja : v.przyjecie_piecza }, today); },
    letter: v => [
      `Na podstawie ${v.sytuacja === births ? "art. 182¹d" : "art. 183"} Kodeksu pracy wnoszę o udzielenie mi urlopu rodzicielskiego ${period(v.od, v.do)} w celu sprawowania opieki nad dzieckiem: ${childLabel(v)}.`,
      `Wykorzystany dotąd urlop rodzicielski lub zasiłek za odpowiadający mu okres: przeze mnie ${v.wykorzystane_moje || blank} dni, przez drugiego rodzica ${v.wykorzystane_drugiego || blank} dni. Liczba dotychczas wykorzystanych części urlopu lub wniosków o zasiłek: ${v.liczba_czesci || blank}.`,
      ...(Number(v.liczba_czesci) > 0 ? [`Poprzednie okresy: ${v.poprzednie_okresy || blank}.`] : []),
      `Oświadczenie: drugi rodzic ${v.drugi === "Tak" ? `zamierza korzystać z urlopu rodzicielskiego lub zasiłku ${period(v.drugi_od, v.drugi_do)}` : v.drugi === "Nie" ? "nie zamierza korzystać z urlopu rodzicielskiego ani zasiłku za odpowiadający mu okres w czasie objętym tym wnioskiem" : blank}.`,
      ...(v.sytuacja === births ? [docStatus("Załącznik: odpis skrócony aktu urodzenia lub zagraniczny dokument urodzenia (albo kopia)", v.odpis)] : []),
      ...(v.sytuacja === adoption ? [`Dziecko zostało przyjęte na wychowanie ${writtenDate(v.przyjecie_adopcja)}.`, docStatus("Załącznik: kopia wniosku z poświadczeniem sądu lub zaświadczenie sądu o wystąpieniu o przysposobienie", v.sad)] : []),
      ...(v.sytuacja === foster ? [`Dziecko zostało przyjęte pod pieczę ${writtenDate(v.przyjecie_piecza)}.`, docStatus("Załącznik: kopia orzeczenia sądu lub umowy ze starostą o umieszczeniu w rodzinie zastępczej", v.piecza)] : []),
      ...(v.sytuacja === foster && v.odroczenie === "Tak" ? ["Dodatkowy dokument: kopia prawomocnej decyzji o odroczeniu obowiązku szkolnego, jeżeli nie ma jej w aktach osobowych."] : []),
      ...(v.za_zyciem === extension ? [docStatus("Załącznik: kopia zaświadczenia „Za życiem”", v.zaswiadczenie)] : []),
    ],
  },
  "rodzicielski-praca": {
    ...letter,
    name: "Wniosek o łączenie urlopu rodzicielskiego z wykonywaniem pracy",
    fidelity: "Złóż osobne pismo u pracodawcy udzielającego urlopu co najmniej 21 dni przed rozpoczęciem pracy.",
    sections: [sender, { id: "praca", title: "Praca podczas urlopu", fields: [
      date("od", "Pierwszy dzień łączenia urlopu z pracą"), date("do", "Ostatni dzień łączenia urlopu z pracą (włącznie)"),
      { id: "wymiar", label: "Wymiar pracy (część pełnego etatu)", hint: "Np. 1/5 albo 0,5. Możesz pracować do połowy pełnego etatu.", type: "text", required: true },
      choice("wydluzenie", "Czy zamierzasz pracować także podczas części urlopu powstałej z wydłużenia?", YES_NO),
      { id: "wymiar_wydluzenia", label: "Wymiar pracy podczas wydłużenia (część pełnego etatu)", type: "text", required: true, showIf: { field: "wydluzenie", equals: "Tak" } },
    ] }],
    validate(v, today) {
      const errors = timing(v, today, 21);
      for (const id of v.wydluzenie === "Tak" ? ["wymiar", "wymiar_wydluzenia"] : ["wymiar"]) {
        if (v[id] && !validWork(v[id])) errors[id] = "Podaj wymiar większy od zera i nie większy niż pół etatu, np. 1/4 albo 0,5.";
      }
      return errors;
    },
    letter: v => [
      `Na podstawie art. 182¹e Kodeksu pracy wnoszę o łączenie urlopu rodzicielskiego z pracą u pracodawcy udzielającego urlopu ${period(v.od, v.do)}, w wymiarze ${v.wymiar || blank} pełnego etatu.`,
      v.wydluzenie === "Tak" ? `Oświadczam, że zamierzam łączyć część urlopu powstałą w wyniku wydłużenia z pracą w wymiarze ${v.wymiar_wydluzenia || blank} pełnego etatu.`
        : v.wydluzenie === "Nie" ? "Oświadczam, że nie zamierzam łączyć części urlopu powstałej w wyniku wydłużenia z pracą." : "Oświadczenie o pracy w okresie wydłużenia: …………",
      "Załączniki: brak.",
    ],
  },
};
