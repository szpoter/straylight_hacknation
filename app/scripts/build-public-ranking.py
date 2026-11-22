"""Regenerate the browser BM25 index using only the three shipped public manifests."""
import base64
import gzip
import hashlib
import json
import re
import struct
from collections import defaultdict
from os.path import commonprefix
from pathlib import Path
from urllib.parse import urlparse

APP = Path(__file__).resolve().parents[1]
CORPUS = APP / "corpus"
OFFICIAL = {"eli.gov.pl", "www.gov.pl", "www.zus.pl", "dziennikustaw.gov.pl", "isap.sejm.gov.pl"}


FACETS = {
    "entitlement": r"przysług|(?:prawo|prawa) do|uprawnion",
    "duration": r"\b(?:dni|dnia|dzień|lat|rok)\b|tygodni|miesi[ąę]|okres",
    "deadline": r"termin|do dnia|w ciągu|najpóźniej|wcześniej|(?:od|do) \d{1,2} ",
    "documents": r"dokument|wniosek|odpis|załącz|zaświadczeni",
    "payer": r"wypłac|płatni",
    "proof": r"stwierdz|potwierdz|orzecze|zaświadcze|dowod|dowód",
    "recipient": r"wypłaca się|odbiorc|rachunek|osob(?:ie|om) uprawnion",
    "rate": r"%|procent",
    "channel": r"papierow|elektroniczn|bankowoś|aplikacj|eZUS|PUE|Emp@tia",
}


def build():
    forms = json.loads(gzip.decompress((CORPUS / "corpus-lexicon.json.gz").read_bytes()))["forms"]
    surfaces = {}
    token_ids = []
    validity = []
    documents = []
    ids = set()

    def append_tokens(text):
        start = len(token_ids)
        for word in re.findall(r"[^\W_]+", text):
            if len(word) > 1 or word.isdigit():
                token_ids.append(surfaces.setdefault(word, len(surfaces)))
        return len(token_ids) - start

    for name in ("marta", "publiczne", "oferta"):
        directory = CORPUS / name
        manifest = json.loads((directory / "manifest.json").read_text())
        sources = {doc["id"]: doc for doc in manifest["documents"]}
        lines = (directory / manifest["fragmentsFile"]).read_text().splitlines()
        if len(lines) != manifest["expectedFragments"]:
            raise ValueError(f"Unexpected fragment count in {name}")
        for line in lines:
            fragment = json.loads(line)
            identifier, body = fragment["logicalId"], fragment["sourceText"]
            doc = sources[fragment["documentId"]]
            url = urlparse(doc["url"])
            digest = hashlib.sha256(" ".join(body.split()).encode()).hexdigest()
            if (identifier in ids or fragment["corpusVersion"] != manifest["corpusVersion"]
                    or digest != fragment["fragmentSha256"] or url.scheme != "https" or url.netloc not in OFFICIAL):
                raise ValueError(f"Invalid public fragment in {name}: {identifier}")
            ids.add(identifier)
            window = [doc["validFrom"], doc["validTo"]]
            if window not in validity:
                validity.append(window)
            heading = " ".join([doc["shortTitle"], fragment["locator"], *fragment["headingPath"], fragment["context"]])
            facets = sum(1 << i for i, pattern in enumerate(FACETS.values()) if re.search(pattern, body, re.I))
            subject = " ".join(fragment["headingPath"][-1:] + body.split()[:12])[:230]
            documents.append([identifier, validity.index(window), append_tokens(body), append_tokens(heading), facets, subject])

    # Store each spelling once, alongside its lemma. Other inflections never occupy the document token stream.
    def base(word):
        return forms.get(word.lower(), word.lower())

    lemmas = sorted({base(word) for word in surfaces})
    by_lemma = {lemma: i for i, lemma in enumerate(lemmas)}
    aliases = defaultdict(list)
    for word, lemma in sorted(forms.items()):
        if lemma in by_lemma and word != lemma:
            aliases[lemma].append(word)
    inflections = []
    for lemma in lemmas:
        words = aliases[lemma]
        if not words:
            inflections.append("")
            continue
        groups = defaultdict(list)
        for word in words:
            groups[word[:3]].append(word)
        encoded = []
        for group in groups.values():
            prefix = commonprefix(group)
            encoded.append(prefix + "|" + " ".join(word[len(prefix):] for word in group))
        inflections.append(";".join(encoded))

    # The dictionary currently fits 16-bit token IDs. struct rejects overflow on regeneration.
    def packed_u16(numbers):
        return base64.b64encode(struct.pack(f"<{len(numbers)}H", *numbers)).decode("ascii")

    return {"facets": list(FACETS), "docs": documents, "validity": validity, "surfaces": list(surfaces), "lemmas": lemmas,
            "inflections": inflections, "surfaceLemmas": packed_u16([by_lemma[base(word)] for word in surfaces]),
            "tokens": packed_u16(token_ids)}


if __name__ == "__main__":
    target = APP / "src/lib/rag/local-public-ranking-index.json"
    target.write_text(json.dumps(build(), ensure_ascii=False, separators=(",", ":")) + "\n")
