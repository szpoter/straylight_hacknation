/**
 * Details of the shapes Zusik can turn into (see shapes.ts): pages, index cards, the calculator's
 * display and keys, the pencil's graphite and band, the dot of "?" and "!". All of them are hidden
 * until a shape has formed; the frame loop in AnimatedSvg shows and moves them.
 * Only rendered for the animated mascot, so the static drawing stays as it was.
 */
import { BOOK, CALCULATOR, CLOSED_FOLDER, COVER_PATHS, DOT, FOLDER, PENCIL, pencilPoint } from "./shapes";
import type { Point } from "./geometry";

// Współrzędne z sin/cos zaokrąglone do setnych: Node i przeglądarka potrafią różnić się na ostatniej
// cyfrze, a wtedy React zgłasza niezgodność hydratacji (SVG renderuje się najpierw na serwerze).
const round = (value: number) => Math.round(value * 100) / 100;
const fmt = (points: readonly Point[]) => points.map(([x, y]) => `${round(x)} ${round(y)}`).join(" L ");
const mirror = (x: number) => 2 * BOOK.spine - x;

/** Index cards behind the folder; only their tops peek out over its edge. */
export function DetailsBehind() {
  const [, folderTop] = FOLDER.body;
  return (
    <g data-part="detail-folder" opacity={0}>
      {FOLDER.cards.map(([x0, x1]) => (
        <rect
          key={x0}
          data-part="folder-card"
          x={x0}
          y={FOLDER.cardTop}
          width={x1 - x0}
          height={folderTop - FOLDER.cardTop + 160}
          rx={36}
          strokeWidth={22}
          className="fill-babelek-shine stroke-babelek-rim"
        />
      ))}
    </g>
  );
}

/** Details drawn over the shape and under the face. */
export function DetailsFront() {
  const { display, keys } = CALCULATOR;
  const half = PENCIL.length / 2;
  const w = PENCIL.width / 2;
  // the graphite is the last stretch of the cone, so its sides follow the cone's slope
  const graphite = 150;
  const graphiteWidth = (w * graphite) / PENCIL.tipLength;
  return (
    <>
      <g data-part="detail-book" opacity={0}>
        <line x1={BOOK.spine} y1={690} x2={BOOK.spine} y2={1410} strokeWidth={22} strokeLinecap="round" className="stroke-babelek-rim" />
        {BOOK.lines.map(([x0, x1, y]) => (
          <g key={y} strokeWidth={20} strokeLinecap="round" className="stroke-babelek-rim" opacity={0.45}>
            <line x1={x0} y1={y} x2={x1} y2={y} />
            <line x1={mirror(x0)} y1={y} x2={mirror(x1)} y2={y} />
          </g>
        ))}
        {/* the page that turns, from the right half over to the left */}
        <g data-part="book-page">
          <path d={`M ${fmt(BOOK.page)} Z`} strokeWidth={22} strokeLinejoin="round" className="fill-babelek-fill stroke-babelek-rim" />
          {BOOK.lines.map(([x0, x1, y]) => (
            <line key={y} x1={x0} y1={y} x2={x1} y2={y} strokeWidth={20} strokeLinecap="round" className="stroke-babelek-rim" opacity={0.45} />
          ))}
        </g>
      </g>

      <g data-part="detail-calculator" opacity={0}>
        <rect
          x={display[0]}
          y={display[1]}
          width={display[2] - display[0]}
          height={display[3] - display[1]}
          rx={40}
          className="fill-babelek-ink"
        />
        <text
          data-part="calc-digits"
          x={display[2] - 40}
          y={display[3] - 40}
          textAnchor="end"
          fontSize={120}
          fontFamily="ui-monospace, Menlo, monospace"
          className="fill-babelek-shine"
        >
          0
        </text>
        {keys.rows.flatMap((cy) =>
          keys.columns.map((cx) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={keys.r} strokeWidth={16} className="fill-babelek-shine stroke-babelek-rim" />
          )),
        )}
        <circle data-part="calc-press" cx={keys.columns[1]} cy={keys.rows[1]} r={keys.r} className="fill-babelek-rim" opacity={0} />
      </g>

      <g data-part="detail-pencil" opacity={0}>
        <path
          d={`M ${fmt([pencilPoint(half, 0), pencilPoint(half - graphite, graphiteWidth), pencilPoint(half - graphite, -graphiteWidth)])} Z`}
          strokeLinejoin="round"
          strokeWidth={30}
          className="fill-babelek-ink stroke-babelek-ink"
        />
        {[-half + w + 40, -half + w + 110].map((along) => (
          <line
            key={along}
            x1={round(pencilPoint(along, w)[0])}
            y1={round(pencilPoint(along, w)[1])}
            x2={round(pencilPoint(along, -w)[0])}
            y2={round(pencilPoint(along, -w)[1])}
            strokeWidth={26}
            className="stroke-babelek-rim"
          />
        ))}
      </g>

      <circle
        data-part="detail-dot"
        cx={DOT.centre[0]}
        cy={DOT.centre[1]}
        r={DOT.r}
        strokeWidth={64.5}
        opacity={0}
        className="fill-babelek-fill stroke-babelek-rim"
      />

      <ClosedFolderCover />
    </>
  );
}

/** The closed folder's cover (state "folder"), with the darker inside that shows when it opens a little. */
function ClosedFolderCover() {
  const [x0, x1, y0, y1] = CLOSED_FOLDER.inside;
  return (
    <g data-part="detail-closed-folder" opacity={0}>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} className="fill-babelek-rim" opacity={0.35} />
      <path
        data-part="folder-cover"
        d={COVER_PATHS.closed}
        strokeWidth={22}
        strokeLinejoin="round"
        className="fill-babelek-fill stroke-babelek-rim"
      />
    </g>
  );
}
