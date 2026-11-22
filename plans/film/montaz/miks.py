"""Build aligned mono stems at native voice speed. Requires numpy, soundfile and ffmpeg."""
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from glosy import FILM, TAKES

RATE = 48000
N = RATE * 60
OUT = FILM / "v1/sciezki"
OUT.mkdir(exist_ok=True)
assets = FILM / "montaz/assets"
tracks = {n: np.zeros(N) for n in ("dialog", "narrator", "muzyka", "otoczenie", "efekty")}
rng = np.random.default_rng(2120)

def decode(path):
    return np.frombuffer(subprocess.check_output(["ffmpeg","-loglevel","error","-i",str(path),
        "-ac","1","-ar",str(RATE),"-f","f32le","-"]), dtype="<f4").astype(float)

def put(stem, at, sound):
    start = round(at * RATE)
    end = min(N, start + len(sound))
    tracks[stem][start:end] += sound[:end-start]

def time(seconds):
    return np.arange(round(RATE*seconds))/RATE

def env(t, length, attack, release):
    return np.minimum(1,t/attack)*np.minimum(1,(length-t)/release)

# Only spacing changes after casting. Leave each word, breath and vowel at its recorded speed.
starts = {"login":40.12, "mapa":42.41, "pytanie":46.25,"zrodlo":50.10,"wniosek":51.71,"final":57.92}
for name, role, at, _ in TAKES:
    voice = decode(FILM / "v1/kwestie" / (name + ".mp3"))
    voice *= .81 / max(.1,np.max(np.abs(voice)))
    at = starts.get(name, at)
    if round(at*RATE)+len(voice)>N:
        assert np.max(np.abs(voice[N-round(at*RATE):]))<.004, "Voiced ending is clipped"
    put("narrator" if role=="narrator" else "dialog", at, voice)

def foley(name, at, gain, dur=None):
    a=decode(assets / (name+".wav"))
    if dur: a=a[:round(dur*RATE)]
    a*=gain/max(.01,np.max(np.abs(a)))
    fade=min(len(a),round(.009*RATE))
    a[-fade:]*=np.linspace(1,0,fade)
    put("efekty",at,a)

foley("klik",3.805,.16)
foley("numerek",20.21,.073,.94)
for at,gain,duration in [(8.3,.053,.38),(10.15,.055,.43),(18.35,.045,.48),(22.49,.048,.63),
                        (26.85,.05,.47),(30.11,.075,.56),(34.91,.081,.63),(36.03,.12,.44),(36.46,.31,1.27)]:
    foley("szelest",at,gain,duration)
foley("teczka",28.20,.21)
foley("teczka",33.90,.105)
foley("klik",37.708,.54)
foley("teczka",55.40,.14,.15)
foley("szelest",58.40,.10,.87)

# Hospital breathing, a distant wheel, then different room tones on either side of the cut.
for at,length,gain,freq in [(0,3.81,.026,230),(4.2,.63,.035,642),(16.08,.53,.030,610)]:
    t=time(length)
    if at==0:
        air=np.convolve(rng.normal(size=len(t)),np.ones(24)/24,mode="same")
        wave=air*(.1+.9*np.sin(np.pi*t/length)**2)
    else:
        wave=np.sin(2*np.pi*freq*t+3*np.sin(2*np.pi*8*t))*.45
    put("otoczenie",at,gain*wave*env(t,length,.13,.19))
for at,end,gain in [(4,28.1,.009),(28,37.72,.004)]:
    t=time(end-at)
    bed=np.convolve(rng.normal(size=len(t)),np.ones(46)/46,mode="same")+.13*np.sin(2*np.pi*99.7*t)
    put("otoczenie",at,bed*gain*env(t,end-at,.32,.35))

# Felt-key motif. One quarter note per second, with rests to leave room around narration.
pitches=[62,None,69,66,64,None,69,None,62,None,66,69,71,None,69,64,66,None,62,None,57,None]
for beat,note in enumerate(pitches):
    if note is None: continue
    t=time(1.7); hz=440*2**((note-69)/12)
    bell=np.sin(2*np.pi*hz*t)+.26*np.sin(2*np.pi*2*hz*t)*np.exp(-3*t)
    put("muzyka",38.23+beat,.026*bell*np.exp(-2.8*t)*env(t,1.7,.019,.23))
mix=sum(tracks.values())
assert np.max(np.abs(mix))<.99
for name,a in {**tracks,"miks":mix}.items():
    sf.write(OUT/(name+".flac"),a,RATE,subtype="PCM_16")
