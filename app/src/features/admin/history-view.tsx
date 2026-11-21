"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PARAMETER_GROUPS, formatDate, formatDateTime, type HistoryEntry } from "./mock-data";
import { Card, Drawer, StateBadge, cx } from "./ui";
import s from "./admin.module.css";

// Same groups as the parameter tabs in Reguły świadczeń (SPEC §8, §14 L3).
const FILTERS = ["Wszystkie", ...PARAMETER_GROUPS] as const;
type Filter = (typeof FILTERS)[number];

interface HistoryActions {
  withdraw: (versionId: string) => Promise<{ ok: boolean; error?: string }>;
  reset: () => Promise<{ ok: boolean }>;
}

export function HistoryView({
  entries,
  hasSessionChanges,
  actions,
}: {
  entries: HistoryEntry[];
  hasSessionChanges: boolean;
  actions: HistoryActions;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("Wszystkie");
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const rows = entries.filter((h) => filter === "Wszystkie" || h.group === filter);

  const withdraw = (entry: HistoryEntry) =>
    startTransition(async () => {
      if (!entry.versionId) return;
      const r = await actions.withdraw(entry.versionId);
      setMessage(r.ok ? "Zaplanowana zmiana została wycofana." : (r.error ?? "Nie udało się wycofać zmiany."));
      setSelected(null);
      router.refresh();
    });

  const reset = () =>
    startTransition(async () => {
      await actions.reset();
      setMessage("Przywrócono wartości z kodu aplikacji.");
      router.refresh();
    });

  return (
    <div className={s.grid}>
      <Card
        className={s.span12}
        title="Publikacje"
        id="history"
        meta={
          hasSessionChanges ? (
            <button type="button" className={s.btnSmall} onClick={reset} disabled={pending}>
              Przywróć wartości początkowe
            </button>
          ) : (
            "Od najnowszej"
          )
        }
      >
        <p className={cx(s.small, s.muted)} style={{ margin: "0 0 12px" }} role="status">
          {message ??
            "Najpierw publikacje z tej sesji, pod nimi wpisy przykładowe. Kolejna sesja demonstracyjna zaczyna od wartości z kodu."}
        </p>
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
                    {h.sample ? (
                      <div className={s.originRow}>
                        <span className={cx(s.originBadge, s.originSpec)}>Przykład</span>
                      </div>
                    ) : null}
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
            <>
              {selected.versionId && selected.state === "Zaplanowana" ? (
                <button type="button" className={s.btnSecondary} onClick={() => withdraw(selected)} disabled={pending}>
                  Wycofaj zaplanowaną zmianę
                </button>
              ) : null}
              <Link href={`/admin/zmiany?parametr=${selected.parameterId}`} className={s.btnSecondary}>
                Utwórz korektę jako szkic
              </Link>
            </>
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
              <dt>Zakres spraw</dt>
              <dd>{selected.scope}</dd>
              <dt>Obowiązuje od</dt>
              <dd>{formatDate(selected.from)}</dd>
              <dt>Opublikowano</dt>
              <dd>{formatDateTime(selected.publishedAt)}</dd>
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
