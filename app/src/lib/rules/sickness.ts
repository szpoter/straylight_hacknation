import { addDays, daysBetween, formatRange } from "./dates";
import type { Law, PageFact, SicknessAssessment, SicknessFacts } from "../sickness/types";

export const LAW_IDS = ["uz-art6-ust1", "uz-art7", "uz-art11-ust2-pkt1", "uz-art13-ust1"] as const;
export const assessedOn = "2026-11-21";
export function evidenceId(p: PageFact) {
  return p.kind + "-" + p.page;
}

/** Negative assessment is limited to the versioned, reviewed November 2026 demo. */
export function assessSicknessCase(facts: SicknessFacts, sources: Law[], asOf = assessedOn): SicknessAssessment {
  const byKind = (kind: PageFact["kind"]) => facts.pages.filter((p) => p.kind === kind);
  const [certificate] = byKind("certificate");
  const period = certificate?.period;
  const evidenceIds = facts.pages.map(evidenceId);
  const law = sources.filter(
    (l) =>
      LAW_IDS.some((id) => id === l.id) &&
      /^https:\/\/eli\.gov\.pl\/api\/acts\/DU\/2026\/854\/text\.pdf#page=[1-9]\d*$/.test(l.url),
  );
  const result = (
    status: SicknessAssessment["status"],
    summary: string,
    question: string | null,
    reasons: string[] = [],
    asksOtherCoverage = false,
  ): SicknessAssessment => ({
    status,
    summary,
    period: period ?? { from: null, to: null },
    question,
    reasons,
    law,
    evidenceIds,
    asksOtherCoverage,
  });
  if (["certificate", "history"].some((k) => facts.pages.filter((p) => p.kind === k).length > 1))
    return result(
      "requires_review",
      "W pakiecie jest kilka ustaleń tego samego rodzaju. Porównaj ich daty i treść.",
      null,
    );
  // Import confirmation binds the certificate's fictional claimant to this case. For manual
  // review, DEMO-A is the case-relative answer “this applicant”, B is explicitly another person.
  const claimant = certificate?.subject;
  if (facts.pages.some((p) => (p.manual ? p.subject !== "DEMO-A" : claimant && p.subject !== claimant)))
    return result(
      "requires_review",
      "Co najmniej jedna strona dotyczy innej osoby niż wskazana wnioskodawczyni.",
      null,
    );
  if (!certificate || !period)
    return result(
      "needs_fact",
      "Brakuje potwierdzonego okresu zwolnienia.",
      "Czy możesz dołączyć zaświadczenie e-ZLA?",
    );
  const onset = certificate.onset;
  if (!onset)
    return result(
      "needs_fact",
      "Data początku nieprzerwanej niezdolności jest nieustalona.",
      "Kiedy rozpoczęło się to lub wcześniejsze, nieprzerwane zwolnienie?",
    );
  if (onset > period.from || period.to > asOf || onset < "2026-11-01" || asOf > assessedOn)
    return result("requires_review", "Daty wymagają weryfikacji poza zakresem tego przykładu.", null, [
      formatRange(period.from, period.to),
    ]);
  const [history] = byKind("history");
  if (history?.value === "ended") {
    const beganCovered = onset >= history.period.from && onset <= history.period.to;
    const afterEnd = onset > history.period.to;
    let summary = "Trzeba zbadać wcześniejsze ubezpieczenie, datę zachorowania i warunki z art. 7 oraz 13.";
    let question: string | null = null;
    if (beganCovered) {
      summary = period.to <= history.period.to
        ? "Wcześniejsze ubezpieczenie obejmuje początek niezdolności i cały okres zwolnienia. Sprawdź prawo z tego tytułu."
        : "Niezdolność zaczęła się w okresie wcześniejszego ubezpieczenia. Sprawdź prawo po jego ustaniu.";
    } else if (afterEnd) {
      if (daysBetween(history.period.to, onset) > 14) {
        question = "Czy zwolnienie ma kod E potwierdzający chorobę z wydłużonym terminem do 3 miesięcy od ustania tytułu?";
      } else if (daysBetween(onset, period.to) + 1 < 30) {
        question = "Czy kolejne zaświadczenie potwierdza łącznie co najmniej 30 dni nieprzerwanej niezdolności?";
      } else {
        question = "Czy możesz potwierdzić okoliczności po ustaniu tytułu w oświadczeniu Z-10?";
      }
    }
    return result("requires_review", summary, question, [
      "Wcześniejszy okres: " + formatRange(history.period.from, history.period.to) + ".",
      "Początek ciągłej niezdolności: " + onset + ".",
    ]);
  }
  const findings = byKind("employment").sort((a, b) => a.period.from.localeCompare(b.period.from));
  if (!findings.length)
    return result(
      "needs_fact",
      "Samo zwolnienie nie potwierdza ubezpieczenia u pracodawcy.",
      "Czy możesz dołączyć ustalenie ubezpieczenia u pracodawcy za ten okres?",
    );
  if (
    !certificate.payer || certificate.payer === "wszystkie" || certificate.title !== "pracownik" ||
    findings.some(p => p.payer !== certificate.payer || p.title !== certificate.title)
  )
    return result("requires_review", "Ustalenia muszą dotyczyć tego samego wskazanego pracodawcy co zaświadczenie.", null);
  if (findings.some(p => p.value === "covered"))
    return result(
      "requires_review",
      "Dokument potwierdza ubezpieczenie. Trzeba sprawdzić prawo z tego tytułu.",
      null,
    );
  if (findings.some(p => p.value !== "excluded"))
    return result(
      "needs_fact",
      "Brak potwierdzonego ustalenia o ubezpieczeniu.",
      "Czy możesz sprawdzić treść dokumentu?",
    );
  let nextUnproven = onset;
  for (const { period: finding } of findings) {
    if (finding.from > nextUnproven) break;
    if (finding.to >= nextUnproven) nextUnproven = addDays(finding.to, 1);
  }
  if (nextUnproven <= period.to)
    return result("requires_review", "Ustalenia nie obejmują całej ciągłej niezdolności.", null, [
      "Pierwszy dzień bez potwierdzenia: " + nextUnproven + ".",
    ]);
  if (!history)
    return result(
      "needs_fact",
      "Brakuje historii wcześniejszego ubezpieczenia.",
      "Czy możesz dołączyć historię ubezpieczenia obejmującą początek zwolnienia?",
    );
  if (history.title !== "wszystkie" || history.payer !== "wszystkie")
    return result("requires_review", "Historia dotyczy tylko części tytułów lub płatników.", null);
  if (history.value !== "never" || history.period.from > onset || history.period.to < period.to)
    return result(
      "requires_review",
      "Historia nie wyklucza wcześniejszej ochrony dla całego badanego okresu.",
      null,
    );
  if (facts.otherCoverage === null)
    return result(
      "needs_fact",
      "Dokumenty opisują zwolnienie i ubezpieczenie u wskazanego pracodawcy.",
      "Czy w tym czasie miałaś jeszcze inne ubezpieczenie chorobowe, na przykład z drugiej pracy lub działalności?",
      [],
      true,
    );
  if (facts.otherCoverage === "yes")
    return result(
      "requires_review",
      "Inne ubezpieczenie może dawać prawo do zasiłku.",
      "Za jaki okres i jakim dokumentem możesz potwierdzić ten tytuł?",
    );
  if (facts.otherCoverage === "unknown")
    return result("requires_review", "Sprawdź w eZUS swoje zgłoszenia do ubezpieczenia chorobowego.", null, [
      "Sprawdzany okres: " + formatRange(onset, period.to) + ".",
    ]);
  if (LAW_IDS.some((id) => !law.some((l) => l.id === id)))
    return result("requires_review", "Nie potwierdzono wszystkich przepisów dla badanego okresu.", null);
  return result(
    "not_entitled_for_period",
    "Z podanych informacji wynika, że za " +
      formatRange(period.from, period.to) +
      " zasiłek chorobowy Ci nie przysługuje.",
    null,
    [
      "Ustalenie dla płatnika " +
        certificate.payer +
        " obejmuje początek i cały okres niezdolności. Potwierdziłaś brak innych tytułów.",
      "Historia wyklucza wcześniejsze ubezpieczenie, z którego mogłaby wynikać ochrona po jego ustaniu.",
      ...(/^Kod: B$/m.test(certificate.text) ? ["Kod B opisuje ciążę. Do ustalenia prawa do świadczenia potrzebne jest również ubezpieczenie."] : []),
    ],
  );
}
