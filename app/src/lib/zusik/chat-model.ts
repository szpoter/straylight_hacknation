import { z } from "zod";

export const chatModelOptions = z.discriminatedUnion("model", [
  z.strictObject({ model: z.literal("bielik"), effort: z.enum(["low", "high"]).optional(), verification: z.enum(["standard", "extra"]).optional() }),
  z.strictObject({ model: z.enum(["pllum", "qwen-27b"]) }),
]);
export type ChatModelOptions = z.infer<typeof chatModelOptions>;

/** Includes retrieval before the 100-second local queue budget and time to save the turn. */
export function publicTurnBudgetMs(model: ChatModelOptions["model"] | undefined, defaultMs: number) {
  return model === "qwen-27b" ? 110_000 : defaultMs;
}
