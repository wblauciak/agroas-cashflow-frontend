import { useMemo, useState } from 'react';
import { useMeta, useOtwarte } from '../lib/api';
import { dekodujPlatnosc } from '../lib/decode';
import { dniNaDate, formatujPLN } from '../lib/format';
import { StanZapytania } from '../components/StanZapytania';

// Kolejnosc i nazwy stale, zgodne z dokumentacja (KubelekLp 0-11).
const KUBELEK_ETYKIETY = [
  'brak terminu',
  '> 90',
  '61-90',
  '31-60',
  '15-30',
  '1-14',
  'dziś',
  '1-7',
  '8-14',
  '15-30 ',
  '31-60 ',
  '> 60',
];

const SZER = 900;
const WYS = 420;
const MARGINES = { gora: 24, dol: 40, lewo: 56, prawo: 16 };
const SZER_BARU = 22;

export function Wiekowanie() {
  const meta = useMeta();
  const otwarte = useOtwarte(meta.data?.pliki.otwarte);
  const [pokazWszystkie, setPokazWszystkie] = useState(false);
  const [wybranyKubelek, setWybranyKubelek] = useState<number | null>(null);
  const [hover, setHover] = useState<{ kub: number; kier: 'nal' | 'zob' } | null>(null);

  const platnosci = useMemo(() => {
    if (!otwarte.data) return [];
    const wszystkie = otwarte.data.dane.map((r) => dekodujPlatnosc(r, otwarte.data!.slowniki));
    return pokazWszystkie ? wszystkie : wszystkie.filter((p) => p.kategoria === 'HANDLOWY');
  }, [otwarte.data, pokazWszystkie]);

  const { nal, zob, maxAbs } = useMemo(() => {
    const nal = new Array(12).fill(0);
    const zob = new Array(12).fill(0);
    for (const p of platnosci) {
      const cel = p.kierunek === 'NALEZNOSC' ? nal : zob;
      cel[p.kubelekLp] += p.pozostajePLN;
    }
    const maxAbs = Math.max(1, ...nal, ...zob);
    return { nal, zob, maxAbs };
  }, [platnosci]);

  const dniPodrecznik = useMemo(() => {
    if (wybranyKubelek === null) return [];
    const mapa = new Map<number, { liczba: number; suma: number }>();
    for (const p of platnosci) {
      if (p.kubelekLp !== wybranyKubelek || p.termin === null) continue;
      const w = mapa.get(p.termin) ?? { liczba: 0, suma: 0 };
      w.liczba += 1;
      w.suma += p.pozostajePLN;
      mapa.set(p.termin, w);
    }
    return [...mapa.entries()]
      .map(([termin, w]) => ({ termin, ...w }))
      .sort((a, b) => b.suma - a.suma)
      .slice(0, 8);
  }, [platnosci, wybranyKubelek]);

  if (meta.isLoading || otwarte.isLoading) return <StanZapytania stan="ladowanie" />;
  if (meta.isError || otwarte.isError) return <StanZapytania stan="blad" />;

  const wysBaru = (WYS - MARGINES.gora - MARGINES.dol) / 2;
  const yZero = MARGINES.gora + wysBaru;
  const szerPasa = (SZER - MARGINES.lewo - MARGINES.prawo) / 12;

  function skala(v: number) {
    return (v / maxAbs) * (wysBaru - 8);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Terminy są silnie skoncentrowane — kliknij kubełek, żeby zobaczyć, które konkretne daty go tworzą.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={pokazWszystkie} onChange={(e) => setPokazWszystkie(e.target.checked)} />
          pokaż też PODATKI i KASA/BANK
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-[var(--chart-surface)] p-4 shadow-sm dark:border-slate-800">
        {/* Legenda */}
        <div className="mb-2 flex items-center gap-5 text-sm">
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--chart-nal)' }} />
            Należności
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--chart-zob)' }} />
            Zobowiązania
          </span>
        </div>

        <svg viewBox={`0 0 ${SZER} ${WYS}`} className="w-full" role="img" aria-label="Wykres wiekowania należności i zobowiązań">
          {/* linia zero */}
          <line x1={MARGINES.lewo} y1={yZero} x2={SZER - MARGINES.prawo} y2={yZero} stroke="var(--chart-axis)" strokeWidth={1} />

          {KUBELEK_ETYKIETY.map((etykieta, i) => {
            const xSrodek = MARGINES.lewo + szerPasa * i + szerPasa / 2;
            const hNal = skala(nal[i]);
            const hZob = skala(zob[i]);
            const jestDzis = i === 6;
            const wybrany = wybranyKubelek === i;

            return (
              <g key={i}>
                {jestDzis && (
                  <line x1={xSrodek} y1={MARGINES.gora} x2={xSrodek} y2={WYS - MARGINES.dol} stroke="var(--chart-grid)" strokeWidth={1} strokeDasharray="3 3" />
                )}

                {/* Naleznosci - w gore */}
                <rect
                  x={xSrodek - SZER_BARU / 2}
                  y={yZero - hNal}
                  width={SZER_BARU}
                  height={hNal}
                  rx={4}
                  fill="var(--chart-nal)"
                  opacity={hover && hover.kub === i && hover.kier !== 'nal' ? 0.55 : 1}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover({ kub: i, kier: 'nal' })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setWybranyKubelek(wybrany ? null : i)}
                />
                {/* Zobowiazania - w dol (odbicie: rect rosnie od yZero w dol) */}
                <rect
                  x={xSrodek - SZER_BARU / 2}
                  y={yZero}
                  width={SZER_BARU}
                  height={hZob}
                  rx={4}
                  fill="var(--chart-zob)"
                  opacity={hover && hover.kub === i && hover.kier !== 'zob' ? 0.55 : 1}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover({ kub: i, kier: 'zob' })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setWybranyKubelek(wybrany ? null : i)}
                />

                {wybrany && (
                  <rect
                    x={xSrodek - szerPasa / 2 + 1}
                    y={MARGINES.gora}
                    width={szerPasa - 2}
                    height={WYS - MARGINES.gora - MARGINES.dol}
                    fill="none"
                    stroke="var(--chart-ink-muted)"
                    strokeDasharray="2 2"
                    rx={4}
                  />
                )}

                <text
                  x={xSrodek}
                  y={WYS - MARGINES.dol + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={jestDzis ? 700 : 400}
                  fill="var(--chart-ink-secondary)"
                >
                  {etykieta}
                </text>
              </g>
            );
          })}
        </svg>

        {hover && (
          <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">{KUBELEK_ETYKIETY[hover.kub]}</span> —{' '}
            {hover.kier === 'nal' ? 'należności' : 'zobowiązania'}:{' '}
            <span className="font-semibold tabular-nums">{formatujPLN((hover.kier === 'nal' ? nal : zob)[hover.kub])}</span>
          </div>
        )}
      </div>

      {wybranyKubelek !== null && (
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm dark:border-slate-800">
          <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Kubełek „{KUBELEK_ETYKIETY[wybranyKubelek]}" — daty z największą koncentracją
          </div>
          {dniPodrecznik.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Brak dat w tym kubełku (np. „brak terminu").</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {dniPodrecznik.map((d) => (
                <div key={d.termin} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {dniNaDate(d.termin).toLocaleDateString('pl-PL', { timeZone: 'UTC' })} — {d.liczba} pozycji
                  </span>
                  <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatujPLN(d.suma)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
