import { z } from "zod";
import { isValidIso } from "../rules/dates";

const name = z.string().trim().min(1).max(90).regex(/^[\p{L}\p{M} .’'-]+$/u);
const version = z.number().int().nonnegative();
const rate = z.number().nonnegative().max(100000).multipleOf(0.01).nullable();
const variant = z.enum(["together", "sequential"]);
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("compare"), version: version.default(0), firstStart: z.string().date().refine(isValidIso),
    days: z.number().int().min(1).max(143), firstDaily: rate, secondDaily: rate,
    firstName: name.default("Marta Lis"), secondName: name.default("Paweł Lis"), childName: name.default("Ola Lis") }),
  z.object({ type: z.literal("choose"), version, variant }),
  z.object({ type: z.literal("confirm"), version, employerHasCopy: z.boolean(), otherParentConfirmed: z.literal(true),
    attachmentName: z.string().trim().min(1).max(150).regex(/^[^\x00-\x1f/\\]+$/u).nullish(),
    previousDays: z.number().int().min(0).max(287), previousParts: z.number().int().min(0).max(5) }),
  z.object({ type: z.literal("submit"), version }),
]);
export type Command = z.infer<typeof commandSchema>;
export type Variant = z.infer<typeof variant>;
export type Period = { from: string; to: string; deadline: string; amount: number | null };
export type Plan = { first: Period; second: Period; calendarDays: number; total: number | null };
export interface MartaView {
  version: number;
  inputs: { firstStart: string; days: number; firstDaily: number | null; secondDaily: number | null };
  firstName: string; secondName: string; childName: string;
  variants: Record<Variant, Plan>; selected: Variant | null;
  employerHasCopy: boolean | null; attachmentName: string | null;
  previousDays: number | null; previousParts: number | null;
  confirmed: boolean; submitted: boolean; submittedAt: string | null;
}
