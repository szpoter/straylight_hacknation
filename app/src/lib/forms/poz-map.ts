/** Dziennik Ustaw 2020 poz. 1143, strony 2–10. Współrzędne w punktach PDF od lewego dołu. */
export const POZ_TEMPLATE = "/forms/poz-mz-2020-1143.pdf";
export const POZ_SHA256 = "34eea84267c338db365bd671313fc3a55aeedf130021282a22667fcb6d2bc6a4";

export const POZ_MAP = {
  "Lekarz POZ": { page: 2, dx: 0, dy: 0, providerY: 623.4, medicY: 307.6, medicNameY: 355, dateY: 94, providerReasonY: 471.3, medicReasonY: 155.5 },
  "Pielęgniarka POZ": { page: 5, dx: -0.7, dy: 25.3, providerY: 624, medicY: 336.4, medicNameY: 391, dateY: 162, providerReasonY: 511.3, medicReasonY: 223.9 },
  "Położna POZ": { page: 8, dx: -1.6, dy: 25, providerY: 622.7, medicY: 333.2, medicNameY: 388, dateY: 159, providerReasonY: 510, medicReasonY: 220.6 },
};

export const POZ_CHOICES = [
  "Pierwszy lub drugi wybór",
  "Trzeci lub kolejny – zmiana miejsca zamieszkania",
  "Trzeci lub kolejny – zakończenie udzielania świadczeń",
  "Trzeci lub kolejny – inna przyczyna po stronie przychodni",
  "Trzeci lub kolejny – inna okoliczność",
];
