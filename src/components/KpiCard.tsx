export function KpiCard({
  etykieta,
  wartosc,
  podpis,
  ton = 'neutralny',
}: {
  etykieta: string;
  wartosc: string;
  podpis?: string;
  ton?: 'neutralny' | 'dobry' | 'zly';
}) {
  const tonKlasy = {
    neutralny: 'text-slate-900 dark:text-slate-100',
    dobry: 'text-emerald-600 dark:text-emerald-400',
    zly: 'text-red-600 dark:text-red-400',
  }[ton];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{etykieta}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tonKlasy}`}>{wartosc}</div>
      {podpis && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{podpis}</div>}
    </div>
  );
}
