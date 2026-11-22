"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomSheet, Button, DateField, LockIcon, Panel, PlusIcon, SectionTitle, Tag, TextField, cn, parseDateParts, type DateParts } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { formatLong } from "@/lib/demo/dates";
import type { Plan } from "@/lib/demo/types";

function KindLabel({ plan }: { plan: Plan }) {
  if (plan.kind === "rejestr")
    return (
      <span className="inline-flex items-center gap-1 text-meta text-on-surface-variant">
        <LockIcon size={14} /> dane z rejestru
      </span>
    );
  if (plan.kind === "planowane") return <span className="text-meta text-on-surface-variant">planowane</span>;
  return <Tag tone="accent">{plan.kind === "test" ? "Test" : "Przykład"}</Tag>;
}

/** „Dzieci i plany”: karty planów z etykietą rodzaju; „Edytuj plan” otwiera panel edycji. */
export function PlansSection() {
  const { plans, plan: active, selectPlan } = usePlan();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | undefined>();
  const editing = plans.find((p) => p.id === editingId);
  return (
    <Panel aria-labelledby="dzieci-plany">
      <SectionTitle id="dzieci-plany" className="mb-4">
        Dzieci i plany
      </SectionTitle>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {plans.map((p) => {
          const isActive = p.id === active.id;
          return (
            <li key={p.id} className={cn("flex flex-col gap-3 rounded-lg border p-4", isActive ? "border-2 border-primary bg-surface" : "border-outline")}>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-title">{p.name}</span>
                <span className="text-meta text-on-surface-variant">
                  {p.keyDateLabel} · etap „{p.stages[p.stage].label}”
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <KindLabel plan={p} />
                  {isActive && <span className="text-meta font-medium">Wybrany w pasku</span>}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="secondary" size="sm" onClick={() => setEditingId(p.id)}>
                  Edytuj plan<span className="sr-only"> {p.name}</span>
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => {
                    selectPlan(p.id);
                    router.push("/plan");
                  }}
                >
                  Otwórz plan<span className="sr-only"> {p.name}</span>
                </Button>
              </div>
            </li>
          );
        })}
        <li>
          <Link
            href="/start"
            className="flex h-full min-h-32 items-center justify-center gap-2 rounded-lg border border-dashed border-on-surface-variant p-4 font-medium hover:bg-surface"
          >
            <PlusIcon /> Dodaj dziecko albo ciążę
          </Link>
        </li>
      </ul>
      <BottomSheet open={Boolean(editing)} onClose={() => setEditingId(undefined)} title={editing ? `Edytuj plan: ${editing.name}` : "Edytuj plan"} eyebrow="Edytuj plan">
        {editing && <PlanEditForm key={editing.id} plan={editing} onDone={() => setEditingId(undefined)} />}
      </BottomSheet>
    </Panel>
  );
}

function toParts(iso?: string): DateParts {
  if (!iso) return { day: "", month: "", year: "" };
  const [y, m, d] = iso.split("-");
  return { day: String(Number(d)), month: String(Number(m)), year: y };
}

/**
 * Edycja planu. Dane z rejestru (imię, data urodzenia) są tylko do odczytu — zmienia je urząd.
 * Plan oczekiwanego dziecka: nazwa i termin porodu; nowy termin przesuwa terminy przystanków.
 * Plany testowe i przykładowe nie mają edycji danych.
 */
function PlanEditForm({ plan, onDone }: { plan: Plan; onDone: () => void }) {
  const { updatePlan } = usePlan();
  const [name, setName] = useState(plan.name);
  const born = plan.situation === "urodzone" || plan.situation === "adopcja" || plan.situation === "piecza";
  const dateLegend =
    plan.situation === "urodzone" ? "Data urodzenia" : plan.situation === "adopcja" || plan.situation === "piecza" ? "Data przyjęcia pod opiekę" : "Planowany termin porodu";
  const [date, setDate] = useState<DateParts>(toParts(plan.keyDate));
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({});
  const [saved, setSaved] = useState(false);

  // Usuwanie: każdy plan bez kłódki (z rejestru nie usuwamy — to dane urzędowe).
  const remove = <DeletePlan plan={plan} onDeleted={onDone} />;

  if (plan.kind === "rejestr") {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="font-serif text-title">{plan.name}</h2>
        <dl className="divide-y divide-outline border-y border-outline">
          <Row label="Imię" value={plan.name} />
          <Row label="Data urodzenia" value={plan.keyDate ? formatLong(plan.keyDate) : "—"} />
        </dl>
        <p className="flex items-start gap-2 text-on-surface-variant">
          <LockIcon size={18} className="mt-0.5 shrink-0" />
          Te dane pochodzą z rejestru PESEL. Jeśli są błędne, popraw je w urzędzie stanu cywilnego — plan zaktualizuje się sam.
        </p>
        <Button variant="secondary" className="self-start" onClick={onDone}>
          Zamknij
        </Button>
      </div>
    );
  }

  if (plan.kind !== "planowane") {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="font-serif text-title">{plan.name}</h2>
        <p className="text-on-surface-variant">
          {plan.kind === "test" ? "Plan sprawy testowej powstał z wczytanych dokumentów. Żeby go zmienić, wczytaj sprawę jeszcze raz." : "To plan przykładowy — pokazuje, jak działa Zusik. Nie można go edytować."}
        </p>
        <Button variant="secondary" className="self-start" onClick={onDone}>
          Zamknij
        </Button>
        {remove}
      </div>
    );
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = plan.keyDate ? parseDateParts(date) : { iso: undefined, error: undefined };
    const next = { name: name.trim() ? undefined : "Wpisz nazwę planu", date: parsed.error };
    setErrors(next);
    if (next.name || next.date) return;
    updatePlan(plan.id, { name, keyDate: parsed.iso });
    setSaved(true);
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-6" noValidate>
      <h2 className="font-serif text-title">Plan: {plan.name}</h2>
      <TextField
        label={born ? "Imię dziecka" : "Nazwa planu"}
        hint={born ? undefined : "Np. imię, jeśli już je wybraliście"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      {plan.keyDate && (
        <>
          <DateField legend={dateLegend} hint={born ? undefined : "Z karty ciąży albo od lekarza"} value={date} onChange={setDate} error={errors.date} />
          <p className="text-meta text-on-surface-variant">Po zmianie daty przeliczymy terminy wszystkich spraw w planie.</p>
        </>
      )}
      {saved && (
        <p role="status" className="rounded-sm bg-surface p-4">
          Zapisane. Terminy w planie są przeliczone.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Zapisz zmiany</Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          {saved ? "Zamknij" : "Anuluj"}
        </Button>
      </div>
      {remove}
    </form>
  );
}

/**
 * „Usuń plan” z potwierdzeniem w miejscu (bez okna przeglądarki). Przy rodzeństwie mówi,
 * co stanie się ze wspólnymi sprawami.
 */
function DeletePlan({ plan, onDeleted }: { plan: Plan; onDeleted: () => void }) {
  const { removePlan } = usePlan();
  const [confirming, setConfirming] = useState(false);
  const shared = Boolean(plan.family);
  return (
    <div className="border-t border-outline pt-5">
      {!confirming ? (
        <Button type="button" variant="quiet" onClick={() => setConfirming(true)}>
          Usuń ten plan
        </Button>
      ) : (
        <div role="alertdialog" aria-labelledby={`usun-${plan.id}`} className="flex flex-col gap-3 rounded-sm bg-tertiary p-4">
          <p id={`usun-${plan.id}`} className="font-medium">
            Usunąć plan „{plan.name}”?
          </p>
          <p>
            Znikną odhaczenia i wpisane wnioski z tego planu. Tego nie da się cofnąć.
            {shared ? " Wspólne sprawy rodzeństwa (urlopy, zasiłek) zostaną w pozostałych planach." : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="ink"
              onClick={() => {
                removePlan(plan.id);
                onDeleted();
              }}
            >
              Usuń plan
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
              Zostaw
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 md:grid-cols-[10rem_1fr] md:gap-4">
      <dt className="text-meta text-on-surface-variant">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
