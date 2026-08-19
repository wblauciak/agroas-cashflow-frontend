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

  return (
    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <span>{data.userDetails}</span>
      <a href="/.auth/logout" className="text-slate-400 hover:text-slate-700 hover:underline dark:hover:text-slate-100">
        Wyloguj
      </a>
    </div>
  );
}
