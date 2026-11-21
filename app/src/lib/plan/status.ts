import type { CaseState, Stop } from "../demo/types";

/** Skrót statusu na ścieżce („Jeden model statusów”). */
export type PathStatus = "Przed Tobą" | "Do zrobienia" | "W trakcie" | "Wysłane" | "Wymaga uwagi" | "Załatwione";

export type DocGroup = "do-zalatwienia" | "wyslane" | "na-pozniej" | "zakonczone";

export const DOC_GROUP_LABEL: Record<DocGroup, string> = {
  "do-zalatwienia": "Do załatwienia",
  wyslane: "Wysłane",
  "na-pozniej": "Na później",
  zakonczone: "Zakończone",
};

const PATH: Record<CaseState, PathStatus> = {
  warunek: "Przed Tobą",
  aktualna: "Do zrobienia",
  szkic: "W trakcie",
  wypelniony: "W trakcie",
  zatwierdzony: "W trakcie",
  wyslano: "Wysłane",
  wezwanie: "Wymaga uwagi",
  "odmowa-w-terminie": "Wymaga uwagi",
  zalatwione: "Załatwione",
  "nie-korzystam": "Załatwione",
};

const DOC: Record<CaseState, { group: DocGroup; label: string }> = {
  warunek: { group: "na-pozniej", label: "Na później" },
  aktualna: { group: "do-zalatwienia", label: "Do rozpoczęcia" },
  szkic: { group: "do-zalatwienia", label: "Szkic" },
  wypelniony: { group: "do-zalatwienia", label: "Wypełniony · do sprawdzenia" },
  zatwierdzony: { group: "do-zalatwienia", label: "Zatwierdzony · do przekazania" },
  wyslano: { group: "wyslane", label: "Wysłano w symulacji" },
  wezwanie: { group: "do-zalatwienia", label: "Do uzupełnienia po wezwaniu" },
  "odmowa-w-terminie": { group: "zakonczone", label: "Odmowa · wymaga uwagi" },
  zalatwione: { group: "zakonczone", label: "Zakończone" },
  "nie-korzystam": { group: "zakonczone", label: "Nie korzystasz" },
};

export function pathStatus(stop: Stop): PathStatus | "Odhaczone" | "Nic nie musisz robić" | "Informacja" {
  if (stop.kind === "informacja" || stop.kind === "program-zdrowotny") {
    return stop.checked ? "Odhaczone" : "Informacja";
  }
  if (stop.kind === "dzieje-sie-samo" && !stop.state) return "Nic nie musisz robić";
  return stop.state ? PATH[stop.state] : "Przed Tobą";
}

export function docStatus(state: CaseState): { group: DocGroup; label: string } {
  return DOC[state];
}

/** Sprawa, przy której rodzic nie ma już nic do zrobienia (blokuje pionka, gdy false). */
export function isResolved(stop: Stop): boolean {
  if (stop.kind === "informacja" || stop.kind === "program-zdrowotny") return Boolean(stop.checked);
  if (stop.kind === "dzieje-sie-samo") return true;
  return stop.state === "zalatwione" || stop.state === "nie-korzystam" || stop.state === "wyslano";
}
