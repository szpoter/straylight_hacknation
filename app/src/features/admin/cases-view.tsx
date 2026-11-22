"use client";

import { useId, useState } from "react";
import type { CaseStatus, TestCase } from "@/lib/admin/types";
import { caseSearchFields, searchItems } from "./search";
import { Badge, Card, StatTile, cx } from "./ui";
import s from "./admin.module.css";

/** "niezgodna" also lists cases moved by a published change (layout L2: four tiles). */
type Filter = "wszystkie" | Exclude<CaseStatus, "do-aktualizacji">;

const STATUS_LABEL: Record<CaseStatus, string> = {
  zgodna: "Zgodna",
  niezgodna: "Niezgodna",
  "do-aktualizacji": "Do aktualizacji",
  "brak-danych": "Brak danych",
};

const STATUS_TONE = { zgodna: "active", niezgodna: "warn", "do-aktualizacji": "planned", "brak-danych": "historic" } as const;

const inFilter = (status: CaseStatus, filter: Filter) =>
  filter === "wszystkie" || status === filter || (filter === "niezgodna" && status === "do-aktualizacji");

export function CasesView({ cases }: { cases: TestCase[] }) {
  const [filter, setFilter] = useState<Filter>("wszystkie");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");
  const [uploaded, setUploaded] = useState<string | null>(null);
  const uploadId = useId();

  const count = (f: Filter) => cases.filter((c) => inFilter(c.status, f)).length;
  const outdated = cases.filter((c) => c.status === "do-aktualizacji").length;
  const visible = searchItems(
    cases.filter((c) => inFilter(c.status, filter)),
    query,
    caseSearchFields,
  );
  const selected = visible.find((c) => c.id === selectedId) ?? visible[0] ?? null;

  const toggle = (next: Filter) => setFilter((current) => (current === next ? "wszystkie" : next));

  return (
    <div className={s.grid}>
      <StatTile
        className={s.span3}
        label="Wszystkie"
        value={cases.length}
        note="spraw w zestawie"
        pressed={filter === "wszystkie"}
        onClick={() => setFilter("wszystkie")}
      />
      <StatTile
        className={s.span3}
        label="Zgodne"
        value={count("zgodna")}
        note="wynik jak oczekiwany"
        pressed={filter === "zgodna"}
        onClick={() => toggle("zgodna")}
      />
      <StatTile
        className={s.span3}
        label="Niezgodne"
        value={count("niezgodna")}
        note={outdated ? `w tym ${outdated} do aktualizacji po opublikowanej zmianie` : "różnica do sprawdzenia"}
        pressed={filter === "niezgodna"}
        onClick={() => toggle("niezgodna")}
      />
      <StatTile
        className={s.span3}
        label="Brak danych"
        value={count("brak-danych")}
        note="brakuje informacji wejściowej"
        pressed={filter === "brak-danych"}
        onClick={() => toggle("brak-danych")}
      />

      <Card className={s.span4} title="Sprawy" id="cases" meta={`${visible.length} na liście`}>
        <label className={s.search}>
          <span className={s.visuallyHidden}>Szukaj sprawy</span>
          <input
            className={s.input}
            type="search"
            placeholder="Nazwa, numer lub dane sprawy"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        {visible.length ? (
          <ul className={s.caseList}>
            {visible.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={cx(s.caseItem, selected?.id === c.id && s.caseItemActive)}
                  aria-current={selected?.id === c.id ? "true" : undefined}
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className={s.caseItemTop}>
                    <span className={s.caseId}>{c.id}</span>
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </span>
                  <span>{c.title}</span>
                  <span className={cx(s.small, s.muted)}>{c.tag}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.empty}>{query.trim() ? `Brak spraw pasujących do „${query.trim()}”.` : "Brak spraw dla tego filtra."}</p>
        )}

        <div className={s.upload}>
          <label htmlFor={uploadId} className={s.btnSecondary}>
            Wgraj PDF
          </label>
          <input
            id={uploadId}
            className={s.visuallyHidden}
            type="file"
            accept="application/pdf"
            onChange={(e) => setUploaded(e.target.files?.[0]?.name ?? null)}
          />
          <span className={s.hint}>
            {uploaded ? `Wybrano: ${uploaded}. Odczyt dokumentu pojawi się po podłączeniu OCR.` : "ZAM, Z-3, Z-3a, ZAS-12 i inne dokumenty testowe."}
          </span>
        </div>
      </Card>

      <div className={s.span8}>{selected ? <CaseDetails testCase={selected} /> : <EmptyDetails />}</div>
    </div>
  );
}

function CaseDetails({ testCase: c }: { testCase: TestCase }) {
  return (
    <Card title={c.title} id="case-details" meta={`${c.id} · ${c.tag}`}>
      {c.missing ? <p className={s.notice}>{c.missing}</p> : null}
      {c.outdatedBy ? <p className={s.notice}>{c.outdatedBy}</p> : null}

      <div className={s.twoCol} style={{ marginTop: c.missing || c.outdatedBy ? 24 : 0 }}>
        <div>
          <h3 className={s.subTitle}>Dane wejściowe</h3>
          <dl className={s.dl}>
            {c.inputs.map((i) => (
              <Pair key={i.label} label={i.label} value={i.value} />
            ))}
          </dl>
        </div>

        <div>
          <h3 className={s.subTitle}>Oczekiwany wynik i wynik kalkulatora</h3>
          <table className={s.compare}>
            <thead>
              <tr>
                <th scope="col">Pozycja</th>
                <th scope="col">Oczekiwany</th>
                <th scope="col">Wynik</th>
              </tr>
            </thead>
            <tbody>
              {c.expected.map((e) => {
                const result = c.result.find((r) => r.label === e.label)?.value ?? "—";
                return (
                  <tr key={e.label}>
                    <td>{e.label}</td>
                    <td>{e.value}</td>
                    <td>{result}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className={s.small} style={{ marginTop: 12 }}>
            <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
          </p>
        </div>
      </div>

      {c.reasons?.length ? (
        <div style={{ marginTop: 24 }}>
          <h3 className={s.subTitle}>Uzasadnienie z reguły</h3>
          <ul className={s.reasons}>
            {c.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {c.computedBy ? (
        <p className={cx(s.small, s.muted)} style={{ margin: "16px 0 0" }}>
          Wynik policzony na żywo: {c.computedBy}
        </p>
      ) : null}

      <div className={s.cardActions}>
        <button type="button" className={s.btnSecondary} aria-disabled="true" title="Dostępne po podłączeniu kalkulatora">
          Pokaż oczami rodzica
        </button>
      </div>
    </Card>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function EmptyDetails() {
  return (
    <Card title="Szczegóły sprawy" id="case-details">
      <p className={s.empty}>Wybierz sprawę z listy.</p>
    </Card>
  );
}
