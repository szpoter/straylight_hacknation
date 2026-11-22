import {drawMap} from "../22/scene.mjs";

export function mapAtRest() {
  return drawMap(918, 1584);
}

export function scene(f, k) {
  if (f >= 30) return mapAtRest();

  // Pierwsza styczna kontynuuje 12 px/kl ze sceny 22, ostatnia jest pozioma.
  const t = Math.min(f / 28, 1);
  const cameraX = 606 + 336 * t * (1 - t) ** 2 + 312 * t * t * (3 - 2 * t);
  const remaining = Math.max(1 - f / 10.6, 0);
  const traceX = 1584 - 106 * remaining ** 2;
  const settle = Math.max(0, (f - 12) / 18);
  const cardOffset = 10 * Math.sin(Math.PI * settle) ** 2;
  return drawMap(cameraX, traceX, cardOffset);
}
