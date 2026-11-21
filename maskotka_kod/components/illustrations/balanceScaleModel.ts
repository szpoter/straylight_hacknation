import { easeIn, easeInOut, easeOut, interpolate, type EasingFunction } from "motion/react";

/*
 * Waga do karty „Zaplanuj opiekę i policz zasiłek”: geometria i przebieg animacji.
 *
 * Współrzędne to piksele obrazu referencyjnego design/illustrations/waga.jpg (2048 × 2048),
 * zmierzone skryptem (Pillow) na konturach. Kształty mają kontur na środku krawędzi,
 * więc każda wartość to zmierzona krawędź zewnętrzna minus połowa grubości konturu.
 * Lewa i prawa strona są lustrzane względem osi słupka (x = 1024).
 */

export type Point = { x: number; y: number };
/** Wierzchołek wielokąta z promieniem zaokrąglenia. */
type Corner = [x: number, y: number, radius: number];

/** Grubość konturu (wszystkie kształty i linki), jak w ilustracjach teczki i koperty. */
export const STROKE = 10.5;

/** Kadr: rysunek plus zapas na przechył belki i opadające kółko. */
export const VIEWBOX = "115 269 1818 1543";

/** Punkt obrotu belki: środek białego kółka na szczycie słupka. */
export const PIVOT: Point = { x: 1024, y: 556 };

/** Słupek: pionowa pigułka. Dół chowa się za podstawą, więc jest dłuższy, niż widać. */
export const POST = { x: 968, y: 314, width: 112, height: 1386 };

/** Belka: pozioma pigułka z osią w punkcie obrotu. */
export const BEAM = { x: 369, y: 517.5, width: 1310, height: 77 };

/** Białe kółko osi obrotu. */
export const PIVOT_RADIUS = 59;

/** Odległość punktu zawieszenia szalki od osi słupka. */
const HANG_ARM = 541;

/** Punkty zawieszenia szalek na osi belki, gdy belka jest pozioma. */
export const HANG: Record<Side, Point> = {
  left: { x: PIVOT.x - HANG_ARM, y: PIVOT.y },
  right: { x: PIVOT.x + HANG_ARM, y: PIVOT.y },
};

export type Side = "left" | "right";

/** Zbieg linek tuż pod osią belki: przy każdym przechyle zostaje schowany za belką. */
const STRING_APEX_DROP = 24;
/** Linki dochodzą do górnej krawędzi szalki w tej odległości od jej środka. */
const STRING_SPREAD = 269;

/** Górna krawędź szalki. */
const PAN_TOP = 1229.5;

/** Kółko leży w szalce: jego dół zasłania przednia ścianka szalki. */
export const BALL = { dy: 573, radius: 135 };

/** Podstawa: niski trapez szerszy u dołu. */
const BASE_OUTLINE: Corner[] = [
  [692, 1562, 34],
  [1356, 1562, 34],
  [1441, 1767, 44],
  [607, 1767, 44],
];

/** Szalka względem jej punktu zawieszenia (x) i obrazu (y): pionowy rant, skośne boki, płaskie dno. */
const PAN_OUTLINE: Corner[] = [
  [-322, PAN_TOP, 26],
  [322, PAN_TOP, 26],
  [322, 1268, 14],
  [229, 1416, 44],
  [-229, 1416, 44],
  [-322, 1268, 14],
];

/**
 * Zamknięta ścieżka przez wierzchołki z zaokrąglonymi narożnikami. Każdy narożnik to krzywa
 * kwadratowa z punktem kontrolnym w wierzchołku, zaczynająca się i kończąca `radius` od niego.
 */
function roundedPath(corners: Corner[], dx = 0): string {
  const at = (index: number) => corners[(index + corners.length) % corners.length];
  const toward = ([x, y]: Corner, [tx, ty]: Corner, distance: number) => {
    const length = Math.hypot(tx - x, ty - y);
    return `${(x + dx + ((tx - x) / length) * distance).toFixed(1)} ${(y + ((ty - y) / length) * distance).toFixed(1)}`;
  };
  return (
    corners
      .map((corner, index) => {
        const [x, y, radius] = corner;
        const start = toward(corner, at(index - 1), radius);
        const end = toward(corner, at(index + 1), radius);
        return `${index === 0 ? "M" : "L"}${start} Q${x + dx} ${y} ${end}`;
      })
      .join(" ") + " Z"
  );
}

export const BASE_PATH = roundedPath(BASE_OUTLINE);

export function panPath(side: Side): string {
  return roundedPath(PAN_OUTLINE, HANG[side].x);
}

/** Dwie linki od zbiegu pod belką do górnej krawędzi szalki (odwrócone V). */
export function stringsPath(side: Side): string {
  const { x, y } = HANG[side];
  return `M${x - STRING_SPREAD} ${PAN_TOP} L${x} ${y + STRING_APEX_DROP} L${x + STRING_SPREAD} ${PAN_TOP}`;
}

export function ballCenter(side: Side): Point {
  return { x: HANG[side].x, y: HANG[side].y + BALL.dy };
}

/**
 * O ile przesuwa się punkt zawieszenia, gdy belka obróci się o `angle` stopni wokół osi.
 * Szalka przesuwa się razem z końcem belki, ale się nie obraca, więc wisi pionowo.
 */
export function hangOffset(side: Side, angle: number): Point {
  const radians = (angle * Math.PI) / 180;
  const arm = HANG[side].x - PIVOT.x;
  return { x: arm * Math.cos(radians) - arm, y: arm * Math.sin(radians) };
}

/*
 * Przebieg animacji: 5 s w pętli, czasy w sekundach.
 * Kąt belki w stopniach: ujemny to przechył w lewo (lewa szalka niżej).
 *
 * 0–1,4   belka przechylona o 10° w lewo; od 0,8 nad prawą szalką pojawia się bursztynowe kółko i opada,
 * 1,4–3,0 belka kołysze się z wygasaniem do poziomu: +6°, −3°, +1,5°, 0°,
 * 3,0–4,2 równowaga, oba kółka raz pulsują (1 → 1,04 → 1),
 * 4,2–5,0 bursztynowe kółko unosi się i znika, belka wraca do przechyłu w lewo.
 */
export const LOOP = 5;

/** Kadr spoczynkowy: waga w równowadze z oboma kółkami. Od niego startuje animacja i on zostaje przy ograniczonym ruchu. */
export const REST = 3;

/** Wysokość, z której opada bursztynowe kółko, i na którą się unosi przed zniknięciem. */
const DROP = 300;
const LIFT = 260;

type Track = { times: number[]; values: number[]; ease: EasingFunction[] };

const linear: EasingFunction = (t) => t;

const TRACKS = {
  angle: {
    times: [0, 1.4, 1.8, 2.2, 2.6, 3.0, 4.2, 5.0],
    values: [-10, -10, 6, -3, 1.5, 0, 0, -10],
    ease: [linear, easeInOut, easeInOut, easeInOut, easeOut, linear, easeInOut],
  },
  amberLift: {
    times: [0, 0.8, 1.4, 4.2, 5.0],
    values: [-DROP, -DROP, 0, 0, -LIFT],
    ease: [linear, easeInOut, linear, easeIn],
  },
  amberOpacity: {
    times: [0, 0.8, 1.0, 4.4, 4.9, 5.0],
    values: [0, 0, 1, 1, 0, 0],
    ease: [linear, easeOut, linear, easeIn, linear],
  },
  pulse: {
    times: [0, 3.3, 3.6, 3.9, 5.0],
    values: [1, 1, 1.04, 1, 1],
    ease: [linear, easeInOut, easeInOut, linear],
  },
} satisfies Record<string, Track>;

const track = ({ times, values, ease }: Track) => interpolate(times, values, { ease, clamp: true });

const curves = {
  angle: track(TRACKS.angle),
  amberLift: track(TRACKS.amberLift),
  amberOpacity: track(TRACKS.amberOpacity),
  pulse: track(TRACKS.pulse),
};

export type ScaleFrame = { angle: number; amberLift: number; amberOpacity: number; pulse: number };

/** Stan wagi w chwili `time` (sekundy, dowolna liczba: zawija się do pętli). */
export function scaleFrame(time: number): ScaleFrame {
  const t = ((time % LOOP) + LOOP) % LOOP;
  return {
    angle: curves.angle(t),
    amberLift: curves.amberLift(t),
    amberOpacity: curves.amberOpacity(t),
    pulse: curves.pulse(t),
  };
}
