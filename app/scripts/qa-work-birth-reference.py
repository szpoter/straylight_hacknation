"""Select independently legible birth dates in work-only registry certificates."""
import base64
import datetime
import hashlib
import errno
import json
import os
from pathlib import Path
import re
import socket
import sqlite3
import stat
import subprocess
import sys
import tempfile
import unicodedata

PRIVATE = Path.home() / "Library/Application Support/Zusik/private-cases"
DATE = re.compile(r"(?<!\d)(\d{1,2})([./-])(\d{1,2})\2(\d{4})(?!\d)")


def private(path):
    info = path.lstat()
    if stat.S_ISLNK(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077:
        raise ValueError("private_access")
    return path


TITLE = re.compile(r"\bodpis\s+(?:skrocony|zupelny)\s+aktu\s+urodzenia\b")
PROTECTED = re.compile(r"decyzj|d\s+e\s+c\s+y\s+z\s+j|odmawia|przyznaj|odmowiono|rozstrzygniecie|wzorzec\s+wyniku|klucz\s+odpowiedzi")


def fold(raw):
    return "".join(c for c in unicodedata.normalize("NFD", raw.lower()) if not unicodedata.combining(c)).replace("ł", "l")


def reference(raw):
    text = fold(raw)
    if PROTECTED.search(text):
        return
    if not TITLE.search(text):
        return
    sections = re.findall(r"\bdane dziecka\b(.*?)\bdane rodzicow\b", text, re.S)
    if len(sections) != 1:
        return
    section = sections[0]
    markers = list(re.finditer(r"\bdata(?: i miejsce)? urodzenia\b", section))
    dates = list(DATE.finditer(section))
    if len(markers) != 1 or len(dates) != 1:
        return
    label, date = markers[0], dates[0]
    gap = section[label.end():date.start()]
    if date.start() < label.end() or len(gap) > 120 or re.search(r"data|zgon|sporza|wydan|rejestr", gap):
        return
    try:
        return datetime.date(int(date[4]), int(date[3]), int(date[1])).isoformat()
    except ValueError:
        return


def row_reference(rows):
    for row in rows:
        row["t"] = fold(row["t"]).strip()
    text = " ".join(row["t"] for row in rows)
    if PROTECTED.search(text) or not any(TITLE.search(row["t"]) for row in rows):
        return
    def center(row):
        return row["y"] + row["h"] / 2
    def section(label):
        return [center(row) for row in rows if re.fullmatch(r"[\W\d]*" + label, row["t"])]
    children, parents = section("dane dziecka"), section("dane rodzicow")
    if len(children) != 1 or len(parents) != 1:
        return
    labels = [row for row in rows if re.fullmatch(r"data(?: i miejsce)? urodzenia[: ]*", row["t"])
              and children[0] < center(row) < parents[0] and row["confidence"] >= .8]
    if len(labels) != 1:
        return
    label = labels[0]
    cells = [row for row in rows if row["x"] >= label["x"] + label["w"] - .005 and
             abs(center(row) - center(label)) <= max(row["h"], label["h"]) * .65]
    if len(cells) != 1 or cells[0]["confidence"] < .8:
        return
    value = cells[0]
    date = DATE.fullmatch(value["t"])
    if not date:
        return
    try:
        day = datetime.date(int(date[4]), int(date[3]), int(date[1])).isoformat()
    except ValueError:
        return
    def box(row):
        return {k: row[k] for k in ("x", "y", "w", "h")}
    return dict(date=day, labelBox=box(label), valueBox=box(value))


def scan_reference(scanner, filename, sha, page):
    root = (Path(__file__).resolve().parents[2] / "Materiały hackathonowe/Sprawy").resolve(strict=True)
    path = (root / filename).resolve(strict=True)
    if not path.is_relative_to(root):
        raise ValueError("source_root")
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != sha:
        raise ValueError("source_hash")
    encoded = base64.b64encode(data).decode("ascii")
    matches = []
    for edge in (2600, 3400):
        result = subprocess.run([scanner], input=json.dumps(dict(pdf=encoded, page=page, edge=edge)).encode(),
                                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True)
        matches.append(row_reference(json.loads(result.stdout)))
    if all(matches) and matches[0]["date"] == matches[1]["date"]:
        return matches[1]
    return {}


def selection(scanner=None):
    private(PRIVATE)
    allow_dir = private(PRIVATE.parent / "qa-work")
    allow = set(json.loads(private(allow_dir / "digests.json").read_text()))
    work = [r["sha"] for r in json.loads(private(PRIVATE / "qa-edition-2026.json").read_text())["cases"] if r["proposedSplit"] == "work"]
    if not work or not allow or not all(re.fullmatch(r"[a-f0-9]{64}", sha) for sha in allow | set(work)):
        raise ValueError("work_allowlist")
    records = []
    with sqlite3.connect(private(PRIVATE / "index.sqlite3").as_uri() + "?mode=ro", uri=True) as db:
        sample = work[:8] if scanner else sorted(set(work) & allow)
        if scanner and (len(sample) != 8 or not set(sample) <= allow):
            raise ValueError("work_prefix")
        for sha in sample:
            for page, text in db.execute("SELECT number,text FROM pages WHERE sha=? ORDER BY number", (sha,)):
                date = reference(text)
                eligible = TITLE.search(fold(text)) and not PROTECTED.search(fold(text))
                if (scanner and eligible) or (not scanner and date):
                    filename, = db.execute("SELECT relative_path FROM files WHERE sha=? ORDER BY relative_path LIMIT 1", (sha,)).fetchone()
                    fields = scan_reference(scanner, filename, sha, page) if scanner else dict(date=date)
                    records.append(dict(relative_path=filename, sha=sha, page=page, **fields))
    return records


if __name__ == "__main__":
    try:
        if sys.argv[1:] == ["--self-test"]:
            form = "ODPIS SKRÓCONY AKTU URODZENIA\n1. Dane dziecka\nData urodzenia\nMiejsce urodzenia\n29.02.2024\n2. Dane rodziców"
            assert reference(form) == "2024-02-29"
            for damaged in (form.replace("2024", "2023"), "Klucz odpowiedzi\n" + form,
                            form.replace("Miejsce", "Data wydania\nMiejsce"), form.replace("2. Dane", "01.03.2024\n2. Dane"),
                            form.replace("29.02.2024", "") + "\n29.02.2024"):
                assert reference(damaged) is None
            def line(t, x, y):
                return dict(t=t, x=x, y=y, w=.2, h=.02, confidence=.98)
            rows = [line("Odpis skrócony aktu urodzenia", .1, .1), line("1. Dane dziecka", .1, .2),
                    line("Data urodzenia", .1, .35), line("29.02.2024", .50, .35), line("2. Dane rodziców", .1, .5),
                    line("Data urodzenia", .1, .60), line("01.02.1990", .50, .60)]
            assert row_reference(rows)["date"] == "2024-02-29"
            assert row_reference(rows[:3] + rows[4:]) is None
            assert row_reference(rows + [line("Decyzja", .1, .8)]) is None
            assert row_reference(rows + [line("28.02.2024", .75, .35)]) is None
            print("Synthetic independent reference checks passed.")
        elif set(sys.argv[1:]) <= {"--geometry", "--pipe"}:
            if sys.argv[1:]:
                with socket.socket() as probe:
                    if probe.connect_ex(("127.0.0.1", 9)) not in (errno.EPERM, errno.EACCES):
                        raise ValueError("offline_policy")
            if "--pipe" in sys.argv:
                mode = os.fstat(3).st_mode
                if not (stat.S_ISFIFO(mode) or stat.S_ISSOCK(mode)):
                    raise ValueError("private_pipe")
            if "--geometry" in sys.argv:
                with tempfile.TemporaryDirectory() as temp:
                    scanner = Path(temp) / "vision"
                    subprocess.run(["xcrun", "swiftc", Path(__file__).with_name("qa-vision-rows.swift"), "-o", scanner],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                    records = selection(scanner)
            else:
                records = selection()
            if "--pipe" in sys.argv:
                with os.fdopen(3, "w", encoding="utf-8") as channel:
                    json.dump(records, channel)
            else:
                print(json.dumps({"workingPackages": len({r["sha"] for r in records}), "pages": len(records),
                                  "independentDates": sum("date" in r for r in records)}))
        else:
            sys.exit("Use --self-test or --geometry for a work-only aggregate.")
    except Exception:
        sys.exit("aggregate_selection_unavailable")
