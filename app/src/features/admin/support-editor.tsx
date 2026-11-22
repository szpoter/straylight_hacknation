"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { organizationProblems, type OrganizationForm, type SupportRow } from "@/lib/admin/support-edits";
import { SITUATION_LABEL, type SupportSituation } from "@/lib/support/organizations";
import { Drawer } from "./ui";
import s from "./admin.module.css";

export interface SupportActionResult {
  ok: boolean;
  error?: string;
  revision: number;
}

export interface SupportActions {
  save(form: OrganizationForm, expectedRevision: number): Promise<SupportActionResult>;
  withdraw(id: string, withdrawn: boolean, expectedRevision: number): Promise<SupportActionResult>;
  revert(id: string, expectedRevision: number): Promise<SupportActionResult>;
}

const SITUATIONS = Object.entries(SITUATION_LABEL) as [SupportSituation, string][];

function formOf(row: SupportRow | null, today: string): OrganizationForm {
  return {
    id: row?.id ?? null,
    name: row?.name ?? "",
    legalForm: row?.legalForm ?? "fundacja",
    krs: row?.krs ?? "",
    helps: row?.helps ?? "",
    situations: row?.situations ?? [],
    freeOfCharge: row?.freeOfCharge ?? "",
    phone: row?.phone ?? "",
    email: row?.email ?? "",
    url: row?.url ?? "",
    area: row?.area ?? "",
    verifiedAt: today,
  };
}

/**
 * Side panel to add or edit a support organisation in this demo session (SPEC-PANEL §5). The
 * verification day starts at today: saving means the entry was checked on the organisation's site.
 */
export function SupportEditor({
  row,
  open,
  onClose,
  today,
  revision,
  actions,
}: {
  /** null = a new organisation. */
  row: SupportRow | null;
  open: boolean;
  onClose: () => void;
  today: string;
  revision: number;
  actions: SupportActions;
}) {
  const router = useRouter();
  const [form, setForm] = useState<OrganizationForm>(() => formOf(row, today));
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [pending, startTransition] = useTransition();
  const problems = organizationProblems(form, today);
  const update = (patch: Partial<OrganizationForm>) => setForm((f) => ({ ...f, ...patch }));

  const done = (r: SupportActionResult) => {
    if (!r.ok) return setError(r.error ?? "Nie udało się zapisać.");
    router.refresh();
    onClose();
  };

  const save = () => {
    setTried(true);
    if (problems.length) return;
    startTransition(async () => done(await actions.save(form, revision)));
  };
  const withdraw = (withdrawn: boolean) =>
    row && startTransition(async () => done(await actions.withdraw(row.id, withdrawn, revision)));
  const revert = () => row && startTransition(async () => done(await actions.revert(row.id, revision)));

  const shown = tried ? problems : [];
  const text = (key: keyof OrganizationForm, label: string, hint?: string, type = "text") => (
    <label className={s.field}>
      <span className={s.labelText}>{label}</span>
      <input
        className={s.input}
        type={type}
        value={form[key] as string}
        onChange={(e) => update({ [key]: e.target.value })}
      />
      {hint ? <span className={s.hint}>{hint}</span> : null}
    </label>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={row ? `Organizacje wsparcia · ${row.withdrawn ? "wycofana" : row.session}` : "Organizacje wsparcia"}
      title={row ? row.name : "Nowa organizacja"}
      footer={
        <>
          <button type="button" className={s.btn} onClick={save} disabled={pending}>
            {row ? "Zapisz zmiany" : "Dodaj do listy"}
          </button>
          {row ? (
            <button type="button" className={s.btnSecondary} onClick={() => withdraw(!row.withdrawn)} disabled={pending}>
              {row.withdrawn ? "Przywróć na listę" : "Wycofaj z listy"}
            </button>
          ) : null}
          {row && row.session !== "bez zmian" ? (
            <button type="button" className={s.btnSecondary} onClick={revert} disabled={pending}>
              {row.session === "dodana" ? "Usuń z sesji" : "Cofnij zmiany"}
            </button>
          ) : null}
        </>
      }
    >
      <div className={s.form}>
        <p className={s.hint} style={{ margin: 0 }}>
          Wyłącznie fundacje i stowarzyszenia. Opis, kontakt i informację o bezpłatnej pomocy przepisz ze strony organizacji.
          Zmiany obowiązują w tej sesji demo.
        </p>
        {text("name", "Nazwa")}
        <div className={s.fieldRow}>
          <label className={s.field}>
            <span className={s.labelText}>Forma prawna</span>
            <select className={s.select} value={form.legalForm} onChange={(e) => update({ legalForm: e.target.value })}>
              <option value="fundacja">fundacja</option>
              <option value="stowarzyszenie">stowarzyszenie</option>
            </select>
          </label>
          {text("krs", "Numer KRS", "10 cyfr")}
        </div>
        <label className={s.field}>
          <span className={s.labelText}>Komu pomaga</span>
          <textarea className={s.textarea} value={form.helps} onChange={(e) => update({ helps: e.target.value })} />
          <span className={s.hint}>Słowami ze strony organizacji, do 500 znaków.</span>
        </label>
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={s.labelText} style={{ marginBottom: 6 }}>
            Sytuacje
          </legend>
          {SITUATIONS.map(([id, label]) => (
            <label key={id} className={s.small} style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 32 }}>
              <input
                type="checkbox"
                checked={form.situations.includes(id)}
                onChange={(e) =>
                  update({ situations: e.target.checked ? [...form.situations, id] : form.situations.filter((x) => x !== id) })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
        {text("freeOfCharge", "Bezpłatna pomoc", "Tylko jeśli strona tak to opisuje. Puste, gdy nie mówi.")}
        <div className={s.fieldRow}>
          {text("phone", "Telefon")}
          {text("email", "E-mail", undefined, "email")}
        </div>
        {text("url", "Strona organizacji", "Adres zaczynający się od https://", "url")}
        {text("area", "Obszar działania", "Tylko jeśli strona go podaje.")}
        <label className={s.field}>
          <span className={s.labelText}>Zweryfikowano na stronie organizacji</span>
          <input
            className={s.input}
            type="date"
            max={today}
            value={form.verifiedAt}
            onChange={(e) => update({ verifiedAt: e.target.value })}
          />
        </label>
        {shown.length || error ? (
          <p className={s.notice} role="alert">
            {[...shown, ...(error ? [error] : [])].join(" ")}
          </p>
        ) : null}
      </div>
    </Drawer>
  );
}
