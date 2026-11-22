"""Local audit of published worked examples. Only aggregate counters leave the process."""
from collections import Counter
from datetime import datetime
import errno
import json
from pathlib import Path
import re
import runpy
import socket
import sqlite3
import subprocess
import sys

HERE = Path(__file__).resolve().parent
repeat = runpy.run_path(str(HERE / "qa-repeat-source-ocr.py"))
coverage = repeat["coverage"]
VAULT = coverage["VAULT"]
fold = coverage["fold"]
DATE = r"\d{1,2}[./-]\d{1,2}[./-]\d{4}"
PERIOD = re.compile(r"(?<!\d)(" + DATE + r")\s*r?\.?\s*do\s+(" + DATE + r")", re.I)
CUES = {
    "nie-przysluguje": re.compile(r"\bdecyzja\b(?:\s+\w+){0,4}\s+odmawiajaca\b.{0,100}?zasilku macierzynskiego"),
    "przysluguje": re.compile(r"\bwyplacono\s+(?:\w+\s+){0,3}zasil\w+ macierzynsk"),
}
# Both the published check view and its tests call the same function. Expected outcomes are used
# only after the predictions are made. The second pass withholds decision-derived insurance data.
PREDICT = """
const { ZESTAW } = require('./src/lib/cases/zestaw.ts');
const { assessMaternityEligibility: evaluate } = require('./src/lib/rules/maternity-eligibility.ts');
const run = facts => evaluate(facts, '2026-11-22').status;
const cases = ZESTAW.map(c => {
  const mixedSource = /decyzj/i.test(c.source);
  const masked = mixedSource ? { ...c.facts, insured: 'nie-wiem', notSubjectDecision: false } : c.facts;
  const actual = run(c.facts), withoutDecision = run(masked);
  return { hint: c.fileHint.split('·')[0], mixedSource, actual, withoutDecision, expected: c.zus };
});
process.stdout.write(JSON.stringify(cases));
"""


def canonical(s):
    return re.sub(r"[^a-z0-9]+", "", fold(s))


def parse_date(s):
    return datetime.strptime(re.sub(r"\D", ".", s), "%d.%m.%Y").date()


def page_dates(s):
    result = set()
    for candidate in re.findall(DATE, s):
        try:
            result.add(parse_date(candidate))
        except ValueError:
            pass
    return result


def holdout_counts(cases, reads):
    rows = [reads[c["sha"]] for c in cases]
    if any(row["n"] != c["pages"] or sum(row["statuses"].values()) != c["pages"]
           for c, row in zip(cases, rows)):
        raise ValueError("incomplete reader")
    statuses = Counter()
    for row in rows:
        statuses.update(row["statuses"])
    return dict(packages=len(rows), pages=sum(r["n"] for r in rows), pageStatus=statuses,
                packagesWithFields=sum(r["fields"] > 0 for r in rows),
                packagesWithLeave=sum(r["leavePages"] > 0 for r in rows),
                sumPackageSeconds=round(sum(r["seconds"] for r in rows), 1))


def measure(app, *fingerprints):
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", 9)) not in (errno.EPERM, errno.EACCES):
            raise ValueError("IP block inactive")
    # Bind the reference data and the published eligibility function to the edition under audit.
    for path in ("src/lib/cases/zestaw.ts", "src/lib/rules/maternity-eligibility.ts"):
        original = subprocess.check_output(["git", "show", "e3f7a89:app/" + path], cwd=app)
        if (app / path).read_bytes() != original:
            raise ValueError("reference edition mismatch")
    refs = json.loads(subprocess.check_output(["node", "--import", "tsx", "-e", PREDICT], cwd=app))
    if not refs:
        raise ValueError("empty references")
    cases = json.loads(coverage["read_private"](VAULT / "qa-edition-2026.json"))["cases"]
    aliases = {c["sha"]: {canonical(p) for a in c["aliases"] for p in Path(a).parts} for c in cases}
    source = (HERE.parents[1] / "Materiały hackathonowe/Sprawy").resolve(strict=True)
    known, counts, splits = set(), Counter(), Counter()
    with sqlite3.connect((VAULT / "index.sqlite3").as_uri() + "?mode=ro", uri=True) as db:
        for r in refs:
            hint = canonical(r["hint"])
            matched = [c for c in cases if hint and any(hint in a for a in aliases[c["sha"]])]
            if len(matched) != 1 or matched[0]["sha"] in known:
                raise ValueError("ambiguous source")
            case = matched[0]
            known.add(case["sha"])
            splits[case["proposedSplit"]] += 1
            expected = r["expected"]["status"]
            text = r["expected"]["text"]
            counts["writtenDecisions"] += 1
            counts["knownMatches"] += r["actual"] == expected
            counts["decisionFreeSourceDescriptions"] += not r["mixedSource"]
            counts["matchesAfterMasking"] += r["withoutDecision"] == expected
            counts["missingAfterMasking"] += r["withoutDecision"] == "brak-danych"
            counts["writtenAmounts"] += bool(re.search(r"\bzł\b|\bpln\b", text, re.I))
            periods = {(parse_date(a), parse_date(b)) for a, b in PERIOD.findall(text)}
            counts["examplesWithWrittenPeriods"] += bool(periods)
            counts["writtenPeriods"] += len(periods)
            pairs, repeated = set(), set()
            pdf = (source / case["aliases"][0]).resolve(strict=True)
            if not pdf.is_relative_to(source):
                raise ValueError("source path")
            for page, raw in db.execute("SELECT number, text FROM pages WHERE sha=?", (case["sha"],)):
                dates = page_dates(raw)
                pairs.update((a, b) for a, b in periods if a in dates and b in dates)
                normalized = fold(raw)
                cues = {k for k, pattern in CUES.items() if pattern.search(normalized)}
                if cues:
                    counts["pagesReread"] += 1
                    other = fold(repeat["reread"](pdf, case["sha"], page))
                    repeated.update(k for k in cues if CUES[k].search(other))
            counts["periodDatePairsOnOnePage"] += len(pairs)
            if repeated == {expected}:
                counts["originalOutcomeCuesRepeated"] += 1
                if not r["mixedSource"] and r["withoutDecision"] == expected:
                    counts["matchesWithRepeatedCueAndDecisionFreeSource"] += 1
    remaining = [c for c in cases if c["proposedSplit"] == "holdout" and c["sha"] not in known]
    out = dict(counts=counts, knownBySplit=splits, holdoutOutsideKnown=len(remaining))
    if fingerprints:
        reads = {}
        for fingerprint in fingerprints:
            if not re.fullmatch(r"[a-f0-9]{64}", fingerprint):
                raise ValueError("reader version")
            data = coverage["read_private"](VAULT / ("qa-page-results-" + fingerprint + ".jsonl"))
            for row in map(json.loads, data.splitlines()):
                if row["digest"] in reads:
                    raise ValueError("overlapping checkpoints")
                reads[row["digest"]] = row
        published = [c for c in cases if c["proposedSplit"] == "holdout" and c["sha"] in known]
        out["holdout"] = {"outsidePublished": holdout_counts(remaining, reads),
                          "published": holdout_counts(published, reads)}
    print(json.dumps(out, sort_keys=True))


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--offline":
        try:
            measure(Path(sys.argv[2]).resolve(strict=True), *sys.argv[3:])
        except (OSError, ValueError, TypeError, KeyError, sqlite3.Error, subprocess.SubprocessError):
            sys.exit("Local reference comparison incomplete")
    elif len(sys.argv) in (2, 3, 4):
        sys.exit(subprocess.run(["/usr/bin/sandbox-exec", "-p", repeat["OFFLINE"], sys.executable,
                                 str(Path(__file__).resolve()), "--offline", *sys.argv[1:]]).returncode)
    else:
        sys.exit("Usage: qa-known-references.py CANDIDATE_APP [READER_FINGERPRINT ...]")
