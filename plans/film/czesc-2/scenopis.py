"""Absolute edit positions are relative to the start of part two, in seconds."""
cuts=[]; camera=[]; labels=[]
frame=0
def shot(end,take,a,b):
    global frame
    next_frame=round(end*30)
    if isinstance(a,str): a=t(take,a)
    if isinstance(b,str): b=t(take,b)
    assert next_frame>frame,(end,frame)
    cuts.append([take,a,b,next_frame-frame])
    frame=next_frame
def cam(time,zoom,take,at):
    point=xy(take,at) if isinstance(at,str) else at
    camera.append([time,zoom,*point])
def offset(take,at,delta):
    return t(take,at)+delta
def caption(a,b,key,value=""):
    labels.append([a,b,key,value])

narr=[("01",.17,6.72),("02",7.1,13.65),("03",21.12,5.6),("04",27.08,15.75),("05",43.15,13.6),
      ("06",57.08,19.68),("07",77.05,14.73),("08",92.08,12.73),("09",105.05,6.76),("10",112.12,5.62)]
tempo=max(1,duration(voices/"06.mp3")/narr[5][2])
switch=57.08+phrase("06","Przełączmy")/tempo
amount=57.08+phrase("06","cztery tysiące")/tempo
shot(7,"01",offset("01","landing",.55),"login")
shot(13.4,"01",offset("01","card",-1.0),"import-aim")
shot(14.8,"01","import-aim","profile")
shot(20.85,"01","parents","map-aim")
shot(23.9,"01","map-aim",offset("01","axis",1.5))
shot(27,"01",offset("01","case-aim",-.45),offset("01","case",2.05))
wide=(960,540)
cam(0,1,"01",wide)
chat="02-odpowiedz"
shot(28.35,"02",1.35,"open")
shot(32.6,chat,"question",offset(chat,"send",0.30))
shot(38.25,chat,"reply",offset(chat,"reply",5.3))
shot(39.45,chat,offset(chat,"citation-aim",-.35),offset(chat,"citation",.35))
shot(43,chat,"source",offset(chat,"source",3.35))
cam(32.55,1.35,chat,"reply")
cam(38.25,1.35,chat,"source")
cam(42,1,chat,wide)
shot(45.6,"03","calculator-aim",offset("03","date",.7))
shot(49.1,"03","employment0-aim","known0")
shot(52.8,"03","input0-aim",offset("03","basis0",.55))
shot(55.4,"03","employment1-aim",offset("03","basis1",.45))
shot(57,"03","averaged-aim",offset("03","averaged",.22))
shot(60,"03","table-aim","first");shot(switch-1.2,"03","first",offset("03","first",1.5))
shot(switch,"03",offset("03","switch-aim",-.20),"switch")
shot(switch+1.15,"03","switch","second-result")
shot(77,"03","second-result",offset("03","second-result",1.59))
cam(59.45,1.43,"03","first")
cam(switch-1.48,1,"03",wide)
cam(switch+.35,1.43,"03","second-result")
cam(75.8,1,"03",wide)
caption(60.1,switch-1.2,"Listopad 2026 · Marta","3 423 zł brutto")
caption(switch-1.2,switch+1.15,"Sposób wypłaty","100%, potem 70%")
caption(switch+1.15,77,"Listopad 2026 · Marta","4 200 zł brutto")
assert amount>switch+1.15+.45
shot(78.55,"03","back815-aim","save-aim");shot(80.1,"03","save-aim",offset("03","save",.95))
shot(83.8,"03","plan-aim",offset("03","deadline",1.75))
shot(86,"03","documents-aim","recipient");shot(87.6,"03","recipient",offset("03","recipient",1.8))
shot(88.9,"03",offset("03","pdf-preview",-.9),offset("03","pdf-preview",.45))
shot(90.45,"03","draft-aim","draft");shot(92,"03","saved",offset("03","saved",1.3))
cam(84.9,1.32,"03",(665,754))
cam(87.25,1,"03",wide)
shot(94.05,"04","profile-aim","ezla");shot(95.8,"04","insurance-aim","ask")
shot(98.8,"04","upload","file");shot(101.3,"04","read",offset("04","read",1.55))
shot(105,"04","original",offset("04","page",1.85))
caption(81.5,83.8,"Termin wniosku","1 grudnia 2026")
caption(86,87.6,"Odbiorca","Kadry lub ZUS")
caption(92,96.7,"Osobny przykład · ubezpieczenie")
caption(96.7,99.6,"Wybrany plik","akta-demonstracyjne.pdf")
caption(99.6,105,"Osobny przykład · ubezpieczenie","Strona 1")
shot(107.5,"05","rate",offset("05","rate",1.65));shot(108.8,"05","check-aim","check");shot(112,"05","tested",offset("05","tested",1.95))
caption(109.15,112,"Sprawdzenie szkicu","6 z 6 zgodnych")
shot(114.4,"03","first",offset("03","first",1.4));shot(118,"03","saved",offset("03","saved",1.95))
caption(112,114,"Listopad 2026 · Marta","3 423 zł brutto")
caption(114,118,"Przewodnik Rodzica","straylight-hacknation.vercel.app")
fx=[13.6,switch,90.45]
