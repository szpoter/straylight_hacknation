"use client";

import { useState } from "react";
import type { InsuranceTitle } from "@/lib/rules/maternity";
import type { RuleSchedule } from "@/lib/rules/parameters";
import { benefitPayer } from "@/lib/rules/payer";

export function Payer({ title, date, schedule, parent }: { title: InsuranceTitle; date: string; schedule: RuleSchedule; parent: string }) {
  const [count, setCount] = useState("");
  if (!date) return null;
  const result = benefitPayer({
    situation: title === "dzialalnosc" ? "self_employed" : "employee",
    payerInsuredCount: /^\d{1,8}$/.test(count) ? Number(count) : null,
    benefitDate: date, schedule,
  });
  return <details className="rounded-lg border border-outline p-gutter-mobile">
    <summary>{parent} · kto wypłaca zasiłek?</summary>
    <div className="mt-3 grid gap-3">
      {result.countDate && <label>Liczba osób zgłoszonych do chorobowego na {result.countDate.split("-").reverse().join(".")}
        <input className="ml-2 w-24 rounded-sm border p-2" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={8} value={count} onChange={e => setCount(e.target.value)} />
        <span className="block text-meta">Jeśli płatnik wtedy nikogo nie zgłaszał, podaj liczbę z pierwszego miesiąca zgłoszenia.</span></label>}
      <p role="status">{result.payer === "employer" ? "Wniosek o zasiłek przekaż płatnikowi składek." : result.payer === "zus" ? "Zasiłek wypłaca ZUS." : result.reason}
        {" "}{result.payer && (title === "dzialalnosc" ? "Wniosek o zasiłek złóż w ZUS." : result.payerCertificateNeeded ? "Płatnik przekazuje do ZUS dokumenty i zaświadczenie " + (title === "pracownik" ? "Z-3." : "Z-3a.") : "Płatnik ustala prawo do wypłaty.")}
      </p>
    </div>
  </details>;
}
