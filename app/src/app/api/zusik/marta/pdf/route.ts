import { martaPdf } from "@/lib/marta/pdf";
import { readMarta } from "@/lib/marta/server";
import { NO_STORE, currentSessionId, errorResponse } from "@/lib/zusik/server";

export async function GET() {
  try {
    const session = await currentSessionId();
    const view = session && (await readMarta(session)).view;
    if (!view || !view.confirmed) return new Response(null, { status: 404, headers: NO_STORE });
    return new Response(await martaPdf(view), { headers: { ...NO_STORE, "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="wniosek-rodzicielski.pdf"' } });
  } catch (e) { return errorResponse(e, "marta-pdf"); }
}
