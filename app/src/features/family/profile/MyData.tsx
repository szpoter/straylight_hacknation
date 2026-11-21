"use client";

import { useState } from "react";
import { Button, Panel, SectionTitle, SelectField, SummaryList, TextField } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { PARENT_PROFILE } from "@/lib/demo/fixtures";
import type { ProfileRow } from "@/lib/demo/types";

/** „Moje dane”: dane rodzica raz dla całej rodziny. TODO(backend): zapis w profilu. */
export function MyData() {
  const { plan } = usePlan();
  const [rows, setRows] = useState<ProfileRow[]>(PARENT_PROFILE);
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const start = (row: ProfileRow) => {
    setEditing(row);
    setDraft(row.value);
    setSaved(null);
  };

  const save = () => {
    if (!editing) return;
    setRows((prev) => prev.map((r) => (r.label === editing.label ? { ...r, value: draft.trim() || r.value, source: "rodzic" } : r)));
    setSaved(`Zapisano. Zaktualizowano plan ${plan.name}.`);
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
      {editing && (
        <form
          className="mb-4 flex flex-col gap-3 rounded-sm border border-outline p-4 md:flex-row md:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {editing.options ? (
            <SelectField label={editing.label} options={editing.options} value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1" autoFocus />
          ) : (
            <TextField label={editing.label} value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1" autoFocus />
          )}
          <div className="flex gap-2">
            <Button type="submit">Zapisz</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Anuluj
            </Button>
          </div>
        </form>
      )}
      <SummaryList rows={rows} onChange={start} />
      <p className="mt-3 text-meta text-on-surface-variant">
        Dane z kłódką pochodzą z urzędu. Jeśli są błędne, popraw je u właściwego podmiotu, np. w ZUS.
      </p>
    </Panel>
  );
}
