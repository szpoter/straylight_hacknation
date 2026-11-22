import { mulberry32 } from "./demo-random";

// Grafika zastępcza w kształcie kodu QR. Moduły są pseudolosowe i nie mają pól formatu,
// więc żaden czytnik nie odczyta z niej treści (ui/NIKODEM.md: „kod QR niczego nie koduje”).
// Rozmiar w modułach jak w prawdziwych wersjach kodu: 21 (wersja 1), 25, 29 … Od 25 modułów
// dochodzi mały kwadrat wyrównania w prawym dolnym rogu, jak w prawdziwym kodzie.

const FINDER = 7;

function modules(size: number, seed: number) {
  const random = mulberry32(seed);
  const align = size >= 25 ? size - 7 : -10;
  const inFinder = (x: number, y: number) => {
    const near = (v: number) => v <= FINDER;
    const far = (v: number) => v >= size - FINDER - 1;
    return (near(x) && near(y)) || (far(x) && near(y)) || (near(x) && far(y));
  };
  const inAlign = (x: number, y: number) => Math.abs(x - align) <= 2 && Math.abs(y - align) <= 2;
  // Linie rozrządu: naprzemienne moduły w 6. wierszu i 6. kolumnie między polami wyszukiwania
  const timing = (x: number, y: number) => (y === 6 || x === 6) && !inFinder(x, y);

  const cells: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inFinder(x, y) || inAlign(x, y)) continue;
      const on = timing(x, y) ? (x + y) % 2 === 0 : random() < 0.5;
      if (on) cells.push(`M${x} ${y}h1v1h-1z`);
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

type QrPlaceholderProps = {
  seed: number;
  /** Liczba modułów na bok. */
  size?: number;
  /** Margines wokół kodu w modułach. */
  quiet?: number;
  /** Napis DEMO na środku kodu. */
  marked?: boolean;
  className?: string;
};

export function QrPlaceholder({ seed, size = 25, quiet = 2, marked = true, className }: QrPlaceholderProps) {
  const c = (size - 1) / 2;
  const align = size - 7;
  return (
    <svg
      className={className}
      viewBox={`${-quiet} ${-quiet} ${size + 2 * quiet} ${size + 2 * quiet}`}
      role="img"
      aria-label="Zastępcza grafika kodu QR. W wersji demonstracyjnej kod niczego nie zawiera."
      shapeRendering="crispEdges"
    >
      <rect x={-quiet} y={-quiet} width={size + 2 * quiet} height={size + 2 * quiet} fill="var(--qr-light, #ffffff)" />
      <g fill="var(--qr-dark, #000000)">
        <path d={modules(size, seed)} />
        <Finder x={0} y={0} />
        <Finder x={size - FINDER} y={0} />
        <Finder x={0} y={size - FINDER} />
        {size >= 25 ? (
          <g transform={`translate(${align - 2} ${align - 2})`}>
            <path d="M0 0h5v5h-5zM1 1v3h3v-3z" fillRule="evenodd" />
            <rect x="2" y="2" width="1" height="1" />
          </g>
        ) : null}
      </g>
      {marked ? (
        <>
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
        </>
      ) : null}
    </svg>
  );
}
