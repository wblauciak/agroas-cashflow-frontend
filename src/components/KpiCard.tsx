import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';

export function KpiCard({
  etykieta,
  wartosc,
  podpis,
  ton = 'neutralny',
  dymek,
}: {
  etykieta: string;
  wartosc: string;
  podpis?: string;
  ton?: 'neutralny' | 'dobry' | 'zly';
  dymek?: ReactNode;
}) {
  const tonKlasy = {
    neutralny: 'text-slate-900 dark:text-slate-100',
    dobry: 'text-emerald-600 dark:text-emerald-400',
    zly: 'text-red-600 dark:text-red-400',
  }[ton];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
        {etykieta}
        {dymek && <InfoTooltip>{dymek}</InfoTooltip>}
      </div>
      <div className={`mt-1.5 text-2xl font-semibold tabular-nums ${tonKlasy}`}>{wartosc}</div>
      {podpis && <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{podpis}</div>}
    </div>
  );
}
