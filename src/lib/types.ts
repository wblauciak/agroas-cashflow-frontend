// Typy odpowiadaja 1:1 strukturze opisanej w docs/CashFlow_JSON_Spec.md.
// Kazda zmiana schematu po stronie workera musi tu znalezc odzwierciedlenie.

export interface Meta {
  schemaVersion: number;
  wygenerowano: string;
  zrodloDanych: string;
  nastepneOdswiezenie?: string;
  pliki: {
    otwarte: string;
    prolongaty: string;
    kompensaty: string;
  };
  liczby: {
    otwarte: number;
    prolongaty: number;
    kompensaty: number;
  };
  kpi: {
    naleznosci: { razem: number; przeterminowane: number; pozycji: number };
    zobowiazania: { razem: number; przeterminowane: number; pozycji: number };
    lukaDo7Dni: number;
    lukaDo14Dni: number;
    lukaDo30Dni: number;
    kompensatyPotencjal: number;
    kompensatyDo30Dni: number;
    kompensatyWymagalne: number;
    prolongatyOtwarte: number;
    prolongatyPoziom3Plus: number;
    prolongatyPozycji3Plus?: number;
  };
}

export interface KubelekDef {
  lp: number;
  nazwa: string;
  grupa: 'brak' | 'przeterminowane' | 'dzis' | 'przyszle';
}

export interface KontrahentDane {
  akronim: string;
  nazwa: string;
  nip: string | null;
  limit: number;
  limitPoTerminie: number;
}

export interface OtwarteSlowniki {
  knt: { pola: string[]; dane: Record<string, [string, string, string | null, number, number]> };
  brn: string[];
  ser: string[];
  frm: string[];
  wal: string[];
  kub: KubelekDef[];
}

export interface OtwarteFile {
  schemaVersion: number;
  wygenerowano: string;
  pola: string[];
  slowniki: OtwarteSlowniki;
  dane: OtwarteRow[];
}

// Krotka pozycyjna - patrz OtwarteFile.pola dla kolejnosci; typ tu jest
// dokumentacyjny, dekodowanie na obiekt robi decode.ts.
export type OtwarteRow = [
  dokTyp: number,
  dokNumer: number,
  lp: number,
  kier: 0 | 1,
  kat: number,
  typZak: number,
  knt: number,
  dok: string,
  dokObcy: string | null,
  ser: number,
  dataDok: number | null,
  termin: number | null,
  dni: number | null,
  kub: number,
  wal: number,
  kwota: number,
  pozostaje: number,
  pozostajePLN: number,
  frm: number,
  flagi: number,
  brn: number | Array<[number, number]>,
];

export interface Platnosc {
  dokTyp: number;
  dokNumer: number;
  lp: number;
  kierunek: 'ZOBOWIAZANIE' | 'NALEZNOSC';
  kategoria: 'HANDLOWY' | 'PODATKI' | 'KASA_BANK' | 'PROLONGATA';
  typZakupu: number;
  kntKlucz: number;
  dok: string;
  dokObcy: string | null;
  seria: string;
  dataDok: number | null;
  termin: number | null;
  dni: number | null;
  kubelekLp: number;
  waluta: string;
  kwota: number;
  pozostaje: number;
  pozostajePLN: number;
  formaPlatnosci: string;
  sporna: boolean;
  splitPayment: boolean;
  jestProlongata: boolean;
  kontrahentZablokowany: boolean;
  kontrahentKancelaria: boolean;
  branza: number | Array<[number, number]>;
}

export interface ProlongatyFile {
  schemaVersion: number;
  pola: string[];
  slowniki: { status: string[] };
  dane: ProlongataRow[];
}

export type ProlongataRow = [
  prlnId: number,
  rata: number,
  dok: string,
  nr: number,
  dokZrodlowy: string | null,
  knt: number,
  dataProl: number | null,
  termin: number | null,
  kwota: number,
  pozostaje: number,
  status: number,
  dataZaplaty: number | null,
  dniOpoznienia: number | null,
  koszt: number,
  terminPierwotny: number | null,
  stopaProcentowa: number | null,
  dniZwlokiPierwotne: number | null,
  kwotaOdsetek: number,
];

export interface Prolongata {
  prlnId: number;
  rata: number;
  dok: string;
  nrProlongaty: number;
  dokZrodlowy: string | null;
  kntKlucz: number;
  dataProlongaty: number | null;
  terminPoProlongacie: number | null;
  kwotaProlongowana: number;
  pozostajeDzis: number;
  status: string;
  dataZaplaty: number | null;
  dniOpoznieniaPoProlongacie: number | null;
  kosztDokumentuProlongaty: number;
  /** Termin platnosci oryginalnej faktury, sprzed tej prolongaty. */
  terminPierwotny: number | null;
  stopaProcentowa: number | null;
  dniZwlokiPierwotne: number | null;
  kwotaOdsetek: number;
}

export interface KompensatyFile {
  schemaVersion: number;
  pola: string[];
  dane: KompensataRow[];
}

export type KompensataRow = [
  klucz: string,
  nazwa: string,
  kart: number,
  pozN: number,
  pozZ: number,
  naleznosci: number,
  zobowiazania: number,
  saldo: number,
  potencjal: number,
  potencjalDo30Dni: number,
  potencjalWymagalny: number,
];

export interface Kompensata {
  klucz: string;
  nazwa: string;
  liczbaKart: number;
  pozycjiN: number;
  pozycjiZ: number;
  naleznosci: number;
  zobowiazania: number;
  saldoNetto: number;
  potencjalKompensaty: number;
  potencjalDo30Dni: number;
  potencjalWymagalny: number;
}

export interface SnapshotIndex {
  daty: string[];
}

export interface Snapshot {
  data: string;
  wygenerowano: string;
  naleznosci: { razem: number; przeterminowane: number; pozycji: number };
  zobowiazania: { razem: number; przeterminowane: number; pozycji: number };
  kubelki: { nal: number[]; zob: number[] };
  branze: { nal: Record<string, number>; zob: Record<string, number> };
  kompensaty: { potencjal: number; do30dni: number; wymagalne: number };
  prolongaty: { otwarte: number; poziom3plus: number; pozycji3plus: number };
}

// Maska bitowa pola `flagi` w otwarte.<hash>.json - patrz JSON_Spec sekcja 4.
export const FLAGA_SPORNA = 1;
export const FLAGA_SPLIT_PAYMENT = 2;
export const FLAGA_PROLONGATA = 4;
export const FLAGA_KONTRAHENT_ZABLOKOWANY = 8;
export const FLAGA_KONTRAHENT_KANCELARIA = 16;

export const KATEGORIA_NAZWY = ['HANDLOWY', 'PODATKI', 'KASA_BANK', 'PROLONGATA'] as const;
export const KIERUNEK_NAZWY = ['ZOBOWIAZANIE', 'NALEZNOSC'] as const;
