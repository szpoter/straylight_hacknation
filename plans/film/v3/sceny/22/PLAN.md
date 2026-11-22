# 22 · Od Oli do najbliższej sprawy

Autor planu: s22

**42–44 s.** Zachować mapę z v2. Na słowach „Na mapie Oli widzi, co już załatwili” widz zaczyna przy imieniu dziecka. Zielona linia wiedzie wzrok do odhaczonych badań, potem w stronę zgłoszenia urodzenia. Nagłówek „Narodziny” stoi w miejscu, kamera przesuwa się w prawo wzdłuż podestów. [Klip referencyjny v2](../../../v2/sceny/22/ujecie-720p.mp4) · [Kierunek części produktowej](../../PRODUKT.md)

| Klatki | Działanie widoczne w kadrze |
| --- | --- |
| 0–18 | Przy lewej krawędzi czytamy „Ola” i „ur. 10 listopada 2026”. Linia spod przycisku importu biegnie dalej poziomo i zaczyna wznosić się do zielonego podestu. Kamera łagodnie rusza za nią. |
| 19–26 | Podest z haczykiem przechodzi przez środek ekranu. Nad nim widać pełne „Badania przesiewowe noworodka” i „Odhaczone”. W klatce 26 koniec zielonej kreski mija oś podestu. |
| 27–43 | Kamera utrzymuje tempo. Niższy, przerywany podest z ikoną automatycznej sprawy pracodawcy zbliża się do środka kadru. „Zaświadczenie Z-3 od pracodawcy” ma podpis „Nic nie musisz robić”. |
| 44–59 | Ślad przechodzi przez Z-3. Oko podąża do podestu z tarczą i karty „Zgłoś urodzenie Oli”, z której można odczytać „Do zrobienia”. Karta nadal jedzie w lewo na cięciu. W 23 widz zatrzyma się przy dacie. |

Z przykładu ciągłej akcji Bang Motion wziąć utrzymanie kierunku kreski przez zmianę widoku. Z przykładu prezentacji interfejsu wziąć ruch całej karty wraz z jej tekstem. Wzorcem położenia, tempa i pisma jest nagranie v2. [Bang Motion · ciągłość gestu](../../../v2/przyklady/ciagly-ruch.jpg) · [Oryginał](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg) · [Bang Motion · ruch w produkcie](../../../v2/przyklady/ruch-produktu.jpg) · [Oryginał](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/03-saas-ui-tour.jpg)

[Design produktu](../../../../../DESIGN.md) · [Specyfikacja tego ujęcia](SPEC.md)

## Realizacja v3 (autor s22, blok b19)

Mapę przeniosłem z v2 (`../../../v2/sceny/22/scene.mjs`) bez zmian w trasie, podestach, kolejności spraw, tempie kamery i śladu. Jedyna zmiana we wspólnym rysunku mapy 22–24 dotyczy karty „Zgłoś urodzenie Oli”: kapsuły „Do zrobienia” i „Obowiązek” mają teraz 30 px zamiast 22, żeby status dało się odczytać w podglądzie 360 px (zgodnie ze SPEC 23, pkt 2). Obrys karty 648 × 300 się nie zmienił. Przykłady: [Bang Motion · 05-continuous-action.jpg](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg) (linia zachowuje kierunek przez cięcie) i [Bang Motion · 03-saas-ui-tour.jpg](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/03-saas-ui-tour.jpg) (karta jedzie razem ze swoim tekstem).
