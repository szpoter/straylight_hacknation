"use client";

import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import { VIEWBOX } from "@/components/mascot/geometry";
import { PENCIL_TIP } from "@/components/mascot/shapes";
import type { ZusikState } from "@/components/mascot/types";

type Field = "start" | "end";
type Point = { x: number; y: number };
type Bubble =
  | { kind: "invite" }
  | { kind: "status"; text: string }
  | { kind: "answer"; text: string }
  | { kind: "question" }
  | { kind: "error" };

const FIELDS: Record<Field, string> = { start: "Początek urlopu", end: "Koniec urlopu" };
/** The bubble sits up and to the left of Zusik, so that is where Zusik looks, leans, waves and points. */
const TO_BUBBLE = 215;
const SAMPLE_ANSWER =
  "Znalazłem to w materiałach ZUS. Tu pojawi się odpowiedź ze źródłem; w makiecie to przykładowy tekst.";
/** The pencil's flight to a field: time to turn into a pencil, flight, writing, flight back. */
const FLIGHT = { form: 0.55, seconds: 0.75, arc: 60, writeSeconds: 1.1, aimInto: [150, 0.72] as const };

type Action =
  | "entrance"
  | "invite"
  | "read"
  | "search"
  | "calculate"
  | "fieldOnScreen"
  | "fieldOffScreen"
  | "answer"
  | "confirm"
  | "ask"
  | "fail";

/** The panel: the six states, each with the scenarios that show it. */
const SCENES: { title: string; note: string; actions: { id: Action; label: string }[] }[] = [
  {
    title: "1. Dostępny",
    note: "Wpływa do rogu jako kropla; na zaproszenie patrzy na dymek, podskakuje i macha.",
    actions: [
      { id: "entrance", label: "Wejście Zusika" },
      { id: "invite", label: "Zaproszenie" },
    ],
  },
  {
    title: "2. Sprawdza",
    note: "Czyta: zmienia się w książkę i przewraca kartki. Szuka: teczka, z której wyskakują zakładki. Liczy: kalkulator z biegnącymi cyframi.",
    actions: [
      { id: "read", label: "Czyta szkic" },
      { id: "search", label: "Szuka w materiałach" },
      { id: "calculate", label: "Liczy w kalkulatorze" },
    ],
  },
  {
    title: "3. Wprowadza zmianę",
    note: "Zmienia się w ołówek. Do widocznego pola leci i wpisuje wartość; przy polu poza ekranem kreśli w miejscu.",
    actions: [
      { id: "fieldOnScreen", label: "Pole widoczne" },
      { id: "fieldOffScreen", label: "Pole poza ekranem" },
    ],
  },
  {
    title: "4. Odpowiada",
    note: "Mówi, dopóki pojawia się tekst. Potwierdzenie zapisu: płynny ✓, potem kiwnięcie i uśmiechnięte oczy.",
    actions: [
      { id: "answer", label: "Odpowiedź" },
      { id: "confirm", label: "Potwierdzenie zapisu" },
    ],
  },
  {
    title: "5. Czeka na rodzica",
    note: "Najpierw płynny „?”, potem pochyla się do pola i faluje przy każdym znaku. Bez pisania uspokaja się, czasem podskoczy.",
    actions: [{ id: "ask", label: "Zadaj pytanie" }],
  },
  {
    title: "6. Potrzebuje uwagi",
    note: "Najpierw płynny „!”, potem opada, martwi się, raz kręci „nie” i wskazuje ręką przycisk naprawy.",
    actions: [{ id: "fail", label: "Błąd zapisu" }],
  },
];

/** Text that appears letter by letter, like a streamed answer. */
function Streamed({ text, seconds, onDone }: { text: string; seconds: number; onDone?: () => void }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = setInterval(() => {
      const share = Math.min(1, (performance.now() - started) / (seconds * 1000));
      setShown(Math.round(share * text.length));
      if (share >= 1) {
        clearInterval(timer);
        onDone?.();
      }
    }, 40);
    return () => clearInterval(timer);
  }, [text, seconds, onDone]);
  return <>{text.slice(0, shown)}</>;
}

/** Interactive mockup: Zusik in the corner of an application form, with a panel to try every state. */
export function ZusikMockup() {
  const [state, setState] = useState<ZusikState>("available");
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [inviting, setInviting] = useState(false);
  const [toward, setToward] = useState(TO_BUBBLE);
  const [mount, setMount] = useState({ key: 0, entrance: false });
  const [typingTick, setTypingTick] = useState(0);
  const [answerDraft, setAnswerDraft] = useState("");
  const [values, setValues] = useState<Record<Field, string>>({ start: "—", end: "—" });
  const [flash, setFlash] = useState<Field | null>(null);
  const [big, setBig] = useState(false);
  const [lastAction, setLastAction] = useState<Action | null>(null);

  // Zusik's offset from its corner (it leaves the corner when it flies to a field as a pencil)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const flight = useRef<AnimationPlaybackControls[]>([]);

  const zusik = useRef<HTMLDivElement>(null);
  const fieldRefs = { start: useRef<HTMLDivElement>(null), end: useRef<HTMLDivElement>(null) };
  const timers = useRef<number[]>([]);
  const after = (seconds: number, action: () => void) => timers.current.push(window.setTimeout(action, seconds * 1000));

  /** Switch to a state: stop the previous scenario (and fly home), then set the state, bubble and direction. */
  function show(next: ZusikState, nextBubble: Bubble | null, nextToward = TO_BUBBLE) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    flight.current.forEach((controls) => controls.stop());
    flight.current = [animate(x, 0, { duration: 0.4 }), animate(y, 0, { duration: 0.4 })];
    setInviting(false);
    setState(next);
    setBubble(nextBubble);
    setToward(nextToward);
  }

  const backToRest = (seconds: number) => after(seconds, () => show("available", null));

  function confirmSaved(text: string) {
    setState("confirming");
    setBubble({ kind: "answer", text });
    setToward(TO_BUBBLE);
    backToRest(3.2);
  }

  function entrance() {
    show("available", null);
    setMount((m) => ({ key: m.key + 1, entrance: true }));
    after(2, () => {
      setBubble({ kind: "invite" });
      setInviting(true);
    });
  }

  function invite() {
    show("available", { kind: "invite" });
    after(0.05, () => setInviting(true));
  }

  /** State 3 with the field on screen: Zusik turns into a pencil, flies to the field, writes, and flies back. */
  function writeInto(field: Field, value: string) {
    const box = zusik.current?.getBoundingClientRect();
    const target = fieldRefs[field].current?.getBoundingClientRect();
    if (!box || !target) return;
    // where the pencil's tip is on screen, from its place in the drawing
    const [vx, vy, vw] = VIEWBOX.tight.split(" ").map(Number);
    const tip = { x: box.left + ((PENCIL_TIP[0] - vx) / vw) * box.width, y: box.top + ((PENCIL_TIP[1] - vy) / vw) * box.width };
    const aim = { x: target.left + FLIGHT.aimInto[0], y: target.top + target.height * FLIGHT.aimInto[1] };
    const [dx, dy] = [aim.x - tip.x, aim.y - tip.y];

    show("writing", { kind: "status", text: `Wpisuję: ${FIELDS[field].toLowerCase()}, ${value}…` }, direction(centre(box), aim));
    after(FLIGHT.form, () => {
      flight.current = [
        animate(x, dx, { duration: FLIGHT.seconds, ease: "easeInOut" }),
        animate(y, [0, dy - FLIGHT.arc, dy], { duration: FLIGHT.seconds, ease: "easeInOut" }),
      ];
    });
    // write the value letter by letter while the pencil scribbles
    const writeAt = FLIGHT.form + FLIGHT.seconds;
    after(writeAt, () => setFlash(field));
    [...value].forEach((_, i) =>
      after(writeAt + ((i + 1) / value.length) * FLIGHT.writeSeconds, () =>
        setValues((v) => ({ ...v, [field]: value.slice(0, i + 1) })),
      ),
    );
    after(writeAt + FLIGHT.writeSeconds, () => {
      setFlash(null);
      flight.current = [
        animate(x, 0, { duration: FLIGHT.seconds, ease: "easeInOut" }),
        animate(y, [dy, dy - FLIGHT.arc, 0], { duration: FLIGHT.seconds, ease: "easeInOut" }),
      ];
    });
    after(writeAt + FLIGHT.writeSeconds + FLIGHT.seconds, () =>
      confirmSaved(`Zapisałem: ${FIELDS[field].toLowerCase()}, ${value}.`),
    );
  }

  function submitAnswer(value: string) {
    if (!value.trim()) return;
    setAnswerDraft("");
    show("checking", { kind: "status", text: "Sprawdzam datę…" });
    after(1.6, () => writeInto("end", value.trim()));
  }

  /** Runs one of the panel's actions (the scenes above). */
  function run(action: Action) {
    setLastAction(action);
    switch (action) {
      case "entrance":
        return entrance();
      case "invite":
        return invite();
      case "read":
        return show("reading", { kind: "status", text: "Czytam szkic wniosku…" });
      case "search":
        return show("searching", { kind: "status", text: "Szukam w materiałach ZUS…" });
      case "calculate":
        return show("calculating", { kind: "status", text: "Liczę w kalkulatorze…" });
      case "fieldOnScreen":
        return writeInto("start", "18.06.2026");
      case "fieldOffScreen":
        show("writing", { kind: "status", text: "Wpisuję datę w części „Zatrudnienie”…" }, 200);
        return after(2.6, () => confirmSaved("Zapisałem datę w części „Zatrudnienie”."));
      case "answer":
        return show("answering", { kind: "answer", text: SAMPLE_ANSWER });
      case "confirm":
        show("confirming", { kind: "answer", text: "Zapisałem: początek urlopu, 18.06.2026." });
        return backToRest(3.2);
      case "ask":
        return show("waiting", { kind: "question" });
      case "fail":
        return show("attention", { kind: "error" });
    }
  }

  const size = big ? 220 : 120;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="flex flex-col gap-5">
        {SCENES.map((scene) => (
          <section key={scene.title} className="flex flex-col gap-2">
            <h2 className="font-semibold">{scene.title}</h2>
            <p className="text-sm text-slate-600">{scene.note}</p>
            <div className="flex flex-wrap gap-2">
              {scene.actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => run(action.id)}
                  aria-pressed={lastAction === action.id && state !== "available"}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-sm aria-pressed:border-babelek-rim aria-pressed:bg-babelek-fill"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={big} onChange={(e) => setBig(e.target.checked)} />
          Powiększ Zusika (zamiast rozmiaru z rogu ekranu)
        </label>
        <p className="text-sm text-slate-600">
          Stan teraz: <code>{state}</code>
        </p>
      </aside>

      <div className="relative h-[600px] overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 p-6">
          <div className="mb-32 flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Makieta, dane przykładowe</p>
            <h2 className="text-xl font-semibold">Wniosek o zasiłek macierzyński</h2>
            <p className="max-w-sm text-sm text-slate-600">Część 2 z 5: urlop. Zusik pomoże uzupełnić daty.</p>
          </div>
          <FormField label="Imię i nazwisko" value="Anna Przykładowa" />
          {(Object.keys(FIELDS) as Field[]).map((field) => (
            <FormField
              key={field}
              ref={fieldRefs[field]}
              label={FIELDS[field]}
              value={values[field]}
              highlight={flash === field}
            />
          ))}
        </div>

        {bubble && (
          <div
            className="absolute right-6 w-72 rounded-2xl bg-white p-4 text-sm shadow-lg ring-1 ring-slate-200"
            style={{ bottom: size + 40 }}
          >
            <BubbleContent
              bubble={bubble}
              onYes={() => show("reading", { kind: "status", text: "Czytam szkic wniosku…" })}
              onLater={() => setBubble(null)}
              onAnswerDone={() => state === "answering" && show("available", bubble)}
              draft={answerDraft}
              onDraft={(value) => {
                setAnswerDraft(value);
                setTypingTick((tick) => tick + 1);
              }}
              onSubmit={submitAnswer}
              onRetry={() => writeInto("start", "18.06.2026")}
            />
          </div>
        )}

        <motion.div ref={zusik} className="absolute right-6 bottom-6" style={{ width: size, x, y }}>
          <Babelek
            key={mount.key}
            animated
            entrance={mount.entrance}
            state={state}
            toward={toward}
            inviting={inviting}
            typingTick={typingTick}
            title="Zusik"
            className="h-auto w-full"
          />
        </motion.div>
      </div>
    </div>
  );
}

function centre(box: DOMRect): Point {
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

const direction = (from: Point, to: Point) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

function FormField({
  label,
  value,
  highlight = false,
  ref,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={`max-w-sm rounded-lg bg-white px-4 py-2 ring-1 transition-colors duration-500 ${
        highlight ? "ring-2 ring-babelek-rim bg-babelek-fill/40" : "ring-slate-200"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function BubbleContent({
  bubble,
  onYes,
  onLater,
  onAnswerDone,
  draft,
  onDraft,
  onSubmit,
  onRetry,
}: {
  bubble: Bubble;
  onYes: () => void;
  onLater: () => void;
  onAnswerDone: () => void;
  draft: string;
  onDraft: (value: string) => void;
  onSubmit: (value: string) => void;
  onRetry: () => void;
}): ReactNode {
  const button = "rounded-full px-3 py-1.5";
  switch (bubble.kind) {
    case "invite":
      return (
        <div className="flex flex-col gap-3">
          <p>Chcesz wypełnić ten wniosek z Zusikiem?</p>
          <div className="flex gap-2">
            <button type="button" onClick={onYes} className={`${button} bg-babelek-rim text-white`}>
              Tak, pomóż
            </button>
            <button type="button" onClick={onLater} className={`${button} border border-slate-300`}>
              Nie teraz
            </button>
          </div>
        </div>
      );
    case "status":
      return <p className="text-slate-600">{bubble.text}</p>;
    case "answer":
      return (
        <p>
          <Streamed text={bubble.text} seconds={Math.max(1, bubble.text.length / 35)} onDone={onAnswerDone} />
        </p>
      );
    case "question":
      return (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft);
          }}
        >
          <p>Kiedy chcesz zakończyć urlop?</p>
          <input
            autoFocus
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            placeholder="np. 05.11.2026"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="flex flex-wrap gap-2">
            {["05.11.2026", "po 20 tygodniach"].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSubmit(suggestion)}
                className={`${button} border border-slate-300`}
              >
                {suggestion}
              </button>
            ))}
            <button type="submit" className={`${button} bg-babelek-rim text-white`}>
              Wyślij
            </button>
          </div>
        </form>
      );
    case "error":
      return (
        <div className="flex flex-col gap-3">
          <p>Nie udało się zapisać daty początku urlopu.</p>
          <button type="button" onClick={onRetry} className={`${button} self-start bg-babelek-rim text-white`}>
            Ponów zapis
          </button>
        </div>
      );
  }
}
