import runpy
from pathlib import Path
import unittest

compare = runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts/qa-case-report.py"))["compare"]


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


if __name__ == "__main__":
    unittest.main()
