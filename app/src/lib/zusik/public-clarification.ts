import { offerDocuments } from "../rag/public-query";
import { AMOUNT_MESSAGE } from "../rag/query";

type Clarification = {
  question: string;
  message: string;
  matches(text: string): boolean;
  amount?: boolean;
  localInCase?: boolean;
};

const clarifications: Clarification[] = [
  {
    question: "Czy można odczytać cudze konto ZUS?",
    message: "Dostęp do prywatnych danych konta wymaga uprawnienia. Czy chcesz sprawdzić, jak działa pełnomocnictwo w eZUS?",
    matches: t => /(?:kont[ao]|sald[oa]|danych|zarobk|składk)/iu.test(t) &&
      /cudz|innej osoby|sąsiad|koleżan|koleg|znajom|mojego brata|mojej siostry/iu.test(t),
    localInCase: true,
  },
  {
    question: "Czy czat może podpisać lub wysłać wniosek?",
    message: "Podpis i wysyłkę wykonujesz w usłudze właściwej dla wniosku. Dla którego świadczenia chcesz sprawdzić sposób złożenia?",
    matches: t => /^(?:proszę[, ]+)?(?:podpisz|wyślij|prześlij|złóż)\s/iu.test(t) && /wnios|formularz|druk|dokument/iu.test(t),
    localInCase: true,
  },
  {
    question: "Chcę przygotować formularz.",
    message: "Jaki formularz chcesz wypełnić? Wystarczy nazwa świadczenia lub symbol druku.",
    matches: t => /^(?:proszę[, ]+)?(?:wypełnij|uzupełnij|przygotuj)\s/iu.test(t) && /wnios|formularz|druk/iu.test(t),
  },
  {
    question: "Jak sprawdzić indywidualną kwotę wypłaty?",
    message: AMOUNT_MESSAGE,
    matches: t => /na rękę|co do grosza|ile.{0,35}(?:pieniędzy|złotych).{0,20}(?:dostan|otrzymam)|(?:moja|moją|mojej) wypłat/iu.test(t) &&
      /oblicz|wylicz|policz|ile|kwot|wynies/iu.test(t),
    amount: true,
  },
  {
    question: "Czy dziecko spełnia kryterium wieku?",
    message: "O które świadczenie chodzi i jaki był wiek dziecka w okresie, za który chcesz je otrzymać?",
    matches: t => /dziec|syn|córk/iu.test(t) && /wiek|lat|urodz/iu.test(t) && /(?:spełnia|kwalifikuje|za młod|za star|wystarczająco)/iu.test(t) &&
      /moj[aeąy]|mój|nasz/iu.test(t),
  },
  {
    question: "Które warianty świadczenia porównać?",
    message: "Które dwa warianty chcesz porównać i co jest dla Ciebie ważne przy wyborze?",
    matches: t => /opcj|wariant|możliwoś/iu.test(t) && /lepsz|korzystniejsz|wybrać/iu.test(t) &&
      !/zasił(?:ek|k)|urlop|aktywn|800\s*(?:\+|plus)|dobry start/iu.test(t),
  },
  {
    question: "Jak potwierdzić nazwę programu?",
    message: "Jaka instytucja ogłosiła ten program? Nazwa z urzędowego źródła pozwoli potwierdzić, którego świadczenia dotyczy pytanie.",
    matches: t => {
      if (!/dosta[nć]|otrzyma|przysługuje|należy się|kwalifikuj|ubiegać/iu.test(t)) return false;
      const title = /(?:dofinansowani\p{L}*|świadczeni\p{L}*|program\p{L}*)\s+[„“«"]([^”“»"]+)[”“»"]/iu.exec(t)?.[1];
      return Boolean(title && !offerDocuments.some(([pattern]) => new RegExp("^(?:" + pattern.source + ")$", "iu").test(title.trim())) &&
        !/^(?:aktywny rodzic|świadczenie rehabilitacyjne|zasiłek (?:chorobowy|macierzyński|opiekuńczy|wyrównawczy))$/iu.test(title.trim()));
    },
  },
  {
    question: "Jak sprawdzić uprawnienie za wskazany okres?",
    message: "Do oceny uprawnienia potrzebne są przepisy obowiązujące we wskazanym okresie. Czy masz decyzję lub pismo z podstawą prawną z tego okresu?",
    matches: t => /(?:w|za|od|do)\s+(?:roku\s+)?(?:\p{L}+\s+)?(?:19|20)\d{2}(?!\d)|(?:19|20)\d{2}\s*r(?:oku|\.)/iu.test(t) &&
      /dostępn|obowiązywa|uprawni|przysługiwa|należał/iu.test(t),
  },
  {
    question: "Od czego zależy indywidualny termin wniosku?",
    message: "Którego świadczenia dotyczy wniosek i od jakiego zdarzenia mamy liczyć termin?",
    matches: t => /(?:osobist|indywidualn)\p{L}* (?:termin|ostatni dzień)|(?:termin|ostatni dzień).{0,18}w mojej sprawie/iu.test(t) && /wnios/iu.test(t),
  },
];

// Only the fixed question crosses the browser boundary. Recognize it on replay as well.
export function publicClarification(text: string) {
  return clarifications.find(item => text === item.question || item.matches(text));
}
