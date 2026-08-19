import { useQuery } from '@tanstack/react-query';

interface ClientPrincipal {
  userDetails: string;
  userRoles: string[];
}

async function pobierzUzytkownika(): Promise<ClientPrincipal | null> {
  const resp = await fetch('/.auth/me');
  if (!resp.ok) return null;
  const dane = (await resp.json()) as { clientPrincipal: ClientPrincipal | null };
  return dane.clientPrincipal;
}

/** Widoczne tylko w produkcji (SWA) - lokalny dev nie ma /.auth/me. */
export function UzytkownikBadge() {
  const { data } = useQuery({
    queryKey: ['auth-me'],
    queryFn: pobierzUzytkownika,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!data) return null;

  const inicjaly = data.userDetails.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {inicjaly}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-slate-700 dark:text-slate-300" title={data.userDetails}>
          {data.userDetails}
        </div>
        <a href="/.auth/logout" className="text-xs text-slate-400 hover:text-slate-700 hover:underline dark:hover:text-slate-100">
          Wyloguj
        </a>
      </div>
    </div>
  );
}
