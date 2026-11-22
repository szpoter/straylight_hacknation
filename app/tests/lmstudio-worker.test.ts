import { expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { localCompletion } from "../src/lib/rag/local-queue";
import { localModelIds } from "../src/lib/rag/model-tasks";

it("refuses retired worker jobs before connecting to the queue", async () => {
  const connect = vi.fn();
  expect(Object.keys(localModelIds).sort()).toEqual(["bielik","pllum"]);
  // The runtime can still receive an identifier from an older JavaScript client.
  await expect(localCompletion({connect} as unknown as Pool, "qwen-27b" as keyof typeof localModelIds, "synthetic"))
    .rejects.toThrow("Unsupported queue model");
  expect(connect).not.toHaveBeenCalled();
});
