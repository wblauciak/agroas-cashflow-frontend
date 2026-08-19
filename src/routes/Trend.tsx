import { useMemo, useState } from 'react';
import { useSnapshotHistory, useSnapshotIndex } from '../lib/api';
import type { Snapshot } from '../lib/types';
import { formatujPLN } from '../lib/format';
import { StanZapytania } from '../components/StanZapytania';

const SZER = 900;
const WYS = 320;
const MARGINES = { gora: 20, dol: 32, lewo: 64, prawo: 16 };

function dataNaDni(iso: string): number {
  return Math.floor(new Date(iso + 'T00:00:00Z').getTime() / 86_400_000);
}

/** Dzieli punkty na ciagle odcinki - przerwa > 1 dzien miedzy sasiadami konczy odcinek. */
function naOdcinki<T extends { dni: number }>(punkty: T[]): T[][] {
  const odcinki: T[][] = [];
  let biezacy: T[] = [];
  for (const p of punkty) {
    if (biezacy.length > 0 && p.dni - biezacy[biezacy.length - 1].dni > 1) {
      odcinki.push(biezacy);
      biezacy = [];
    }
    biezacy.push(p);
  }
  if (biezacy.length > 0) odcinki.push(biezacy);
  return odcinki;
}

export function Trend() {
  const index = useSnapshotIndex();
  const daty = index.data?.daty ?? [];
  const wyniki = useSnapshotHistory(daty);
  const [hover, setHover] = useState<number | null>(null);

  const snapshoty = useMemo(
    () => wyniki.map((w) => w.data).filter((s): s is Snapshot => !!s).sort((a, b) => a.data.localeCompare(b.data)),
    [wyniki],
  );

  if (index.isLoading) return <StanZapytania stan="ladowanie" />;
  if (index.isError) return <StanZapytania stan="blad" />;

  if (snapshoty.length < 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trend</h2>
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          {snapshoty.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Brak jeszcze żadnego snapshotu dziennego.</p>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Dopiero pierwszy dzień pomiaru — trend pojawi się, gdy będzie co najmniej kilka punktów.
              </p>
              <div className="mt-3 flex justify-center gap-8">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Przeterminowane należności ({snapshoty[0].data})</div>
                  <div className="text-xl font-semibold text-[var(--chart-nal)]">{formatujPLN(snapshoty[0].naleznosci.przeterminowane)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Przeterminowane zobowiązania ({snapshoty[0].data})</div>
                  <div className="text-xl font-semibold text-[var(--chart-zob)]">{formatujPLN(snapshoty[0].zobowiazania.przeterminowane)}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const punkty = snapshoty.map((s) => ({
    dni: dataNaDni(s.data),
    data: s.data,
    nal: s.naleznosci.przeterminowane,
    zob: s.zobowiazania.przeterminowane,
  }));

  const minDni = punkty[0].dni;
  const maxDni = punkty[punkty.length - 1].dni;
  const rozpietoscDni = Math.max(1, maxDni - minDni);
  const maxWartosc = Math.max(1, ...punkty.map((p) => p.nal), ...punkty.map((p) => p.zob));

  const x = (dni: number) => MARGINES.lewo + ((dni - minDni) / rozpietoscDni) * (SZER - MARGINES.lewo - MARGINES.prawo);
  const y = (v: number) => WYS - MARGINES.dol - (v / maxWartosc) * (WYS - MARGINES.gora - MARGINES.dol);

  const odcinki = naOdcinki(punkty);

  function sciezka(klucz: 'nal' | 'zob') {
    return odcinki.map((odc) => 'M ' + odc.map((p) => `${x(p.dni)},${y(p[klucz])}`).join(' L ')).join(' ');
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trend przeterminowania</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Przerwy na wykresie to dni bez przebiegu (np. awaria) — nie interpolujemy, brak pomiaru ≠ zero.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-[var(--chart-surface)] p-4 shadow-sm dark:border-slate-800">
        <div className="mb-2 flex items-center gap-5 text-sm">
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="inline-block h-0.5 w-4" style={{ background: 'var(--chart-nal)' }} />
            Należności przeterminowane
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="inline-block h-0.5 w-4" style={{ background: 'var(--chart-zob)' }} />
            Zobowiązania przeterminowane
          </span>
        </div>

        <svg viewBox={`0 0 ${SZER} ${WYS}`} className="w-full" role="img" aria-label="Wykres trendu przeterminowania w czasie">
          {[0, 0.5, 1].map((f) => (
            <line
              key={f}
              x1={MARGINES.lewo}
              x2={SZER - MARGINES.prawo}
              y1={y(maxWartosc * f)}
              y2={y(maxWartosc * f)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
          ))}

          <path d={sciezka('nal')} fill="none" stroke="var(--chart-nal)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={sciezka('zob')} fill="none" stroke="var(--chart-zob)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {punkty.map((p, i) => (
            <g key={p.data}>
              <circle cx={x(p.dni)} cy={y(p.nal)} r={4} fill="var(--chart-nal)" stroke="var(--chart-surface)" strokeWidth={2} />
              <circle cx={x(p.dni)} cy={y(p.zob)} r={4} fill="var(--chart-zob)" stroke="var(--chart-surface)" strokeWidth={2} />
              <circle
                cx={x(p.dni)}
                cy={(y(p.nal) + y(p.zob)) / 2}
                r={14}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          ))}
        </svg>

        {hover !== null && (
          <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">{punkty[hover].data}</span> — należności:{' '}
            <span className="font-semibold tabular-nums">{formatujPLN(punkty[hover].nal)}</span>, zobowiązania:{' '}
            <span className="font-semibold tabular-nums">{formatujPLN(punkty[hover].zob)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
