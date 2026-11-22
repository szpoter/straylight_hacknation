"""Offline experiment: rank complete public questions and send only verified corpus receipts."""
import argparse
import gzip
import hashlib
import json
import math
import os
import re
from collections import Counter
from pathlib import Path

# No cloud client or private case data is used. Keep the machine available to other acceptance runs.
for variable in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "VECLIB_MAXIMUM_THREADS"):
    os.environ[variable] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer


def json_file(path):
    return json.loads(path.read_text())


def lines(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line]


def confirmed_documents(assets, app, date):
    """Validate matrix order, public text, version, validity and digest before selecting any ID."""
    documents = []
    verified = {}
    for pack in ("marta", "publiczne", "oferta"):
        folder = app / "corpus" / pack
        manifest = json_file(folder / "manifest.json")
        titles = {doc["id"]: doc for doc in manifest["documents"]}
        for fragment in lines(folder / manifest["fragmentsFile"]):
            doc = titles[fragment["documentId"]]
            body = fragment["sourceText"]
            digest = hashlib.sha256(" ".join(body.split()).encode()).hexdigest()
            assert digest == fragment["fragmentSha256"]
            embedded = "\n".join(filter(None, [doc["shortTitle"], fragment["locator"], fragment["context"], body]))
            active = (not doc["validFrom"] or doc["validFrom"] <= date) and (not doc["validTo"] or date <= doc["validTo"])
            item = {"id": fragment["logicalId"], "version": manifest["corpusVersion"], "hash": digest}
            assert fragment["corpusVersion"] == item["version"] and (pack, item["id"]) not in verified
            headings = " ".join([doc["shortTitle"], fragment["locator"], *fragment["headingPath"], fragment["context"]])
            verified[pack, item["id"]] = (item, embedded, body, headings, active)
    snapshot = json_file(assets / "input.json")["docs"]
    for row in snapshot:
        receipt, embedded, body, headings, active = verified.pop((row["pack"], row["id"]))
        assert receipt["hash"] == row["hash"] and receipt["version"] == row["version"] and embedded == row["text"]
        documents.append((receipt, body, headings, active))
    assert not verified and len(set(doc[0]["id"] for doc in documents)) == len(documents)
    return documents


class LocalRetriever:
    def __init__(self, assets, app, documents):
        self.documents = documents
        self.forms = json.loads(gzip.decompress((app / "corpus/corpus-lexicon.json.gz").read_bytes()))["forms"]
        self.active = [i for i, doc in enumerate(documents) if doc[3]]
        self.fields = []
        for field in (1, 2):
            counts = [Counter(self.tokens(doc[field])) for doc in documents]
            lengths = [sum(document.values()) for document in counts]
            mean = sum(lengths[i] for i in self.active) / len(self.active)
            frequencies = Counter(term for i in self.active for term in counts[i])
            idf = {term: math.log1p((len(self.active) - n + 0.5) / (n + 0.5)) for term, n in frequencies.items()}
            self.fields.append((counts, lengths, mean, idf))
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = opts.inter_op_num_threads = 1
        self.model = ort.InferenceSession(str(assets / "encoder.onnx"), opts, providers=["CPUExecutionProvider"])
        self.tokenizer = Tokenizer.from_file(str(assets / "tokenizer.json"))
        self.tokenizer.no_padding()
        self.tokenizer.enable_truncation(max_length=512)
        self.vectors = np.load(assets / "index.npy")
        assert self.vectors.shape == (len(documents), 384) and np.isfinite(self.vectors).all()
        assert np.allclose(np.linalg.norm(self.vectors, axis=1), 1, atol=0.002)

    def tokens(self, text):
        return [self.forms.get(w, w) for w in re.findall(r"[^\W_]+", text.lower()) if len(w) > 1 or w.isdigit()]

    def rank(self, question):
        # BM25 body + half-weighted BM25 heading/context, same standard parameters for every query.
        query = set(self.tokens(question))
        scores = Counter()
        for weight, (counts, lengths, mean, idf) in zip((1, 0.5), self.fields):
            for i in self.active:
                norm = 1.2 * (0.25 + 0.75 * lengths[i] / mean)
                scores[i] += weight * math.fsum(idf[t] * counts[i][t] * 2.2 / (counts[i][t] + norm)
                                                for t in query.intersection(counts[i]))
        lexical = sorted((i for i in self.active if scores[i] > 0), key=lambda i: -scores[i])
        ids = np.asarray([self.tokenizer.encode("query: " + question).ids], dtype=np.int64)
        inputs = {"input_ids": ids, "attention_mask": np.ones_like(ids), "token_type_ids": np.zeros_like(ids)}
        hidden = self.model.run(None, {x.name: inputs[x.name] for x in self.model.get_inputs()})[0]
        pooled = hidden[0].mean(axis=0, dtype=np.float64)
        similarities = self.vectors @ (pooled / np.linalg.norm(pooled)).astype(np.float32)
        dense = sorted(self.active, key=lambda i: -similarities[i])
        return [[self.documents[i][0]["id"] for i in ranking[:20]] for ranking in (lexical, dense)]


def fused(*rankings):
    scores = Counter()
    for ranking in rankings:
        for rank, key in enumerate(ranking, 1):
            scores[key] += 1 / (60 + rank)
    return sorted(scores, key=lambda key: -scores[key])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets", required=True, type=Path, help="Local ONNX, tokenizer, index.npy and public index manifest")
    parser.add_argument("--control", type=Path, help="Existing service traces with entry, id and topIds")
    parser.add_argument("--probes", type=Path, help="Independent local JSON list with id, question and requiredEvidence")
    parser.add_argument("--projections", type=Path, help="Optional public-projections JSONL; a local clarification has a null question")
    args = parser.parse_args()
    app = Path(__file__).resolve().parents[1]
    documents = confirmed_documents(args.assets, app, "2026-11-22")
    retriever = LocalRetriever(args.assets, app, documents)
    receipts = {doc[0]["id"]: doc[0] for doc in documents if doc[3]}
    base = app / "tests/fixtures/zusik-acceptance"
    frozen = base / "g7.jsonl"
    assert hashlib.sha256(frozen.read_bytes()).hexdigest() == "51ca95e212e91b7541369e327e70d467ed14ab6e02e590f2cadc9387e6b63781"
    trials = json_file(args.probes) if args.probes else [r for r in lines(frozen) if r["group"] == "rag"]
    projections = {r["id"]: r["question"] for r in lines(args.projections)} if args.projections else {}
    if args.projections:
        assert set(projections) == {r["id"] for r in trials}
    controls = {("v1" if r["entry"] == "projected" else r["entry"], r["id"]): r.get("topIds", [])
                for r in lines(args.control) if "id" in r} if args.control else {}
    # No scoring key, accepted equivalents or case ID is passed to the retriever.
    predictions = {}
    for trial in trials:
        question = trial["question"] if args.probes else trial["questions"][0]
        lexical, dense = retriever.rank(question)
        raw = fused(lexical, dense)
        variants = {"raw_bm25": lexical, "raw_e5": dense, "raw_rrf": raw}
        if args.projections:
            projected = projections[trial["id"]]
            pl, pd = retriever.rank(projected) if projected else ([], [])
            variants.update(projected_bm25=pl, projected_e5=pd, projected_rrf=fused(pl, pd))
        if args.control:
            current = controls["v1", trial["id"]]
            variants.update(v1=current, full=controls["full", trial["id"]], combined=fused(lexical, dense, current))
        # Round-trip exactly the data a client would send, then recheck against the active server manifest.
        selected = {name: [receipts[i] for i in top[:20]] for name, top in variants.items()}
        wire = json.loads(json.dumps(selected))
        assert all(set(x) == {"id", "hash", "version"} and receipts[x["id"]] == x for ranking in wire.values() for x in ranking)
        predictions[trial["id"]] = {name: [x["id"] for x in ranking] for name, ranking in wire.items()}

    equivalents = {} if args.probes else json_file(base / "equivalent-evidence.json")
    for trial in trials:
        id_ = trial["id"]
        expected = [{ref, *equivalents.get(id_, {}).get(ref, [])} for ref in trial["requiredEvidence"]]
        for name, ranking in predictions[id_].items():
            def coverage(n):
                return all(group.intersection(ranking[:n]) for group in expected) if expected else None
            print(json.dumps({"id": id_, "ranker": name, "top1": coverage(1), "top5": coverage(5),
                              "top20": coverage(20), "ranking": ranking}, ensure_ascii=False))


if __name__ == "__main__":
    main()
