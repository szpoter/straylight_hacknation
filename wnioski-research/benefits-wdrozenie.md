# 800+ i becikowe w Dokumentach

Stan na 22 listopada 2026 r. Ustalenia prawne, wyjątki i porównanie z wcześniejszymi formularzami opisuje [raport źródłowy](800plus-becikowe.md).

## 800+ (SW-R)

Rodzic przygotowuje elektroniczny SW-R, wybiera okres świadczeniowy i potwierdza wspólne zamieszkanie z dzieckiem oraz jego utrzymanie. Formularz zbiera dane identyfikacyjne rodzica i dzieci, adres, telefon, e-mail, rachunek oraz oświadczenia. Osobne pytania obejmują opiekę naprzemienną, sprawy transgraniczne obojga rodziców oraz pobyt, aktywność zawodową, orzeczenie i edukację w sytuacjach dotyczących cudzoziemców. Dla opieki naprzemiennej potrzebna jest kopia orzeczenia sądu. Wnioski wysłane w ciągu trzech miesięcy od narodzin uprawniają do wyrównania od narodzin. Okres kończy się 31 maja. [Instrukcja SW-R w Emp@tii](https://www.gov.pl/attachment/2a56a1f3-990c-48cd-ae65-c2974e6a3e17) · [ZUS o 800+](https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus)

Demo symuluje cztery kanały elektroniczne. Po wybraniu eZUS, mZUS, banku albo Emp@tii rodzic dostaje przykładowe potwierdzenie w historii sprawy. Urzędowy kreator wymaga złożenia wniosku elektronicznego. SW-R w aplikacji ma tryb bez PDF. [Pomoc kreatora ZUS](https://www.zus.pl/portal/pomoc/kub0024.html)

## Becikowe (SR-2)

Formularz zbiera organ i adresy, dane osobowe, dokument zastępujący PESEL, dzieci, skład rodziny, organy składek, alimenty płacone innym, dochody nieopodatkowane i rolne, utratę i uzyskanie dochodu, sposób wypłaty, miejscowość podpisu i oświadczenia. Gmina oblicza dochód rodziny. Próg wynosi 1922 zł na osobę, a rok bazowy zmienia się w listopadzie. Wnioskodawca potwierdza wymagane zaświadczenie lekarskie lub położnej. Samotnie wychowujący wskazuje tytuł alimentacyjny lub dokument ustawowego wyjątku. Do wydruku dołącza się dokumenty zgodnie z wykazem i podpisuje przewidziane dla rodzica miejsca. Kanał Emp@tia wymaga e-maila. [Becikowe w gov.pl](https://www.gov.pl/web/gov/uzyskaj-becikowe) · [Ustawa o świadczeniach rodzinnych](https://api.sejm.gov.pl/eli/acts/DU/2026/1240)

| Druk | Dane naniesione na wzór | Kiedy trafia do wydruku |
|---|---|---|
| [SR-2(10)](https://www.gov.pl/attachment/20ec64a0-3df1-49dc-9884-369596f3818e) | 7 stron, części I i II, numer rachunku przy przelewie, dokumenty, miejscowość, data | Wydruk do gminy lub na pocztę |
| [SR-2Z(3)](https://www.gov.pl/attachment/9735eb79-f017-4773-b18e-cf48c0c54581) | Wnioskodawca, kolejne dzieci i członkowie rodziny | Ponad 4 dzieci lub ponad 6 członków rodziny, z kolejnymi egzemplarzami według potrzeb |
| [ZSR-05(6)](https://www.gov.pl/attachment/cebc7b91-986a-45cf-89d6-62ad94f5b2a9) | Osoba, rok bazowy, rodzaje dochodów, kwoty w zł i gr, suma pozycji na druku | Dochody nieopodatkowane wskazane w oświadczeniu, oddzielnie dla każdej osoby |
| [ZSR-07(1)](https://www.gov.pl/attachment/0caccb30-b8bf-4709-80cb-e3393506dc36) | Osoba, rok bazowy, hektary przeliczeniowe do czterech miejsc po przecinku | Dochód rolny, oddzielnie dla każdego wskazanego właściciela |

Zaświadczenie o opiece medycznej wystawia lekarz lub położna. Rodzic dołącza je do wniosku. Generator wpisuje dokument do wykazu. [Wzór zaświadczenia, Dz.U. 2021 poz. 199](https://api.sejm.gov.pl/eli/acts/DU/2021/199/text.pdf#page=3)

## Weryfikacja

Cztery oryginalne wzory znajdują się w katalogu aplikacji `public/forms`. Generator w przeglądarce sprawdza SHA-256 każdej używanej wersji. Kopiuje strony do nowego PDF i nanosi wartości na linie lub kratki. Podpis wydawcy pozostaje w oryginalnym pliku.

Testy sprawdzają kanały, warunki kwalifikacji, wersje wzorów, tekst odczytany z PDF, sumy i części dziesiętne oraz pomijanie danych ukrytych po zmianie odpowiedzi. Obejrzano 15-stronicowy render dla rodziny z pięciorgiem dzieci, SR-2Z, dwoma oświadczeniami o dochodach oraz dalszym wykazem dokumentów. Sprawdzono polskie litery, kratki PESEL, dat, rachunku i kwot, położenie znaków wyboru i miejsce na własnoręczne podpisy.

Test w Chrome przeszedł pełną ścieżkę od edycji do potwierdzenia i odczytu historii po odświeżeniu dla wszystkich siedmiu kanałów. PDF dla gminy miał 7 stron, a wariant pocztowy z trzema urzędowymi załącznikami 14. Użyto danych fikcyjnych i lokalnej symulacji.
