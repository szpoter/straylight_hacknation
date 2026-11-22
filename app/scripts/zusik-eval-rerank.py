"""Local, label-blind reranking of a fixed public RRF top 20. Outputs public IDs only."""
import argparse
import hashlib
import math
import re
import runpy
from functools import lru_cache
from pathlib import Path

# Reuse the frozen first stage, its manifest verification and single-thread ONNX settings.
base = runpy.run_path(str(Path(__file__).with_name("zusik-eval-raw-public.py")))
np, json = base["np"], base["json"]


def aspects(question):
    clauses = re.split(r"[?!.;]+\s*|\s+(?:oraz|i|a)\s+(?=jak\w*|kto|kiedy|ile|czy|któ\w*|do kiedy)", question, flags=re.I)
    return [clause.strip() for clause in clauses if len(clause.split()) >= 2][:3] or [question]


class Reranker:
    def __init__(self, first):
        self.first = first
        self.positions = {first.documents[i][0]["id"]: i for i in first.active}

    def encoded(self, prefix, text):
        enc = self.first.tokenizer.encode(prefix + text)
        token_ids = np.asarray([enc.ids], dtype=np.int64)
        inputs = {"input_ids": token_ids, "attention_mask": np.ones_like(token_ids), "token_type_ids": np.zeros_like(token_ids)}
        hidden = self.first.model.run(None, {i.name: inputs[i.name] for i in self.first.model.get_inputs()})[0][0]
        keep, weights = [], []
        # A multi-piece word contributes one IDF weight divided across its pieces.
        for match in re.finditer(r"[^\W_]+", text, re.UNICODE):
            ids = [i for i, (a, b) in enumerate(enc.offsets)
                   if b > len(prefix) + match.start() and a < len(prefix) + match.end() and b > a]
            if not ids:
                continue
            lemma = self.first.tokens(match.group())
            if not lemma:
                continue
            weight = self.first.fields[0][3].get(lemma[0], math.log1p(len(self.positions))) / len(ids)
            keep.extend(ids)
            weights.extend([weight] * len(ids))
        if not keep:
            raise ValueError("Public text contained no encodable word")
        vectors = hidden[keep]
        vectors = vectors / np.maximum(np.linalg.norm(vectors, axis=1, keepdims=True), 1e-12)
        return vectors, np.asarray(weights) / sum(weights)

    @lru_cache(maxsize=160)
    def passage(self, identifier):
        return self.encoded("passage: ", self.first.documents[self.positions[identifier]][1])[0]

    def scores(self, question, pool):
        q, weights = self.encoded("query: ", question)
        return np.array([weights @ np.max(q @ self.passage(key).T, axis=1) for key in pool])

    def predict(self, question):
        pool = base["fused"](*self.first.rank(question))[:20]
        assert len(pool) == len(set(pool)) == 20
        whole = self.scores(question, pool)
        parts = np.array([whole if clause == question else self.scores(clause, pool) for clause in aspects(question)])
        # A: equal reciprocal-rank fusion of the fixed pool order and late interaction.
        late = base["fused"](pool, [pool[i] for i in np.argsort(-whole, kind="stable")])
        # B: MMR with relevance to whole question and strongest aspect, pooled E5 for redundancy.
        relevance = (whole + parts.max(axis=0)) / 2
        vectors = self.first.vectors[[self.positions[key] for key in pool]]
        similarity = vectors @ vectors.T
        chosen, remaining = [], list(range(len(pool)))
        while remaining:
            best = max(remaining, key=lambda i: 0.7 * relevance[i] - 0.3 * max((similarity[i, j] for j in chosen), default=0))
            chosen.append(best)
            remaining.remove(best)
        for name, ranking in [("rrf", pool), ("late", late), ("mmr", [pool[i] for i in chosen])]:
            assert set(ranking) == set(pool)
            top = ranking[:5]
            selected = [top[0]]
            if len(parts) > 1:
                # One best witness per independently parsed clause; picks must come from this top five.
                selected = list(dict.fromkeys(max(top, key=lambda key: part[pool.index(key)]) for part in parts))
            yield {"variant": name, "ranking": ranking, "selected": selected, "aspects": len(parts)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets", required=True, type=Path)
    args = parser.parse_args()
    app = Path(__file__).resolve().parents[1]
    docs = base["confirmed_documents"](args.assets, app, "2026-11-22")
    rerank = Reranker(base["LocalRetriever"](args.assets, app, docs))
    fixtures = app / "tests/fixtures"
    frozen = fixtures / "zusik-acceptance/g7.jsonl"
    assert hashlib.sha256(frozen.read_bytes()).hexdigest() == "51ca95e212e91b7541369e327e70d467ed14ab6e02e590f2cadc9387e6b63781"
    questions = [(r["id"], r["questions"][0]) for r in base["lines"](frozen) if r["group"] == "rag"]
    questions += [(r["id"], r["question"]) for r in base["json_file"](fixtures / "public-rag-subject-pairs.json")]
    questions += [(r["id"], r["questions"][0]) for r in base["json_file"](fixtures / "public-rag-probes.json")]
    assert len(questions) == len({key for key, _ in questions})
    for key, question in questions:
        for prediction in rerank.predict(question):
            print(json.dumps({"id": key, **prediction}), flush=True)


if __name__ == "__main__":
    main()
