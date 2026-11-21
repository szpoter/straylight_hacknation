"""Run with python3 tests/private-case-index.test.py. All fixtures are synthetic."""
from contextlib import closing
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
        with closing(sqlite3.connect(":memory:")) as db, db:
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
            with closing(sqlite3.connect(target)) as db, db:
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


class PrivateQuestionTest(unittest.TestCase):
    first = "a" * 64
    second = "b" * 64
    phrase = "Numer kontrolny paczki testowej to KROKUS."
    foreign = "Numer kontrolny paczki testowej to LILIA."

    def setUp(self):
        self.work = tempfile.TemporaryDirectory()
        self.addCleanup(self.work.cleanup)
        self.path = Path(self.work.name) / "synthetic.sqlite3"
        with closing(sqlite3.connect(self.path)) as db, db:
            index.create_schema(db)
            for sha, text in [(self.first,self.phrase),(self.second,self.foreign)]:
                index.index_one(db, sha, [
                    {"number":1,"text":"Okładka demonstracyjna","method":"pdf"},
                    {"number":2,"text":text,"method":"pdf"},
                ])
            db.execute("INSERT INTO hits(hits) VALUES('rebuild')")
        self.before = self.path.read_bytes()
        self.db = sqlite3.connect(self.path.as_uri()+"?mode=ro", uri=True)
        self.addCleanup(self.db.close)

    def test_retrieves_and_quotes_only_selected_document_across_same_query(self):
        for sha, expected, forbidden in [
            (self.first,self.phrase,self.foreign), (self.second,self.foreign,self.phrase)
        ]:
            def model(question, pages):
                self.assertEqual([p["page"] for p in pages], [2])
                self.assertIn(expected, pages[0]["text"])
                self.assertNotIn(forbidden, pages[0]["text"])
                return {"citations":[{"page":2,"quote":expected}]}
            reply = index.ask(self.db, sha, "Jaki numer kontrolny paczki?", model)
            self.assertEqual(reply["status"], "answered")
            self.assertEqual(reply["citations"], [{"page":2,"quote":expected}])
        self.assertEqual(self.path.read_bytes(), self.before)

    def test_rejects_wrong_document_page_paraphrase_and_partial_validity(self):
        valid = {"page":2,"quote":self.phrase}
        for candidate in [
            None, {"citations":"wrong"}, {"citations":[{"page":True,"quote":self.phrase}]},
            {"citations":[{"page":1,"quote":self.phrase}]},
            {"citations":[valid, {"page":2,"quote":self.foreign}]},
            {"citations":[{"page":2,"quote":self.phrase.lower()}]},
        ]:
            result = index.ask(self.db,self.first,"numer kontrolny",lambda *_: candidate)
            self.assertEqual((result["status"], result["citations"]), ("insufficient_evidence", []))
        for sha in ["", "a"*63, "f"*64]:
            with self.assertRaises(ValueError):
                index.ask(self.db,sha,"numer",lambda *_: self.fail("model called"))

    def test_missing_hit_and_local_model_outage_return_no_content(self):
        empty = index.ask(self.db,self.first,"Pomarańcza",lambda *_: self.fail("model called"))
        self.assertEqual(empty["matching_pages"], [])
        def offline(*args):
            raise ConnectionError("simulated outage")
        reply = index.ask(self.db,self.first,"numer kontrolny",offline)
        self.assertEqual(reply,{"status":"local_model_unavailable","sha256":self.first,
                                "matching_pages":[2],"citations":[]})

    def test_only_local_transport_and_strict_model_selection(self):
        with patch.object(index.http.client, "HTTPConnection") as transport:
            connection = transport.return_value
            response = connection.getresponse.return_value
            response.status = 200
            for selection, expected in [
                ("P2F1", "answered"), ("P1F1", "insufficient_evidence"),
                ("P2F1,P3F1", "insufficient_evidence"), ("BRAK", "insufficient_evidence")
            ]:
                response.read.return_value = index.json.dumps(
                    {"choices":[{"message":{"content":selection}}]}).encode()
                reply = index.ask(self.db,self.first,"numer kontrolny")
                self.assertEqual(reply["status"], expected)
                transport.assert_called_with("127.0.0.1", 11434, timeout=60)
                self.assertEqual(connection.request.call_args.args[:2], ("POST", "/v1/chat/completions"))
                prompt = index.json.loads(connection.request.call_args.kwargs["body"])
                self.assertEqual(prompt["model"], index.LOCAL_MODEL)
                self.assertNotIn(self.foreign, prompt["messages"][1]["content"])
            response.status = 307
            self.assertEqual(index.ask(self.db,self.first,"numer kontrolny")["status"], "local_model_unavailable")
            self.assertEqual(connection.request.call_count, 5)

    @unittest.skipUnless(os.environ.get("ZUSIK_TEST_LOCAL_OLLAMA") == "1", "opt-in local inference on fiction")
    def test_local_bielik_and_cli_on_only_a_temporary_synthetic_index(self):
        self.path.chmod(0o600)
        for sha, expected, forbidden in [
            (self.first,"KROKUS","LILIA"),(self.second,"LILIA","KROKUS")
        ]:
            process = index.subprocess.run(
                [index.sys.executable,str(SCRIPT),"--db",str(self.path),"ask","--sha",sha,
                 "Jaki numer kontrolny paczki testowej podaje dokument? Zacytuj całe zdanie."],
                capture_output=True, text=True, timeout=75,
            )
            self.assertEqual(process.returncode,0)
            payload = index.json.loads(process.stdout)
            self.assertEqual(payload["status"],"answered")
            self.assertTrue(any(expected in c["quote"] and c["page"]==2 for c in payload["citations"]))
            self.assertFalse(any(forbidden in c["quote"] for c in payload["citations"]))
        self.assertEqual(self.path.read_bytes(), self.before)


if __name__ == "__main__":
    unittest.main()
