/**
 * SYNTHETIC DEMO DATASET
 * ----------------------
 * Every company, fund, bond, account, identifier and price below is fictional and was
 * written by hand for this prototype. Identifiers use a "DM-" prefix so they cannot be
 * confused with real ISINs. Nothing here comes from a real broker, depository, RTA,
 * exchange or Account Aggregator.
 */

export const AS_OF = '2026-10-09';

export type AssetClass =
  | 'Equity'
  | 'ETF'
  | 'Mutual Fund'
  | 'Government Security'
  | 'Corporate Bond'
  | 'REIT'
  | 'InvIT';

export interface Instrument {
  id: string;            // demo identifier (NOT a real ISIN)
  name: string;
  assetClass: AssetClass;
  sector?: string;
  unit: string;
  bond?: { face: number; couponRate: number; maturity: string; frequency: number };
  /** approximate modified duration for debt mutual funds (for what-if simulation) */
  fundDuration?: number;
}

export type SourceKind = 'broker' | 'depository' | 'rta' | 'bond-platform' | 'manual';

export interface DataSource {
  id: string;
  name: string;
  shortName: string;
  kind: SourceKind;
  asOf: string;
  description: string;
  /** whether this source is treated as a holdings source (vs a reconciliation reference) */
  role: 'holding' | 'reference';
  priority: number; // lower = preferred when the same position appears twice
}

export interface SourceRecord {
  id: string;
  sourceId: string;
  instrumentId: string;
  nameAsReported: string;
  accountId: string;     // masked demo account
  quantity: number;
  avgCost: number | null;
  reportedYieldPct?: number;
  note?: string;
  raw: string;           // simulated raw line as it appeared in the source file
}

export interface PriceQuote {
  instrumentId: string;
  price: number;
  priceDate: string;
}

export interface CorporateAction {
  id: string;
  instrumentId: string;
  type: 'split' | 'bonus';
  /** new units received per existing unit after the action (split 1→2 = 2) */
  factor: number;
  exDate: string;
  description: string;
}

export interface Trade {
  id: string;
  sourceId: string;
  instrumentId: string;
  accountId: string;
  date: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
}

export const instruments: Instrument[] = [
  { id: 'DM-EQ-AUR01', name: 'Aurora Infotech Ltd', assetClass: 'Equity', sector: 'IT Services', unit: 'shares' },
  { id: 'DM-EQ-MER01', name: 'Meridian Bank Ltd', assetClass: 'Equity', sector: 'Banking', unit: 'shares' },
  { id: 'DM-EQ-STM01', name: 'Sterling Motors Ltd', assetClass: 'Equity', sector: 'Automobiles', unit: 'shares' },
  { id: 'DM-EQ-KAV01', name: 'Kaveri Pharma Ltd', assetClass: 'Equity', sector: 'Pharmaceuticals', unit: 'shares' },
  { id: 'DM-EQ-DEC01', name: 'Deccan Power Ltd', assetClass: 'Equity', sector: 'Utilities', unit: 'shares' },
  { id: 'DM-ETF-N5001', name: 'Demo Nifty-50 Index ETF', assetClass: 'ETF', sector: 'Index (large cap)', unit: 'units' },
  { id: 'DM-ETF-GLD01', name: 'Demo Gold ETF', assetClass: 'ETF', sector: 'Commodity – Gold', unit: 'units' },
  { id: 'DM-MF-FLX01', name: 'Demo Flexi Cap Fund – Direct Growth', assetClass: 'Mutual Fund', sector: 'Equity – Flexi cap', unit: 'units' },
  { id: 'DM-MF-SDF01', name: 'Demo Short Duration Fund – Direct Growth', assetClass: 'Mutual Fund', sector: 'Debt – Short duration', unit: 'units', fundDuration: 2.4 },
  {
    id: 'DM-GS-2034', name: 'Demo 7.10% GS 2034', assetClass: 'Government Security', sector: 'Central Govt. dated security', unit: 'units (FV ₹100)',
    bond: { face: 100, couponRate: 0.071, maturity: '2034-04-15', frequency: 2 },
  },
  {
    id: 'DM-NCD-INF29', name: 'Demo Infra Finance 8.40% NCD 2029', assetClass: 'Corporate Bond', sector: 'NBFC – Infrastructure', unit: 'units (FV ₹1,000)',
    bond: { face: 1000, couponRate: 0.084, maturity: '2029-11-30', frequency: 1 },
  },
  {
    id: 'DM-NCD-HSG31', name: 'Demo Housing Finance 7.95% Bond 2031', assetClass: 'Corporate Bond', sector: 'HFC', unit: 'units (FV ₹1,000)',
    bond: { face: 1000, couponRate: 0.0795, maturity: '2031-06-30', frequency: 1 },
  },
  { id: 'DM-REIT-OFC01', name: 'Demo Office Parks REIT', assetClass: 'REIT', sector: 'Commercial real estate', unit: 'units' },
  { id: 'DM-INVIT-HWY01', name: 'Demo Highways InvIT', assetClass: 'InvIT', sector: 'Toll roads', unit: 'units' },
];

export const sources: DataSource[] = [
  {
    id: 'BRK_A', name: 'Demo Broker A – Holdings statement', shortName: 'Broker A', kind: 'broker', asOf: '2026-10-09',
    description: 'Synthetic end-of-day holdings statement from a fictional stockbroker (demat ••4471).', role: 'holding', priority: 1,
  },
  {
    id: 'BRK_B', name: 'Demo Broker B – Holdings statement', shortName: 'Broker B', kind: 'broker', asOf: '2026-10-08',
    description: 'Synthetic holdings statement from a second fictional broker (demat ••9025).', role: 'holding', priority: 1,
  },
  {
    id: 'BND_P', name: 'Demo Bond Platform – Statement', shortName: 'Bond Platform', kind: 'bond-platform', asOf: '2026-10-09',
    description: 'Synthetic statement from a fictional online bond platform (demat ••6610).', role: 'holding', priority: 1,
  },
  {
    id: 'RTA', name: 'Demo RTA – Mutual fund statement', shortName: 'MF RTA', kind: 'rta', asOf: '2026-10-09',
    description: 'Synthetic mutual-fund account statement from a fictional registrar (folio ••3318).', role: 'holding', priority: 1,
  },
  {
    id: 'CSV', name: 'Demo Tracker App – Manual CSV import', shortName: 'Tracker CSV', kind: 'manual', asOf: '2026-10-05',
    description: 'A spreadsheet the user exported from a fictional portfolio-tracker app and imported manually.', role: 'holding', priority: 3,
  },
  {
    id: 'CAS', name: 'Demo Consolidated Account Statement (depository-style)', shortName: 'CAS', kind: 'depository', asOf: '2026-09-30',
    description: 'Synthetic month-end consolidated statement covering all demat accounts and MF folios. Used as the reconciliation reference.', role: 'reference', priority: 0,
  },
];

export const records: SourceRecord[] = [
  // ── Broker A (demat ••4471) ─────────────────────────────────────────
  { id: 'r1', sourceId: 'BRK_A', instrumentId: 'DM-EQ-AUR01', nameAsReported: 'Aurora Infotech Ltd', accountId: 'DP ••4471', quantity: 150, avgCost: 1432.0, raw: 'AURORA INFOTECH LTD | DM-EQ-AUR01 | QTY 150 | AVG 1432.00' },
  { id: 'r2', sourceId: 'BRK_A', instrumentId: 'DM-EQ-MER01', nameAsReported: 'Meridian Bank Ltd', accountId: 'DP ••4471', quantity: 200, avgCost: 1580.0, raw: 'MERIDIAN BANK LTD | DM-EQ-MER01 | QTY 200 | AVG 1580.00' },
  { id: 'r3', sourceId: 'BRK_A', instrumentId: 'DM-ETF-N5001', nameAsReported: 'Demo Nifty-50 Index ETF', accountId: 'DP ••4471', quantity: 400, avgCost: 241.3, raw: 'DEMO NIFTY50 ETF | DM-ETF-N5001 | QTY 400 | AVG 241.30' },
  { id: 'r4', sourceId: 'BRK_A', instrumentId: 'DM-ETF-GLD01', nameAsReported: 'Demo Gold ETF', accountId: 'DP ••4471', quantity: 250, avgCost: 61.2, raw: 'DEMO GOLD ETF | DM-ETF-GLD01 | QTY 250 | AVG 61.20' },
  { id: 'r5', sourceId: 'BRK_A', instrumentId: 'DM-REIT-OFC01', nameAsReported: 'Demo Office Parks REIT', accountId: 'DP ••4471', quantity: 300, avgCost: 318.0, raw: 'DEMO OFFICE PARKS REIT | DM-REIT-OFC01 | QTY 300 | AVG 318.00' },

  // ── Broker B (demat ••9025) ─────────────────────────────────────────
  { id: 'r6', sourceId: 'BRK_B', instrumentId: 'DM-EQ-STM01', nameAsReported: 'Sterling Motors Ltd', accountId: 'DP ••9025', quantity: 80, avgCost: 2100.0, raw: 'STERLING MOTORS LTD,DM-EQ-STM01,80,2100.00' },
  { id: 'r7', sourceId: 'BRK_B', instrumentId: 'DM-EQ-KAV01', nameAsReported: 'Kaveri Pharma Ltd', accountId: 'DP ••9025', quantity: 60, avgCost: null, note: 'Off-market transfer-in on 14-Feb-2025 (gift from family member)', raw: 'KAVERI PHARMA LTD,DM-EQ-KAV01,60,—' },
  { id: 'r8', sourceId: 'BRK_B', instrumentId: 'DM-EQ-DEC01', nameAsReported: 'Deccan Power Ltd', accountId: 'DP ••9025', quantity: 300, avgCost: 288.0, raw: 'DECCAN POWER LTD,DM-EQ-DEC01,300,288.00' },
  { id: 'r9', sourceId: 'BRK_B', instrumentId: 'DM-INVIT-HWY01', nameAsReported: 'Demo Highways InvIT', accountId: 'DP ••9025', quantity: 500, avgCost: 131.5, raw: 'DEMO HIGHWAYS INVIT,DM-INVIT-HWY01,500,131.50' },

  // ── Bond platform (demat ••6610) ────────────────────────────────────
  { id: 'r10', sourceId: 'BND_P', instrumentId: 'DM-GS-2034', nameAsReported: '7.10% GS 2034 (Demo)', accountId: 'DP ••6610', quantity: 500, avgCost: 99.4, raw: 'GSEC 7.10% 2034 | 500 | 99.40' },
  { id: 'r11', sourceId: 'BND_P', instrumentId: 'DM-NCD-INF29', nameAsReported: 'Demo Infra Fin 8.40% 2029', accountId: 'DP ••6610', quantity: 40, avgCost: 1000.0, raw: 'INFRA FIN 8.40% NCD 2029 | 40 | 1000.00 | LTP 1012.50 (11-Sep)' },
  { id: 'r12', sourceId: 'BND_P', instrumentId: 'DM-NCD-HSG31', nameAsReported: 'Demo Housing Fin 7.95% 2031', accountId: 'DP ••6610', quantity: 50, avgCost: 975.0, reportedYieldPct: 7.95, raw: 'HOUSING FIN 7.95% 2031 | 50 | 975.00 | YIELD 7.95%' },

  // ── MF RTA (folio ••3318) ───────────────────────────────────────────
  { id: 'r13', sourceId: 'RTA', instrumentId: 'DM-MF-FLX01', nameAsReported: 'Demo Flexi Cap Fund - Direct - Growth', accountId: 'Folio ••3318', quantity: 1245.632, avgCost: 98.42, raw: 'Demo Flexi Cap Fund-Dir-G | Units 1245.632 | Cost NAV 98.42' },
  { id: 'r14', sourceId: 'RTA', instrumentId: 'DM-MF-SDF01', nameAsReported: 'Demo Short Duration Fund - Direct - Growth', accountId: 'Folio ••3318', quantity: 2860.115, avgCost: 41.08, raw: 'Demo Short Duration Fund-Dir-G | Units 2860.115 | Cost NAV 41.08' },

  // ── Manual tracker CSV (claims demat ••4471) ────────────────────────
  { id: 'r15', sourceId: 'CSV', instrumentId: 'DM-EQ-MER01', nameAsReported: 'MERIDIAN BK LTD', accountId: 'DP ••4471', quantity: 200, avgCost: 1580.0, raw: '"MERIDIAN BK LTD","DM-EQ-MER01","4471",200,1580' },

  // ── CAS – reconciliation reference (as of 30-Sep) ──────────────────
  { id: 'c1', sourceId: 'CAS', instrumentId: 'DM-EQ-AUR01', nameAsReported: 'AURORA INFOTECH LIMITED', accountId: 'DP ••4471', quantity: 120, avgCost: null, raw: 'AURORA INFOTECH LIMITED  DM-EQ-AUR01  120.000' },
  { id: 'c2', sourceId: 'CAS', instrumentId: 'DM-EQ-MER01', nameAsReported: 'MERIDIAN BANK LIMITED', accountId: 'DP ••4471', quantity: 200, avgCost: null, raw: 'MERIDIAN BANK LIMITED  DM-EQ-MER01  200.000' },
  { id: 'c3', sourceId: 'CAS', instrumentId: 'DM-ETF-N5001', nameAsReported: 'DEMO NIFTY 50 ETF', accountId: 'DP ••4471', quantity: 400, avgCost: null, raw: 'DEMO NIFTY 50 ETF  DM-ETF-N5001  400.000' },
  { id: 'c4', sourceId: 'CAS', instrumentId: 'DM-ETF-GLD01', nameAsReported: 'DEMO GOLD ETF', accountId: 'DP ••4471', quantity: 250, avgCost: null, raw: 'DEMO GOLD ETF  DM-ETF-GLD01  250.000' },
  { id: 'c5', sourceId: 'CAS', instrumentId: 'DM-REIT-OFC01', nameAsReported: 'DEMO OFFICE PARKS REIT', accountId: 'DP ••4471', quantity: 300, avgCost: null, raw: 'DEMO OFFICE PARKS REIT  DM-REIT-OFC01  300.000' },
  { id: 'c6', sourceId: 'CAS', instrumentId: 'DM-EQ-STM01', nameAsReported: 'STERLING MOTORS LIMITED', accountId: 'DP ••9025', quantity: 160, avgCost: null, raw: 'STERLING MOTORS LIMITED  DM-EQ-STM01  160.000' },
  { id: 'c7', sourceId: 'CAS', instrumentId: 'DM-EQ-KAV01', nameAsReported: 'KAVERI PHARMA LIMITED', accountId: 'DP ••9025', quantity: 60, avgCost: null, raw: 'KAVERI PHARMA LIMITED  DM-EQ-KAV01  60.000' },
  { id: 'c8', sourceId: 'CAS', instrumentId: 'DM-EQ-DEC01', nameAsReported: 'DECCAN POWER LIMITED', accountId: 'DP ••9025', quantity: 300, avgCost: null, raw: 'DECCAN POWER LIMITED  DM-EQ-DEC01  300.000' },
  { id: 'c9', sourceId: 'CAS', instrumentId: 'DM-INVIT-HWY01', nameAsReported: 'DEMO HIGHWAYS INVIT', accountId: 'DP ••9025', quantity: 500, avgCost: null, raw: 'DEMO HIGHWAYS INVIT  DM-INVIT-HWY01  500.000' },
  { id: 'c10', sourceId: 'CAS', instrumentId: 'DM-GS-2034', nameAsReported: 'GOI 7.10% 2034 (DEMO)', accountId: 'DP ••6610', quantity: 500, avgCost: null, raw: 'GOI 7.10% 2034 (DEMO)  DM-GS-2034  500.000' },
  { id: 'c11', sourceId: 'CAS', instrumentId: 'DM-NCD-INF29', nameAsReported: 'DEMO INFRA FIN 8.40% NCD 2029', accountId: 'DP ••6610', quantity: 40, avgCost: null, raw: 'DEMO INFRA FIN 8.40% NCD 2029  DM-NCD-INF29  40.000' },
  { id: 'c12', sourceId: 'CAS', instrumentId: 'DM-NCD-HSG31', nameAsReported: 'DEMO HOUSING FIN 7.95% 2031', accountId: 'DP ••6610', quantity: 50, avgCost: null, raw: 'DEMO HOUSING FIN 7.95% 2031  DM-NCD-HSG31  50.000' },
  { id: 'c13', sourceId: 'CAS', instrumentId: 'DM-MF-FLX01', nameAsReported: 'Demo Flexi Cap Fund - Direct Plan - Growth', accountId: 'Folio ••3318', quantity: 1245.63, avgCost: null, raw: 'Demo Flexi Cap Fund - Direct Plan - Growth   Units: 1,245.630' },
  { id: 'c14', sourceId: 'CAS', instrumentId: 'DM-MF-SDF01', nameAsReported: 'Demo Short Duration Fund - Direct Plan - Growth', accountId: 'Folio ••3318', quantity: 2860.115, avgCost: null, raw: 'Demo Short Duration Fund - Direct Plan - Growth   Units: 2,860.115' },
];

export const prices: PriceQuote[] = [
  { instrumentId: 'DM-EQ-AUR01', price: 1538.4, priceDate: '2026-10-09' },
  { instrumentId: 'DM-EQ-MER01', price: 1642.25, priceDate: '2026-10-09' },
  { instrumentId: 'DM-EQ-STM01', price: 1240.0, priceDate: '2026-10-09' },
  { instrumentId: 'DM-EQ-KAV01', price: 2215.6, priceDate: '2026-10-09' },
  { instrumentId: 'DM-EQ-DEC01', price: 311.75, priceDate: '2026-10-09' },
  { instrumentId: 'DM-ETF-N5001', price: 268.5, priceDate: '2026-10-09' },
  { instrumentId: 'DM-ETF-GLD01', price: 78.4, priceDate: '2026-10-09' },
  { instrumentId: 'DM-MF-FLX01', price: 112.87, priceDate: '2026-10-09' },
  { instrumentId: 'DM-MF-SDF01', price: 44.31, priceDate: '2026-10-09' },
  { instrumentId: 'DM-GS-2034', price: 101.2, priceDate: '2026-10-09' },
  { instrumentId: 'DM-NCD-INF29', price: 1012.5, priceDate: '2026-09-11' },
  { instrumentId: 'DM-NCD-HSG31', price: 968.0, priceDate: '2026-10-09' },
  { instrumentId: 'DM-REIT-OFC01', price: 342.1, priceDate: '2026-10-09' },
  { instrumentId: 'DM-INVIT-HWY01', price: 138.2, priceDate: '2026-10-09' },
];

export const PRICE_SOURCE = 'Demo EOD price file (synthetic)';

export const corporateActions: CorporateAction[] = [
  {
    id: 'ca1', instrumentId: 'DM-EQ-STM01', type: 'split', factor: 2, exDate: '2026-09-22',
    description: 'Stock split 1:2 — face value ₹10 → ₹5. Each share became 2 shares; price roughly halves.',
  },
];

export const trades: Trade[] = [
  { id: 't1', sourceId: 'BRK_A', instrumentId: 'DM-EQ-AUR01', accountId: 'DP ••4471', date: '2026-10-06', side: 'BUY', quantity: 30, price: 1512.0 },
  { id: 't2', sourceId: 'BRK_A', instrumentId: 'DM-ETF-N5001', accountId: 'DP ••4471', date: '2026-08-18', side: 'BUY', quantity: 100, price: 255.1 },
];

export const instrumentById = Object.fromEntries(instruments.map((i) => [i.id, i])) as Record<string, Instrument>;
export const sourceById = Object.fromEntries(sources.map((s) => [s.id, s])) as Record<string, DataSource>;
export const priceById = Object.fromEntries(prices.map((p) => [p.instrumentId, p])) as Record<string, PriceQuote>;
