import type { ComponentType, ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';

const TON_STYL = {
  neutralny: {
    tekst: 'text-slate-900 dark:text-slate-100',
    plakietka: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    pigulka: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  dobry: {
    tekst: 'text-emerald-600 dark:text-emerald-400',
    plakietka: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    pigulka: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  zly: {
    tekst: 'text-red-600 dark:text-red-400',
    plakietka: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    pigulka: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
} as const;

export function KpiCard({
  etykieta,
  wartosc,
  podpis,
  ton = 'neutralny',
  dymek,
  ikona: Ikona,
}: {
  etykieta: string;
  wartosc: string;
  podpis?: string;
  ton?: 'neutralny' | 'dobry' | 'zly';
  dymek?: ReactNode;
  ikona?: ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  const styl = TON_STYL[ton];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
          {etykieta}
          {dymek && <InfoTooltip>{dymek}</InfoTooltip>}
        </div>
        {Ikona && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styl.plakietka}`}>
            <Ikona size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className={`mt-3 text-3xl font-semibold tracking-tight tabular-nums ${styl.tekst}`}>{wartosc}</div>
      {podpis && (
        <div className="mt-2.5">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styl.pigulka}`}>{podpis}</span>
        </div>
      )}
    </div>
  );
}
