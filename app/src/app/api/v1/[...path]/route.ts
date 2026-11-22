import { currentSessionId, runtime as services, signingSecret } from "@/lib/zusik/server";
import { dispatch } from "@/lib/zusik/v1/dispatch";
import { ApiProblem, problem } from "@/lib/zusik/v1/http";
import { publicReply } from "@/lib/zusik/v1/public";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handler(request: Request, ctx: {params: Promise<{path:string[]}>}) {
  try {
    const owner = await currentSessionId();
    if (!owner) throw new ApiProblem(401,"session_required");
    return await dispatch(request,(await ctx.params).path,{owner,pool:services().pool,secret:signingSecret(),publicAnswer:publicReply});
  } catch (error) { return problem(error); }
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
