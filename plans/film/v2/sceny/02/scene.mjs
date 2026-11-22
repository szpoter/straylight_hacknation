import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };

function ease(f, first, last) {
  const t = Math.max(0, Math.min(1, (f - first) / (last - first)));
  return t * t * (3 - 2 * t);
}

function detail(f, k) {
  const look = ease(f, 0, 11);
  const breath = Math.sin(Math.PI * ease(f, 0, 41)) * 6;
  const fingers = ease(f, 3, 35);
  const pawelOffset = 1.1 * (1 - ease(f, 0, 6));
  const marta = k.person('marta', {
    x: 123, y: 529, s: 2.22, lean: 10, head: 16 + 8 * look, gaze: .4 + .6 * look,
    mouth: mouths.marta[60 + f], left: [-52, -52, -2, -35], right: [73, -46, 59, -27],
  });
  return `<rect width="1280" height="720" fill="#f5faf7"/>
    <path d="M729 0H1280V144Q1016 134 729 161Z" fill="#e5efe7"/>
    <path d="M944 0v148M728 160q290-26 552-16" fill="none" stroke="#c1d1c7" stroke-width="3"/>
    <g opacity=".6">${marta}</g>
    <g transform="translate(0 ${-breath})">
      <path d="M-12 285Q151 234 315 282Q492 336 656 399Q823 471 1010 475Q1154 482 1293 455V738H-12Z" fill="#f8f6eb" stroke="#aab9ae" stroke-width="3"/>
      <path d="M-12 377Q173 306 344 363Q497 412 650 475Q865 560 1032 542Q1176 533 1293 497L1293 537Q1162 579 1037 585Q837 602 640 523Q457 447 322 408Q146 363-12 430Z" fill="#adbfaa"/>
      <path d="M24 564q88-51 177-53M1044 658q116 3 248-44" fill="none" stroke="#d1dacd" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g transform="translate(88 36) scale(3.25)">${k.grasp(fingers, pawelOffset)}</g>`;
}

export function photo(k) {
  return detail(45, k);
}

export function scene(f, k) {
  if (f < 42) return detail(f, k);
  const still = photo(k);
  const flash = [0.86, 0.49, 0.22, 0.06][f - 54];
  return flash ? still + `<rect width="1280" height="720" fill="#fffdf6" opacity="${flash}"/>` : still;
}
