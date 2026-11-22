"use client";

import { useState } from "react";
import { Button, Panel, SectionTitle, SelectField, SourceLabel, TextField } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { PARENT_PROFILE, SOURCE_LABEL } from "@/lib/demo/fixtures";
import type { ProfileRow } from "@/lib/demo/types";

/**
 * „Moje dane”: dane rodzica raz dla całej rodziny. „Zmień” otwiera edycję w tym samym wierszu
 * (nie nad listą), więc rodzic nie traci miejsca. TODO(backend): zapis w profilu.
 */
export function MyData() {
  const { plan } = usePlan();
  const [rows, setRows] = useState<ProfileRow[]>(PARENT_PROFILE);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const start = (row: ProfileRow) => {
    setEditing(row.label);
    setDraft(row.value);
    setSaved(null);
  };

  const save = (row: ProfileRow) => {
    setRows((prev) => prev.map((r) => (r.label === row.label ? { ...r, value: draft.trim() || r.value, source: "rodzic" } : r)));
    setSaved(`Zapisano „${row.label}”. Zaktualizowano plan ${plan.name}.`);
    setEditing(null);
  };

  return (
    <Panel aria-labelledby="moje-dane">
      <SectionTitle id="moje-dane" className="mb-4">
        Moje dane
      </SectionTitle>
      {saved && (
        <p role="status" className="mb-4 rounded-sm bg-secondary px-4 py-3">
          {saved}
        </p>
      )}
      <dl className="divide-y divide-outline border-y border-outline">
        {rows.map((row) =>
          editing === row.label ? (
            <form
              key={row.label}
              className="flex flex-col gap-3 bg-surface px-3 py-4 md:-mx-3"
              onSubmit={(e) => {
                e.preventDefault();
                save(row);
              }}
            >
              {row.options ? (
                <SelectField label={row.label} options={row.options} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
              ) : (
                <TextField label={row.label} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
              )}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="sm">
                  Zapisz
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(null)}>
                  Anuluj
                </Button>
              </div>
            </form>
          ) : (
            <div key={row.label} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 md:grid-cols-[minmax(10rem,14rem)_1fr_auto] md:items-baseline">
              <dt className="text-meta text-on-surface-variant md:text-body md:text-on-surface">{row.label}</dt>
              <dd className="col-start-1 flex flex-col gap-0.5 md:col-start-2">
                <span className="font-medium">{row.value}</span>
                <SourceLabel label={SOURCE_LABEL[row.source]} locked={!row.editable} />
              </dd>
              <dd className="col-start-2 row-span-2 row-start-1 self-center md:col-start-3 md:row-span-1">
                {row.editable && (
                  <button
                    type="button"
                    onClick={() => start(row)}
                    className="text-label underline underline-offset-4 decoration-outline hover:decoration-on-surface"
                  >
                    Zmień<span className="sr-only"> {row.label.toLowerCase()}</span>
                  </button>
                )}
              </dd>
            </div>
          ),
        )}
      </dl>
      <p className="mt-3 text-meta text-on-surface-variant">
        Dane z kłódką pochodzą z logowania (mObywatel) i z ZUS. Jeśli są błędne, popraw je u właściwego podmiotu, np. w ZUS. Rola i zmiana pracy to Twoje odpowiedzi — urzędy ich nie znają.
      </p>
    </Panel>
  );
}
