import type { ComponentType, ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

const TON_STYL = {
  neutralny: {
    karta: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    tekst: 'text-slate-900 dark:text-slate-100',
    plakietka: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    pigulka: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  dobry: {
    karta: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    tekst: 'text-emerald-600 dark:text-emerald-400',
    plakietka: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    pigulka: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  zly: {
    karta: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    tekst: 'text-red-600 dark:text-red-400',
    plakietka: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    pigulka: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  /** Kolor tozsamosci Naleznosci - ten sam niebieski co chart-nal / plakietka Rozrachunkow. */
  naleznosc: {
    karta: 'border-blue-100 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20',
    tekst: 'text-blue-600 dark:text-blue-400',
    plakietka: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    pigulka: 'bg-white text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  /** Kolor tozsamosci Zobowiazan - ten sam czerwony co chart-zob / plakietka Rozrachunkow. */
  zobowiazanie: {
    karta: 'border-red-100 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20',
    tekst: 'text-red-600 dark:text-red-400',
    plakietka: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
    pigulka: 'bg-white text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  /** Przeterminowane - swiadomie INNY odcien niz "zobowiazanie", zeby nie ginac
      wsrod zwyklych czerwonych kart Zobowiazan (patrz feedback uzytkownika). */
  ostrzezenie: {
    karta: 'border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/25',
    tekst: 'text-rose-600 dark:text-rose-400',
    plakietka: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    pigulka: 'bg-white text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
} as const;

export interface Delta {
  procent: number;
  /** Ktory kierunek zmiany jest dobry - okresla kolor strzalki, nie sam znak liczby. */
  dobryKierunek: 'wzrost' | 'spadek';
  /** Etykieta okresu porownania, np. "vs wczoraj". */
  okres: string;
}

function PigulkaDelty({ delta }: { delta: Delta }) {
  const wzrost = delta.procent >= 0;
  const dobry = wzrost === (delta.dobryKierunek === 'wzrost');
  const klasy = dobry
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
  const Strzalka = wzrost ? ArrowUp : ArrowDown;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${klasy}`}>
      <Strzalka size={12} strokeWidth={2.5} />
      {Math.abs(delta.procent).toFixed(1)}% <span className="font-normal opacity-80">{delta.okres}</span>
    </span>
  );
}

export function KpiCard({
  etykieta,
  wartosc,
  podpis,
  ton = 'neutralny',
  dymek,
  ikona: Ikona,
  delta,
  kancelaria,
}: {
  etykieta: string;
  wartosc: string;
  podpis?: string;
  ton?: 'neutralny' | 'dobry' | 'zly' | 'naleznosc' | 'zobowiazanie' | 'ostrzezenie';
  dymek?: ReactNode;
  ikona?: ComponentType<{ size?: number; strokeWidth?: number }>;
  delta?: Delta;
  /** Kwota (sformatowana) z dokumentow kontrahentow przekazanych do kancelarii - pokazana jako osobna pigulka. */
  kancelaria?: string;
}) {
  const styl = TON_STYL[ton];

  return (
    <div className={`min-w-0 rounded-2xl border p-6 shadow-md transition-shadow hover:shadow-lg ${styl.karta}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5 text-sm font-medium leading-snug text-slate-500 dark:text-slate-400">
          <span>{etykieta}</span>
          {dymek && (
            <span className="mt-0.5 shrink-0">
              <InfoTooltip>{dymek}</InfoTooltip>
            </span>
          )}
        </div>
        {Ikona && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styl.plakietka}`}>
            <Ikona size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className={`mt-3 overflow-hidden text-ellipsis whitespace-nowrap text-right text-xl font-semibold tracking-tight tabular-nums ${styl.tekst}`}>
        {wartosc}
      </div>
      {(podpis || delta || kancelaria) && (
        <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5">
          {podpis && <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styl.pigulka}`}>{podpis}</span>}
          {delta && <PigulkaDelty delta={delta} />}
          {kancelaria && (
            <span
              className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              title="Kwota z dokumentów kontrahentów przekazanych do kancelarii prawnej (windykacja sądowa/komornicza)"
            >
              w tym kancelaria: {kancelaria}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
