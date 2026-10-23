function escapujPole(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    // Separator pol to srednik (nie przecinek), wiec liczby moga uzywac przecinka
    // jako separatora dziesietnego - tak jak oczekuje polski Excel. Bez grupowania
    // tysiecy, zeby uniknac dwuznacznosci przy imporcie.
    return v.toLocaleString('pl-PL', { maximumFractionDigits: 2, useGrouping: false });
  }
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Excel w PL locale oczekuje sredniowanika jako separatora i BOM dla polskich znakow. */
export function pobierzCsv(nazwaPliku: string, naglowki: string[], wiersze: unknown[][]) {
  const linie = [naglowki, ...wiersze].map((w) => w.map(escapujPole).join(';'));
  const tresc = '﻿' + linie.join('\r\n');
  const blob = new Blob([tresc], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nazwaPliku;
  a.click();
  URL.revokeObjectURL(url);
}
