// v3 · ujęcie 23 (44–46 s, klatki filmu 1320–1379) · autor bloku b19.
// Dojazd przeniesiony z v2 (../../../v2/sceny/23/scene.mjs): pół karty (324 px), kamera staje w 28 na x=918,
// karta domyka ≤10 px, od 30 do 59 obraz stoi (sekunda na odczyt „1 grudnia 2026” i „Do zrobienia”).
// Styk 23/59 → 24/0: karta x=342–990, y=164–464; prawa krawędź x=990 (CARD_RIGHT). mapAtRest() dla autora 24.
import { drawMap, CARD } from "../22/scene.mjs";

export const CAMERA_REST = 918;
export const CARD_RIGHT = CARD.x + CARD.w - CAMERA_REST;   // 990
export function mapAtRest() { return drawMap(CAMERA_REST, 1584); }

export function scene(f, k) {
  if (f >= 30) return mapAtRest();
  // Pierwsza styczna kontynuuje 12 px/kl. ze sceny 22, ostatnia jest pozioma.
  const t = Math.min(f / 28, 1);
  const cameraX = 606 + 336 * t * (1 - t) ** 2 + 312 * t * t * (3 - 2 * t);
  const remaining = Math.max(1 - f / 10.6, 0);
  const traceX = 1584 - 106 * remaining ** 2;
  const settle = Math.max(0, (f - 12) / 18);
  const cardOffset = 10 * Math.sin(Math.PI * settle) ** 2;
  return drawMap(cameraX, traceX, cardOffset);
}
