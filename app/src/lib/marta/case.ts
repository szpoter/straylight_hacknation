import { addDays } from "../rules/dates";
import type { Command, MartaView, Period, Plan } from "./types";

function period(from: string, days: number, rate: number | null): Period {
  return { from, to: addDays(from, days - 1), deadline: addDays(from, -21),
    amount: rate === null ? null : Math.round(rate * 100) * days / 100 };
}

function compare(c: Extract<Command, { type: "compare" }>, version: number): MartaView {
  const first = period(c.firstStart, c.days, c.firstDaily);
  function plan(together: boolean): Plan {
    const second = period(together ? first.from : addDays(first.to, 1), c.days, c.secondDaily);
    return { first, second, calendarDays: c.days * (together ? 1 : 2),
      total: first.amount === null || second.amount === null ? null : Math.round((first.amount + second.amount) * 100) / 100 };
  }
  const { firstStart, days, firstDaily, secondDaily, firstName, secondName, childName } = c;
  return { version, inputs: { firstStart, days, firstDaily, secondDaily }, firstName, secondName, childName,
    variants: { together: plan(true), sequential: plan(false) }, selected: null, confirmed: false, submitted: false,
    submittedAt: null, attachmentName: null, employerHasCopy: null, previousParts: null, previousDays: null };
}

export function applyMarta(view: MartaView | null, c: Command, now = new Date()): { status: number; view: MartaView | null; error?: string } {
  const version = (view?.version ?? 0) + 1;
  if (c.version !== version - 1) return { status: 409, view, error: "stale_version" };
  if (view?.submitted) return { status: 409, view, error: "already_submitted" };
  if (c.type === "compare") return { status: 200, view: compare(c, version) };
  if (!view) return { status: 422, view, error: "compare_first" };
  if (c.type === "choose") return { status: 200, view: { ...view, selected: c.variant, version,
    confirmed: false, attachmentName: null, employerHasCopy: null, previousDays: null, previousParts: null } };
  if (!view.selected) return { status: 422, view, error: "choose_first" };
  if (c.type === "confirm") {
    if (!c.employerHasCopy && !c.attachmentName) return { status: 422, view, error: "missing_attachment" };
    if ((c.previousParts === 0) !== (c.previousDays === 0) || c.previousParts + 2 > 5 ||
        c.previousDays + 2 * view.inputs.days > 287) return { status: 422, view, error: "check_remaining_entitlement" };
    return { status: 200, view: { ...view, version, confirmed: true, previousDays: c.previousDays,
      previousParts: c.previousParts, employerHasCopy: c.employerHasCopy, attachmentName: c.employerHasCopy ? null : c.attachmentName ?? null } };
  }
  if (!view.confirmed) return { status: 422, view, error: "confirm_first" };
  return { status: 200, view: { ...view, version, submitted: true, submittedAt: now.toISOString() } };
}
