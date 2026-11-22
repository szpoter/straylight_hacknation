// Independent black-box checks on a disposable, loopback-only database.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const origin = new URL(process.argv[2]);
assert.ok(origin.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname));
const spec = readFileSync(new URL("../../plans/zusik-sprawy/api-v1.openapi.yaml", import.meta.url), "utf8");
const ops = new Map();
let path, method;
for (const line of spec.split("\n")) {
  const route = /^  "(\/[^"]+)":$/.exec(line);
  const verb = /^    (get|post|patch|delete):$/.exec(line);
  const id = /^      operationId: (\w+)$/.exec(line);
  if (route) path = route[1];
  if (verb) method = verb[1].toUpperCase();
  if (id) ops.set(id[1], { path, method });
}
assert.equal(ops.size, 20);
const owner = {}, other = {}, ids = {};
const passed = new Set();
let current;
async function call(op, { actor = owner, body, tag, key, query = "", status, extra = {} } = {}) {
  current = op;
  const { path, method } = ops.get(op);
  const resource = path.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(ids[k] || "qa-missing"));
  const headers = { Origin: origin.origin, ...extra };
  if (actor.cookie) headers.Cookie = actor.cookie;
  if (body) headers["Content-Type"] = "application/json";
  if (tag) headers["If-Match"] = tag;
  if (key || ["POST", "PATCH"].includes(method) && op !== "openSession") headers["Idempotency-Key"] = key || randomUUID();
  const r = await fetch(new URL("/api/v1" + resource + query, origin), {
    method, headers, body: body && JSON.stringify(body), redirect: "error", signal: AbortSignal.timeout(30000),
  });
  if (!status) return r.status;
  assert.ok([].concat(status).includes(r.status), op + " HTTP " + r.status);
  if (r.status >= 400) return;
  const cookie = r.headers.getSetCookie()[0];
  if (cookie) {
    assert.match(cookie, /httponly/i);
    actor.cookie = cookie.split(";")[0];
  }
  return { data: r.status === 204 ? null : await r.json(), tag: r.headers.get("etag") };
}
function check(op, ok) {
  current = op;
  assert.ok(ok, op);
  passed.add(op);
}
const list = async (op, id, query = "") => {
  const items = (await call(op, { status: 200, query })).data.items;
  check(op, Array.isArray(items) && (id === undefined || items.some(r => r.id === id)));
  return items;
};
async function scenario() {
  const opened = await call("openSession", { status: 200 });
  check("openSession", opened.data.state === "created" && owner.cookie &&
    (await call("openSession", { status: 200 })).data.state === "existing");
  await call("openSession", { actor: other, status: 200 });
  assert.ok(other.cookie && other.cookie !== owner.cookie);

  const createKey = randomUUID(), body = { mode: "case_import" };
  const p = await call("createProfile", { body, status: 201, key: createKey });
  ids.profileId = p.data.id;
  check("createProfile", ids.profileId && p.data.mode === body.mode &&
    (await call("createProfile", { body, status: [200, 201], key: createKey })).data.id === ids.profileId);
  assert.equal((await list("listProfiles", ids.profileId)).length, 1);
  const profile = await call("getProfile", { status: 200 });
  check("getProfile", profile.data.id === ids.profileId && /^".+"$/.test(profile.tag));
  await call("getProfile", { actor: other, status: 404 });
  await call("getProfile", { actor: {}, status: 401 });
  const c = await call("createCase", { body: { profileId: ids.profileId }, status: 201 });
  ids.caseId = c.data.id;
  check("createCase", ids.caseId && c.data.profileId === ids.profileId);
  await list("listCases", ids.caseId);
  check("getCase", (await call("getCase", { status: 200 })).data.id === ids.caseId);
  const metadata = { clientDocumentId: randomUUID(), kind: "payroll", pages: 2 };
  const d = await call("addDocument", { body: metadata, status: 201 });
  ids.documentId = d.data.id;
  check("addDocument", ids.documentId && d.data.metadata.pages === 2);
  await list("listDocuments", ids.documentId);
  assert.deepEqual((await call("getDocument", { status: 200 })).data.metadata, metadata);
  check("getDocument", true);

  const asOf = "2026-02-15", subjectId = "qa-parent";
  const fact = { subjectId, field: "monthlyGrossPay", value: { kind: "money", currency: "PLN", grosze: 600000 },
    titleRef: "qa-job", payerRef: "qa-payer", validFrom: "2026-02-01", validTo: "2026-02-28",
    source: { kind: "declaration", referenceId: "qa-statement" } };
  const changes = [{ action: "add_subject", subjectId, role: "parent" }, { action: "add_fact", fact }];
  await call("changeProfile", { body: { changes }, status: 428 });
  const fresh = await call("getProfile", { status: 200 });
  const patch = await call("changeProfile", { body: { changes }, tag: fresh.tag, status: 200 });
  check("changeProfile", patch.data.revision === fresh.data.revision + 1);
  await call("changeProfile", { body: { changes }, tag: fresh.tag, status: 412 });
  const query = "?validAt=" + asOf + "&subjectId=" + subjectId;
  const facts = () => list("listFacts", undefined, query);
  const declared = (await facts())[0];
  assert.equal(declared.fact.value.grosze, 600000);
  const corrected = { ...fact, value: { ...fact.value, grosze: 650000 },
    source: { kind: "document", referenceId: ids.documentId, page: 2 } };
  await call("changeProfile", { tag: patch.tag, status: 200, body: { changes: [
    { action: "correct_fact", previousFactId: declared.factId, fact: corrected },
  ] } });
  assert.deepEqual((await facts()).map(item => item.fact.value.grosze), [650000]);
  assert.equal((await list("listFacts", undefined, query + "&knownAt=" + encodeURIComponent(declared.recordedAt)))[0].fact.value.grosze, 600000);
  await list("listProposals");
  const snapshot = await call("getProfile", { status: 200 });
  const message = { intent: "hypothetical", variant: [{ ...fact, value: { ...fact.value, grosze: 810000 } }] };
  const key = randomUUID();
  const m = await call("createMessage", { status: [201, 202], body: message, key });
  ids.messageId = m.data.id;
  const retry = await call("createMessage", { status: [200, 201, 202], body: message, key });
  check("createMessage", ids.messageId && ids.messageId === retry.data.id);
  assert.equal((await list("listMessages", ids.messageId)).length, 1);
  let stored = (await call("getMessage", { status: 200 })).data;
  for (let n = 0; n < 30 && stored.state === "processing"; n++) {
    await new Promise(done => setTimeout(done, 1000));
    stored = (await call("getMessage", { status: 200 })).data;
  }
  check("getMessage", stored.state === "completed" && stored.input.intent === "hypothetical");
  assert.equal((await call("getProfile", { status: 200 })).data.revision, snapshot.data.revision);
  assert.deepEqual((await facts()).map(item => item.fact.value.grosze), [650000]);
  const input = { subjectId, asOf, benefit: "maternity", profileRevision: snapshot.data.revision,
    caseRevision: (await call("getCase", { status: 200 })).data.revision };
  const assessment = (await call("assess", { status: 201, body: input })).data;
  ids.assessmentId = assessment.id;
  check("assess", ids.assessmentId && assessment.decisions.length > 0 && assessment.decisions.every(row =>
    row.subjectId === subjectId && row.status === "needs_information" && row.needed?.length &&
    row.amountStatus === "needs_information" && row.grossAmountGrosze === undefined));
  assert.deepEqual((await call("getAssessment", { status: 200 })).data.decisions, assessment.decisions);
  check("getAssessment", true);
  for (const op of ["getCase", "getDocument", "getMessage", "getAssessment"])
    await call(op, { actor: other, status: 404 });
  await call("eraseCase", { tag: (await call("getCase", { status: 200 })).tag, status: 204 });
  await call("getCase", { status: 404 });
  check("eraseCase", true);
  await call("eraseProfile", { tag: (await call("getProfile", { status: 200 })).tag, status: 204 });
  await call("getProfile", { status: 404 });
  check("eraseProfile", true);
  assert.equal(passed.size, ops.size);
}

if (process.argv[3] === "--baseline") {
  const statuses = {};
  for (const op of ops.keys()) {
    const status = await call(op);
    statuses[status] = (statuses[status] || 0) + 1;
  }
  console.log(JSON.stringify({ probes: ops.size, statuses, semanticChecks: 0 }));
} else {
  try {
    await scenario();
  } catch (error) {
    console.log(JSON.stringify({ firstFailure: current, reason: error.code || error.name,
      http: /HTTP (\d+)/.exec(error.message)?.[1] }));
    process.exitCode = 1;
  }
  console.log(JSON.stringify({ passed: [...passed], count: passed.size, total: ops.size }));
}
