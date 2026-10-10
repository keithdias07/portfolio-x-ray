/**
 * Simplified bond maths for education and illustration.
 * Assumes whole coupon periods remaining, no accrued interest, no day-count conventions.
 */

export interface BondTerms {
  face: number;          // face value per unit (₹)
  couponRate: number;    // annual coupon, e.g. 0.071 for 7.10%
  yearsToMaturity: number;
  frequency: number;     // coupons per year (2 for G-Secs, 1 for most NCDs)
}

function periods(t: BondTerms) {
  return Math.max(1, Math.round(t.yearsToMaturity * t.frequency));
}

/** Price per unit for a given annual yield (decimal). */
export function priceFromYield(t: BondTerms, ytm: number): number {
  const n = periods(t);
  const c = (t.face * t.couponRate) / t.frequency;
  const y = ytm / t.frequency;
  let pv = 0;
  for (let k = 1; k <= n; k++) pv += c / Math.pow(1 + y, k);
  pv += t.face / Math.pow(1 + y, n);
  return pv;
}

/** Yield to maturity (annual, decimal) via bisection. */
export function yieldToMaturity(t: BondTerms, price: number): number {
  let lo = -0.05;
  let hi = 0.5;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    // price falls as yield rises
    if (priceFromYield(t, mid) > price) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function currentYield(t: BondTerms, price: number): number {
  return (t.face * t.couponRate) / price;
}

/** Modified duration in years. */
export function modifiedDuration(t: BondTerms, ytm: number): number {
  const n = periods(t);
  const c = (t.face * t.couponRate) / t.frequency;
  const y = ytm / t.frequency;
  let pv = 0;
  let weighted = 0;
  for (let k = 1; k <= n; k++) {
    const cf = k === n ? c + t.face : c;
    const d = cf / Math.pow(1 + y, k);
    pv += d;
    weighted += (k / t.frequency) * d;
  }
  const macaulay = weighted / pv;
  return macaulay / (1 + y);
}

export function yearsBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + 'T00:00:00').getTime();
  const b = new Date(toIso + 'T00:00:00').getTime();
  return (b - a) / (365.25 * 86_400_000);
}
