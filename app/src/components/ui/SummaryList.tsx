import { SOURCE_LABEL } from "@/lib/demo/fixtures";
import type { ProfileRow } from "@/lib/demo/types";
import { SourceLabel } from "./Tag";

/** Wiersze etykieta → wartość → źródło, z „Zmień” albo kłódką (GOV.UK Summary list). */
export function SummaryList({ rows, onChange }: { rows: ProfileRow[]; onChange?: (row: ProfileRow) => void }) {
  return (
    <dl className="divide-y divide-outline border-y border-outline">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 md:grid-cols-[minmax(10rem,14rem)_1fr_auto] md:items-baseline">
          <dt className="text-meta text-on-surface-variant md:text-body md:text-on-surface">{row.label}</dt>
          <dd className="col-start-1 flex flex-col gap-0.5 md:col-start-2">
            <span className="font-medium">{row.value}</span>
            <SourceLabel label={SOURCE_LABEL[row.source]} locked={!row.editable} />
          </dd>
          <dd className="col-start-2 row-span-2 row-start-1 self-center md:col-start-3 md:row-span-1">
            {row.editable && onChange ? (
              <button type="button" onClick={() => onChange(row)} className="text-label underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                Zmień<span className="sr-only"> {row.label.toLowerCase()}</span>
              </button>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
