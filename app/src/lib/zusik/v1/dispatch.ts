import { publicTurnBudgetMs } from "../chat-model";
import type { Pool, PoolClient } from "pg";
import { caseInput, docInput, MemoryError, profileInput, profilePatch, type MemoryRepository } from "../memory/contract";
import { withMemoryTransaction } from "../memory/repository";
import { assess, assessmentInput, createMessage, listMessages, messageInput, readTurn, type Context, type PublicAnswer } from "./conversation";
import { etag, matchRevision, pagination } from "./guards";
import { ApiProblem, json, problem, readJson, requireOrigin } from "./http";
import { replayable, type SavedResponse, type WriteResult } from "./replay";

type Dependencies = { owner: string; pool: Pool; secret: string; publicAnswer: PublicAnswer };

async function context(repo: MemoryRepository, db: PoolClient, owner: string, caseId: string, lock: boolean): Promise<Context> {
  const first = await repo.getCase(caseId);
  const profile = await repo.getProfile(first.profileId, lock);
  const file = lock ? await repo.getCase(caseId,true) : first;
  return { repo, db, owner, profile, file };
}
const ok = (body: unknown, headers?: Record<string,string>): SavedResponse => ({body,status:200,headers});
const gone = {body:null,status:204};
function created(body: {id:string}, path: string, revision?: number): SavedResponse {
  return {body,status:201,headers:{Location:`/api/v1/${path}/${body.id}`,...(revision ? {ETag:etag(body.id,revision)} : {})}};
}

export async function dispatch(request: Request, parts: string[], deps: Dependencies) {
  let longPublicTurn = false;
  try {
    const {owner,pool,secret} = deps;
    const url = new URL(request.url);
    const [root,id,child,childId] = parts;
    if (!["cases","profiles"].includes(root) || parts.length > 4 || parts.some(p=>!p || p.length > 128)) throw new ApiProblem(404,"not_found");
    const method = request.method;
    if (method !== "GET") requireOrigin(request);
    const body = method === "POST" || method === "PATCH" ? await readJson(request) : undefined;
    const message = method === "POST" && root === "cases" && id && child === "messages" && !childId
      ? messageInput.safeParse(body) : undefined;
    longPublicTurn = message?.success === true && message.data.intent === "public_question" && message.data.modelOptions?.model === "qwen-27b";
    const result = await withMemoryTransaction(pool, owner, async (repo,db): Promise<SavedResponse> => {
      if (method === "GET") {
        if (!id || (child && !childId && ["facts","proposals","documents","messages"].includes(child))) {
          const { page,filter,result } = pagination(url,owner,secret,root === "profiles" && child === "facts");
          if (!id && root === "profiles") return ok(result(await repo.listProfiles(page)));
          if (!id) return ok(result(await repo.listCases(page)));
          if (root === "profiles" && child === "facts") return ok(result(await repo.listFacts(id,filter,page)));
          if (root === "profiles" && child === "proposals") return ok(result(await repo.listProposals(id,page)));
          if (root === "cases" && child === "documents") return ok(result(await repo.listDocuments(id,page)));
          if (root === "cases" && child === "messages") return ok(result(await listMessages(await context(repo,db,owner,id,false),page.limit,page.afterId)));
        }
        if (id && !child) {
          const item = root === "profiles" ? await repo.getProfile(id) : await repo.getCase(id);
          return ok(item,{ETag:etag(id,item.revision)});
        }
        if (root === "cases" && childId) {
          if (child === "documents") return ok(await repo.getDocument(id,childId));
          const ctx = await context(repo,db,owner,id,false);
          if (child === "messages") return ok(await readTurn(ctx,"message",childId));
          if (child === "assessments") return ok(await readTurn(ctx,"assessment",childId));
        }
      } else if (method === "DELETE" && id && !child) {
        if (root === "profiles") {
          await repo.getProfile(id,true);
          await repo.deleteProfile(id,matchRevision(request,id));
        } else {
          await context(repo,db,owner,id,true);
          await repo.deleteCase(id,matchRevision(request,id));
        }
        return gone;
      } else if (method === "PATCH" || method === "POST") {
        return replayable(db,owner,request,body,async (): Promise<WriteResult> => {
          if (method === "PATCH" && root === "profiles" && id && !child) {
            await repo.getProfile(id,true);
            const profile = await repo.patchProfile(id,matchRevision(request,id),profilePatch.parse(body));
            return {profileId:id,response:ok(profile,{ETag:etag(id,profile.revision)})};
          }
          if (method === "POST" && !id) {
            if (root === "profiles") {
              const profile = await repo.createProfile(profileInput.parse(body));
              return {profileId:profile.id,response:created(profile,root,profile.revision)};
            }
            const file = await repo.createCase(caseInput.parse(body).profileId);
            return {profileId:file.profileId,caseId:file.id,response:created(file,root,file.revision)};
          }
          if (method === "POST" && root === "cases" && id && child && !childId) {
            const ctx = await context(repo,db,owner,id,true);
            const path = `cases/${id}/${child}`;
            let item;
            if (child === "documents") item = await repo.registerDocument(id,docInput.parse(body));
            else if (child === "assessments") item = await assess(ctx,assessmentInput.parse(body));
            else if (child === "messages") {
              const input = message?.success ? message.data : messageInput.parse(body);
              item = await createMessage(ctx,input,deps.publicAnswer);
            } else throw new ApiProblem(404,"not_found");
            return {profileId:ctx.profile.id,caseId:id,response:created(item,path)};
          }
          throw new ApiProblem(405,"method_not_allowed");
        });
      }
      throw new ApiProblem(404,"not_found");
    }, longPublicTurn ? {lockMs: 500, idleMs: publicTurnBudgetMs("qwen-27b", 48_000) + 15_000} : undefined);
    return result.status === 204 ? new Response(null,{status:204,headers:{"Cache-Control":"private, no-store"}}) : json(result.body,result.status,result.headers);
  } catch (error) {
    if (longPublicTurn && (error as {code?: string})?.code === "55P03")
      return problem(new ApiProblem(429,"public_request_busy"));
    return problem(error instanceof MemoryError ? new ApiProblem(error.status,error.code) : error);
  }
}
