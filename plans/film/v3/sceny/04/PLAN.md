# 04 · Ile nam właściwie wypłacą?

Autor planu: s04

**06–08 s.** Marta uspokaja Olę jednym pchnięciem i powrotem wózka. Pyta Pawła „Ile nam właściwie wypłacą?”. W tym samym planie średnim przenosi uwagę z dziecka na teczkę. Odpowiedzi szukają teraz oboje. W kadrze mają się zmieścić twarze, chwyt i oba koła. [Plansza kolejki](../../../referencje/kolejka-zus-v1.png)

| Klatki | Gra postaci |
| --- | --- |
| 0–13 | Wejść z pozy 03. Marta patrzy na Olę. Przenosi ciężar ku przodowi i prostuje nieco prawy łokieć. Rączka odjeżdża od biodra na grubość dłoni. |
| 14–29 | Ręka przyciąga wózek. W połowie powrotu oczy Marty wędrują ku teczce. Za wzrokiem obracają się głowa i barki. Pytająco otwiera wolną dłoń. |
| 30–41 | Koła stają. Marta pochyla się z bioder i zagląda Pawłowi przez ramię. Na końcówce pytania podnosi brew. Paweł dostrzega jej spojrzenie i unosi teczkę od lewej dłoni podpierającej dół. |
| 42–59 | Marta zamyka usta, jej wzrok pada na krawędź druków. Paweł przechyla teczkę ku niej i przenosi prawy kciuk do górnego rogu. Tutaj 05 przejmuje chwyt. |

Marta korzysta ze wspólnego widoku ¾ zwróconego w prawo. Przy obrocie widoczne zostają ucho pod niskim kokiem i kosmyk na policzku. Szałwiowa narzutka zgina się w talii nad jasną spódnicą, baleriny zostają na posadzce. [Wspólna obsada](../../POSTACIE.md)

W prawej pozie ze stosem postać przenosi ciężar przez stopę i łokieć aż do dłoni. U Marty ten łańcuch ma poruszyć rączkę. Z serii póz przy stole bierzemy krótką pauzę ciała pozwalającą odczytać kierunek spojrzenia. Przypada na zatrzymanie wózka. [Dwie pozy z rekwizytem](../../../v2/przyklady/pozy-postaci.png) · [Oryginał](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png) · [Fazy przy stole](../../../v2/przyklady/fazy-ruchu.png) · [Oryginał](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png)

[Specyfikacja tego ujęcia](SPEC.md)

## Realizacja v3 (autor b01)

Kamera i świat 03/59 bez zmian. Wózek: pchnięcie +24 px 0–13, powrót −24 px 14–29 (prędkość zero na zwrocie), obrót kół = droga / (34·1,25) rad; dłoń Marty liczona co klatkę na `pramPoint("handle")`, biodra +0,3 drogi. Marta: oczy z Oli na teczkę 17–23, głowa i barki 21–30, wolna (ekranowo prawa) dłoń otwiera się pytająco 18–30, skłon z bioder ku Pawłowi 30–41 (`bow` .12→.32, `lean` 4→11), brew 33–39; usta z `mowa.json` (kl. filmu 181–215), zamknięte od 36. Paweł: spojrzenie na Martę 31–36, unosi teczkę 34–50 (−16 px) i przechyla ku niej do −12° (40–56); prawy kciuk wędruje z grzbietu do lewego górnego rogu teczki 42–56 (tam wystają druki) — 05 przejmuje ten chwyt.

Przykład animatora: [Stickman · character-acting-reference.png](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png) (lokalnie `../../../v2/przyklady/pozy-postaci.png`) — łańcuch stopa → łokieć → dłoń przy rekwizycie, krótka pauza ciała przy zatrzymaniu wózka. Plansza `../../../referencje/kolejka-zus-v1.png`. Render: `node build.mjs --only 01,02,03,04,05,06 --out robocze/b01`, klatki `klatki.mjs`, ujęcie `render.mjs 720 NN NN`. Modele **r1** (`k.rewizja`), bez zmian w `obsada/`.
