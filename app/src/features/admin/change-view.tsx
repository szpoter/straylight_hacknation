"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { PARAMETERS, formatDate } from "./mock-data";
import { Badge, Card, StateBadge, cx } from "./ui";
import s from "./admin.module.css";

// Demo family from SPEC §12: daily base 200 zł, one period of 28 days.
const DAILY_BASE = 200;
const DAYS = 28;

type CheckStatus = "zgodna" | "niezgodna";
interface CheckRow {
  name: string;
  expected: string;
  result: string;
  status: CheckStatus;
}

const pln = (value: number) => `${value.toLocaleString("pl-PL", { maximumFractionDigits: 2, useGrouping: "always" })} zł`;

// Polish style used in the specs: "75%" without a space, "20 tyg." with one.
const withUnit = (value: string, unit: string) => (unit === "%" ? `${value}%` : `${value} ${unit}`.trim());

function parseNumber(raw: string): number | null {
  const n = Number(raw.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && raw.trim() !== "" ? n : null;
}

export function ChangeView({ parameterId }: { parameterId?: string }) {
  const parameter = PARAMETERS.find((p) => p.id === parameterId) ?? PARAMETERS[0];
  const unit = parameter.value.replace(/^[\d\s,.]+/, "").trim();
  const current = parseNumber(parameter.value);
  const isRate = unit === "%";

  const [next, setNext] = useState(parameter.planned?.value.replace(/[^\d,.]/g, "") ?? "");
  const [scope, setScope] = useState("all");
  const [from, setFrom] = useState("2027-01-01");
  const [source, setSource] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"new" | "draft" | "checked" | "scheduled">("new");
  const [checks, setChecks] = useState<CheckRow[] | null>(null);
  const formId = useId();

  const nextValue = parseNumber(next);
  const valid = nextValue !== null && (!isRate || (nextValue >= 0 && nextValue <= 100));
  const nowDaily = isRate && current !== null ? (DAILY_BASE * current) / 100 : null;
  const nextDaily = isRate && valid ? (DAILY_BASE * nextValue) / 100 : null;

  function runChecks() {
    const after = nextDaily !== null ? pln(nextDaily * DAYS) : withUnit(next, unit);
    const before = nowDaily !== null ? pln(nowDaily * DAYS) : parameter.value;
    setChecks([
      { name: "Sprawa w zakresie zmiany", expected: after, result: after, status: "zgodna" },
      { name: "Sprawa dzień przed datą obowiązywania", expected: before, result: before, status: "zgodna" },
      { name: "Sprawa spoza zakresu", expected: before, result: before, status: "zgodna" },
      {
        name: "Okres przecinający datę zmiany",
        expected: "podział na dwie części",
        result: source ? "podział na dwie części" : "brak podstawy zmiany",
        status: source ? "zgodna" : "niezgodna",
      },
    ]);
    setStatus("checked");
  }

  const allPass = checks?.every((c) => c.status === "zgodna") ?? false;
  const statusText = {
    new: "Nowa zmiana, niezapisana",
    draft: "Zapisano szkic",
    checked: allPass ? "Sprawdzenie zakończone, wszystkie sprawy zgodne" : "Sprawdzenie wykazało niezgodność, szkic do poprawy",
    scheduled: `Zaplanowano zmianę od ${formatDate(from)}`,
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
              <span className={s.delta}>{valid ? withUnit(next, unit) : "—"}</span>
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
                  inputMode="decimal"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  aria-invalid={next !== "" && !valid}
                />
                <span className={s.unit}>{unit}</span>
              </span>
              <span className={s.hint}>{isRate ? "Od 0 do 100, jedno miejsce po przecinku." : `Jednostka: ${unit || "—"}.`}</span>
            </label>
            <label className={s.field}>
              <span className={s.labelText}>Stosuj od</span>
              <input className={s.input} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className={s.hint}>Data zdarzenia, od którego liczy się nową wartość.</span>
            </label>
          </div>

          <label className={s.field}>
            <span className={s.labelText}>Zakres spraw</span>
            <select className={s.select} value={scope} onChange={(e) => setScope(e.target.value)}>
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
              onChange={(e) => setSource(e.target.value)}
            />
          </label>

          <label className={s.field}>
            <span className={s.labelText}>Uzasadnienie</span>
            <textarea className={s.textarea} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        </form>
      </Card>

      <Card className={cx(s.span5)} title="Wpływ na rodzinę" id="impact" meta="Przykładowa sprawa">
        {isRate ? (
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
                  <td>Stawka</td>
                  <td>{parameter.value}</td>
                  <td>{valid ? `${next}%` : "—"}</td>
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
          <p className={s.empty}>Podgląd wpływu dla tego typu parametru pojawi się po podłączeniu kalkulatora.</p>
        )}
        <div className={s.cardActions}>
          <button type="button" className={s.btnSecondary} aria-disabled="true" title="Dostępne po podłączeniu kalkulatora">
            Pokaż oczami rodzica
          </button>
        </div>
      </Card>

      <Card className={s.span12} title="Wyniki sprawdzenia" id="checks" meta={checks ? undefined : "Jeszcze nie uruchomiono"}>
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
            przypadku spoza jej zakresu.
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
        <button type="button" className={s.btnSecondary} onClick={runChecks} disabled={!valid}>
          Sprawdź zmianę
        </button>
        <button
          type="button"
          className={s.btn}
          aria-disabled={!allPass}
          onClick={() => allPass && setStatus("scheduled")}
        >
          Zaplanuj zmianę od {formatDate(from)}
        </button>
      </div>
    </div>
  );
}
