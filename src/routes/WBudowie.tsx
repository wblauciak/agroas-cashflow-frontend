export function WBudowie({ nazwa }: { nazwa: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      Ekran „{nazwa}" — w budowie.
    </div>
  );
}
