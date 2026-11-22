import { frozenRoom, scene as previous } from '../19/scene.mjs';

function smooth(frame, start, end) {
  const t = Math.max(0, Math.min(1, (frame - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function scene(f, k) {
  if (f < 6) return previous(59, k);

  const landing = smooth(f, 6, 15);
  const recovery = smooth(f, 15, 21);
  const travel = smooth(f, 22, 44);
  const cx = 640 - 273 * travel;
  const cy = 325 + 40 * landing - 7 * recovery;
  const squash = 0.04 * landing * (1 - recovery);
  const look = smooth(f, 16, 21);
  const titleX = cx + 135 + 43 * travel;
  const titleWidth = 570 * travel;
  const room = f < 15 ? frozenRoom(k) : '';

  return `${room}
    <rect width="1280" height="720" fill="#E4F2E9" opacity="${landing}"/>
    <defs><clipPath id="s20-title"><rect x="${titleX - 2}" y="235" width="${titleWidth}" height="225"/></clipPath></defs>
    <g clip-path="url(#s20-title)" font-family="Domine,serif" font-size="88" font-weight="400" letter-spacing="-1.76" fill="#283754">
      <text x="${titleX}" y="344">Przewodnik</text>
      <text x="${titleX}" y="432">Rodzica</text>
    </g>
    <g transform="translate(${cx} ${cy}) scale(${1 + squash} ${1 - squash}) translate(${-cx} ${-cy})">
      ${k.zusik(cx, cy, 270 + 40 * travel, look)}
    </g>`;
}
