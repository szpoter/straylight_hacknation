"use client";

import Link from "next/link";
import { useState } from "react";
import { HISTORY, formatDate, type HistoryEntry } from "./mock-data";
import { Card, Drawer, StateBadge, cx } from "./ui";
import s from "./admin.module.css";

const FILTERS = ["Wszystkie", "Stawki", "Wymiary", "Podstawa", "Formularze"] as const;
type Filter = (typeof FILTERS)[number];

export function HistoryView() {
  const [filter, setFilter] = useState<Filter>("Wszystkie");
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const rows = HISTORY.filter((h) => filter === "Wszystkie" || h.group === filter);

  return (
    <div className={s.grid}>
      <Card className={s.span12} title="Publikacje" id="history" meta="Od najnowszej">
        <div className={s.tabs} role="group" aria-label="Filtr grupy">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={s.tab} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Data publikacji</th>
                <th scope="col">Parametr</th>
                <th scope="col" className={s.hideMobile}>
                  Stara → nowa
                </th>
                <th scope="col" className={s.hideMobile}>
                  Autor
                </th>
                <th scope="col" className={s.hideMobile}>
                  Stan
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr
                  key={h.id}
                  className={cx(s.rowButton, selected?.id === h.id && s.rowSelected)}
                  onClick={() => setSelected(h)}
                >
                  <td className={s.nowrap}>{formatDate(h.publishedAt)}</td>
                  <td>
                    <button type="button" className={s.rowLink} onClick={() => setSelected(h)}>
                      {h.parameter}
                    </button>
                    <span className={s.showMobile}>
                      <StateBadge state={h.state} />
                    </span>
                  </td>
                  <td className={cx(s.change, s.hideMobile)}>
                    {h.oldValue} → {h.newValue}
                  </td>
                  <td className={s.hideMobile}>{h.author}</td>
                  <td className={s.hideMobile}>
                    <StateBadge state={h.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className={s.empty}>Brak publikacji w tej grupie.</p> : null}
        </div>
      </Card>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        eyebrow={selected ? `${selected.group} · ${selected.id}` : undefined}
        title={selected?.parameter ?? ""}
        footer={
          selected ? (
            <Link href="/admin/zmiany" className={s.btnSecondary}>
              Utwórz korektę jako szkic
            </Link>
          ) : null
        }
      >
        {selected ? (
          <>
            <div className={s.currentValue}>
              <span className={s.drawerValue}>{selected.oldValue}</span>
              <span className={s.arrow} aria-label="zmienione na">
                →
              </span>
              <span className={s.drawerValue}>{selected.newValue}</span>
            </div>
            <dl className={s.dl}>
              <dt>Stan</dt>
              <dd>
                <StateBadge state={selected.state} />
              </dd>
              <dt>Obowiązuje od</dt>
              <dd>{formatDate(selected.from)}</dd>
              <dt>Opublikowano</dt>
              <dd>{formatDate(selected.publishedAt)}</dd>
              <dt>Autor</dt>
              <dd>{selected.author}</dd>
              <dt>Podstawa</dt>
              <dd>{selected.source}</dd>
              <dt>Wyniki testów</dt>
              <dd>{selected.tests}</dd>
            </dl>
            <div className={s.drawerSection}>
              <p className={s.drawerLabel}>Uzasadnienie</p>
              <p style={{ margin: 0 }}>{selected.reason}</p>
            </div>
          </>
        ) : null}
      </Drawer>
    </div>
  );
}
