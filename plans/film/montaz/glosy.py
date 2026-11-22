"""Generate only missing takes. Usage: python3 glosy.py [take ...]"""
import argparse
import http.client
import json
from pathlib import Path

FILM = Path(__file__).resolve().parents[1]
VOICES = {"marta": "EXAVITQu4vr4xnSDxMaL", "pawel": "iP95p4xoKVk53GoZ742B",
          "pracownica": "XrExE9yKIg1WjnnlVkGX", "narrator": "onwK4e9ZLuTAKqWW03F9"}
# Each entry is one complete utterance, independent of picture cuts.
TAKES = [
    ("narodziny", "marta", 2.0, "Patrz, jak cię trzyma."),
    ("wyplata", "marta", 5.9, "Ile nam właściwie wypłacą?"),
    ("druki", "marta", 8.0, "Na pewno wziąłeś dobre?"),
    ("chyba", "pawel", 10.15, "Chyba tak."),
    ("oboje", "marta", 11.65, "A jak oboje z nią zostaniemy, to oboje dostaniemy zasiłek?"),
    ("strona", "pawel", 15.95, "Nie wiem. Czytałem na stronie ZUS-u. Tyle tego było, że już nie wiedziałem, co nas dotyczy."),
    ("okienko", "pracownica", 21.8, "To jest wniosek o zasiłek. A o urlop składacie w pracy. Przy tej dacie macie czas do jutra."),
    ("kanapa", "marta", 29.3, "Już mi się myli, który jest który."),
    ("kadry", "pawel", 32.0, "Wezmę jutro wolne. Zawiozę poprawiony wniosek do kadr."),
    ("marka", "narrator", 38.05, "Po to stworzyliśmy Przewodnik Rodzica."),
    ("login", "narrator", 40.4, "Marta loguje się mObywatelem."),
    ("mapa", "narrator", 42.25, "Na mapie Oli widzi, co już załatwili i co trzeba zrobić teraz."),
    ("pytanie", "narrator", 46.2, "O wspólny urlop pyta Zusika, naszego asystenta ej-aj."),
    ("zrodlo", "narrator", 50.2, "I pokazuje, skąd to wie."),
    ("wniosek", "narrator", 52.0, "Pomaga jej wypełnić wniosek, dołączyć odpis aktu urodzenia i sprawdzić, do kogo trafi dokument."),
    ("final", "narrator", 57.9, "I tak z każdym innym dokumentem."),
]
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--spokojnie", action="store_true")
    parser.add_argument("kwestie", nargs="*")
    args = parser.parse_args()
    wanted = args.kwestie
    directory = FILM / "v1" / ("duble-spokojne" if args.spokojnie else "kwestie")
    directory.mkdir(exist_ok=True)
    key_file = FILM.parents[1] / ".env.elevenlabs.local"
    key = next(line.partition("=")[2].strip().strip("\"'") for line in key_file.read_text().splitlines()
               if line.startswith("ELEVENLABS_API_KEY="))
    for name, role, _, line in TAKES:
        dest = directory / (name + ".mp3")
        if dest.exists() or (wanted and name not in wanted):
            continue
        body = json.dumps(dict(text=line, model_id="eleven_multilingual_v2", language_code="pl",
            voice_settings=dict(stability=.59 if args.spokojnie else .46, similarity_boost=.76, speed=1.0 if args.spokojnie else 1.14)))
        conn = http.client.HTTPSConnection("api.elevenlabs.io", timeout=50)
        conn.request("POST", "/v1/text-to-speech/" + VOICES[role], body,
                     {"xi-api-key":key, "Content-Type":"application/json","Accept":"audio/mpeg"})
        res = conn.getresponse()
        data = res.read()
        if res.status != 200 or not res.getheader("content-type","").startswith("audio/"):
            try:
                error = json.loads(data)["detail"]["status"]
            except (ValueError, KeyError, TypeError):
                error = "invalid_audio"
            raise SystemExit(f"{name}: HTTP {res.status} {error}")
        temp = dest.with_suffix(".part")
        temp.write_bytes(data)
        temp.replace(dest)
        print(name, flush=True)
