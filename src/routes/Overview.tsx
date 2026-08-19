import { useMeta } from '../lib/api';
import { KpiCard } from '../components/KpiCard';
import { formatujPLN } from '../lib/format';

function procent(czesc: number, calosc: number): string {
  if (calosc === 0) return '0%';
  return `${((czesc / calosc) * 100).toFixed(1)}%`;
}

export function Overview() {
  const { data: meta, isLoading, isError, error } = useMeta();

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

  return (
    <div className="space-y-6">
      {kpi.prolongatyPoziom3Plus > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Prolongaty poziomu 3+ — kandydaci do windykacji
          </div>
          <div className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            {kpi.prolongatyPozycji3Plus ?? '—'} płatności na {formatujPLN(kpi.prolongatyPoziom3Plus)} — od
            trzeciego poziomu skuteczność prolongat statystycznie się załamuje. Nie kolejny PRG, tylko decyzja.
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Należności
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard etykieta="Razem otwarte" wartosc={formatujPLN(kpi.naleznosci.razem)} podpis={`${kpi.naleznosci.pozycji} pozycji`} />
          <KpiCard
            etykieta="Przeterminowane"
            wartosc={formatujPLN(kpi.naleznosci.przeterminowane)}
            podpis={procent(kpi.naleznosci.przeterminowane, kpi.naleznosci.razem)}
            ton="zly"
          />
          <KpiCard
            etykieta="Luka do 30 dni"
            wartosc={formatujPLN(kpi.lukaDo30Dni)}
            ton={kpi.lukaDo30Dni < 0 ? 'zly' : 'dobry'}
            dymek="Wpływy należności w horyzoncie 30 dni minus wypływy zobowiązań w tym samym oknie, licząc też pozycje już przeterminowane po obu stronach. To łączna luka, nie sama strona należności."
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Zobowiązania
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard etykieta="Razem otwarte" wartosc={formatujPLN(kpi.zobowiazania.razem)} podpis={`${kpi.zobowiazania.pozycji} pozycji`} />
          <KpiCard
            etykieta="Przeterminowane"
            wartosc={formatujPLN(kpi.zobowiazania.przeterminowane)}
            podpis={procent(kpi.zobowiazania.przeterminowane, kpi.zobowiazania.razem)}
            ton="zly"
          />
          <KpiCard
            etykieta="Luka do 7 dni"
            wartosc={formatujPLN(kpi.lukaDo7Dni)}
            ton={kpi.lukaDo7Dni < 0 ? 'zly' : 'dobry'}
            dymek="Wpływy należności minus wypływy zobowiązań w oknie 7 dni, łącznie z pozycjami już przeterminowanymi. Ujemna wartość znaczy, że w tym tygodniu wypływy przewyższają wpływy."
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Kompensaty
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard etykieta="Potencjał łączny" wartosc={formatujPLN(kpi.kompensatyPotencjal)} />
          <KpiCard
            etykieta="W horyzoncie 30 dni"
            wartosc={formatujPLN(kpi.kompensatyDo30Dni)}
            dymek="Potencjał kompensaty, który realnie da się rozliczyć w ciągu 30 dni — nie cały potencjał łączny, którego duża część zapada dopiero za miesiące."
          />
          <KpiCard etykieta="Wymagalne dziś" wartosc={formatujPLN(kpi.kompensatyWymagalne)} ton="zly" />
        </div>
      </section>
    </div>
  );
}
