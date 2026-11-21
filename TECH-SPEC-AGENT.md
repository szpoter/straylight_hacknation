# Zusik — specyfikacja techniczna agenta

**Szkic do rozmowy · 21 listopada 2026.** Proponowana kolejność wynika z tego, co jury sprawdzi na własnym pliku i jakiej decyzji rodzic potrzebuje przed rozpoczęciem wniosku. Wybór technologii pozostaje otwarty. [Opis zadania, s. 11–15](<Materiały hackathonowe/ZUS - Pełna treść zadania konkursowego.pdf>)

## 1. Czy w tej konkretnej sytuacji przysługuje mi świadczenie?

**Trudność.** Wśród spraw ZUS są odmowy z różnych powodów, m.in. brak ubezpieczenia na dzień porodu i wniosek o kolejną część urlopu rodzicielskiego. Informacja o zatrudnieniu dzisiaj nie wystarcza do ustalenia stanu z dnia zdarzenia. Brak potwierdzenia ubezpieczenia w aktach też nie przesądza o odmowie.

**Zachowanie Zusika.** Ustala osobę, świadczenie, właściwą datę i fakt, który zmienia wynik. Korzysta z reguły obowiązującej dla sprawy. Kiedy rozstrzygnięcia brakuje, zadaje jedno pytanie o ten fakt albo wskazuje dokument potrzebny do jego potwierdzenia.

**Próba odbioru.** Dla sprawy z potwierdzonym brakiem ubezpieczenia rodzic widzi przyczynę, datę, źródło faktu i podstawę reguły. Po usunięciu dowodu rozstrzygającego wynik przechodzi w „brakuje informacji”, jeżeli pozostałe dane nie wystarczają. [Sprawy testowe w specyfikacji rodzica](SPEC-PO-LOGOWANIU.md#przetestuj-przykładową-sprawę)

## 2. Którym danym w aktach można zaufać?

**Trudność.** W paczce są 87 plików, w tym 86 unikalnych, i 2020 stron bez warstwy tekstowej. Jeden plik może łączyć wniosek rodzica, zaświadczenie płatnika, zrzut systemowy i rozstrzygnięcie. Okres wnioskowany i potwierdzony mogą wyglądać podobnie. Wynik bywa widoczny nawet w nazwie pliku.

**Zachowanie Zusika.** Przy wartości potrzebnej do wyniku zachowuje jej znaczenie, dokument i stronę. Pokazuje źródłowy fragment przy niepewnym odczycie. Rodzic może poprawić odczyt lub utworzyć wariant „co jeśli”. Korekta danych i symulacja mają inne skutki.

**Próba odbioru.** Jury zmienia nazwę pliku i odkłada stronę z końcową decyzją. Dla pozostałych dowodów aplikacja wylicza wynik lub wskazuje konkretny brak. Dopiero potem porównuje wynik z decyzją. Inspiracją jest reprezentacja dokumentu w Docling, która wiąże element dokumentu ze stroną i położeniem. [Docling Core na GitHubie](https://github.com/docling-project/docling-core/blob/main/docling_core/types/doc/document.py)

## 3. Co się zmieni, jeśli inaczej podzielimy opiekę?

**Trudność.** Rodzice zmieniają jedną rzecz w swoim planie, a jej skutki dotyczą dwóch osób. Dni opieki mogą się pokrywać, podstawy zasiłku mogą być różne, a praca na część etatu wprowadza odrębny wariant. Kwota zasiłku i łączny dochód rodziny to różne wielkości.

**Zachowanie Zusika.** Tłumaczy wypowiedź rodzica na zmianę założenia w kopii planu. Kalkulator liczy według tej samej wersji reguł. Rodzic widzi obok siebie daty, czas opieki i kwoty dla każdej osoby, a pod nimi jedno zdanie wyjaśniające różnicę.

**Próba odbioru.** W fikcyjnym przykładzie z naszej specyfikacji każdy rodzic ma 28 dni i ustaloną stawkę dzienną. Zmiana „kolejno” na „razem od tego samego dnia” skraca czas kalendarzowy z 56 do 28 dni. Suma zasiłków za te odcinki w obu wariantach wynosi 6860 zł brutto. Brak podstawy drugiej osoby pozwala nadal pokazać daty. Z OpenFisca warto zaczerpnąć sposób modelowania świadczeń za pomocą jawnych reguł i okresów. [Przykład zespołu](SPEC-PO-LOGOWANIU.md#przykład-do-makiety-i-odbioru) · [OpenFisca na GitHubie](https://github.com/OpenFisca/openfisca-core)

## 4. Co mam zrobić teraz i kto odpowiada za dokument?

**Trudność.** Ten sam cel rodzica może oznaczać wniosek urlopowy do pracodawcy, wniosek o świadczenie albo oczekiwanie na zaświadczenie płatnika. Starsze akta mogą zawierać ZAO lub ZUR, których zakres przejął ZAM. Sama nazwa odnalezionego druku nie określa następnego kroku.

**Zachowanie Zusika.** Wskazuje jedną czynność, wykonawcę, odbiorcę oraz termin z jego podstawą, gdy jest znany. W szkicu wykorzystuje potwierdzone dane i pyta o wybory lub oświadczenia rodzica. Przy wezwaniu identyfikuje wskazany brak i wiąże uzupełnienie z właściwą sprawą.

**Próba odbioru.** Pracownik planujący urlop ojcowski trafia do szkicu dla pracodawcy. W scenariuszu wymagającym Z-3 widzi, co przekazuje płatnik. Gdy potrzebny jest nowy ZAM, szkic korzysta z aktualnego wzoru i pokazuje przed zatwierdzeniem okres oraz oświadczenia. Z docassemble warto zaczerpnąć prowadzenie wywiadu według informacji potrzebnych do przygotowania konkretnego dokumentu. [Aktualny ZAM](https://www.zus.pl/-/wniosek-zas-54-1) · [docassemble na GitHubie](https://github.com/jhpyle/docassemble)
