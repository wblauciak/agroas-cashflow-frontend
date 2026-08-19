import { useState } from 'react';
import { LayoutGrid, Rows3 } from 'lucide-react';
import { useMeta, useKompensaty } from '../lib/api';
import { dekodujKompensate } from '../lib/decode';
import type { Kompensata } from '../lib/types';
import { formatujPLN } from '../lib/format';
import { SortableTable, type Kolumna } from '../components/SortableTable';
import { StanZapytania } from '../components/StanZapytania';

const KOLUMNY: Kolumna<Kompensata>[] = [
  { id: 'nazwa', naglowek: 'Podmiot', wartosc: (r) => r.nazwa },
  { id: 'liczbaKart', naglowek: 'Kart', wartosc: (r) => r.liczbaKart },
  { id: 'pozycjiN', naglowek: 'Poz. N', wartosc: (r) => r.pozycjiN },
  { id: 'pozycjiZ', naglowek: 'Poz. Z', wartosc: (r) => r.pozycjiZ },
  { id: 'naleznosci', naglowek: 'Należności', wartosc: (r) => r.naleznosci, cell: (r) => formatujPLN(r.naleznosci) },
  { id: 'zobowiazania', naglowek: 'Zobowiązania', wartosc: (r) => r.zobowiazania, cell: (r) => formatujPLN(r.zobowiazania) },
  { id: 'saldoNetto', naglowek: 'Saldo netto', wartosc: (r) => r.saldoNetto, cell: (r) => formatujPLN(r.saldoNetto) },
  {
    id: 'potencjalKompensaty',
    naglowek: 'Potencjał łączny',
    wartosc: (r) => r.potencjalKompensaty,
    cell: (r) => formatujPLN(r.potencjalKompensaty),
  },
  {
    id: 'potencjalDo30Dni',
    naglowek: 'Potencjał do 30 dni',
    wartosc: (r) => r.potencjalDo30Dni,
    cell: (r) => <span className="font-semibold text-slate-900 dark:text-slate-100">{formatujPLN(r.potencjalDo30Dni)}</span>,
  },
  {
    id: 'potencjalWymagalny',
    naglowek: 'Wymagalny dziś',
    wartosc: (r) => r.potencjalWymagalny,
    cell: (r) => <span className="text-red-600 dark:text-red-400">{formatujPLN(r.potencjalWymagalny)}</span>,
  },
];

function KompensataCard({ r }: { r: Kompensata }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{r.nazwa}</h3>
        {r.liczbaKart > 1 && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {r.liczbaKart} kart
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        {r.pozycjiN} poz. należności · {r.pozycjiZ} poz. zobowiązań
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Należności</div>
          <div className="font-medium text-blue-600 dark:text-blue-400">{formatujPLN(r.naleznosci)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Zobowiązania</div>
          <div className="font-medium text-red-600 dark:text-red-400">{formatujPLN(r.zobowiazania)}</div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">Potencjał do 30 dni</span>
          <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatujPLN(r.potencjalDo30Dni)}</span>
        </div>
        {r.potencjalWymagalny > 0 && (
          <div className="mt-1.5 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            {formatujPLN(r.potencjalWymagalny)} wymagalne dziś
          </div>
        )}
      </div>
    </div>
  );
}

export function Kompensaty() {
  const meta = useMeta();
  const kompensaty = useKompensaty(meta.data?.pliki.kompensaty);
  const [widok, setWidok] = useState<'tabela' | 'karty'>('tabela');

  if (meta.isLoading || kompensaty.isLoading) return <StanZapytania stan="ladowanie" />;
  if (meta.isError || kompensaty.isError) return <StanZapytania stan="blad" komunikat={(meta.error ?? kompensaty.error) instanceof Error ? (meta.error ?? kompensaty.error)!.message : undefined} />;
  if (!kompensaty.data) return null;

  const dane = kompensaty.data.dane.map(dekodujKompensate);
  const daneKarty = [...dane].sort((a, b) => b.potencjalDo30Dni - a.potencjalDo30Dni);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Domyślnie sortowane po potencjale w horyzoncie 30 dni — sortowanie po kwocie łącznej wypycha z góry
          podmioty, których saldo zapada dopiero za miesiące.
        </p>
        <div className="flex shrink-0 gap-1 rounded-xl border border-slate-200 p-1 dark:border-slate-800">
          <button
            onClick={() => setWidok('tabela')}
            aria-label="Widok tabeli"
            className={`rounded-lg p-1.5 transition-colors ${widok === 'tabela' ? 'text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            style={widok === 'tabela' ? { background: 'var(--accent)' } : undefined}
          >
            <Rows3 size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => setWidok('karty')}
            aria-label="Widok kart"
            className={`rounded-lg p-1.5 transition-colors ${widok === 'karty' ? 'text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            style={widok === 'karty' ? { background: 'var(--accent)' } : undefined}
          >
            <LayoutGrid size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {widok === 'tabela' ? (
        <SortableTable
          dane={dane}
          kolumny={KOLUMNY}
          domyslneSortowanie={{ id: 'potencjalDo30Dni', desc: true }}
          wierszKlucz={(r) => r.klucz}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {daneKarty.map((r) => (
            <KompensataCard key={r.klucz} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
