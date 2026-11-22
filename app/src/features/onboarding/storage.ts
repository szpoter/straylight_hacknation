import type { Answers, StepId } from "./flow";

const KEY = "zusik.onboarding";

export type SavedOnboarding = { screen: StepId | "start"; answers: Answers; returnToSummary: boolean };

/** Przerwany onboarding wznawia się od ostatniego pytania. Bez dostępu do pamięci działamy bez zapisu. */
export function loadSaved(): SavedOnboarding | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedOnboarding;
    return parsed && typeof parsed === "object" && parsed.answers ? parsed : null;
  } catch {
    return null;
  }
}

export function save(state: SavedOnboarding) {
  try {
    if (state.screen === "start" && !state.answers.situation) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Prywatne okno lub zablokowane dane.
  }
}

export function clearSaved() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // jw.
  }
}
