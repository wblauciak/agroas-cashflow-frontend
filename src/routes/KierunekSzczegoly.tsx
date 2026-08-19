import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useMeta, useOtwarte } from '../lib/api';
import { dekodujPlatnosc, rozbicieBranzowe, sumaPLN } from '../lib/decode';
import type { Platnosc } from '../lib/types';
import { formatujDni, formatujPLN } from '../lib/format';
import { nazwaKontrahenta } from '../lib/kontrahent';
import { pobierzCsv } from '../lib/csv';
import { PASMA, pasmoIndeks } from '../lib/pasma';
import { VirtualTable } from '../components/VirtualTable';
import type { Kolumna } from '../components/SortableTable';
import { StanZapytania } from '../components/StanZapytania';

export function KierunekSzczegoly({ kierunek, kolor }: { kierunek: 'NALEZNOSC' | 'ZOBOWIAZANIE'; kolor: 'blue' | 'red' }) {
  const meta = useMeta();
  const otwarte = useOtwarte(meta.data?.pliki.otwarte);

  const [pokazWszystkie, setPokazWszystkie] = useState(false);
  const [szukaj, setSzukaj] = useState('');
  const [branzaWybrana, setBranzaWybrana] = useState<number | null>(null);
  const [pasmoWybrane, setPasmoWybrane] = useState<number | null>(null);

  const platnosci = useMemo(() => {
    if (!otwarte.data) return [];
    return otwarte.data.dane
      .map((r) => dekodujPlatnosc(r, otwarte.data!.slowniki))
      .filter((p) => p.kierunek === kierunek)
      .filter((p) => pokazWszystkie || p.kategoria === 'HANDLOWY');
  }, [otwarte.data, kierunek, pokazWszystkie]);

  const branze = otwarte.data?.slowniki.brn ?? [];

  const { macierz, sumyPasm, sumyBranz, sumaCalkowita } = useMemo(() => {
    const macierz = branze.map(() => new Array(PASMA.length).fill(0));
    const sumyPasm = new Array(PASMA.length).fill(0);
    const sumyBranz = branze.map(() => 0);
    let sumaCalkowita = 0;
    for (const p of platnosci) {
      const pasmo = pasmoIndeks(p.dni);
      for (const [branzaIdx, kwota] of rozbicieBranzowe(p)) {
        if (!macierz[branzaIdx]) continue;
        macierz[branzaIdx][pasmo] += kwota;
        sumyPasm[pasmo] += kwota;
        sumyBranz[branzaIdx] += kwota;
        sumaCalkowita += kwota;
      }
    }
    return { macierz, sumyPasm, sumyBranz, sumaCalkowita };
  }, [platnosci, branze]);

  const wierszeBranz = useMemo(
    () =>
      branze
        .map((nazwa, idx) => ({ idx, nazwa, suma: sumyBranz[idx] }))
        .filter((w) => w.suma !== 0)
        .sort((a, b) => b.suma - a.suma),
    [branze, sumyBranz],
  );

  const dokumenty = useMemo(() => {
    const szukajLower = szukaj.trim().toLowerCase();
    return platnosci.filter((p) => {
      if (pasmoWybrane !== null && pasmoIndeks(p.dni) !== pasmoWybrane) return false;
      if (branzaWybrana !== null) {
        const naleźy = rozbicieBranzowe(p).some(([b]) => b === branzaWybrana);
        if (!naleźy) return false;
      }
      if (szukajLower) {
        const nazwa = nazwaKontrahenta(otwarte.data, p.kntKlucz).toLowerCase();
        const trafia = p.dok.toLowerCase().includes(szukajLower) || (p.dokObcy?.toLowerCase().includes(szukajLower) ?? false) || nazwa.includes(szukajLower);
        if (!trafia) return false;
      }
      return true;
    });
  }, [platnosci, pasmoWybrane, branzaWybrana, szukaj, otwarte.data]);

  const kolumny: Kolumna<Platnosc>[] = useMemo(
    () => [
      { id: 'kontrahent', naglowek: 'Kontrahent', wartosc: (r) => nazwaKontrahenta(otwarte.data, r.kntKlucz) },
      { id: 'dok', naglowek: 'Dokument', wartosc: (r) => r.dok, szerokosc: 160 },
      {
        id: 'branza',
        naglowek: 'Grupa produktowa',
        wartosc: (r) => (typeof r.branza === 'number' ? (branze[r.branza] ?? '—') : 'wielobranżowy'),
        szerokosc: 170,
      },
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
    [otwarte.data, branze],
  );

  const sumaDokumenty = useMemo(() => sumaPLN(dokumenty), [dokumenty]);

  if (meta.isLoading || otwarte.isLoading) return <StanZapytania stan="ladowanie" />;
  if (meta.isError || otwarte.isError) return <StanZapytania stan="blad" />;

  function eksportujCsv() {
    pobierzCsv(
      `${kierunek === 'NALEZNOSC' ? 'naleznosci' : 'zobowiazania'}-${new Date().toISOString().slice(0, 10)}.csv`,
      kolumny.map((k) => k.naglowek),
      dokumenty.map((r) => kolumny.map((k) => k.wartosc(r))),
    );
  }

  const akcent = kolor === 'blue' ? 'var(--chart-nal)' : 'var(--chart-zob)';
  const filtrAktywny = branzaWybrana !== null || pasmoWybrane !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Razem otwarte: <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatujPLN(sumaCalkowita)}</span>
          {' · '}
          {platnosci.length} pozycji
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={pokazWszystkie} onChange={(e) => setPokazWszystkie(e.target.checked)} />
            pokaż też PODATKI, KASA/BANK i PROLONGATA
          </label>
          <button
            onClick={eksportujCsv}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: akcent }}
          >
            <Download size={16} strokeWidth={2} />
            Eksportuj CSV
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Grupy produktowe × terminy</h3>
          {filtrAktywny && (
            <button
              onClick={() => {
                setBranzaWybrana(null);
                setPasmoWybrane(null);
              }}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Wyczyść filtr
            </button>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-left font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    Grupa produktowa
                  </th>
                  {PASMA.map((pas, i) => (
                    <th
                      key={pas.id}
                      onClick={() => setPasmoWybrane(pasmoWybrane === i ? null : i)}
                      className={`cursor-pointer whitespace-nowrap px-3 py-2.5 text-right font-medium hover:text-slate-900 dark:hover:text-slate-100 ${
                        pas.przeterminowane ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                      } ${pasmoWybrane === i ? 'underline decoration-2 underline-offset-4' : ''}`}
                    >
                      {pas.etykieta}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">Razem</th>
                </tr>
              </thead>
              <tbody>
                {wierszeBranz.map(({ idx, nazwa }) => {
                  const wybrany = branzaWybrana === idx;
                  return (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td
                        onClick={() => setBranzaWybrana(wybrany ? null : idx)}
                        className="sticky left-0 z-10 cursor-pointer whitespace-nowrap bg-white px-3 py-2 text-slate-700 hover:text-slate-900 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-slate-100"
                        style={wybrany ? { background: 'var(--accent-tint)', color: 'var(--accent-ink)' } : undefined}
                      >
                        {nazwa}
                      </td>
                      {PASMA.map((_, i) => (
                        <td
                          key={i}
                          onClick={() => setPasmoWybrane(pasmoWybrane === i ? null : i)}
                          className="cursor-pointer whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400"
                          style={wybrany ? { background: 'var(--accent-tint)' } : undefined}
                        >
                          {macierz[idx][i] !== 0 ? formatujPLN(macierz[idx][i]) : '—'}
                        </td>
                      ))}
                      <td
                        className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100"
                        style={wybrany ? { background: 'var(--accent-tint)' } : undefined}
                      >
                        {formatujPLN(sumyBranz[idx])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <td className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 dark:bg-slate-900">Razem</td>
                  {PASMA.map((_, i) => (
                    <td key={i} className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                      {formatujPLN(sumyPasm[i])}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{formatujPLN(sumaCalkowita)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dokumenty</h3>
          <input
            type="text"
            placeholder="Szukaj: dokument, kontrahent…"
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dokumenty.length} z {platnosci.length} pozycji
          </p>
        </div>
        <VirtualTable
          dane={dokumenty}
          kolumny={kolumny}
          domyslneSortowanie={{ id: 'pozostajePLN', desc: true }}
          wierszKlucz={(r) => `${r.dokTyp}-${r.dokNumer}-${r.lp}`}
          podsumowanie={{ kontrahent: `Suma (${dokumenty.length} poz.)`, pozostajePLN: formatujPLN(sumaDokumenty) }}
        />
      </div>
    </div>
  );
}
