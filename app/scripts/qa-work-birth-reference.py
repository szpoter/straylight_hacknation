"""Select independently legible birth dates in work-only registry certificates."""
import datetime
import errno
import json
import os
from pathlib import Path
import re
import socket
import sqlite3
import stat
import sys
import unicodedata

PRIVATE = Path.home() / "Library/Application Support/Zusik/private-cases"
DATE = re.compile(r"(?<!\d)(\d{1,2})([./-])(\d{1,2})\2(\d{4})(?!\d)")


def private(path):
    info = path.lstat()
    if stat.S_ISLNK(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077:
        raise ValueError("private_access")
    return path


def reference(raw):
    text = "".join(c for c in unicodedata.normalize("NFD", raw.lower()) if not unicodedata.combining(c)).replace("ł", "l")
    if re.search(r"decyzj|odmawia|przyznaj|odmowiono|rozstrzygniecie|wzorzec\s+wyniku|klucz\s+odpowiedzi", text):
        return
    if not re.search(r"\bodpis\s+(?:skrocony|zupelny)\s+aktu\s+urodzenia\b", text):
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


def selection():
    private(PRIVATE)
    allow_dir = private(PRIVATE.parent / "qa-work")
    allow = set(json.loads(private(allow_dir / "digests.json").read_text()))
    work = {r["sha"] for r in json.loads(private(PRIVATE / "qa-edition-2026.json").read_text())["cases"] if r["proposedSplit"] == "work"}
    if not work or not allow or not all(re.fullmatch(r"[a-f0-9]{64}", sha) for sha in allow | work):
        raise ValueError("work_allowlist")
    records = []
    with sqlite3.connect(private(PRIVATE / "index.sqlite3").as_uri() + "?mode=ro", uri=True) as db:
        for sha in sorted(work & allow):
            for page, text in db.execute("SELECT number,text FROM pages WHERE sha=? ORDER BY number", (sha,)):
                date = reference(text)
                if date:
                    filename, = db.execute("SELECT relative_path FROM files WHERE sha=? ORDER BY relative_path LIMIT 1", (sha,)).fetchone()
                    records.append(dict(relative_path=filename, sha=sha, page=page, date=date))
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
            print("Synthetic independent reference checks passed.")
        elif sys.argv[1:] == ["--pipe"]:
            with socket.socket() as probe:
                if probe.connect_ex(("127.0.0.1", 9)) not in (errno.EPERM, errno.EACCES):
                    raise ValueError("offline_policy")
            destination = os.fstat(3).st_mode
            if not (stat.S_ISFIFO(destination) or stat.S_ISSOCK(destination)):
                raise ValueError("private_pipe")
            with os.fdopen(3, "w", encoding="utf-8") as channel:
                json.dump(selection(), channel)
        elif not sys.argv[1:]:
            records = selection()
            print(json.dumps({"workingPackages": len({row["sha"] for row in records}), "independentDates": len(records)}))
        else:
            sys.exit("Use --self-test or run without arguments for aggregate counts.")
    except Exception:
        sys.exit("aggregate_selection_unavailable")
