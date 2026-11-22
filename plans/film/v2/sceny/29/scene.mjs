import { scene as attachment } from '../28/scene.mjs';

function ease(frame, start, end) {
  const t = Math.min(1, Math.max(0, (frame - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function scene(f, k) {
  const draft = attachment(59, k);
  if (f === 0) return draft;
  const pullback = ease(f, 0, 18);
  const reveal = ease(f, 3, 16);
  return `<rect width="1280" height="720" fill="#F5FAF7"/>
    <g transform="translate(${115.2 * pullback} ${51 * pullback}) scale(${1 - .18 * pullback})">
      ${draft}
      <defs><clipPath id="recipient29"><rect x="140" y="554" width="${984 * reveal}" height="147"/></clipPath></defs>
      <g clip-path="url(#recipient29)" font-family="Inter, sans-serif">
        <rect x="140" y="554" width="982" height="146" rx="14" fill="#EAF4ED"/>
        <text x="181" y="602" font-size="26" fill="#436451">Odbiorca</text>
        <text x="179" y="666" font-size="45" font-weight="600" fill="#283754">Pracodawca · Studio Lipa</text>
      </g>
    </g>`;
}
