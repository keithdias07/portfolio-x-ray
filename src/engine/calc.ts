/**
 * Calculator engine (B9). Monthly compounding for SIPs, annual for lump sums.
 *   r = annual ÷ 12;  SIP FV = P × [((1 + r)^n − 1) ÷ r] × (1 + r)
 *   Lumpsum FV = P × (1 + annual)^years;  real FV = FV ÷ (1 + inflation)^years
 */
import { CAPITAL_GAINS, CESS } from '../config/tax';

export type CalcMode = 'sip' | 'lumpsum';
export type AfterTaxInstrument = 'equity-fund' | 'fd' | 'debt-fund';

export interface CalcInput {
  mode: CalcMode;
  amount: number;
  years: number;
  ratePct: number;
  inflationPct?: number;
  inflationAdjusted?: boolean;
  afterTax?: AfterTaxInstrument | null;
  marginalRate?: number; // for slab-taxed instruments
}

export interface YearPoint { year: number; invested: number; growth: number; value: number }

export function sipFV(P: number, annualPct: number, years: number): number {
  const r = annualPct / 100 / 12;
  const n = Math.round(years * 12);
  if (r === 0) return P * n;
  return P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

export function lumpFV(P: number, annualPct: number, years: number): number {
  return P * Math.pow(1 + annualPct / 100, years);
}

export const investedAt = (i: CalcInput, years: number) => (i.mode === 'sip' ? i.amount * Math.round(years * 12) : i.amount);

/** Tax on the growth portion at exit, by instrument rule (simplified, single redemption). */
export function taxOnGrowth(growth: number, inst: AfterTaxInstrument, marginal: number): number {
  if (growth <= 0) return 0;
  if (inst === 'equity-fund') return Math.max(0, growth - CAPITAL_GAINS.equityLtcgExemption) * CAPITAL_GAINS.equityLongTermRate * (1 + CESS);
  return growth * marginal; // FD interest and post-Apr-2023 debt funds: slab
}

export function valueAt(i: CalcInput, years: number, ratePct = i.ratePct): number {
  // FDs are taxed every year as interest accrues: compound at the post-tax rate
  const effRate = i.afterTax === 'fd' ? ratePct * (1 - (i.marginalRate ?? 0.3)) : ratePct;
  let fv = i.mode === 'sip' ? sipFV(i.amount, effRate, years) : lumpFV(i.amount, effRate, years);
  if (i.afterTax && i.afterTax !== 'fd') fv -= taxOnGrowth(fv - investedAt(i, years), i.afterTax, i.marginalRate ?? 0.3);
  if (i.inflationAdjusted) fv /= Math.pow(1 + (i.inflationPct ?? 5) / 100, years);
  return fv;
}

/** Contributions in today's money: each monthly SIP payment is deflated from the month it is made. */
export function realInvestedAt(i: CalcInput, years: number): number {
  if (i.mode === 'lumpsum') return i.amount; // paid today
  const infl = 1 + (i.inflationPct ?? 5) / 100;
  let total = 0;
  for (let k = 0; k < Math.round(years * 12); k++) total += i.amount / Math.pow(infl, k / 12);
  return total;
}

export function series(i: CalcInput): YearPoint[] {
  const out: YearPoint[] = [];
  for (let y = 0; y <= i.years; y++) {
    const value = valueAt(i, y);
    const invested = i.inflationAdjusted ? realInvestedAt(i, y) : investedAt(i, y);
    out.push({ year: y, invested, growth: Math.max(0, value - invested), value });
  }
  return out;
}

export function range(i: CalcInput, r: { cautious: number; expected: number; optimistic: number }) {
  return {
    cautious: valueAt(i, i.years, r.cautious),
    expected: valueAt(i, i.years, r.expected),
    optimistic: valueAt(i, i.years, r.optimistic),
  };
}

/** First year (within maxYears) the value reaches the target, or null. */
export function milestoneYear(i: CalcInput, target: number, maxYears = 50): number | null {
  for (let y = 1; y <= maxYears; y++) if (valueAt({ ...i, years: y }, y) >= target) return y;
  return null;
}
