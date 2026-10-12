import { describe, expect, it } from 'vitest';
import { integrityScore } from './xray';
import { normalise } from './normalise';
import { personaById, type RawDemat } from './aa';
import { priceFromYield, yieldToMaturity } from '../lib/bond';

const family = personaById('family-stage');
const run = (accounts = family.accounts) => normalise(accounts, family.documents).xray;

describe('Portfolio X-Ray rules engine (family persona via the pipeline)', () => {
  const result = run();
  const byCat = (c: string) => result.findings.filter((f) => f.category === c);

  it('is deterministic', () => {
    expect(JSON.stringify(run())).toEqual(JSON.stringify(result));
  });

  it('detects the expected set of findings', () => {
    expect(result.findings.map((f) => f.category).sort()).toEqual(
      ['corporate-action', 'duplicate', 'missing-cost', 'quantity-conflict', 'rounding', 'stale-price', 'yield-label'].sort(),
    );
  });

  it('counts the duplicate Meridian Bank position once', () => {
    const dup = byCat('duplicate')[0];
    expect(dup.instrumentId).toBe('DM-EQ-MER01');
    const pos = result.positions.find((p) => p.instrument.id === 'DM-EQ-MER01')!;
    expect(pos.quantity).toBe(200);
    expect(dup.impact.valueAtStake).toBeCloseTo(200 * 1642.25);
  });

  it('applies the Sterling Motors split (resolved from ticker) and adjusts cost', () => {
    const pos = result.positions.find((p) => p.instrument.id === 'DM-EQ-STM01')!;
    expect(pos.quantity).toBe(160);
    expect(pos.costPerUnit).toBe(1050);
  });

  it('explains the Aurora quantity gap with the post-CAS trade', () => {
    const f = byCat('quantity-conflict')[0];
    expect(f.instrumentId).toBe('DM-EQ-AUR01');
    expect(f.severity).toBe('Low');
  });

  it('flags an unexplained conflict as High when no trade explains it', () => {
    const accounts = family.accounts.map((a) =>
      a.id === 'acc-brk-b' ? { ...(a as RawDemat), holdings: (a as RawDemat).holdings.map((h) => (h.symbol === 'DECCANPWR' ? { ...h, qty: 350 } : h)) } : a,
    );
    const f = run(accounts).findings.find((x) => x.instrumentId === 'DM-EQ-DEC01')!;
    expect(f.category).toBe('quantity-conflict');
    expect(f.severity).toBe('High');
  });

  it('naive total exceeds reconciled total by duplicate minus split understatement', () => {
    expect(result.totals.naive - result.totals.reconciled).toBeCloseTo(200 * 1642.25 - 80 * 1240);
  });

  it('computes a transparent integrity score', () => {
    expect(integrityScore(result.findings).score).toBe(100 - (12 + 12 + 6 + 6 + 6 + 3 + 1));
    expect(integrityScore(result.findings, new Set(result.findings.map((f) => f.id))).score).toBe(100);
  });
});

describe('bond maths', () => {
  const t = { face: 1000, couponRate: 0.08, yearsToMaturity: 5, frequency: 1 };
  it('prices at par when yield equals coupon', () => {
    expect(priceFromYield(t, 0.08)).toBeCloseTo(1000, 6);
  });
  it('yield rises above coupon when price is below par', () => {
    expect(yieldToMaturity(t, 960)).toBeGreaterThan(0.08);
    expect(priceFromYield(t, yieldToMaturity(t, 960))).toBeCloseTo(960, 4);
  });
});
