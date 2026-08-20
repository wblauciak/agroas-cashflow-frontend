const formatterPLN = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
});

const formatterPLNGrosze = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
});

/** Grosze (int) -> "12 345 zl" (bez groszy - naglowki KPI, wykresy). */
export function formatujPLN(grosze: number | null | undefined): string {
  return formatterPLN.format((grosze ?? 0) / 100);
}

/** Grosze (int) -> "12 345,67 zl" (z groszami - tabele, drill-down). */
export function formatujPLNDokladnie(grosze: number): string {
  return formatterPLNGrosze.format(grosze / 100);
}

const MS_DZIEN = 86_400_000;

/** Dni od 1970-01-01 -> Date (UTC pomocy). */
export function dniNaDate(dni: number): Date {
  return new Date(dni * MS_DZIEN);
}

/** "RRRR-MM-DD" (input type=date) -> dni od 1970-01-01. */
export function dataNaDni(dataIso: string): number {
  return Math.round(new Date(dataIso + 'T00:00:00Z').getTime() / MS_DZIEN);
}

const formatterData = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * `undefined` obslugiwane obok `null`, zeby starsze zbuforowane JSON-y (sprzed
 * dodania nowego pola na koncu krotki) nie wywalaly RangeError zamiast pokazac "-".
 */
export function formatujDni(dni: number | null | undefined): string {
  if (dni == null) return '—';
  return formatterData.format(dniNaDate(dni));
}

export function formatujTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Ile minut minelo od podanego znacznika ISO - do wskaznika "swiezosci" danych. */
export function minutOd(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
}
