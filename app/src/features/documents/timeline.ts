import { HANDOFF_RECORDED, IN_PERSON_COMPLETED, latestHandoff, SIMULATED_HANDOFF } from "@/lib/plan/status";
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
  const sent = latestHandoff(events);
  const other = events.filter(e => e !== sent).map(e =>
    e.title === RECEIVED || e.title === "Potwierdzono poprzednią wersję"
      ? { date: e.date, title: "Wcześniejszy wpis planu o wpływie" }
      : e);
  const currentEvents = sent ? events.slice(events.indexOf(sent) + 1) : events;
  const hasCorrespondence = currentEvents.some(e => e.title === "Otrzymano wezwanie");
  const finished = Boolean(stop.doc?.result) || stop.state === "zalatwione" || stop.state === "odmowa-w-terminie";
  if (sent?.title === IN_PERSON_COMPLETED && finished) {
    return [{ id: "wynik", label: IN_PERSON_COMPLETED, status: "done", date: sent.date, detail: sent.detail, entries: other }];
  }
  const simulated = sent?.title === SIMULATED_HANDOFF;

  const done: Record<TimelineStageId, boolean> = {
    wyslano: Boolean(sent) || finished,
    wplyw: Boolean(simulated && sent.simulatedReceipt) || hasCorrespondence || finished,
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
        stage.detail = sent && (sent.title === HANDOFF_RECORDED || simulated ? sent.detail : "Wcześniejszy wpis w historii planu.");
        if (simulated) stage.label = SIMULATED_HANDOFF;
        break;
      case "wplyw":
        if (simulated && sent.simulatedReceipt) {
          stage.label = "Potwierdzenie w symulacji";
          stage.detail = sent.simulatedReceipt;
          stage.date = sent.date;
        } else if (status === "current") stage.detail = "Sprawdź potwierdzenie u odbiorcy.";
        break;
      case "przebieg":
        stage.entries = other;
        stage.date = other.at(-1)?.date;
        if (status === "current" && !hasCorrespondence) stage.detail = simulated ? "Symulacja zakończona. Aby rozpocząć sprawę w urzędzie, złóż rzeczywisty wniosek." : "Oczekujemy na wiadomość";
        break;
      case "wynik":
        stage.detail = stop.doc?.result;
        break;
    }
    return stage;
  });
}
