import { NavLink, Outlet } from 'react-router-dom';
import { useMeta } from '../lib/api';
import { FreshnessBadge } from './FreshnessBadge';
import { UzytkownikBadge } from './UzytkownikBadge';

const NAWIGACJA = [
  { do: '/', etykieta: 'Przegląd' },
  { do: '/wiekowanie', etykieta: 'Wiekowanie' },
  { do: '/kompensaty', etykieta: 'Kompensaty' },
  { do: '/prolongaty', etykieta: 'Prolongaty' },
  { do: '/rozrachunki', etykieta: 'Rozrachunki' },
  { do: '/trend', etykieta: 'Trend' },
];

export function AppShell() {
  const meta = useMeta();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">CashFlow AGROAS</h1>
            <nav className="flex gap-1">
              {NAWIGACJA.map((n) => (
                <NavLink
                  key={n.do}
                  to={n.do}
                  end={n.do === '/'}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {n.etykieta}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {meta.data && <FreshnessBadge wygenerowano={meta.data.wygenerowano} />}
            <UzytkownikBadge />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
