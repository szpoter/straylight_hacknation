import { z } from "zod";
import { PLANS } from "../demo/fixtures";

// Only topics from the public example catalogue can enter retrieval. Parent edits,
// field values and labels (which may contain a child’s name) stay in the browser.
const stops = [
  ...PLANS.find(plan => plan.kind === "planowane")?.stops ?? [],
  ...PLANS.find(plan => plan.kind === "przyklad")?.stops ?? [],
];
const publicTopics = new Map(stops.map(stop => [stop.id.replace(/^e-/, ""), stop.title]));
export function familyTopic(stopId?: string) {
  return stopId && publicTopics.get(stopId.replace(/^e-/, ""));
}

export const familyScopeSchema = z.object({
  planId: z.string().regex(/^[a-z0-9-]{1,64}$/),
  stopId: z.string().max(64).refine(id => Boolean(familyTopic(id))).optional(),
});
