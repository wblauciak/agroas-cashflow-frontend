import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, ArrowLeftRight, Clock, CreditCard, LayoutDashboard, LineChart, Table2, Wallet } from 'lucide-react';
import { useMeta } from '../lib/api';
import { FreshnessBadge } from './FreshnessBadge';
import { UzytkownikBadge } from './UzytkownikBadge';

const NAWIGACJA = [
  { do: '/', etykieta: 'Przegląd', opis: 'Kluczowe wskaźniki na dziś', Ikona: LayoutDashboard },
  { do: '/naleznosci', etykieta: 'Należności', opis: 'Rozbicie wg terminów i grup produktowych', Ikona: Wallet },
  { do: '/zobowiazania', etykieta: 'Zobowiązania', opis: 'Rozbicie wg terminów i grup produktowych', Ikona: CreditCard },
  { do: '/wiekowanie', etykieta: 'Wiekowanie', opis: 'Rozkład terminów płatności', Ikona: BarChart3 },
  { do: '/kompensaty', etykieta: 'Kompensaty', opis: 'Potencjał potrąceń wzajemnych', Ikona: ArrowLeftRight },
  { do: '/prolongaty', etykieta: 'Prolongaty', opis: 'Skuteczność wydłużonych terminów', Ikona: Clock },
  { do: '/rozrachunki', etykieta: 'Rozrachunki', opis: 'Pełna lista otwartych płatności', Ikona: Table2 },
  { do: '/trend', etykieta: 'Trend', opis: 'Przeterminowanie w czasie', Ikona: LineChart },
];

export function AppShell() {
  const meta = useMeta();
  const location = useLocation();
  const biezaca = NAWIGACJA.find((n) => (n.do === '/' ? location.pathname === '/' : location.pathname.startsWith(n.do))) ?? NAWIGACJA[0];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 px-5 py-6">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--accent)' }}
          >
            CF
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">CashFlow</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">AGROAS</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAWIGACJA.map(({ do: sciezka, etykieta, Ikona }) => (
            <NavLink
              key={sciezka}
              to={sciezka}
              end={sciezka === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`
              }
              style={({ isActive }) => (isActive ? { background: 'var(--accent-tint)', color: 'var(--accent-ink)' } : undefined)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full" style={{ background: 'var(--accent)' }} />
                  )}
                  <Ikona size={18} strokeWidth={2} />
                  {etykieta}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <UzytkownikBadge />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{biezaca.etykieta}</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500">{biezaca.opis}</p>
          </div>
          {meta.data && <FreshnessBadge wygenerowano={meta.data.wygenerowano} />}
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-8 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
