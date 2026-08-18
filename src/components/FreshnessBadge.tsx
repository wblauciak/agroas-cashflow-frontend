import { formatujTimestamp, minutOd } from '../lib/format';

/**
 * Wymog z docs/CashFlow_Dokumentacja.md sekcja 10: przy cyklu godzinowym
 * uzytkownik musi zawsze widziec, na jaki moment patrzy. Kolor ostrzega,
 * gdy worker milczy dluzej niz jeden cykl (spodziewane <= 60 min w oknie
 * 6-21, plus margines na start/koniec okna).
 */
export function FreshnessBadge({ wygenerowano }: { wygenerowano: string }) {
  const minuty = minutOd(wygenerowano);
  const stan = minuty > 90 ? 'stare' : minuty > 60 ? 'graniczne' : 'swieze';

  const klasy: Record<typeof stan, string> = {
    swieze: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300',
    graniczne: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300',
    stare: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${klasy[stan]}`}
      title={stan === 'stare' ? 'Worker mogl nie wykonac ostatniego przebiegu - sprawdz logi na RP01' : undefined}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${stan === 'swieze' ? 'animate-ping bg-emerald-500' : ''}`} />
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${stan === 'swieze' ? 'bg-emerald-500' : stan === 'graniczne' ? 'bg-amber-500' : 'bg-red-500'}`} />
      </span>
      dane na: {formatujTimestamp(wygenerowano)}
    </span>
  );
}
