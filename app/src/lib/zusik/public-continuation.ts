// Only the constants below cross the browser boundary. An unrecognised qualification stays local.
export function publicContinuation(text: string, topic = ""): string | undefined {
  const q = text.toLocaleLowerCase("pl").trim().replace(/[?!.]+$/u, "").replace(/^(?:a |i )/u, "");
  if (/^(?:(?:jeśli|jeżeli|gdy) (?:osoba |uprawniony |uprawniona )?mieszka za granicą|co z wypłatą za granicą)$/u.test(q) &&
      /wypłac|zasiłki|śmierci/iu.test(topic))
    return "Komu wypłaca się zasiłek, gdy osoba uprawniona mieszka za granicą?";
  if (/^(?:jak to wpływa na |co ze? |jaki jest )(?:ich |nasz |naszym )?(?:wspóln|łączn)\p{L}* (?:limit|wymiar)\p{L}*$/u.test(q) &&
      /rodzicielsk/iu.test(topic) && /jednocze|równocze|oboje|wspólni/iu.test(topic))
    return "Jak jednoczesny urlop rodzicielski obojga pracowników wpływa na łączny wymiar urlopu?";
  if (/^(?:na |w )?(?:jakim|którym) portalu (?:po (?:tym )?terminie|po terminie składania wniosków)$/u.test(q) &&
      /dobry start|wyprawk/iu.test(topic))
    return "Jak złożyć wniosek o Dobry Start po terminie?";
  if (/^(?:na czyje konto|na czyj rachunek|kto (?:odbiera|otrzyma|otrzymuje|dostaje) (?:ten )?przelew)$/u.test(q))
    return topic ? "Na czyje konto?" : undefined;
  if (/^(?:(?:kiedy|do kiedy) (?:jest koniec|kończy się|trwa) (?:przyjmowanie|przyjmowania|nabór|składanie) wniosków|jaki jest termin składania wniosków)$/u.test(q) && topic)
    return "Do kiedy?";
  if (/^(?:(?:jak|kto) (?:to )?(?:potwierdz\p{L}*|poświadcz\p{L}*)(?: (?:to|lekarz))?|jak lekarz (?:to )?potwierdz\p{L}*)$/u.test(q) && topic)
    return "Kto to potwierdza?";
  if (/^(?:co z wysokością (?:tego )?zasiłku|jaka (?:jest )?stawka|jaki procent(?: podstawy)?)$/u.test(q) && topic)
    return "Jaki procent?";
}

// Preserve the subject of an introduction even when the speaker has not chosen a question yet.
export function publicSituation(text: string) {
  const q = text.trim().toLocaleLowerCase("pl").replace(/[?!.]+$/u, "");
  const exams = /^(?:(?:chcę (?:zapytać|się dowiedzieć)|pytam|chodzi mi) o )?badani[aeu] (?:lekarskie )?kandydat\p{L}* na dawc\p{L}* (szpiku|komórek|tkanek|narządów)$/u.exec(q);
  if (exams) {
    const donor = exams[1] === "narządów" ? "narządów" : exams[1] === "tkanek" ? "tkanek" : "komórek";
    return `Kiedy badanie kandydata na dawcę ${donor} uprawnia do zasiłku chorobowego?`;
  }
  if (/^(?:(?:gdy|jeśli|jeżeli) (?:ubezpieczony|uprawniony) (?:zmarł|umrze),? )?(?:kto (?:dostaje|otrzymuje)|komu wypłaca się) zasiłek(?: (?:po śmierci|w razie śmierci) (?:ubezpieczonego|uprawnionego))?$/u.test(q) && /zmarł|umrze|śmierci/u.test(q))
    return "Komu wypłaca się zasiłek w razie śmierci ubezpieczonego?";
}
