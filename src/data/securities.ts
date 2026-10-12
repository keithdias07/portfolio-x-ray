/**
 * SYNTHETIC SECURITY MASTER
 * -------------------------
 * Every company, fund, bond, identifier and price below is fictional and was written by hand
 * for this prototype. Identifiers use a "DM-" prefix so they cannot be confused with real ISINs.
 * Per-person accounts and holdings live in src/personas/*.json.
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

/** The four broad classes the suitability engine works with (plus "other" for unmatched securities). */
export type BroadClass = 'equity' | 'debt' | 'gold' | 'cash' | 'other';

export type InstrumentType =
  | 'Direct stock'
  | 'Equity fund'
  | 'Debt fund'
  | 'Index ETF'
  | 'Gold ETF'
  | 'Government security'
  | 'Corporate bond'
  | 'REIT'
  | 'InvIT'
  | 'Fixed deposit'
  | 'Savings account'
  | 'Manual entry'
  | 'Other';

/** Keys into the tax rule table (src/config/tax.ts). */
export type TaxRule = 'equity' | 'slab' | 'gold' | 'reit-invit' | 'savings';

export interface Instrument {
  id: string;            // demo identifier (NOT a real ISIN)
  name: string;
  assetClass: AssetClass;
  instrumentType: InstrumentType;
  broadClass: BroadClass;
  taxRule: TaxRule;
  sector?: string;
  unit: string;
  /** names and tickers different sources use for the same security */
  aliases: string[];
  bond?: { face: number; couponRate: number; maturity: string; frequency: number };
  fundDuration?: number;
}

export type SourceKind = 'broker' | 'depository' | 'rta' | 'bond-platform' | 'manual' | 'bank';

export interface DataSource {
  id: string;
  name: string;
  shortName: string;
  kind: SourceKind;
  asOf: string;
  description: string;
  role: 'holding' | 'reference';
  priority: number; // lower = preferred when the same position appears twice
}

export interface SourceRecord {
  id: string;
  sourceId: string;
  instrumentId: string;
  nameAsReported: string;
  accountId: string;
  quantity: number;
  avgCost: number | null;
  purchaseDate?: string | null;
  reportedYieldPct?: number;
  note?: string;
  raw: string;
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
  { id: 'DM-EQ-AUR01', name: 'Aurora Infotech Ltd', assetClass: 'Equity', instrumentType: 'Direct stock', broadClass: 'equity', taxRule: 'equity', sector: 'IT Services', unit: 'shares', aliases: ['AURORA INFOTECH LTD', 'AURORA INFOTECH LIMITED', 'AURORAINFO'] },
  { id: 'DM-EQ-MER01', name: 'Meridian Bank Ltd', assetClass: 'Equity', instrumentType: 'Direct stock', broadClass: 'equity', taxRule: 'equity', sector: 'Banking', unit: 'shares', aliases: ['MERIDIAN BANK LTD', 'MERIDIAN BANK LIMITED', 'MERIDIAN BK LTD', 'MERIDIANBK'] },
  { id: 'DM-EQ-STM01', name: 'Sterling Motors Ltd', assetClass: 'Equity', instrumentType: 'Direct stock', broadClass: 'equity', taxRule: 'equity', sector: 'Automobiles', unit: 'shares', aliases: ['STERLING MOTORS LTD', 'STERLING MOTORS LIMITED', 'STERLINGMOT'] },
  { id: 'DM-EQ-KAV01', name: 'Kaveri Pharma Ltd', assetClass: 'Equity', instrumentType: 'Direct stock', broadClass: 'equity', taxRule: 'equity', sector: 'Pharmaceuticals', unit: 'shares', aliases: ['KAVERI PHARMA LTD', 'KAVERI PHARMA LIMITED', 'KAVERIPHRM'] },
  { id: 'DM-EQ-DEC01', name: 'Deccan Power Ltd', assetClass: 'Equity', instrumentType: 'Direct stock', broadClass: 'equity', taxRule: 'equity', sector: 'Utilities', unit: 'shares', aliases: ['DECCAN POWER LTD', 'DECCAN POWER LIMITED', 'DECCANPWR'] },
  { id: 'DM-ETF-N5001', name: 'Demo Nifty-50 Index ETF', assetClass: 'ETF', instrumentType: 'Index ETF', broadClass: 'equity', taxRule: 'equity', sector: 'Index (large cap)', unit: 'units', aliases: ['DEMO NIFTY50 ETF', 'DEMO NIFTY 50 ETF', 'DEMONIFTY'] },
  { id: 'DM-ETF-GLD01', name: 'Demo Gold ETF', assetClass: 'ETF', instrumentType: 'Gold ETF', broadClass: 'gold', taxRule: 'gold', sector: 'Commodity – Gold', unit: 'units', aliases: ['DEMO GOLD ETF', 'DEMOGOLD'] },
  { id: 'DM-MF-FLX01', name: 'Demo Flexi Cap Fund – Direct Growth', assetClass: 'Mutual Fund', instrumentType: 'Equity fund', broadClass: 'equity', taxRule: 'equity', sector: 'Equity – Flexi cap', unit: 'units', aliases: ['DEMO FLEXI CAP FUND - DIRECT - GROWTH', 'DEMO FLEXI CAP FUND - DIRECT PLAN - GROWTH', 'DEMO FLEXI CAP FUND-DIR-G'] },
  { id: 'DM-MF-SDF01', name: 'Demo Short Duration Fund – Direct Growth', assetClass: 'Mutual Fund', instrumentType: 'Debt fund', broadClass: 'debt', taxRule: 'slab', sector: 'Debt – Short duration', unit: 'units', fundDuration: 2.4, aliases: ['DEMO SHORT DURATION FUND - DIRECT - GROWTH', 'DEMO SHORT DURATION FUND - DIRECT PLAN - GROWTH', 'DEMO SHORT DURATION FUND-DIR-G'] },
  {
    id: 'DM-GS-2034', name: 'Demo 7.10% GS 2034', assetClass: 'Government Security', instrumentType: 'Government security', broadClass: 'debt', taxRule: 'slab', sector: 'Central Govt. dated security', unit: 'units (FV ₹100)',
    bond: { face: 100, couponRate: 0.071, maturity: '2034-04-15', frequency: 2 }, aliases: ['7.10% GS 2034 (DEMO)', 'GOI 7.10% 2034 (DEMO)', 'GSEC 7.10% 2034'],
  },
  {
    id: 'DM-NCD-INF29', name: 'Demo Infra Finance 8.40% NCD 2029', assetClass: 'Corporate Bond', instrumentType: 'Corporate bond', broadClass: 'debt', taxRule: 'slab', sector: 'NBFC – Infrastructure', unit: 'units (FV ₹1,000)',
    bond: { face: 1000, couponRate: 0.084, maturity: '2029-11-30', frequency: 1 }, aliases: ['DEMO INFRA FIN 8.40% 2029', 'DEMO INFRA FIN 8.40% NCD 2029'],
  },
  {
    id: 'DM-NCD-HSG31', name: 'Demo Housing Finance 7.95% Bond 2031', assetClass: 'Corporate Bond', instrumentType: 'Corporate bond', broadClass: 'debt', taxRule: 'slab', sector: 'HFC', unit: 'units (FV ₹1,000)',
    bond: { face: 1000, couponRate: 0.0795, maturity: '2031-06-30', frequency: 1 }, aliases: ['DEMO HOUSING FIN 7.95% 2031'],
  },
  { id: 'DM-REIT-OFC01', name: 'Demo Office Parks REIT', assetClass: 'REIT', instrumentType: 'REIT', broadClass: 'equity', taxRule: 'reit-invit', sector: 'Commercial real estate', unit: 'units', aliases: ['DEMO OFFICE PARKS REIT'] },
  { id: 'DM-INVIT-HWY01', name: 'Demo Highways InvIT', assetClass: 'InvIT', instrumentType: 'InvIT', broadClass: 'equity', taxRule: 'reit-invit', sector: 'Toll roads', unit: 'units', aliases: ['DEMO HIGHWAYS INVIT'] },
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

export const instrumentById = Object.fromEntries(instruments.map((i) => [i.id, i])) as Record<string, Instrument>;
export const priceById = Object.fromEntries(prices.map((p) => [p.instrumentId, p])) as Record<string, PriceQuote>;

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9%.]/g, '');

/** Resolve a name, ticker or demo identifier to a security id (B5 step 3). */
export function resolveSecurity(ref: { id?: string | null; name?: string; symbol?: string }): string | null {
  if (ref.id && instrumentById[ref.id]) return ref.id;
  const keys = [ref.symbol, ref.name].filter(Boolean).map((k) => norm(k!));
  for (const inst of instruments) {
    const all = [inst.name, ...inst.aliases].map(norm);
    if (keys.some((k) => all.includes(k))) return inst.id;
  }
  return null;
}
