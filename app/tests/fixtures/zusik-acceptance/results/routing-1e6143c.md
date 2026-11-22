# Routing, pamięć i karty w zwykłym czacie

Baza to `1e6143c`. Poprawki mają identyfikatory `13059c3`, `1945a8d`, `73e8c25`, `fe26b44` i `87bfb10`. Oddzielny audyt manifestu ma SHA `b33005c`. Badanie obejmuje 28 publicznych scenariuszy G7. Pytania służyły do diagnozy i regresji. Nie mierzą trafności na nowych aktach. Użyto wygenerowanych danych i publicznych źródeł.

| Miara w Chrome | Baza w lokalnej konfiguracji aplikacji | Poprawka 73e8c25 z pełnym testowym indeksem |
|---|---:|---:|
| Doprecyzowanie | 2/12 | 12/12 |
| Pamięć po przeładowaniu i izolacja, zamrożony licznik | 0/8 | 6/8 |
| Wymagana karta i link według ogólnego licznika G7 | 0/8 | 0/8 |
| Wymagane karty w pierwszej trójce i linki każdej karty według pełnego manifestu | 0/8 | 8/8 |

Bazowy odczyt aplikacji potwierdził 510/897 fragmentów, a pełny adapter udostępniał wszystkie 897. To dwa różne środowiska. Na produkcie sprzed zmian również wcześniejszy odbiór na pełnym indeksie dawał 2/12, 0/8 i 0/8. Oddzielny test z kontrolowanymi, pełnymi trafieniami na tych samych pytaniach o dalsze świadczenia wzrósł z 0/8 do 8/8 po samej zmianie routingu.

W końcowej próbie 28 scenariuszy przeszło przez pole wiadomości bez błędów HTTP i bez przerwanych tur. Ogólny licznik UI uznaje tylko źródła z małego słownika gold. Nie ma w nim żadnego z jedenastu głównych źródeł katalogu kart ani dopuszczonych źródeł dla dwóch scenariuszy pamięci. Dodatkowy audyt widocznych linków, wersji i identyfikatorów z pełnego manifestu dał **8/8 dla pamięci**. W ostatniej odpowiedzi o wspólnym limicie widoczny był `kp-art182-1a-par6`, a przy zamieszkaniu za granicą `uz-65-2`. Warunki korekty, nowej sesji i ponownego otwarcia strony pozostały częścią pomiaru.

## Hipotezy i reprodukcje

- **Dopytania.** Projekcja dopisywała konkretny temat do próśb o wyliczenie własnej kwoty, odczyt cudzego konta lub wykonanie czynności urzędowej. Klasyfikacja przed wyborem tematu dała 0/9 → 9/9 na dodatkowych parafrazach. Test przerywa każde nieoczekiwane wywołanie modelu albo wyszukiwarki. Granicę między pomocą przy wniosku a czynnością wymagającą uprawnienia sprawdzono w instrukcji ZUS. [Instrukcja ZUS](https://www.zus.pl/swiadczenia/zasilki/opis-spraw-zasilki/-/asset_publisher/viJMtnk9lwIB/content/id/10635087)
- **Źródła i ciąg dalszy.** Prośba o podstawę przelewu stawała się pytaniem o liczbę wykorzystanych części urlopu. Osiem z dziewięciu niezależnych prób routingu zawodziło na bazie. Rozpoznanie odniesienia przed projekcją zachowuje temat i cel pytania. Przy zmianie aspektu wyszukiwanie sprawdza najpierw wskazany wcześniej dokument. Próba o badania dawcy prowadzi kolejno do podstaw prawa, stawki i dokumentu lekarskiego. Dopytanie o portal po terminie zachowuje szczególny warunek z publikacji ZUS. [Badanie CONQRR](https://aclanthology.org/2022.emnlp-main.679/) · [Program Dobry Start](https://bip.zus.pl/pl/web/guest/swiadczenia/swiadczenia-dla-rodzin/program-dobry-start)
- **Korekta i czas.** W prawdziwym REST zapis wieku 13 → 17 miesięcy, powitanie i odczyt dały 17. Pierwsza wiadomość nadal podawała 13. Profil zachował rewizję i zero faktów. Druga sprawa tego samego profilu nie widziała wieku. Odwołania do cudzego wpisu zwróciły 404 zarówno dla GET, jak i dla POST. Przeszło 20/20 operacji kontraktu REST, w tym odczyt sprzed sprostowania według `knownAt`. Wiek podany w czacie jest deklaracją z chwili rozmowy. Do oceny świadczenia w danym okresie służą datowane fakty sprawy.
- **Karty.** Na bazie trzy opisy sytuacji kończyły się dopytaniem, a pięć traciło zdarzenie przed dotarciem do katalogu. Klient wybiera teraz nazwy możliwych świadczeń z publicznego katalogu. Szczegóły rodzinnej wypowiedzi pozostają lokalnie. Serwer sprawdza wersję i skrót fragmentu przed pokazaniem karty. Źródło każdej opcji jest widoczne przy tej karcie. [Program Aktywny Rodzic](https://www.zus.pl/pl/aktywnyrodzic)
- **Niepełna kolekcja.** Przy braku punktu dla pierwszej karty zapisany temat był poprawny, ale następna tura traciła go przez brak wcześniejszego cytatu. Test na lokalnym zrzucie strony ZUS dał 0/1 → 1/1 po `fe26b44`. Jednoznaczny tytuł programu pozwala ponownie zapytać o źródło. Na rzeczywistym częściowym czytniku Chrome pokazał odsyłacz ZUS z identyfikatorem live. Po kolejnym F5 prośba o źródło zwróciła tę samą treść i odsyłacz. [Odbiorca świadczenia w publikacji ZUS](https://www.zus.pl/pl/aktywnyrodzic/wiadczenie-aktywnie-w-zlobku)

Osobna negatywna próba wykazała, że pytanie o źródło własnej kwoty po odpowiedzi o programie publicznym wracało do informacji o programie. Po `87bfb10` czat otwiera ocenę wybranej osoby lub prosi o wskazanie konkretnego wyliczenia. Test tej ścieżki przeszedł z 0/1 do 1/1. Przeszło również 37/37 testów kierunkowych i TypeScript.

Build aplikacji na `fe26b44` przeszedł. W pełnym przebiegu na prywatnej bazie PostgreSQL przeszło 695/696 testów. Jeden odczyt OCR przekroczył limit czasu pod obciążeniem stanowiska. Oba testy tego pliku przeszły w osobnej powtórce na standardowym limicie. W pierwszej próbie wcześniejszego buildu dwa testy PDF przekroczyły limit pięciu sekund. Ich osobna powtórka przeszła 13/13.

## Powtórzenie

Z katalogu `app` można uruchomić testy bez usług zewnętrznych.

```sh
npm test -- --maxWorkers=2 tests/public-clarifications.test.ts tests/public-continuation.test.ts tests/public-facet-history.test.ts tests/rest-public-history.test.ts tests/opportunities.test.ts tests/official-evidence.test.ts
```

Przy uruchomionej syntetycznej instancji aplikacji zmienna `ZUSIK_QA_ORIGIN` wskazuje jej adres. Pierwsze polecenie uruchamia także 40 pytań o wiedzę publiczną, które ocenia osobny raport. Pozostałe dwa odczytują źródła bezpośrednio z widocznej odpowiedzi.

```sh
node scripts/qa-g7-chat.mjs "$ZUSIK_QA_ORIGIN"
node scripts/qa-g7-chat.mjs "$ZUSIK_QA_ORIGIN" --cards-only
node scripts/qa-g7-chat.mjs "$ZUSIK_QA_ORIGIN" --memory-manifest-only
```
