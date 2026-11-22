import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { afterAll, expect, it, vi } from "vitest";
import { withMemoryTransaction } from "../src/lib/zusik/memory/repository";
import { dispatch } from "../src/lib/zusik/v1/dispatch";
import { ApiProblem } from "../src/lib/zusik/v1/http";

const socket = process.env.MEMORY_TEST_SOCKET;
const db = socket?.startsWith("/") ? new Pool({host:socket, port:Number(process.env.MEMORY_TEST_PORT ?? 5432),
  database:"memory_b_test", user:"zusik_runtime"}) : null;
afterAll(async () => { await db?.end(); });

it.skipIf(!db)("returns a bounded busy response while the first Qwen message is still being written and replays one saved turn", async () => {
  if (!db) throw Error("Local test database required");
  const owner = randomUUID();
  const file = await withMemoryTransaction(db, owner, async repo => repo.createCase((await repo.createProfile({mode:"case_import"})).id));
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const publicAnswer = vi.fn(async () => {
    entered.resolve();
    await release.promise;
    return {answer:"Syntetyczna odpowiedź", citations:[]};
  });
  const deps = {owner,pool:db,secret:"synthetic",publicAnswer};
  const path = ["cases",file.id,"messages"];
  const url = "https://synthetic.test/api/v1/" + path.join("/");
  const post = (key: string) => dispatch(new Request(url,{method:"POST",headers:{
    Origin:"https://synthetic.test", "Content-Type":"application/json", "Idempotency-Key":key,
  },body:JSON.stringify({intent:"public_question",publicQuestion:"Jak złożyć wniosek?",modelOptions:{model:"qwen-27b"}})}),path,deps);
  const key = randomUUID();
  const first = post(key);
  await entered.promise;
  const duplicate = post(key);
  const other = post(randomUUID());
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => {timer=setTimeout(() => reject(Error("Duplicate blocked on PostgreSQL")),2_500);});
    for (const response of await Promise.race([Promise.all([duplicate,other]),deadline])) {
      expect(response.status).toBe(429);
      expect(response.headers.get("retry-after")).toBe("2");
      expect(await response.json()).toMatchObject({code:"public_request_busy"});
    }
    expect(publicAnswer).toHaveBeenCalledTimes(1);
  } finally {
    clearTimeout(timer);
    release.resolve();
    await Promise.allSettled([duplicate,other,first]);
  }
  const saved = await first;
  expect(saved.status).toBe(201);
  const message = await saved.json();
  const replayed = await post(key);
  expect(replayed.status).toBe(201);
  expect(await replayed.json()).toEqual(message);
  const list = await dispatch(new Request(url),path,deps);
  expect((await list.json()).items.map((item: {id:string})=>item.id)).toEqual([message.id]);
  expect(publicAnswer).toHaveBeenCalledTimes(1);

  const outageKey = randomUUID();
  publicAnswer.mockRejectedValueOnce(new ApiProblem(503,"selected_model_unavailable"));
  expect((await post(outageKey)).status).toBe(503);
  expect((await post(outageKey)).status).toBe(201);
  expect((await post(outageKey)).status).toBe(201);
  expect(publicAnswer).toHaveBeenCalledTimes(3);
}, 15_000);

it.skipIf(!db)("extends only the selected Qwen transaction and restores the connection settings after commit", async () => {
  if (!db || !socket) throw Error("Local test database required");
  const pool = new Pool({host:socket,port:Number(process.env.MEMORY_TEST_PORT ?? 5432),database:"memory_b_test",
    user:"zusik_runtime",max:1,options:"-c lock_timeout=300ms -c idle_in_transaction_session_timeout=5s"});
  const owner = randomUUID();
  try {
    const file = await withMemoryTransaction(pool,owner,async repo => repo.createCase((await repo.createProfile({mode:"case_import"})).id));
    const path = ["cases",file.id,"messages"];
    const url = "https://synthetic.test/api/v1/" + path.join("/");
    let connection: PoolClient | undefined;
    pool.on("acquire", client => { connection = client; });
    pool.on("release", () => { connection = undefined; });
    const limits = "SELECT setting::int AS ms FROM pg_settings WHERE name IN ('idle_in_transaction_session_timeout','lock_timeout') ORDER BY name";
    for (const model of ["qwen-27b","bielik","pllum"] as const) {
      let observed: number[] = [];
      const req = new Request(url,{method:"POST",headers:{Origin:"https://synthetic.test","Content-Type":"application/json","Idempotency-Key":randomUUID()},
        body:JSON.stringify({intent:"public_question",publicQuestion:"Jak złożyć wniosek?",modelOptions:{model}})});
      const response = await dispatch(req,path,{owner,pool,secret:"synthetic",publicAnswer:async () => {
        // This single-connection pool has the transaction checked out for this callback.
        if (!connection) throw Error("Missing active test transaction");
        observed = (await connection.query(limits)).rows.map(row => row.ms);
        return {answer:"Syntetyczna odpowiedź", citations:[]};
      }});
      expect(response.status).toBe(201);
      expect(observed).toEqual(model === "qwen-27b" ? [125_000,500] : [5_000,300]);
      expect((await pool.query(limits)).rows.map(row => row.ms)).toEqual([5_000,300]);
    }
  } finally { await pool.end(); }
});
