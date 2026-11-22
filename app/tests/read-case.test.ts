import { describe, expect, it } from "vitest";
import { isoFromMatch, maskIds, readCaseText } from "@/lib/cases/read-case";

// Fragmenty fikcyjne, zbudowane na wzór druków i pism z zestawu ZUS (bez danych z akt).
const ZAM_FORM = "Wnioskuję o zasiłek macierzyński w związku z: urodzeniem dziecka przyjęciem na wychowanie dziecka/dzieci i wystąpieniem do sądu opiekuńczego";
const Z3_FORM = "Z-3 Informacje o pracowniku 1. Jest zatrudniony Od 2024-11-04 do 2025-12-27. Czy z pracownikiem jest zawarta umowa zlecenia";

describe("odczyt faktów z tekstu skanów", () => {
  it("decyzja o niepodleganiu i data porodu z odpisu", () => {
    const r = readCaseText([
      "Odpis skrócony aktu urodzenia Dane dziecka Data urodzenia 13.01.2026",
      "Zakład Ubezpieczeń Społecznych stwierdza, że Pani jako pracownik nie podlega obowiązkowo ubezpieczeniom emerytalnemu, rentowym, chorobowemu",
      "Sprawa zakończona odmową.",
    ]);
    expect(r.facts).toMatchObject({ event: "porod", eventDate: "2026-01-13", notSubjectDecision: true, insured: "nie", title: "pracownik" });
    expect(r.zusOutcome).toBe("nie-przysluguje");
    expect(r.evidence.find((e) => e.field === "notSubjectDecision")?.page).toBe(2);
  });

  it("pola wyboru z druków nie zmieniają zdarzenia ani tytułu", () => {
    const r = readCaseText([ZAM_FORM, Z3_FORM]);
    expect(r.facts.event).toBe("porod");
    expect(r.facts.title).toBe("pracownik");
    expect(r.facts.applicant).toBeUndefined();
  });

  it("przysposobienie z oświadczenia ZAS-26", () => {
    const r = readCaseText(["Oświadczenie o przyjęciu na wychowanie dziecka. Oświadczam, że przyjąłem na wychowanie dziecko w dniu 26.01.2026 wystąpiłem do sądu opiekuńczego"]);
    expect(r.facts).toMatchObject({ event: "przysposobienie", eventDate: "2026-01-26", courtFiled: "tak" });
  });

  it("zadłużenie z poświadczenia (OCR myli z/x) i data spłaty", () => {
    const r = readCaseText([
      "Kod tytułu 0511 8. Na koncie płatnika składek figuruje zadłużenie x tytułu składek na ubezpieczenia\nspołeczne na datę badania, tj 2025-03-04: TAK 9. Zaległość została uregulowana w całości w dniu 2025-07-30",
    ]);
    expect(r.facts).toMatchObject({ title: "wspolpracujacy", arrears: "powyzej-progu", arrearsPaidOn: "2025-07-30" });
  });

  it("brak zgłoszenia do dobrowolnego chorobowego przy zleceniu", () => {
    const r = readCaseText(["Wniosek o zasiłek macierzyński z tytułu umowy zlecenia", "Notatka: brak zgłoszenia do dobrowolnego ubezpieczenia chorobowego. Na koncie płatnika składek figuruje zadłużenie z tytułu składek na ubezpieczenia społeczne na datę badania: Nie dotyczy"]);
    expect(r.facts).toMatchObject({ title: "zleceniobiorca", insured: "nie" });
  });

  it("decyzja dla ojca z art. 2a i okres od", () => {
    const r = readCaseText([
      "postanawia: odmówić prawa do zasiłku macierzyńskiego za okres urlopu ojcowskiego od 25-09-2025. w dniu powstania prawa na Pana koncie występowało zadłużenie z tytułu składek na ubezpieczenia społeczne na kwotę przekraczającą 46,66 zł. z tytułu prowadzenia pozarolniczej działalności",
    ]);
    expect(r.facts).toMatchObject({ applicant: "drugi-rodzic", periodStart: "2025-09-25", arrears: "powyzej-progu", title: "dzialalnosc" });
    expect(r.zusOutcome).toBe("nie-przysluguje");
  });

  it("likwidacja pracodawcy i umowa przedłużona do porodu", () => {
    expect(readCaseText(["Stosunek pracy ustał w wyniku: rozwiązanie umowy - likwidacja zakładu pracy"]).facts.employmentEnd).toBe("upadlosc-likwidacja");
    const r = readCaseText(["Uwagi: PRACOWNIK ZATRUDNIONY DO DNIA PORODU"]);
    expect(r.facts).toMatchObject({ employmentEnd: "przedluzona-do-porodu", insured: "tak" });
  });

  it("daty i maskowanie PESEL", () => {
    expect(isoFromMatch(["", "31", "02", "2026"] as unknown as RegExpMatchArray)).toBeNull();
    expect(isoFromMatch(["", undefined, undefined, undefined, "2026", "02", "28"] as unknown as RegExpMatchArray)).toBe("2026-02-28");
    expect(maskIds("PESEL 90010112345 x")).toBe("PESEL ••••••••••• x");
  });
});
