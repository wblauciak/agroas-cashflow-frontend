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

export function Kompensaty() {
  const meta = useMeta();
  const kompensaty = useKompensaty(meta.data?.pliki.kompensaty);

  if (meta.isLoading || kompensaty.isLoading) return <StanZapytania stan="ladowanie" />;
  if (meta.isError || kompensaty.isError) return <StanZapytania stan="blad" komunikat={(meta.error ?? kompensaty.error) instanceof Error ? (meta.error ?? kompensaty.error)!.message : undefined} />;
  if (!kompensaty.data) return null;

  const dane = kompensaty.data.dane.map(dekodujKompensate);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kompensaty</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Domyślnie sortowane po potencjale w horyzoncie 30 dni — sortowanie po kwocie łącznej wypycha z góry
          podmioty, których saldo zapada dopiero za miesiące.
        </p>
      </div>
      <SortableTable
        dane={dane}
        kolumny={KOLUMNY}
        domyslneSortowanie={{ id: 'potencjalDo30Dni', desc: true }}
        wierszKlucz={(r) => r.klucz}
      />
    </div>
  );
}
