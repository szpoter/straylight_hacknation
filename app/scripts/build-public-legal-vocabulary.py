"""Build browser search terms from packaged benefit law and official programme publications."""
import gzip
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

app = Path(__file__).resolve().parents[1]
lexicon = json.loads(gzip.decompress((app / "corpus/corpus-lexicon.json.gz").read_bytes()))
forms = lexicon["forms"]
occurrences = Counter()
spellings = defaultdict(Counter)
articles = defaultdict(set)
for line in (app / "corpus/publiczne/fragments.jsonl").read_text().splitlines():
    fragment = json.loads(line)
    if fragment["documentId"] != "uz":
        continue
    lemmas = set()
    for word in re.findall(r"\b[a-ząćęłńóśźż]{4,}\b", fragment["sourceText"]):
        base = forms.get(word, word)
        lemmas.add(base)
        spellings[base][word] += 1
    occurrences.update(lemmas)
    articles[fragment["locator"]].update(lemmas)

# Only unambiguous prefixes can select a word; high-frequency terms cannot distinguish a condition.
prefixes = defaultdict(set)
for word in sorted(set(forms) | set(spellings)):
    base = forms.get(word, word)
    if base in spellings:
        for length in range(5, 9):
            prefixes[word[:length]].add(base)
terms = {}
common = set()
for key, candidates in sorted(prefixes.items()):
    if len(candidates) == 1 and not any(key[:n] in terms for n in range(5, len(key))):
        base = next(iter(candidates))
        word = spellings[base].most_common(1)[0][0]
        terms[key] = word
        if occurrences[base] > 12:
            common.add(word)
# A programme emits only words printed in its own publication. Store the most
# frequent spelling for each lemma and the shortest unambiguous matching prefixes.
publications = {"zus-dom", "zus-praca", "zus-aktywnie-w-zlobku", "zus-dobry-start", "zus-800"}
offer_forms = defaultdict(lambda: defaultdict(Counter))
offer_df = defaultdict(Counter)
for line in (app / "corpus/oferta/fragments.jsonl").read_text().splitlines():
    fragment = json.loads(line)
    doc = fragment["documentId"]
    if doc not in publications:
        continue
    seen = set()
    for token in re.findall(r"\b[^\W\d_]{4,}\b", fragment["sourceText"]):
        if not token.islower() and token.lower() not in {"ezus", "eksmoon", "efta", "krus"}:
            continue
        word = token.lower()
        base = forms.get(word, word)
        offer_forms[doc][base][word] += 1
        seen.add(base)
    offer_df[doc].update(seen)

offer_terms = {}
for doc, by_base in offer_forms.items():
    aliases = defaultdict(set)
    for word in sorted(set(forms) | set(by_base)):
        base = forms.get(word, word)
        if base in by_base:
            for length in range(5, 9):
                aliases[word[:length]].add(base)
    groups = defaultdict(list)
    for key, candidates in sorted(aliases.items()):
        if len(candidates) == 1:
            base = next(iter(candidates))
            if not any(key.startswith(other) for other in groups[base]):
                groups[base].append(key)
    # Ordered by local document frequency. Each row is one public word and its prefixes.
    offer_terms[doc] = [" ".join([by_base[base].most_common(1)[0][0], *groups[base]])
                        for base in sorted(by_base, key=lambda base: (offer_df[doc][base], base))]

public_lemmas = set()
for path in sorted((app / "corpus").glob("*/fragments.jsonl")):
    for line in path.read_text().splitlines():
        text = json.loads(line)["sourceText"].lower()
        public_lemmas.update(forms.get(w, w) for w in re.findall(r"[a-ząćęłńóśźż]{4,}", text))
# The public lexicon can also confirm a related spelling. A shared stem prevents
# a merely topical neighbour from validating an otherwise unfamiliar condition.
related = {base for base, neighbours in lexicon["neighbors"].items()
           if any(n in public_lemmas and base[:4] == n[:4] for n in neighbours)}
public_lemmas.update(related)
article_terms = [" ".join(sorted(spellings[base].most_common(1)[0][0] for base in lemmas if occurrences[base] <= 12))
                 for lemmas in articles.values()]
programme_stems = {w[:5] for w in set(forms) | public_lemmas if forms.get(w, w) in public_lemmas}
out = app / "src/lib/rag/public-legal-vocabulary.json"
out.write_text(json.dumps({"offerTerms": offer_terms, "articles": article_terms, "statuteStems": " ".join(sorted({key[:5] for key in prefixes})), "terms": terms, "common": sorted(common), "programmeStems": " ".join(sorted(programme_stems))}, ensure_ascii=False, sort_keys=True, indent=2) + "\n")
