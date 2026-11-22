import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";

// A fictional letter in two native scan resolutions and several print sizes.
export async function compareLeaveScans(page, selectVersion) {
  const pdf = await PDFDocument.create();
  const fixtures = [];
  for (const width of [960, 1600]) {
    for (const size of [15, 18, 22, 27, 32]) {
      fixtures.push({ width, size, decision: false });
    }
  }
  fixtures.push({ width: 1600, size: 27, decision: true });
  for (const fixture of fixtures) {
    const png = await page.evaluate(({ width, size, decision }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = Math.round(width * 842 / 595);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = size + "px Arial";
      const lines = ["Wniosek", "Proszę o udzielenie mi urlopu ojcowskiego", "od 16.04.2026 do 29.04.2026"];
      if (decision) lines.unshift("Decyzja");
      lines.forEach((line, i) => ctx.fillText(line, 64, 180 + i * size * 2));
      return canvas.toDataURL();
    }, fixture);
    pdf.addPage([595, 842]).drawImage(await pdf.embedPng(png), { x: 0, y: 0, width: 595, height: 842 });
  }
  const bytes = Array.from(await pdf.save());
  let baseline;
  for (const version of ["base", "current"]) {
    await selectVersion(version);
    const rows = await page.evaluate(async bytes => {
      const [doc] = await qaReader.readCaseDocuments([new File([new Uint8Array(bytes)], "synthetic-letter.pdf")], {
        caseId: "synthetic-leave", signal: AbortSignal.timeout(600_000), onProgress() {},
      });
      return doc.pages.map(p => {
        const requests = p.leaveRequests ?? [];
        const correct = requests.length === 1 && requests.every(r => {
          const quote = p.text.split("\n").slice(r.locator.lineStart - 1, r.locator.lineEnd).join(" ");
          return r.kind === "paternity" && r.validFrom === "2026-04-16" && r.validTo === "2026-04-29" &&
            r.locator.page === p.page && /ojcowskiego/iu.test(quote) && quote.includes("16.04.2026") && quote.includes("29.04.2026");
        });
        return { correct, excluded: p.status === "excluded", emitted: requests.length + p.candidates.length };
      });
    }, bytes);
    assert.equal(rows.length, fixtures.length);
    assert.deepEqual(rows.at(-1), { correct: false, excluded: true, emitted: 0 });
    const matched = rows.slice(0, -1).map(r => r.correct);
    const changed = baseline && {
      gained: matched.filter((hit, i) => hit && !baseline[i]).length,
      lost: matched.filter((hit, i) => !hit && baseline[i]).length,
    };
    console.log(JSON.stringify({ version, matched, agreements: matched.filter(Boolean).length,
      unsupported: rows.filter(r => r.emitted && !r.correct).length, excluded: 1, ...changed }));
    baseline = matched;
  }
}
