// Stan ścieżki logowania demo przekazywany w adresie, żeby „Wróć” i odświeżenie działały
// bez pamięci przeglądarki. Przebieg według ui/NIKODEM.md, punkt 6:
// eZUS (logowanie albo rejestracja) → login.gov.pl → Aplikacja mObywatel → wczytanie danych.

/** Skąd rodzic zaczął: z „Zaloguj się” albo z „Zarejestruj się”. */
export type FlowOrigin = "logowanie" | "rejestracja";

/** Miejsce wejścia na stronie głównej. „sytuacja” to przycisk „Sprawdź moją sytuację” na dole strony. */
export type FlowEntry = "hero" | "sytuacja";

export type Flow = {
  origin: FlowOrigin;
  entry: FlowEntry;
  /** Link „Przetestuj błąd pobierania danych” kończy ścieżkę błędem wczytywania. */
  simulateError: boolean;
};

export type SearchParams = Record<string, string | string[] | undefined>;

export const AUTH_PATHS = {
  login: "/logowanie",
  register: "/rejestracja",
  loginGov: "/logowanie/login-gov",
  mObywatel: "/logowanie/mobywatel",
  loading: "/logowanie/wczytywanie",
  afterLogin: "/start",
} as const;

const DEFAULT_FLOW: Flow = { origin: "logowanie", entry: "hero", simulateError: false };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readFlow(params: SearchParams | URLSearchParams): Flow {
  const get = (key: string) =>
    params instanceof URLSearchParams ? (params.get(key) ?? undefined) : first(params[key]);
  return {
    origin: get("z") === "rejestracja" ? "rejestracja" : "logowanie",
    entry: get("wejscie") === "sytuacja" ? "sytuacja" : "hero",
    simulateError: get("blad") === "1",
  };
}

/** Adres kolejnego ekranu z tymi parametrami ścieżki, które różnią się od domyślnych. */
export function flowHref(path: string, flow: Partial<Flow>): string {
  const merged = { ...DEFAULT_FLOW, ...flow };
  const query = new URLSearchParams();
  if (merged.origin !== DEFAULT_FLOW.origin) query.set("z", merged.origin);
  if (merged.entry !== DEFAULT_FLOW.entry) query.set("wejscie", merged.entry);
  if (merged.simulateError) query.set("blad", "1");
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

/** „Wróć” cofa o jeden ekran. Z ekranów eZUS wraca na stronę główną. */
export function backHref(screen: "login" | "register" | "loginGov" | "mObywatel", flow: Flow): string {
  const keep = { origin: flow.origin, entry: flow.entry };
  switch (screen) {
    case "login":
    case "register":
      return "/";
    case "loginGov":
      return flowHref(flow.origin === "rejestracja" ? AUTH_PATHS.register : AUTH_PATHS.login, {
        entry: flow.entry,
      });
    case "mObywatel":
      return flowHref(AUTH_PATHS.loginGov, keep);
  }
}
