import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { AlertCircle, CalendarCheck, CalendarClock, CreditCard, Gauge, Handshake, TriangleAlert, Wallet } from 'lucide-react';
import { useMeta, useOtwarte, useSnapshot, useSnapshotIndex } from '../lib/api';
import { dekodujPlatnosc } from '../lib/decode';
import { KpiCard, type Delta } from '../components/KpiCard';
import { formatujPLN } from '../lib/format';

// Kubelki "dzis" (6) do "za 15-30" (9) - to co realnie wplynie/wyplynie w
// najblizsze 30 dni. Przeterminowane (1-5) maja osobna karte; za >30 dni
// (10-11) i brak terminu (0) nie sa tu "nadchodzace".
const KUBELKI_30_DNI = [6, 7, 8, 9];

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

const ETYKIETA_DNIA = new Intl.DateTimeFormat('pl-PL', { weekday: 'short' });
const ETYKIETA_DATY = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' });

function DzienChip({ data, wartosc, dzisiaj }: { data: Date; wartosc: number; dzisiaj: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 text-center ${
        dzisiaj
          ? 'border-transparent shadow-sm'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
      style={dzisiaj ? { background: 'var(--accent-tint)' } : undefined}
    >
      <div className={`text-xs font-medium uppercase ${dzisiaj ? '' : 'text-slate-400 dark:text-slate-500'}`} style={dzisiaj ? { color: 'var(--accent-ink)' } : undefined}>
        {dzisiaj ? 'Dziś' : ETYKIETA_DNIA.format(data)}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500">{ETYKIETA_DATY.format(data)}</div>
      <div className="mt-1.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {formatujPLN(wartosc)}
      </div>
    </div>
  );
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
  const otwarte = useOtwarte(meta?.pliki.otwarte);

  const dataWczoraj = useMemo(() => {
    const dzis = meta?.wygenerowano.slice(0, 10);
    const daty = (index.data?.daty ?? []).filter((d) => !dzis || d < dzis).sort();
    return daty[daty.length - 1];
  }, [index.data, meta?.wygenerowano]);
  const wczoraj = useSnapshot(dataWczoraj);

  const wymagalneW30Dni = useMemo(() => {
    if (!otwarte.data) return null;
    let nal = 0;
    let zob = 0;
    for (const r of otwarte.data.dane) {
      const p = dekodujPlatnosc(r, otwarte.data.slowniki);
      if (p.kategoria !== 'HANDLOWY' || !KUBELKI_30_DNI.includes(p.kubelekLp)) continue;
      if (p.kierunek === 'NALEZNOSC') nal += p.pozostajePLN;
      else zob += p.pozostajePLN;
    }
    return { nal, zob };
  }, [otwarte.data]);

  /**
   * Horyzonty naleznosci liczone z pola `dni` (dni po terminie; ujemne = przed
   * terminem), nie z kubelkow - kubelki maja "za >60 dni" jako jeden worek bez
   * granicy przy 90/180, wiec do dluzszych horyzontow trzeba surowej daty.
   * Kumulatywne: w180 zawiera w90, w90 zawiera w30 - kazdy kolejny to szersze okno.
   */
  const naleznosciHoryzont = useMemo(() => {
    if (!otwarte.data) return null;
    let w7 = 0;
    let w30 = 0;
    let w90 = 0;
    let w180 = 0;
    let przeterminowanePowyzej14 = 0;
    let przeterminowanePowyzej30 = 0;
    const kolejne7Dni = new Array(7).fill(0) as number[];
    for (const r of otwarte.data.dane) {
      const p = dekodujPlatnosc(r, otwarte.data.slowniki);
      if (p.kategoria !== 'HANDLOWY' || p.kierunek !== 'NALEZNOSC' || p.dni === null) continue;
      if (p.dni <= 0) {
        if (p.dni >= -6) {
          w7 += p.pozostajePLN;
          kolejne7Dni[-p.dni] += p.pozostajePLN;
        }
        if (p.dni >= -30) w30 += p.pozostajePLN;
        if (p.dni >= -90) w90 += p.pozostajePLN;
        if (p.dni >= -180) w180 += p.pozostajePLN;
      } else {
        if (p.dni > 14) przeterminowanePowyzej14 += p.pozostajePLN;
        if (p.dni > 30) przeterminowanePowyzej30 += p.pozostajePLN;
      }
    }
    return { w7, w30, w90, w180, przeterminowanePowyzej14, przeterminowanePowyzej30, kolejne7Dni };
  }, [otwarte.data]);

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            etykieta="Razem otwarte"
            wartosc={formatujPLN(kpi.naleznosci.razem)}
            podpis={`${kpi.naleznosci.pozycji} pozycji`}
            ikona={Wallet}
          />
          <KpiCard
            etykieta="Wymagane w 180 dniach"
            wartosc={naleznosciHoryzont ? formatujPLN(naleznosciHoryzont.w180) : '…'}
            ikona={CalendarCheck}
            dymek="Wszystko, co ma termin płatności od dziś do 180 dni w przód (nie licząc już przeterminowanych). Zawiera w sobie kwoty z kart 90, 30 i 7 dni — to szersze okno, nie osobny wycinek."
          />
          <KpiCard
            etykieta="Wymagane w 90 dniach"
            wartosc={naleznosciHoryzont ? formatujPLN(naleznosciHoryzont.w90) : '…'}
            ikona={CalendarCheck}
            dymek="Termin płatności od dziś do 90 dni w przód. Zawiera w sobie kwoty z kart 30 i 7 dni."
          />
          <KpiCard
            etykieta="Wymagane w 30 dniach"
            wartosc={naleznosciHoryzont ? formatujPLN(naleznosciHoryzont.w30) : '…'}
            ikona={CalendarCheck}
            dymek="Termin płatności od dziś do 30 dni w przód — realnie oczekiwany wpływ w najbliższym miesiącu. Zawiera kwotę z karty 7 dni. Bez pozycji już przeterminowanych (osobna karta)."
          />
          <KpiCard
            etykieta="Wymagane w 7 dniach"
            wartosc={naleznosciHoryzont ? formatujPLN(naleznosciHoryzont.w7) : '…'}
            ikona={CalendarCheck}
            dymek="Suma z paska 7 dni poniżej — to co realnie wpłynie w ciągu najbliższego tygodnia, dzień po dniu."
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {naleznosciHoryzont &&
            Array.from({ length: 7 }, (_, offset) => {
              const data = new Date(meta.wygenerowano);
              data.setDate(data.getDate() + offset);
              return (
                <DzienChip
                  key={offset}
                  data={data}
                  wartosc={naleznosciHoryzont.kolejne7Dni[offset]}
                  dzisiaj={offset === 0}
                />
              );
            })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            etykieta="Przeterminowane (ogółem)"
            wartosc={formatujPLN(kpi.naleznosci.przeterminowane)}
            podpis={procent(kpi.naleznosci.przeterminowane, kpi.naleznosci.razem)}
            ton="zly"
            ikona={TriangleAlert}
            delta={w && deltaProcentowa(kpi.naleznosci.przeterminowane, w.naleznosci.przeterminowane, 'spadek')}
          />
          <KpiCard
            etykieta="Przeterminowane powyżej 14 dni"
            wartosc={naleznosciHoryzont ? formatujPLN(naleznosciHoryzont.przeterminowanePowyzej14) : '…'}
            ton="zly"
            ikona={TriangleAlert}
            dymek="Część 'Przeterminowanych ogółem', która czeka na zapłatę już ponad dwa tygodnie po terminie."
          />
          <KpiCard
            etykieta="Przeterminowane powyżej 30 dni"
            wartosc={naleznosciHoryzont ? formatujPLN(naleznosciHoryzont.przeterminowanePowyzej30) : '…'}
            ton="zly"
            ikona={TriangleAlert}
            dymek="Część 'Przeterminowanych powyżej 14 dni', która czeka na zapłatę już ponad miesiąc po terminie — im dłużej, tym mniej prawdopodobne dobrowolne rozliczenie."
          />
          <KpiCard
            etykieta="Luka do 30 dni"
            wartosc={formatujPLN(kpi.lukaDo30Dni)}
            ton={kpi.lukaDo30Dni < 0 ? 'zly' : 'dobry'}
            ikona={Gauge}
            dymek="Wpływy należności w horyzoncie 30 dni minus wypływy zobowiązań w tym samym oknie, licząc też pozycje już przeterminowane po obu stronach. To łączna luka firmy, nie sama strona należności."
          />
          <KpiCard
            etykieta="Luka do 7 dni"
            wartosc={formatujPLN(kpi.lukaDo7Dni)}
            ton={kpi.lukaDo7Dni < 0 ? 'zly' : 'dobry'}
            ikona={Gauge}
            dymek="To samo co luka do 30 dni, tylko w oknie najbliższego tygodnia. Ujemna wartość znaczy, że w tym tygodniu wypływy przewyższają wpływy."
          />
        </div>
      </section>

      <section>
        <NaglowekSekcji ikona={CreditCard} tytul="Zobowiązania" opis="Otwarte pozycje handlowe AGROAS wobec dostawców" kolor="red" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            etykieta="Wymagalne w 30 dni"
            wartosc={wymagalneW30Dni ? formatujPLN(wymagalneW30Dni.zob) : '…'}
            ikona={CalendarCheck}
            dymek="Suma z kubełków 'dziś' do 'za 15-30 dni' — realnie oczekiwany wypływ w najbliższym miesiącu. Bez pozycji już przeterminowanych (osobna karta) i bez tych, które wypłyną dopiero po 30 dniu."
          />
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
