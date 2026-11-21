"use client";

import Link from "next/link";
import { useState } from "react";
import type { TestCase } from "@/lib/admin/types";
import { HISTORY, PARAMETER_GROUPS, formatDate, type Parameter, type ParameterGroup } from "./mock-data";
import { Card, Drawer, OriginBadge, OriginNote, PillTabs, SourceLink, StatTile, StateBadge, cx } from "./ui";
import s from "./admin.module.css";

export function RulesView({ parameters, cases }: { parameters: Parameter[]; cases: TestCase[] }) {
  const [group, setGroup] = useState<ParameterGroup>("Stawki");
  const [selected, setSelected] = useState<Parameter | null>(null);

  const active = parameters.filter((p) => p.state === "Obowiązuje");
  const appliedByApp = active.filter((p) => p.origin === "app").length;
  const planned = parameters.filter((p) => p.planned).sort((a, b) => a.planned!.from.localeCompare(b.planned!.from));
  const drafts = parameters.filter((p) => p.state === "Szkic").length;
  const passing = cases.filter((c) => c.status === "zgodna").length;
  const rows = parameters.filter((p) => p.group === group);

  return (
    <div className={s.grid}>
      <StatTile
        className={s.span3}
        label="Obowiązują"
        value={active.length}
        note={`w tym ${appliedByApp} stosuje już aplikacja`}
      />
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
        value={`${passing} / ${cases.length}`}
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
                    <div className={s.originRow}>
                      <OriginBadge origin={p.origin} />
                    </div>
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
          <p className={cx(s.small, s.muted)} style={{ margin: "0 0 12px" }}>
            Dane przykładowe do czasu zapisu wersji reguł.
          </p>
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
          <StateBadge state={p.state} />{" "}
          {p.from !== "—" ? <span className={cx(s.small, s.muted)}>od {formatDate(p.from)}</span> : null}
        </div>
      </div>

      <OriginNote origin={p.origin} appSource={p.appSource} />

      {p.planned ? (
        <div className={s.planned}>
          Zaplanowana zmiana na <strong>{p.planned.value}</strong> od {formatDate(p.planned.from)}.
        </div>
      ) : null}

      <dl className={s.dl}>
        <dt>Zakres spraw</dt>
        <dd>{p.scope ?? "Wszystkie sprawy tego świadczenia"}</dd>
        <dt>Podstawa</dt>
        <dd>
          <SourceLink label={p.source} url={p.sourceUrl} />
        </dd>
        <dt>Gdzie działa u rodzica</dt>
        <dd>{p.usedIn}</dd>
        {p.details?.map((d) => (
          <Detail key={d.label} label={d.label} value={d.value} />
        ))}
      </dl>

      {p.quote ? (
        <div className={s.drawerSection}>
          <p className={s.drawerLabel}>Brzmienie źródła</p>
          <blockquote className={s.quote}>{p.quote}</blockquote>
        </div>
      ) : null}

      <div className={s.drawerSection}>
        <p className={s.drawerLabel}>Historia wersji</p>
        <ul className={s.list}>
          {p.history.map((v) => (
            <li key={`${v.value}-${v.from}`} className={s.listItem}>
              <div className={s.listRow}>
                <span className={s.change}>{v.value}</span>
                <StateBadge state={v.state} />
              </div>
              {v.from !== "—" ? <span className={cx(s.small, s.muted)}>od {formatDate(v.from)}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={s.ddWrap}>{value}</dd>
    </>
  );
}
