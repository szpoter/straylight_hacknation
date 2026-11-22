"""Prepare two local review packets from the working set. No private evidence on stdout."""
from pathlib import Path
import json
import os
import re
import sqlite3
import sys
import tempfile
import unicodedata

PRIVATE = Path.home() / "Library/Application Support/Zusik/private-cases"
TARGET = PRIVATE / "qa-first-reviews-2026.json"


def fold(text):
    normalized = unicodedata.normalize("NFKD", text.lower().replace("ł", "l"))
    return " ".join("".join(c for c in normalized if not unicodedata.combining(c)).split())


def select(cases, pages):
    checks = {
        "refusal": r"odmawi\w*|odmow[ayi]",
        "exclusion": r"nie podleg\w*|brak ubezpieczen|nie (?:byl\w* |jest )?objet\w* ubezpieczen",
        "illness": r"zasil\w* chorobow|niezdolnos\w* do pracy|e[- ]?zla",
        "award": r"przyznaj\w*|przyznan\w*|uprawnion\w* do zasilku",
        "payroll": r"wynagrodzeni\w*|zaswiadczenie platnika|skladk\w* potracon",
        "settlement": r"kwot\w* (?:zasilku|do wyplaty)|wyplac\w* zasil|stawka dzienn",
        "number": r"\d+[,.]\d{2}(?!\d)",
    }
    found = {}
    for sha, page, text in pages:
        if sha not in cases:
            continue
        normalized = fold(text)
        found.setdefault(sha, {})[page] = {k for k, pattern in checks.items() if re.search(pattern, normalized)}
    packets = []
    used = set()
    for purpose, primary, corroboration, result in [
        ("sickness_denial", "illness", "exclusion", "refusal"),
        ("award_and_amount", "payroll", "award", "settlement"),
    ]:
        ranked = []
        for sha, tagged in found.items():
            if sha in used:
                continue
            output = [n for n, tags in tagged.items() if result in tags and (purpose == "sickness_denial" or "number" in tags)]
            evidence = [n for n, tags in tagged.items() if primary in tags and n not in output]
            support = [n for n, tags in tagged.items() if corroboration in tags]
            if output and evidence and support:
                score = sum(primary in tagged[n] or corroboration in tagged[n] for n in output)
                score += sum("number" in tagged[n] for n in evidence) if purpose == "award_and_amount" else 0
                ranked.append((-score, sha, sorted(evidence), sorted(support), sorted(output)))
        if not ranked:
            continue
        _, sha, evidence, support, output = min(ranked)
        record = cases[sha]
        used.update(key for key, peer in cases.items() if peer["id"] in record["linkedIds"])
        packets.append(dict(purpose=purpose, id=record["id"], sha=sha, aliases=record["aliases"],
                            sourcePageCandidates=evidence, corroborationPageCandidates=support,
                            resolutionPageCandidates=output, reviewedInputPages=[], excludedPages=[],
                            expectedBranches=[], secondReview="pending", status="candidate_only"))
    return packets


def main():
    os.umask(0o077)
    if PRIVATE.is_symlink() or PRIVATE.stat().st_uid != os.getuid() or PRIVATE.stat().st_mode & 0o077:
        raise ValueError("expected protected directory")
    if not TARGET.exists():
        key = json.loads((PRIVATE / "qa-edition-2026.json").read_text())
        cases = {c["sha"]: c for c in key["cases"] if c["proposedSplit"] == "work"}
        with sqlite3.connect((PRIVATE / "index.sqlite3").as_uri()+"?mode=ro", uri=True) as db:
            packets = select(cases, db.execute("select sha,number,text from pages order by sha,number"))
        if len(packets) != 2:
            raise ValueError("two distinct evidence sets required")
        with tempfile.NamedTemporaryFile(dir=PRIVATE, mode="w", encoding="utf-8") as output:
            json.dump({"packets": packets}, output, ensure_ascii=False)
            output.flush()
            os.fsync(output.fileno())
            os.link(output.name, TARGET)
    if TARGET.is_symlink() or TARGET.stat().st_mode & 0o077 or TARGET.stat().st_uid != os.getuid():
        raise ValueError("expected protected file")
    packets = json.loads(TARGET.read_text())["packets"]
    print(json.dumps({"review_packets": len(packets), "second_reviews": sum(p["secondReview"] == "verified" for p in packets)}))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, sqlite3.Error, KeyError) as error:
        sys.exit("Review preparation incomplete: " + type(error).__name__)
