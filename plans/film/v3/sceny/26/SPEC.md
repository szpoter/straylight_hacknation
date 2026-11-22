# 26 · Specyfikacja ujęcia „Skąd Zusik to wie”

50–52 s, klatki filmu 1500–1559. Kadr 1280 × 720, lokalnie 0–59 przy 30 kl./s.

| Klatki | Ustawienie i warunek przekazania |
| --- | --- |
| 0–7 | W 0 przejąć pozę, źrenice, podpis „Agent AI · RAG” i odpowiedź ze sceny 25. Środek Zusika (241, 332), szerokość 262 px, biały panel od x = 427. Napis „Kodeks pracy · art. 182¹a § 6” przez całe ujęcie ma początek w (518, 519), a jego zielona kreska biegnie po y = 531 od x = 518 do 950. W 7 obie strony książki łączy widoczny grzbiet. |
| 8–18 | Odtworzyć pojedynczy ruch warstwy `book-page` wokół `BOOK.spine`, kierując prawy róg ku lewej krawędzi przypisu. Po kontakcie rozszerzyć jasną powierzchnię nad tytułem do prostokąta x = 150–1130, y = 182–552. W 18 tekst i wydawca są odsłonięci, brzeg karty omija litery, cała postać kończy ruch. Wariant oczami zajmuje klatki 1–6, karta otwiera się w 7–18. |
| 19–29 | Domine dla cytatu, Inter dla tytułu i podpisu. Drugi wiersz zaczyna się od „jednocześnie”, na podstawie y = 416. Na y = 429 narysować pod tym słowem kreskę o wysokości 7 px w kolorze #A6D0B8 od x = 227 do 500. |
| 30–59 | Wszystkie 30 klatek identyczne. W pierwszej klatce 27 lewy górny punkt podkreślenia dat „11 stycznia – 7 lutego 2027” również wypada w (227, 429). |

**Treść karty.** Wydawca „Sejm RP · Dz.U. 2026 poz. 1245”. Pierwsze zdanie fragmentu `kp-art182-1a-par6` podzielić po słowach „mogą” i „oboje”. [Fragment, s. 66](../../../../../app/corpus/marta/fragments.jsonl#L6) · [Dokument i wydawca](../../../../../app/corpus/marta/manifest.json#L10)

> „Z urlopu rodzicielskiego mogą jednocześnie korzystać oboje pracownicy – rodzice dziecka.”

**Stan modelu.** Użyć filmowej instancji z oryginalną geometrią `book`, warstwą `detail-book`, ruchomą stroną i twarzą Zusika. W aplikacji `reading` prowadzi oczy od początku do końca wiersza. Tutaj wykorzystać jeden taki przebieg i wyznaczyć pozę z numeru klatki, łącznie z obrotem strony. [Obrys i geometria strony](../../../../../app/src/components/mascot/babelek/shapes.ts#L148) · [Ruch oczu](../../../../../app/src/components/mascot/babelek/useStateAnimation.ts#L192) · [Obrót strony](../../../../../app/src/components/mascot/babelek/AnimatedSvg.tsx#L250)

**Próba odbiorowa.** Wyciszyć klip 48–52 s i obejrzeć go w 720p. Widz powinien móc wskazać kolejno odnośnik, stronę i słowo w cytacie. Jeśli gubi stronę lub książka zakrywa litery, sprawdzić wariant ze spojrzeniem. Na szerokości 360 px odczytać „jednocześnie” oraz „Sejm RP”. Porównać obraz 25/59 z 26/0, obrazy 26/30–59 między sobą oraz początki obu kresek na styku 26/59 i 27/0. Klatka 12 odtworzona po skoku w przód, wstecz i po ponownym otwarciu filmu ma pokazać tę samą stronę i te same źrenice. [Plan i przykłady ruchu](PLAN.md) · [Wejście z 25](../25/SPEC.md) · [Wyjście do 27](../27/SPEC.md) · [Układ cytatu w v2](../../../v2/sceny/26/klatki.jpg)

## Realizacja v3 (autor b24)

Moduł [`scene.mjs`](scene.mjs), `scene(f)`; postać z [`../25/zusik-ruch.mjs`](../25/zusik-ruch.mjs). Rewizja kitu nieużywana. Ramka Zusika jak w 25/59: środek (241, 332), 262 px, przechył 5°, przez całe ujęcie.

| Klatki | Ruch | Krzywa / źródło |
| --- | --- | --- |
| 0 | `scene25(59)` — identyczny obraz. | — |
| 1–18 | Obrys `BODY_POINTS` → `SHAPES.book` (96 punktów, `smoothPath`), twarz → `book.face` (x−24, skala 0,95), cień ×1,25, ramiona chowają się `tuckArm` i znikają do morph 0,5, bliki do 0,6. Postęp: sprężyna aplikacji `MORPH.into` (sztywność 140, tłumienie 14, masa 1) liczona z czasu `(f−1)/30`; 0,91 w 7, przerzut ≈1,10 w 11; w 13–18 resztę drgań wygasza smoothstep, w 18 dokładnie 1. | `useStateAnimation.ts` MORPH |
| 6–8 | `detail-book` (grzbiet, linie, strona) pojawia się wg `appearFrom 0,75`; w 7 widoczny grzbiet łączy obie strony. | AnimatedSvg DETAILS |
| 0–8 / 8–11 / 11–18 | Źrenice: (+22, +14) na link → powrót na początek wiersza (−26, −6) → jeden wiersz liniowo do (12, −6). | `READ` |
| 8–12 | Strona `book-page` (przeniesiona nad resztę kadru, w tym samym przeliczeniu ref → ekran z przechyłem) odchyla się: dolny zewnętrzny róg (1716,1384) dochodzi do (514, 494), tuż przed „K” linku; przesunięcie rośnie od grzbietu (0) do brzegu (1), w pionie tylko dolna część. Twarz nad stroną wygasa 9–12, pod nią zostaje (podnoszona strona zakrywa prawe oko). | smoothstep |
| 12–18 | Ta sama strona (4 boki po 40 punktów) przechodzi w prostokąt karty (150,182)–(1130,552) rx 35 (boki zgodne: grzbiet → lewy, góra → góra, brzeg → prawy). Wypełnienie #a3dab3 → #FFFFFF, obrys #338c5c → #D4D7DD, grubość 4,1 → 2 px; linie strony gasną. Od 18 dokładny `<rect>` jak w 27/0. Reszta ujęcia 25 i książka toną w #F5FAF7 (11–18). | smoothstep |
| 16–18 | Wydawca i cytat (przycięte do bieżącej karty) nabierają krycia; w 17 karta jest w 93 % rozłożona i obejmuje litery. | smoothstep |
| 19–29 | Kreska #A6D0B8 pod „jednocześnie”: (227, 429), szer. 0 → 273, wys. 7, rx 3,5. | softLand (expoOut 3,41, jak 27) |
| 30–59 | Wszystkie klatki = klatka 30. | — |

**Treść karty.** „Sejm RP · Dz.U. 2026 poz. 1245” Inter 29 px #5E697F (225, 269). Cytat Domine 47 px, odstęp −0,6, #283754, x=225, bazy 353 / 416 / 475: „„Z urlopu rodzicielskiego mogą” / „jednocześnie korzystać oboje” („jednocześnie” `textLength` 275, czyli x=225–500) / „pracownicy – rodzice dziecka.””. Tekst = pierwsze zdanie `sourceText` fragmentu `kp-art182-1a-par6` bez oznaczenia „§ 6.”. Link „Kodeks pracy · art. 182¹a § 6” z kreską stoi w (518, 519) przez całe ujęcie, nad kartą.

**Styk 26/59 → 27/0.** Karta (150,182)–(1130,552), rx 35, biała, obrys #D4D7DD 2 px; kreska (227, 429) 273 × 7, rx 3,5, #A6D0B8; tło #F5FAF7. Wnętrze karty (cytat → wybór i daty) oraz link wymienia cięcie, zgodnie z 27.

## Odbiór

Stopklatki 1500–1518 co 1–2 klatki, 1525, 1559, 1560. Render [ujecie-720p.mp4](ujecie-720p.mp4), [klatki.jpg](klatki.jpg), [pozy.jpg](pozy.jpg).

| Sprawdzenie | Wynik |
| --- | --- |
| 25/59 → 26/0 | Różnica 0. |
| Czytelność książki 720p | W 7–11 widać otwartą książkę z grzbietem, liniami i twarzą; wariant oczami niepotrzebny. Strona nie zasłania cytatu (tekst pojawia się dopiero na karcie, 16–18). |
| Ciągłość strony | 11–12: róg strony dotyka linku; 13–17: ta sama jasna powierzchnia rośnie do karty; 18: karta gotowa, Zusik pod miętą. |
| Kreska | 19–29 rośnie pod „jednocześnie”, x=227–500. |
| 30–59 | Identyczne (F = min(f, 30)). |
| 26/59 → 27/0 | Różnica 1559/1560 poza wnętrzem karty (x<154 lub >1126, y<186 lub >548): 0 pikseli. Pas kreski 222–505 × 426–437: 0. Różnią się tylko treść karty (cytat → wybór i daty, zamierzone) i link (zostaje w 26, nie ma go w 27). |
| Determinizm kl. 12 | Po skoku 1559 → 1512 i po świeżym starcie 1380 → 1465 → 1512: różnica 0. |
| 360 px | „jednocześnie” (≈ 13 px) i „Sejm RP” (≈ 8 px) czytelne. |

**Wynik.** Gest obejrzany klatka po klatce, bez problemu. Otwarte: (1) link przy dolnym brzegu karty jest blisko 3. wiersza cytatu (jak w v2, kotwica (518,519) z SPEC); (2) na cięciu 26/27 link znika razem z cytatem.
