import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, expect, it, vi } from "vitest";
import { withMemoryTransaction } from "../src/lib/zusik/memory/repository";
import { dispatch } from "../src/lib/zusik/v1/dispatch";

const socket = process.env.MEMORY_TEST_SOCKET;
const db = socket?.startsWith("/") ? new Pool({host:socket, port:Number(process.env.MEMORY_TEST_PORT ?? 5432),
  database:"memory_b_test", user:"zusik_runtime"}) : null;
afterAll(async () => { await db?.end(); });

it.skipIf(!db)("reads a historical model turn and rejects its model on new requests", async () => {
  if (!db) throw Error("Local test database required");
  const owner = randomUUID();
  const {file, historical} = await withMemoryTransaction(db, owner, async (repo, client) => {
    const profile = await repo.createProfile({mode:"case_import"});
    const file = await repo.createCase(profile.id);
    const historical = {id:randomUUID(), state:"completed", profileRevision:profile.revision, caseRevision:file.revision,
      input:{intent:"public_question",publicQuestion:"Kiedy złożyć wniosek?",modelOptions:{model:"qwen-27b"}},
      answer:"Syntetyczna odpowiedź historyczna",citations:[]};
    await client.query("INSERT INTO zusik.v1_turns(owner_session,profile_id,case_id,kind,id,body) VALUES($1,$2,$3,'message',$4,$5)",
      [owner,profile.id,file.id,historical.id,historical]);
    return {file,historical};
  });
  const deps = {owner,pool:db,secret:"synthetic",publicAnswer:vi.fn(async () => ({answer:"Test",citations:[]}))};
  const path = ["cases",file.id,"messages"];
  const url = "http://localhost/api/v1/"+path.join("/");
  const post = (input: unknown, key: string) => dispatch(new Request(url,{method:"POST",headers:{
    Origin:"http://localhost","Content-Type":"application/json","Idempotency-Key":key},body:JSON.stringify(input)}),path,deps);
  const key = randomUUID();
  expect((await post(historical.input,key)).status).toBe(422);
  expect(deps.publicAnswer).not.toHaveBeenCalled();
  const get = await dispatch(new Request(url+"/"+historical.id),[...path,historical.id],deps);
  expect(get.status).toBe(200);
  expect(await get.json()).toEqual(historical);
  const list = await dispatch(new Request(url),path,deps);
  expect((await list.json()).items).toEqual([historical]);
  const allowed = {...historical.input,modelOptions:{model:"pllum"}};
  const saved = await post(allowed,key);
  expect(saved.status).toBe(201);
  expect(await (await post(allowed,key)).json()).toEqual(await saved.json());
  expect(deps.publicAnswer).toHaveBeenCalledTimes(1);
});
