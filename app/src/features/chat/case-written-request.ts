import { documentDay, documentDayPattern } from "./case-claim-fields";
import type { EvidenceCandidate, LocalLocator } from "./case-evidence";

export type LeaveRequest = { kind: "maternity" | "parental" | "paternity"; validFrom: string; validTo: string; locator: LocalLocator };
const interval = new RegExp(`(?:^|\\s)(?:(?:od(?: dnia)?|za okres|w okresie|w terminie)\\s*:?\\s*)?(${documentDayPattern})\\s*(?:do(?: dnia)?|[-–—])\\s*(${documentDayPattern})(?!\\d)`, "u");
const start = /^(?:wniosek(?: o)?|wnosze o|wnioskuje o|prosze o|zwracam sie z (?:uprzejma )?prosba o)\b/u;
const subjectPrefix = /^(?:o )?(?:(?:wyplate|przyznanie|udzielenie)(?: mi)?(?: (?:czesci|\d{1,2} (?:tygodni|dni)))?)?$/u;
const periodPrefix = /^(?:(?:za |na |w )?(?:okres(?:ie)?|czas|terminie|wymiarze)\s*)?(?:(?:\d{1,3}|jednego|dwoch) (?:tygodni(?:a|e)?|dni)\s*)?(?:(?:od|poczawszy|tj\.?)\s*)?$/u;
const benefit = /\b(?:zasilek macierzynski|zasilku macierzynskiego)\b/u;
const leave = /\burlop(?:u)? (macierzynski(?:ego)?|rodzicielski(?:ego)?|ojcowski(?:ego)?)\b/u;

export function writtenRequests(lines: string[], clientDocumentId: string, page: number) {
  const claims: EvidenceCandidate[] = [], leaves: LeaveRequest[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!start.test(lines[i])) continue;
    let block = "";
    const checkboxGroup = /zasil(?:ek|ku) macierzynski(?:ego)? za okres\s*:\s*$/u.test(lines[i]);
    for (let j = i; j < Math.min(lines.length, i + 9); j++) {
      if (j !== i && start.test(lines[j])) break;
      block += " " + lines[j].replace(/\s+/gu, " ");
      if (block.length > 650 || /\b(przyklad|instrukcja|zakresl|zaznacz|nie wnosze|nie wnioskuje)\b/u.test(block)) break;
      const period = interval.exec(block);
      if (!period) continue;
      const validFrom = documentDay(period[1]), validTo = documentDay(period[2]);
      if (!validFrom || !validTo || validFrom > validTo) break;
      const head = block.slice(0, period.index).trim();
      const kinds = [...head.matchAll(new RegExp(leave.source, "gu"))];
      if (/na warunkach urlopu|poucz|wczesniej|poprzedni|korzystal|wykorzystano|korzystalam|udzielono/u.test(head)) break;
      const subject = benefit.exec(head) ?? kinds[0];
      if (!subject) break;
      if (checkboxGroup) {
        // A period in a printed ZAM option is evidence only alongside its marked maternity row.
        if (!/^wnioskuje o zasilek macierzynski za okres\s*:\s*(?:\[x\]|☒|☑|x)\s+urlopu macierzynskiego(?:\s+(?:podaj okres \(od[-–]do\)|od))?$/u.test(head)) break;
      }
      const before = head.slice(0, subject.index).replace(start, "").trim();
      let lastSubject = subject;
      // Letters can repeat their title in the body immediately before the requested dates.
      if (kinds.length > 1) {
        if (benefit.test(head) || kinds.length !== 2 || kinds[0][1] !== kinds[1][1] ||
          !/^wniosek o udzielenie /u.test(head) || !/\b(?:prosze|prosba|wnosze|wnioskuje)\b/u.test(head.slice(subject.index + subject[0].length, kinds[1].index))) break;
        lastSubject = kinds[1];
      }
      const after = head.slice(lastSubject.index + lastSubject[0].length).trim().replace(/^[:,]\s*/u, "");
      if (!checkboxGroup && (!subjectPrefix.test(before) || !periodPrefix.test(after))) break;
      const locator = { clientDocumentId, page, lineStart: i + 1, lineEnd: j + 1 };
      if (benefit.test(head) && !/urlopu (?:ojcowskiego|rodzicielskiego)/u.test(head)) {
        claims.push({ field: "benefitRequest", value: { kind: "code", code: "maternity" }, validFrom, validTo, locator });
      } else if (!benefit.test(head) && kinds.length >= 1) {
        const name = kinds[0][1];
        leaves.push({ kind: name.startsWith("ojc") ? "paternity" : name.startsWith("rodz") ? "parental" : "maternity", validFrom, validTo, locator });
      }
      break;
    }
  }
  return { claims, leaves };
}
