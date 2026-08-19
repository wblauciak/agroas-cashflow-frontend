import { useQueries, useQuery } from '@tanstack/react-query';
import type { KompensatyFile, Meta, OtwarteFile, ProlongatyFile, Snapshot, SnapshotIndex } from './types';

interface Polaczenie {
  baseUrl: string;
  sas: string;
}

// Tylko do lokalnego dev - w produkcji token przychodzi z /api/token (patrz api/src/functions/token.js),
// wydawany wylacznie zalogowanym uzytkownikom (staticwebapp.config.json gate).
const DEV_BASE_URL = import.meta.env.VITE_DATA_BASE_URL as string | undefined;
const DEV_SAS = import.meta.env.VITE_DATA_SAS as string | undefined;

async function pobierzPolaczenie(): Promise<Polaczenie> {
  if (DEV_BASE_URL && DEV_SAS) {
    return { baseUrl: DEV_BASE_URL, sas: DEV_SAS };
  }

  const resp = await fetch('/api/token');
  if (resp.status === 401) {
    window.location.href = '/.auth/login/aad';
    return await new Promise<Polaczenie>(() => {}); // czekamy na przekierowanie
  }
  if (!resp.ok) {
    throw new Error(`Nie udało się pobrać tokenu dostępu: HTTP ${resp.status}`);
  }
  const dane = (await resp.json()) as { baseUrl: string; sas: string };
  return { baseUrl: dane.baseUrl, sas: dane.sas };
}

/** Token SAS wazny 15 min (produkcja) - odswiezany zanim wygasnie. */
export function usePolaczenie() {
  return useQuery({
    queryKey: ['polaczenie'],
    queryFn: pobierzPolaczenie,
    staleTime: 12 * 60_000,
    refetchInterval: 12 * 60_000,
    retry: 1,
  });
}

async function pobierz<T>(pol: Polaczenie, sciezka: string): Promise<T> {
  const resp = await fetch(`${pol.baseUrl}/${sciezka}?${pol.sas}`);
  if (!resp.ok) {
    throw new Error(`Błąd pobierania ${sciezka}: HTTP ${resp.status}`);
  }
  return (await resp.json()) as T;
}

/**
 * meta.json - jedyny plik odpytywany za kazdym razem (no-cache). Krotki
 * staleTime + refetchInterval, zeby wykryc nowa generacje bez ręcznego
 * odswiezania strony (worker publikuje co godzine w oknie 6-21).
 */
export function useMeta() {
  const pol = usePolaczenie();
  const q = useQuery({
    queryKey: ['meta', pol.data?.sas],
    queryFn: () => pobierz<Meta>(pol.data!, 'meta.json'),
    enabled: !!pol.data,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  return { ...q, isLoading: pol.isLoading || q.isLoading, isError: pol.isError || q.isError, error: pol.error ?? q.error };
}

/** Pliki danych maja hash w nazwie -> bezterminowo cache'owalne po stronie query. */
export function useOtwarte(nazwaPliku: string | undefined) {
  const pol = usePolaczenie();
  const q = useQuery({
    queryKey: ['otwarte', nazwaPliku],
    queryFn: () => pobierz<OtwarteFile>(pol.data!, nazwaPliku!),
    enabled: !!nazwaPliku && !!pol.data,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return { ...q, isLoading: pol.isLoading || q.isLoading, isError: pol.isError || q.isError, error: pol.error ?? q.error };
}

export function useProlongaty(nazwaPliku: string | undefined) {
  const pol = usePolaczenie();
  const q = useQuery({
    queryKey: ['prolongaty', nazwaPliku],
    queryFn: () => pobierz<ProlongatyFile>(pol.data!, nazwaPliku!),
    enabled: !!nazwaPliku && !!pol.data,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return { ...q, isLoading: pol.isLoading || q.isLoading, isError: pol.isError || q.isError, error: pol.error ?? q.error };
}

export function useKompensaty(nazwaPliku: string | undefined) {
  const pol = usePolaczenie();
  const q = useQuery({
    queryKey: ['kompensaty', nazwaPliku],
    queryFn: () => pobierz<KompensatyFile>(pol.data!, nazwaPliku!),
    enabled: !!nazwaPliku && !!pol.data,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return { ...q, isLoading: pol.isLoading || q.isLoading, isError: pol.isError || q.isError, error: pol.error ?? q.error };
}

export function useSnapshotIndex() {
  const pol = usePolaczenie();
  const q = useQuery({
    queryKey: ['snapshot-index'],
    queryFn: () => pobierz<SnapshotIndex>(pol.data!, 'snapshots/index.json'),
    enabled: !!pol.data,
    staleTime: 5 * 60_000,
  });
  return { ...q, isLoading: pol.isLoading || q.isLoading, isError: pol.isError || q.isError, error: pol.error ?? q.error };
}

export function useSnapshot(data: string | undefined) {
  const pol = usePolaczenie();
  const q = useQuery({
    queryKey: ['snapshot', data],
    queryFn: () => pobierz<Snapshot>(pol.data!, `snapshots/${data}.json`),
    enabled: !!data && !!pol.data,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return { ...q, isLoading: pol.isLoading || q.isLoading, isError: pol.isError || q.isError, error: pol.error ?? q.error };
}

/** Historia snapshotow - jeden fetch na dzien, wspoldzielone z useSnapshot przez ten sam queryKey. */
export function useSnapshotHistory(daty: string[]) {
  const pol = usePolaczenie();
  return useQueries({
    queries: daty.map((data) => ({
      queryKey: ['snapshot', data],
      queryFn: () => pobierz<Snapshot>(pol.data!, `snapshots/${data}.json`),
      enabled: !!pol.data,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });
}
