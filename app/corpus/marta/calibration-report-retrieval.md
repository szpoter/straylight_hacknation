# Ocena RAG Marty · calibration

Korpus marta-v1, 23 jednostek. Zestaw calibration: 8 pytań, 1 prób negatywnych. 2026-11-21T20:10:40.455Z.
Tryb: tylko wyszukiwanie (Qdrant).
- Surowy Hit@5: **8/8**
- Kompletność po dołączeniu wyjątków i przepisów pierwotnych: **8/8** (próg ≥ 18/20)

| ID | Pytanie | Oczekiwane | Faktyczne top 5 (score) | Hit@5 | Komplet | Odpowiedź pokazana rodzinie | Automat |
|---|---|---|---|---|---|---|---|
| k01 | Czy żona i ja możemy mieć rodzicielski w tych samych tygodniach? | kp-art182-1a-par6 / mrpips-dzielenie-jednoczesnie | zus-przyklad-podzialu (0.591)<br>kp-art182-1a-par6 (0.500)<br>kp-art182-1a-par7 (0.476)<br>mrpips-dzielenie-zasilek (0.450)<br>zus-czas-trwania-9-tygodni (0.333) | ✓ | ✓ | — | — |
| k02 | Ile dni przed startem urlopu muszę dać papier szefowi? | kp-art182-1d-par1 / mrpips-korzystanie-wniosek | mrpips-korzystanie-wniosek (0.833)<br>kp-art182-1d-par1 (0.833)<br>kp-art182-1e-par2 (0.500)<br>kp-art182-1a-par2 (0.400)<br>kp-art182-1a-par1 (0.333) | ✓ | ✓ | — | — |
| k03 | Firma ma w teczce akt urodzenia syna, czy znowu go nosić? | rozp-2025-322-par15-ust2-pkt1 + rozp-2025-322-par22 | rozp-2025-322-par15-ust2-pkt1 (1.000)<br>rozp-2025-322-par22 (0.583)<br>rozp-2025-322-par15-ust1 (0.500)<br>rozp-2025-322-par15-ust2-pkt2 (0.393)<br>rozp-2025-322-par15-ust2-pkt3 (0.367) | ✓ | ✓ | — | — |
| k04 | Partnerka też idzie na urlop, co o niej napisać we wniosku? | rozp-2025-322-par15-ust2-pkt2 | rozp-2025-322-par15-ust2-pkt3 (0.833)<br>rozp-2025-322-par15-ust2-pkt2 (0.700)<br>kp-art182-1e-par2 (0.500)<br>mrpips-korzystanie-wniosek (0.450)<br>kp-art182-1d-par1 (0.417) | ✓ | ✓ | — | — |
| k05 | Czy moje dziewięć tygodni może wykorzystać żona? | kp-art182-1a-par4 / mrpips-nieprzenoszalna / zus-czas-trwania-9-tygodni | zus-przyklad-podzialu (0.667)<br>kp-art182-1a-par5 (0.583)<br>zus-czas-trwania-9-tygodni (0.533)<br>rozp-2025-322-par15-ust2-pkt2 (0.500)<br>mrpips-nieprzenoszalna (0.450) | ✓ | ✓ | — | — |
| k06 | Ile razy mogę przerwać i wrócić na rodzicielski? | kp-art182-1c / mrpips-korzystanie-czesci | mrpips-korzystanie-czesci (0.866)<br>mrpips-nieprzenoszalna (0.859)<br>kp-art182-1c (0.852)<br>zus-czas-trwania-9-tygodni (0.849)<br>kp-art182-1a-par4 (0.848) | ✓ | ✓ | — | — |
| k07 | Czy wniosek można przesłać mailem do kadr? | kp-art182-1d-par1 / mrpips-korzystanie-wniosek | kp-art182-1e-par2 (0.700)<br>rozp-2025-322-par15-ust2-pkt3 (0.643)<br>kp-art182-1d-par1 (0.476)<br>rozp-2025-322-par15-ust1 (0.458)<br>rozp-2025-322-par15-ust2-pkt2 (0.450) | ✓ | ✓ | — | — |
| k08 | Chcę pracować na pół etatu w trakcie rodzicielskiego, kiedy złożyć wniosek? | kp-art182-1e-par2 | mrpips-korzystanie-wniosek (0.700)<br>rozp-2025-322-par15-ust2-pkt2 (0.700)<br>kp-art182-1d-par1 (0.583)<br>rozp-2025-322-par15-ust2-pkt3 (0.500)<br>kp-art182-1e-par2 (0.417) | ✓ | ✓ | — | — |

## Próby negatywne

| ID | Pytanie | Oczekiwany status | Bramka | Odpowiedź | Wynik |
|---|---|---|---|---|---|
| kn1 | Jaka jest stawka zasiłku chorobowego? | insufficient_evidence | — | **insufficient_evidence** · (retrieval only) | — |
