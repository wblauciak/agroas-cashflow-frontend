import { useMemo, useState, type CSSProperties } from 'react';
import { CalendarClock, Layers, TriangleAlert } from 'lucide-react';
import { useMeta, useOtwarte, useProlongaty } from '../lib/api';
import { dekodujProlongate } from '../lib/decode';
import type { Prolongata } from '../lib/types';
import { dataNaDni, formatujDni, formatujPLN } from '../lib/format';
import { nazwaKontrahenta } from '../lib/kontrahent';
import { KpiCard } from '../components/KpiCard';
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
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TON[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

type Poziom = '1' | '2' | '3+';

function poziomBucket(nr: number): Poziom {
  if (nr <= 1) return '1';
  if (nr === 2) return '2';
  return '3+';
}

const POZIOM_TON: Record<Poziom, string> = {
  '1': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  '2': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  '3+': 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

function PoziomBadge({ nr }: { nr: number }) {
  const b = poziomBucket(nr);
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${POZIOM_TON[b]}`}>poziom {nr}</span>;
}

interface KontrahentRollup {
  kntKlucz: number;
  liczba: number;
  maksPoziom: number;
  sumaProlongowana: number;
  sumaPozostaje: number;
}

export function Prolongaty() {
  const meta = useMeta();
  const otwarte = useOtwarte(meta.data?.pliki.otwarte);
  const prolongaty = useProlongaty(meta.data?.pliki.prolongaty);

  const [poziomFiltr, setPoziomFiltr] = useState<'wszystkie' | Poziom>('wszystkie');
  const [dataOd, setDataOd] = useState('');
  const [dataDo, setDataDo] = useState('');
  const [szukaj, setSzukaj] = useState('');
  const [kntWybrany, setKntWybrany] = useState<number | null>(null);
  const [pokazRozliczone, setPokazRozliczone] = useState(false);

  const dane = useMemo(() => {
    if (!prolongaty.data) return [];
    return prolongaty.data.dane.map((r) => dekodujProlongate(r, prolongaty.data.slowniki.status));
  }, [prolongaty.data]);

  // Dokumenty z Pozostaje=0 sa juz splacone/rozliczone - domyslnie nieistotne
  // dla widoku "co jeszcze trzeba splacic", wiec domyslnie ukryte wszedzie
  // ponizej (kafelki, kontrahenci, tabela dokumentow).
  const daneAktywne = useMemo(
    () => (pokazRozliczone ? dane : dane.filter((p) => p.pozostajeDzis !== 0)),
    [dane, pokazRozliczone],
  );

  // Kafelki poziomow - zawsze z pelnego (aktywnego) zbioru, niezalezne od
  // filtrow ponizej (stabilny przeglad "z lotu ptaka", tak jak kafelki KPI
  // na Przegladzie).
  const kpiPoziomy = useMemo(() => {
    const puste = () => ({ prolongowana: 0, przeterminowane: 0, liczba: 0, liczbaPrzeterminowanych: 0 });
    const b: Record<Poziom, { prolongowana: number; przeterminowane: number; liczba: number; liczbaPrzeterminowanych: number }> = {
      '1': puste(),
      '2': puste(),
      '3+': puste(),
    };
    for (const p of daneAktywne) {
      const k = poziomBucket(p.nrProlongaty);
      b[k].prolongowana += p.kwotaProlongowana;
      b[k].liczba += 1;
      if (p.status === 'OTWARTA PRZETERMINOWANA') {
        b[k].przeterminowane += p.pozostajeDzis;
        b[k].liczbaPrzeterminowanych += 1;
      }
    }
    return b;
  }, [daneAktywne]);

  const dataOdDni = dataOd ? dataNaDni(dataOd) : null;
  const dataDoDni = dataDo ? dataNaDni(dataDo) : null;

  // Poziom + data zapadalnosci + szukaj - baza dla zestawienia kontrahentow
  // ORAZ dla tabeli dokumentow (wybor kontrahenta filtruje dalej, osobno).
  const wgPoziomuIDaty = useMemo(() => {
    const szukajLower = szukaj.trim().toLowerCase();
    return daneAktywne.filter((p) => {
      if (poziomFiltr !== 'wszystkie' && poziomBucket(p.nrProlongaty) !== poziomFiltr) return false;
      if (dataOdDni !== null && (p.terminPoProlongacie === null || p.terminPoProlongacie < dataOdDni)) return false;
      if (dataDoDni !== null && (p.terminPoProlongacie === null || p.terminPoProlongacie > dataDoDni)) return false;
      if (szukajLower) {
        const nazwa = nazwaKontrahenta(otwarte.data, p.kntKlucz).toLowerCase();
        if (!p.dok.toLowerCase().includes(szukajLower) && !nazwa.includes(szukajLower)) return false;
      }
      return true;
    });
  }, [daneAktywne, poziomFiltr, dataOdDni, dataDoDni, szukaj, otwarte.data]);

  const kontrahenci = useMemo(() => {
    const mapa = new Map<number, KontrahentRollup>();
    for (const p of wgPoziomuIDaty) {
      const w = mapa.get(p.kntKlucz) ?? { kntKlucz: p.kntKlucz, liczba: 0, maksPoziom: 0, sumaProlongowana: 0, sumaPozostaje: 0 };
      w.liczba += 1;
      w.maksPoziom = Math.max(w.maksPoziom, p.nrProlongaty);
      w.sumaProlongowana += p.kwotaProlongowana;
      w.sumaPozostaje += p.pozostajeDzis;
      mapa.set(p.kntKlucz, w);
    }
    return [...mapa.values()].sort((a, b) => b.sumaPozostaje - a.sumaPozostaje);
  }, [wgPoziomuIDaty]);

  const dokumenty = useMemo(
    () => (kntWybrany === null ? wgPoziomuIDaty : wgPoziomuIDaty.filter((p) => p.kntKlucz === kntWybrany)),
    [wgPoziomuIDaty, kntWybrany],
  );

  const kolumnyKontrahentow: Kolumna<KontrahentRollup>[] = useMemo(
    () => [
      { id: 'kontrahent', naglowek: 'Kontrahent', wartosc: (r) => nazwaKontrahenta(otwarte.data, r.kntKlucz) },
      { id: 'liczba', naglowek: 'Prolongat', wartosc: (r) => r.liczba, wyrownanie: 'prawo' },
      { id: 'maksPoziom', naglowek: 'Maks. poziom', wartosc: (r) => r.maksPoziom, cell: (r) => <PoziomBadge nr={r.maksPoziom} /> },
      {
        id: 'sumaProlongowana',
        naglowek: 'Wartość prolongowana',
        wartosc: (r) => r.sumaProlongowana,
        cell: (r) => <span className="tabular-nums">{formatujPLN(r.sumaProlongowana)}</span>,
        wyrownanie: 'prawo',
      },
      {
        id: 'sumaPozostaje',
        naglowek: 'Pozostaje dziś',
        wartosc: (r) => r.sumaPozostaje,
        cell: (r) => <span className="font-semibold tabular-nums">{formatujPLN(r.sumaPozostaje)}</span>,
        wyrownanie: 'prawo',
      },
    ],
    [otwarte.data],
  );

  const podsumowanieKontrahentow = useMemo(
    () => ({
      kontrahent: `Suma (${kontrahenci.length} kontrahentów)`,
      liczba: kontrahenci.reduce((s, r) => s + r.liczba, 0),
      sumaProlongowana: formatujPLN(kontrahenci.reduce((s, r) => s + r.sumaProlongowana, 0)),
      sumaPozostaje: formatujPLN(kontrahenci.reduce((s, r) => s + r.sumaPozostaje, 0)),
    }),
    [kontrahenci],
  );

  const kolumnyDokumentow: Kolumna<Prolongata>[] = useMemo(
    () => [
      { id: 'kontrahent', naglowek: 'Kontrahent', wartosc: (r) => nazwaKontrahenta(otwarte.data, r.kntKlucz) },
      { id: 'dok', naglowek: 'Dokument', wartosc: (r) => r.dok },
      { id: 'dokZrodlowy', naglowek: 'Dokument źródłowy', wartosc: (r) => r.dokZrodlowy ?? '—' },
      { id: 'nrProlongaty', naglowek: 'Poziom', wartosc: (r) => r.nrProlongaty, cell: (r) => <PoziomBadge nr={r.nrProlongaty} /> },
      { id: 'rata', naglowek: 'Rata', wartosc: (r) => r.rata, wyrownanie: 'prawo' },
      {
        id: 'terminPierwotny',
        naglowek: 'Termin pierwotny',
        wartosc: (r) => r.terminPierwotny,
        cell: (r) => formatujDni(r.terminPierwotny),
        wyrownanie: 'prawo',
      },
      {
        id: 'kwotaProlongowana',
        naglowek: 'Kwota',
        wartosc: (r) => r.kwotaProlongowana,
        cell: (r) => <span className="tabular-nums">{formatujPLN(r.kwotaProlongowana)}</span>,
        wyrownanie: 'prawo',
      },
      {
        id: 'pozostajeDzis',
        naglowek: 'Pozostaje',
        wartosc: (r) => r.pozostajeDzis,
        cell: (r) => <span className="font-semibold tabular-nums">{formatujPLN(r.pozostajeDzis)}</span>,
        wyrownanie: 'prawo',
      },
      {
        id: 'terminPoProlongacie',
        naglowek: 'Termin po prolongacie',
        wartosc: (r) => r.terminPoProlongacie,
        cell: (r) => formatujDni(r.terminPoProlongacie),
        wyrownanie: 'prawo',
      },
      { id: 'status', naglowek: 'Status', wartosc: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    ],
    [otwarte.data],
  );

  const podsumowanieDokumentow = useMemo(
    () => ({
      kontrahent: `Suma (${dokumenty.length} poz.)`,
      kwotaProlongowana: formatujPLN(dokumenty.reduce((s, r) => s + r.kwotaProlongowana, 0)),
      pozostajeDzis: formatujPLN(dokumenty.reduce((s, r) => s + r.pozostajeDzis, 0)),
    }),
    [dokumenty],
  );

  if (meta.isLoading || prolongaty.isLoading || otwarte.isLoading) return <StanZapytania stan="ladowanie" />;
  if (meta.isError || prolongaty.isError) return <StanZapytania stan="blad" />;

  const nazwaWybranego = kntWybrany !== null ? nazwaKontrahenta(otwarte.data, kntWybrany) : null;
  const filtrDatyAktywny = dataOd !== '' || dataDo !== '';

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-400 dark:text-slate-500">Kliknij kafelek, żeby przefiltrować tabele poniżej po poziomie.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(['1', '2', '3+'] as const).map((poziom) => (
          <div
            key={poziom}
            role="button"
            tabIndex={0}
            onClick={() => setPoziomFiltr(poziomFiltr === poziom ? 'wszystkie' : poziom)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPoziomFiltr(poziomFiltr === poziom ? 'wszystkie' : poziom);
              }
            }}
            className={`cursor-pointer rounded-2xl text-left transition-shadow ${poziomFiltr === poziom ? 'ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950' : ''}`}
            style={poziomFiltr === poziom ? ({ '--tw-ring-color': 'var(--accent)' } as CSSProperties) : undefined}
          >
            <KpiCard
              etykieta={`Poziom ${poziom} — prolongowane`}
              wartosc={formatujPLN(kpiPoziomy[poziom].prolongowana)}
              podpis={`${kpiPoziomy[poziom].liczba} pozycji`}
              ikona={Layers}
              ton={poziom === '3+' ? 'ostrzezenie' : 'neutralny'}
            />
          </div>
        ))}
        {(['1', '2', '3+'] as const).map((poziom) => (
          <div
            key={`prz-${poziom}`}
            role="button"
            tabIndex={0}
            onClick={() => setPoziomFiltr(poziomFiltr === poziom ? 'wszystkie' : poziom)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPoziomFiltr(poziomFiltr === poziom ? 'wszystkie' : poziom);
              }
            }}
            className={`cursor-pointer rounded-2xl text-left transition-shadow ${poziomFiltr === poziom ? 'ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950' : ''}`}
            style={poziomFiltr === poziom ? ({ '--tw-ring-color': 'var(--accent)' } as CSSProperties) : undefined}
          >
            <KpiCard
              etykieta={`Poziom ${poziom} — przeterminowane`}
              wartosc={formatujPLN(kpiPoziomy[poziom].przeterminowane)}
              podpis={`${kpiPoziomy[poziom].liczbaPrzeterminowanych} pozycji`}
              ikona={TriangleAlert}
              ton={kpiPoziomy[poziom].przeterminowane > 0 ? 'ostrzezenie' : 'neutralny'}
              dymek="Pozostaje dziś na dokumentach prolongaty, których termin już minął (status 'OTWARTA PRZETERMINOWANA')."
            />
          </div>
        ))}
      </div>

      {kpiPoziomy['3+'].liczba > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <TriangleAlert size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
          <div className="text-sm text-amber-900 dark:text-amber-200">
            <span className="font-semibold">Poziom 3+ — kandydaci do windykacji, nie do kolejnej prolongaty.</span> Od
            trzeciego poziomu skuteczność prolongat statystycznie się załamuje. Filtruj tabelę poniżej po poziomie „3+", żeby
            zobaczyć pełną listę.
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Kontrahenci</h3>
          {kntWybrany !== null && (
            <button
              onClick={() => setKntWybrany(null)}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Wyczyść wybór kontrahenta
            </button>
          )}
        </div>
        <SortableTable
          dane={kontrahenci}
          kolumny={kolumnyKontrahentow}
          domyslneSortowanie={{ id: 'sumaPozostaje', desc: true }}
          wierszKlucz={(r) => r.kntKlucz}
          onKlikWiersza={(r) => setKntWybrany(kntWybrany === r.kntKlucz ? null : r.kntKlucz)}
          podsumowanie={podsumowanieKontrahentow}
          rozmiarStrony={10}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <h3 className="w-full text-sm font-semibold text-slate-900 dark:text-slate-100 sm:w-auto">
            Dokumenty{nazwaWybranego && <span className="font-normal text-slate-500 dark:text-slate-400"> — {nazwaWybranego}</span>}
          </h3>
          <input
            type="text"
            placeholder="Szukaj: dokument, kontrahent…"
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
            className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={poziomFiltr}
            onChange={(e) => setPoziomFiltr(e.target.value as typeof poziomFiltr)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="wszystkie">Wszystkie poziomy</option>
            <option value="1">Poziom 1</option>
            <option value="2">Poziom 2</option>
            <option value="3+">Poziom 3+</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <CalendarClock size={15} strokeWidth={2} className="text-slate-400" />
            Zapadalność od
            <input
              type="date"
              value={dataOd}
              onChange={(e) => setDataOd(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            do
            <input
              type="date"
              value={dataDo}
              onChange={(e) => setDataDo(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={pokazRozliczone} onChange={(e) => setPokazRozliczone(e.target.checked)} />
            pokaż rozliczone (pozostaje 0 zł)
          </label>
          {(poziomFiltr !== 'wszystkie' || filtrDatyAktywny || szukaj) && (
            <button
              onClick={() => {
                setPoziomFiltr('wszystkie');
                setDataOd('');
                setDataDo('');
                setSzukaj('');
              }}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Wyczyść filtry
            </button>
          )}
          <p className="ml-auto text-sm text-slate-500 dark:text-slate-400">{dokumenty.length} z {daneAktywne.length} pozycji</p>
        </div>
        <SortableTable
          dane={dokumenty}
          kolumny={kolumnyDokumentow}
          domyslneSortowanie={{ id: 'pozostajeDzis', desc: true }}
          wierszKlucz={(r) => `${r.prlnId}-${r.rata}`}
          podsumowanie={podsumowanieDokumentow}
          rozmiarStrony={10}
        />
      </div>
    </div>
  );
}
