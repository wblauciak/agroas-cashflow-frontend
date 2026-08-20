import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
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
  const [ukryjKancelarie, setUkryjKancelarie] = useState(false);
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
      if (ukryjKancelarie && p.kontrahentKancelaria) return false;
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
  }, [wszystkiePlatnosci, kierunek, pokazPodatkiKasa, ukryjKancelarie, branzaFiltr, szukaj, otwarte.data]);

  const kolumny: Kolumna<Platnosc>[] = useMemo(
    () => [
      {
        id: 'kontrahent',
        naglowek: 'Kontrahent',
        wartosc: (r) => nazwaKontrahenta(otwarte.data, r.kntKlucz),
        cell: (r) => (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">{nazwaKontrahenta(otwarte.data, r.kntKlucz)}</span>
            {r.kontrahentKancelaria && (
              <span
                className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                title="Kontrahent w windykacji sądowej/komorniczej przez kancelarię prawną"
              >
                Kancelaria
              </span>
            )}
          </span>
        ),
      },
      { id: 'dok', naglowek: 'Dokument', wartosc: (r) => r.dok, szerokosc: 160 },
      {
        id: 'kierunek',
        naglowek: 'Kierunek',
        wartosc: (r) => r.kierunek,
        szerokosc: 130,
        cell: (r) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              r.kierunek === 'NALEZNOSC'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {r.kierunek === 'NALEZNOSC' ? 'Należność' : 'Zobowiązanie'}
          </span>
        ),
      },
      { id: 'kategoria', naglowek: 'Kategoria', wartosc: (r) => r.kategoria, szerokosc: 120 },
      { id: 'kubelek', naglowek: 'Kubełek', wartosc: (r) => r.kubelekLp, cell: (r) => KUBELEK_NAZWY[r.kubelekLp], szerokosc: 130 },
      { id: 'termin', naglowek: 'Termin', wartosc: (r) => r.termin, cell: (r) => formatujDni(r.termin), szerokosc: 110, wyrownanie: 'prawo' },
      { id: 'dni', naglowek: 'Dni po terminie', wartosc: (r) => r.dni ?? 0, szerokosc: 130, wyrownanie: 'prawo' },
      {
        id: 'pozostajePLN',
        naglowek: 'Pozostaje (PLN)',
        wartosc: (r) => r.pozostajePLN,
        cell: (r) => <span className="font-medium tabular-nums">{formatujPLN(r.pozostajePLN)}</span>,
        szerokosc: 150,
        wyrownanie: 'prawo',
      },
      { id: 'formaPlatnosci', naglowek: 'Forma płatności', wartosc: (r) => r.formaPlatnosci, szerokosc: 150 },
    ],
    [otwarte.data],
  );

  const sumaPozostaje = useMemo(() => przefiltrowane.reduce((s, r) => s + r.pozostajePLN, 0), [przefiltrowane]);

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
        <p className="text-sm text-slate-500 dark:text-slate-400">{przefiltrowane.length} z {wszystkiePlatnosci.length} pozycji</p>
        <button
          onClick={eksportujCsv}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Download size={16} strokeWidth={2} />
          Eksportuj CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-3 shadow-sm dark:border-slate-800">
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
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300" title="Kontrahenci z otwartą sprawą sądową/komorniczą przez kancelarię prawną — nie są aktywnym zadłużeniem operacyjnym">
          <input type="checkbox" checked={ukryjKancelarie} onChange={(e) => setUkryjKancelarie(e.target.checked)} />
          ukryj klientów w windykacji (kancelaria)
        </label>
      </div>

      <VirtualTable
        dane={przefiltrowane}
        kolumny={kolumny}
        domyslneSortowanie={{ id: 'pozostajePLN', desc: true }}
        wierszKlucz={(r) => `${r.dokTyp}-${r.dokNumer}-${r.lp}`}
        podsumowanie={{
          kontrahent: `Suma (${przefiltrowane.length} poz.)`,
          pozostajePLN: formatujPLN(sumaPozostaje),
        }}
      />
    </div>
  );
}
