#!/usr/bin/env python3
"""Local-only macOS page search for the restricted case files.

Build: python3 scripts/private-case-index.py build --source "../Materiały hackathonowe/Sprawy"
Search: python3 scripts/private-case-index.py search "okres ubezpieczenia"
Default output reports counts only. --locations adds document SHA-256 and one-based pages.
PDFKit and Vision process files on this Mac. No external Python packages or accounts.
"""

import argparse
import concurrent.futures
import hashlib
import json
from itertools import product
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import tempfile

VERSION = 1
APPLICATION_ID = 1515418441
DEFAULT_DB = Path.home() / "Library/Application Support/Zusik/private-cases/index.sqlite3"
REPO = Path(__file__).resolve().parents[2]

SWIFT = r"""
import AppKit
import Foundation
import PDFKit
import Vision

struct Page: Encodable { let number: Int; let method: String; let text: String }
let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let doc = PDFDocument(url: url), !doc.isLocked, doc.pageCount > 0 else { exit(2) }
func useful(_ text: String) -> Bool {
    text.unicodeScalars.filter { CharacterSet.letters.contains($0) }.count >= 24
}
let encoder = JSONEncoder()
for i in 0..<doc.pageCount {
    let entry: Page = autoreleasepool {
        guard let page = doc.page(at: i) else { return Page(number: i+1, method: "unreadable", text: "") }
        let native = (page.string ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if useful(native) { return Page(number: i+1, method: "pdf", text: native) }
        let bounds = page.bounds(for: .cropBox)
        guard bounds.width > 0, bounds.height > 0 else { return Page(number: i+1, method: "unreadable", text: native) }
        let scale = 1920.0 / max(bounds.width, bounds.height)
        let frame = CGSize(width: bounds.width * scale, height: bounds.height * scale)
        let image = page.thumbnail(of: frame, for: .cropBox)
        var rect = CGRect(origin: .zero, size: image.size)
        guard let cg = image.cgImage(forProposedRect: &rect, context: nil, hints: nil) else {
            return Page(number: i+1, method: "unreadable", text: native)
        }
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        do {
            let supported = try request.supportedRecognitionLanguages()
            let langs = ["pl-PL", "en-US"].filter { supported.contains($0) }
            if !langs.isEmpty { request.recognitionLanguages = langs }
            try VNImageRequestHandler(cgImage: cg).perform([request])
            let text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator:"\n")
            if !text.isEmpty { return Page(number: i+1, method: "ocr", text: text) }
        } catch { return Page(number: i+1, method:"unreadable", text:native) }
        return Page(number:i+1, method:native.isEmpty ? "blank" : "short", text:native)
    }
    guard let line = try? encoder.encode(entry) else { exit(3) }
    FileHandle.standardOutput.write(line)
    FileHandle.standardOutput.write(Data([10]))
}
"""


def protected_location(path):
    path = path.expanduser().absolute()
    if path.is_symlink() or path.resolve().is_relative_to(REPO):
        raise ValueError("Store the private index outside the repository in a dedicated local directory.")
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    parent = path.parent.stat()
    if parent.st_uid != os.getuid() or parent.st_mode & 0o077:
        raise ValueError("The index directory must be owned by this account with mode 0700.")
    if path.exists():
        stat = path.stat()
        if stat.st_uid != os.getuid() or stat.st_mode & 0o077 or not path.is_file():
            raise ValueError("Expected a private, owner-only index file.")
    return path


def create_schema(db):
    db.executescript(f"""
        PRAGMA application_id = {APPLICATION_ID};
        PRAGMA user_version = {VERSION};
        CREATE TABLE documents (sha TEXT PRIMARY KEY, pages INTEGER NOT NULL);
        CREATE TABLE files (relative_path TEXT PRIMARY KEY, sha TEXT NOT NULL REFERENCES documents);
        CREATE TABLE pages (id INTEGER PRIMARY KEY, sha TEXT NOT NULL REFERENCES documents,
                            number INTEGER NOT NULL, method TEXT NOT NULL, text TEXT NOT NULL,
                            UNIQUE(sha, number));
        CREATE VIRTUAL TABLE hits USING fts5(text, content='pages', content_rowid='id',
                                             tokenize='unicode61 remove_diacritics 2');
    """)


def assert_ours(db):
    if (db.execute("PRAGMA application_id").fetchone()[0] != APPLICATION_ID or
            db.execute("PRAGMA user_version").fetchone()[0] != VERSION):
        raise ValueError("The file is not a compatible Zusik private index.")


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def index_one(db, sha, records):
    if not records or any(row["number"] != n for n, row in enumerate(records, 1)):
        raise ValueError("Incomplete document extraction.")
    db.execute("INSERT INTO documents VALUES (?, ?)", (sha, len(records)))
    db.executemany("INSERT INTO pages(sha,number,method,text) VALUES(?,?,?,?)",
                   [(sha, r["number"], r["method"], r["text"]) for r in records])


def extract(executable, pdf):
    run = subprocess.run([executable, pdf], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    if run.returncode:
        raise ValueError("Could not open a document.")
    return [json.loads(line) for line in run.stdout.splitlines()]


def statistics(db):
    return {
        "files": db.execute("SELECT count(*) FROM files").fetchone()[0],
        "unique_documents": db.execute("SELECT count(*) FROM documents").fetchone()[0],
        "pages": db.execute("SELECT count(*) FROM pages").fetchone()[0],
        **{key: db.execute("SELECT count(*) FROM pages WHERE method=?", (key,)).fetchone()[0]
           for key in ("pdf", "ocr", "short", "blank", "unreadable")},
    }


def build(source, target, workers):
    source = source.expanduser().resolve()
    if not source.is_dir():
        raise ValueError("No source directory.")
    paths = sorted(p for p in source.rglob("*") if p.suffix.lower() == ".pdf" and p.is_file() and not p.is_symlink())
    if not paths:
        raise ValueError("No PDF documents to index.")
    if target.exists():
        with sqlite3.connect(target.as_uri()+"?mode=ro", uri=True) as old:
            assert_ours(old)
    # Publish an entire consistent snapshot. A failed document preserves the previous snapshot.
    with tempfile.TemporaryDirectory(dir=target.parent) as working:
        root = Path(working)
        swift = root / "extract.swift"
        swift.write_text(SWIFT)
        executable = root / "extract"
        compile_result = subprocess.run(["xcrun", "swiftc", "-O", "-module-cache-path", root/"cache",
                                         swift, "-o", executable], capture_output=True)
        if compile_result.returncode:
            raise ValueError("Apple Swift, PDFKit and Vision must be installed.")
        snapshot = root / "index.sqlite3"
        db = sqlite3.connect(snapshot)
        try:
            create_schema(db)
            groups = {}
            for path in paths:
                groups.setdefault(digest(path), []).append(path)
            failures = 0
            with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
                jobs = {pool.submit(extract,executable,group[0]): sha for sha, group in groups.items()}
                for future in concurrent.futures.as_completed(jobs):
                    sha = jobs.pop(future)
                    try:
                        rows = future.result()
                        index_one(db, sha, rows)
                    except (OSError, ValueError):
                        failures += 1
                        continue
                    db.executemany("INSERT INTO files VALUES(?,?)",
                                   [(str(path.relative_to(source)), sha) for path in groups[sha]])
            db.execute("INSERT INTO hits(hits) VALUES('rebuild')")
            db.commit()
            report = statistics(db) | {"input_files": len(paths), "failed_documents": failures}
            if failures:
                print(json.dumps(report))
                raise ValueError("Some documents could not be indexed. The completed index was preserved.")
        finally:
            db.close()
        snapshot.chmod(0o600)
        os.replace(snapshot, target)
        return report


def search(db, query, locations=False):
    # Plain-language terms, not raw FTS operators.
    words = re.findall(r"[^\W_]+", query, re.UNICODE)
    if not words:
        raise ValueError("Enter one or more search terms.")
    # unicode61 handles combining accents; Polish ł is a separate letter.
    def variants(word):
        letters = word.lower()
        if sum(c in "lł" for c in letters) > 4:
            return '"' + letters + '"'
        pieces = [("l","ł") if c in "lł" else (c,) for c in letters]
        return "(" + " OR ".join('"' + "".join(combo) + '"' for combo in product(*pieces)) + ")"

    expression = " AND ".join(variants(word) for word in words)
    sql = " FROM hits JOIN pages ON pages.id=hits.rowid WHERE hits MATCH ?"
    pages, docs = db.execute("SELECT count(*), count(DISTINCT sha)" + sql,(expression,)).fetchone()
    result = {"matching_pages": pages, "matching_documents": docs}
    if locations:
        result["locations"] = [{"sha256":sha, "page":page} for sha,page in
                               db.execute("SELECT sha,number" + sql + " ORDER BY rank LIMIT 20",(expression,))]
    return result


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    modes = parser.add_subparsers(required=True, dest="mode")
    install = modes.add_parser("build")
    install.add_argument("--source", required=True, type=Path)
    install.add_argument("--workers", type=int, choices=range(1,7), default=3)
    find = modes.add_parser("search")
    find.add_argument("query")
    find.add_argument("--locations", action="store_true")
    modes.add_parser("status")
    args = parser.parse_args()
    target = protected_location(args.db)
    if args.mode == "build":
        result = build(args.source,target,args.workers)
    else:
        if not target.exists():
            raise ValueError("Build the index first.")
        with sqlite3.connect(target.as_uri()+"?mode=ro",uri=True) as db:
            assert_ours(db)
            result = search(db,args.query,args.locations) if args.mode == "search" else statistics(db)
    print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, sqlite3.Error) as error:
        # Filesystem paths and subprocess output can contain personal information.
        print(str(error) if isinstance(error, ValueError) else "Local index operation failed.", file=sys.stderr)
        sys.exit(1)
