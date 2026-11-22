const ease = (f, a, b) => {
  const t = Math.max(0, Math.min(1, (f - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

export const restingRoom = k => k.salon();

function projectedFolder(k, x, y, angle, depth) {
  return `<g transform="translate(${x} ${y}) scale(1 ${depth})">${k.folder(0, 0, 190, angle, 0)}</g>`;
}

export const restingFolder = k => projectedFolder(k, 621, 526, -5, .48);

function room(k, left, right, impact) {
  const base = restingRoom(k);
  if (!left && !right && !impact) return base;
  // Keep both armrests and the pram outside the moving patch of upholstery.
  return base + `<defs><clipPath id="s15-upholstery"><path d="M212 421H966V559H212Z"/></clipPath></defs>
    <g clip-path="url(#s15-upholstery)">
      <path d="M210 420H968V560H210Z" fill="#b7c9b3"/>
      <path d="M207 449 Q267 442 314 442 C365 442 386 ${440+left} 427 ${441+left}
        S510 441 553 441 Q637 438 687 442 C733 442 758 ${443+right} 800 ${445+right}
        S899 448 972 451 L972 534 Q901 534 875 ${534+right*.28}
        Q804 ${534+right*.88} 733 ${534+right*.28} Q650 534 532 534
        Q475 ${534+left*.72} 427 ${534+left*.88} T316 534 H207Z"
        fill="#cfddca" stroke="#283754" stroke-width="2.7"/>
    </g>
    <g fill="none" stroke="#819784" stroke-width="2.1" stroke-linecap="round">
      <path opacity="${left/20}" d="M329 ${523+left*.35}q26 0 43 ${left*.45}m102 1q18 -2 38 -7"/>
      <path opacity="${right/23}" d="M698 ${521+right*.35}q22 1 36 ${right*.4}m128 0q15 -1 31 -6"/>
      <path opacity="${impact}" d="M515 584q14 1 24 6q12 -3 23 -4"/>
    </g>`;
}

function planted(k, role, pose) {
  if (pose.y === 490) return k.person(role, pose);
  const id = 's15-' + role;
  const legScale = (490 + 147 * pose.s - pose.y) / (147 * pose.s);
  return `<defs><g id="${id}">${k.person(role, pose)}</g>
    <clipPath id="${id}-top"><rect width="1280" height="${pose.y}"/></clipPath>
    <clipPath id="${id}-bottom"><rect y="${pose.y}" width="1280" height="300"/></clipPath></defs>
    <g transform="translate(0 ${pose.y*(1-legScale)}) scale(1 ${legScale})"><use href="#${id}" clip-path="url(#${id}-bottom)"/></g>
    <use href="#${id}" clip-path="url(#${id}-top)"/>`;
}

export function scene(f, k) {
  const lay = ease(f, 6, 27), release = ease(f, 25, 43);
  const x = f <= 6 ? 608 + f : 614 + 7 * lay;
  const y = f <= 6 ? 434 + 6*f : 470 + 56 * lay + 3*Math.sin(Math.PI*lay);
  const depth = 1 - .52 * lay, angle = -8 + 3 * lay;
  const left = 20 * (ease(f, 6, 17) - ease(f, 18, 38));
  const right = 23 * (ease(f, 11, 24) - ease(f, 25, 44));
  const impact = ease(f, 5, 7) - ease(f, 9, 18);

  const martaY = 450 + 40*ease(f, 0, 18) + 9*(ease(f, 7, 18)-ease(f, 19, 38));
  const pawelY = 452 + 38*ease(f, 4, 25) + 10*(ease(f, 13, 25)-ease(f, 26, 44));
  const reach = ease(f, 29, 54), settle = ease(f, 9, 43);
  const marta = planted(k, 'marta', {
    x:427, y:martaY, s:1.16, seat:true, lean:mix(10,3,settle), head:mix(1,6,ease(f,16,37)),
    gaze:mix(.55,.9,ease(f,16,24)), gazeDown:.9,
    blink:ease(f,19,21)-ease(f,21,24), left:[-64,-40,-49,-8],
    right:[mix(60,66,reach),mix(-40,-23,reach),mix(54,85,reach),mix(-9,1,reach)]
  });

  const wx = mix(x+61, 800+48*1.16, release);
  const wy = mix(y-63*depth, pawelY-7*1.16, release);
  const hx = (wx-800)/1.16, hy = (wy-pawelY)/1.16;
  const elbowX = mix(hx+22/1.16,74,release), elbowY = mix(hy-22*Math.sqrt(3)/1.16,-46,release);
  const grip = f < 31 ? 'hold' : 'open';
  const pawel = planted(k, 'pawel', {
    x:800, y:pawelY, s:1.16, seat:true, lean:mix(-16,-4,settle), head:mix(-16,-9,ease(f,19,46)),
    gaze:-.85, gazeDown:1, blink:ease(f,34,36)-ease(f,36,39),
    left:[-64,-35,-64,-8], right:[elbowX,elbowY,hx,hy], rightGrip:grip
  });
  const gripAngle = Math.atan2(hy-elbowY,hx-elbowX)*180/Math.PI+5;
  const sleeve = `<g transform="translate(${wx} ${wy}) rotate(${gripAngle-5})">
    <path d="M-36 0H-2" stroke="#283754" stroke-width="33.64" stroke-linecap="round"/>
    <path d="M-36 0H-2" stroke="#2d3950" stroke-width="27.84" stroke-linecap="round"/>
    <path d="M-10 -12.76l5 1v23l-5 1Z" fill="#f5faf7" stroke="#283754" stroke-width="1.86"/></g>`;
  const onCover = f < 43 ? sleeve+k.hand(wx,wy,f<=25 ? 125 : gripAngle,mix(1.247,1.16*.86,release),grip) : '';
  return room(k,left,right,impact) + marta + pawel + projectedFolder(k,x,y,angle,depth) + onCover;
}
