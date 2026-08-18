import type { OtwarteFile } from './types';

/** knt.dane jest kluczowany stringiem (numer kontrahenta jako klucz obiektu JSON). */
export function nazwaKontrahenta(otwarte: OtwarteFile | undefined, kntKlucz: number): string {
  const wpis = otwarte?.slowniki.knt.dane[String(kntKlucz)];
  return wpis ? wpis[1] : `Kontrahent ${kntKlucz}`;
}
