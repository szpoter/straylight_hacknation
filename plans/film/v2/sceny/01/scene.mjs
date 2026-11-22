const ink = '#283754', hair = '#303c51', skin = '#ffebdb', shadow = '#ead3c1';
const cream = '#fffdf4', sage = '#afc8ac', navy = '#354359';
const path = (d, fill = 'none', stroke = ink, w = 3) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const oval = (x,y,rx,ry,color) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}"/>`;
const group = (t,body) => `<g transform="${t}">${body}</g>`;
const ease = (f,a,b) => { const p = Math.min(1,Math.max(0,(f-a)/(b-a))); return p*p*(3-2*p); };

function room(k) {
  return k.ward()
    + path('M0 0H1280V540Q1000 513 760 537L0 567Z','#f5faf7','none')
    + path('M890 0v239h370V0Z','#fdfcf3','#becfc3',3)
    + path('M900 0h349v227H900Z','#e5efe9','none')
    + path('M906 204q91 -68 154 -52q28 -39 68 -26q61 -51 120 -27v127H905Z','#d5e3d8','none')
    + path('M1064 0v232m-165 -140h352M883 239h384v10H882Z','#e7eee5','#b8c9be',3)
    + path('M0 136h323q9 0 9 8v36q0 7 -10 7H0','#e8ede3','#aabeb1',2)
    + path('M0 145h320M87 155h36v20H87Zm52 0h38v20h-38Zm54 0h41v20h-41Z','#f9faf1','#bccbc0',1.8)
    + [105,158,213].map(x=>oval(x,165,4,4,'#879d91')).join('')
    + path('M10 405q48 -107 96 -165q13 -15 33 -12l82 19q18 5 16 25l-6 186Z','#c5d7c9','#788c84',2.8)
    + path('M0 480q39 -82 116 -181q16 -25 49 -23q111 1 211 100l68 118q-22 59 -129 119L0 578Z','#fffff6','#a3b3a8',3)
    + path('M26 484q81 -155 130 -192q85 -7 167 63m-224 42q16 -32 43 -45','none','#c9d4c8',2)
    + path('M0 565q138 -124 306 -74l350 74q159 -13 309 52l158 103H0Z','#ece9d9',ink,3);
}

function martaHead(f) {
  const look = ease(f,24,44), blink = 1-ease(Math.abs(f-17),0,3.3);
  return group(`translate(319 277) rotate(${13+4*look})`,
    oval(-56,-5,42,38,hair)
    + path('M-79 -21q-31 7 -24 33q5 13 16 18','none',ink,2.5)
    + path('M-37 39q3 28 -33 51q4 20 39 27q24 6 53 -17L20 55Z',skin)
    + path('M-40 29q1 25 25 46q12 10 29 10l5 -20Z',shadow,'none')
    + path('M-58 -34q13 -57 78 -53q58 5 64 55q4 24 -10 50q-3 9 -2 17q-1 7 -13 8q-19 46 -58 36q-32 -6 -46 -38q-16 -3 -21 -19q-2 -13 11 -17Z',skin)
    + path('M-59 3q-22 -11 -23 -43q-2 -48 29 -71q39 -33 87 -14q42 15 46 53q16 19 1 53q-3 -35 -25 -50q-30 41 -92 52q-12 -12 -20 -2Z',hair)
    + path('M-72 -46q9 -38 43 -50m-30 42q21 -27 47 -35','none','#596678',2)
    + path('M-46 5q-12 -10 -15 2q-2 12 11 18','none','#846f68',2.1)
    + path('M6 -9q14 -9 24 -5m22 -3q10 -6 18 0','none',ink,3.1)
    + group(`rotate(${12+look*8} 26 6)`,oval(24+look*2,9,4,Math.max(1,6.6*(1-blink)),ink))
    + group('rotate(24 59 1)',oval(61+look,2,3.5,Math.max(1,5.8*(1-blink)),ink))
    + path('M49 15q2 8 6 10q-2 4 -7 4','none','#ae8d7c',2)
    + path('M33 46q10 5 19 -2','none',ink,2.6)
  );
}

function baby() {
  return path('M360 439q-8 -35 13 -64q21 -30 62 -31q47 0 63 34q15 28 -2 57l-47 35Z',cream)
    + path('M367 420q-1 -40 31 -58q39 -21 72 1','none','#d6d8c6',2)
    + path('M385 404q8 -42 48 -45q38 -1 56 33q6 11 4 17q9 7 10 12q-1 6 -12 7q-10 21 -33 26q-32 8 -56 -10q-11 -6 -15 -18q-15 -4 -14 -13q2 -10 12 -9Z',skin)
    + path('M435 362q4 13 12 9q7 -5 -2 -7','none',ink,2)
    + path('M436 407q8 8 16 -1m18 -5q6 5 12 -2','none',ink,2.8)
    + path('M465 422q5 2 7 -2m-13 13q5 2 9 -1','none','#8e776c',1.9)
    + path('M387 425q-25 1 -45 30q-18 32 7 58q38 37 126 49q74 8 107 -11q17 -12 4 -31q-35 -59 -93 -86q-32 -3 -60 9q-31 -17 -46 -18Z',cream)
    + path('M343 477q40 -43 98 -28q75 18 135 71l6 11q-77 -53 -145 -66q-49 -10 -98 30Z',sage,'none')
    + path('M433 444q43 15 70 39m33 50q23 9 37 10','none','#b8bda9',2.2);
}

function pawelHead(f) {
  const nod = ease(f,7,30), look = ease(f,0,15);
  return group(`translate(${891-19*nod} ${203+12*nod}) rotate(${-7-7*nod})`,
    path('M-21 45q15 32 -3 57q25 30 65 6l9 -29q-24 -17 -20 -49Z',skin)
    + path('M-14 60q13 17 37 16l4 -24Z',shadow,'none')
    + path('M-54 -42q31 -53 77 -34q43 18 39 65q2 28 -19 54q-11 23 -44 28q-33 5 -47 -24q-6 -10 -8 -20q-15 -3 -14 -12l9 -13q-11 -25 7 -44Z',skin)
    + path('M-63 -20q-8 -17 -2 -37l-13 5q1 -18 22 -32l-9 -1q20 -21 51 -21q34 -3 52 10l-5 -12q28 4 44 32q16 26 6 58q-4 17 -20 31l-8 -28q1 -16 -10 -11l-10 10q-7 -11 -10 -30q-25 -8 -37 -27q-11 20 -41 29l9 -14Z',hair)
    + path('M-44 -75q18 -13 41 -14m24 4q23 5 36 22','none','#596678',2.3)
    + path('M44 1q13 -15 18 -1q2 14 -14 22','none','#947f71',2)
    + path('M-47 -3q8 -6 18 -4m13 1q13 -8 25 -2','none',ink,3)
    + oval(-40-2*look,6+3*look,3.3,5.1,ink)+oval(-2-3*look,6+3*look,4,6,ink)
    + path('M-27 15q-2 7 -6 11q3 4 9 2','none','#ab8c7b',2)
    + path('M-28 43q12 6 22 -3','none',ink,2.8)
    + path('M-17 54l2 -3m5 3 2 -4m7 2 1 -3','none','#a89587',1.7)
  );
}

export function scene(f,k) {
  const reach = ease(f,12,54), nod = ease(f,7,30);
  const breath = -5*Math.sin(Math.PI*ease(f,0,55));
  const gap = 240*(1-reach);
  const ox = 496, oy = 346+breath, s = .48;
  const wristX = ox+(400+gap)*s, wristY = oy+88*s;
  const elbowX = 929-69*reach, elbowY = 486-16*reach;
  const shoulderX = 934-24*nod, shoulderY = 340+9*nod;
  const father = path(`M1019 720q26 -94 6 -217q8 -118 -54 -172q-28 -25 -72 -36q-30 -5 -65 10q-56 44 -71 108l-30 211l7 96Z`,navy)
    + path('M847 305q27 15 50 15l42 -2q-4 12 -20 22q-58 19 -91 -16Z','#f9f7ee')
    + path('M808 346q-26 45 -37 113m234 92q-15 51 -13 72','none','#596779',2.4)
    + pawelHead(f);
  const mother = path('M32 646q47 -83 98 -168q42 -87 98 -113q26 -15 50 -11q45 22 97 14q40 20 80 75l133 165l-52 81Z',sage)
    + path('M242 361q48 54 111 44q20 -4 31 -14l-15 -27l-85 -10Z','#f5f1df',ink,2.5)
    + path('M143 481q26 -56 57 -75m10 3q-15 39 -13 53m165 -44q31 26 43 48','none','#839d87',2)
    + martaHead(f);
  const cradle = path('M173 479q31 -16 67 -2q20 8 35 28q46 41 103 46q53 7 106 -4l47 -13q13 -1 14 7l-24 11l31 -7q12 0 9 7q-9 8 -36 15l23 -3q8 1 5 7q-22 12 -66 16q-99 23 -191 2q-71 -14 -105 -56Z',skin)
    + path('M485 569q22 -4 36 -10m-16 15 23 -7','none','#a58d7e',1.9)
    + path('M116 487q14 -56 58 -81q45 -2 72 34q11 19 13 38q-40 -7 -69 23l-17 23q-28 -4 -57 -37Z',sage)
    + path('M170 516q35 -51 81 -44','none','#809784',2);
  const blanket = path('M0 571q132 -28 255 22q140 37 281 -24q115 -47 227 -6q70 17 136 75l129 82H0Z','#f0eddf')
    + path('M0 599q139 -25 254 15q131 39 280 -22q108 -39 183 -23','none','#bfc4ac',2.6)
    + path('M660 589q96 -7 163 30m-293 2q-39 30 -55 67','none','#c7cbb6',2.4);
  const arm = path(`M${shoulderX-35} ${shoulderY-19}Q${shoulderX+37} ${shoulderY-22} ${shoulderX+37} ${shoulderY+23}Q${elbowX+39} ${elbowY+20} ${elbowX+3} ${elbowY+24}Q${elbowX-17} ${elbowY+28} ${wristX+1} ${wristY+21}l5 -41Q${elbowX-36} ${elbowY-38} ${elbowX-25} ${elbowY-35}Q${shoulderX-40} ${shoulderY+17} ${shoulderX-35} ${shoulderY-19}Z`,navy)
    + path(`M${wristX-3} ${wristY-21}q9 -3 18 0l-5 43q-10 -1 -16 -4Z`,cream,ink,2.5)
    + path(`M${elbowX-28} ${elbowY-32}q12 13 22 18m-18 -7 16 12`,'none','#687585',2);
  const babySleeve = path('M471 455q12 -6 23 -19q16 11 46 16q-6 15 -19 24q-20 -14 -50 -21Z',cream,ink,2.4)
    + path('M488 454q11 -6 13 -9','none','#c5ccb8',1.8);
  return room(k)+father+mother+group(`translate(0 ${breath})`,baby()+cradle)
    +blanket+group(`translate(${ox} ${oy}) scale(${s})`,k.grasp(0,gap))
    +group(`translate(0 ${breath})`,babySleeve)+arm;
}
