import {
  FLAGA_KONTRAHENT_KANCELARIA,
  FLAGA_KONTRAHENT_ZABLOKOWANY,
  FLAGA_PROLONGATA,
  FLAGA_SPLIT_PAYMENT,
  FLAGA_SPORNA,
  KATEGORIA_NAZWY,
  KIERUNEK_NAZWY,
  type Kompensata,
  type KompensataRow,
  type OtwarteRow,
  type OtwarteSlowniki,
  type Platnosc,
  type Prolongata,
  type ProlongataRow,
  type ProlongatyFile,
} from './types';

export function dekodujPlatnosc(r: OtwarteRow, slowniki: OtwarteSlowniki): Platnosc {
  return {
    dokTyp: r[0],
    dokNumer: r[1],
    lp: r[2],
    kierunek: KIERUNEK_NAZWY[r[3]],
    kategoria: KATEGORIA_NAZWY[r[4]] as Platnosc['kategoria'],
    typZakupu: r[5],
    kntKlucz: r[6],
    dok: r[7],
    dokObcy: r[8],
    seria: slowniki.ser[r[9]],
    dataDok: r[10],
    termin: r[11],
    dni: r[12],
    kubelekLp: r[13],
    waluta: slowniki.wal[r[14]],
    kwota: r[15],
    pozostaje: r[16],
    pozostajePLN: r[17],
    formaPlatnosci: slowniki.frm[r[18]],
    sporna: (r[19] & FLAGA_SPORNA) !== 0,
    splitPayment: (r[19] & FLAGA_SPLIT_PAYMENT) !== 0,
    jestProlongata: (r[19] & FLAGA_PROLONGATA) !== 0,
    kontrahentZablokowany: (r[19] & FLAGA_KONTRAHENT_ZABLOKOWANY) !== 0,
    kontrahentKancelaria: (r[19] & FLAGA_KONTRAHENT_KANCELARIA) !== 0,
    branza: r[20],
  };
}

/**
 * Suma pozostajePLN dla zbioru platnosci - NIGDY nie sumowac elementow
 * rozbicia branzowego tutaj (patrz JSON_Spec sekcja 4, "Pulapka do zapamietania").
 */
export function sumaPLN(platnosci: Iterable<Platnosc>): number {
  let suma = 0;
  for (const p of platnosci) suma += p.pozostajePLN;
  return suma;
}

/**
 * Rozbicie kwoty platnosci po branzach. Dla dokumentow jednobranzowych zwraca
 * jeden wpis rowny pozostajePLN; dla wielobranzowych - rozbicie z tablicy,
 * ktorego suma rowna sie dokladnie pozostajePLN. Do uzycia wylacznie przy
 * agregacji PO BRANZY, nigdy przy sumach ogolnych.
 */
export function rozbicieBranzowe(p: Platnosc): Array<[branzaIdx: number, kwotaGr: number]> {
  return typeof p.branza === 'number' ? [[p.branza, p.pozostajePLN]] : p.branza;
}

export function dekodujProlongate(r: ProlongataRow, statusy: ProlongatyFile['slowniki']['status']): Prolongata {
  return {
    prlnId: r[0],
    rata: r[1],
    dok: r[2],
    nrProlongaty: r[3],
    dokZrodlowy: r[4],
    kntKlucz: r[5],
    dataProlongaty: r[6],
    terminPoProlongacie: r[7],
    kwotaProlongowana: r[8],
    pozostajeDzis: r[9],
    status: statusy[r[10]],
    dataZaplaty: r[11],
    dniOpoznieniaPoProlongacie: r[12],
    kosztDokumentuProlongaty: r[13],
  };
}

export function dekodujKompensate(r: KompensataRow): Kompensata {
  return {
    klucz: r[0],
    nazwa: r[1],
    liczbaKart: r[2],
    pozycjiN: r[3],
    pozycjiZ: r[4],
    naleznosci: r[5],
    zobowiazania: r[6],
    saldoNetto: r[7],
    potencjalKompensaty: r[8],
    potencjalDo30Dni: r[9],
    potencjalWymagalny: r[10],
  };
}
