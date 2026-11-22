// Powtarzalne „losowe” wartości demo. Ten sam seed daje ten sam wynik na serwerze i w przeglądarce,
// więc pierwszy render nie powoduje niezgodności hydratacji.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CODE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Ciąg znaków do „wpisania w aplikacji”, np. h0s61hito3rikw4a. Niczego nie odblokowuje. */
export function demoCode(seed: number, length = 16): string {
  const random = mulberry32(seed);
  return Array.from({ length }, () => CODE_CHARS[Math.floor(random() * CODE_CHARS.length)]).join("");
}
