import { FamilyCard, type IllustrationKind } from "./family-card";
import { SinkingHeading } from "./sinking-heading";
import styles from "./families.module.css";

// Sekcja pod sceną hero, układ jak „For the doers” na granola.ai (pomiary 1440 × 900):
// wielki napis zjeżdża pod pofalowany blok w kolorze secondary z DESIGN.md. W bloku trzy karty
// z animacjami: co przysługuje, jak podzielić opiekę, co i do kiedy załatwić (według SPEC.md).
// Ilustracje są dekoracyjne (aria-hidden), treść niesie tekst pod nimi. Odtwarzanie: family-card.tsx.
const NBSP = " ";

const CARDS: { kind: IllustrationKind; title: string; text: string }[] = [
  {
    kind: "folder",
    title: "Sprawdź, co Ci przysługuje",
    text: `Po zalogowaniu wczytujemy dane z${NBSP}ZUS i${NBSP}pokazujemy zasiłki oraz urlopy, z${NBSP}których możesz skorzystać.`,
  },
  {
    kind: "balance",
    title: "Zaplanuj opiekę i policz zasiłek",
    text: `Ułóż urlopy obojga rodziców na jednej osi i${NBSP}porównaj, ile wyniesie zasiłek w${NBSP}każdym wariancie.`,
  },
  {
    kind: "envelope",
    title: `Wiesz, co i${NBSP}do kiedy załatwić`,
    text: `Plan oddziela sprawy obowiązkowe od tych, które zależą od Twojego wyboru, i${NBSP}przy każdej pokazuje termin oraz miejsce złożenia.`,
  },
];

export function Families() {
  return (
    <section className={styles.section} aria-labelledby="families-title">
      <div className={styles.headingArea}>
        <SinkingHeading id="families-title" className={styles.heading}>
          Dla rodziców
        </SinkingHeading>
      </div>

      <div className={styles.block}>
        <div className={styles.inner}>
          <p className={styles.kicker}>Plan dopasowany do Twojej sytuacji</p>
          <ul className={styles.cards}>
            {CARDS.map((card) => (
              <FamilyCard key={card.kind} kind={card.kind} title={card.title} text={card.text} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
