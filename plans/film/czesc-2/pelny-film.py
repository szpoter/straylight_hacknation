"""Join the approved 60-second master to the 118-second HyperFrames export."""
from pathlib import Path
import json
import subprocess
import tempfile

here=Path(__file__).resolve().parent
first=here.parent/"v3-flow/przewodnik-rodzica-B-1080p.mp4"
part=here/"demo-118s-1080p.mp4"
final=here/"przewodnik-rodzica-2m58s.mp4"
def ff(*args):
    subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",*map(str,args)],check=True)
def verify(file,frames):
    meta=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-of","json",str(file)]))
    v,a=meta["streams"]
    assert (v["width"],v["height"],v["r_frame_rate"],int(v["nb_frames"]))==(1920,1080,"30/1",frames)
    assert a["codec_type"]=="audio" and abs(float(a["duration"])-frames/30)<.04
with tempfile.TemporaryDirectory() as tmp:
    tmp=Path(tmp)
    import sys
    intro=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else tmp/"intro.mp4"
    if len(sys.argv)==1:
        ff("-i",first,"-map","0:v:0","-an","-c:v","libx264","-threads","5","-crf","16","-preset","veryfast","-pix_fmt","yuv420p","-video_track_timescale","15360",intro)
    verify(part,3540)
    ff("-i",part,"-an","-c:v","copy","-video_track_timescale","15360",tmp/"part.mp4")
    (tmp/"list.txt").write_text(f"file '{intro}'\nduration 60\nfile '{tmp/'part.mp4'}'\n")
    ff("-f","concat","-safe","0","-i",tmp/"list.txt","-i",first,"-i",here/"projekt/miks.flac",
       "-filter_complex","[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=60[a];[2:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=118[b];[a][b]concat=n=2:v=0:a=1[m]",
       "-map","0:v","-map","[m]","-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart",tmp/"final.mp4")
    verify(tmp/"final.mp4",5340)
    import shutil
    shutil.move(tmp/"final.mp4",final)
print(final)
