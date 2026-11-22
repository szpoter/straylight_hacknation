// Read only the Vercel deployment cookie. Each app session still starts empty.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";

export async function previewCookies(origin, authFile) {
  const target = new URL(origin);
  assert.ok(target.origin === origin && /^straylight-hacknation-[a-z0-9-]+-idk-b700\.vercel\.app$/.test(target.hostname) && target.protocol === "https:");
  if (authFile === "--vercel-cli") {
    const options = process.env.QA_VERCEL_CONFIG ? ["--global-config", process.env.QA_VERCEL_CONFIG] : [];
    const cli = spawnSync(process.env.QA_VERCEL_CLI || "vercel", [...options, "curl", "/app/rozmowa", "--deployment", origin, "--",
      "--silent", "--max-time", "30", "--output", "/dev/null", "--dump-header", "-", "--header", "x-vercel-set-bypass-cookie: true"],
    {cwd:process.env.QA_VERCEL_CWD, encoding:"utf8", timeout:60000});
    assert.ok(cli.status === 0, "Official Vercel access is unavailable");
    const cookies = Array.from(cli.stdout.matchAll(/^set-cookie:\s*(_vercel_[a-z_]+)=([^;\r\n]+);([^\r\n]*)/gim))
      .filter(match => /(?:^|;)\s*secure\s*(?:;|$)/i.test(match[3]))
      .map(match => ({name:match[1], value:match[2], url:origin, secure:true, httpOnly:true}));
    assert.ok(cookies.length, "No deployment cookie issued");
    return cookies;
  }
  const stat = await lstat(authFile);
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.uid === process.getuid() && !(stat.mode & 0o077));
  const saved = JSON.parse(await readFile(authFile, "utf8"));
  const cookies = saved.cookies.filter(c => c.domain === target.hostname && /^_vercel_[a-z_]+$/.test(c.name) && c.secure)
    .map(c => ({ name:c.name, value:c.value, url:target.origin, secure:true, httpOnly:true }));
  assert.ok(cookies.length);
  return cookies;
}
