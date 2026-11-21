import { martaPdf } from "@/lib/marta/pdf";
import { readMarta } from "@/lib/marta/server";
import { NO_STORE, currentSessionId, errorResponse } from "@/lib/zusik/server";

export async function GET(request: Request) {
  try {
    const version = new URL(request.url).searchParams.get("version");
    const session = version === "0" ? null : await currentSessionId();
    const view = session ? (await readMarta(session)).view : null;
    if (version === null ? !view?.confirmed : version !== String(view?.version ?? 0)) {
      return new Response(null, { status: 404, headers: NO_STORE });
    }
    return new Response(await martaPdf(view ?? null), { headers: { ...NO_STORE, "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="wniosek-rodzicielski.pdf"' } });
  } catch (e) { return errorResponse(e, "marta-pdf"); }
}
