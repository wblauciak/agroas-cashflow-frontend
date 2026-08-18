import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState, type ReactNode } from 'react';
import type { Kolumna } from './SortableTable';

const WYS_WIERSZA = 36;

export function VirtualTable<T>({
  dane,
  kolumny,
  domyslneSortowanie,
  wierszKlucz,
  wysokoscKontenera = 560,
}: {
  dane: T[];
  kolumny: Kolumna<T>[];
  domyslneSortowanie: { id: string; desc: boolean };
  wierszKlucz: (row: T) => string | number;
  wysokoscKontenera?: number;
}) {
  const [sortowanie, setSortowanie] = useState(domyslneSortowanie);
  const kolumna = kolumny.find((k) => k.id === sortowanie.id);

  const posortowane = kolumna
    ? [...dane].sort((a, b) => {
        const va = kolumna.wartosc(a);
        const vb = kolumna.wartosc(b);
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'pl');
        return sortowanie.desc ? -cmp : cmp;
      })
    : dane;

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: posortowane.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => WYS_WIERSZA,
    overscan: 12,
  });

  function klikNaglowek(id: string) {
    setSortowanie((s) => (s.id === id ? { id, desc: !s.desc } : { id, desc: true }));
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto">
        <div className="flex min-w-max bg-slate-50 dark:bg-slate-900" style={{ borderBottom: '1px solid var(--chart-grid)' }}>
          {kolumny.map((k) => (
            <div
              key={k.id}
              onClick={() => klikNaglowek(k.id)}
              className="w-40 shrink-0 cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {k.naglowek}
              {sortowanie.id === k.id && <span aria-hidden> {sortowanie.desc ? '▼' : '▲'}</span>}
            </div>
          ))}
        </div>
        <div ref={parentRef} style={{ height: wysokoscKontenera, overflow: 'auto' }}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', minWidth: 'max-content' }}>
            {virtualizer.getVirtualItems().map((vr) => {
              const row = posortowane[vr.index];
              return (
                <div
                  key={wierszKlucz(row)}
                  className="absolute left-0 top-0 flex w-full min-w-max border-b border-slate-100 bg-white text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  style={{ height: WYS_WIERSZA, transform: `translateY(${vr.start}px)` }}
                >
                  {kolumny.map((k) => (
                    <div key={k.id} className="flex w-40 shrink-0 items-center whitespace-nowrap px-3">
                      {(k.cell ? k.cell(row) : k.wartosc(row)) as ReactNode}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {dane.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Brak wierszy spełniających filtry.</div>
      )}
    </div>
  );
}
