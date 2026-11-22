# Ujęcie 23 · Termin na mapie Oli

**44,00–46,00 s.** Kamera mija odhaczone badania i jedzie jeszcze o pół szerokości karty. Gdy narrator mówi „…i co trzeba zrobić teraz”, widz ma móc wskazać konkretną czynność i datę. W planie Oli pozycja „Zgłoś urodzenie Oli” ma status „Do zrobienia” i termin 1 grudnia 2026. [Scenariusz, mapa w detalu](../../../../../PLAN-FILMU-DEMO.md) · [Dane sprawy Oli](../../../../../app/src/lib/demo/fixtures.ts)

1. Przejąć warstwy i prędkość mapy ze sceny 22. Początek terminu wchodzi razem z kartą. Zielona kreska dochodzi do środka podestu i kończy bieg. Kierunek ruchu przechodzi przez cięcie tak jak w przykładzie „Continuous Action”. [Bang Motion · Continuous Action](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg)
2. Wyhamować kamerę, pozostawiając karcie kilka pikseli na domknięcie ruchu. Amplituda przesunięć ma maleć ku końcowi. Data i tytuł trzymają stałe położenie względem siebie przez całe ujęcie. [Motionmaxxing · krzywe wyhamowania](https://github.com/Tejashmakwana/motionmaxxing/blob/8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c/docs/media/eases.svg)
3. Pozostawić pełną sekundę na odczyt daty. Prawy brzeg karty na x=990 wyznacza miejsce otwarcia rozmowy w scenie 24. [Karta „Najbliższa sprawa” w aplikacji](../../../../../app/src/features/journey-map/CaseCard.tsx)
