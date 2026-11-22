import { HANDOFF_RECORDED, isHandoffEntry } from "@/lib/plan/status";
import type { CaseEvent, Stop } from "@/lib/demo/types";

export type TimelineStageId = "wyslano" | "wplyw" | "przebieg" | "wynik";
export type TimelineStatus = "done" | "current" | "future";

export type TimelineStage = {
  id: TimelineStageId;
  label: string;
  status: TimelineStatus;
  date?: string;
  /** Opis po rozwinięciu. */
  detail?: string;
  /** Wpisy pod etapem (np. wezwanie → odpowiedź → potwierdzenie). */
  entries: CaseEvent[];
};

export const TIMELINE_LABELS: Record<TimelineStageId, string> = {
  wyslano: "Przekazanie",
  wplyw: "Potwierdzenie wpływu",
  przebieg: "Przebieg sprawy",
  wynik: "Wynik",
};

const RECEIVED = "Potwierdzenie wpływu";

/**
 * Etapy przebiegu sprawy po wysłaniu (SPEC-PO-LOGOWANIU, „Po wysłaniu — przebieg jednej sprawy”).
 * Status wynika wyłącznie ze zdarzeń sprawy. Sprawa niewysłana nie ma bieżącego etapu.
 */
export function buildTimeline(stop: Pick<Stop, "state" | "doc">): TimelineStage[] {
  const events = stop.doc?.events ?? [];
  const sent = events.find((e) => isHandoffEntry(e.title));
  const other = events.filter(e => e !== sent).map(e =>
    e.title === RECEIVED || e.title === "Potwierdzono poprzednią wersję"
      ? { date: e.date, title: "Wcześniejszy wpis planu o wpływie" }
      : e);
  const hasCorrespondence = other.some(e => e.title === "Otrzymano wezwanie");
  const finished = Boolean(stop.doc?.result) || stop.state === "zalatwione" || stop.state === "odmowa-w-terminie";

  const done: Record<TimelineStageId, boolean> = {
    wyslano: Boolean(sent) || finished,
    wplyw: hasCorrespondence || finished,
    przebieg: finished,
    wynik: finished,
  };

  const order: TimelineStageId[] = ["wyslano", "wplyw", "przebieg", "wynik"];
  const started = done.wyslano;
  const currentId = started ? order.find((id) => !done[id]) : undefined;

  return order.map((id) => {
    const status: TimelineStatus = done[id] ? "done" : id === currentId ? "current" : "future";
    const stage: TimelineStage = { id, label: TIMELINE_LABELS[id], status, entries: [] };
    switch (id) {
      case "wyslano":
        stage.date = sent?.date;
        stage.detail = sent && (sent.title === HANDOFF_RECORDED ? sent.detail : "Wcześniejszy wpis w historii planu.");
        break;
      case "wplyw":
        stage.detail = status === "current" ? "Sprawdź potwierdzenie u odbiorcy." : undefined;
        break;
      case "przebieg":
        stage.entries = other;
        stage.date = other.at(-1)?.date;
        if (status === "current" && other.length === 0) stage.detail = "Oczekujemy na wiadomość";
        break;
      case "wynik":
        stage.detail = stop.doc?.result;
        break;
    }
    return stage;
  });
}
