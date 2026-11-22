"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CheckRow, ImpactRow } from "@/lib/admin/change-checks";
import { changeSpecFor, displayValue } from "@/lib/admin/parameter-changes";
import { RULE_PARAMETERS, validateValue, type RuleSchedule } from "@/lib/rules/parameters";
import { formatDate } from "./mock-data";
import { Badge, Card, OriginNote, StateBadge, cx } from "./ui";
import s from "./admin.module.css";

/** Form values sent to the server actions; `value` is in the parameter's stored unit. */
export interface ParameterForm {
  value: number | null;
  validFrom: string;
  reason: string;
  source: string;
}

export interface ParameterActionResult {
  ok: boolean;
  error?: string;
  revision: number;
  draftId?: string | null;
  checks?: CheckRow[];
  summary?: string;
  passed?: boolean;
}

export interface ParameterActions {
  save: (catalogId: string, form: ParameterForm) => Promise<ParameterActionResult>;
  check: (catalogId: string, form: ParameterForm) => Promise<ParameterActionResult>;
  publish: (catalogId: string, request: { draftId: string; expectedRevision: number }) => Promise<ParameterActionResult>;
  discard: (catalogId: string) => Promise<ParameterActionResult>;
  preview: (catalogId: string) => Promise<{ ok: boolean; error?: string }>;
}

interface Props {
  catalogId: string;
  appSource?: string;
  /** Value in force today, in the stored unit. */
  current: number;
  published: RuleSchedule;
  revision: number;
  tomorrow: string;
  draft: { id: string; value: number; validFrom: string; reason: string; source: string } | null;
  actions: ParameterActions;
}

const CHECK_TONE = { zgodna: "active", niezgodna: "warn", informacja: "planned" } as const;
const CHECK_LABEL = { zgodna: "Zgodna", niezgodna: "Niezgodna", informacja: "Zmienia się" } as const;

type Text = { text: string; validFrom: string; reason: string; source: string };

/** Real change of any registered parameter: draft, check, publication from a date (SPEC-PANEL §7). */
export function ParameterChangeView(props: Props) {
  const spec = changeSpecFor(props.catalogId)!;
  const id = spec.parameter;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initial: Text = props.draft
    ? { text: spec.toText(props.draft.value), validFrom: props.draft.validFrom, reason: props.draft.reason, source: props.draft.source }
    : { text: spec.toText(props.current), validFrom: nextMonthStart(props.tomorrow), reason: "", source: "" };
  const [form, setForm] = useState<Text>(initial);
  const [draftId, setDraftId] = useState<string | null>(props.draft?.id ?? null);
  const [savedKey, setSavedKey] = useState<string | null>(props.draft ? JSON.stringify(initial) : null);
  const [revision, setRevision] = useState(props.revision);
  const [checks, setChecks] = useState<{ rows: CheckRow[]; passed: boolean; summary: string; key: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Impact as it was when published: afterwards the published schedule already holds the new value.
  const [published, setPublished] = useState<ImpactRow[] | null>(null);

  const key = JSON.stringify(form);
  const value = spec.toValue(form.text);
  const payload: ParameterForm = { value, validFrom: form.validFrom, reason: form.reason, source: form.source };
  const valueProblems = value === null ? ["Wpisz wartość w podanej jednostce."] : validateValue(id, value);
  const problems = [...valueProblems];
  if (!form.validFrom) problems.push("Podaj datę obowiązywania.");
  else if (form.validFrom < props.tomorrow) problems.push("Zmiana może obowiązywać najwcześniej od jutra.");
  const valid = problems.length === 0 && value !== null;
  const impact =
    published ?? (valid && value !== null ? spec.impact(props.published, { value, validFrom: form.validFrom }) : null);

  const saved = savedKey === key && draftId !== null;
  const checked = checks?.key === key;
  const canPublish = saved && checked && checks.passed && form.source.trim() !== "";

  const update = (patch: Partial<Text>) => {
    setForm((f) => ({ ...f, ...patch }));
    setMessage(null);
    setPublished(null);
  };

  const run = (task: () => Promise<void>) => startTransition(task);

  const save = () =>
    run(async () => {
      const r = await props.actions.save(props.catalogId, payload);
      if (!r.ok) return setMessage(r.error ?? "Nie udało się zapisać szkicu.");
      setDraftId(r.draftId ?? null);
      setSavedKey(key);
      setRevision(r.revision);
      setMessage("Zapisano szkic. Uruchom „Sprawdź zmianę”.");
      router.refresh();
    });

  const check = () =>
    run(async () => {
      const r = await props.actions.check(props.catalogId, payload);
      if (!r.ok || !r.checks) return setMessage(r.error ?? "Nie udało się sprawdzić zmiany.");
      setChecks({ rows: r.checks, passed: Boolean(r.passed), summary: r.summary ?? "", key });
      setRevision(r.revision);
      setMessage(
        r.passed
          ? `Sprawdzenie zakończone: ${r.summary}.${saved ? "" : " Zapisz szkic, żeby go opublikować."}`
          : `Sprawdzenie wykazało niezgodność (${r.summary}). Szkic do poprawy.`,
      );
    });

  const publish = () =>
    run(async () => {
      if (!draftId || value === null) return;
      const r = await props.actions.publish(props.catalogId, { draftId, expectedRevision: revision });
      if (!r.ok) {
        if (r.checks) setChecks({ rows: r.checks, passed: false, summary: r.summary ?? "", key });
        setRevision(r.revision);
        return setMessage(r.error ?? "Nie udało się opublikować zmiany.");
      }
      setPublished(impact);
      setDraftId(null);
      setSavedKey(null);
      setRevision(r.revision);
      setMessage(
        `Zaplanowano zmianę: ${displayValue(id, props.current)} → ${displayValue(id, value)} od ${formatDate(form.validFrom)}.`,
      );
      router.refresh();
    });

  const discard = () =>
    run(async () => {
      const r = await props.actions.discard(props.catalogId);
      setDraftId(null);
      setSavedKey(null);
      setRevision(r.revision);
      setMessage("Szkic odrzucony.");
      router.refresh();
    });

  // The tab opens synchronously (popup blockers allow it only inside the click), then gets its address.
  const showAsParent = () => {
    if (!spec.parentView) return;
    const view = spec.parentView;
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    if (!saved) {
      if (tab) tab.location.href = view;
      return;
    }
    run(async () => {
      const r = await props.actions.preview(props.catalogId);
      if (!r.ok) {
        tab?.close();
        return setMessage(r.error ?? "Nie udało się włączyć podglądu.");
      }
      if (tab) tab.location.href = view;
      setMessage("Podgląd szkicu otwarty w nowej karcie. Kończy się po publikacji, odrzuceniu szkicu albo po 30 minutach.");
    });
  };

  return (
    <div className={s.grid}>
      <Card className={s.span7} title="Formularz zmiany" id="change-form" meta={<Link href="/admin/reguly">Wróć do reguł</Link>}>
        <p className={s.eyebrow}>
          {spec.group} · {RULE_PARAMETERS[id].label}
        </p>
        <OriginNote origin="app" appSource={props.appSource} />
        <form className={s.form} onSubmit={(e) => e.preventDefault()} style={{ marginTop: 16 }}>
          <div className={s.currentValue}>
            <div>
              <p className={s.eyebrow}>Obecnie</p>
              <span className={s.delta}>{displayValue(id, props.current)}</span>
            </div>
            <span className={s.arrow} aria-hidden>
              →
            </span>
            <div>
              <p className={s.eyebrow}>Po zmianie</p>
              <span className={s.delta}>{value === null || valueProblems.length ? "—" : displayValue(id, value)}</span>
            </div>
            <span className={s.topbarSpacer} />
            <StateBadge state={published ? "Zaplanowana" : "Szkic"} />
          </div>

          <div className={s.fieldRow}>
            {spec.input === "flag" ? (
              <label className={s.field}>
                <span className={s.labelText}>Nowy status</span>
                <select className={s.select} value={form.text} onChange={(e) => update({ text: e.target.value })}>
                  <option value="1">obowiązuje</option>
                  <option value="0">wycofany</option>
                </select>
                <span className={s.hint}>{spec.hint}</span>
              </label>
            ) : (
              <label className={s.field}>
                <span className={s.labelText}>Nowa wartość</span>
                <span className={s.withUnit}>
                  <input
                    className={s.input}
                    inputMode={spec.input === "percent" ? "decimal" : "numeric"}
                    value={form.text}
                    onChange={(e) => update({ text: e.target.value })}
                    aria-invalid={valueProblems.length > 0}
                  />
                  <span className={s.unit}>{spec.suffix}</span>
                </span>
                <span className={s.hint}>{spec.hint}</span>
              </label>
            )}
            <label className={s.field}>
              <span className={s.labelText}>Stosuj od</span>
              <input
                className={s.input}
                type="date"
                min={props.tomorrow}
                value={form.validFrom}
                onChange={(e) => update({ validFrom: e.target.value })}
                aria-invalid={!form.validFrom || form.validFrom < props.tomorrow}
              />
              <span className={s.hint}>Najwcześniej od jutra.</span>
            </label>
          </div>

          <div className={s.field}>
            <span className={s.labelText}>Zakres spraw</span>
            <p className={s.readonlyField}>{spec.scope}</p>
          </div>

          <label className={s.field}>
            <span className={s.labelText}>Podstawa zmiany</span>
            <input
              className={s.input}
              placeholder="np. ustawa, artykuł, odnośnik do źródła"
              value={form.source}
              onChange={(e) => update({ source: e.target.value })}
              aria-invalid={checked && !form.source.trim()}
            />
            <span className={s.hint}>Wymagana do publikacji.</span>
          </label>

          <label className={s.field}>
            <span className={s.labelText}>Uzasadnienie</span>
            <textarea className={s.textarea} value={form.reason} onChange={(e) => update({ reason: e.target.value })} />
          </label>

          {problems.length ? (
            <p className={s.notice} role="alert">
              {problems.join(" ")}
            </p>
          ) : null}
        </form>
      </Card>

      <Card className={s.span5} title="Wpływ na rodzinę" id="impact" meta="Przykładowa sprawa">
        {impact ? (
          <>
            <p className={cx(s.small, s.muted)} style={{ marginTop: 0 }}>
              {spec.impactNote}
            </p>
            <table className={s.compare}>
              <thead>
                <tr>
                  <th scope="col">Pozycja</th>
                  <th scope="col">Obecnie</th>
                  <th scope="col">Po zmianie</th>
                </tr>
              </thead>
              <tbody>
                {impact.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.before}</td>
                    <td>{row.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className={s.empty}>Popraw wartość i datę, aby zobaczyć wpływ.</p>
        )}
        {spec.parentView ? (
          <>
            <div className={s.cardActions}>
              <button type="button" className={s.btnSecondary} onClick={showAsParent} disabled={pending}>
                Pokaż oczami rodzica
              </button>
            </div>
            <p className={cx(s.small, s.muted)} style={{ margin: "8px 0 0" }}>
              {saved
                ? "Otwiera sprawę rodzica z wartością ze szkicu, oznaczoną jako podgląd. Nic nie zostaje opublikowane."
                : "Zapisz szkic, żeby zobaczyć go oczami rodzica. Bez szkicu sprawa pokazuje opublikowane wartości."}
            </p>
          </>
        ) : (
          <p className={cx(s.small, s.muted)} style={{ margin: "16px 0 0" }}>
            Widok rodzica dla tego parametru powstaje. Wpływ powyżej liczy ta sama reguła, z której skorzysta aplikacja.
          </p>
        )}
      </Card>

      <Card
        className={s.span12}
        title="Wyniki sprawdzenia"
        id="checks"
        meta={checked ? checks.summary : checks ? "Formularz zmienił się, sprawdź ponownie" : "Jeszcze nie uruchomiono"}
      >
        {checked ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Przypadek</th>
                  <th scope="col">Oczekiwany</th>
                  <th scope="col">Wynik</th>
                  <th scope="col">Zgodność</th>
                </tr>
              </thead>
              <tbody>
                {checks.rows.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{c.expected}</td>
                    <td>{c.result}</td>
                    <td>
                      <Badge tone={CHECK_TONE[c.status]}>{CHECK_LABEL[c.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={cx(s.muted, s.small)} style={{ margin: 0 }}>
            „Sprawdź zmianę” uruchamia prawdziwą regułę z wartością ze szkicu: przypadki na granicy zmiany, dzień przed
            datą obowiązywania, sprawę spoza zakresu i sprawy testowe sprzed daty zmiany, które muszą zachować wynik.
          </p>
        )}
      </Card>

      <div className={cx(s.span12, s.actionBar)}>
        <span className={s.actionStatus} role="status">
          {message ?? (saved ? "Szkic zapisany." : "Nowa zmiana, niezapisana.")}
          {published ? (
            <>
              {" "}
              <Link href="/admin/historia">Zobacz w historii</Link>
            </>
          ) : null}
        </span>
        {draftId ? (
          <button type="button" className={s.btnSmall} onClick={discard} disabled={pending}>
            Odrzuć szkic
          </button>
        ) : null}
        <button type="button" className={s.btnSecondary} onClick={save} disabled={!valid || pending || saved}>
          Zapisz szkic
        </button>
        <button type="button" className={s.btnSecondary} onClick={check} disabled={!valid || pending}>
          Sprawdź zmianę
        </button>
        <button type="button" className={s.btn} aria-disabled={!canPublish || pending} onClick={() => canPublish && !pending && publish()}>
          {form.validFrom ? `Zaplanuj zmianę od ${formatDate(form.validFrom)}` : "Zaplanuj zmianę"}
        </button>
      </div>
    </div>
  );
}

function nextMonthStart(tomorrow: string): string {
  const [y, m] = tomorrow.split("-").map(Number);
  const year = m === 12 ? y + 1 : y;
  const month = m === 12 ? 1 : m + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
