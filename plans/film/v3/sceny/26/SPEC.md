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
