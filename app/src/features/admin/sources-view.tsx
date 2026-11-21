"use client";

import { useState } from "react";
import type { KnowledgePackage, KnowledgeSource } from "@/lib/admin/types";
import { formatDate } from "./mock-data";
import { Badge, Card, SourceLink, StatTile, cx } from "./ui";
import s from "./admin.module.css";

const AUTHORITY_LABEL: Record<KnowledgeSource["authority"], string> = {
  statute: "Ustawa",
  regulation: "Rozporządzenie",
  ministry_guidance: "Ministerstwo",
  zus_guidance: "ZUS",
};

/** SPEC-PANEL §5 [P]: flag sources not checked for more than six months. */
const STALE_AFTER_DAYS = 183;

function ageInDays(iso: string, today = new Date()): number {
  return Math.floor((today.getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000);
}

export function SourcesView({ packages, sources }: { packages: KnowledgePackage[]; sources: KnowledgeSource[] }) {
  const [pkg, setPkg] = useState<string>("Wszystkie");
  const filters = ["Wszystkie", ...packages.map((p) => p.version)];
  const rows = sources.filter((src) => pkg === "Wszystkie" || src.packageVersion === pkg);
  const fragments = packages.reduce((n, p) => n + p.fragments, 0);
  const lastVerified = packages.map((p) => p.verifiedAt).sort().at(-1);
  const stale = sources.filter((src) => ageInDays(src.retrievedAt) > STALE_AFTER_DAYS).length;

  return (
    <div className={s.grid}>
      <StatTile className={s.span3} label="Pakiety wiedzy" value={packages.length} note="z których odpowiada Zusik" />
      <StatTile className={s.span3} label="Dokumenty" value={sources.length} note="akty prawne i strony urzędowe" />
      <StatTile className={s.span3} label="Fragmenty" value={fragments} note="cytowalnych jednostek tekstu" />
      <StatTile
        className={s.span3}
        label="Ostatnia weryfikacja"
        value={lastVerified ? formatDate(lastVerified) : "—"}
        note={stale ? `${stale} źródeł starszych niż 6 miesięcy` : "wszystkie źródła aktualne"}
      />

      <Card className={s.span12} title="Źródła wiedzy" id="sources" meta="Odpowiedzi Zusika cytują wyłącznie te dokumenty">
        <div className={s.tabs} role="group" aria-label="Pakiet wiedzy">
          {filters.map((f) => (
            <button key={f} type="button" className={s.tab} aria-pressed={pkg === f} onClick={() => setPkg(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Dokument</th>
                <th scope="col" className={s.hideMobile}>
                  Rodzaj
                </th>
                <th scope="col" className={s.hideMobile}>
                  Pakiet
                </th>
                <th scope="col">Pobrano</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((src) => {
                const isStale = ageInDays(src.retrievedAt) > STALE_AFTER_DAYS;
                return (
                  <tr key={src.id}>
                    <td>
                      <SourceLink label={src.shortTitle} url={src.url} />
                      <div className={cx(s.small, s.muted)}>
                        {src.issuer}
                        {src.validFrom || src.validTo
                          ? ` · obowiązuje ${src.validFrom ? `od ${formatDate(src.validFrom)}` : ""}${src.validTo ? ` do ${formatDate(src.validTo)}` : ""}`
                          : ""}
                      </div>
                      <div className={cx(s.small, s.muted)}>{src.versionNote}</div>
                    </td>
                    <td className={cx(s.nowrap, s.hideMobile)}>{AUTHORITY_LABEL[src.authority]}</td>
                    <td className={cx(s.nowrap, s.hideMobile, s.small)}>{src.packageVersion}</td>
                    <td className={s.nowrap}>
                      {isStale ? (
                        <Badge tone="warn">{formatDate(src.retrievedAt)}</Badge>
                      ) : (
                        formatDate(src.retrievedAt)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className={s.span12} title="Pakiety" id="packages">
        <ul className={s.list}>
          {packages.map((p) => (
            <li key={p.version} className={s.listItem}>
              <div className={s.listRow}>
                <span className={s.change}>{p.version}</span>
                <span className={cx(s.small, s.muted)}>
                  {p.documents} dok. · {p.fragments} fragm. · zweryfikowano {formatDate(p.verifiedAt)}
                </span>
              </div>
              <span className={cx(s.small, s.muted)}>{p.description}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
