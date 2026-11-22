import assert from "node:assert/strict";
import { chromium } from "playwright-core";

async function check() {
  const ui = new URL("/app/rozmowa", process.argv[2] ?? "http://127.0.0.1:3649");
  const api = new URL(process.argv[3] ?? ui.origin);
  assert.ok([ui, api].every(url => ["localhost", "127.0.0.1"].includes(url.hostname)));
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage({viewport:{width:402,height:874},isMobile:true,hasTouch:true});
    page.setDefaultTimeout(65000);
    if (ui.origin !== api.origin) {
      await page.route("**/api/v1/**", async route => {
        const request = route.request();
        const path = new URL(request.url());
        const response = await route.fetch({url:new URL(path.pathname + path.search, api).href,
          headers:{...request.headers(), origin:api.origin}, timeout:65000});
        await route.fulfill({response});
      });
    }
    const submit = async (question: string) => {
      await page.getByRole("textbox", {name:"Wiadomość do Zusika"}).fill(question);
      const [response] = await Promise.all([
        page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/messages")),
        page.getByRole("button", {name:"Wyślij"}).click(),
      ]);
      return response;
    };
    const say = async (question: string) => {
      const response = await submit(question);
      assert.equal(response.status(), 201);
      await page.locator("[data-knowledge-turn]").getByText(question, {exact:true}).waitFor();
      return {message:await response.json(), input:response.request().postDataJSON()};
    };
    await page.goto(ui.href);
    await say("Hej");
    const caseId = new URL(page.url()).searchParams.get("sprawa");
    assert.ok(caseId);
    // Seed a completed public turn through the real API to verify the UI against its saved citation IDs.
    const sourceQuestion = "Jakie świadczenia dla dziecka, które idzie do żłobka?";
    const message = await page.evaluate(async ({caseId, sourceQuestion}) => {
      const response = await fetch("/api/v1/cases/" + caseId + "/messages", {method:"POST",
        headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},
        body:JSON.stringify({intent:"public_question",publicQuestion:sourceQuestion})});
      if (response.status !== 201) throw Error("HTTP " + response.status);
      return response.json();
    }, {caseId, sourceQuestion});
    const data = message.opportunities?.find((c: {title:string}) => /aktywnie w żłobku/i.test(c.title));
    assert.ok(data, "REST should return a sourced nursery opportunity");
    await page.reload();
    const card = page.getByRole("article", {name:data.title});
    await card.getByText("Warunki do sprawdzenia").click();
    assert.ok(await card.getByRole("listitem").count() > 0);
    const verified = message.citations.filter((c: {ref:string}) => data.citationIds.includes(c.ref));
    const links = await card.getByRole("link").evaluateAll(nodes => nodes.map(n => (n as HTMLAnchorElement).href));
    assert.ok(links.length > 0);
    assert.deepEqual(links, verified.map((c: {publicUrl:string}) => c.publicUrl));
    await page.getByText("Hej", {exact:true}).waitFor();
    console.log("PASS 402 · karta żłobka z warunkami i cytatem REST po F5 · oryginalne Hej");
    await page.goto(new URL("?nowa=1",ui).href);
    const question = "Jaki jest termin składania wniosku o ojcowski?";
    const clarification = await say(question);
    await page.reload();
    await page.getByText(question,{exact:true}).waitFor();
    const reply = await submit("Na etacie");
    const input = reply.request().postDataJSON();
    assert.equal(input.replyTo, clarification.message.id);
    assert.equal(input.publicQuestion, "Na etacie.");
    if (reply.status() === 503) {
      assert.equal((await reply.json()).code, "public_source_unavailable");
      await page.getByRole("button", {name:"Ponów próbę"}).waitFor();
      console.log("UPSTREAM 503 public_source_unavailable · UI oferuje ponowienie");
    } else {
      assert.equal(reply.status(), 201);
      await page.locator("[data-knowledge-turn]").getByText("Na etacie", {exact:true}).waitFor();
    }
    console.log("PASS 402 · dokładne pytanie o ojcowski po F5 · Na etacie przekazuje replyTo oryginalnej wiadomości");
  } finally { await browser.close(); }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
