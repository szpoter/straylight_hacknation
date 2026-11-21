/** Shared between server and the probe screen. No secrets here. */
export const CHOICES = ["razem", "kolejno"] as const;
export type Choice = (typeof CHOICES)[number];

export const CHOICE_LABELS: Record<Choice, string> = {
  razem: "Razem",
  kolejno: "Kolejno",
};

export const PROBE_QUERY =
  "Czy opiekę nad dzieckiem możemy zaplanować wspólnie lub na zmianę?";

/** Shown when Sherlock fails or no grounded fragment was found. */
export const FALLBACK_QUESTION =
  "Marto, czy wolisz opiekować się dzieckiem razem z Pawłem, czy kolejno?";

export const SESSION_COOKIE = "zusik_demo_session";
