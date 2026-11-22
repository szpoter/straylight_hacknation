"""Read-only diagnostic on working-set OCR. Counts source signals, never labels the frozen key."""
from collections import Counter
from datetime import datetime
import json
import os
from pathlib import Path
import re
import runpy
import sqlite3
import sys

HERE = Path(__file__).resolve().parent
scorer = runpy.run_path(str(HERE / "qa-case-report.py"))
VAULT, read_private = scorer["VAULT"], scorer["read_private"]
fold = runpy.run_path(str(HERE / "qa-review-packets.py"))["fold"]
DATE = r"(\d{1,2}[./-]\d{1,2}[./-]\d{4})"
DENIAL = re.compile(r"\bodmawia(?:m)?\s+(?:(?:pani|panu|ubezpieczon\w*)\s+)?prawa do zasilku\s+"
                    r"(chorobowego|macierzynskiego|opiekunczego)\b.{0,200}?\bod\s+"
                    + DATE + r"\s*r?\.?\s*do\s+" + DATE)
MONEY = re.compile(r"(?<![\d.,])(?:\d{1,3}(?:[ \u00a0]\d{3})+|\d+)[,.]\d{2}(?!\d)")


def dated_denials(text):
    front = fold(text).split("uzasadnienie", 1)[0]
    heading = re.search(r"\bdecyzja\b", front)
    if not heading or "zaklad ubezpieczen spolecznych" not in front:
        return set()
    signals = set()
    for benefit, start, end in DENIAL.findall(front[heading.end():]):
        try:
            dates = [datetime.strptime(re.sub(r"\D", ".", d), "%d.%m.%Y").date() for d in (start, end)]
        except ValueError:
            continue
        if dates[0] <= dates[1]:
            signals.add((benefit, *dates))
    return signals


def grosze(value):
    return int(re.sub(r"\D", "", value))


def amounts(text):
    return {grosze(m[0]) for m in MONEY.finditer(text)}


def legacy_examples(markdown):
    rows = []
    for line in markdown.splitlines():
        if line.startswith("|") and "stawka" in line:
            column = line.split("|")[2]
            daily = grosze(MONEY.search(column, column.index("stawka")).group())
            values = amounts(column)
            days = [n for n in range(2, 32) if daily * n in values]
            rows.append((values, days))
    if len(rows) != 5:
        raise ValueError("legacy documentation format")
    return rows


def measure(work, reads, pages, examples):
    denied, examples_seen, products_seen, labelled_days = set(), set(), set(), set()
    seen, denial_pages = Counter(), 0
    for sha, text in pages:
        if sha not in work:
            continue
        seen[sha] += 1
        if dated_denials(text):
            denied.add(sha)
            denial_pages += 1
        values = amounts(text)
        for i, (signature, days) in enumerate(examples):
            if len(signature) >= 3 and signature <= values:
                examples_seen.add(i)
                for n in days:
                    if re.search(rf"(?<![\d.,/-]){n}(?![\d.,/-])", text):
                        products_seen.add(sha)
                    if re.search(rf"\b{n}\s*dni\b|\bdni\s*[:-]?\s*{n}\b", text, re.I):
                        labelled_days.add(sha)
    if seen != work or not work.keys() <= reads.keys():
        raise ValueError("incomplete edition")
    return dict(workPackages=len(work), workPages=seen.total(), datedDenialPages=denial_pages,
                packagesWithDatedDenial=len(denied),
                withReaderFieldsAmongDenials=sum(reads[k]["fields"] > 0 for k in denied),
                withReaderLeaveAmongDenials=sum(reads[k]["leavePages"] > 0 for k in denied),
                legacyExamples=len(examples), legacyExamplesWithAllAmounts=len(examples_seen),
                packagesWithLegacyAmountsAndMatchingInteger=len(products_seen),
                packagesWithMatchingIntegerLabelledDays=len(labelled_days))


def run(fingerprint):
    if not re.fullmatch(r"[a-f0-9]{64}", fingerprint):
        raise ValueError("version")
    db_path = VAULT / "index.sqlite3"
    for path in (VAULT, db_path):
        stat = path.lstat()
        if path.is_symlink() or stat.st_uid != os.getuid() or stat.st_mode & 0o077:
            raise ValueError("permissions")
    cases = json.loads(read_private(VAULT / "qa-edition-2026.json"))["cases"]
    work = {c["sha"]: c["pages"] for c in cases if c["proposedSplit"] == "work"}
    cache = read_private(VAULT / ("qa-page-results-" + fingerprint + ".jsonl"))
    reads = {r["digest"]: r for r in map(json.loads, cache.splitlines())}
    for key, count in work.items():
        if reads[key]["n"] != count:
            raise ValueError("reader mismatch")
    examples = legacy_examples((HERE.parents[1] / "ui/KALKULATOR.md").read_text())
    with sqlite3.connect(db_path.as_uri() + "?mode=ro", uri=True) as db:
        # Select working documents in SQL; the holdout does not enter either diagnostic.
        pages = db.execute("SELECT sha, text FROM pages WHERE sha IN ("
                           + ",".join("?" for _ in work) + ")", tuple(work))
        print(json.dumps(measure(work, reads, pages, examples)))


if __name__ == "__main__":
    try:
        run(*sys.argv[1:])
    except (OSError, ValueError, TypeError, KeyError, AttributeError, sqlite3.Error):
        sys.exit("Incomplete local diagnostic input")
