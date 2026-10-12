/**
 * Tax configuration table (B8). One place for every rate, each with a source and last-verified
 * date. Figures are taken from the "Investor Assistant: User Flow and Technical Flow" design
 * document (rates stated as verified for FY 2026-27, October 2026). Items the document marks
 * "to verify" are flagged and shown to users as estimates.
 *
 * Section numbers are deliberately not hard-coded (the new Income Tax Act renumbers them).
 */

export interface Slab { upTo: number; rate: number } // upTo = Infinity for the last slab

export interface RegimeConfig {
  label: string;
  slabs: Slab[];
  standardDeduction: number;
  rebateLimit: number;          // taxable income up to which slab tax is nil (rebate)
  marginalRelief: boolean;      // tax above the limit capped at the excess over the limit
  allowsDeductions: boolean;
}

export const TAX_META = {
  financialYear: 'FY 2026-27',
  source: 'Investor Assistant design document',
  /** the verification date stated in the design document — NOT an independent or legal verification */
  lastVerified: '2026-10-01',
  disclaimer: 'Rates are taken as stated in the design document and have not been independently or legally verified. Estimates only.',
  /** assumptions that must be confirmed before any real-world use */
  toVerify: [
    'Marginal relief just above the ₹12 lakh rebate limit (new regime) — added in the prototype, not stated in the design document',
    'Gold ETF and Sovereign Gold Bond treatment',
    'PPF, NPS, ELSS and 80C limits',
    'REIT/InvIT distribution components',
    'TDS thresholds',
    'Surcharge for very high incomes',
  ],
  estimateOnly: ['HUF', 'NRI', 'grandfathering on pre-2018 equity', 'detailed loss carry-forward', 'surcharge for very high incomes'],
};

export const REGIMES: Record<'new' | 'old', RegimeConfig> = {
  new: {
    label: 'New regime (default)',
    slabs: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.10 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.20 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: Infinity, rate: 0.30 },
    ],
    standardDeduction: 75000,
    rebateLimit: 1200000,
    marginalRelief: true, // TO VERIFY — prototype assumption, not in the design document (see TAX_META.toVerify)
    allowsDeductions: false,
  },
  old: {
    label: 'Old regime (optional)',
    slabs: [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 },
    ],
    standardDeduction: 50000,
    rebateLimit: 500000,
    marginalRelief: false,
    allowsDeductions: true,
  },
};

export const CESS = 0.04;

export const CAPITAL_GAINS = {
  equityShortTermRate: 0.20,      // held under 12 months
  equityLongTermRate: 0.125,      // held 12 months or more
  equityLtcgExemption: 125000,    // per year, shared across all equity holdings
  equityLongTermMonths: 12,
  debtFundSlabFrom: '2023-04-01', // debt MFs bought on/after this date: always slab
};

export interface TaxRuleInfo {
  chip: string;          // short chip text; {slab} is replaced with the user's marginal rate
  detail: string;
  verified: boolean;
  source: string;
}

export const TAX_RULES: Record<'equity' | 'slab' | 'gold' | 'reit-invit' | 'savings', TaxRuleInfo> = {
  equity: {
    chip: '12.5% after 1 yr',
    detail: 'Equity shares, equity funds and equity ETFs: gains taxed at 20% if sold within 12 months, 12.5% after 12 months on long-term gains above ₹1.25 lakh a year (the exemption is shared across all your equity holdings).',
    verified: true, source: TAX_META.source,
  },
  slab: {
    chip: 'Taxed at your slab ({slab})',
    detail: 'Interest from FDs, bonds and G-Secs, and gains on debt mutual funds bought on or after 1 April 2023, are added to your income and taxed at your slab rate.',
    verified: true, source: TAX_META.source,
  },
  gold: {
    chip: 'Rule to verify',
    detail: 'Gold ETF and Sovereign Gold Bond treatment is marked “to verify” in the tax table. Shown as an estimate only.',
    verified: false, source: 'Flagged “to verify” in design document',
  },
  'reit-invit': {
    chip: 'Mixed · depends on payout',
    detail: 'REIT/InvIT distributions combine interest, dividend and repayment of capital, each taxed differently. Gains on units are treated like listed equity-type units in this estimate.',
    verified: false, source: 'Simplified for prototype — verify',
  },
  savings: {
    chip: 'Interest at your slab ({slab})',
    detail: 'Savings account interest is taxable at your slab rate (limited deductions may apply in the old regime).',
    verified: true, source: TAX_META.source,
  },
};

/** Instrument-library tax lines for products not held in any persona (to-verify items flagged). */
export const LIBRARY_TAX: Record<string, { chip: string; verified: boolean }> = {
  fd: { chip: 'Taxed at your slab', verified: true },
  gsec: { chip: 'Interest at your slab', verified: true },
  bond: { chip: 'Interest at your slab', verified: true },
  'debt-fund': { chip: 'Slab rate (bought after Apr 2023)', verified: true },
  'equity-fund': { chip: '12.5% after 1 yr', verified: true },
  gold: { chip: 'Rule to verify', verified: false },
  ppf: { chip: 'Tax-free (limits to verify)', verified: false },
  nps: { chip: 'Partly tax-free (rules to verify)', verified: false },
};
