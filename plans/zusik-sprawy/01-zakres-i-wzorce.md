# 01 · Jak zamienić przykładowe sprawy ZUS w sprawdzian aplikacji

**Wynik etapu:** zespół ma prywatny klucz odpowiedzi i powtarzalny sposób sprawdzenia, co ZUSik ustalił z dokumentów przedstawionych przez rodzica. Pierwszy pakiet prac kończy się dwoma ręcznie sprawdzonymi sprawami. Pozostałe rozpisujemy równolegle z budową aplikacji.

## Wymagania organizatora i nasz sposób ich sprawdzenia

| Miejsce w briefie | Co musi dać się zrobić | Jak pokażemy to w zwykłym czacie |
|---|---|---|
| Materiały dla zespołu, s. 12–13 | Z akt można ustalić, o co ubiega się osoba, co złożyła i czy ZUS przyznał świadczenie. Akta przeznaczono do pracy konkursowej. | Prywatny test używa oryginału na urządzeniu jurora lub testera. Przy publicznych próbach używamy własnych syntetycznych plików. Kafelki czatu uruchamiają zwykłe pytanie bez wczytania danych przykładowej rodziny. |
| Rozdz. 3 a, h | Rozpoznać świadczenia związane z ciążą, brak uprawnień i ryzyka. | Rodzic dostaje osobny wynik za każdy oceniany okres oraz przyczynę odmowy, wskazanie braku lub informację o dalszym świadczeniu. |
| Rozdz. 3 b–f i j | Policzyć okres i kwotę według danych tej osoby. Uwzględnić oboje rodziców, liczbę i wiek dzieci, „Za życiem”, pracę, adopcję i pieczę. | Użytkownik widzi podstawę, okres, stawkę, rachunek i oba warianty na życzenie. Jedna sprawa może zawierać kilka świadczeń i kilka odrębnych wyników. |
| Rozdz. 3 g, i | Wyjaśnić dokumenty, termin, właściwego odbiorcę i w szczególnych sytuacjach wskazać wsparcie. | Pytanie „co teraz?” korzysta z tego samego wyniku, wskazuje właściwy formularz i odbiorcę, a w trudnej sytuacji daje możliwość otwarcia istniejącego katalogu pomocy. |
| Rozdz. 3, wymagane symulacje | Umożliwić pobranie danych ubezpieczeniowych lub ręczne ich podanie, podgląd e-ZLA, zadłużenie w dniu powstania prawa i dostęp do konta eZUS. | Tester otwiera profil osoby z tej sprawy i może wskazać, skąd pochodzi każdy fakt wpływający na odpowiedź. Demo wyraźnie oznacza dane symulowane. |
| Rozdz. 4 i 6, s. 15–16 | Na stronie ma działać upload lub wybór przykładu. Jury użyje niektórych opublikowanych wniosków i sprawdzi poprawność wyliczeń. | Wejście bezpośrednio z czatu. Próby pełnego pakietu, pojedynczego wniosku i późniejszego dołączenia zaświadczenia. Format próby wybiera juror. |

Podstawą odbioru jest [oryginalne zadanie ZUS](../../Materiały%20hackathonowe/ZUS%20-%20Pełna%20treść%20zadania%20konkursowego.pdf). Cele jakościowe w tym planie ustala zespół. Organizator nie podaje minimalnej liczby spraw ani progu procentowego.

## Co wiemy o zbiorze

22 listopada 2026 policzono bajtowe skróty wszystkich PDF-ów i liczbę stron. W prywatnym indeksie na Macu znajduje się dokładnie ten sam zbiór skrótów. [Indeks lokalny](../../app/scripts/private-case-index.py) · [Inwentarz bez danych osobowych](07-inwentarz-spraw.csv)

| Właściwość | Wynik | Znaczenie |
|---|---:|---|
| Pliki / unikalne pakiety | 87 / 86 | HN-018 występuje dwa razy. Wynik jakości liczymy raz, a drugą kopią testujemy ponowne wgranie. |
| Strony w unikalnych pakietach | 2008 | Każda strona ma dostać status. Sprawdzamy także dokumenty za ostatnią rozpoznaną stroną wniosku. |
| Zakres / 95. percentyl długości | 8–74 / 52 strony | HN-072 jest testem 74 stron. Sprawdzamy także przeciętny plik i serię krótszych w jednej rozmowie. |
| Rozmiar największego pliku | 6 418 746 bajtów | Granicę rozmiaru i pamięci dobieramy także pod telefon. Tester może wgrać ten plik przez faktyczny interfejs. |
| Metoda w prywatnym indeksie | 1744 strony OCR, 264 oznaczone jako puste | Etykieta „blank” opisuje wynik czytnika na Macu. Przy braku potrzebnej informacji tester ogląda również te strony. Nie jest to pomiar jakości OCR w przeglądarce. |

**Jak odtworzyć ID:** lokalnie policzyć SHA-256 oryginalnych bajtów, usunąć duplikaty, posortować pełne skróty rosnąco jako tekst ASCII małymi literami. Kolejne pozycje mają ID od HN-001 do HN-086. Zamrozić prywatne mapowanie dla tej edycji. Przy nowej edycji zachować stare ID i dopisać nowe. Plik CSV zawiera wyłącznie metadane oraz robocze tematy z opisów plików. Tagi zachodzą na siebie, a niektóre opisy mówią tylko „zasiłek macierzyński”. O faktycznej rodzinie świadczeń i wyniku rozstrzyga przegląd treści. ID, nazwa pliku, numer sprawy i skrót nie mogą wybierać odpowiedzi w aplikacji.

## Jak przygotować wzorzec jednej sprawy

1. **Tester** uruchamia lokalny indeks i otwiera oryginał tylko na stanowisku konkursowym. Wydziela stronami zgłoszenie, formularze, dowody pierwotne, uzupełnienia, rozliczenie ZUS i decyzję. Zaznacza częściowo czytelne oraz dokumenty dotyczące drugiej osoby. Dla stron mieszanych wskazuje obszar tabeli lub pola.
2. **Osoba merytoryczna** z dokumentów wejściowych odtwarza żądanie, tytuł ubezpieczenia, okresy i właściwą wersję przepisów. Dla każdej osoby, każdego świadczenia i okresu zapisuje oczekiwane ustalenia oraz dokładny wykaz danych potrzebnych do wyliczenia. Oznacza dzień, na który dokonuje oceny. Rozróżnia wiedzę dostępną przy pierwszym wniosku i przy ostatnim uzupełnieniu.
3. **Druga osoba** porównuje to z rozstrzygnięciem w aktach. Każde pole dostaje pochodzenie: „w aktach”, „niezależnie przeliczone”, „nie podano” albo „wymaga wyjaśnienia”. Sprzeczność trafia na listę rozbieżności wraz z numerami stron. Data przelewu, okres prawa, okres wniosku i data wydania decyzji mają osobne pola.
4. **Tester** zapisuje poza repo prywatny klucz: ID, wersja, świadczenia i podmiot, lista stron wejściowych i wyłączonych, oczekiwana decyzja i uzasadnienie dla okresu, płatnik, przedziały, podstawa, stawka, kwota w groszach z typem (dzienna/miesięczna/suma, brutto/netto), braki, wymagane dowody, wersja reguły, status drugiego przeglądu. Nie zamienia braku kwoty na zero. Jeśli kwoty nie da się zweryfikować, sprawa może sprawdzić decyzję, ale pozostaje poza mianownikiem dokładności kwoty.
5. **Wykonawca reguł** dostaje syntetyczny odpowiednik z innym nazwiskiem, datą, kwotą i układem stron. Zakodowane na stałe dane przykładu przestaną pasować. Wspólny Git zawiera tylko takie fikcyjne dokumenty, testy reguł i wyniki zbiorcze. Oryginały, treść OCR, zrzuty stron i klucz porównań pozostają na stanowisku testowym.
6. **Test progresywny.** Uruchomić najpierw sam formularz, potem dołożyć dokument ubezpieczeniowy, na końcu dane płacowe. Odnotować moment, gdy wystarcza dowodów do rozstrzygnięcia uprawnienia, oraz osobno do wyliczenia kwoty. Aplikacja ma prawo odpowiedzieć wcześniej tylko na część pytania.

## Pierwsze dwie sprawy, potem różne rodziny

- Wybrać z treści akt potwierdzoną odmowę chorobowego z powodu braku ubezpieczenia i potwierdzone przyznanie z kwotą oraz pełnymi danymi do rachunku. Kandydatów znaleźć w CSV, następnie sprawdzić komplet dokumentów. Nazwa pliku nie wystarcza do ustalenia wzorca.
- Po tych dwóch przejściach dołączyć ojcowski (HN-018, test duplikatu), saldo składek (kandydat HN-005), świadczenie w wysokości macierzyńskiego (HN-020), przyjęcie dziecka (HN-034), pracę podczas urlopu (HN-057), podwyższenie kwoty (HN-054) oraz pakiet najdłuższy (HN-072). To podpowiedzi dla osoby przygotowującej testy. Ostateczny przydział do próby jawnej i odłożonej ustala opiekun zbioru.
- Uzupełniać dalej o wiele tytułów i płatników, zlecenie, decyzje częściowe, opiekę dzieloną, hospitalizację, wcześniactwo, stratę dziecka, ustanie zatrudnienia i przypadki spornej podstawy. Mapa [reguł i rachunków](04-reguly-i-kalkulator.md) wskazuje, jaki wariant wymaga osobnego dowodu. Dla wymogu briefu bez odpowiedniego pakietu utworzyć fikcyjny zestaw i oznaczyć jego pochodzenie.
- Odpowiedzi prawne i oczekiwane kwoty do spornej rodziny zamknąć na podstawie wersji źródeł właściwej dla akt. Pytania o minimalną podstawę, limit, wersje formularzy, zaokrąglenia i sposób wyboru PDF można prowadzić w [rejestrze pytań zespołu](../../PYTANIA-MENTORZY-ZUS.md). Taki brak wstrzymuje tylko zależne obliczenie.

**Odbiór:** inny członek zespołu potrafi sam odnaleźć HN-018, odtworzyć jego dwa aliasy i wskazać, które strony wolno podać aplikacji przy ocenie własnego rachunku. Co najmniej dwa pierwsze wzorce mają drugi przegląd. Na koniec każda z 86 pozycji ma status, również pozycje nieweryfikowalne, sporne i znane już autorom. Procedurę pomiaru opisuje [plan testów](06-testy-i-wydanie.md).
