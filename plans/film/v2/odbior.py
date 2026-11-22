"""Verify the scene package and build its browsing index. Run after the 1080p export."""
from pathlib import Path
from urllib.parse import unquote
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parent
MASTER=ROOT/"przewodnik-rodzica-1080p.mp4"
PREVIEW=ROOT/"animacja-720p.mp4"

def run(args):
    subprocess.run(args,check=True)

def check_movie(path,height,frames):
    streams=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-of","json",str(path)]))["streams"]
    v,a=streams
    assert v["codec_name"]=="h264" and v["height"]==height and v["r_frame_rate"]=="30/1",path
    assert v["width"]==height*16//9 and v["pix_fmt"] in ("yuv420p","yuvj420p") and a["codec_name"]=="aac",path
    assert int(v["nb_frames"])==frames and float(a["duration"])==frames/30,path

def validate_documents(folder):
    plan,spec=(folder/n for n in ("PLAN.md","SPEC.md"))
    bodies=[f.read_text() for f in (plan,spec)]
    assert all(len(b)>350 for b in bodies),folder
    text="\n".join(bodies)
    links=re.findall(r'\]\(([^)]+)\)',text)
    examples={l.split("#")[0] for l in links if "github.com/" in l and ("/blob/" in l or "/tree/" in l or "/raw/" in l)}
    gallery=ROOT/"przyklady"
    origins=dict(re.findall(r'\]\(([^)]+)\) \| \[[^\]]+\]\((https://github.com/[^)]+)\)',(gallery/"ZRODLA.md").read_text()))
    for url in links:
        name=unquote(url.split('#')[0].strip('<>'))
        if name and not re.match(r'^\w+:',name):
            source=(folder/name).resolve()
            assert source.exists(),(folder,name)
            if source.parent==gallery and source.name in origins:
                examples.add(origins[source.name])
    assert len(examples)>=2,(folder,examples)
    return re.sub(r'^(?:(?:Ujęcie|Scena)\s+)?\d+\s*[·.\-–—:]?\s*','',bodies[0].splitlines()[0].lstrip('# '),flags=re.I)

def reference_for(i):
    if i<3:return "pozy-postaci.png"
    if i in (3,12,15,19):return "ciagly-ruch.jpg"
    if i<=18:return "fazy-ruchu.png"
    if i in (20,21):return "gest-interfejsu.jpg"
    if i in (22,23,24,25,26):return "ruch-produktu.jpg"
    return "stos-kart.jpg" if i==30 else "budowa-karty.jpg"

def main():
    check_movie(MASTER,1080,1800)
    still=ROOT/'zusik-ostatnia-klatka.png'
    if not still.exists():
        run(["ffmpeg","-v","error","-i",str(MASTER),"-vf","select=eq(n\\,1799)","-frames:v","1","-update","1",str(still)])
    contact=ROOT/'arkusz-30-ujec.jpg'
    if not contact.exists():
        run(["ffmpeg","-v","error","-i",str(MASTER),"-vf","select=eq(mod(n\\,60)\\,30),scale=320:180,tile=5x6","-frames:v","1","-update","1",str(contact)])
    if not PREVIEW.exists():
        run(["ffmpeg","-v","error","-i",str(MASTER),"-vf","scale=1280:720","-c:v","libx264","-g","60","-keyint_min","60","-sc_threshold","0","-crf","16","-preset","fast","-c:a","copy","-movflags","+faststart",str(PREVIEW)])
    check_movie(PREVIEW,720,1800)
    rows=[]
    for i in range(1,31):
        folder=ROOT/"sceny"/f"{i:02d}"
        assert (folder/'scene.mjs').is_file()
        sample=folder/'ujecie-720p.mp4'
        if not sample.exists():
            run(["ffmpeg","-v","error","-ss",str((i-1)*2),"-i",str(PREVIEW),"-ss",str((i-1)*2),"-i",str(ROOT/"media/miks.flac"),"-t","2","-map","0:v","-map","1:a","-c:v","libx264","-crf","16","-preset","veryfast","-c:a","aac","-b:a","160k","-movflags","+faststart",str(sample)])
        check_movie(sample,720,60)
        proofs=folder/'klatki.jpg'
        if not proofs.exists():
            run(["ffmpeg","-v","error","-i",str(sample),"-vf","select=eq(n\\,0)+eq(n\\,20)+eq(n\\,40)+eq(n\\,59),scale=320:180,tile=4x1","-frames:v","1","-update","1",str(proofs)])
        title=validate_documents(folder)
        path=f"sceny/{i:02d}"
        rows.append(f"| {i:02d} | {2*i-2:02d}–{2*i:02d} s | {title} | [Plan]({path}/PLAN.md) · [Specyfikacja]({path}/SPEC.md) | [Ujęcie]({path}/ujecie-720p.mp4) · [Klatki]({path}/klatki.jpg) · [Kod]({path}/scene.mjs) |")
        doc=folder/'SPEC.md'
        body=doc.read_text()
        if '## Załączniki do odbioru' not in body:
            doc.write_text(body.rstrip()+'\n\n## Załączniki do odbioru\n\n'
                +'![Klatki 0, 20, 40 i 59 z ukończonego ujęcia](klatki.jpg)\n\n'
                +f'[Ujęcie z głosem lub dźwiękiem sceny](ujecie-720p.mp4) · [Załączony przykład warsztatowy](../../przyklady/{reference_for(i)}) · [Autorstwo przykładów](../../przyklady/ZRODLA.md)\n')
    (ROOT/"SCENY.md").write_text('# Przewodnik Rodzica · 30 ujęć\n\nKażdy wiersz prowadzi do planu i oddzielnej specyfikacji jednego autora sceny, wykonanego ujęcia, czterech klatek kontrolnych oraz edytowalnego modułu animacji.\n\n[Pełna minuta 1080p](przewodnik-rodzica-1080p.mp4) · [Wersja 720p](animacja-720p.mp4) · [Ostatnia klatka](zusik-ostatnia-klatka.png) · [Projekt HyperFrames](index.html) · [Przykłady z repozytoriów](przyklady/ZRODLA.md)\n\n| Scena | Czas | Akcja | Dokumentacja | Wykonanie |\n| --- | --- | --- | --- | --- |\n'+'\n'.join(rows)+'\n')
    with (ROOT/"SCENY.md").open("a") as guide:
        guide.write('\n[Arkusz wszystkich 30 ujęć](arkusz-30-ujec.jpg)\n')
        guide.write('\n## Dźwięk i montaż\n\n[Próba pracownicy i narratora](../v1/proba-obsady.mp3) · [Dialog](media/dialog.flac) · [Narrator](media/narrator.flac) · [Efekty](media/efekty.flac) · [Otoczenie](media/otoczenie.flac) · [Muzyka](media/muzyka.flac) · [Miks](media/miks.flac)\n\nPo korekcie modułu uruchom z głównego katalogu projektu `node plans/film/v2/build.mjs`. Polecenie `node plans/film/v2/render.mjs 720 19 20 /tmp/korekta-36-40.mp4` eksportuje wyłącznie wskazane dwa ujęcia. Numery scen i nowa nazwa pliku wyznaczają zakres poprawki.\n')
    print('30 wykonanych ujęć, 30 planów, 30 specyfikacji.')
if __name__=='__main__':
    main()
