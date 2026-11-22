"use client";

import {
  animate,
  useMotionValue,
  useScroll,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { lockScroll, scrollToElement, unlockScroll } from "@/components/scroll/smooth-scroll";
import { BENTO_TILES } from "./bento-data";
import { createLiquidRenderer, hasWebGL } from "./liquid-renderer";
import styles from "./liquid-bento.module.css";

/*
 * Sekcja „Jak możecie podzielić się opieką?” w układzie bento z „płynnymi” kaflami.
 *
 * Dwie warstwy: pod spodem płótno WebGL rysuje kształty kafli, które potrafią się zlewać
 * (liquid-renderer.ts), na wierzchu zwykły HTML z treścią, fokusem i ARIA. Płynny efekt dotyczy
 * tylko kształtów; tekst nigdy nie jest rozmywany ani skalowany.
 *
 * Trzy interakcje (tryb „liquid”: od 960 px, mysz, WebGL, bez ograniczenia ruchu):
 * 1. Podział przy przewijaniu: na wejściu jedna plama, w miarę przewijania dzieli się na kafle.
 *    Postęp wynika z przewijania (w górę proces się odwraca). Treść pojawia się, gdy kafle się
 *    rozdzielą.
 * 2. Najechanie: kafel lekko rośnie w stronę sąsiada (bridgeTo) i tworzy się płynny mostek.
 *    Działa dopiero po pełnym podziale. Zmiana kafla: stary mostek pęka, potem rośnie nowy.
 * 3. Kliknięcie: sekcja podjeżdża na środek ekranu, przewijanie się blokuje, kliknięty kafel
 *    wchłania pozostałe i rozlewa się w okno ze szczegółami. Zamknięcie odwraca ruch.
 *    Podczas otwartego okna najechanie i kafle są wyłączone (inert).
 *
 * Tryb „plain” (telefon, dotyk, brak WebGL, ograniczenie ruchu): zwykłe bento w kolorach z CSS,
 * kafle wjeżdżają po kolei, okno pojawia się prostym przejściem (przy ograniczeniu ruchu bez).
 * Bez JavaScriptu: zwykłe bento, wszystko widoczne.
 */

type Box = { cx: number; cy: number; hw: number; hh: number };

/** Podział: zasięg zlewania na starcie (jedna plama) i po podziale; jak blisko środka i jak małe są kafle na starcie. */
const SPLIT = { kMerged: 120, kSplit: 4, pull: 0.3, size: 0.5 };
/** Mostek: o ile kafel rośnie w stronę sąsiada, promień koła mostka i jego zasięg zlewania (px). */
const HOVER = { grow: 6, radius: 22, k: 24 };
/** Dodatkowe zlewanie w połowie otwierania, żeby kafle płynnie się wchłonęły. */
const OPEN_FUSE = 70;
const OPEN_SPRING = { type: "spring", visualDuration: 0.75, bounce: 0.12 } as const;
const BRIDGE_SPRING = { type: "spring", visualDuration: 0.45, bounce: 0.25 } as const;
/** Tryb liquid: szeroki ekran z myszą i bez ograniczenia ruchu. */
const LIQUID_QUERY = "(min-width: 960px) and (min-height: 640px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smoothstep = (from: number, to: number, value: number) => {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const lerpBox = (a: Box, b: Box, t: number): Box => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  hw: lerp(a.hw, b.hw, t),
  hh: lerp(a.hh, b.hh, t),
});

/** Kolor tokenu (#rrggbb albo #rgb) jako trzy liczby 0–1. */
function parseColor(value: string): [number, number, number] {
  let hex = value.trim().replace("#", "");
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
  const n = Number.parseInt(hex, 16);
  if (Number.isNaN(n) || hex.length !== 6) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function subscribeMedia(callback: () => void) {
  const query = window.matchMedia(LIQUID_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** Tryb liquid czy plain. Na serwerze zawsze plain, więc HTML bez JS to zwykłe bento. */
function useLiquidMode() {
  return useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia(LIQUID_QUERY).matches && hasWebGL(),
    () => false,
  );
}

export function LiquidBento() {
  const titleId = useId();
  const dialogTitleId = useId();
  const liquid = useLiquidMode();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const innerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogTitleRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  /** Po zamknięciu okna fokus wraca na kafel, ale dopiero gdy siatka przestanie być inert. */
  const returnFocus = useRef(false);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openIndexRef = useRef<number | null>(null);
  const busy = useRef(false);

  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start 85%", "start 45%"] });
  const bridge = useMotionValue(0);
  const openAmount = useMotionValue(0);
  const hoverTarget = useRef<number | null>(null);
  const bridgeIndex = useRef<number | null>(null);
  const bridgeAnimation = useRef<AnimationPlaybackControls | null>(null);

  // ——— Tryb liquid: rysowanie kształtów i ruch treści, klatka tylko wtedy, gdy coś się zmieni ———
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!liquid || !stage || !canvas) return;
    const renderer = createLiquidRenderer(canvas);
    if (!renderer) return;
    stage.dataset.mode = "liquid";

    const inners = innerRefs.current;
    const count = BENTO_TILES.length;
    const neighbor = BENTO_TILES.map((tile) => BENTO_TILES.findIndex((other) => other.id === tile.bridgeTo));
    const rects = new Float32Array(count * 4);
    /** Kolory z tokenów (base) i kolory tej klatki (frameColors, przy otwieraniu mieszane). */
    const colors = new Float32Array(count * 3);
    const frameColors = new Float32Array(count * 3);
    let finals: Box[] = [];
    let width = 0;
    let height = 0;
    let radius = 24;
    let frameId = 0;

    const measure = () => {
      width = stage.clientWidth;
      height = stage.clientHeight;
      finals = itemRefs.current.map((item) => ({
        cx: (item?.offsetLeft ?? 0) + (item?.offsetWidth ?? 0) / 2,
        cy: (item?.offsetTop ?? 0) + (item?.offsetHeight ?? 0) / 2,
        hw: (item?.offsetWidth ?? 0) / 2,
        hh: (item?.offsetHeight ?? 0) / 2,
      }));
      const style = getComputedStyle(stage);
      BENTO_TILES.forEach((tile, i) => colors.set(parseColor(style.getPropertyValue(`--color-${tile.color}`)), i * 3));
      radius = Number.parseFloat(style.getPropertyValue("--rounded-lg")) || 24;
      renderer.resize(width, height, Math.min(window.devicePixelRatio || 1, 2));
    };

    const frame = () => {
      frameId = 0;
      const split = easeInOut(clamp01(scrollYProgress.get()));
      const open = clamp01(openAmount.get());
      const opened = openIndexRef.current;

      // 1. Podział: od małych kształtów blisko środka (jedna plama) do miejsc w siatce
      const boxes = finals.map((final) => {
        const start: Box = {
          cx: lerp(width / 2, final.cx, SPLIT.pull),
          cy: lerp(height / 2, final.cy, SPLIT.pull),
          hw: final.hw * SPLIT.size,
          hh: final.hh * SPLIT.size,
        };
        return lerpBox(start, final, split);
      });

      // 2. Mostek: kafel rośnie w stronę sąsiada, między nimi wyrasta koło, które je łączy
      let bridgeCircle: [number, number, number] = [0, 0, 0];
      let kBridge = 0;
      const from = bridgeIndex.current;
      const amount = bridge.get() * smoothstep(0.96, 1, split) * (1 - open);
      if (from !== null && amount > 0.001 && neighbor[from] >= 0) {
        const a = boxes[from];
        const b = boxes[neighbor[from]];
        const horizontal = Math.abs(b.cx - a.cx) > Math.abs(b.cy - a.cy);
        const direction = horizontal ? Math.sign(b.cx - a.cx) : Math.sign(b.cy - a.cy);
        const grow = HOVER.grow * amount;
        if (horizontal) {
          a.hw += grow / 2;
          a.cx += (direction * grow) / 2;
        } else {
          a.hh += grow / 2;
          a.cy += (direction * grow) / 2;
        }
        // środek mostka: w połowie szczeliny, na środku wspólnego odcinka obu kafli
        const gapMid = horizontal
          ? (direction > 0 ? a.cx + a.hw + (b.cx - b.hw) : a.cx - a.hw + (b.cx + b.hw)) / 2
          : (direction > 0 ? a.cy + a.hh + (b.cy - b.hh) : a.cy - a.hh + (b.cy + b.hh)) / 2;
        const spanMid = horizontal
          ? (Math.max(a.cy - a.hh, b.cy - b.hh) + Math.min(a.cy + a.hh, b.cy + b.hh)) / 2
          : (Math.max(a.cx - a.hw, b.cx - b.hw) + Math.min(a.cx + a.hw, b.cx + b.hw)) / 2;
        bridgeCircle = horizontal ? [gapMid, spanMid, HOVER.radius * amount] : [spanMid, gapMid, HOVER.radius * amount];
        kBridge = HOVER.k * amount;
      }

      // 3. Otwarcie: kliknięty kafel rozlewa się na całą sekcję, pozostałe wpływają do niego i znikają
      if (opened !== null && open > 0) {
        const target: Box = { cx: width / 2, cy: height / 2, hw: width / 2, hh: height / 2 };
        const center = boxes[opened];
        boxes.forEach((box, i) => {
          if (i === opened) return;
          const pull = clamp01(open * 1.6);
          boxes[i] = {
            cx: lerp(box.cx, center.cx, pull),
            cy: lerp(box.cy, center.cy, pull),
            hw: lerp(box.hw, 0, open),
            hh: lerp(box.hh, 0, open),
          };
        });
        boxes[opened] = lerpBox(center, target, open);
      }

      // Wchłaniane kafle przyjmują kolor otwieranego, jak krople rozpuszczające się w plamie
      frameColors.set(colors);
      if (opened !== null && open > 0) {
        const dissolve = smoothstep(0, 0.55, open);
        for (let i = 0; i < count; i++) {
          if (i === opened) continue;
          for (let c = 0; c < 3; c++) {
            frameColors[i * 3 + c] = lerp(colors[i * 3 + c], colors[opened * 3 + c], dissolve);
          }
        }
      }

      boxes.forEach((box, i) => rects.set([box.cx, box.cy, box.hw, box.hh], i * 4));
      renderer.draw({
        rects,
        colors: frameColors,
        count,
        radius,
        k: lerp(SPLIT.kMerged, SPLIT.kSplit, split) + OPEN_FUSE * Math.sin(Math.PI * open),
        bridge: bridgeCircle,
        kBridge,
      });

      // Treść jedzie razem z kształtem (tylko przesunięcie, bez skalowania i rozmycia) i pojawia się po podziale
      const contentOpacity = smoothstep(0.55, 0.9, split) * (1 - clamp01(open * 4));
      boxes.forEach((box, i) => {
        const inner = inners[i];
        const final = finals[i];
        if (!inner || !final) return;
        inner.style.transform = `translate(${(box.cx - final.cx).toFixed(1)}px, ${(box.cy - final.cy).toFixed(1)}px)`;
        inner.style.opacity = contentOpacity.toFixed(3);
      });
      if (dialogRef.current) dialogRef.current.style.opacity = smoothstep(0.6, 1, open).toFixed(3);
    };

    const schedule = () => {
      if (!frameId) frameId = requestAnimationFrame(frame);
    };

    openAmount.set(openIndexRef.current === null ? 0 : 1);
    measure();
    frame();
    const unsubscribe = [scrollYProgress, bridge, openAmount].map((value) => value.on("change", schedule));
    const resize = new ResizeObserver(() => {
      measure();
      schedule();
    });
    resize.observe(stage);

    return () => {
      unsubscribe.forEach((stop) => stop());
      resize.disconnect();
      cancelAnimationFrame(frameId);
      unlockScroll("bento");
      renderer.dispose();
      stage.dataset.mode = "plain";
      inners.forEach((inner) => inner?.removeAttribute("style"));
    };
  }, [liquid, scrollYProgress, bridge, openAmount]);

  // ——— Tryb plain: kafle wjeżdżają po kolei, gdy sekcja wjedzie na ekran ———
  useEffect(() => {
    const stage = stageRef.current;
    if (liquid || !stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stage.dataset.visible = "false";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stage.dataset.visible = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(stage);
    return () => {
      observer.disconnect();
      delete stage.dataset.visible;
    };
  }, [liquid]);

  // ——— Fokus: po otwarciu na tytuł okna, po zamknięciu z powrotem na kafel ———
  useEffect(() => {
    if (openIndex !== null) {
      dialogTitleRef.current?.focus();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      openerRef.current?.focus();
    }
  }, [openIndex]);

  function setHover(index: number | null) {
    if (!liquid || openIndexRef.current !== null) return;
    hoverTarget.current = index;
    bridgeAnimation.current?.stop();
    if (index === null) {
      bridgeAnimation.current = animate(bridge, 0, BRIDGE_SPRING);
      return;
    }
    if (bridgeIndex.current === index || bridge.get() < 0.05) {
      bridgeIndex.current = index;
      bridgeAnimation.current = animate(bridge, 1, BRIDGE_SPRING);
      return;
    }
    // inny mostek jeszcze trzyma: najpierw pęka, potem rośnie nowy
    const breaking = animate(bridge, 0, { duration: 0.15 });
    bridgeAnimation.current = breaking;
    breaking.then(() => {
      if (hoverTarget.current !== index) return;
      bridgeIndex.current = index;
      bridgeAnimation.current = animate(bridge, 1, BRIDGE_SPRING);
    });
  }

  async function openTile(index: number, button: HTMLButtonElement) {
    const stage = stageRef.current;
    if (!stage || busy.current || openIndexRef.current !== null) return;
    busy.current = true;
    openerRef.current = button;
    setHover(null);
    // sekcja podjeżdża tak, żeby okno było całe widoczne (na środku albo tuż pod paskiem nawigacji)
    const rect = stage.getBoundingClientRect();
    if (rect.top < 80 || rect.bottom > window.innerHeight) {
      const fits = rect.height < window.innerHeight - 120;
      await scrollToElement(stage, fits ? -(window.innerHeight - rect.height) / 2 : -88);
    }
    openIndexRef.current = index;
    setOpenIndex(index);
    if (stage.dataset.mode === "liquid") {
      lockScroll("bento");
      animate(openAmount, 1, OPEN_SPRING);
    }
    busy.current = false;
  }

  async function closeTile() {
    if (busy.current || openIndexRef.current === null) return;
    busy.current = true;
    if (stageRef.current?.dataset.mode === "liquid") await animate(openAmount, 0, OPEN_SPRING);
    else openAmount.jump(0);
    openIndexRef.current = null;
    returnFocus.current = true;
    setOpenIndex(null);
    unlockScroll("bento");
    busy.current = false;
  }

  // Okno: Escape zamyka, Tab krąży tylko po elementach okna
  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      void closeTile();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("a[href], button")];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogTitleRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const openTileData = openIndex !== null ? BENTO_TILES[openIndex] : null;

  return (
    <section id="liczby" className={styles.section} aria-labelledby={titleId}>
      <header className={styles.intro}>
        <h2 id={titleId} className={styles.title}>
          Jak możecie podzielić się opieką?
        </h2>
        <p className={styles.lead}>Kilka liczb, od których zaczyna się plan urlopu.</p>
      </header>

      <div className={styles.wrap}>
        <div ref={stageRef} className={styles.stage} data-mode="plain">
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          <ul className={styles.grid} inert={openIndex !== null}>
            {BENTO_TILES.map((tile, i) => (
              <li
                key={tile.id}
                ref={(element) => {
                  itemRefs.current[i] = element;
                }}
                className={styles.item}
                data-wide={tile.wide ? "true" : undefined}
                style={{ "--column": tile.column, "--row": tile.row, "--i": i } as CSSProperties}
              >
                <button
                  type="button"
                  className={styles.tile}
                  data-color={tile.color}
                  data-ink={tile.ink}
                  data-large={tile.large ? "true" : undefined}
                  aria-haspopup="dialog"
                  aria-expanded={openIndex === i}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onClick={(event) => void openTile(i, event.currentTarget)}
                >
                  <span
                    className={styles.tileInner}
                    ref={(element) => {
                      innerRefs.current[i] = element;
                    }}
                  >
                    <span className={styles.value}>{tile.value}</span>
                    <span className={styles.label}>{tile.label}</span>
                    <svg className={styles.arrow} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M6 14 14 6m0 0H7.5M14 6v6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {openTileData && (
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              className={styles.dialog}
              data-color={openTileData.color}
              data-ink={openTileData.ink}
              onKeyDown={onDialogKeyDown}
            >
              <button type="button" className={styles.close} onClick={() => void closeTile()}>
                Zamknij
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
              <p className={styles.dialogValue}>{openTileData.value}</p>
              <h3 ref={dialogTitleRef} id={dialogTitleId} className={styles.dialogTitle} tabIndex={-1}>
                {openTileData.details.title}
              </h3>
              <p className={styles.dialogBody}>{openTileData.details.body}</p>
              <a className={styles.source} href={openTileData.details.source.href} target="_blank" rel="noopener noreferrer">
                Źródło: {openTileData.details.source.label}
                <span className="visually-hidden"> (otwiera się w nowej karcie)</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
