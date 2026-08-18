export function StanZapytania({ stan, komunikat }: { stan: 'ladowanie' | 'blad'; komunikat?: string }) {
  if (stan === 'ladowanie') {
    return <div className="text-sm text-slate-500 dark:text-slate-400">Ładowanie danych…</div>;
  }
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      Nie udało się pobrać danych{komunikat ? `: ${komunikat}` : '.'}
    </div>
  );
}
