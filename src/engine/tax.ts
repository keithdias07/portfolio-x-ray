/**
 * Tax engine (B8) — stacking method.
 * 1. Slab-taxed income is pooled (salary, interest, debt-fund gains, other STCG).
 * 2. Equity gains are taxed separately at special rates; the ₹1.25 lakh LTCG exemption is shared.
 * 3. The tax cost of each holding = total tax with it − total tax without it, which captures
 *    bracket creep and rebate loss (e.g. interest pushing income past ₹12 lakh).
 * Estimates only; see src/config/tax.ts for sources and items marked "to verify".
 */
import { CAPITAL_GAINS, CESS, REGIMES, TAX_META, TAX_RULES } from '../config/tax';
import type { CanonicalHolding, CanonicalPortfolio } from './normalise';
import type { Answers } from './types';
import { daysBetween } from '../lib/format';

export type Regime = 'new' | 'old';

export interface TaxInputs {
  salary: number;            // gross salary
  otherSlab: number;         // interest, debt-fund gains, other slab income
  stcgEquity: number;
  ltcgEquity: number;
  regime: Regime;
  deductions?: number;       // old regime only
}

export interface TaxBreakdown {
  taxableSlab: number;
  slabTax: number;           // after rebate / marginal relief, before cess
  rebate: number;
  stcgTax: number;
  ltcgTax: number;
  cess: number;
  total: number;
}

export function slabTaxOn(taxable: number, regime: Regime): { tax: number; rebate: number } {
  const cfg = REGIMES[regime];
  let tax = 0;
  let prev = 0;
  for (const s of cfg.slabs) {
    if (taxable > prev) tax += (Math.min(taxable, s.upTo) - prev) * s.rate;
    prev = s.upTo;
  }
  if (taxable <= cfg.rebateLimit) return { tax: 0, rebate: tax };
  if (cfg.marginalRelief) {
    const capped = Math.min(tax, taxable - cfg.rebateLimit);
    return { tax: capped, rebate: tax - capped };
  }
  return { tax, rebate: 0 };
}

export function computeTax(i: TaxInputs): TaxBreakdown {
  const cfg = REGIMES[i.regime];
  const ded = cfg.standardDeduction + (cfg.allowsDeductions ? i.deductions ?? 0 : 0);
  const taxableSlab = Math.max(0, i.salary - ded) + i.otherSlab;
  const { tax: slabTax, rebate } = slabTaxOn(taxableSlab, i.regime);
  const stcgTax = Math.max(0, i.stcgEquity) * CAPITAL_GAINS.equityShortTermRate;
  const ltcgTax = Math.max(0, i.ltcgEquity - CAPITAL_GAINS.equityLtcgExemption) * CAPITAL_GAINS.equityLongTermRate;
  const pre = slabTax + stcgTax + ltcgTax;
  const cess = pre * CESS;
  return { taxableSlab, slabTax, rebate, stcgTax, ltcgTax, cess, total: pre + cess };
}

/** Rate on the next rupee of slab income, including cess. */
export function marginalRate(i: TaxInputs): number {
  const step = 1000;
  return (computeTax({ ...i, otherSlab: i.otherSlab + step }).total - computeTax(i).total) / step;
}

export interface HoldingTax {
  chip: string;
  detail: string;
  verified: boolean;
  annualTax: number;     // incremental tax this year on recurring income (interest)
  ifSoldTax: number;     // incremental tax if sold today (stacked with all other sales)
  /** 'to-verify': the rule is flagged unverified, so no sale-tax figure is estimated */
  gainType: 'slab' | 'STCG' | 'LTCG' | 'none' | 'unknown' | 'to-verify';
  postTaxYield?: number; // for interest-bearing: annual yield after tax (%)
}

export interface TaxProfile {
  regime: Regime;
  grossAnnual: number;
  incomeAssumed: boolean;
  baseTax: number;
  marginalRate: number;
  annualInterest: number;
  annualInterestTax: number;
  sellAllTax: number;
  perHolding: Record<string, HoldingTax>;
  meta: typeof TAX_META;
  stale: boolean;
  notes: string[];
}

const pctTxt = (r: number) => `${(r * 100).toFixed(1).replace(/\.0$/, '')}%`;

/** Debt funds bought before the cut-off fall outside the design document's "always slab" rule. */
/** Unrecognised securities and manual entries: we don't know the instrument, so no tax rule is assumed. */
export const taxTypeUnknown = (h: CanonicalHolding) => h.instrumentType === 'Other' || h.instrumentType === 'Manual entry';

export const debtFundRuleUnverified = (h: CanonicalHolding) =>
  h.instrumentType === 'Debt fund' && (!h.purchaseDate || h.purchaseDateEstimated || h.purchaseDate < CAPITAL_GAINS.debtFundSlabFrom);

function gainParts(h: CanonicalHolding): { slab: number; stcg: number; ltcg: number; type: HoldingTax['gainType'] } {
  const none = { slab: 0, stcg: 0, ltcg: 0 };
  if (h.broadClass === 'cash' || h.instrumentType === 'Fixed deposit') return { ...none, type: 'none' };
  // never apply a rate the tax table marks "to verify" — leave those holdings out of sale estimates
  if (!TAX_RULES[h.taxRule].verified || debtFundRuleUnverified(h) || taxTypeUnknown(h)) return { ...none, type: 'to-verify' };
  if (h.unrealisedGain == null) return { ...none, type: 'unknown' };
  const g = Math.max(0, h.unrealisedGain);
  if (h.taxRule === 'slab') return { slab: g, stcg: 0, ltcg: 0, type: 'slab' };
  if (h.taxRule === 'equity') {
    const months = h.holdingMonths ?? 13;
    return months >= CAPITAL_GAINS.equityLongTermMonths ? { slab: 0, stcg: 0, ltcg: g, type: 'LTCG' } : { slab: 0, stcg: g, ltcg: 0, type: 'STCG' };
  }
  return { slab: 0, stcg: 0, ltcg: 0, type: 'none' };
}

export function buildTaxProfile(a: Answers, p: CanonicalPortfolio, asOf = p.asOf): TaxProfile {
  const regime: Regime = a.regime ?? 'new';
  const incomeAssumed = a.grossAnnual == null;
  const grossAnnual = a.grossAnnual ?? (a.monthlyIncome ?? 0) * 12 * 1.25; // disclosed via notes when assumed
  const base: TaxInputs = { salary: grossAnnual, otherSlab: 0, stcgEquity: 0, ltcgEquity: 0, regime, deductions: a.oldDeductions };
  const baseTax = computeTax(base).total;

  // recurring slab income (interest) — stacked on salary
  const annualInterest = p.holdings.reduce((s, h) => s + h.annualInterest, 0);
  const withInterest = { ...base, otherSlab: annualInterest };
  const interestTax = computeTax(withInterest).total - baseTax;
  const mRate = marginalRate(withInterest);

  // sell-everything scenario for capital gains, stacked on salary + interest
  const parts = p.holdings.map((h) => ({ h, ...gainParts(h) }));
  const sum = (xs: typeof parts) => ({
    slab: xs.reduce((s, x) => s + x.slab, 0), stcg: xs.reduce((s, x) => s + x.stcg, 0), ltcg: xs.reduce((s, x) => s + x.ltcg, 0),
  });
  const all = sum(parts);
  const sellAllTotal = computeTax({ ...withInterest, otherSlab: annualInterest + all.slab, stcgEquity: all.stcg, ltcgEquity: all.ltcg }).total;
  const sellAllTax = sellAllTotal - computeTax(withInterest).total;

  const perHolding: Record<string, HoldingTax> = {};
  for (const x of parts) {
    const h = x.h;
    const rule = TAX_RULES[h.taxRule];
    // annual (interest) increment
    const without = computeTax({ ...base, otherSlab: annualInterest - h.annualInterest }).total;
    const annualTax = h.annualInterest > 0 ? computeTax(withInterest).total - without : 0;
    // if-sold increment
    const rest = sum(parts.filter((y) => y !== x));
    const restTotal = computeTax({ ...withInterest, otherSlab: annualInterest + rest.slab, stcgEquity: rest.stcg, ltcgEquity: rest.ltcg }).total;
    const ifSoldTax = sellAllTotal - restTotal;
    const chip = rule.chip.replace('{slab}', pctTxt(mRate));
    const yieldPct = h.annualInterest > 0 && h.currentValue > 0 ? (h.annualInterest / h.currentValue) * 100 : undefined;
    const debtUnverified = debtFundRuleUnverified(h);
    const unknownType = taxTypeUnknown(h);
    perHolding[h.holdingId] = {
      chip: unknownType ? 'Type unknown · to verify' : x.type === 'STCG' ? '20% if sold now (<1 yr)' : debtUnverified ? 'Rule to verify' : chip,
      detail: unknownType
        ? 'We don’t know exactly what this investment is, so no tax rule is applied and no sale-tax estimate is shown.'
        : debtUnverified
        ? 'The design document’s slab-rate rule covers debt funds bought on or after 1 April 2023. This holding’s purchase date is earlier or unknown, so its treatment is marked “to verify” and no sale-tax estimate is shown.'
        : rule.detail,
      verified: rule.verified && !debtUnverified && !unknownType,
      annualTax, ifSoldTax, gainType: x.type,
      postTaxYield: yieldPct != null ? yieldPct * (annualTax > 0 ? 1 - annualTax / h.annualInterest : 1) : undefined,
    };
  }

  const notes: string[] = [];
  if (regime === 'new' && computeTax(base).taxableSlab <= REGIMES.new.rebateLimit && computeTax(withInterest).taxableSlab > REGIMES.new.rebateLimit) {
    notes.push('Your interest income pushes taxable income past ₹12 lakh, so part of the rebate is lost. Each rupee of interest costs more than your slab suggests.');
  }
  if (all.ltcg > 0) notes.push(`The ₹1.25 lakh yearly exemption on long-term equity gains is shared across all your equity holdings.`);
  const excluded = parts.filter((x) => x.type === 'to-verify' && x.h.currentValue > 0).length;
  if (excluded) notes.push(`The “if sold” estimate leaves out ${excluded} holding${excluded > 1 ? 's' : ''} whose tax rule is marked “to verify”.`);
  if (incomeAssumed) notes.push('Yearly income wasn’t given, so it is assumed to be take-home pay × 12 × 1.25. Add your income for a better estimate.');

  return {
    regime, grossAnnual, incomeAssumed, baseTax, marginalRate: mRate, annualInterest, annualInterestTax: interestTax, sellAllTax, perHolding,
    meta: TAX_META, stale: daysBetween(TAX_META.lastVerified, asOf) > 180, notes,
  };
}
