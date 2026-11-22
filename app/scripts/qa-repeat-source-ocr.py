"""Re-read selected working pages with offline Tesseract, independent of the local Vision index."""
import errno
import hashlib
import json
from pathlib import Path
import runpy
import socket
import sqlite3
import subprocess
import sys

HERE = Path(__file__).resolve().parent
coverage = runpy.run_path(str(HERE / "qa-source-coverage.py"))
VAULT = coverage["VAULT"]
REPO = HERE.parents[1]
OFFLINE = '(version 1)(allow default)(deny network-outbound (remote ip "*:*"))'
NODE = """
const {createWorker} = require('tesseract.js');
const {resolve, dirname} = require('node:path');
(async () => {
  const image = require('node:fs').readFileSync(0);
  const worker = await createWorker('pol', 1, {langPath: resolve('public/ocr/lang'),
    corePath: dirname(require.resolve('tesseract.js-core/package.json')), cacheMethod: 'none'});
  try { const {data} = await worker.recognize(image); process.stdout.write(JSON.stringify(data.text)); }
  finally { await worker.terminate(); }
})().catch(() => process.exit(1));
"""


def reread(original, digest, page):
    with original.open("rb") as pdf:
        if hashlib.file_digest(pdf, "sha256").hexdigest() != digest:
            raise ValueError("source mismatch")
        pdf.seek(0)
        image = subprocess.run(["pdftoppm", "-png", "-singlefile", "-f", str(page), "-l", str(page), "-r", "200", "-"],
                               stdin=pdf, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True).stdout
    text = subprocess.run(["node", "-e", NODE], cwd=REPO / "app", input=image,
                          stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True).stdout
    return json.loads(text)


def run():
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", 9)) not in (errno.EPERM, errno.EACCES):
            raise ValueError("IP block inactive")
    source = (REPO / "Materiały hackathonowe/Sprawy").resolve(strict=True)
    cases = json.loads(coverage["read_private"](VAULT / "qa-edition-2026.json"))["cases"]
    work = {c["sha"]: c for c in cases if c["proposedSplit"] == "work"}
    examples = coverage["legacy_examples"]((REPO / "ui/KALKULATOR.md").read_text())
    def signatures(text):
        values = coverage["amounts"](text)
        return {i for i, (signature, _) in enumerate(examples) if len(signature) >= 3 and signature <= values}
    rendered = denials = agreed = 0
    seen, repeated = set(), set()
    with sqlite3.connect((VAULT / "index.sqlite3").as_uri() + "?mode=ro", uri=True) as db:
        query = "SELECT sha, number, text FROM pages WHERE sha IN (" + ",".join("?" for _ in work) + ")"
        for sha, page, text in db.execute(query, tuple(work)):
            clauses, known = coverage["dated_denials"](text), signatures(text)
            if not clauses and not known:
                continue
            original = (source / work[sha]["aliases"][0]).resolve(strict=True)
            if not original.is_relative_to(source):
                raise ValueError("source path")
            second = reread(original, sha, page)
            rendered += 1
            denials += bool(clauses)
            agreed += bool(clauses) and clauses == coverage["dated_denials"](second)
            seen.update(known)
            repeated.update(known & signatures(second))
    print(json.dumps(dict(renderedPages=rendered, selectedDatedDenialPages=denials,
                          sameBenefitsAndDates=agreed, selectedLegacyExamples=len(seen),
                          sameMonetarySignatures=len(repeated))))


if __name__ == "__main__":
    if sys.argv[1:] == ["--offline"]:
        try:
            run()
        except (OSError, ValueError, TypeError, KeyError, sqlite3.Error, subprocess.SubprocessError):
            sys.exit("Local OCR comparison incomplete")
    else:
        sys.exit(subprocess.run(["/usr/bin/sandbox-exec", "-p", OFFLINE, sys.executable,
                                 str(Path(__file__).resolve()), "--offline"]).returncode)
