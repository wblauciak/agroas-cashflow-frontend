import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  podsumowanie,
  rozmiarStrony,
}: {
  dane: T[];
  kolumny: Kolumna<T>[];
  domyslneSortowanie: { id: string; desc: boolean };
  wierszKlucz: (row: T) => string | number;
  onKlikWiersza?: (row: T) => void;
  /** Wiersz sum/podsumowania pod tabela, kluczowany id kolumny. */
  podsumowanie?: Partial<Record<string, ReactNode>>;
  /** Gdy podane - tabela dzieli sie na strony po tyle wierszy, z nawigacja pod spodem. */
  rozmiarStrony?: number;
}) {
  const [sortowanie, setSortowanie] = useState(domyslneSortowanie);
  const [strona, setStrona] = useState(1);

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

  const liczbaStron = rozmiarStrony ? Math.max(1, Math.ceil(posortowane.length / rozmiarStrony)) : 1;

  // Filtr/sortowanie mogly zmniejszyc liczbe stron ponizej biezacej - wroc na 1.
  useEffect(() => {
    setStrona(1);
  }, [dane, sortowanie, rozmiarStrony]);

  const widoczne = rozmiarStrony ? posortowane.slice((strona - 1) * rozmiarStrony, strona * rozmiarStrony) : posortowane;

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
          {widoczne.map((row) => (
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
        {podsumowanie && dane.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {kolumny.map((k) => (
                <td
                  key={k.id}
                  className={`whitespace-nowrap px-4 py-2.5 ${k.wyrownanie === 'prawo' ? 'text-right' : 'text-left'}`}
                >
                  {podsumowanie[k.id] ?? ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
      {dane.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Brak danych do pokazania.</div>
      )}
      {rozmiarStrony && posortowane.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {(strona - 1) * rozmiarStrony + 1}–{Math.min(strona * rozmiarStrony, posortowane.length)} z {posortowane.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStrona((s) => Math.max(1, s - 1))}
              disabled={strona === 1}
              aria-label="Poprzednia strona"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              strona {strona} z {liczbaStron}
            </span>
            <button
              onClick={() => setStrona((s) => Math.min(liczbaStron, s + 1))}
              disabled={strona === liczbaStron}
              aria-label="Następna strona"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
