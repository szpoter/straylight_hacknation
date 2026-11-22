from pathlib import Path
import runpy
import unittest
from collections import Counter

tool = runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts/qa-private-split.py"))


class PrivateSplitTest(unittest.TestCase):
    def test_whole_groups_and_reproducible_allocation(self):
        groups = [[0, 1], *[[n] for n in range(2, 86)]]
        first = tool["partition"](groups, 123)
        self.assertEqual(first, tool["partition"](groups, 123))
        self.assertEqual(first[0], first[1])
        self.assertEqual(Counter(first.values()), {"work": 60, "validation": 13, "holdout": 13})

    def test_review_preparation_keeps_resolution_out_of_independent_inputs(self):
        select = runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts/qa-review-packets.py"))["select"]
        cases = {k: {"id": k, "aliases": [], "linkedIds": [k]} for k in ["a", "b"]}
        pages = [("a", 1, "Niezdolność do pracy, nie podlega"), ("a", 2, "Odmawiam prawa"),
                 ("b", 2, "Kwota zasiłku 12,28"), ("b", 1, "Wynagrodzenie 33,54"), ("b", 3, "Przyznano")]
        packets = select(cases, pages)
        self.assertEqual(len(packets), 2)
        for packet in packets:
            self.assertTrue(set(packet["sourcePageCandidates"]).isdisjoint(packet["resolutionPageCandidates"]))
            self.assertEqual(packet["secondReview"], "pending")

    def test_link_requires_a_checksum(self):
        self.assertFalse(list(tool["identifiers"]("00000000000 01234567890")))


if __name__ == "__main__":
    unittest.main()
