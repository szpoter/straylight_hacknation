import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { factValueKinds } from "../src/lib/zusik/memory/contract";

// Exercise the published field dictionary alongside the runtime validator.
it("publishes every accepted evidence field under its wire value kind", () => {
  const spec = readFileSync("../plans/zusik-sprawy/api-v1.openapi.yaml","utf8");
  const fields = spec.split("    FactField:\n")[1].split("    Value:\n")[0].match(/^      - \w+$/gm)?.map(s=>s.trim().slice(2)) ?? [];
  expect(fields.sort()).toEqual(Object.keys(factValueKinds).sort());
  const rules = spec.split("    FactInput:\n")[1].split("    FactVersion:\n")[0].split("      - if:").slice(1);
  for (const [field,kind] of Object.entries(factValueKinds)) {
    const rule = rules.find(r=>new RegExp("\\b"+field+"\\b").test(r));
    expect(rule,field).toMatch(new RegExp("const: "+kind+"\\b"));
  }
});
