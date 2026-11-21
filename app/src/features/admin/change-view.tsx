"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { PARAMETERS, formatDate, type Parameter } from "./mock-data";
import { Badge, Card, StateBadge, cx } from "./ui";
import s from "./admin.module.css";

// Demo family from SPEC §12: daily base 200 zł, one period of parental leave lasting 28 days.
const DAILY_BASE = 200;
const DAYS = 28;
const DEMO_PERIOD = "urlop rodzicielski";

type CheckStatus = "zgodna" | "niezgodna";
interface CheckRow {
  name: string;
  expected: string;
  result: string;
  status: CheckStatus;
}

type Kind = "rate" | "number" | "text";
type Status = "new" | "draft" | "checked" | "scheduled";

const pln = (value: number) => `${value.toLocaleString("pl-PL", { maximumFractionDigits: 2, useGrouping: "always" })} zł`;

// Polish style used in the specs: "75%" without a space, "20 tyg." with one.
const withUnit = (value: string, unit: string) => (unit === "%" ? `${value}%` : `${value} ${unit}`.trim());

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?/.test(cleaned)) return null;
  return Number.parseFloat(cleaned);
}

/** SPEC §3 [P]: percent 0–100 with at most one decimal place; other numeric units as plain numbers. */
function isValid(kind: Kind, raw: string): boolean {
  const value = raw.trim().replace(/\s/g, "");
  if (kind === "text") return value !== "";
  if (kind === "rate") return /^\d{1,3}([.,]\d)?$/.test(value) && Number(value.replace(",", ".")) <= 100;
  return /^\d+([.,]\d+)?$/.test(value);
}

/** Cases checked by „Sprawdź zmianę”, per change type (SPEC §7 table). Simulated until lib/rules exists. */
function checksFor(p: Parameter, before: string, after: string, next: string): CheckRow[] {
  const ok = (name: string, expected: string, result = expected): CheckRow => ({ name, expected, result, status: "zgodna" });
  switch (p.group) {
    case "Stawki":
      return [
        ok("Sprawa w zakresie zmiany", after),
        ok("Sprawa dzień przed datą obowiązywania", before),
        ok("Sprawa spoza zakresu", before),
        ok("Okres przecinający datę zmiany", "dwie części, każda według swojej stawki"),
      ];
    case "Wymiary":
    case "Uzupełniający":
      return [
        ok("Wniosek dokładnie na limicie", "przyznany"),
        ok("Wniosek ponad limit", "odmowa z przyczyną: przekroczony limit"),
        ok("Bliźnięta (wspólna pula)", `pula według ${after}`),
        ok("Łączenie z pracą", "wydłużenie według nowego limitu"),
      ];
    case "Terminy":
      return [
        ok("Zdarzenie bazowe w dniu zmiany", `termin ${after}`),
        ok("Zdarzenie bazowe dzień wcześniej", `termin ${before}`),
      ];
    case "Formularze":
      return [
        ok("Szkice rodziców na wycofanym formularzu", "oznaczone „Sprawdź po zmianie”"),
        ok("Kierowanie płatnik / ZUS", "bez zmian"),
      ];
    case "Kto wypłaca": {
      const threshold = Number.parseInt(next, 10) || 20;
      return [
        ok(`Płatnik z ${threshold} ubezpieczonymi`, "złóż w ZUS"),
        ok(`Płatnik z ${threshold + 1} ubezpieczonymi`, "złóż u pracodawcy"),
      ];
    }
    default:
      return [
        ok("Sprawa w zakresie zmiany", after),
        ok("Sprawa dzień przed datą obowiązywania", before),
        ok("Sprawa spoza zakresu", before),
      ];
  }
}

export function ChangeView({ parameterId }: { parameterId?: string }) {
  const parameter = PARAMETERS.find((p) => p.id === parameterId) ?? PARAMETERS[0];
  const current = parseNumber(parameter.value);
  const unit = current === null ? "" : parameter.value.replace(/^[\d\s,.]+/, "").trim();
  const kind: Kind = unit === "%" ? "rate" : current === null ? "text" : "number";

  const initialNext = parameter.planned
    ? kind === "text"
      ? parameter.planned.value
      : parameter.planned.value.replace(/[^\d,.]/g, "")
    : "";

  const [next, setNext] = useState(initialNext);
  const [scope, setScope] = useState("all");
  const [from, setFrom] = useState(parameter.planned?.from ?? "2027-01-01");
  const [source, setSource] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<Status>("new");
  const [checks, setChecks] = useState<CheckRow[] | null>(null);
  const formId = useId();

  // Any edit invalidates an earlier check, so a value is never published without being checked (SPEC §7, §12).
  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setChecks(null);
      setStatus((prev) => (prev === "new" ? "new" : "draft"));
    };
  }

  const valid = isValid(kind, next);
  const nextValue = valid && kind !== "text" ? parseNumber(next) : null;
  const ready = valid && from !== "";
  const newLabel = valid ? withUnit(next, unit) : "—";
  const nowDaily = kind === "rate" && current !== null ? (DAILY_BASE * current) / 100 : null;
  const nextDaily = kind === "rate" && nextValue !== null ? (DAILY_BASE * nextValue) / 100 : null;

  function runChecks() {
    const before = nowDaily !== null ? pln(nowDaily * DAYS) : parameter.value;
    const after = nextDaily !== null ? pln(nextDaily * DAYS) : newLabel;
    const rows = checksFor(parameter, before, after, next);
    // SPEC §12: publication requires a filled-in source.
    rows.push(
      source.trim()
        ? { name: "Podstawa zmiany", expected: "uzupełniona", result: "uzupełniona", status: "zgodna" }
        : { name: "Podstawa zmiany", expected: "uzupełniona", result: "brak", status: "niezgodna" },
    );
    setChecks(rows);
    setStatus("checked");
  }

  const passed = checks?.filter((c) => c.status === "zgodna").length ?? 0;
  const allPass = checks !== null && passed === checks.length;
  const statusText = {
    new: "Nowa zmiana, niezapisana",
    draft: "Zapisano szkic. Przed publikacją uruchom „Sprawdź zmianę”.",
    checked: allPass
      ? `Gotowe do publikacji: ${parameter.value} → ${newLabel} od ${formatDate(from)} · ${passed} / ${checks?.length} zgodnych`
      : `Sprawdzenie wykazało niezgodność (${passed} / ${checks?.length} zgodnych). Szkic do poprawy.`,
    scheduled: `Zaplanowano zmianę ${parameter.value} → ${newLabel} od ${formatDate(from)}`,
  }[status];

  return (
    <div className={s.grid}>
      <Card className={s.span7} title="Formularz zmiany" id="change-form" meta={<Link href="/admin/reguly">Wróć do reguł</Link>}>
        <p className={s.eyebrow}>
          {parameter.group} · {parameter.name}
        </p>
        <form id={formId} className={s.form} onSubmit={(e) => e.preventDefault()} style={{ marginTop: 12 }}>
          <div className={s.currentValue}>
            <div>
              <p className={s.eyebrow}>Obecnie</p>
              <span className={s.delta}>{parameter.value}</span>
            </div>
            <span className={s.arrow} aria-hidden>
              →
            </span>
            <div>
              <p className={s.eyebrow}>Po zmianie</p>
              <span className={s.delta}>{newLabel}</span>
            </div>
            <span className={s.topbarSpacer} />
            <StateBadge state={status === "scheduled" ? "Zaplanowana" : "Szkic"} />
          </div>

          <div className={s.fieldRow}>
            <label className={s.field}>
              <span className={s.labelText}>Nowa wartość</span>
              <span className={s.withUnit}>
                <input
                  className={s.input}
                  inputMode={kind === "text" ? "text" : "decimal"}
                  value={next}
                  onChange={(e) => edit(setNext)(e.target.value)}
                  aria-invalid={next !== "" && !valid}
                />
                {unit ? <span className={s.unit}>{unit}</span> : null}
              </span>
              <span className={s.hint}>
                {kind === "rate"
                  ? "Od 0 do 100, jedno miejsce po przecinku."
                  : kind === "number"
                    ? `Liczba w jednostce: ${unit}.`
                    : "Nowy stan, np. obowiązuje albo zlikwidowany."}
              </span>
            </label>
            <label className={s.field}>
              <span className={s.labelText}>Stosuj od</span>
              <input
                className={s.input}
                type="date"
                value={from}
                required
                onChange={(e) => edit(setFrom)(e.target.value)}
                aria-invalid={from === ""}
              />
              <span className={s.hint}>Data zdarzenia, od którego liczy się nową wartość.</span>
            </label>
          </div>

          <label className={s.field}>
            <span className={s.labelText}>Zakres spraw</span>
            <select className={s.select} value={scope} onChange={(e) => edit(setScope)(e.target.value)}>
              <option value="all">Wszystkie sprawy tego świadczenia</option>
              <option value="new">Tylko nowe wnioski od daty stosowania</option>
              <option value="birth">Dzieci urodzone od daty stosowania</option>
            </select>
          </label>

          <label className={s.field}>
            <span className={s.labelText}>Podstawa zmiany</span>
            <input
              className={s.input}
              placeholder="np. ustawa, artykuł, odnośnik do źródła"
              value={source}
              onChange={(e) => edit(setSource)(e.target.value)}
            />
          </label>

          <label className={s.field}>
            <span className={s.labelText}>Uzasadnienie</span>
            <textarea className={s.textarea} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        </form>
      </Card>

      <Card className={s.span5} title="Wpływ na rodzinę" id="impact" meta="Przykładowa sprawa">
        {kind === "rate" ? (
          <>
            <p className={cx(s.small, s.muted)} style={{ marginTop: 0 }}>
              Podstawa dzienna {pln(DAILY_BASE)}, jeden okres {DAYS} dni.
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
                <tr>
                  <td>Okres</td>
                  <td>{DEMO_PERIOD}</td>
                  <td>{DEMO_PERIOD}</td>
                </tr>
                <tr>
                  <td>Stawka</td>
                  <td>{parameter.value}</td>
                  <td>{newLabel}</td>
                </tr>
                <tr>
                  <td>Liczba dni</td>
                  <td>{DAYS}</td>
                  <td>{DAYS}</td>
                </tr>
                <tr>
                  <td>Zasiłek za dzień</td>
                  <td>{nowDaily !== null ? pln(nowDaily) : "—"}</td>
                  <td>{nextDaily !== null ? pln(nextDaily) : "—"}</td>
                </tr>
                <tr>
                  <td>Zasiłek za okres</td>
                  <td>{nowDaily !== null ? pln(nowDaily * DAYS) : "—"}</td>
                  <td>{nextDaily !== null ? pln(nextDaily * DAYS) : "—"}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Różnica</td>
                  <td />
                  <td>
                    <span className={s.delta}>
                      {nowDaily !== null && nextDaily !== null
                        ? `${nextDaily >= nowDaily ? "+" : "−"}${pln(Math.abs(nextDaily - nowDaily) * DAYS)}`
                        : "—"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <>
            <table className={s.compare}>
              <thead>
                <tr>
                  <th scope="col">Pozycja</th>
                  <th scope="col">Obecnie</th>
                  <th scope="col">Po zmianie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{parameter.name}</td>
                  <td>{parameter.value}</td>
                  <td>{newLabel}</td>
                </tr>
              </tbody>
            </table>
            <p className={cx(s.small, s.muted)}>
              Wynik dla przykładowej rodziny pokaże się, gdy panel zostanie podłączony do kalkulatora rodzica.
            </p>
          </>
        )}
        <div className={s.cardActions}>
          <button type="button" className={s.btnSecondary} aria-disabled="true" title="Dostępne po podłączeniu kalkulatora">
            Pokaż oczami rodzica
          </button>
        </div>
      </Card>

      <Card className={s.span12} title="Wyniki sprawdzenia" id="checks" meta={checks ? `${passed} / ${checks.length} zgodnych` : "Jeszcze nie uruchomiono"}>
        {checks ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Przypadek</th>
                  <th scope="col" className={s.num}>
                    Oczekiwany
                  </th>
                  <th scope="col" className={s.num}>
                    Wynik
                  </th>
                  <th scope="col">Zgodność</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className={s.num}>{c.expected}</td>
                    <td className={s.num}>{c.result}</td>
                    <td>
                      <Badge tone={c.status === "zgodna" ? "active" : "warn"}>
                        {c.status === "zgodna" ? "Zgodna" : "Niezgodna"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={cx(s.muted, s.small)} style={{ margin: 0 }}>
            „Sprawdź zmianę” porówna wynik z oczekiwaniem dla zmienianej grupy, sprawy tuż przed wejściem reguły i
            przypadku spoza jej zakresu. Każda zmiana w formularzu wymaga ponownego sprawdzenia.
          </p>
        )}
      </Card>

      <div className={cx(s.span12, s.actionBar)}>
        <span className={s.actionStatus} role="status">
          {statusText}
        </span>
        <button type="button" className={s.btnSecondary} onClick={() => setStatus("draft")} disabled={!valid}>
          Zapisz szkic
        </button>
        <button type="button" className={s.btnSecondary} onClick={runChecks} disabled={!ready}>
          Sprawdź zmianę
        </button>
        <button
          type="button"
          className={s.btn}
          aria-disabled={!allPass || status === "scheduled"}
          onClick={() => allPass && setStatus("scheduled")}
        >
          {from ? `Zaplanuj zmianę od ${formatDate(from)}` : "Zaplanuj zmianę"}
        </button>
      </div>
    </div>
  );
}
