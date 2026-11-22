"""Generate local Polish terms for private, whole-corpus search.

Use the Python environment and pinned Model2Vec revision from build-topic-model.py.
Run: python scripts/build-corpus-lexicon.py MODEL_DIR
Only checked-in public source text is read; no model runs at request time.
"""
import gzip
import json
import re
import sys
from functools import cache
from pathlib import Path

import morfeusz2
import numpy as np
from safetensors.numpy import load_file
from tokenizers import Tokenizer

app = Path(__file__).resolve().parents[1]
model_dir = Path(sys.argv[1])
polish = morfeusz2.Morfeusz()
tokenizer = Tokenizer.from_file(str(model_dir / "tokenizer.json"))
weights = load_file(str(model_dir / "model.safetensors"))["embeddings"]


@cache
def lemma(word):
    candidates = [r[1].split(":")[0] for start, end, r in polish.analyse(word)
                  if start == 0 and end == 1 and r[2].split(":")[0] in
                  {"inf", "fin", "subst", "adj", "adv", "ger", "pact", "ppas", "praet"}
                  and not r[4] and all(n == "nazwa_pospolita" for n in r[3])]
    return min(candidates, key=lambda w: (len(w), w)) if candidates else None


def unit(vectors):
    return vectors / np.maximum(np.linalg.norm(vectors, axis=1, keepdims=True), 1e-9)


def normword(word):
    return re.fullmatch("[a-ząćęłńóśźż]{4,}", word) is not None


surfaces = set()
for file in sorted((app / "corpus").glob("*/fragments.jsonl")):
    for line in file.read_text().splitlines():
        surfaces.update(re.findall("[a-ząćęłńóśźż]{4,}", json.loads(line)["sourceText"].lower()))
public_terms = sorted({lemma(w) or w for w in surfaces})
vectors = unit(np.stack([weights[tokenizer.encode(w, add_special_tokens=False).ids].mean(axis=0)
                         for w in public_terms]))
candidates = sorted({lemma(token[1:]) for token in tokenizer.get_vocab()
                     if token.startswith("▁") and normword(token[1:]) and lemma(token[1:])} | set(public_terms))
vocab = tokenizer.get_vocab()
neighbors = {}
for start in range(0, len(candidates), 500):
    group = candidates[start:start + 500]
    # Common surface forms often have better subword vectors than infinitives.
    groups = [[w] + sorted({r[0] for r in polish.generate(w) if normword(r[0]) and "▁" + r[0] in vocab})[:8] for w in group]
    v = unit(np.stack([np.stack([weights[tokenizer.encode(form, add_special_tokens=False).ids].mean(axis=0) for form in forms]).mean(axis=0) for forms in groups]))
    scores = v @ vectors.T
    for w, row in zip(group, scores):
        similar = [public_terms[i] for i in np.argsort(-row)[:5] if public_terms[i] != w and row[i] >= 0.52][:3]
        if similar:
            neighbors[w] = similar

forms = {}
for w in sorted(set(neighbors) | set(public_terms)):
    for spelling, _, _, _, _ in polish.generate(w):
        if normword(spelling) and lemma(spelling) == w and spelling != w:
            forms[spelling] = w
licenses = json.loads((app / "src/lib/zusik/topic-projection.json").read_text())
out = {k: licenses[k] for k in ("model", "revision", "modelLicense", "dictionaryLicense")}
out.update(forms=forms, neighbors=neighbors)
raw = json.dumps(out, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()
(app / "corpus/corpus-lexicon.json.gz").write_bytes(gzip.compress(raw, compresslevel=9, mtime=0))
