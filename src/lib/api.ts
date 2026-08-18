import { useQuery } from '@tanstack/react-query';
import type { KompensatyFile, Meta, OtwarteFile, ProlongatyFile, Snapshot, SnapshotIndex } from './types';

const BASE_URL = import.meta.env.VITE_DATA_BASE_URL as string;
const SAS = import.meta.env.VITE_DATA_SAS as string | undefined;

if (!BASE_URL) {
  throw new Error('VITE_DATA_BASE_URL nie jest ustawione - patrz .env.example');
}

function url(sciezka: string): string {
  const baza = `${BASE_URL}/${sciezka}`;
  return SAS ? `${baza}?${SAS}` : baza;
}

async function pobierz<T>(sciezka: string): Promise<T> {
  const resp = await fetch(url(sciezka));
  if (!resp.ok) {
    throw new Error(`Blad pobierania ${sciezka}: HTTP ${resp.status}`);
  }
  return (await resp.json()) as T;
}

/**
 * meta.json - jedyny plik odpytywany za kazdym razem (no-cache). Krotki
 * staleTime + refetchInterval, zeby wykryc nowa generacje bez ręcznego
 * odswiezania strony (worker publikuje co godzine w oknie 6-21).
 */
export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: () => pobierz<Meta>('meta.json'),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

/** Pliki danych maja hash w nazwie -> bezterminowo cache'owalne po stronie query. */
export function useOtwarte(nazwaPliku: string | undefined) {
  return useQuery({
    queryKey: ['otwarte', nazwaPliku],
    queryFn: () => pobierz<OtwarteFile>(nazwaPliku!),
    enabled: !!nazwaPliku,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useProlongaty(nazwaPliku: string | undefined) {
  return useQuery({
    queryKey: ['prolongaty', nazwaPliku],
    queryFn: () => pobierz<ProlongatyFile>(nazwaPliku!),
    enabled: !!nazwaPliku,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useKompensaty(nazwaPliku: string | undefined) {
  return useQuery({
    queryKey: ['kompensaty', nazwaPliku],
    queryFn: () => pobierz<KompensatyFile>(nazwaPliku!),
    enabled: !!nazwaPliku,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSnapshotIndex() {
  return useQuery({
    queryKey: ['snapshot-index'],
    queryFn: () => pobierz<SnapshotIndex>('snapshots/index.json'),
    staleTime: 5 * 60_000,
  });
}

export function useSnapshot(data: string | undefined) {
  return useQuery({
    queryKey: ['snapshot', data],
    queryFn: () => pobierz<Snapshot>(`snapshots/${data}.json`),
    enabled: !!data,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
