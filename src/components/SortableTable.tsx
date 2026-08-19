import { useMemo, useState, type ReactNode } from 'react';

export interface Kolumna<T> {
  id: string;
  naglowek: string;
  wartosc: (row: T) => string | number | null;
  cell?: (row: T) => ReactNode;
  /** Szerokosc w px (VirtualTable) - kolumny bez tego rosna, wypelniajac dostepna przestrzen. */
  szerokosc?: number;
  /** Wyrownanie do prawej - dla kolumn liczbowych/dat, zeby dobrze sie czytaly w kolumnie. */
  wyrownanie?: 'prawo';
}

export function SortableTable<T>({
  dane,
  kolumny,
  domyslneSortowanie,
  wierszKlucz,
  onKlikWiersza,
}: {
  dane: T[];
  kolumny: Kolumna<T>[];
  domyslneSortowanie: { id: string; desc: boolean };
  wierszKlucz: (row: T) => string | number;
  onKlikWiersza?: (row: T) => void;
}) {
  const [sortowanie, setSortowanie] = useState(domyslneSortowanie);

  const posortowane = useMemo(() => {
    const kolumna = kolumny.find((k) => k.id === sortowanie.id);
    if (!kolumna) return dane;
    const kopia = [...dane];
    kopia.sort((a, b) => {
      const va = kolumna.wartosc(a);
      const vb = kolumna.wartosc(b);
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
      else cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'pl');
      return sortowanie.desc ? -cmp : cmp;
    });
    return kopia;
  }, [dane, kolumny, sortowanie]);

  function klikNaglowek(id: string) {
    setSortowanie((s) => (s.id === id ? { id, desc: !s.desc } : { id, desc: true }));
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            {kolumny.map((k) => (
              <th
                key={k.id}
                onClick={() => klikNaglowek(k.id)}
                className={`cursor-pointer select-none whitespace-nowrap px-4 py-2.5 font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${
                  k.wyrownanie === 'prawo' ? 'text-right' : 'text-left'
                }`}
                aria-sort={sortowanie.id === k.id ? (sortowanie.desc ? 'descending' : 'ascending') : 'none'}
              >
                <span className={`inline-flex items-center gap-1 ${k.wyrownanie === 'prawo' ? 'flex-row-reverse' : ''}`}>
                  {k.naglowek}
                  {sortowanie.id === k.id && <span aria-hidden>{sortowanie.desc ? '▼' : '▲'}</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {posortowane.map((row) => (
            <tr
              key={wierszKlucz(row)}
              onClick={onKlikWiersza ? () => onKlikWiersza(row) : undefined}
              className={`bg-white dark:bg-slate-950 ${onKlikWiersza ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900' : ''}`}
            >
              {kolumny.map((k) => (
                <td
                  key={k.id}
                  className={`whitespace-nowrap px-4 py-2 text-slate-700 dark:text-slate-300 ${k.wyrownanie === 'prawo' ? 'text-right' : 'text-left'}`}
                >
                  {k.cell ? k.cell(row) : k.wartosc(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {dane.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Brak danych do pokazania.</div>
      )}
    </div>
  );
}
