import { useMemo } from 'react';
import { useMeta, useOtwarte, useProlongaty } from '../lib/api';
import { dekodujProlongate } from '../lib/decode';
import type { Prolongata } from '../lib/types';
import { formatujDni, formatujPLN } from '../lib/format';
import { nazwaKontrahenta } from '../lib/kontrahent';
import { SortableTable, type Kolumna } from '../components/SortableTable';
import { StanZapytania } from '../components/StanZapytania';

const STATUS_TON: Record<string, string> = {
  'OTWARTA PRZETERMINOWANA': 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  'SPŁACONA PO TERMINIE': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'SPŁACONA W TERMINIE': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  ROZLICZONA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'OTWARTA W TERMINIE': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'PROLONGOWANA PONOWNIE': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TON[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export function Prolongaty() {
  const meta = useMeta();
  const otwarte = useOtwarte(meta.data?.pliki.otwarte);
  const prolongaty = useProlongaty(meta.data?.pliki.prolongaty);

  const dane = useMemo(() => {
    if (!prolongaty.data) return [];
    return prolongaty.data.dane.map((r) => dekodujProlongate(r, prolongaty.data.slowniki.status));
  }, [prolongaty.data]);

  const { alerty, tabela } = useMemo(() => {
    const alerty: Prolongata[] = [];
    const tabela: Prolongata[] = [];
    for (const p of dane) (p.nrProlongaty >= 3 ? alerty : tabela).push(p);
    return { alerty, tabela };
  }, [dane]);

  const kolumny: Kolumna<Prolongata>[] = useMemo(
    () => [
      { id: 'kontrahent', naglowek: 'Kontrahent', wartosc: (r) => nazwaKontrahenta(otwarte.data, r.kntKlucz) },
      { id: 'dok', naglowek: 'Dokument', wartosc: (r) => r.dok },
      { id: 'nrProlongaty', naglowek: 'Poziom', wartosc: (r) => r.nrProlongaty },
      { id: 'rata', naglowek: 'Rata', wartosc: (r) => r.rata },
      { id: 'kwotaProlongowana', naglowek: 'Kwota', wartosc: (r) => r.kwotaProlongowana, cell: (r) => formatujPLN(r.kwotaProlongowana) },
      { id: 'pozostajeDzis', naglowek: 'Pozostaje', wartosc: (r) => r.pozostajeDzis, cell: (r) => formatujPLN(r.pozostajeDzis) },
      {
        id: 'terminPoProlongacie',
        naglowek: 'Termin po prolongacie',
        wartosc: (r) => r.terminPoProlongacie,
        cell: (r) => formatujDni(r.terminPoProlongacie),
      },
      { id: 'status', naglowek: 'Status', wartosc: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    ],
    [otwarte.data],
  );

  if (meta.isLoading || prolongaty.isLoading || otwarte.isLoading) return <StanZapytania stan="ladowanie" />;
  if (meta.isError || prolongaty.isError) return <StanZapytania stan="blad" />;

  // KwotaProlongowana, nie pozostajeDzis - zgodnie z definicja "prolongatyPoziom3Plus"
  // w CashFlowJsonBuilder.cs, zeby suma tu i na Przegladzie (z meta.json) sie zgadzaly.
  const sumaAlertow = alerty.reduce((s, p) => s + p.kwotaProlongowana, 0);

  return (
    <div className="space-y-6">
      {alerty.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Poziom 3+ — kandydaci do windykacji, nie do kolejnej prolongaty
          </div>
          <div className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            {alerty.length} płatności na {formatujPLN(sumaAlertow)}. Od trzeciego poziomu skuteczność prolongat
            statystycznie się załamuje.
          </div>
          <div className="mt-3 divide-y divide-amber-200 dark:divide-amber-900">
            {alerty
              .slice()
              .sort((a, b) => b.kwotaProlongowana - a.kwotaProlongowana)
              .map((p) => (
                <div key={`${p.prlnId}-${p.rata}`} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-amber-900 dark:text-amber-200">
                    {nazwaKontrahenta(otwarte.data, p.kntKlucz)} — {p.dok} (poziom {p.nrProlongaty})
                  </span>
                  <span className="font-medium text-amber-900 dark:text-amber-200">{formatujPLN(p.kwotaProlongowana)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Prolongaty (poziom 1–2)</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tabela.length} pozycji</p>
      </div>
      <SortableTable
        dane={tabela}
        kolumny={kolumny}
        domyslneSortowanie={{ id: 'pozostajeDzis', desc: true }}
        wierszKlucz={(r) => `${r.prlnId}-${r.rata}`}
      />
    </div>
  );
}
