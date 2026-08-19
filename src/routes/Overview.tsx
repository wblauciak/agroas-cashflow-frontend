import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { AlertCircle, CalendarClock, CreditCard, Gauge, Handshake, TriangleAlert, Wallet } from 'lucide-react';
import { useMeta, useSnapshot, useSnapshotIndex } from '../lib/api';
import { KpiCard, type Delta } from '../components/KpiCard';
import { formatujPLN } from '../lib/format';

function procent(czesc: number, calosc: number): string {
  if (calosc === 0) return '0%';
  return `${((czesc / calosc) * 100).toFixed(1)}%`;
}

function deltaProcentowa(dzis: number, wczoraj: number, dobryKierunek: Delta['dobryKierunek']): Delta | undefined {
  if (wczoraj === 0) return undefined;
  const procent = ((dzis - wczoraj) / wczoraj) * 100;
  if (!Number.isFinite(procent)) return undefined;
  return { procent, dobryKierunek, okres: 'vs wczoraj' };
}

function NaglowekSekcji({
  ikona: Ikona,
  tytul,
  opis,
  kolor,
}: {
  ikona: ComponentType<{ size?: number; strokeWidth?: number }>;
  tytul: string;
  opis: string;
  kolor: 'blue' | 'red' | 'violet';
}) {
  const klasy = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
  }[kolor];

  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${klasy}`}>
        <Ikona size={20} strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tytul}</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500">{opis}</p>
      </div>
    </div>
  );
}

export function Overview() {
  const { data: meta, isLoading, isError, error } = useMeta();
  const index = useSnapshotIndex();

  const dataWczoraj = useMemo(() => {
    const dzis = meta?.wygenerowano.slice(0, 10);
    const daty = (index.data?.daty ?? []).filter((d) => !dzis || d < dzis).sort();
    return daty[daty.length - 1];
  }, [index.data, meta?.wygenerowano]);
  const wczoraj = useSnapshot(dataWczoraj);

  if (isLoading) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">Ładowanie danych…</div>;
  }

  if (isError || !meta) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        Nie udało się pobrać meta.json: {error instanceof Error ? error.message : 'nieznany błąd'}
      </div>
    );
  }

  const { kpi } = meta;
  const w = wczoraj.data;

  return (
    <div className="space-y-10">
      {kpi.prolongatyPoziom3Plus > 0 && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-md dark:border-amber-800 dark:bg-amber-950">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            <TriangleAlert size={20} strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Prolongaty poziomu 3+ — kandydaci do windykacji
            </div>
            <div className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              {kpi.prolongatyPozycji3Plus ?? '—'} płatności na {formatujPLN(kpi.prolongatyPoziom3Plus)} — od
              trzeciego poziomu skuteczność prolongat statystycznie się załamuje. Nie kolejny PRG, tylko decyzja.
            </div>
          </div>
        </div>
      )}

      <section>
        <NaglowekSekcji ikona={Wallet} tytul="Należności" opis="Otwarte pozycje handlowe wobec AGROAS" kolor="blue" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            etykieta="Razem otwarte"
            wartosc={formatujPLN(kpi.naleznosci.razem)}
            podpis={`${kpi.naleznosci.pozycji} pozycji`}
            ikona={Wallet}
          />
          <KpiCard
            etykieta="Przeterminowane"
            wartosc={formatujPLN(kpi.naleznosci.przeterminowane)}
            podpis={procent(kpi.naleznosci.przeterminowane, kpi.naleznosci.razem)}
            ton="zly"
            ikona={TriangleAlert}
            delta={w && deltaProcentowa(kpi.naleznosci.przeterminowane, w.naleznosci.przeterminowane, 'spadek')}
          />
          <KpiCard
            etykieta="Luka do 30 dni"
            wartosc={formatujPLN(kpi.lukaDo30Dni)}
            ton={kpi.lukaDo30Dni < 0 ? 'zly' : 'dobry'}
            ikona={Gauge}
            dymek="Wpływy należności w horyzoncie 30 dni minus wypływy zobowiązań w tym samym oknie, licząc też pozycje już przeterminowane po obu stronach. To łączna luka, nie sama strona należności."
          />
        </div>
      </section>

      <section>
        <NaglowekSekcji ikona={CreditCard} tytul="Zobowiązania" opis="Otwarte pozycje handlowe AGROAS wobec dostawców" kolor="red" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            etykieta="Razem otwarte"
            wartosc={formatujPLN(kpi.zobowiazania.razem)}
            podpis={`${kpi.zobowiazania.pozycji} pozycji`}
            ikona={CreditCard}
          />
          <KpiCard
            etykieta="Przeterminowane"
            wartosc={formatujPLN(kpi.zobowiazania.przeterminowane)}
            podpis={procent(kpi.zobowiazania.przeterminowane, kpi.zobowiazania.razem)}
            ton="zly"
            ikona={TriangleAlert}
            delta={w && deltaProcentowa(kpi.zobowiazania.przeterminowane, w.zobowiazania.przeterminowane, 'spadek')}
          />
          <KpiCard
            etykieta="Luka do 7 dni"
            wartosc={formatujPLN(kpi.lukaDo7Dni)}
            ton={kpi.lukaDo7Dni < 0 ? 'zly' : 'dobry'}
            ikona={Gauge}
            dymek="Wpływy należności minus wypływy zobowiązań w oknie 7 dni, łącznie z pozycjami już przeterminowanymi. Ujemna wartość znaczy, że w tym tygodniu wypływy przewyższają wpływy."
          />
        </div>
      </section>

      <section>
        <NaglowekSekcji ikona={Handshake} tytul="Kompensaty" opis="Potencjał potrąceń wzajemnych z kontrahentami" kolor="violet" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard etykieta="Potencjał łączny" wartosc={formatujPLN(kpi.kompensatyPotencjal)} ikona={Handshake} />
          <KpiCard
            etykieta="W horyzoncie 30 dni"
            wartosc={formatujPLN(kpi.kompensatyDo30Dni)}
            ikona={CalendarClock}
            dymek="Potencjał kompensaty, który realnie da się rozliczyć w ciągu 30 dni — nie cały potencjał łączny, którego duża część zapada dopiero za miesiące."
          />
          <KpiCard
            etykieta="Wymagalne dziś"
            wartosc={formatujPLN(kpi.kompensatyWymagalne)}
            ton="zly"
            ikona={AlertCircle}
            delta={w && deltaProcentowa(kpi.kompensatyWymagalne, w.kompensaty.wymagalne, 'spadek')}
          />
        </div>
      </section>
    </div>
  );
}
