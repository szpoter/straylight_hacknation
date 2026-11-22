import { formatShort, isValidIso } from "../rules/dates";
import { averagedDeadline, maternityEnd } from "../forms/maternity-period";
import { birth, child, childPesel, employer, parent, parentPesel, payout, YES_NO, type Channel, type FormDef, type FormField } from "./form-fields";

const workplace = ["pracodawca", "poczta", "email"] as const;
const text = (id: string, label: string, required = true): FormField => ({ id, label, required, type: "text" });
const date = (id: string, label: string): FormField => ({ id, label, type: "date", required: true });
const yesNo = (id: string, label: string): FormField => ({ id, label, type: "radio", required: true, options: YES_NO });
const only = (field: string, equals: string) => ({ field, equals });
const idType = (id: string, label: string): FormField => ({
  id, label, type: "radio", required: true, options: ["PESEL", "Dokument tożsamości"], prefill: () => "PESEL",
});
const city = text("miejscowosc", "Miejscowość");
const familyName = /\S+\s+\S+/;
const zamAttachments = "Gdy zasiłek wypłaca pracodawca, dołącz skrócony odpis aktu urodzenia. Gdy płaci ZUS, pracodawca przekazuje Z-3, a ZUS pobiera polski akt z rejestru. W razie wezwania dostarcz odpis.";
const deliveryFields = [
  text("email_kadr", "Adres e-mail uzgodniony z kadrami (dla wysyłki e-mailem)", false),
  text("adres_pocztowy", "Adres pocztowy płatnika (dla wysyłki pocztą)", false),
];
const isZusChannel = (channel: Channel) => channel === "pue" || channel === "zus" || channel === "edoreczenia";

function recipient(v: Record<string, string>, channel: Channel): string {
  if (channel === "edoreczenia") return ["ZUS", v.zus_ade].filter(Boolean).join(" · ");
  if (isZusChannel(channel)) return "Zakład Ubezpieczeń Społecznych";
  const postalToZus = channel === "poczta" && v.platnik === "ZUS";
  const name = postalToZus ? "Zakład Ubezpieczeń Społecznych" : (v.pracodawca || "Pracodawca");
  const address = channel === "poczta" ? v.adres_pocztowy : channel === "email" ? v.email_kadr : "";
  return [name, address].filter(Boolean).join(" · ");
}

function deliveryErrors(v: Record<string, string>, channel: Channel): Record<string, string> {
  if (isZusChannel(channel) && v.platnik !== "ZUS") return { platnik: "Ten kanał służy do złożenia wniosku, gdy zasiłek wypłaca ZUS. Gdy płaci pracodawca, przekaż wniosek kadrom." };
  if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email_kadr?.trim() ?? "")) return { email_kadr: "Podaj uzgodniony adres e-mail pracodawcy." };
  if (channel === "poczta" && !v.adres_pocztowy?.trim()) return { adres_pocztowy: "Podaj adres do wysyłki listu z podpisanym wnioskiem." };
  if (channel === "edoreczenia" && !/^AE:PL-\d{5}-\d{5}-[A-Z]{5}-\d{2}$/.test(v.zus_ade?.trim() ?? "")) return { zus_ade: "Wpisz adres do e-Doręczeń wybranego oddziału ZUS z Bazy Adresów Elektronicznych." };
  return {};
}

export const insuranceForms: Record<string, FormDef> = {
  "zasilek-macierzynski": {
    name: "Wniosek o zasiłek macierzyński (ZAM)",
    fidelity: "Druk ZUS z 24.10.2026 r. dla pracownicy po porodzie w Polsce. Gdy płaci pracodawca, przekaż wniosek kadrom. Gdy płaci ZUS, możesz go złożyć za pośrednictwem kadr lub bezpośrednio w ZUS, także przez eZUS lub e-Doręczenia. " + zamAttachments,
    channels: [...workplace, "pue", "zus", "edoreczenia"], pdf: "official",
    recipientFor: recipient, validateChannel: deliveryErrors,
    buildOfficial: async (v, day, fonts) => (await import("../forms/maternity-zam")).buildMaternityZam(v, day, fonts),
    sections: [
      { id: "ty", title: "Twoje dane i płatnik składek", fields: [
        parent("Twoje pierwsze imię i nazwisko"), idType("identyfikator", "Twój identyfikator"),
        { ...parentPesel, showIf: only("identyfikator", "PESEL") },
        { ...text("rodzic_dokument", "Rodzaj, seria i numer dokumentu tożsamości"), showIf: only("identyfikator", "Dokument tożsamości") },
        { ...date("rodzic_data", "Twoja data urodzenia"), showIf: only("identyfikator", "Dokument tożsamości") },
        text("ulica", "Ulica (jeśli jest)", false), text("dom", "Numer domu"), text("lokal", "Numer lokalu (jeśli jest)", false),
        text("kod", "Kod pocztowy"), city, text("panstwo", "Państwo (jeśli adres jest za granicą)", false),
        employer, { ...text("nip", "NIP pracodawcy"), hint: "10 cyfr" },
        { id: "platnik", label: "Kto wypłaca Ci zasiłek?", type: "radio", required: true, options: ["ZUS", "Pracodawca"], hint: "Sprawdź w kadrach. Zwykle płaci ZUS przy najwyżej 20 ubezpieczonych, a przy większej liczbie pracodawca." },
        ...deliveryFields,
        { ...text("zus_ade", "Adres do e-Doręczeń oddziału ZUS (dla tej drogi wysyłki)", false), showIf: only("platnik", "ZUS"), hint: "Skopiuj adres oddziału ZUS z Bazy Adresów Elektronicznych. Wniosek podpisz elektronicznie." },
      ] },
      { id: "dziecko", title: "Dzieci z tego porodu", fields: [
        child, birth, text("miejsce_urodzenia", "Miejscowość urodzenia dziecka"),
        { ...yesNo("pesel_nadany", "Czy dziecko ma już PESEL?"), prefill: () => "Tak" },
        { ...childPesel, showIf: only("pesel_nadany", "Tak") },
        { id: "liczba_dzieci", label: "Liczba dzieci z tego porodu", type: "select", required: true, options: ["1", "2", "3", "4", "5 lub więcej"], prefill: () => "1" },
        { id: "pozostale_dzieci", label: "Pozostałe dzieci z tego porodu (przy porodzie mnogim)", type: "textarea", hint: "W osobnym wierszu wpisz imię i nazwisko, datę i miejscowość urodzenia oraz PESEL każdego kolejnego dziecka, jeśli go nadano. Dołączymy te dane do ZAM." },
        text("za_zyciem", "Imię każdego dziecka z zaświadczeniem „Za życiem” (jeśli dotyczy)", false),
      ] },
      { id: "drugi", title: "Drugi rodzic", fields: [
        { ...text("drugi_rodzic", "Pierwsze imię i nazwisko drugiego rodzica"), prefill: (c) => c.secondParentName },
        idType("drugi_id", "Identyfikator drugiego rodzica"),
        { ...parentPesel, id: "drugi_pesel", label: "PESEL drugiego rodzica", showIf: only("drugi_id", "PESEL") },
        { ...text("drugi_dokument", "Rodzaj, seria i numer dokumentu drugiego rodzica"), showIf: only("drugi_id", "Dokument tożsamości") },
        { ...date("drugi_data", "Data urodzenia drugiego rodzica"), showIf: only("drugi_id", "Dokument tożsamości") },
      ] },
      { id: "zakres", title: "Okres i wysokość zasiłku", fields: [
        { ...date("od", "Pierwszy dzień urlopu macierzyńskiego"), prefill: c => c.birthDate },
        { ...date("do", "Ostatni dzień wnioskowanego okresu (jeśli krótszy)"), required: false, hint: "Puste pole oznacza pełny wymiar. Zależnie od liczby dzieci wpiszemy do druku okres 20, 31, 33, 35 lub 37 tygodni od pierwszego dnia urlopu." },
        { ...yesNo("caly_okres", "Czy wybierasz stawkę 81,5% i deklarujesz pełny wymiar urlopu macierzyńskiego i rodzicielskiego, w tym co najmniej jeden dzień rodzicielskiego w pierwszym roku życia dziecka?"),
          hint: "Wybór 81,5% wymaga złożenia wniosku do 21 dni po porodzie. Jeśli ostatni dzień to sobota lub dzień ustawowo wolny, termin upływa w najbliższym dniu roboczym. Dziewięć tygodni zarezerwowanych dla drugiego rodzica jest płatne w wysokości 70%." },
      ] },
      { id: "wyplata", title: "Wypłata", fields: payout },
    ],
    validate(v, today) {
      const errors: Record<string, string> = {};
      for (const key of ["rodzic", "drugi_rodzic", "dziecko"]) {
        if (v[key] && !familyName.test(v[key].trim())) errors[key] = "Wpisz imię i nazwisko.";
      }
      if (v.nip && !/^\d{10}$/.test(v.nip.replace(/[\s-]/g, ""))) errors.nip = "Wpisz 10 cyfr NIP pracodawcy.";
      if (v.data_urodzenia > today) errors.data_urodzenia = "Ten wniosek składasz po porodzie.";
      if (v.caly_okres === "Tak" && isValidIso(v.data_urodzenia) && today > averagedDeadline(v.data_urodzenia)) errors.caly_okres = "Termin wyboru stawki 81,5% minął. Możesz nadal wnioskować o zasiłek według zwykłych stawek.";
      if (v.od && v.data_urodzenia && v.od > v.data_urodzenia) errors.od = "Urlop macierzyński zaczyna się najpóźniej w dniu porodu.";
      const count = parseInt(v.liczba_dzieci, 10);
      const extra = v.pozostale_dzieci?.split(/\r?\n/).filter(s => s.trim()).length ?? 0;
      if (count >= 2 && (count < 5 ? extra !== count - 1 : extra < 4)) errors.pozostale_dzieci = "Podaj dane każdego kolejnego dziecka w osobnym wierszu.";
      if (count === 1 && extra) errors.pozostale_dzieci = "Sprawdź liczbę dzieci lub usuń dane dodatkowych dzieci.";
      if (v.do && isValidIso(v.od) && count >= 1 && count <= 5) {
        const maxEnd = maternityEnd(v);
        if (v.do < v.od || v.do > maxEnd) errors.do = "Sprawdź datę końca. Pełny okres kończy się " + formatShort(maxEnd) + ".";
      }
      return errors;
    },
  },

  "ubezpieczenie-dziecka": {
    name: "Wniosek do pracodawcy o zgłoszenie dziecka do ubezpieczenia zdrowotnego",
    fidelity: "Przekaż dane kadrom w ciągu 7 dni od nadania PESEL noworodkowi. Pracodawca zgłasza dziecko do ZUS na druku ZCNA. Wystarczy zgłoszenie przez jednego rodzica.",
    channels: [...workplace], pdf: "letter",
    recipientFor: (v, channel) => recipient({ ...v, platnik: "Pracodawca" }, channel), validateChannel: deliveryErrors,
    sections: [
      { id: "ty", title: "Ubezpieczony rodzic i pracodawca", fields: [parent(), parentPesel, employer, city, ...deliveryFields] },
      { id: "dziecko", title: "Dane do zgłoszenia", fields: [
        child, childPesel, birth,
        { ...date("uprawnienie_od", "Data uzyskania prawa do ubezpieczenia"), prefill: c => c.birthDate, hint: "Dla dziecka rodzica ubezpieczonego w dniu porodu podaj dzień urodzenia." },
        { id: "pokrewienstwo", label: "Pokrewieństwo lub podstawa opieki", type: "select", required: true, options: ["Dziecko własne", "Dziecko małżonka", "Dziecko przysposobione", "Dziecko w rodzinie zastępczej", "Dziecko objęte opieką prawną"], prefill: () => "Dziecko własne" },
        yesNo("gospodarstwo", "Czy dziecko pozostaje z Tobą we wspólnym gospodarstwie domowym?"),
        yesNo("ten_sam_adres", "Czy dziecko mieszka pod tym samym adresem co Ty?"),
        { id: "adres_dziecka", label: "Adres zamieszkania dziecka z kodem pocztowym", type: "textarea", required: true, showIf: only("ten_sam_adres", "Nie") },
        { id: "orzeczenie", label: "Orzeczenie o niepełnosprawności dziecka", type: "select", required: true, options: ["Brak orzeczenia", "Dziecko ma orzeczenie o niepełnosprawności"] },
        yesNo("wymaga_zgloszenia", "Czy dziecko wymaga zgłoszenia (nie ma własnego tytułu do ubezpieczenia i nie jest już zgłoszone przez inną osobę)?"),
        { id: "zalaczniki", label: "Dołączane dokumenty (jeśli dołączasz)", type: "textarea", hint: "Wymień tylko dokumenty, które rzeczywiście przekazujesz kadrom." },
      ] },
    ],
    validate(v, today) {
      const errors: Record<string, string> = {};
      if (v.dziecko && !familyName.test(v.dziecko.trim())) errors.dziecko = "Wpisz imię i nazwisko dziecka.";
      if (v.data_urodzenia > today) errors.data_urodzenia = "Zgłoszenie dotyczy urodzonego dziecka.";
      if (v.wymaga_zgloszenia === "Nie") errors.wymaga_zgloszenia = "Dziecko już ubezpieczone nie potrzebuje kolejnego zgłoszenia.";
      if (v.uprawnienie_od && (v.uprawnienie_od < v.data_urodzenia || v.uprawnienie_od > today)) errors.uprawnienie_od = "Podaj datę między urodzeniem dziecka a dniem zgłoszenia.";
      return errors;
    },
    letter(v) {
      const show = (value: string | undefined) => value || "……………………";
      const day = (value: string) => value ? formatShort(value) : show(value);
      return [
        "Mój numer PESEL: " + show(v.rodzic_pesel?.replace(/[\s-]/g, "")) + ".",
        "Proszę o zgłoszenie dziecka do ubezpieczenia zdrowotnego jako członka mojej rodziny od " + day(v.uprawnienie_od) + ".",
        "Dane dziecka\n" + show(v.dziecko) + ", ur. " + day(v.data_urodzenia) + ", PESEL " + show(v.dziecko_pesel?.replace(/[\s-]/g, "")) + ".",
        ...(v.wymaga_zgloszenia === "Tak" ? ["Oświadczam, że dziecko nie ma własnego tytułu do ubezpieczenia zdrowotnego i nie zostało zgłoszone do ubezpieczenia przez inną osobę."] : []),
        "Pokrewieństwo lub podstawa opieki: " + show(v.pokrewienstwo) + ". Wspólne gospodarstwo domowe: " + show(v.gospodarstwo) + ".",
        "Adres zamieszkania dziecka: " + (v.ten_sam_adres === "Tak" ? "taki sam jak mój." : show(v.adres_dziecka) + "."),
        "Orzeczenie o niepełnosprawności: " + show(v.orzeczenie) + ".",
        "Załączniki: " + (v.zalaczniki?.trim() || "brak") + ".",
      ];
    },
  },
};
