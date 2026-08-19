/**
 * Rozlaczne pasma terminow, spojne z progami uzytymi w kartach horyzontu na
 * Przegladzie (Overview.tsx: w7=-6, w30=-30, w90=-90, w180=-180 dni;
 * przeterminowane do7/do14/do30/powyzej30). Kazda platnosc trafia do
 * dokladnie jednego pasma - suma po pasmach = suma calkowita.
 */
export interface Pasmo {
  id: string;
  etykieta: string;
  przeterminowane: boolean;
}

export const PASMA: Pasmo[] = [
  { id: 'do7', etykieta: 'Przetermin. 1–7 dni', przeterminowane: true },
  { id: 'do14', etykieta: 'Przetermin. 8–14 dni', przeterminowane: true },
  { id: 'do30', etykieta: 'Przetermin. 15–30 dni', przeterminowane: true },
  { id: 'powyzej30', etykieta: 'Przetermin. > 30 dni', przeterminowane: true },
  { id: 'w7', etykieta: 'W 7 dniach', przeterminowane: false },
  { id: 'd8_30', etykieta: '8–30 dni', przeterminowane: false },
  { id: 'd31_90', etykieta: '31–90 dni', przeterminowane: false },
  { id: 'd91_180', etykieta: '91–180 dni', przeterminowane: false },
  { id: 'powyzej180', etykieta: '> 180 dni / brak terminu', przeterminowane: false },
];

/** Indeks pasma (0..8) dla pola `dni` (dni po terminie; ujemne = przed terminem; null = brak terminu). */
export function pasmoIndeks(dni: number | null): number {
  if (dni === null) return 8;
  if (dni > 30) return 3;
  if (dni > 14) return 2;
  if (dni > 7) return 1;
  if (dni > 0) return 0;
  if (dni >= -6) return 4;
  if (dni >= -30) return 5;
  if (dni >= -90) return 6;
  if (dni >= -180) return 7;
  return 8;
}
