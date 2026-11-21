# Odbiór Zusika na /app

Kolejność prac dla tego wydania. Każdy wynik mierzymy na publicznych źródłach i fikcyjnych danych. Odbiór produkcji dotyczy konkretnego commita i aktywnej domeny Vercela.

| Krok | Praca | Dowód zakończenia |
|---|---|---|
| 1 | Porównać main, widok Claude’a i odrębną implementację Kamila. Sprawdzić aktualne modele na maszynie i dostęp do usług. | Lista działających endpointów i różnic w funkcjach. |
| 2 | Zintegrować OCR, aktualny szablon ZAM, czcionki i skrypty budujące publiczne workery. | Test tekstowego PDF, skanu po polsku, błędnego znaku i wygenerowanego ZAM. |
| 3 | Dla Marty liczyć daty kalendarzowe i kwoty ze stawek dziennych. Zapisywać wybór, oświadczenie i stan odpisu w sprawie sesji. | Ten sam szkic po F5, obie osie czasu i dwie daty graniczne. Przy braku stawki kwota pozostaje nieustalona. |
| 4 | Dla chorobowego odczytać okres i udokumentowane tytuły. Oddzielić materiał akt od wersjonowanego prawa; pokazać pytanie o inny tytuł. | Pełny dowód daje ocenę za wskazany okres; sprzeczność, wcześniejszy tytuł lub luka prowadzi do wyjaśnienia. |
| 5 | Podłączyć powyższe trzy ścieżki do /app. Zweryfikować PDF Marty, PDF ZAM i powrót do źródła chorobowego. | Dwa odrębne działania zatwierdzenia i przekazania w symulacji. Druga sesja nie widzi dokumentów pierwszej. |
| 6 | Sklasyfikować pliki konkursowe, zindeksować publiczne przepisy, instrukcje i oficjalne odpowiedniki. Powiązać źródła sprawy z daną sesją; nie umieszczać cudzych akt w publicznym zbiorze. | Manifest, sumy, liczba punktów dla aktywnej wersji i ponowienie importu bez duplikatów. |
| 7 | Sprawdzić retrieval na znanych i nowych pytaniach wraz z wyjątkami i odmową bez podstawy. | Cztery podstawowe próby Marty i próg 18/20 trafień w pierwszej piątce. Osobny raport generacji i pokrycia źródeł. |
| 8 | Przygotować niezależne przykłady M1/M2, K1/K2, D1/D2. | M1: 7280 zł, 28/56 dni. M2: brak stawki, odpis w aktach. K1: nowy skan, 15–21 grudnia. K2: zmiana początku na 16 grudnia. D1: rozstrzygnięty okres. D2: niepełne dowody lub inny tytuł. |
| 9 | Sprawdzić dwa równoległe zapisy, F5 i odczyt z obcej sesji. Zbudować projekt Node 24. | Wyniki testów, lint, typy i działający build z workerami, fontami, szablonami i korpusem. |
| 10 | Wysłać zweryfikowaną integrację na main, sprawdzić GitHub Actions, następnie przejść przez publiczne /app. | Działający URL, wersja, czasy rzeczywistych prób i wykaz niedomkniętych punktów. |
| 11 | Zweryfikować faktyczny silnik modelu. Dla laptopa sprawdzić lokalny identyfikator, chroniony HTTPS i żądanie z Vercela. | Test odmowy dostępu anonimowego i odpowiedź na pytanie z cytatem z uprawnionego wdrożenia. |
