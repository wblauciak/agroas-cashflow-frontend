import { useMemo, useState } from 'react';
import { useMeta, useOtwarte } from '../lib/api';
import { dekodujPlatnosc } from '../lib/decode';
import type { Platnosc } from '../lib/types';
import { formatujDni, formatujPLN } from '../lib/format';
import { nazwaKontrahenta } from '../lib/kontrahent';
import { pobierzCsv } from '../lib/csv';
import { VirtualTable } from '../components/VirtualTable';
import type { Kolumna } from '../components/SortableTable';
import { StanZapytania } from '../components/StanZapytania';

const KUBELEK_NAZWY = [
  'brak terminu', 'przeterm. > 90', 'przeterm. 61-90', 'przeterm. 31-60', 'przeterm. 15-30', 'przeterm. 1-14',
  'dziś', 'za 1-7', 'za 8-14', 'za 15-30', 'za 31-60', 'za > 60',
];

export function Rozrachunki() {
  const meta = useMeta();
  const otwarte = useOtwarte(meta.data?.pliki.otwarte);

  const [szukaj, setSzukaj] = useState('');
  const [kierunek, setKierunek] = useState<'wszystkie' | 'NALEZNOSC' | 'ZOBOWIAZANIE'>('wszystkie');
  const [pokazPodatkiKasa, setPokazPodatkiKasa] = useState(false);
  const [branzaFiltr, setBranzaFiltr] = useState<string>('wszystkie');

  const wszystkiePlatnosci = useMemo(() => {
    if (!otwarte.data) return [];
    return otwarte.data.dane.map((r) => dekodujPlatnosc(r, otwarte.data!.slowniki));
  }, [otwarte.data]);

  const branze = otwarte.data?.slowniki.brn ?? [];

  const przefiltrowane = useMemo(() => {
    const szukajLower = szukaj.trim().toLowerCase();
    return wszystkiePlatnosci.filter((p) => {
      if (kierunek !== 'wszystkie' && p.kierunek !== kierunek) return false;
      if (!pokazPodatkiKasa && (p.kategoria === 'PODATKI' || p.kategoria === 'KASA_BANK')) return false;
      if (branzaFiltr !== 'wszystkie') {
        const idx = Number(branzaFiltr);
        const naleźy = typeof p.branza === 'number' ? p.branza === idx : p.branza.some(([b]) => b === idx);
        if (!naleźy) return false;
      }
      if (szukajLower) {
        const nazwa = nazwaKontrahenta(otwarte.data, p.kntKlucz).toLowerCase();
        const trafia = p.dok.toLowerCase().includes(szukajLower) || (p.dokObcy?.toLowerCase().includes(szukajLower) ?? false) || nazwa.includes(szukajLower);
        if (!trafia) return false;
      }
      return true;
    });
  }, [wszystkiePlatnosci, kierunek, pokazPodatkiKasa, branzaFiltr, szukaj, otwarte.data]);

  const kolumny: Kolumna<Platnosc>[] = useMemo(
    () => [
      { id: 'kontrahent', naglowek: 'Kontrahent', wartosc: (r) => nazwaKontrahenta(otwarte.data, r.kntKlucz) },
      { id: 'dok', naglowek: 'Dokument', wartosc: (r) => r.dok },
      {
        id: 'kierunek',
        naglowek: 'Kierunek',
        wartosc: (r) => r.kierunek,
        cell: (r) => (r.kierunek === 'NALEZNOSC' ? 'Należność' : 'Zobowiązanie'),
      },
      { id: 'kategoria', naglowek: 'Kategoria', wartosc: (r) => r.kategoria },
      { id: 'kubelek', naglowek: 'Kubełek', wartosc: (r) => r.kubelekLp, cell: (r) => KUBELEK_NAZWY[r.kubelekLp] },
      { id: 'termin', naglowek: 'Termin', wartosc: (r) => r.termin, cell: (r) => formatujDni(r.termin) },
      { id: 'dni', naglowek: 'Dni po terminie', wartosc: (r) => r.dni ?? 0 },
      {
        id: 'pozostajePLN',
        naglowek: 'Pozostaje (PLN)',
        wartosc: (r) => r.pozostajePLN,
        cell: (r) => <span className="font-medium tabular-nums">{formatujPLN(r.pozostajePLN)}</span>,
      },
      { id: 'formaPlatnosci', naglowek: 'Forma płatności', wartosc: (r) => r.formaPlatnosci },
    ],
    [otwarte.data],
  );

  if (meta.isLoading || otwarte.isLoading) return <StanZapytania stan="ladowanie" />;
  if (meta.isError || otwarte.isError) return <StanZapytania stan="blad" />;

  function eksportujCsv() {
    pobierzCsv(
      `rozrachunki-${new Date().toISOString().slice(0, 10)}.csv`,
      kolumny.map((k) => k.naglowek),
      przefiltrowane.map((r) => kolumny.map((k) => k.wartosc(r))),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rozrachunki</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{przefiltrowane.length} z {wszystkiePlatnosci.length} pozycji</p>
        </div>
        <button
          onClick={eksportujCsv}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Eksportuj CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <input
          type="text"
          placeholder="Szukaj: dokument, kontrahent…"
          value={szukaj}
          onChange={(e) => setSzukaj(e.target.value)}
          className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={kierunek}
          onChange={(e) => setKierunek(e.target.value as typeof kierunek)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="wszystkie">Wszystkie kierunki</option>
          <option value="NALEZNOSC">Należności</option>
          <option value="ZOBOWIAZANIE">Zobowiązania</option>
        </select>
        <select
          value={branzaFiltr}
          onChange={(e) => setBranzaFiltr(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="wszystkie">Wszystkie branże</option>
          {branze.map((b, i) => (
            <option key={i} value={i}>
              {b}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={pokazPodatkiKasa} onChange={(e) => setPokazPodatkiKasa(e.target.checked)} />
          pokaż PODATKI i KASA/BANK
        </label>
      </div>

      <VirtualTable dane={przefiltrowane} kolumny={kolumny} domyslneSortowanie={{ id: 'pozostajePLN', desc: true }} wierszKlucz={(r) => `${r.dokTyp}-${r.dokNumer}-${r.lp}`} />
    </div>
  );
}
