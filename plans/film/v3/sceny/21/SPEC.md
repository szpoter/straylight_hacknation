# 21 · Specyfikacja ujęcia „Marta otwiera plan”

Autor planu: s21

40–42 s, klatki filmu 1200–1259. Podgląd 1280 × 720 przy 30 kl./s. Początek układu współrzędnych leży w lewym górnym rogu. Kamera stoi przez dwie sekundy.

Na tle #F5FAF7 umieścić tytuł „Import danych rodziny Oli” w Domine 60 px i poniżej pełny wiersz „Marta Lis i Paweł Lis · dane z mObywatela i mZUS” w Inter 44 px. Obie linie zaczynają się na x=80, linie bazowe na y=195 i y=270. U góry pasek #FCDCAA o wysokości 72 px z czytelnym komunikatem „Wersja demonstracyjna · nie podawaj prawdziwych danych” w Inter 42 px. Źródłem danych, podpisu i oznaczenia są trzy elementy ekranu logowania. [Sekcja importu](../../../../../app/src/features/auth/ezus/ezus-methods.tsx) · [Rodzina Oli](../../../../../app/src/lib/family/ola.ts) · [Pasek demonstracji](../../../../../app/src/features/auth/auth-shell.tsx)

| Klatki | Pozycje i synchronizacja |
| --- | --- |
| 0–13 | Lewa krawędź kapsuły na x=545 przejmuje oś obu wierszy tytułu ze sceny 20. Środek (859,378), rozmiar 628 × 104 px, promień 52 px, kolor #1A8648. Oryginalny napis „Importuj dane i otwórz plan”, biały Inter Medium 44 px, jest wyśrodkowany. Grot z (1190,505) dochodzi łukiem do (1140,399). [Przycisk i akcja przejścia do planu](../../../../../app/src/features/auth/open-family-plan.tsx) · [Styl kapsuły](../../../../../app/src/components/ui/AppButton.tsx) |
| 14–17 | Na początku słowa „loguje” grot stoi na powierzchni przy prawej krawędzi. Kapsuła i podpis przechodzą ze skali 1,00 do 0,95. Najgłębszy nacisk w klatce 17 odpowiada 40,57 s filmu. Zgrać ten kontakt z akcentem w istniejącym głosie przy odsłuchu. [Narracja referencyjna](../../../v2/media/narrator.flac) |
| 18–40 | W klatkach 18–32 jedna krzywa powrotu doprowadza skalę do 1,00, z najszybszym ruchem na początku. Grot odchodzi w dół i znika do klatki 32. W klatkach 33–40 przycisk stoi w położeniu początkowym. |
| 41–59 | Rysować poziomy odcinek #1A8648 o grubości 5 px, zaokrąglone zakończenie, y=641. Od x=−4 w klatce 41 prowadzić koniec w prawo o 18 px na klatkę. Kolejne pozycje końca na styku to x=302 w 21/58, x=320 w 21/59 i x=338 w 22/0 przy tym samym y. [Początek mapy v2](../../../v2/sceny/22/scene.mjs) |

## Próba odbiorowa

Zmniejszyć cały kadr do szerokości 360 px. W klatkach 0, 17 i 40 odczytać cały napis przycisku, „Wersja demonstracyjna” i „dane z mObywatela i mZUS” bez powiększania obrazu. Przy pełnym nacisku napis przycisku ma około 11,8 px w tej próbie. Grot pozostaje poza literami. Przy odtwarzaniu 20/59 → 21/0 porównać lewą krawędź tytułu i kapsuły. Na styku 21/58 → 22/0 sprawdzić trzy kolejne pozycje końca linii, jej wysokość, kolor i tempo. [Plan i przykłady](PLAN.md) · [Poprzednie ujęcie](../20/SPEC.md) · [Następne ujęcie](../22/SPEC.md)

## Realizacja v3 (autor s21, blok b19)

- Kod: [`scene.mjs`](scene.mjs), eksportuje `BUTTON` i `lineEnd(f)`. Tło #F5FAF7. Pasek #FCDCAA ma 72 px wysokości, tekst Inter 42 px od x = 74 (szerokość tekstu w renderze 1173 px). Tytuł Domine 60 px leży na (80,195). Wiersz Inter 44 px leży na (80,270), imiona są w kolorze #283754 / 500, źródła w #5E697F. Kolor drugiej części wiersza oznaczam „do weryfikacji”, bo SPEC go nie podaje. Kapsuła: środek (859,378), 628 × 104, rx 52, #1A8648, biały napis Inter 500 44 px (szerokość 574 px, mieści się w kapsule).
- Grot: (1190,505) → (1140,399) w kl. 13. Skala przycisku: 1 → 0,95 w 14–17 i powrót w 18–32. Linia: y = 641, 5 px, koniec −4 + 18·(f − 41), czyli 302 w kl. 58 i 320 w kl. 59.

## Odbiór

- 20/59 → 21/0: lewy brzeg kapsuły (545) leży na osi początku „Przewodnik”/„Rodzica” (545). Sprawdzone na klatkach 1199 i 1200.
- Kl. 0, 17 i 40 w podglądzie 360 px: czytelny jest cały napis przycisku, „Wersja demonstracyjna” i „dane z mObywatela i mZUS” (`robocze/b19/w360.png`). Grot w kl. 17 stoi na prawym zaokrągleniu kapsuły, poza literami.
- 21/59 → 22/0: koniec linii przechodzi z 320 na 338 na tym samym y, w tym samym kolorze i tempie 18 px/kl.
