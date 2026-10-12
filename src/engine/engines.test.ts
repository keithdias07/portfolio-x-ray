import { describe, expect, it } from 'vitest';
import { PERSONAS, personaById, fetchAccountSync, createConsent, approveConsent, revokeConsent, verifyOtp } from './aa';
import { normalise } from './normalise';
import { analyse } from './pipeline';
import { computeTax, marginalRate, slabTaxOn } from './tax';
import { lumpFV, sipFV, series, valueAt, milestoneYear } from './calc';
import { respond, seedFromAdvice, explainHolding } from './assistant';
import { targetAllocation } from './suitability';
import { amountInWords } from '../lib/format';
import type { Answers } from './types';

const build = (id: string) => {
  const p = personaById(id);
  const portfolio = normalise(p.accounts, p.documents);
  const answers = p.answers as Answers;
  return { p, portfolio, answers, analysis: analyse(answers, portfolio) };
};

describe('mock Account Aggregator', () => {
  const p = personaById('family-stage');
  it('consent moves through pending → approved → revoked', () => {
    const c = createConsent(['holdings', 'balances']);
    expect(c.status).toBe('pending');
    expect(approveConsent(c).status).toBe('approved');
    expect(revokeConsent(approveConsent(c)).status).toBe('revoked');
  });
  it('simulates fail, timeout and partial fetches', () => {
    expect(fetchAccountSync(p, 'acc-brk-b', 'fail').status).toBe('failed');
    expect(fetchAccountSync(p, 'acc-brk-b', 'timeout').error).toMatch(/timed out/);
    const partial = fetchAccountSync(p, 'acc-brk-b', 'partial');
    expect(partial.status).toBe('ready');
    expect(partial.partial).toBe(true);
    expect(fetchAccountSync(p, 'acc-brk-b').status).toBe('ready');
  });
  it('accepts any 6-digit mock OTP only', () => {
    expect(verifyOtp('123456')).toBe(true);
    expect(verifyOtp('12a456')).toBe(false);
  });
  it('a failed account still yields a usable partial portfolio', () => {
    const accounts = p.accounts.filter((a) => a.id !== 'acc-brk-b');
    const port = normalise(accounts, p.documents);
    expect(port.holdings.length).toBeGreaterThan(5);
    expect(port.holdings.find((h) => h.securityId === 'DM-EQ-STM01')).toBeUndefined();
  });
});

describe('normalisation pipeline', () => {
  const { portfolio } = build('family-stage');
  it('merges the same ETF across two brokers with weighted average cost', () => {
    const etf = portfolio.holdings.find((h) => h.securityId === 'DM-ETF-N5001')!;
    expect(etf.quantity).toBe(500);
    expect(etf.avgCost).toBeCloseTo((400 * 241.3 + 100 * 262) / 500, 4);
    expect(etf.sourceAccounts).toHaveLength(2);
  });
  it('keeps an unmatched security as Other with a flag, and does not ask (immaterial)', () => {
    const other = portfolio.holdings.find((h) => h.instrumentType === 'Other')!;
    expect(other.qualityFlags).toContain('unmatched');
    expect(portfolio.prompts.find((q) => q.kind === 'unmatched')!.ask).toBe(false);
  });
  it('flags missing cost and missing date, estimating the date with a note', () => {
    const kav = portfolio.holdings.find((h) => h.securityId === 'DM-EQ-KAV01')!;
    expect(kav.qualityFlags).toEqual(expect.arrayContaining(['missing-cost']));
    const dec = portfolio.holdings.find((h) => h.securityId === 'DM-EQ-DEC01')!;
    expect(dec.purchaseDateEstimated).toBe(true);
  });
  it('applies user edits from the confirm screen', () => {
    const p = personaById('family-stage');
    const edited = normalise(p.accounts, p.documents, { 'H-DM-EQ-KAV01': { avgCost: 1800 } });
    const kav = edited.holdings.find((h) => h.securityId === 'DM-EQ-KAV01')!;
    expect(kav.avgCost).toBe(1800);
    expect(kav.qualityFlags).not.toContain('missing-cost');
  });
  it('rejects malformed records with a logged reason', () => {
    const p = personaById('young-starter');
    const bad = p.accounts.map((a) => (a.type === 'DEMAT' ? { ...a, holdings: [...a.holdings, { name: 'BROKEN ROW', qty: -5, avgPrice: 10, firstBuyDate: null }] } : a));
    const port = normalise(bad, p.documents);
    expect(port.rejected[0].reason).toMatch(/Quantity/);
  });
  it('manual entries (consent declined) are valued but never flagged as single-issuer concentration', () => {
    const port = normalise([], [], {}, [
      { id: 'M-1', name: 'PPF account', value: 450000, broadClass: 'debt' },
      { id: 'M-2', name: 'Index fund', value: 300000, broadClass: 'equity' },
    ]);
    expect(port.totalValue).toBe(750000);
    const a = analyse({ age: 35, monthlyIncome: 90000, monthlyExpenses: 50000 }, port);
    expect(a.suit.verdicts.some((v) => v.kind === 'concentrated')).toBe(false);
    expect(port.holdings.every((h) => !h.purchaseDateEstimated)).toBe(true);
  });
  it('bank data prefills capacity answers', () => {
    expect(portfolio.bank).toMatchObject({ salaryCredit: 142000, emiDebits: 45000 });
  });
});

describe('tax engine (B15 stacking cases)', () => {
  it('rebate makes tax nil up to ₹12 lakh taxable (new regime)', () => {
    expect(slabTaxOn(1200000, 'new').tax).toBe(0);
    // salary 12.75L − 75k standard deduction = 12L taxable → nil
    expect(computeTax({ salary: 1275000, otherSlab: 0, stcgEquity: 0, ltcgEquity: 0, regime: 'new' }).total).toBe(0);
  });
  it('rebate loss: ₹50k of interest above the limit costs more than the 15% slab (marginal relief caps it)', () => {
    const base = computeTax({ salary: 1275000, otherSlab: 0, stcgEquity: 0, ltcgEquity: 0, regime: 'new' }).total;
    const withInterest = computeTax({ salary: 1275000, otherSlab: 50000, stcgEquity: 0, ltcgEquity: 0, regime: 'new' }).total;
    expect(withInterest - base).toBeCloseTo(50000 * 1.04, 0); // whole excess lost, not 15%
    expect(withInterest - base).toBeGreaterThan(50000 * 0.15);
  });
  it('the ₹1.25 lakh LTCG exemption is shared across holdings', () => {
    const two = computeTax({ salary: 0, otherSlab: 0, stcgEquity: 0, ltcgEquity: 200000, regime: 'new' });
    expect(two.ltcgTax).toBeCloseTo((200000 - 125000) * 0.125);
  });
  it('equity STCG at 20% is not reduced by the rebate', () => {
    expect(computeTax({ salary: 600000, otherSlab: 0, stcgEquity: 100000, ltcgEquity: 0, regime: 'new' }).stcgTax).toBe(20000);
  });
  it('debt-fund gains are slab-taxed in the per-holding chips', () => {
    const { analysis, portfolio } = build('family-stage');
    const sdf = portfolio.holdings.find((h) => h.securityId === 'DM-MF-SDF01')!;
    expect(analysis.tax.perHolding[sdf.holdingId].gainType).toBe('slab');
    expect(analysis.tax.perHolding[sdf.holdingId].chip).toMatch(/slab/);
  });
  it('marginal rate: ₹24L salary sits in the 25% slab (+cess); ₹30L in the 30% slab', () => {
    expect(marginalRate({ salary: 2400000, otherSlab: 50000, stcgEquity: 0, ltcgEquity: 0, regime: 'new' })).toBeCloseTo(0.26, 3);
    expect(marginalRate({ salary: 3000000, otherSlab: 0, stcgEquity: 0, ltcgEquity: 0, regime: 'new' })).toBeCloseTo(0.312, 3);
  });
});

describe('calculator engine', () => {
  it('matches the SIP and lumpsum formulas', () => {
    const r = 0.12 / 12;
    expect(sipFV(10000, 12, 10)).toBeCloseTo(10000 * ((Math.pow(1 + r, 120) - 1) / r) * (1 + r), 4);
    expect(lumpFV(100000, 10, 5)).toBeCloseTo(161051, 0);
  });
  it('splits invested vs growth and adjusts for inflation', () => {
    const s = series({ mode: 'sip', amount: 5000, years: 10, ratePct: 10 });
    expect(s[10].invested).toBe(600000);
    expect(s[10].growth).toBeCloseTo(s[10].value - 600000, 4);
    expect(valueAt({ mode: 'lumpsum', amount: 100000, years: 10, ratePct: 8, inflationAdjusted: true, inflationPct: 5 }, 10)).toBeLessThan(lumpFV(100000, 8, 10));
  });
  it('after-tax FD grows slower than an equal-rate equity fund', () => {
    const base = { mode: 'lumpsum' as const, amount: 500000, years: 10, ratePct: 7, marginalRate: 0.312 };
    expect(valueAt({ ...base, afterTax: 'fd' }, 10)).toBeLessThan(valueAt({ ...base, afterTax: 'equity-fund' }, 10));
  });
  it('finds the milestone year', () => {
    const i = { mode: 'sip' as const, amount: 25000, years: 30, ratePct: 11 };
    const y = milestoneYear(i, 10000000)!;
    expect(valueAt(i, y)).toBeGreaterThanOrEqual(10000000);
    expect(valueAt(i, y - 1)).toBeLessThan(10000000);
  });
});

describe('persona end-to-end (B15)', () => {
  it('young starter: aggressive-leaning profile, idle cash verdict', () => {
    const { analysis } = build('young-starter');
    expect(analysis.risk.label).toBe('Aggressive');
    expect(analysis.advice.verdict).toBe('idle-cash');
  });
  it('family stage: moderate profile with a clear verdict', () => {
    const { analysis } = build('family-stage');
    expect(analysis.risk.label).toBe('Moderate');
    expect(analysis.advice.headline.length).toBeGreaterThan(10);
  });
  it('pre-retiree: conservative, portfolio too aggressive, tolerance or capacity limits it', () => {
    const { analysis } = build('pre-retiree');
    expect(analysis.risk.label).toBe('Conservative');
    expect(analysis.advice.verdict).toBe('too-aggressive');
  });
  it('every persona produces sensible tax chips', () => {
    for (const p of PERSONAS) {
      const { analysis, portfolio } = build(p.id);
      for (const h of portfolio.holdings) expect(analysis.tax.perHolding[h.holdingId].chip.length).toBeGreaterThan(3);
    }
  });
  it('life-stage targets shift equity down for pre-retirees', () => {
    expect(targetAllocation('Moderate', 'pre-retirement').equity).toBeLessThan(targetAllocation('Moderate', 'starting').equity);
  });
});

describe('scripted assistant', () => {
  const { portfolio, answers, analysis } = build('family-stage');
  const ctx = { portfolio, answers, analysis };
  it('seeds from the advice card and always offers follow-up chips', () => {
    const m = seedFromAdvice(ctx);
    expect(m.blocks[0]).toMatchObject({ kind: 'text' });
    expect(m.chips.length).toBeGreaterThan(0);
  });
  it('declines guaranteed-return claims and stock tips', () => {
    expect(JSON.stringify(respond('Can you guarantee 15% returns?', ctx))).toMatch(/can’t promise/);
    expect(JSON.stringify(respond('which stock should I buy', ctx))).toMatch(/don’t give tips/);
  });
  it('answers instrument questions from the lesson library with tax angle', () => {
    const m = respond('Tell me about FD', ctx);
    expect(m.blocks.some((b) => b.kind === 'lesson')).toBe(true);
    expect(m.chips.length).toBeGreaterThan(0);
  });
  it('explains a holding with its tax chip', () => {
    const m = explainHolding(ctx, portfolio.holdings[0].holdingId);
    expect(JSON.stringify(m)).toMatch(/Tax/);
  });
  it('does not mistake "this" for a greeting', () => {
    expect(JSON.stringify(respond('what is this thing', ctx))).not.toMatch(/Hello!/);
  });
});

describe('formatting', () => {
  it('shows amounts in words as typed', () => {
    expect(amountInWords(250000)).toBe('2.5 lakh');
    expect(amountInWords(12000000)).toBe('1.2 crore');
  });
});
