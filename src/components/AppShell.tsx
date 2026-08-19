import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, ArrowLeftRight, Clock, LayoutDashboard, LineChart, Table2 } from 'lucide-react';
import { useMeta } from '../lib/api';
import { FreshnessBadge } from './FreshnessBadge';
import { UzytkownikBadge } from './UzytkownikBadge';

const NAWIGACJA = [
  { do: '/', etykieta: 'Przegląd', opis: 'Kluczowe wskaźniki na dziś', Ikona: LayoutDashboard },
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
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-5 py-5">
          <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">CashFlow</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">AGROAS</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAWIGACJA.map(({ do: sciezka, etykieta, Ikona }) => (
            <NavLink
              key={sciezka}
              to={sciezka}
              end={sciezka === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Ikona size={17} strokeWidth={2} />
              {etykieta}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <UzytkownikBadge />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{biezaca.etykieta}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{biezaca.opis}</p>
          </div>
          {meta.data && <FreshnessBadge wygenerowano={meta.data.wygenerowano} />}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
