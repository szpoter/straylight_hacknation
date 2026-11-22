// Grafika zastępcza w kształcie kodu QR. Moduły są pseudolosowe i nie mają pól formatu,
// więc żaden czytnik nie odczyta z niej treści (ui/NIKODEM.md: „kod QR niczego nie koduje”).

const SIZE = 25;
const FINDER = 7;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inFinderZone(x: number, y: number) {
  const near = (v: number) => v <= FINDER;
  const far = (v: number) => v >= SIZE - FINDER - 1;
  return (near(x) && near(y)) || (far(x) && near(y)) || (near(x) && far(y));
}

function inCenter(x: number, y: number) {
  const c = (SIZE - 1) / 2;
  return Math.abs(x - c) <= 4 && Math.abs(y - c) <= 2;
}

function modules(seed: number) {
  const random = mulberry32(seed);
  const cells: string[] = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inFinderZone(x, y) || inCenter(x, y)) continue;
      if (random() < 0.47) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return cells.join("");
}

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0h7v7h-7zM1 1v5h5v-5z" fillRule="evenodd" />
      <rect x="2" y="2" width="3" height="3" />
    </g>
  );
}

export function QrPlaceholder({ seed, className }: { seed: number; className?: string }) {
  const c = (SIZE - 1) / 2;
  return (
    <svg
      className={className}
      viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
      role="img"
      aria-label="Zastępcza grafika kodu QR. W wersji demonstracyjnej kod niczego nie zawiera."
      shapeRendering="crispEdges"
    >
      <rect x="-2" y="-2" width={SIZE + 4} height={SIZE + 4} fill="var(--color-background)" />
      <g fill="var(--color-on-surface)">
        <path d={modules(seed)} />
        <Finder x={0} y={0} />
        <Finder x={SIZE - FINDER} y={0} />
        <Finder x={0} y={SIZE - FINDER} />
      </g>
      <rect
        x={c - 3.6}
        y={c - 1.6}
        width="8.2"
        height="4.2"
        rx="0.6"
        fill="var(--color-tertiary)"
        stroke="var(--color-on-surface)"
        strokeWidth="0.25"
        shapeRendering="geometricPrecision"
      />
      <text
        x={c + 0.5}
        y={c + 0.55}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-sans)"
        fontSize="2.1"
        fontWeight="600"
        letterSpacing="0.12"
        fill="var(--color-on-surface)"
      >
        DEMO
      </text>
    </svg>
  );
}
