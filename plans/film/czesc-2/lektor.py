"""Generate missing ElevenLabs takes, retaining character times for editing."""
import base64
import http.client
import json
import re
import sys
from pathlib import Path
from runpy import run_path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
voice = run_path(str(HERE.parent / "montaz/glosy.py"))["VOICES"]["narrator"]
lines = {"proba-a": "Za listopad trzy tysiące czterysta dwadzieścia trzy złote.",
         "proba-b": "Przełączmy. Teraz cztery tysiące dwieście."}
table = (ROOT / "PLAN-FILMU-DEMO.md").read_text().split("### Scenopis nagrania i polski lektor")[1].split("**Próba")[0]
for n, sentence in enumerate(re.findall(r'\| „(.+)” \|', table), 1):
    lines[f"{n:02}"] = sentence
assert len(lines) == 12
key = next(row.split("=", 1)[1].strip().strip("\"'") for row in (ROOT / ".env.elevenlabs.local").read_text().splitlines() if row.startswith("ELEVENLABS_API_KEY="))
for name in sys.argv[1:]:
    out = HERE / "glos" / (name + ".mp3")
    if out.exists():
        continue
    body = dict(text=lines[name], language_code="pl", model_id="eleven_multilingual_v2",
                voice_settings=dict(stability=.59, similarity_boost=.76, speed=1.05))
    conn = http.client.HTTPSConnection("api.elevenlabs.io", timeout=75)
    conn.request("POST", f"/v1/text-to-speech/{voice}/with-timestamps", json.dumps(body),
                 {"xi-api-key":key, "Content-Type":"application/json"})
    res = conn.getresponse()
    if res.status != 200:
        raise SystemExit(f"{name}: HTTP {res.status} {res.read(320).decode(errors='replace')}")
    data = json.load(res)
    out.with_suffix(".json").write_text(json.dumps(data["alignment"], ensure_ascii=False))
    out.write_bytes(base64.b64decode(data["audio_base64"]))
    print(name, flush=True)
