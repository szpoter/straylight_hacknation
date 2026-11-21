import { MemorySaver } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import type { Candidate, Command, KamilView } from "@/lib/kamil/contract";
import { parseMessage } from "@/lib/kamil/interpret";
import { kamilCertificate } from "@/lib/kamil/profile";
import { KamilService, PROTECTED_REPLY, keepsNumbers, type KamilModel } from "@/lib/kamil/service";
import { buildZamValues } from "@/lib/forms/zam-map";
import { MemoryCaseStore } from "./helpers";

const CLOCK = () => ({ now: "2026-11-21T10:00:00.000Z", today: "2026-11-21" });
let n = 0;
const op = () => `op-test-${++n}-xxxxxxxx`;

function setup(model: KamilModel | null = null) {
  const store = new MemoryCaseStore();
  const checkpointer = new MemorySaver();
  const make = () => new KamilService({ store, checkpointer, model, clock: CLOCK });
  return { store, checkpointer, service: make(), make };
}

function docCandidates(birthDate = "2026-05-20"): Candidate[] {
  const c = kamilCertificate(birthDate);
  const values: [Candidate["key"], string][] = [
    ["child_last_name", c.childLastName],
    ["child_first_name", c.childFirstName],
    ["child_birth_date", c.birthDate],
    ["child_birth_place", c.birthPlace],
    ["child_pesel", c.childPesel],
    ["mother_first_name", c.motherFirstName],
    ["mother_last_name", c.motherLastName],
  ];
  return values.map(([key, value], i) => ({
    key,
    value,
    origin: {
      kind: "document",
      method: "ocr",
      fileName: "odpis-aktu-urodzenia-skan.jpg",
      page: 1,
      box: { x: 0.47, y: 0.2 + i * 0.04, w: 0.2, h: 0.02 },
      read: value,
      confidence: 93,
    },
    needsReview: false,
    reason: null,
  }));
}

async function run(service: KamilService, session: string, command: Command) {
  const view = await service.getView(session);
  return service.apply(session, view.version, command);
}

async function say(service: KamilService, session: string, text: string) {
  const r = await run(service, session, { type: "chat", opKey: op(), text });
  expect(r.status).toBe(200);
  return r.view;
}

async function confirmAll(service: KamilService, session: string, view: KamilView) {
  let v = view;
  for (const c of view.candidates) {
    const r = await service.apply(session, v.version, { type: "confirm", opKey: op(), key: c.key, value: c.value, origin: c.origin });
    expect(r.status).toBe(200);
    v = r.view;
  }
  return v;
}

/** Kamil's whole conversation up to a ready draft. */
async function kamilReady(service: KamilService, session: string) {
  await run(service, session, { type: "load_profile", opKey: op() });
  await say(service, session, "Prowadzę firmę. Chcę przez tydzień zająć się synem. Czy przysługuje mi wypłata?");
  let v = (await run(service, session, { type: "set_candidates", opKey: op(), candidates: docCandidates() })).view;
  v = await confirmAll(service, session, v);
  v = await say(service, session, "Od 8 grudnia. Jeden tydzień, drugi zostawię na później");
  v = await say(service, session, "Nie");
  return v;
}

describe("parser", () => {
  it("reads Kamil's sentences", () => {
    const a = parseMessage("Od 8 grudnia. Jeden tydzień, drugi zostawię na później", "2026-11-21", null);
    expect(a.startDate).toBe("2026-12-08");
    expect(a.days).toBe(7);
    expect(parseMessage("Przypomnij mi 4 grudnia", "2026-11-21", null).reminderDate).toBe("2026-12-04");
    expect(parseMessage("Syn urodził się 21 maja", "2026-11-21", null).birthDate).toBe("2026-05-21");
    expect(parseMessage("Nie", "2026-11-21", "other_title_paternity").yesNo).toBe("nie");
    expect(parseMessage("Wykorzystałem już tydzień od 6 lipca", "2026-11-21", null).priorPart).toEqual({
      start: "2026-07-06",
      end: "2026-07-12",
    });
  });
});

describe("step 2–4 · Kamil's case on the session", () => {
  it("full conversation: eligibility, period 8–14.12, deadline 7.12, statement NIE, ready for ZAM", async () => {
    const { service } = setup();
    const v = await kamilReady(service, "s1");
    expect(v.result.status).toBe("eligible");
    expect(v.result.period).toEqual({ start: "2026-12-08", end: "2026-12-14", days: 7 });
    expect(v.result.deadline).toBe("2026-12-07");
    expect(v.facts.other_title_paternity?.value).toBe("nie");
    expect(v.readyForDraft).toBe(true);
    const texts = v.chat
      .filter((t) => t.role === "zusik")
      .map((t) => t.text)
      .join("\n");
    expect(texts).toContain("Wpisuję 8–14 grudnia 2026 r. To pierwsza część. Złóż wniosek do 7 grudnia");
    expect(texts).toContain("Czy pobierałeś już z innego tytułu");
    expect(texts).toContain("Gotowe do sprawdzenia");
    expect(v.citations.map((c) => c.id)).toContain("zus-termin-niepracownik");
  });

  it("missing insurance confirmation → Zusik asks before deciding", async () => {
    const { service } = setup();
    // Document confirmed, profile not loaded: insurance is unknown.
    await run(service, "s1", { type: "set_candidates", opKey: op(), candidates: docCandidates() });
    await confirmAll(service, "s1", await service.getView("s1"));
    const v = await say(service, "s1", "Prowadzę firmę. Czy przysługuje mi wypłata za tydzień z synem?");
    expect(v.result.status).toBe("needs_info");
    expect(v.result.missing[0]).toBe("insurance_confirmed");
    expect(v.chat.at(-1)?.text).toMatch(/pytanie o ubezpieczenie.*dobrowolne ubezpieczenie chorobowe/);
    const answered = await say(service, "s1", "Tak");
    expect(answered.facts.insurance_confirmed?.value).toBe("tak");
    expect(answered.facts.insurance_confirmed?.origin.kind).toBe("chat");
  });

  it("a corrected value keeps its origin and survives a reload (F5 = new service instance)", async () => {
    const { service, make } = setup();
    await run(service, "s1", { type: "set_candidates", opKey: op(), candidates: docCandidates() });
    const before = await service.getView("s1");
    const place = before.candidates.find((c) => c.key === "child_birth_place");
    if (!place) throw new Error("no candidate");
    const r = await service.apply("s1", before.version, {
      type: "confirm",
      opKey: op(),
      key: "child_birth_place",
      value: "KRAKÓW-PODGÓRZE",
      origin: place.origin,
    });
    expect(r.status).toBe(200);
    const reloaded = await make().getView("s1");
    expect(reloaded.facts.child_birth_place?.value).toBe("KRAKÓW-PODGÓRZE");
    expect(reloaded.facts.child_birth_place?.origin).toMatchObject({ kind: "user_edit", previous: "KRAKÓW", page: 1 });
    const date = reloaded.candidates.find((c) => c.key === "child_birth_date");
    expect(date?.origin.kind === "document" && date.origin.page).toBe(1);
  });

  it("a second session cannot see the first one's document or facts", async () => {
    const { service } = setup();
    await kamilReady(service, "s1");
    const other = await service.getView("s2");
    expect(other.version).toBe(0);
    expect(other.candidates).toEqual([]);
    expect(other.facts).toEqual({});
  });

  it("chat date different from the scan → both shown, Kamil picks, origin saved", async () => {
    const { service } = setup();
    await run(service, "s1", { type: "set_candidates", opKey: op(), candidates: docCandidates() });
    const v = await say(service, "s1", "Syn urodził się 21 maja");
    expect(v.conflict).toMatchObject({ key: "child_birth_date", documentValue: "2026-05-20", chatValue: "2026-05-21" });
    expect(v.chat.at(-1)?.text).toMatch(/20 maja 2026.*21 maja 2026.*Której daty użyć/);
    const r = await service.apply("s1", v.version, { type: "resolve_conflict", opKey: op(), key: "child_birth_date", pick: "document" });
    expect(r.view.conflict).toBeNull();
    expect(r.view.facts.child_birth_date?.value).toBe("2026-05-20");
    expect(r.view.facts.child_birth_date?.origin.kind).toBe("document");
  });

  it("the same click twice (same key or a new key) creates one draft", async () => {
    const { service } = setup();
    const v = await kamilReady(service, "s1");
    const key = op();
    const a = await service.apply("s1", v.version, { type: "create_draft", opKey: key });
    const b = await service.apply("s1", v.version, { type: "create_draft", opKey: key });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(b.view.draft?.id).toBe(a.view.draft?.id);
    const c = await service.apply("s1", b.view.version, { type: "create_draft", opKey: op() });
    expect(c.view.draft?.id).toBe(a.view.draft?.id);
    expect(c.view.draft?.version).toBe(1);
  });

  it("a stale tab gets 409 with the current case", async () => {
    const { service } = setup();
    await run(service, "s1", { type: "load_profile", opKey: op() });
    const r = await service.apply("s1", 0, { type: "create_draft", opKey: op() });
    expect(r.status).toBe(409);
    expect(r.view.version).toBe(1);
  });

  it("changing the date in the case changes chat, deadline and ZAM together; draft needs review", async () => {
    const { service } = setup();
    const v = await kamilReady(service, "s1");
    const drafted = (await service.apply("s1", v.version, { type: "create_draft", opKey: op() })).view;
    const changed = await say(service, "s1", "Jednak od 11 stycznia");
    expect(changed.result.period).toMatchObject({ start: "2027-01-11", end: "2027-01-17" });
    expect(changed.result.deadline).toBe("2027-01-10");
    expect(changed.chat.at(-1)?.text).toContain("11–17 stycznia 2027 r.");
    expect(changed.chat.at(-1)?.text).toContain("10 stycznia");
    expect(changed.draft?.id).toBe(drafted.draft?.id);
    expect(changed.draft?.stale).toBe(true);
    expect(buildZamValues(changed, changed.today).values.paternity_period).toBe("11.01.2027 – 17.01.2027");
    const sent = await service.apply("s1", changed.version, { type: "simulate_submit", opKey: op() });
    expect(sent.status).toBe(422); // the changed draft must be reviewed first
  });

  it("reminder is separate from the deadline; simulated submit is labelled and idempotent", async () => {
    const { service } = setup();
    await kamilReady(service, "s1");
    const r = await say(service, "s1", "Przypomnij mi 4 grudnia");
    expect(r.reminder?.date).toBe("2026-12-04");
    expect(r.result.deadline).toBe("2026-12-07");
    expect(r.chat.at(-1)?.text).toMatch(/piątek, 4 grudnia 2026.*poniedziałek, 7 grudnia 2026/);
    const late = await service.apply("s1", r.version, { type: "set_reminder", opKey: op(), date: "2026-12-09" });
    expect(late.status).toBe(422);
    const drafted = (await service.apply("s1", r.version, { type: "create_draft", opKey: op() })).view;
    const key = op();
    const s1 = await service.apply("s1", drafted.version, { type: "simulate_submit", opKey: key });
    const s2 = await service.apply("s1", drafted.version, { type: "simulate_submit", opKey: key });
    expect(s1.view.submission?.simulated).toBe(true);
    expect(s2.view.chat.filter((t) => t.text.startsWith("Symulacja")).length).toBe(1);
  });

  it("an earlier part changes what is available", async () => {
    const { service } = setup();
    await run(service, "s1", { type: "load_profile", opKey: op() });
    await run(service, "s1", { type: "set_candidates", opKey: op(), candidates: docCandidates() });
    await confirmAll(service, "s1", await service.getView("s1"));
    await say(service, "s1", "Wykorzystałem już tydzień od 6 lipca");
    const v = await say(service, "s1", "Od 8 grudnia na dwa tygodnie");
    expect(v.result.status).toBe("needs_info");
    expect(v.chat.at(-1)?.text).toMatch(/Zostało Ci 7 dni/);
  });

  it("the model may rephrase, but a changed number falls back to the template", async () => {
    const liar: KamilModel = { extract: async () => null, rephrase: async () => "Wpisuję 9–15 grudnia. Wniosek do 8 grudnia." };
    const { service } = setup(liar);
    const v = await kamilReady(service, "s1");
    expect(v.chat.filter((t) => t.role === "zusik").every((t) => t.author === "template")).toBe(true);
    expect(keepsNumbers("do 7 grudnia 2026", "najpóźniej 7 grudnia 2026")).toBe(true);
    expect(keepsNumbers("do 7 grudnia 2026", "do 8 grudnia 2026")).toBe(false);
  });

  it("verdict and deadline replies are never reworded; a plain question may be", async () => {
    const polite: KamilModel = { extract: async () => null, rephrase: async (t) => `Proszę powiedzieć: ${t}` };
    const { service } = setup(polite);
    const v = await kamilReady(service, "s1");
    const zusik = v.chat.filter((t) => t.role === "zusik");
    const verdicts = zusik.filter((t) => PROTECTED_REPLY.test(t.text.replace(/^Proszę powiedzieć: /, "")));
    expect(verdicts.length).toBeGreaterThan(0);
    expect(verdicts.every((t) => t.author === "template")).toBe(true);
    expect(zusik.some((t) => t.author === "model")).toBe(true);
  });

  it("eligibility question without data does not promise an insurance question it does not ask", async () => {
    const { service } = setup();
    await run(service, "s1", { type: "load_profile", opKey: op() });
    const v = await say(service, "s1", "Prowadzę firmę. Czy przysługuje mi wypłata?");
    expect(v.chat.at(-1)?.text).not.toMatch(/pytanie o ubezpieczenie/);
    expect(v.chat.at(-1)?.text).toMatch(/odpis aktu urodzenia/);
  });
});
