"use client";

import { useState } from "react";
import type { CaseView, MessageInput } from "./case-api";
import s from "./zusik.module.css";

type Link = Extract<MessageInput, {intent:"link_account"}>;
type Read = Extract<MessageInput, {intent:"read_account"}>;
const scenarios: Record<Link["scenario"],string> = {
  "employment-transition":"Zmiana zatrudnienia", "business-settlement":"Rozliczenie działalności", unavailable:"Niedostępny rejestr",
};
const areas: Record<Read["areas"][number],string> = {
  insurance:"Ubezpieczenie", contributions:"Składki", e_zla:"Zwolnienia lekarskie", balance:"Saldo", benefits:"Świadczenia",
};
export function SimulatedAccount({ view, send }: { view: CaseView; send: (input: Link | Read) => void }) {
  const [person, setPerson] = useState("");
  const [scenario, setScenario] = useState<Link["scenario"] | "">("");
  const [area, setArea] = useState<Read["areas"][number]>("insurance");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const linked = view.messages.map(m => m.input).find((m): m is Link => m.intent === "link_account" && m.subjectId === person);
  return <details className={s.source}><summary>Sprawdź symulowane konto ZUS</summary>
    <form className={s.reviewForm} onSubmit={e => {
      e.preventDefault();
      if (linked) send({intent:"read_account", subjectId:person, from, to, areas:[area]});
      else if (scenario) send({intent:"link_account", subjectId:person, scenario, basisCaseRevision:view.file.revision});
    }}>
      <label>Osoba na koncie<select required value={person} onChange={e => setPerson(e.target.value)}><option value="">Wybierz osobę</option>
        {view.profile.subjects.map(v => <option key={v}>{v}</option>)}</select></label>
      {linked ? <><p>Scenariusz: {scenarios[linked.scenario]}</p>
        <label>Rejestr<select value={area} onChange={e => setArea(e.target.value as typeof area)}>{Object.entries(areas).map(([v,name]) => <option key={v} value={v}>{name}</option>)}</select></label>
        <label>Początek odczytu<input type="date" required value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>Koniec odczytu<input type="date" required min={from} value={to} onChange={e => setTo(e.target.value)} /></label>
        <button className={s.secondaryButton}>Odczytaj z konta</button></> :
        <><label>Scenariusz konta<select required value={scenario} onChange={e => setScenario(e.target.value as typeof scenario)}><option value="">Wybierz scenariusz</option>
          {Object.entries(scenarios).map(([v,name]) => <option key={v} value={v}>{name}</option>)}</select></label>
          <button className={s.secondaryButton}>Powiąż konto z osobą</button></>}
    </form>
  </details>;
}
