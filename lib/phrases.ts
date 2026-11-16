const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// Frases para avisar que se viene un buen día. Se elige una al azar para no repetir siempre lo mismo.
const GOOD_PHRASES = [
  (verb: string) => `está god para ${verb}`,
  (verb: string) => `está buenísimo para ${verb}`,
  (verb: string) => `alto día para ${verb}`,
];

/** "está god para nadar" / "está buenísimo para surfear" / "alto día para hacer SUP" */
export function goodPhrase(verb: string) {
  return pick(GOOD_PHRASES)(verb);
}

const CLOSERS = ["¿Vamos?", "¿Quién se prende?", "¿Nos metemos?", "¿Te sumás?", "¿Quién pinta?"];

/** Cierre para el mensaje a amigos */
export const closer = () => pick(CLOSERS);

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** ["nadar", "hacer SUP", "surfear"] → "nadar, hacer SUP y surfear" */
export function joinEs(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/**
 * Frase según el puntaje (0–10): con buen puntaje usa las frases de día bueno;
 * si no, dice la verdad: "Se puede nadar" / "Flojo para nadar" / "Hoy no da para nadar".
 */
export function phraseForScore(verb: string, score: number) {
  if (score >= 6) return goodPhrase(verb);
  if (score >= 5) return `se puede ${verb}`;
  if (score >= 3) return `flojo para ${verb}`;
  return `hoy no da para ${verb}`;
}
