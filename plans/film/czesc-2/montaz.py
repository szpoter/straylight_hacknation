"""Prepare the footage cuts, audio stems and editable HyperFrames timeline."""
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
raw = HERE / "surowe"
voices = HERE / "glos"
sample = sys.argv[1] == "proba"
out = HERE / ("projekt-proby" if sample else "projekt")
out.mkdir(exist_ok=True)
def run(*cmd):
    subprocess.run([str(x) for x in cmd], check=True)
def ff(*args):
    run("ffmpeg","-hide_banner","-loglevel","error","-y",*args)
def duration(file):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(file)]))
def marks(take):
    return {m["id"]:m for m in json.loads((raw / (take+".json")).read_text())}
def t(take, label):
    return marks(take)[label]["t"]
def xy(take,label):
    return marks(take)[label]["xy"]
def cut(take,a,b,seconds):
    return [take,a,b,round(seconds*30)]
def phrase(name,word):
    data=json.loads((voices/(name+".json")).read_text())
    return data["character_start_times_seconds"]["".join(data["characters"]).lower().index(word.lower())]

if sample:
    take="proba"
    switch=t(take,"switch")
    result=t(take,"second-result")
    cuts=[cut(take,.2,switch,157/30),cut(take,switch,result+.15,26/30),cut(take,result+.15,duration(raw/"proba.mp4")-.1,3.9)]
    narr=[("proba-a",.18,4.7),("proba-b",5.25,4.65)]
    camera=[[0,1.5,*xy(take,"first")],[4.48,1.18,*xy(take,"switch")],[5.85,1.5,*xy(take,"second-result")]]
    labels=[[0,4.45,"Listopad 2026 · Marta","3 423 zł brutto"],[4.45,6.1,"Sposób wypłaty","100%, potem 70%"],[6.1,10,"Listopad 2026 · Marta","4 200 zł brutto"]]
    fx=[5.25]
else:
    exec((HERE/"scenopis.py").read_text())

length=sum(c[3] for c in cuts)/30
assert length == (10 if sample else 118), length
with tempfile.TemporaryDirectory() as tmp:
    tmp=Path(tmp)
    for i,(take,a,b,frames) in enumerate(cuts):
        assert b>a>=0 and frames>0,(take,a,b,frames)
        ratio=frames/30/(b-a)
        ff("-ss",f"{a:.4f}","-t",f"{b-a:.4f}","-i",raw/(take+".mp4"),"-an","-vf",
           f"setpts=(PTS-STARTPTS)*{ratio:.9f},fps=30,tpad=stop_mode=clone:stop_duration=1,setsar=1","-frames:v",frames,"-c:v","libx264","-threads","4","-preset","veryfast","-crf","15",tmp/f"{i:03}.mp4")
    manifest=tmp/"files.txt"
    manifest.write_text("".join(f"file '{i:03}.mp4'\n" for i in range(len(cuts))))
    ff("-f","concat","-safe","0","-i",manifest,"-c","copy",out/"obraz.mp4")
    tracks=[(str(voices/(name+".mp3")),start,max(1,duration(voices/(name+".mp3"))/room)) for name,start,room in narr]
    mix={"length":length,"speech":tracks,"clicks":fx,"out":str(out/"miks.flac")}
    subprocess.run([sys.executable,str(HERE/"miks.py")],input=json.dumps(mix).encode(),check=True)
shutil.copyfile(HERE.parent/"montaz/node_modules/gsap/dist/gsap.min.js",out/"gsap.min.js")
tags=[]; js=[]
def quote(s): return json.dumps(s,ensure_ascii=False)
for i,(start,end,context,value) in enumerate(labels):
    tags.append(f'<div class="caption" id="c{i}"><span>{context}</span><b>{value}</b></div>')
    js.append(f'tl.set("#c{i}",{{opacity:1}},{start}).set("#c{i}",{{opacity:0}},{end});')
for i,(start,z,x,y) in enumerate(camera):
    tx=max(1728*(1-z),min(0,864-x*.9*z))
    ty=max(972*(1-z),min(0,486-y*.9*z))
    target=f'{{scale:{z},x:{tx:.2f},y:{ty:.2f}'
    if i==0: js.append(f'tl.set("#camera",{target}}},0);')
    else: js.append(f'tl.to("#camera",{target},duration:.35,ease:"power2.inOut"}},{start+.10}).to("#camera",{{filter:"blur(0.9px)",duration:.12}},{start+.10}).to("#camera",{{filter:"blur(0px)",duration:.16}},{start+.28});')
if not sample:
    ff("-sseof","-0.035","-i",HERE.parent/"v3-flow/przewodnik-rodzica-B-1080p.mp4","-frames:v","1",out/"wejscie.png")
    tags.append('<img id="handoff" src="wejscie.png">')
    js.append('tl.fromTo("#frame",{scale:1.11112},{scale:1,duration:1.2,ease:"power2.out"},0).to("#handoff",{yPercent:-105,rotation:-3,duration:.85,ease:"power2.inOut"},.06);')
html="""<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Przewodnik Rodzica</title>
<style>*{box-sizing:border-box}html,body,main{margin:0;width:1920px;height:1080px;overflow:hidden}main{position:relative;background:linear-gradient(135deg,#afd9c0 0%,#f5faf7 53%,#8eabb9 100%)}#frame{position:absolute;left:96px;top:54px;width:1728px;height:972px;border-radius:20px;overflow:hidden;box-shadow:0 16px 54px -12px #233f4940;background:white}#camera,video{width:1728px;height:972px;transform-origin:0 0}video{display:block}.caption{position:absolute;left:128px;bottom:83px;display:flex;align-items:center;gap:26px;padding:16px 30px;background:#f5faf7f8;border:2px solid #adc8b9;border-radius:18px;color:#20382d;box-shadow:0 5px 20px #263e301c;font:500 37px/1.18 Arial,sans-serif;opacity:0}.caption b{font:600 48px/1.18 Georgia,serif}.caption b:empty{display:none}#handoff{position:absolute;inset:0;width:100%;height:100%}</style>
<script src="gsap.min.js"></script></head><body>"""
html+=f'<main data-composition-id="film" data-start="0" data-duration="{length}" data-fps="30" data-width="1920" data-height="1080"><div id="frame"><div id="camera"><video muted playsinline id="take" src="obraz.mp4" data-start="0" data-duration="{length}" data-track-index="0"></video></div></div>'
html+=f'<audio id="mix" data-start="0" data-duration="{length}" data-track-index="1" src="miks.flac"></audio>'
html+="".join(tags)+'</main><script>const tl=gsap.timeline({paused:true});'+''.join(js)+f'tl.to({{}},{{duration:.01}},{length-.01});window.__timelines={{film:tl}};</script></body></html>'
(out/"index.html").write_text(html)
print(out)
