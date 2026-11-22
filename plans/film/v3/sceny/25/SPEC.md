# 25 · Specyfikacja odpowiedzi Zusika

**48–50 s** · klatki filmu 1440–1499 · 30 kl./s · układ 1280 × 720.

Po cięciu z 24 zachowaj biały panel od x=427 i początek tekstu na x=518. Na miętowym tle #F5FAF7 ustaw maskotkę w ramce 262 × 262 px o środku (241,328). Podpis „Agent AI · RAG” wyśrodkuj na x=241, na bazie y=529. Po prawej ustaw „Zusik” na (518,239). Poniżej dwa wiersze w Domine 49 px na bazach y=331, 401, kolejno „Oboje możecie korzystać” i „z urlopu jednocześnie.”. Podpisy i link używają Inter. [Wyjście sceny 24](../24/SPEC.md) · [Układ typograficzny w v2](../../../v2/sceny/25/klatki.jpg) · [Styl aplikacji](../../../../../DESIGN.md)

| Klatki lokalne | Ruch i punkty kontroli |
| --- | --- |
| 0–11 | Czytelny cały tekst i spokojna pozycja ciała. W oryginalnym modelu uruchom jeden gest stanu `answering`. W klatce 0 widać uśmiech, w 5 największe otwarcie warstwy `mouth-open`, w 11 znowu tylko uśmiech. Pozycja oczu odpowiada początkowemu przesunięciu (0,−4) w jednostkach SVG postaci. |
| 12–25 | W 12–17 ciało i oczy pozostają w spoczynku. W 18–25 obie źrenice idą w prawo i w dół ku lewemu brzegowi przypisu. Kończą z przesunięciem (+22,+14) względem geometrii źrenic. Każdy blik pokonuje jedną piątą przemieszczenia swojej źrenicy. |
| 26–39 | Przechyl grupę ciała o 5° zgodnie z ruchem wskazówek i opuść środek ramki do (241,332). Cień pozostaje poziomy. Pod linkiem „Kodeks pracy · art. 182¹a § 6” narysuj kreskę od x=518 do x=950 na y=531. Sam napis ma stałą bazę (518,519), szerokość 432 px, Inter 31 px o grubości 600 i kolor #1A8648. |
| 40–59 | Usta zamknięte, spojrzenie na odnośnik, podkreślenie pełnej długości. Utrzymaj tę pozę. Klatka 0 sceny 26 przejmuje wszystkie warstwy. Od klatki 1 otwiera się książka tego samego modelu w stanie `reading`, przy nieruchomym tytule przepisu. |

Pozę twarzy i książki próbkuj według lokalnej klatki na jednej instancji oryginalnego modelu. Wyłącz interaktywną pętlę mowy i losowe gesty na czas tego ujęcia. Zachowaj półksiężyc, trzy kropki, ręce i cień ze wzorca. [Model Bąbelka](../../../../../app/src/components/mascot/babelek/Babelek.tsx) · [Ruch oczu i blików](../../../../../app/src/components/mascot/babelek/useStateAnimation.ts#L107) · [Poza książki](../../../../../app/src/components/mascot/babelek/shapes.ts)

**Próba odbiorowa.** Odtwórz 48–52 s w wyciszonym podglądzie szerokim na 360 px. Po jednym pokazie widz powinien móc powtórzyć odpowiedź Zusika i wskazać przepis, zanim otworzy się książka. Przejdź klatki 0–11, licząc jeden pełny cykl ust. Porównaj 17, 25 i 39, aby zobaczyć kolejność ruchu oczu, ciała i kreski. Nałóż klatkę 1499 na 1500 i sprawdź zgodność konturu, źrenic, liter i obu końców podkreślenia. Sprawdź również klatkę 25 po skoku z obu stron osi i po ponownym otwarciu odtwarzacza. [Kryteria produktu](../../PRODUKT.md) · [Wejście w źródło](../26/SPEC.md)
