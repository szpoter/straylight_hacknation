# Próby wdrożenia Zusika

## G0 · stan początkowy z 22 listopada 2026

Lokalny commit na początku pracy to `93e7cb88957759120e28aff9f683ab269fcf8872`. Zdalny `main` odczytany z GitHuba wskazywał `c2c6b2cfc359eacb6d2f8a221476b3033fd5fc62`, przodka lokalnego commita. Dwa lokalne commity dodawały plan oraz niezależny pomiar API w CI. Zespół edytował również `zusik-acceptance.ts`, `ZusikFab.tsx` i `PlanProvider.tsx`.

Node 24.14.1, Next 16.4.6, React 19.3.0, LangGraph 1.7.5, pg 8.23.1, Zod 4.6.7. Testy bazowe przeszły 333/333. Skonfigurowana lokalnie kolekcja wiedzy to `zusik_marta_v1`.

| Pakiet | Wersja początkowa | Fragmenty | SHA-256 pliku manifestu |
|---|---|---:|---|
| marta | marta-v1 | 23 | 8ac4a1d42a2e9b999b9875d837cd6b57cba10e40a35f2d1ba8353afdded7e4da |
| publiczne | rodzina-2026-11-v1 | 487 | 81041ab75af6e888c7d3e52ee22f015ebc0c86d44b690f542896ab8fd4585d61 |
| oferta | programy-2026-11-v2 | 5 | 9c5cbde14144a989b7a9ffbea7b7a16a66f0f599b4022ddec588e3c13cc4e0d2 |

| Reprodukcja | Pierwsza błędna decyzja lub brak | Właściciel | Próba odbioru | Poprawka do sprawdzenia |
|---|---|---|---|---|
| „Mój syn od stycznia będzie w żłobku” | `publicQuestion` zamienia opis planowanej opieki w pytanie o konkretny okres i kończy wyszukiwanie | Graf | Pierwsza odpowiedź zawiera źródło dotyczące opieki instytucjonalnej | Oddzielić odkrywanie możliwości od oceny historycznego prawa |
| „na czyje konto?” po tej turze | `resolveFollowUp` zwraca null. W pakiecie oferta v2 brak ustępu o odbiorcy | Graf i wiedza | Odczyt historii z serwera, pytanie bez nazwy programu, cytat o adresacie przelewu | Odzyskać podmiot z poprzedniego dowodu i wyszukać nowy aspekt |
| Brak fragmentu o odbiorcy w bazie | `answerQuestion` przy pustych dowodach kończy turę bez odczytu strony urzędowej | Wyszukiwanie | Inna kolekcja, ten sam dialog, rzeczywisty GET i cytat z sekcji ZUS | Kontrolowany odczyt z zatwierdzonej strony |
| Zmiana Wsparcie → Profil podczas otwartego czatu | Zespół lokalnie dodał `followsPage`. Dotychczasowy test czeka na zakończenie nawigacji przed kliknięciem | UI | Opóźniona nawigacja i kontrola tytułu otwartego panelu | Zweryfikować lokalną poprawkę osobnym testem |

Ścieżka informacji biegnie z `POST /api/zusik/ask` do `AskService`. Lokalna projekcja i resolver historii wybierają publiczną treść zapytania. Wyszukiwanie w Qdrant wykonuje `rag/retrieve.ts`, a `zusik/qdrant.ts` obsługuje osobną sondę. Serwer porównuje hash trafienia z lokalnym manifestem, dobiera załączone wyjątki, waliduje cytaty, zapisuje odpowiedź JSON w `ask_turns` i zwraca wynik strumieniem. Odczyt stanu po odświeżeniu korzysta z tej samej tabeli. `graph.ts` steruje sondą z wyborem opcji, a sprawa Marty ma osobny checkpoint. Kamil i chorobowe mają osobne serwisy. Panel administracyjny ma widoki treści, reguł, zmian, historii i spraw testowych.
