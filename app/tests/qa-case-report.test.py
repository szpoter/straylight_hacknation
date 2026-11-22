import runpy
from datetime import date
from pathlib import Path
import unittest

compare = runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts/qa-case-report.py"))["compare"]
coverage = runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts/qa-source-coverage.py"))
measure = coverage["measure"]


class Scores(unittest.TestCase):
    def test_missing_amount_keeps_decision_eligible_and_an_extra_branch_fails_the_package(self):
        branch = {"branch": "a", "decision": "eligible", "period": ["2026-05-10", "2026-05-16"], "amount": None}
        result = compare({"expected": [branch], "review": "verified"}, {"fields": 2}, [branch, {"branch": "extra"}])
        self.assertEqual(result["metrics"]["decision"], {"correct": 1, "total": 1})
        self.assertEqual(result["metrics"]["amount"]["total"], 0)
        self.assertEqual(result["extra"], 1)
        self.assertFalse(result["full"])

    def test_decision_only_is_never_a_fully_verified_package(self):
        one = {"branch": "a", "decision": "eligible"}
        actual = compare({"expected": [one], "review": "verified"}, {"fields": 2}, [one])
        self.assertEqual(actual["metrics"]["decision"]["correct"], 1)
        self.assertFalse(actual["full"])

    def test_complete_flag_cannot_substitute_for_the_branch_evidence(self):
        one = {"branch": "a", "decision": "eligible"}
        key = {"expected": [one], "review": "verified", "completeReference": True}
        self.assertFalse(compare(key, {"fields": 2}, [one])["full"])

    def test_declined_branch_with_an_unexpected_payment_fails_the_package(self):
        denial = {"branch": "a", "decision": "ineligible", "period": ["2026-03-01", "2026-03-02"],
                  "evidence": ["page-2"], "amount": None}
        key = {"expected": [denial], "review": "verified", "completeReference": True}
        self.assertTrue(compare(key, {"fields": 2}, [denial])["full"])
        paid = {**denial, "amount": {"grosze": 100, "unit": "total-gross"}}
        self.assertFalse(compare(key, {"fields": 2}, [paid])["full"])

    def test_full_award_requires_a_period_and_an_amount_even_with_evidence(self):
        award = {"branch": "a", "decision": "eligible", "evidence": ["page-2"],
                 "period": ["2026-03-02", "2026-03-03"], "amount": {"grosze": 32000, "unit": "total-gross"}}
        for missing in ("period", "amount"):
            with self.subTest(missing=missing):
                partial = {k: v for k, v in award.items() if k != missing}
                key = {"expected": [partial], "review": "verified", "completeReference": True}
                report = compare(key, {"fields": 2}, [partial])
                self.assertEqual(report["metrics"][missing]["total"], 0)
                self.assertFalse(report["full"])
        key = {"expected": [award], "review": "verified", "completeReference": True}
        self.assertTrue(compare(key, {"fields": 2}, [award])["full"])

    def test_full_denial_still_needs_its_requested_period(self):
        partial = {"branch": "a", "decision": "ineligible", "evidence": ["page-2"]}
        key = {"expected": [partial], "review": "verified", "completeReference": True}
        self.assertFalse(compare(key, {"fields": 2}, [partial])["full"])

    def test_absent_output_does_not_remove_a_verified_amount_from_denominator(self):
        key = {"expected": [{"branch": "a", "decision": "eligible", "amount": {"grosze": 0, "unit": "total-gross"}}], "review": "verified"}
        result = compare(key, {"fields": 0}, None)
        self.assertEqual(result["blocker"], "no_candidate_before_rules")
        self.assertEqual(result["metrics"]["amount"], {"correct": 0, "total": 1})
        self.assertEqual(compare({**key, "review":"pending"}, None, None)["metrics"]["amount"]["total"], 0)

    def test_leave_page_is_distinct_from_a_benefit_fact_and_from_a_saved_assessment(self):
        case = {"expected": [], "review": "pending"}
        read = {"fields": 0, "leavePages": 1}
        self.assertEqual(compare(case, read, None)["blocker"], "leave_request_without_benefit_fact")
        self.assertEqual(compare(case, read, [])["blocker"], "observed")
        self.assertFalse(compare({"review": "verified", "completeReference": True, "expected": [{"branch":"a", "decision":"eligible"}]},
                                 None, [{"branch":"a", "decision":"eligible"}])["full"])

    def test_source_diagnostic_only_counts_the_working_set_and_the_dated_operative_clause(self):
        header = "Zakład Ubezpieczeń Społecznych. Decyzja. "
        ruling = "Odmawia Pani prawa do zasiłku chorobowego od 01.03.2026 do 03.03.2026."
        pages = [("a", header + ruling), ("a", header + "Uzasadnienie: " + ruling),
                 ("b", header + ruling.replace("01.03", "32.03")), ("b", header + ruling.replace("01.03", "12.03")),
                 ("b", "10,00 / 30,00 / 40,00 liczba 3"), ("holdout", header + ruling)]
        report = measure({"a": 2, "b": 3}, {"a": {"fields": 0, "leavePages": 1}, "b": {"fields": 2, "leavePages": 0}},
                         pages, [({1000, 3000, 4000}, [3, 4])])
        self.assertEqual(report, {"workPackages": 2, "workPages": 5, "datedDenialPages": 1,
                                  "packagesWithDatedDenial": 1, "withReaderFieldsAmongDenials": 0,
                                  "withReaderLeaveAmongDenials": 1, "legacyExamples": 1,
                                  "legacyExamplesWithAllAmounts": 1, "packagesWithLegacyAmountsAndMatchingInteger": 1,
                                  "packagesWithMatchingIntegerLabelledDays": 0})

    def test_holdout_group_reports_only_its_own_packages_and_checks_the_page_statuses(self):
        group = runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts/qa-known-references.py"))["holdout_counts"]
        cases = [{"sha": "unpublished", "pages": 2}]
        row = {"n": 2, "fields": 0, "leavePages": 1, "seconds": 7.25, "statuses": {"read": 1, "manual": 1}}
        reads = {"unpublished": row, "published": {**row, "fields": 3}}
        self.assertEqual(group(cases, reads), {"packages": 1, "pages": 2, "packagesWithFields": 0,
                                               "packagesWithLeave": 1, "sumPackageSeconds": round(7.25, 1),
                                               "pageStatus": {"read": 1, "manual": 1}})
        with self.assertRaises(ValueError):
            group(cases, {"unpublished": {**row, "statuses": {"manual": 1}}})

    def test_second_reader_must_reproduce_the_benefit_and_both_dates(self):
        clause = ("Decyzja. Zakład Ubezpieczeń Społecznych odmawia Panu prawa do zasiłku "
                  "chorobowego od 02.03.2026 do 16.03.2026.")
        expected = {("chorobowego", date(2026, 3, 2), date(2026, 3, 16))}
        self.assertEqual(coverage["dated_denials"](clause), expected)
        for changed in (clause.replace("chorobowego", "opiekuńczego"),
                        clause.replace("02.03", "07.03"), clause.replace("16.03", "18.03")):
            self.assertNotEqual(coverage["dated_denials"](changed), expected)


if __name__ == "__main__":
    unittest.main()
