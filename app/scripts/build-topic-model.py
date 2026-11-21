"""Build the Vercel topic router from public Model2Vec weights. No case data.

Download tokenizer.json and model.safetensors from the revision below, then run:
uv run --with numpy --with safetensors --with tokenizers --with morfeusz2==1.99.15 scripts/build-topic-model.py MODEL_DIR
The production runtime only reads the resulting small, quantized concept projection.
"""
import json
from functools import cache
import re
import sys
import unicodedata
from pathlib import Path

import morfeusz2
import numpy as np
from safetensors.numpy import load_file
from tokenizers import Tokenizer

MODEL_LICENSE = """MIT License

Model2Vec. Copyright (c) 2024 Thomas van Dongen.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE."""
MODEL = "minishlab/potion-multilingual-128M"
REVISION = "73908c3438cf03b6a01bcb9611d62b23d0726f08"
# Short public concept descriptions. Their embedding neighbours supply the vocabulary.
CONCEPTS = {
    "school": ["przybory szkolne", "podręczniki szkolne", "zeszyty", "wyprawka szkolna", "plecak do szkoły", "pierwszoklasista"],
    "care": ["żłobek", "opiekunka do dziecka", "klub dziecięcy", "niania", "opiekun dzienny"],
    "monthly": ["comiesięczny", "co miesiąc", "miesięcznie"],
    "upbringing": ["wychowanie", "utrzymanie dzieci", "wychowawcze"],
    "child": ["dziecko", "dzieci", "maluch", "pociecha", "syn", "córka"],
    "aid": ["dofinansowanie", "dopłaca", "pomoc finansowa", "dopłacają", "pieniądze", "zapomoga", "dopłata", "świadczenie pieniężne", "wsparcie finansowe", "zasiłek", "ZUS"],
    "channel": ["smartfon", "telefon", "aplikacja mobilna", "komórka", "komputer", "tablet", "elektronicznie", "internet"],
    "deadline": ["deadline", "termin końcowy", "data graniczna", "nabór", "przyjmowanie zgłoszeń"],
    "closure": ["zakończyć", "zamknięcie", "ostatni dzień", "koniec", "upływa", "zamykać"],
    "action": ["załatwić", "wysłać", "przesłać", "złożyć", "ogarnąć", "zrobić", "wypełnić"],
    "other": ["kredyt hipoteczny", "pożyczka", "bank", "podatek", "PIT", "odpis podatkowy", "wycieczka", "wspinaczka", "turystyka", "przedszkole", "cena detaliczna", "naprawa", "leczenie", "lekarstwo", "sport", "piłkarski", "studia", "uczelnia", "stypendium", "alimenty"],
}
SOURCE = Path(sys.argv[1])
OUTPUT = Path(__file__).resolve().parents[1] / "src/lib/zusik/topic-projection.json"


def folded(word):
    return "".join(ch for ch in unicodedata.normalize("NFD", word.lower().replace("ł", "l")) if not unicodedata.combining(ch))


def unit(rows):
    return rows / np.maximum(np.linalg.norm(rows, axis=-1, keepdims=True), 1e-10)


def build():
    polish = morfeusz2.Morfeusz()

    @cache
    def forms(word):
        readings = [r for start, end, r in polish.analyse(word) if start == 0 and end == 1
                    and r[2].split(":")[0] in {"inf", "fin", "subst", "adj", "adv", "pact", "praet"}
                    and not r[4] and all(label == "nazwa_pospolita" for label in r[3])]
        inflected = {surface for lemma in {r[1] for r in readings} for surface, _, tag, _, _ in polish.generate(lemma)
                     if tag.split(":")[0] in {"inf", "fin", "subst", "adj", "adv", "praet"}
                     and not tag.endswith((":com", ":sup")) and len(surface) >= 3 and surface.isalpha()}
        return {word, *inflected} if readings else set()

    tokenizer = Tokenizer.from_file(str(SOURCE / "tokenizer.json"))
    vectors = load_file(str(SOURCE / "model.safetensors"))["embeddings"]
    vocab = tokenizer.get_vocab()
    candidates = [(word[1:], idx) for word, idx in vocab.items()
                  if re.fullmatch(r"▁[a-ząćęłńóśźż]{3,24}", word)]
    # Compose full domain words even when the base tokenizer splits them into subwords.
    extra = {word for descriptions in CONCEPTS.values() for phrase in descriptions for word in phrase.lower().split() if len(word) >= 3}
    words, indices = zip(*sorted(candidates))
    candidates = unit(vectors[list(indices)])
    extra = sorted(extra - set(words))
    candidates = np.concatenate([candidates, unit(np.stack([vectors[tokenizer.encode(word, add_special_tokens=False).ids].mean(axis=0) for word in extra]))])
    words += tuple(extra)
    features = {}
    for concept, descriptions in CONCEPTS.items():
        prototypes = [vectors[tokenizer.encode(text, add_special_tokens=False).ids].mean(axis=0) for text in descriptions]
        cosines = candidates @ unit(np.stack(prototypes)).T
        similarities = cosines.max(axis=1)
        # Quantization and pruning keep the deployment independent of a model server.
        # Each prototype keeps neighbours even for facets with many competing meanings.
        selected = np.unique(np.argsort(-cosines, axis=0, kind="stable")[:150])
        for idx in selected:
            word = words[idx]
            weight = round(float(similarities[idx]) * 100)
            if weight >= 44:
                terms = features.setdefault(concept, {})
                inflections = forms(word)
                for spelling in inflections if weight >= 62 else inflections.intersection({word}):
                    key = folded(spelling)
                    terms[key] = max(terms.get(key, 0), weight if spelling == word else weight - 6)
                if word in extra:
                    terms[folded(word)] = max(terms.get(folded(word), 0), weight)
    payload = {"model": MODEL, "revision": REVISION, "modelLicense": MODEL_LICENSE, "dictionaryLicense": polish.dict_copyright().replace("\r", ""),
               "features": features}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=1) + "\n")


if __name__ == "__main__":
    build()
