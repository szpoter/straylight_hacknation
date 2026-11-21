"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { limitImpact, type CheckRow } from "@/lib/admin/change-checks";
import { validateValue, weeksLabel, type RuleSchedule } from "@/lib/rules/parameters";
import { formatDate } from "./mock-data";
import { Badge, Card, OriginNote, StateBadge, cx } from "./ui";
import s from "./admin.module.css";

export interface LimitForm {
  weeks: number;
  validFrom: string;
  reason: string;
  source: string;
}

export interface LimitActionResult {
  ok: boolean;
  error?: string;
  revision: number;
  draftId?: string | null;
  checks?: CheckRow[];
  summary?: string;
  passed?: boolean;
}

export interface LimitActions {
  save: (form: LimitForm) => Promise<LimitActionResult>;
  check: (form: LimitForm) => Promise<LimitActionResult>;
  publish: (request: { draftId: string; expectedRevision: number }) => Promise<LimitActionResult>;
  discard: () => Promise<LimitActionResult>;
  preview: () => Promise<{ ok: boolean; error?: string }>;
}

interface Props {
  name: string;
  appSource?: string;
  event: string;
  /** Value in force today, in days. */
  currentDays: number;
  published: RuleSchedule;
  revision: number;
  tomorrow: string;
  draft: (LimitForm & { id: string }) | null;
  actions: LimitActions;
}

const CHECK_TONE = { zgodna: "active", niezgodna: "warn", informacja: "planned" } as const;
const CHECK_LABEL = { zgodna: "Zgodna", niezgodna: "Niezgodna", informacja: "Zmienia się" } as const;

/** Real change of the paternity total: draft, check, publication from a date (SPEC-PANEL §7). */
export function LimitChangeView(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<LimitForm>(
    props.draft ?? { weeks: props.currentDays / 7 + 1, validFrom: nextMonthStart(props.tomorrow), reason: "", source: "" },
  );
  const [draftId, setDraftId] = useState<string | null>(props.draft?.id ?? null);
  const [savedForm, setSavedForm] = useState<string | null>(props.draft ? JSON.stringify(props.draft) : null);
  const [revision, setRevision] = useState(props.revision);
  const [checks, setChecks] = useState<{ rows: CheckRow[]; passed: boolean; summary: string; form: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [published, setPublished] = useState<{ from: string; value: number } | null>(null);

  const formKey = JSON.stringify({ weeks: form.weeks, validFrom: form.validFrom, reason: form.reason, source: form.source });
  const value = Math.round(form.weeks * 7);
  const problems = useMemo(() => {
    const list = validateValue("paternity.totalDays", value);
    if (!form.validFrom) list.push("Podaj datę obowiązywania.");
    else if (form.validFrom < props.tomorrow) list.push("Zmiana może obowiązywać najwcześniej od jutra.");
    return list;
  }, [value, form.validFrom, props.tomorrow]);
  const valid = problems.length === 0;
  const impact = useMemo(
    () => (valid ? limitImpact(props.published, { value, validFrom: form.validFrom }) : null),
    [valid, props.published, value, form.validFrom],
  );

  const saved = savedForm === formKey && draftId !== null;
  const checked = checks?.form === formKey;
  const canPublish = saved && checked && checks.passed && form.source.trim() !== "";

  const update = (patch: Partial<LimitForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setMessage(null);
    setPublished(null);
  };

  const run = (task: () => Promise<void>) => startTransition(task);

  const save = () =>
    run(async () => {
      const r = await props.actions.save(form);
      if (!r.ok) return setMessage(r.error ?? "Nie udało się zapisać szkicu.");
      setDraftId(r.draftId ?? null);
      setSavedForm(formKey);
      setRevision(r.revision);
      setMessage("Zapisano szkic. Uruchom „Sprawdź zmianę”.");
      router.refresh();
    });

  const check = () =>
    run(async () => {
      const r = await props.actions.check(form);
      if (!r.ok || !r.checks) return setMessage(r.error ?? "Nie udało się sprawdzić zmiany.");
      setChecks({ rows: r.checks, passed: Boolean(r.passed), summary: r.summary ?? "", form: formKey });
      setRevision(r.revision);
      setMessage(
        r.passed
          ? `Sprawdzenie zakończone: ${r.summary}.${saved ? "" : " Zapisz szkic, żeby go opublikować."}`
          : `Sprawdzenie wykazało niezgodność (${r.summary}). Szkic do poprawy.`,
      );
    });

  const publish = () =>
    run(async () => {
      if (!draftId) return;
      const r = await props.actions.publish({ draftId, expectedRevision: revision });
      if (!r.ok) {
        if (r.checks) setChecks({ rows: r.checks, passed: false, summary: r.summary ?? "", form: formKey });
        setRevision(r.revision);
        return setMessage(r.error ?? "Nie udało się opublikować zmiany.");
      }
      setPublished({ from: form.validFrom, value });
      setDraftId(null);
      setSavedForm(null);
      setRevision(r.revision);
      setMessage(`Zaplanowano zmianę: ${weeksLabel(props.currentDays)} → ${weeksLabel(value)} od ${formatDate(form.validFrom)}.`);
      router.refresh();
    });

  const discard = () =>
    run(async () => {
      const r = await props.actions.discard();
      setDraftId(null);
      setSavedForm(null);
      setRevision(r.revision);
      setMessage("Szkic odrzucony.");
      router.refresh();
    });

  // The tab opens synchronously (popup blockers allow it only inside the click), then gets its address.
  const showAsParent = () => {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    if (!saved) {
      if (tab) tab.location.href = "/app/kamil";
      return;
    }
    run(async () => {
      const r = await props.actions.preview();
      if (!r.ok) {
        tab?.close();
        return setMessage(r.error ?? "Nie udało się włączyć podglądu.");
      }
      if (tab) tab.location.href = "/app/kamil";
      setMessage("Podgląd szkicu otwarty w nowej karcie. Kończy się po publikacji, odrzuceniu szkicu albo po 30 minutach.");
    });
  };

  const statusBadge = published ? "Zaplanowana" : "Szkic";

  return (
    <div className={s.grid}>
      <Card className={s.span7} title="Formularz zmiany" id="change-form" meta={<Link href="/admin/reguly">Wróć do reguł</Link>}>
        <p className={s.eyebrow}>Wymiary · {props.name}</p>
        <OriginNote origin="app" appSource={props.appSource} />
        <form className={s.form} onSubmit={(e) => e.preventDefault()} style={{ marginTop: 16 }}>
          <div className={s.currentValue}>
            <div>
              <p className={s.eyebrow}>Obecnie</p>
              <span className={s.delta}>{weeksLabel(props.currentDays)}</span>
            </div>
            <span className={s.arrow} aria-hidden>
              →
            </span>
            <div>
              <p className={s.eyebrow}>Po zmianie</p>
              <span className={s.delta}>{validateValue("paternity.totalDays", value).length ? "—" : weeksLabel(value)}</span>
            </div>
            <span className={s.topbarSpacer} />
            <StateBadge state={statusBadge} />
          </div>

          <div className={s.fieldRow}>
            <label className={s.field}>
              <span className={s.labelText}>Nowy wymiar</span>
              <span className={s.withUnit}>
                <input
                  className={s.input}
                  type="number"
                  min={1}
                  max={4}
                  step={1}
                  inputMode="numeric"
                  value={Number.isFinite(form.weeks) ? form.weeks : ""}
                  onChange={(e) => update({ weeks: e.target.valueAsNumber })}
                  aria-invalid={validateValue("paternity.totalDays", value).length > 0}
                />
                <span className={s.unit}>tyg.</span>
              </span>
              <span className={s.hint}>Od 1 do 4 tygodni. Aplikacja przyjmuje części po tydzień lub dwa, najwyżej dwie.</span>
            </label>
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
            <p className={s.readonlyField}>Okresy zasiłku zaczynające się od tej daty. O wartości decyduje: {props.event.toLowerCase()}.</p>
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

      <Card className={s.span5} title="Wpływ na rodzinę" id="impact" meta="Przykładowa rodzina">
        {impact ? (
          <>
            <p className={cx(s.small, s.muted)} style={{ marginTop: 0 }}>
              Ojciec z dobrowolnym ubezpieczeniem, dziecko ma 2 miesiące w dniu zmiany. Wnioskuje o cały nowy wymiar.
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
        <div className={s.cardActions}>
          <button type="button" className={s.btnSecondary} onClick={showAsParent} disabled={pending}>
            Pokaż oczami rodzica
          </button>
        </div>
        <p className={cx(s.small, s.muted)} style={{ margin: "8px 0 0" }}>
          {saved
            ? "Otwiera sprawę Kamila z wartością ze szkicu, oznaczoną jako podgląd. Nic nie zostaje opublikowane."
            : "Zapisz szkic, żeby zobaczyć go oczami rodzica. Bez szkicu sprawa Kamila pokazuje opublikowane wartości."}
        </p>
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
            „Sprawdź zmianę” uruchamia prawdziwą regułę z wartością ze szkicu: wniosek na limicie i ponad limit, ten sam
            wniosek dzień przed zmianą, drugą część urlopu i sprawy testowe sprzed daty zmiany, które muszą zachować wynik.
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
