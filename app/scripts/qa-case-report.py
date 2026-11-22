"""Score the local edition. Private keys, API observations and per-case receipts stay on this Mac."""
from collections import Counter
from pathlib import Path
import json
import os
import re
import sys
import tempfile

VAULT = Path.home() / "Library/Application Support/Zusik/private-cases"
METRICS = ("decision", "period", "amount", "evidence")


def read_private(path):
    stat = path.lstat()
    if path.is_symlink() or stat.st_uid != os.getuid() or stat.st_mode & 0o077:
        raise ValueError("permissions")
    return path.read_text()


def compare(case, read, observed):
    if read is None:
        blocker = "parser_pending"
    elif read["fields"] == 0:
        blocker = "no_candidate_before_rules"
    elif observed is None:
        blocker = "awaiting_confirmed_facts"
    else:
        blocker = "observed"
    # A branch key identifies claimant, title, benefit and requested interval locally.
    def indexed(rows):
        result = {row["branch"]: row for row in rows}
        if len(result) != len(rows):
            raise ValueError("duplicate branch")
        return result

    expected = indexed(case["expected"]) if case["review"] == "verified" else {}
    actual = indexed(observed or [])
    extra = len(actual.keys() - expected.keys()) if expected else 0
    metrics = {}
    for metric in METRICS:
        eligible = [(branch, row[metric]) for branch, row in expected.items() if row.get(metric) is not None]
        metrics[metric] = dict(correct=sum(actual.get(branch, {}).get(metric) == value for branch, value in eligible),
                               total=len(eligible))
    complete = case.get("completeReference") is True and bool(expected) and observed is not None and not extra and actual.keys() == expected.keys() and all(
        m["total"] == m["correct"] for m in metrics.values()) and all(row.get("decision") is not None for row in expected.values())
    return dict(blocker=blocker, reviewed=bool(expected), amountReference=bool(metrics["amount"]["total"]),
                extra=extra, metrics=metrics, full=complete)


def run(fingerprint, target):
    if not re.fullmatch(r"[a-f0-9]{64}", fingerprint) or not re.fullmatch(r"[a-f0-9]{40}", target):
        raise ValueError("version")
    if VAULT.is_symlink() or VAULT.stat().st_uid != os.getuid() or VAULT.stat().st_mode & 0o077:
        raise ValueError("directory")
    manifest = json.loads(read_private(VAULT / "qa-edition-2026.json"))
    key = {case["sha"]: case for case in manifest["cases"]}
    if len(key) != 86 or sum(len(c["aliases"]) for c in key.values()) != 87:
        raise ValueError("edition")
    cache = read_private(VAULT / ("qa-page-results-" + fingerprint + ".jsonl"))
    reads = {r["digest"]: r for r in map(json.loads, cache.splitlines())}
    if any(digest not in key or r["n"] != key[digest]["pages"] for digest, r in reads.items()):
        raise ValueError("edition mismatch")
    observed_file = VAULT / ("qa-observations-" + target + "-" + fingerprint + ".json")
    try:
        observed = json.loads(read_private(observed_file))
    except FileNotFoundError:
        observed = {}
    if observed.keys() - key.keys():
        raise ValueError("unknown observation")
    cases = {sha: compare(case, reads.get(sha), observed.get(sha)) for sha, case in key.items()}
    summary = {"unique": len(cases), "read": len(reads), "reviewed": sum(r["reviewed"] for r in cases.values()),
               "withoutAmountReference": sum(not r["amountReference"] for r in cases.values()),
               "full": sum(r["full"] for r in cases.values()), "blockers": Counter(r["blocker"] for r in cases.values()),
               "metrics": {m: {field: sum(r["metrics"][m][field] for r in cases.values()) for field in ("correct", "total")} for m in METRICS}}
    with tempfile.NamedTemporaryFile(dir=VAULT, mode="w", delete=False) as staged:
        json.dump({"target": target, "parser": fingerprint, "cases": cases, "summary": summary}, staged)
        staged.flush()
        os.fsync(staged.fileno())
    os.replace(staged.name, VAULT / ("qa-scores-" + target + "-" + fingerprint + ".json"))
    print(json.dumps(summary))
    return summary["full"] == len(cases)


if __name__ == "__main__":
    try:
        sys.exit(0 if run(*sys.argv[1:]) else 1)
    except (OSError, ValueError, KeyError, TypeError):
        sys.exit("Incomplete local score input")
