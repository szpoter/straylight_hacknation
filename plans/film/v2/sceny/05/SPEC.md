# 05 · Dwa nagłówki

60 klatek przy 30 kl./s, 1280 × 720. Współrzędne poniżej odnoszą się do planu ogólnego kolejki. W półzbliżeniu kamera powiększa plan około dwukrotnie. Marta stoi po lewej stronie, Paweł po prawej, tak jak na [planszy kolejki](../../../referencje/kolejka-zus-v1.png). Wzorem cięcia do nowej skali jest [JumpCutPunchIn](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/demos/rhythm/rhythm-interrupt-moves/JumpCutPunchIn.tsx).

| Klatki | Gra i rekwizyt |
| --- | --- |
| 0–3 | Przejmujemy teczkę z 04 w (672,392), szerokość 128, obrót −6°. Lewa ekranowa dłoń Pawła opiera ją o tułów. Marta obejmuje rączkę blisko (330,467). |
| 4–13 | Zaczyna się pytanie. Kciuk Pawła wpada za rant teczki i odgina okładkę do przodu. Usta Marty biegną według obwiedni istniejącej kwestii. Szelest zaczyna się w klatce 9, przy 8,30 s. |
| 14–32 | Docisk kciuka zamyka chwyt, róg kartki lekko się wygina. Arkusz z nagłówkiem „URLOP” przesuwa się do góry i w prawo. Gdy odsłania napis „ZASIŁEK”, oczy Marty kierują się z dłoni na drugi druk. Głowa podąża kilka klatek później. |
| 33–46 | Pierwszy druk wyhamowuje, róg prostuje się pod kciukiem. Marta domyka usta po „dobre?”. Obie kartki i dolna ręka Pawła pozostają widoczne. |
| 47–59 | Przygotowanie do cięcia na obrót w 06. Pierwszy druk w (740,313), szerokość 82, wysokość 100, obrót +4°. Prawa dłoń trzyma górny prawy brzeg przy (779,283). Drugi druk pozostaje w (665,374), 82 × 100, −6°. Teczka otwarta do 0,71. |

W odbiorze klatki przed chwytem mają pokazać nieruchomy druk. Po chwycie palce muszą przejść tę samą drogę co róg, podczas gdy dolny nagłówek zostaje w teczce. Ciągłość punktu styku opiera się na scenie filiżanki w [przykładzie Mei](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/examples/b5-mei-event-relay/README.md). Rytm szelestu pochodzi z [istniejącego miksu](../../../montaz/miks.py).

Sprawdzono położenia obu arkuszy na wszystkich 60 klatkach. Do klatki 15 żaden arkusz się nie przesuwa, a drugi do końca utrzymuje środek (665,374). Na wyrenderowanych klatkach 0, 12, 24, 35 i 59 widać kolejno zamkniętą okładkę, odsłonięty brzeg, początek drugiego nagłówka i dwa czytelne tytuły. Przy cięciu kartka zasłania Pawłowi usta, a oczy i chwyt pozostają widoczne.
