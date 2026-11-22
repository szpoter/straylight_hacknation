# Odbiór rozmów Zusika

Z katalogu `app/` uruchom `node --import tsx scripts/zusik-eval-g7.ts ADRES TRYB`. Każda rozmowa używa odrębnej podpisanej sesji demo. Dla testów przyjmowania decyzji używaj wdrożenia z tymi samymi wersjami korpusu co ewaluator.

- `baseline` sprawdza areszt i kwarantannę.
- `corpus` sprawdza rozmowę o żłobku i odczyt serwerowej historii po pierwszej oraz po drugiej turze. Aplikacja musi wskazywać pełną testową kolekcję.
- `official_live` powtarza tę samą rozmowę ze świeżym cache. Aplikacja musi wskazywać testową kolekcję bez fragmentu o odbiorcy. Oczekiwane są jedno zgłoszone pobranie WWW, oficjalny URL, nagłówek, data i dosłowny cytat. Tryb wybiera wyłącznie asercje klienta. Fizyczną zawartość kolekcji sprawdza importer.
- `g7` wykonuje 40 pytań RAG, 12 prób bez rozstrzygnięcia, 8 rozmów i 8 profili. Linie JSON zawierają osobno wyniki rankingu, dowody, twierdzenia, cytaty, czas i metadane dostawcy dostępne w API. Pole `cost: null` oznacza brak danych o koszcie. Końcowe liczniki są pogrupowane według rodzaju próby. Dowolny błąd daje kod wyjścia 1.

Plik `g7.jsonl` z pytaniami i wymaganymi identyfikatorami został zamrożony w commicie `40375d9`. `gold-evidence.json` wiąże identyfikatory z konkretną sekcją, adresem publikacji i hashem fragmentu. Oba hashe sprawdza runner. Zestaw pozostaje poza danymi wczytywanymi przez produkt. Parafrazy i próg wydania wymagają dodatkowo niezależnego przeglądu merytorycznego. Sam runner sprawdza wszystkie wskazane elementy dosłownego cytatu, powiązanie z tezą i krytyczne słowa w odpowiedzi.

Test przeglądarkowy niezależnie wykonuje rzeczywiste przeładowanie strony. W trybach API rolę F5 pełni odczyt `GET /api/zusik/state` wyłącznie z podpisanym ciasteczkiem.
