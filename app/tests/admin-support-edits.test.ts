import { describe, expect, it } from "vitest";
import {
  EMPTY_SUPPORT_EDITS,
  activeOrganizations,
  organizationProblems,
  revertOrganization,
  saveOrganization,
  setWithdrawn,
  supportRows,
  type OrganizationForm,
} from "@/lib/admin/support-edits";
import { decodeSupportEdits, encodeSupportEdits } from "@/lib/admin/support-store";
import { SUPPORT_ORGANIZATIONS } from "@/lib/support/organizations";

const TODAY = "2026-11-22";
const meta = (expectedRevision: number) => ({ expectedRevision, today: TODAY, now: `${TODAY}T10:00:00.000Z`, author: "admin" });
const base = SUPPORT_ORGANIZATIONS;
const first = base[0];

const NEW: OrganizationForm = {
  id: null,
  name: "Stowarzyszenie Przykładowe Rodzice",
  legalForm: "stowarzyszenie",
  krs: "0000 123 456",
  helps: "Grupy wsparcia dla rodziców po stracie dziecka (dane fikcyjne do testu).",
  situations: ["zaloba", "strata-dziecka"],
  freeOfCharge: "",
  phone: "",
  email: "kontakt@example.org",
  url: "https://example.org/",
  area: "",
  verifiedAt: TODAY,
};

const formOf = (patch: Partial<OrganizationForm>): OrganizationForm => ({
  id: first.id,
  name: first.name,
  legalForm: first.legalForm,
  krs: first.krs,
  helps: first.helps,
  situations: first.situations,
  freeOfCharge: first.freeOfCharge ?? "",
  phone: first.phone ?? "",
  email: first.email ?? "",
  url: first.url,
  area: first.area ?? "",
  verifiedAt: TODAY,
  ...patch,
});

describe("support organisation changes in a demo session", () => {
  it("validates the form", () => {
    expect(organizationProblems(NEW, TODAY)).toEqual([]);
    const bad = organizationProblems(
      { ...NEW, legalForm: "spółka", krs: "123", url: "http://example.org", situations: [], verifiedAt: "2026-12-01" },
      TODAY,
    );
    expect(bad).toHaveLength(5);
  });

  it("adds an organisation with a generated id, withdraws it and removes it", () => {
    const added = saveOrganization(base, EMPTY_SUPPORT_EDITS, NEW, meta(0));
    if (!added.ok) throw new Error(added.error);
    expect(added.id).toBe("stowarzyszenie-przykladowe-rodzice");
    const rows = supportRows(base, added.state);
    expect(rows.at(-1)).toMatchObject({ session: "dodana", krs: "0000123456", phone: null, withdrawn: false });

    const withdrawn = setWithdrawn(base, added.state, added.id, true, meta(1));
    if (!withdrawn.ok) throw new Error(withdrawn.error);
    expect(activeOrganizations(base, withdrawn.state).some((o) => o.id === added.id)).toBe(false);
    expect(supportRows(base, withdrawn.state).at(-1)).toMatchObject({ session: "dodana", withdrawn: true });

    const reverted = revertOrganization(withdrawn.state, added.id, 2);
    if (!reverted.ok) throw new Error(reverted.error);
    expect(supportRows(base, reverted.state)).toHaveLength(base.length);
  });

  it("edits a listed organisation and keeps its id; a stale revision is refused", () => {
    const edited = saveOrganization(base, EMPTY_SUPPORT_EDITS, formOf({ phone: "22 000 00 00" }), meta(0));
    if (!edited.ok) throw new Error(edited.error);
    expect(supportRows(base, edited.state)[0]).toMatchObject({ id: first.id, phone: "22 000 00 00", session: "zmieniona" });
    expect(activeOrganizations(base, edited.state)[0]).not.toHaveProperty("session");
    expect(saveOrganization(base, edited.state, formOf({}), meta(0)).ok).toBe(false);
  });

  it("round-trips through the signed cookie and rejects a tampered value", () => {
    const added = saveOrganization(base, EMPTY_SUPPORT_EDITS, NEW, meta(0));
    if (!added.ok) throw new Error(added.error);
    const raw = encodeSupportEdits(added.state, "secret");
    expect(decodeSupportEdits(raw, "secret")).toEqual(added.state);
    expect(decodeSupportEdits(raw, "other")).toEqual(EMPTY_SUPPORT_EDITS);
    expect(decodeSupportEdits(`x${raw}`, "secret")).toEqual(EMPTY_SUPPORT_EDITS);
  });
});
