"""Run with python3 tests/private-case-index.test.py. All fixtures are synthetic."""
import importlib.util
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/private-case-index.py"
spec = importlib.util.spec_from_file_location("private_case_index", SCRIPT)
index = importlib.util.module_from_spec(spec)
spec.loader.exec_module(index)


class RestrictedIndexTest(unittest.TestCase):
    def test_search_returns_only_counts_and_opt_in_page_locations(self):
        with sqlite3.connect(":memory:") as db:
            index.create_schema(db)
            records = [
                {"number": 1, "method": "pdf", "text": "Testowa okładka"},
                {"number": 2, "method": "ocr", "text": "Testowy okres zasiłkowy"},
            ]
            sha = "a" * 64
            index.index_one(db, sha, records)
            db.execute("INSERT INTO files VALUES(?,?)", ("test.pdf", sha))
            db.execute("INSERT INTO hits(hits) VALUES('rebuild')")
            self.assertEqual(index.search(db, "okres zasilkowy"), {"matching_pages": 1, "matching_documents": 1})
            self.assertEqual(index.search(db, "okres", True)["locations"], [{"sha256": sha, "page": 2}])
            self.assertEqual(index.statistics(db)["ocr"], 1)
            self.assertEqual(index.statistics(db)["pdf"], 1)
            self.assertEqual(index.search(db, "nieobecny"), {"matching_pages": 0, "matching_documents": 0})
            with self.assertRaises(ValueError):
                index.index_one(db, "b"*64,[records[1]])

    def test_refuses_shared_directory_and_unrelated_database(self):
        with tempfile.TemporaryDirectory() as work:
            target = Path(work) / "index.sqlite3"
            self.assertEqual(index.protected_location(target), target)
            with sqlite3.connect(target) as db:
                with self.assertRaises(ValueError):
                    index.assert_ours(db)
            os.chmod(work, 0o755)
            with self.assertRaises(ValueError):
                index.protected_location(target)
            os.chmod(work, 0o700)
            link = Path(work) / "linked"
            link.symlink_to(target)
            with self.assertRaises(ValueError):
                index.protected_location(link)

    def test_duplicate_files_share_pages_and_failed_update_preserves_snapshot(self):
        with tempfile.TemporaryDirectory() as work:
            base = Path(work)
            case_dir = base / "docs"
            case_dir.mkdir()
            (case_dir / "one.pdf").write_bytes(b"fixture")
            (case_dir / "two.pdf").write_bytes(b"fixture")
            target = base / "private.sqlite3"
            with patch.object(index.subprocess, "run") as compiler, patch.object(index, "extract") as extract:
                compiler.return_value.returncode = 0
                extract.return_value = [{"number": 1, "text": "zaświadczenie", "method": "ocr"}]
                report = index.build(case_dir, target, 2)
                self.assertEqual((report["files"], report["unique_documents"], report["pages"]), (2,1,1))
                self.assertEqual(target.stat().st_mode & 0o777, 0o600)
                before = target.read_bytes()
                extract.side_effect = ValueError("bad input")
                with self.assertRaises(ValueError):
                    index.build(case_dir, target, 2)
                self.assertEqual(target.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
