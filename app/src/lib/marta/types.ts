import { OLA } from "../family/ola";
import { z } from "zod";
import { isValidIso } from "../rules/dates";

const familyValue = (expected: string) => z.string().refine(value => value === expected).default(expected);
const version = z.number().int().nonnegative();
const rate = z.number().nonnegative().max(100000).multipleOf(0.01).nullable();
const variant = z.enum(["together", "sequential"]);
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("compare"), version: version.default(0), firstStart: z.string().date().refine(isValidIso),
    days: z.number().int().min(1).max(143), firstDaily: rate, secondDaily: rate,
    firstName: familyValue(OLA.mother), secondName: familyValue(OLA.father), childName: familyValue(OLA.child),
    childBirthDate: z.literal(OLA.birthDate).optional() }),
  z.object({ type: z.literal("choose"), version, variant }),
  z.object({ type: z.literal("confirm"), version, employerHasCopy: z.boolean(), otherParentConfirmed: z.literal(true),
    attachmentName: z.string().trim().min(1).max(150).regex(/^[^\x00-\x1f/\\]+$/u).nullish(),
    previousDays: z.number().int().min(0).max(287), previousParts: z.number().int().min(0).max(5) }),
  z.object({ type: z.literal("record_handoff"), version }),
]);
export type Command = z.infer<typeof commandSchema>;
export type Variant = z.infer<typeof variant>;
export type Period = { from: string; to: string; deadline: string; amount: number | null };
export type Plan = { first: Period; second: Period; calendarDays: number; total: number | null };
export interface MartaView {
  version: number;
  inputs: { firstStart: string; days: number; firstDaily: number | null; secondDaily: number | null };
  firstName: string; secondName: string; childName: string; childBirthDate?: string;
  handoffRecordedByParent?: true; previousPlanEntryAt?: string; attachmentVersion?: number; attachmentFamily?: "ola";
  variants: Record<Variant, Plan>; selected: Variant | null;
  employerHasCopy: boolean | null; attachmentName: string | null;
  previousDays: number | null; previousParts: number | null;
  confirmed: boolean; submitted: boolean; submittedAt: string | null;
}
