/** Run in app with Node 24, --env-file=.env.local --import tsx. */
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { TLSSocket } from "node:tls";
import { Client } from "pg";
import { build } from "esbuild";
import { ASK_MAX_OUTPUT_TOKENS, SYSTEM_PROMPT } from "../src/lib/rag/answer";

const folder = join(homedir(), "Library/Application Support/ZusikModel");
const config = join(folder, "worker.json");
const role = "zusik_model_worker";
function neonUrl(raw: string) {
  const url = new URL(raw);
  if (!url.hostname.endsWith(".neon.tech") || !["postgres:", "postgresql:"].includes(url.protocol)) throw Error("Expected Neon");
  url.searchParams.set("sslmode", "verify-full");
  return url;
}
async function main() {
  process.umask(0o077);
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  const owner = neonUrl(process.env.MIGRATION_DATABASE_URL ?? "");
  const worker = new URL(owner);
  worker.username = role;
  worker.password = randomBytes(32).toString("hex");
  if (existsSync(config)) {
    const saved = neonUrl(JSON.parse(readFileSync(config, "utf8")).url);
    if (saved.username !== role || saved.host !== worker.host || saved.pathname !== worker.pathname) throw Error("Configuration mismatch");
    worker.password = saved.password;
  }
  await build({ entryPoints: ["workers/ollama.mjs"], bundle: true, platform: "node", format: "cjs",
    external: ["pg-native", "cloudflare:sockets"], outfile: join(folder, "worker.next.cjs") });
  const client = new Client({ connectionString: owner.href, connectionTimeoutMillis: 6000 });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("select pg_advisory_xact_lock(hashtext('zusik_model_install'))");
    const roles = await client.query("select 1 from pg_roles where rolname=$1", [role]);
    if (roles.rowCount && !existsSync(config)) throw Error("Existing worker role requires its saved credentials");
    if (!roles.rowCount) {
      if (!/^[a-f0-9]{64}$/.test(worker.password)) throw Error("Invalid stored worker credential");
      await client.query("CREATE ROLE zusik_model_worker LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD '" + worker.password + "'");
    }
    await client.query(readFileSync("workers/queue.sql", "utf8"));
    const { rows: [rights] } = await client.query(`
      select exists(select from pg_class c join pg_namespace n on c.relnamespace=n.oid
        where n.nspname in ('zusik','zusik_model') and c.relkind in ('r','p') and
        (has_table_privilege($1,c.oid,'SELECT,INSERT,UPDATE,DELETE') or has_any_column_privilege($1,c.oid,'SELECT,INSERT,UPDATE'))) as reads_cases,
        has_function_privilege($1,'zusik_model.submit(uuid,text,text)','EXECUTE') as can_submit,
        has_function_privilege('zusik_runtime','zusik_model.claim()','EXECUTE') as can_claim`, [role]);
    if (rights.reads_cases || rights.can_submit || rights.can_claim) throw Error("Excess queue privileges");
    writeFileSync(config + ".next", JSON.stringify({ url: worker.href, system: SYSTEM_PROMPT, tokens: ASK_MAX_OUTPUT_TOKENS }), { mode: 0o600 });
    renameSync(config + ".next", config);
    await client.query("COMMIT");
  } finally { await client.end(); }
  const probe = new Client({ connectionString: worker.href, connectionTimeoutMillis: 6000 });
  try {
    await probe.connect();
    const socket = probe.connection.stream;
    if (!(socket instanceof TLSSocket) || !socket.authorized) throw Error("Unverified Neon TLS socket");
  } finally { await probe.end(); }
  renameSync(join(folder, "worker.next.cjs"), join(folder, "worker.cjs"));
  console.log("Queue installed. Worker login, TLS and restricted grants verified.");
}
main().catch((e: Error & {code?: string}) => {
  console.error("queue_install_failed", e.code, e.message.replace(/[a-f0-9]{64}/gi, "[redacted]").replace(/(?:[a-z]+:\/\/|SCRAM-SHA-256\$)\S+/gi, "[redacted]"));
  process.exitCode = 1;
});
