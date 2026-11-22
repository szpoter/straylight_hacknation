"""Prepare the 2026 test edition on the owner's Mac. Only print aggregate counts."""
from collections import Counter, defaultdict
from pathlib import Path
import csv
import hashlib
import json
import os
import random
import re
import secrets
import sqlite3
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = Path.home() / "Library/Application Support/Zusik/private-cases"
KEY = PRIVATE / "qa-edition-2026.json"
INDEX = PRIVATE / "index.sqlite3"


def identifiers(text):
    for match in re.finditer(r"(?<!\d)\d{11}(?!\d)", text):
        digits = [int(i) for i in match.group()]
        if len(set(digits)) > 2 and sum(a*b for a, b in zip(digits, [1,3,7,9,1,3,7,9,1,3,1])) % 10 == 0:
            yield match.group()


def partition(groups, seed):
    order = list(groups)
    random.Random(seed).shuffle(order)
    result = {}
    remaining = {"work": 60, "validation": 13, "holdout": 13}
    for group in sorted(order, key=len, reverse=True):
        bucket = max(remaining, key=remaining.get)
        result.update(dict.fromkeys(group, bucket))
        remaining[bucket] -= len(group)
    return result


def prepare(source):
    with (ROOT / "plans/zusik-sprawy/07-inwentarz-spraw.csv").open(encoding="utf-8-sig") as fp:
        inventory = list(csv.reader(fp, delimiter=";"))[1:]
    aliases = defaultdict(list)
    for path in source.rglob("*"):
        if path.is_file() and path.suffix.lower() == ".pdf":
            with path.open("rb") as fp:
                aliases[hashlib.file_digest(fp, "sha256").hexdigest()].append(str(path.relative_to(source)))
    if PRIVATE.is_symlink() or INDEX.is_symlink() or PRIVATE.stat().st_uid != os.getuid() or PRIVATE.stat().st_mode & 0o077:
        raise ValueError("private directory")
    with sqlite3.connect(INDEX.as_uri()+"?mode=ro", uri=True) as db:
        docs = dict(db.execute("select sha,pages from documents order by sha"))
        if set(docs) != set(aliases) or len(docs) != len(inventory) or len(docs) != 86:
            raise ValueError("inventory")
        ids = {sha: row[0] for sha, row in zip(docs, inventory)}
        groups = {sha: {sha} for sha in docs}
        seen = {}
        candidates = defaultdict(lambda: defaultdict(list))
        checks = {"denial": r"odmawi\w* prawa|odmow\w* prawa",
                  "award": r"przyzna\w* (?:pani |panu )?prawo|przyznaje\w* zasiłek",
                  "payroll": r"podstaw\w* wymiaru|wynagrodzeni",
                  "insurance": r"ubezpieczeni\w* chorobow"}
        for sha, page, body in db.execute("select sha,number,text from pages order by sha,number"):
            for pid in identifiers(body):
                other = seen.setdefault(pid, sha)
                if groups[sha] is not groups[other]:
                    merged = groups[sha] | groups[other]
                    for item in merged:
                        groups[item] = merged
            for tag, pattern in checks.items():
                if re.search(pattern, body, re.I):
                    candidates[sha][tag].append(page)
    components = sorted({tuple(sorted(g)) for g in groups.values()})
    seed = secrets.randbits(128)
    split = partition(components, seed)
    rows = []
    for (sha, pages), inv in zip(docs.items(), inventory):
        if [len(aliases[sha]), pages] != [int(inv[1]), int(inv[2])]:
            raise ValueError("edition mismatch")
        rows.append(dict(id=ids[sha], sha=sha, aliases=sorted(aliases[sha]), pages=pages,
                         proposedSplit=split[sha], linkedIds=sorted(ids[s] for s in groups[sha]),
                         candidatePages=candidates[sha], knownToAuthors=None, familyReviewed=False,
                         inputPages=[], excludedPages=[], expected=[], review="pending"))
    return dict(edition=1, seed=str(seed), splitStatus="provisional", cases=rows)


def main():
    os.umask(0o077)
    if not KEY.exists():
        key = prepare(Path(sys.argv[1]).resolve(strict=True))
        # Publish only a complete file. A concurrent creation can never overwrite the first draw.
        with tempfile.NamedTemporaryFile(dir=PRIVATE, mode="w", encoding="utf-8") as staged:
            json.dump(key, staged, ensure_ascii=False)
            staged.flush()
            os.fsync(staged.fileno())
            os.link(staged.name, KEY)
    if KEY.is_symlink() or KEY.stat().st_mode & 0o077 or KEY.stat().st_uid != os.getuid():
        raise ValueError("key permissions")
    key = json.loads(KEY.read_text())
    print(json.dumps(dict(files=sum(len(c["aliases"]) for c in key["cases"]), unique=len(key["cases"]),
                          pages=sum(c["pages"] for c in key["cases"]), status=key["splitStatus"],
                          proposed=Counter(c["proposedSplit"] for c in key["cases"]),
                          reviews=Counter(c["review"] for c in key["cases"]))))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, sqlite3.Error, KeyError, IndexError) as error:
        sys.exit("Private inventory incomplete: " + type(error).__name__)
