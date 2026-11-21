import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { generateText } from "ai";
import { Pool } from "pg";
import { CHECKPOINT_SCHEMA, SHERLOCK_TIMEOUT_MS, requireEnv } from "../zusik/config";
import { MemorySaver } from "@langchain/langgraph";
import { PgCaseStore, newThreadId, type CaseStore, type DemoCase } from "../zusik/case-store";
import { MODEL_FACTS_INSTRUCTION, parseModelFacts } from "./interpret";
import { KamilService, type KamilModel } from "./service";

/**
 * Runtime wiring for /api/kamil. Same Neon database, schema and demo_cases table as Marta's flow;
 * a separate small pool so this module does not depend on lib/zusik/server.ts internals.
 */
let pool: Pool | null = null;
let checkpointer: PostgresSaver | null = null;

function runtime() {
  if (!pool || !checkpointer) {
    pool = new Pool({ connectionString: requireEnv("DATABASE_URL"), max: 2, connectionTimeoutMillis: 5_000 });
    checkpointer = new PostgresSaver(pool, undefined, { schema: CHECKPOINT_SCHEMA });
  }
  return { pool, checkpointer };
}

/** Bielik via Sherlock when configured; without it the case works on rules and templates. */
function sherlockModel(): KamilModel | null {
  const baseURL = process.env.SHERLOCK_BASE_URL?.trim();
  const apiKey = process.env.SHERLOCK_API_KEY?.trim();
  const id = process.env.SHERLOCK_MODEL?.trim();
  if (!baseURL || !apiKey || !id) return null;
  const model = createOpenAICompatible({ name: "sherlock", baseURL, apiKey })(id);
  const call = async (system: string, prompt: string) => {
    const { text } = await generateText({
      model,
      system,
      prompt,
      temperature: 0.1,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(SHERLOCK_TIMEOUT_MS),
    });
    return text;
  };
  return {
    async extract(text, today) {
      // Only the parent's sentence and today's date go to the provider, never document content.
      const raw = await call(MODEL_FACTS_INSTRUCTION, `Dzisiaj jest ${today}.\nWiadomość: """${text}"""`);
      return parseModelFacts(raw);
    },
    async rephrase(text) {
      const raw = await call(
        "Jesteś Zusikiem, uprzejmym asystentem ZUS. Przeredaguj odpowiedź po polsku, krótko i naturalnie, w drugiej osobie. " +
          "Nie zmieniaj, nie dodawaj i nie usuwaj żadnej liczby ani daty. Zwróć tylko tekst odpowiedzi.",
        text,
      );
      return raw.trim().replace(/^["„]|["”]$/g, "") || null;
    },
  };
}

/**
 * Local development without Neon: KAMIL_MEMORY_STORE=1 keeps cases in this process only.
 * Ignored in production builds, so a deployment can never silently lose cases.
 */
class DevMemoryStore implements CaseStore {
  private cases = new Map<string, DemoCase>();
  async findBySession(sessionId: string) {
    return this.cases.get(sessionId) ?? null;
  }
  async findOrCreate(sessionId: string) {
    const found = this.cases.get(sessionId);
    if (found) return found;
    const created = { threadId: newThreadId(), ownerSession: sessionId, createdAt: new Date(), leaseActive: false };
    this.cases.set(sessionId, created);
    return created;
  }
  async acquireLease() {
    return true;
  }
  async releaseLease() {}
}
let devService: KamilService | null = null;

export function kamilService(): KamilService {
  if (process.env.KAMIL_MEMORY_STORE === "1" && process.env.NODE_ENV !== "production") {
    devService ??= new KamilService({ store: new DevMemoryStore(), checkpointer: new MemorySaver(), model: sherlockModel() });
    return devService;
  }
  const { pool: db, checkpointer: saver } = runtime();
  return new KamilService({ store: new PgCaseStore(db), checkpointer: saver, model: sherlockModel() });
}
