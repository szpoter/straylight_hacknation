"""Place decoded mono narration on a fixed 48 kHz stereo timeline."""
import json
import subprocess
import sys
from pathlib import Path
import numpy as np

cfg=json.load(sys.stdin)
rate=48000
n=round(cfg["length"]*rate)
film=Path(__file__).resolve().parent.parent
def pcm(file,*options):
    data=subprocess.check_output(["ffmpeg","-loglevel","error","-i",str(file),*options,"-ar",str(rate),"-ac","2","-f","f32le","-"])
    return np.frombuffer(data,"<f4").reshape(-1,2)
def gain(signal,db):
    active=signal[np.abs(signal)>np.max(np.abs(signal))*.04]
    assert len(active)>0
    return 10**(db/20)/np.sqrt(np.mean(active**2))
def put(buffer,track,start):
    count=min(len(track),len(buffer)-start)
    buffer[start:start+count]+=track[:count]
music=pcm(film/"v3/media/muzyka.flac","-ss","40","-t","16")
music=music*gain(music,-40)
mix=np.tile(music,(1+n//len(music),1))[:n].copy()
mix[-rate//2:]*=np.linspace(1,0,rate//2)[:,None]
voice=np.zeros_like(mix)
for file,start,tempo in cfg["speech"]:
    line=pcm(file,"-af",f"atempo={tempo:.8f}")
    put(voice,line*gain(line,-20),round(start*rate))
assert np.max(np.abs(voice))>.1
mix+=voice
click=pcm(film/"montaz/assets/klik.wav")
for start in cfg["clicks"]:
    put(mix,click*gain(click,-34),round(start*rate))
mix*=min(1,.93/np.max(np.abs(mix)))
subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(rate),"-ac","2","-i","-","-c:a","flac",cfg["out"]],input=mix.astype("<f4").tobytes(),check=True)
