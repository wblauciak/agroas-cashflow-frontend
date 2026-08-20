import { useEffect, useState } from 'react';

const KLUCZ = 'cashflow-motyw';

function odczytajZapisany(): 'light' | 'dark' | null {
  const zapisany = localStorage.getItem(KLUCZ);
  return zapisany === 'light' || zapisany === 'dark' ? zapisany : null;
}

function preferowanySystemowo(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Motyw jasny/ciemny z reczna nadpisaniem - domyslnie podąża za systemem, zapamietuje wybor w localStorage. */
export function useMotyw() {
  const [motyw, setMotyw] = useState<'light' | 'dark'>(() => odczytajZapisany() ?? preferowanySystemowo());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', motyw);
    localStorage.setItem(KLUCZ, motyw);
  }, [motyw]);

  function przelacz() {
    setMotyw((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  return { motyw, przelacz };
}
