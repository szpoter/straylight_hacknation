"use client";

import { useState } from "react";
import { Button, ButtonLink, Disclosure, Panel, SectionTitle } from "@/components/ui";
import { refreshDemoProfile, sendDemoQuestion, useDemoSession } from "@/features/auth/demo-session";
import { assessArrears } from "@/lib/rules/arrears";
import type { RuleSchedule } from "@/lib/rules/parameters";
import { packetA } from "@/lib/sickness/read";

export function EzusDemo({ schedule }: { schedule: RuleSchedule }) {
  const session = useDemoSession();
  const [amount, setAmount] = useState("0");
  const [issued, setIssued] = useState(false);
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const asOf = "2026-11-02";
  const assessment = assessArrears({ covered: true, arrears: Number(amount), rightArisesOn: asOf, today: asOf, paidOn: null, schedule });
  return <Panel className="grid gap-3">
    <SectionTitle>Konto eZUS · symulacja</SectionTitle>
    <div><Button variant="secondary" onClick={refreshDemoProfile}>Odśwież dane rodziny</Button>
      {session?.refreshedAt && <p role="status">Dane pobrane ponownie o {new Date(session.refreshedAt).toLocaleTimeString("pl-PL")}.</p>}</div>
    <Disclosure summary="Przykładowe zaświadczenie o zadłużeniu">
      <p>Symulacja dla osoby prowadzącej działalność na dzień powstania prawa 2 listopada 2026 r.</p>
      <label className="my-3 block">Wariant salda składek <select value={amount} onChange={e => {setAmount(e.target.value); setIssued(false);}}>
        <option value="0">Bez zadłużenia</option><option value="200">Zadłużenie 200 zł</option>
      </select></label>
      <Button variant="secondary" onClick={() => setIssued(true)}>Wystaw zaświadczenie demo</Button>
      {issued && <div className="mt-3 rounded-sm bg-surface p-4" role="status"><strong>Zaświadczenie demonstracyjne · 02.11.2026</strong>
        <p>Zadłużenie składkowe na dzień powstania prawa wynosi {amount},00 zł.</p><p>{assessment.text}</p></div>}
    </Disclosure>
    <Disclosure summary="Zwolnienia e-ZLA · przykład">
      {packetA.filter(page => page.kind === "certificate").map(page => <p key={page.page}>Okres {page.period.from} – {page.period.to}. Kod B. Pakiet demonstracyjny nie podaje nazwiska lekarza.</p>)}
      <ButtonLink href="/profil/przyklad-ubezpieczenia" variant="secondary">Sprawdź ubezpieczenie na przykładzie</ButtonLink>
    </Disclosure>
    <Disclosure summary="Zapytaj ZUS · korespondencja demonstracyjna">
      <form className="grid gap-2" onSubmit={e => {
        e.preventDefault();
        if (sendDemoQuestion(question)) { setQuestion(""); setNotice("Dodano do korespondencji tej sesji demo."); }
        else setNotice("Nie udało się zapisać pytania w tej sesji.");
      }}>
        <label>Treść pytania testowego<textarea className="block w-full rounded-sm border p-2" maxLength={1000} required value={question} onChange={e => setQuestion(e.target.value)} /></label>
        <Button type="submit" disabled={!question.trim()}>Dodaj do korespondencji demo</Button>
      </form>
      <p role="status">{notice}</p>
      <ul>{session?.correspondence?.map((item, index) => <li className="mt-2 break-words" key={index}>{new Date(item.at).toLocaleString("pl-PL")} · {item.text}</li>)}</ul>
    </Disclosure>
  </Panel>;
}
