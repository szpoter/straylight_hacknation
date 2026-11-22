import { expect, it } from "vitest";
import { applyMarta } from "../src/lib/marta/case";
import { commandSchema } from "../src/lib/marta/types";
import { martaPdf } from "../src/lib/marta/pdf";
import { modelHeaders } from "../src/lib/zusik/model-provider";

const base = { type: "compare", firstStart: "2027-01-18", days: 28, firstDaily: 150, secondDaily: 110 };
it("independently calculates both parents' dates, deadlines and amounts", () => {
  const view = applyMarta(null, commandSchema.parse(base)).view;
  expect(view?.variants.sequential).toEqual({
    first: { from: "2027-01-18", to: "2027-02-14", deadline: "2026-12-28", amount: 4200 },
    second: { from: "2027-02-15", to: "2027-03-14", deadline: "2027-01-25", amount: 3080 }, calendarDays: 56, total: 7280 });
  expect(view?.variants.together.second.from).toBe("2027-01-18");
  expect(commandSchema.safeParse({ ...base, firstStart: "2027-02-30" }).success).toBe(false);
});

it("keeps a missing rate unknown, verifies a copy, and exports only confirmed data", async () => {
  const compared = applyMarta(null, commandSchema.parse({ ...base, secondDaily: null })).view;
  expect(compared?.variants.together.total).toBeNull();
  const chosen = applyMarta(compared, { type: "choose", version: 1, variant: "sequential" }).view!;
  expect(applyMarta(chosen, { type: "record_handoff", version: 2 }).status).toBe(422);
  const confirmation = { type: "confirm" as const, version: 2, employerHasCopy: false, otherParentConfirmed: true as const, previousDays: 0, previousParts: 0 };
  expect(applyMarta(chosen, confirmation).status).toBe(422);
  const ready = applyMarta(chosen, { ...confirmation, employerHasCopy: true }).view!;
  expect(ready.attachmentName).toBeNull();
  const bytes = await martaPdf(ready);
  expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
  const sent = applyMarta(ready, { type: "record_handoff", version: 3 }).view!;
  expect(sent.handoffRecordedByParent).toBe(true);
  const old = { ...ready, version: 4, submitted: true, handoffRecordedByParent: undefined, attachmentVersion: undefined, submittedAt: "2026-03-01T00:00:00.000Z" };
  const now = new Date("2026-11-22T23:05:01Z");
  const updated = applyMarta(old, { type: "record_handoff", version: old.version }, now).view!;
  expect(updated.submittedAt).toBe(now.toISOString());
  expect(updated.previousPlanEntryAt).toBe(old.submittedAt);
  expect(updated.attachmentVersion).toBe(ready.version);
  expect(commandSchema.safeParse({ type: "submit", version: ready.version }).success).toBe(false);
  expect(applyMarta(sent, { type: "record_handoff", version: 3 }).view).toEqual(sent);
});

it("sends tunnel credentials only to the configured HTTPS origin", () => {
  const env = { MODEL_TUNNEL_ORIGIN: "https://models.example", CF_ACCESS_CLIENT_ID: "id", CF_ACCESS_CLIENT_SECRET: "secret", NODE_ENV: "test" as const };
  expect(modelHeaders("https://models.example/v1", env)?.["CF-Access-Client-Id"]).toBe("id");
  expect(modelHeaders("https://models.example.another.test/v1", env)).toBeUndefined();
});
