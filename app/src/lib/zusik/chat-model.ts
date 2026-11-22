import { z } from "zod";

export const chatModelOptions = z.discriminatedUnion("model", [
  z.strictObject({ model: z.literal("bielik"), effort: z.enum(["low", "high"]).optional(), verification: z.enum(["standard", "extra"]).optional() }),
  z.strictObject({ model: z.enum(["pllum", "qwen-27b"]) }),
]);
export type ChatModelOptions = z.infer<typeof chatModelOptions>;
