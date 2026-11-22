"use client";

import { Panel, SectionTitle } from "@/components/ui";
import { useDemoSession } from "@/features/auth/demo-session";

export function MyData() {
  const family = useDemoSession()?.family;
  if (!family) return null;
  const rows = [
    ["Mama", family.mother],
    ["Tata", family.father],
    ["Tytuł ubezpieczenia mamy", family.insuranceTitle],
    ["Pracodawca mamy", family.employer],
  ];
  return (
    <Panel aria-labelledby="rodzice">
      <SectionTitle id="rodzice">Rodzice Oli</SectionTitle>
      <dl className="mt-4 divide-y divide-outline border-y border-outline">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-3 md:grid-cols-[14rem_1fr]">
            <dt className="text-on-surface-variant">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
