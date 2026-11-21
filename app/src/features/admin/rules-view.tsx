"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HISTORY,
  PARAMETER_GROUPS,
  PARAMETERS,
  TEST_CASES,
  formatDate,
  type Parameter,
  type ParameterGroup,
} from "./mock-data";
import { Card, Drawer, PillTabs, StatTile, StateBadge, cx } from "./ui";
import s from "./admin.module.css";

export function RulesView() {
  const [group, setGroup] = useState<ParameterGroup>("Stawki");
  const [selected, setSelected] = useState<Parameter | null>(null);

  const active = PARAMETERS.filter((p) => p.state === "Obowiązuje").length;
  const planned = PARAMETERS.filter((p) => p.planned).sort((a, b) => a.planned!.from.localeCompare(b.planned!.from));
  const drafts = PARAMETERS.filter((p) => p.state === "Szkic").length;
  const passing = TEST_CASES.filter((c) => c.status === "zgodna").length;
  const rows = PARAMETERS.filter((p) => p.group === group);

  return (
    <div className={s.grid}>
      <StatTile className={s.span3} label="Obowiązują" value={active} note="parametrów w aktualnej wersji" />
      <StatTile
        className={s.span3}
        label="Zaplanowane"
        value={planned.length}
        note={planned[0] ? `najbliższa od ${formatDate(planned[0].planned!.from)}` : "brak zaplanowanych"}
      />
      <StatTile className={s.span3} label="Szkice" value={drafts} note="czekają na sprawdzenie" />
      <StatTile
        className={s.span3}
        label="Sprawy testowe"
        value={`${passing} / ${TEST_CASES.length}`}
        note="zgodnych z oczekiwanym wynikiem"
      />

      <Card className={s.span8} title="Parametry" id="params" meta="Kliknij wiersz, aby zobaczyć szczegóły">
        <PillTabs label="Grupy parametrów" items={PARAMETER_GROUPS} value={group} onChange={setGroup} idPrefix="groups" />
        <div
          role="tabpanel"
          id="groups-panel"
          aria-labelledby={`groups-tab-${PARAMETER_GROUPS.indexOf(group)}`}
          className={s.tableWrap}
        >
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Nazwa</th>
                <th scope="col" className={s.num}>
                  Wartość
                </th>
                <th scope="col" className={s.hideMobile}>
                  Od
                </th>
                <th scope="col" className={s.hideMobile}>
                  Stan
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className={cx(s.rowButton, selected?.id === p.id && s.rowSelected)}
                  onClick={() => setSelected(p)}
                >
                  <td>
                    <button type="button" className={s.rowLink} onClick={() => setSelected(p)}>
                      {p.name}
                    </button>
                    {p.planned ? (
                      <div className={cx(s.small, s.muted)}>
                        od {formatDate(p.planned.from)}: {p.planned.value}
                      </div>
                    ) : null}
                    <span className={s.showMobile}>
                      <StateBadge state={p.state} />
                    </span>
                  </td>
                  <td className={s.num}>{p.value}</td>
                  <td className={cx(s.nowrap, s.hideMobile)}>{formatDate(p.from)}</td>
                  <td className={s.hideMobile}>
                    <StateBadge state={p.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className={cx(s.span4, s.stackCol)}>
        <Card title="Najbliższe zmiany" id="upcoming">
          {planned.length ? (
            <ul className={s.list}>
              {planned.map((p) => (
                <li key={p.id} className={s.listItem}>
                  <span className={cx(s.small, s.muted)}>od {formatDate(p.planned!.from)}</span>
                  <span>{p.name}</span>
                  <span className={s.change}>
                    {p.value} → {p.planned!.value}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.empty}>Brak zaplanowanych zmian.</p>
          )}
        </Card>

        <Card title="Ostatnie publikacje" id="recent" meta={<Link href="/admin/historia">Cała historia</Link>}>
          <ul className={s.list}>
            {HISTORY.slice(0, 3).map((h) => (
              <li key={h.id} className={s.listItem}>
                <div className={s.listRow}>
                  <span className={cx(s.small, s.muted)}>{formatDate(h.publishedAt)}</span>
                  <StateBadge state={h.state} />
                </div>
                <span>{h.parameter}</span>
                <span className={cx(s.small, s.muted)}>{h.author}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        eyebrow={selected?.group}
        title={selected?.name ?? ""}
        footer={
          selected ? (
            <Link href={`/admin/zmiany?parametr=${selected.id}`} className={s.btn}>
              Przygotuj zmianę
            </Link>
          ) : null
        }
      >
        {selected ? <ParameterDetails parameter={selected} /> : null}
      </Drawer>
    </div>
  );
}

function ParameterDetails({ parameter: p }: { parameter: Parameter }) {
  return (
    <>
      <div className={s.drawerSection}>
        <p className={s.drawerLabel}>Aktualna wartość</p>
        <span className={s.drawerValue}>{p.value}</span>
        <div>
          <StateBadge state={p.state} /> <span className={cx(s.small, s.muted)}>od {formatDate(p.from)}</span>
        </div>
      </div>

      {p.planned ? (
        <div className={s.planned}>
          Zaplanowana zmiana na <strong>{p.planned.value}</strong> od {formatDate(p.planned.from)}.
        </div>
      ) : null}

      <dl className={s.dl}>
        <dt>Zakres spraw</dt>
        <dd>{p.scope ?? "Wszystkie sprawy tego świadczenia"}</dd>
        <dt>Podstawa</dt>
        <dd>{p.source}</dd>
        <dt>Gdzie działa u rodzica</dt>
        <dd>{p.usedIn}</dd>
      </dl>

      <div className={s.drawerSection}>
        <p className={s.drawerLabel}>Historia wersji</p>
        <ul className={s.list}>
          {p.history.map((v) => (
            <li key={`${v.value}-${v.from}`} className={s.listItem}>
              <div className={s.listRow}>
                <span className={s.change}>{v.value}</span>
                <StateBadge state={v.state} />
              </div>
              <span className={cx(s.small, s.muted)}>od {formatDate(v.from)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
