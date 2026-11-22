import { afterEach, expect, it, vi } from "vitest";
import { ApiError, caseApi, loadCase } from "@/features/chat/case-api";

afterEach(() => vi.unstubAllGlobals());
it("creates an isolated profile and case, and reuses the same request identity on retry", async () => {
  const fetch = vi.fn(async (url: string) => Response.json(url.endsWith("profiles") ? { id: "p" } : { id: "c", profileId: "p" }));
  vi.stubGlobal("fetch", fetch);
  await caseApi.create("attempt-one");
  await caseApi.create("attempt-one");
  const calls = fetch.mock.calls as unknown as [string, RequestInit][];
  expect(calls.map(([url]) => url)).toEqual(["/api/v1/profiles", "/api/v1/cases", "/api/v1/profiles", "/api/v1/cases"]);
  expect(calls.map(([, init]) => JSON.parse(String(init.body)))).toEqual([{mode:"case_import"}, {profileId:"p"}, {mode:"case_import"}, {profileId:"p"}]);
  expect(calls.every(([, init]) => new Headers(init.headers).get("Idempotency-Key") === "attempt-one" && init.credentials === "same-origin")).toBe(true);
});
it("saves a correction with the exact profile validator and exposes a conflicting revision", async () => {
  const fetch = vi.fn(async (_url: string, init: RequestInit) => {
    expect(new Headers(init.headers).get("If-Match")).toBe('"p.2"');
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe("correction-1");
    return new Response(null, {status:412});
  });
  vi.stubGlobal("fetch", fetch);
  await expect(caseApi.patch("p", {changes:[{action:"withdraw_fact",previousFactId:"f"}]}, '"p.2"', "correction-1")).rejects.toEqual(new ApiError(412));
});
it("resumes all message pages and their persisted assessment using only GET", async () => {
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    expect(init.method).toBe("GET");
    if (url.endsWith("/cases/c")) return Response.json({id:"c",profileId:"p",revision:2}, {headers:{ETag:'W/"c.2"'}});
    if (url.endsWith("/profiles/p")) return Response.json({id:"p",revision:3}, {headers:{ETag:'W/"p.3"'}});
    if (url.endsWith("/messages")) return Response.json({items:[],nextCursor:"next/token"});
    if (url.endsWith("/messages?cursor=next%2Ftoken")) return Response.json({items:[{citations:[],input:{intent:"explain_result",assessmentId:"a"}}],nextCursor:null});
    if (url.endsWith("/assessments/a")) return Response.json({id:"a",stale:true});
    return Response.json({items:[],nextCursor:null});
  });
  vi.stubGlobal("fetch", fetch);
  const view = await loadCase("c");
  expect(view.assessments).toEqual([{id:"a",stale:true}]);
  expect(view.etag).toBe('"p.3"');
  expect(view.caseEtag).toBe('"c.2"');
});
it("uses each returned revision for consecutive PATCH requests through a compressing proxy",async()=>{
  let revision=1;
  vi.stubGlobal("fetch",async (_url:string,init:RequestInit)=>{
    if (init.method==="PATCH") {
      if (new Headers(init.headers).get("If-Match") !== `"p.${revision}"`) return new Response(null,{status:412});
      revision++;
    }
    return Response.json({id:"p",revision},{headers:{ETag:`W/"p.${revision}"`,"Content-Encoding":"br"}});
  });
  const first=await caseApi.profile("p");
  const changes: {action:"add_subject";subjectId:string;role:"parent"}[]=[{action:"add_subject",subjectId:"synthetic",role:"parent"}];
  const second=await caseApi.patch("p",{changes},first.etag,"first-key");
  await expect(caseApi.patch("p",{changes},first.etag,"stale-key")).rejects.toEqual(new ApiError(412));
  expect((await caseApi.patch("p",{changes},second.etag,"second-key")).etag).toBe('"p.3"');
});
