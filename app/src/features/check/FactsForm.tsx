"use client";

import { useId } from "react";
import { cn } from "@/components/ui";
import type { EligibilityFacts } from "@/lib/rules/maternity-eligibility";

const INPUT =
  "h-12 md:h-14 w-full rounded-sm border border-outline bg-background px-4 text-body text-on-surface focus:border-on-surface focus:outline-none";

type Option<T extends string> = { value: T; label: string };

function Select<T extends string>({ label, hint, value, options, onChange }: { label: string; hint?: string; value: T; options: Option<T>[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-meta text-on-surface-variant">
          {hint}
        </p>
      )}
      <div className="relative">
        <select id={id} value={value} aria-describedby={hint ? `${id}-hint` : undefined} onChange={(e) => onChange(e.target.value as T)} className={cn(INPUT, "appearance-none pr-12")}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 fill-none stroke-on-surface" strokeWidth={1.75}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function DateInput({ label, hint, value, onChange }: { label: string; hint?: string; value: string | undefined; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-meta text-on-surface-variant">
          {hint}
        </p>
      )}
      <input id={id} type="date" value={value ?? ""} aria-describedby={hint ? `${id}-hint` : undefined} onChange={(e) => onChange(e.target.value)} className={INPUT} />
    </div>
  );
}

/** Fakty sprawy dla reguły prawa do zasiłku. Pola zależne pojawiają się tylko wtedy, gdy mają znaczenie. */
export function FactsForm({ facts, onChange }: { facts: EligibilityFacts; onChange: (f: EligibilityFacts) => void }) {
  const set = <K extends keyof EligibilityFacts>(key: K, value: EligibilityFacts[K]) => onChange({ ...facts, [key]: value });
  const care = facts.event !== "porod";
  const selfPaying = facts.title === "dzialalnosc" || facts.title === "wspolpracujacy";
  const employeeBirth = facts.applicant === "rodzi" && facts.event === "porod" && facts.title === "pracownik";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Select
        label="Kto wnioskuje"
        value={facts.applicant}
        onChange={(v) => set("applicant", v)}
        options={[
          { value: "rodzi", label: "Osoba, która urodziła albo przyjęła dziecko" },
          { value: "drugi-rodzic", label: "Drugi rodzic (np. ojciec)" },
        ]}
      />
      <Select
        label="Zdarzenie"
        value={facts.event}
        onChange={(v) => set("event", v)}
        options={[
          { value: "porod", label: "Urodzenie dziecka" },
          { value: "przysposobienie", label: "Przyjęcie dziecka i wniosek o przysposobienie" },
          { value: "rodzina-zastepcza", label: "Niezawodowa rodzina zastępcza" },
          { value: "rodzina-zastepcza-zawodowa", label: "Zawodowa rodzina zastępcza" },
        ]}
      />
      <DateInput label={care ? "Data przyjęcia dziecka" : "Data porodu"} value={facts.eventDate} onChange={(v) => set("eventDate", v)} />
      <DateInput
        label="Początek okresu z wniosku (opcjonalnie)"
        hint="Np. początek urlopu drugiego rodzica albo okresu po przerwie. Puste = dzień zdarzenia."
        value={facts.periodStart}
        onChange={(v) => set("periodStart", v || undefined)}
      />
      {care && <DateInput label="Data urodzenia dziecka" value={facts.childBirthDate} onChange={(v) => set("childBirthDate", v)} />}
      {facts.event === "przysposobienie" && (
        <Select
          label="Wniosek do sądu o przysposobienie"
          value={facts.courtFiled ?? "nie-wiem"}
          onChange={(v) => set("courtFiled", v)}
          options={[
            { value: "tak", label: "Złożony" },
            { value: "nie", label: "Nie złożony" },
            { value: "nie-wiem", label: "Nie wiem" },
          ]}
        />
      )}
      {facts.event === "rodzina-zastepcza" && (
        <Select
          label="Odroczony obowiązek szkolny"
          value={facts.schoolDeferred ? "tak" : "nie"}
          onChange={(v) => set("schoolDeferred", v === "tak")}
          options={[
            { value: "nie", label: "Nie" },
            { value: "tak", label: "Tak" },
          ]}
        />
      )}
      <Select
        label="Tytuł ubezpieczenia"
        value={facts.title}
        onChange={(v) => set("title", v)}
        options={[
          { value: "pracownik", label: "Umowa o pracę" },
          { value: "zleceniobiorca", label: "Umowa zlecenia" },
          { value: "dzialalnosc", label: "Własna działalność" },
          { value: "wspolpracujacy", label: "Współpraca przy działalności" },
          { value: "inny", label: "Inny" },
        ]}
      />
      <Select
        label="Ubezpieczenie chorobowe w dniu, na który ZUS sprawdza prawo"
        hint="Dzień porodu albo przyjęcia, a gdy podano początek okresu — ten dzień."
        value={facts.insured}
        onChange={(v) => set("insured", v)}
        options={[
          { value: "tak", label: "Tak, podlegała / podlegał" },
          { value: "nie", label: "Nie" },
          { value: "nie-wiem", label: "Nie wiem" },
        ]}
      />
      <Select
        label="Decyzja ZUS o niepodleganiu ubezpieczeniom"
        hint="Np. gdy ZUS uznał umowę za zawartą dla pozoru."
        value={facts.notSubjectDecision ? "tak" : "nie"}
        onChange={(v) => set("notSubjectDecision", v === "tak")}
        options={[
          { value: "nie", label: "Nie ma takiej decyzji" },
          { value: "tak", label: "Jest decyzja o niepodleganiu" },
        ]}
      />
      {employeeBirth && (
        <Select
          label="Koniec umowy o pracę w ciąży"
          value={facts.employmentEnd ?? "brak"}
          onChange={(v) => set("employmentEnd", v)}
          options={[
            { value: "brak", label: "Umowa trwa" },
            { value: "upadlosc-likwidacja", label: "Upadłość albo likwidacja pracodawcy" },
            { value: "smierc-pracodawcy", label: "Śmierć pracodawcy" },
            { value: "naruszenie-prawa-wyrok", label: "Rozwiązanie z naruszeniem prawa (wyrok sądu)" },
            { value: "przedluzona-do-porodu", label: "Umowa terminowa przedłużona do dnia porodu" },
            { value: "inna", label: "Inna przyczyna" },
          ]}
        />
      )}
      {employeeBirth && (facts.employmentEnd === "upadlosc-likwidacja" || facts.employmentEnd === "smierc-pracodawcy") && (
        <>
          <DateInput label="Dzień ustania zatrudnienia" value={facts.employmentEndDate} onChange={(v) => set("employmentEndDate", v)} />
          <Select
            label="Zapewniono inne zatrudnienie"
            value={facts.otherEmployment ? "tak" : "nie"}
            onChange={(v) => set("otherEmployment", v === "tak")}
            options={[
              { value: "nie", label: "Nie" },
              { value: "tak", label: "Tak" },
            ]}
          />
        </>
      )}
      {selfPaying && (
        <>
          <Select
            label="Zadłużenie składkowe w dniu powstania prawa"
            value={facts.arrears ?? "nie-wiem"}
            onChange={(v) => set("arrears", v)}
            options={[
              { value: "brak", label: "Brak zadłużenia" },
              { value: "do-progu", label: "Do 1% płacy minimalnej" },
              { value: "powyzej-progu", label: "Powyżej 1% płacy minimalnej" },
              { value: "nie-wiem", label: "Nie wiem" },
            ]}
          />
          {facts.arrears === "powyzej-progu" && (
            <DateInput label="Dzień spłaty całego zadłużenia (jeśli spłacono)" value={facts.arrearsPaidOn ?? ""} onChange={(v) => set("arrearsPaidOn", v || null)} />
          )}
        </>
      )}
    </div>
  );
}
