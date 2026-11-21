import { readFileSync } from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import type { Fact, FieldKey } from "@/lib/kamil/contract";
import { KAMIL_PROFILE, kamilCertificate } from "@/lib/kamil/profile";
import { ZAM_FORM } from "@/lib/kamil/sources";
import { TemplateMismatchError, fillZam, sha256Hex } from "@/lib/forms/zam-fill";
import { ZAM_CELL, ZAM_MAP, ZAM_TEMPLATE_SHA256, buildZamValues, type ZamSlot } from "@/lib/forms/zam-map";
import { evaluatePaternity } from "@/lib/rules/paternity";

const ROOT = path.resolve(__dirname, "..");
const TEMPLATE = new Uint8Array(readFileSync(path.join(ROOT, "public/forms/zam-2026-10-24.pdf")));
const FONT = new Uint8Array(readFileSync(path.join(ROOT, "public/forms/fonts/DejaVuSans.ttf")));

function kamilFacts(birthDate = "2026-05-20"): Partial<Record<FieldKey, Fact>> {
  const c = kamilCertificate(birthDate);
  const raw: Partial<Record<FieldKey, string>> = {
    ...KAMIL_PROFILE,
    child_first_name: c.childFirstName,
    child_last_name: c.childLastName,
    child_birth_date: c.birthDate,
    child_birth_place: c.birthPlace,
    child_pesel: c.childPesel,
    mother_first_name: c.motherFirstName,
    mother_last_name: c.motherLastName,
    other_title_paternity: "nie",
  };
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      { key: key as FieldKey, value: value ?? "", origin: { kind: "profile", source: "test" }, confirmedAt: "2026-11-21" },
    ]),
  );
}

function result(start = "2026-12-08", birthDate = "2026-05-20") {
  return evaluatePaternity({
    childBirthDate: birthDate,
    insuranceConfirmed: true,
    noArrears: true,
    priorParts: [],
    request: { start, days: 7 },
    today: "2026-11-21",
  });
}

interface Placed {
  page: number;
  str: string;
  x: number;
  y: number;
}

async function textOf(pdf: Uint8Array): Promise<Placed[]> {
  const doc = await getDocument({ data: pdf.slice(), isEvalSupported: false }).promise;
  const out: Placed[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (item.str.trim()) out.push({ page: p, str: item.str, x: item.transform[4], y: item.transform[5] });
    }
  }
  return out;
}

/** Text drawn inside a slot's area. */
function inSlot(placed: Placed[], slot: ZamSlot): Placed[] {
  const s = ZAM_MAP[slot];
  const width = s.type === "cells" ? s.count * ZAM_CELL : s.type === "text" ? s.w : ZAM_CELL;
  const height = s.type === "text" ? s.h : 17.4;
  return placed.filter((t) => t.page === s.page && t.x >= s.x && t.x < s.x + width && t.y >= s.y && t.y < s.y + height);
}

const joined = (items: Placed[]) =>
  [...items]
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map((t) => t.str)
    .join("");

describe("step 4 · ZAM on the official template", () => {
  it("uses the current ZAM: version 2026-10-24 and its checksum", async () => {
    expect(await sha256Hex(TEMPLATE)).toBe(ZAM_TEMPLATE_SHA256);
    expect(ZAM_FORM.sha256).toBe(ZAM_TEMPLATE_SHA256);
    expect(ZAM_FORM.version).toBe("2026-10-24");
  });

  it("maps every confirmed fact; nothing is missing for Kamil", () => {
    const { values, missing, periodReady } = buildZamValues({ facts: kamilFacts(), result: result() }, "2026-11-21");
    expect(missing).toEqual([]);
    expect(periodReady).toBe(true);
    expect(values.paternity_period).toBe("08.12.2026 – 14.12.2026");
    expect(values.paternity_part).toBe("1");
    expect(values.other_title_no).toBe("X");
    expect(values.other_title_yes).toBeUndefined();
  });

  it("the generated PDF holds father, child, payer, period, part and statement in their boxes", async () => {
    const { values } = buildZamValues({ facts: kamilFacts(), result: result() }, "2026-11-21");
    const placed = await textOf(await fillZam(TEMPLATE, FONT, values, { marginNote: "PRZYKŁAD Z DANYMI FIKCYJNYMI" }));
    // Father
    expect(joined(inSlot(placed, "father_pesel"))).toBe(KAMIL_PROFILE.father_pesel);
    expect(inSlot(placed, "father_pesel")).toHaveLength(11); // one digit per cell
    expect(joined(inSlot(placed, "father_first_name"))).toBe("KAMIL");
    expect(joined(inSlot(placed, "father_street"))).toBe("JAŚMINOWA");
    expect(joined(inSlot(placed, "father_city"))).toBe("KRAKÓW");
    // Payer
    expect(joined(inSlot(placed, "payer_nip"))).toBe(KAMIL_PROFILE.payer_nip);
    expect(joined(inSlot(placed, "payer_name"))).toBe("KAMIL WRONA PRACOWNIA STOLARSKA");
    // Period, part, insurance
    expect(joined(inSlot(placed, "paternity_check"))).toBe("X");
    expect(joined(inSlot(placed, "paternity_period"))).toBe("08.12.2026 – 14.12.2026");
    expect(joined(inSlot(placed, "paternity_part"))).toBe("1");
    expect(joined(inSlot(placed, "insurance_yes"))).toBe("X");
    expect(inSlot(placed, "insurance_no")).toHaveLength(0);
    // Child
    const child = joined(inSlot(placed, "child_data"));
    expect(child).toContain("ANTONI WRONA");
    expect(child).toContain("DATA URODZENIA: 20.05.2026");
    expect(child).toContain("MIEJSCE URODZENIA: KRAKÓW");
    expect(joined(inSlot(placed, "reason_birth"))).toBe("X");
    // Statement: not received from another title
    expect(joined(inSlot(placed, "other_title_no"))).toBe("X");
    expect(inSlot(placed, "other_title_yes")).toHaveLength(0);
    // Second parent and date
    expect(joined(inSlot(placed, "mother_first_name"))).toBe("ZOFIA");
    expect(joined(inSlot(placed, "mother_pesel"))).toBe(KAMIL_PROFILE.mother_pesel);
    expect(joined(inSlot(placed, "sign_date"))).toBe("21112026");
    // REGON row stays empty: it is only for payers without NIP.
    expect(placed.filter((t) => t.page === 1 && t.y > 160 && t.y < 185 && t.x > 238)).toHaveLength(0);
  });

  it("a changed start date changes the PDF period", async () => {
    const { values } = buildZamValues({ facts: kamilFacts(), result: result("2027-01-11") }, "2026-11-21");
    const placed = await textOf(await fillZam(TEMPLATE, FONT, values));
    expect(joined(inSlot(placed, "paternity_period"))).toBe("11.01.2027 – 17.01.2027");
  });

  it("without an eligible period the form has no period, part or tick", () => {
    const pending = evaluatePaternity({
      childBirthDate: "2026-05-20",
      insuranceConfirmed: null,
      noArrears: true,
      priorParts: [],
      request: { start: "2026-12-08", days: 7 },
      today: "2026-11-21",
    });
    const { values, periodReady } = buildZamValues({ facts: kamilFacts(), result: pending }, "2026-11-21");
    expect(periodReady).toBe(false);
    expect(values.paternity_check).toBeUndefined();
    expect(values.paternity_period).toBeUndefined();
  });

  it("a different template stops the export until the map is reviewed", async () => {
    const changed = TEMPLATE.slice();
    changed[changed.length - 10] ^= 0xff;
    await expect(fillZam(changed, FONT, {})).rejects.toBeInstanceOf(TemplateMismatchError);
  });
});
