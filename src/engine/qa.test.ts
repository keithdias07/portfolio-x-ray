import { describe, expect, it } from 'vitest';
import { personaById, fetchAccountSync } from './aa';
import { normalise } from './normalise';
import { analyse } from './pipeline';
import { computeRisk } from './risk';
import { buildTaxProfile } from './tax';
import { range, series, valueAt, realInvestedAt, investedAt } from './calc';
import { respond, userMsg } from './assistant';
import { accountsFromSessions, hydrate, incompleteNotes, initialState, reducer, staleStandIns, STORAGE_KEY } from '../store';
import { S, tr } from '../i18n';
import { priceById } from '../data/securities';
import type { Answers } from './types';

const family = personaById('family-stage');

describe('risk: capacity vs willingness', () => {
  it('when willingness is lower, it decides the profile', () => {
    const r = computeRisk({ lifeStage: 'starting', age: 26, dependents: 0, incomeType: 'salaried', monthlyIncome: 100000, monthlyExpenses: 30000, monthlyEmi: 0, fall20: 'sell-all', pickPortfolio: 'A', pastBehaviour: 'sold' }, 600000);
    expect(r.capacityLabel).toBe('Aggressive');
    expect(r.toleranceLabel).toBe('Conservative');
    expect(r.limiting).toBe('tolerance');
    expect(r.label).toBe('Conservative');
  });
  it('when ability is lower, it decides the profile', () => {
    const r = computeRisk({ lifeStage: 'retired', age: 66, dependents: 3, incomeType: 'variable', monthlyIncome: 50000, monthlyExpenses: 40000, monthlyEmi: 15000, fall20: 'buy-more', pickPortfolio: 'C', pastBehaviour: 'bought-more' }, 20000);
    expect(r.toleranceLabel).toBe('Aggressive');
    expect(r.limiting).toBe('capacity');
    expect(r.label).toBe(r.capacityLabel);
  });
  it('"Not sure" answers still produce a profile without throwing', () => {
    expect(computeRisk({}, 0).label).toMatch(/Conservative|Moderate|Aggressive/);
  });
});

describe('Grow calculator scenarios and toggles', () => {
  const base = { mode: 'sip' as const, amount: 10000, years: 15, ratePct: 9, inflationPct: 5 };
  it('cautious < expected < optimistic', () => {
    const r = range(base, { cautious: 6, expected: 9, optimistic: 11 });
    expect(r.cautious).toBeLessThan(r.expected);
    expect(r.expected).toBeLessThan(r.optimistic);
  });
  it('inflation-adjusted contributions deflate each payment from when it is made', () => {
    const nominal = investedAt(base, 15);
    const real = realInvestedAt({ ...base, inflationAdjusted: true }, 15);
    expect(real).toBeLessThan(nominal);
    expect(real).toBeGreaterThan(nominal / Math.pow(1.05, 15)); // earlier payments lose less value
    const s = series({ ...base, inflationAdjusted: true });
    expect(s[15].invested).toBeCloseTo(real, 6);
    expect(s[15].value).toBeLessThan(valueAt(base, 15));
  });
  it('lump sums are already in today’s money', () => {
    expect(realInvestedAt({ mode: 'lumpsum', amount: 500000, years: 10, ratePct: 8, inflationAdjusted: true }, 10)).toBe(500000);
  });
  it('after-tax equity fund is below the pre-tax value', () => {
    expect(valueAt({ ...base, afterTax: 'equity-fund', marginalRate: 0.3 }, 15)).toBeLessThan(valueAt(base, 15));
  });
});

describe('Account Aggregator retries and partial data', () => {
  it('a retry after a failure succeeds and never duplicates holdings', () => {
    const failed = fetchAccountSync(family, 'acc-brk-b', 'fail');
    const retried = fetchAccountSync(family, 'acc-brk-b', 'none');
    const sessions = Object.fromEntries(family.accounts.map((a) => [a.id, fetchAccountSync(family, a.id)]));
    sessions['acc-brk-b'] = failed;
    sessions['acc-brk-b'] = retried; // the store keys sessions by account, so a retry replaces
    const full = normalise(family.accounts, family.documents);
    const viaSessions = normalise(accountsFromSessions(sessions, []), family.documents);
    expect(viaSessions.holdings.length).toBe(full.holdings.length);
    expect(viaSessions.totalValue).toBeCloseTo(full.totalValue, 2);
  });
  it('a manual stand-in for a skipped account is flagged once that account is fetched (no silent double count)', () => {
    const entry = { id: 'M-1', name: 'Bond platform (approx.)', value: 150000, broadClass: 'debt' as const, standInFor: ['acc-bond'] };
    const whileSkipped = { manual: [entry], sessions: { 'acc-bond': fetchAccountSync(family, 'acc-bond', 'timeout') }, skippedAccounts: ['acc-bond'] };
    expect(staleStandIns(whileSkipped)).toHaveLength(0);
    const afterRetry = { manual: [entry], sessions: { 'acc-bond': fetchAccountSync(family, 'acc-bond') }, skippedAccounts: [] };
    expect(staleStandIns(afterRetry).map((m) => m.id)).toEqual(['M-1']);
    expect(staleStandIns({ ...afterRetry, manual: [{ ...entry, standInFor: undefined }] })).toHaveLength(0); // "Keep both"
  });
  it('manual entries show gain as unknown, not ₹0', () => {
    const port = normalise([], [], {}, [{ id: 'M-1', name: 'x', value: 1000, broadClass: 'equity' }]);
    expect(port.holdings[0].unrealisedGain).toBeNull();
    expect(port.holdings[0].avgCost).toBeNull();
  });
  it('skipped and partial accounts are reported as incomplete, never silently complete', () => {
    const sessions = { 'acc-mf': fetchAccountSync(family, 'acc-mf', 'partial') };
    const notes = incompleteNotes({ mode: 'connect', sessions, skippedAccounts: ['acc-brk-b'] }, (id) => id);
    expect(notes).toHaveLength(2);
    expect(notes.join(' ')).toMatch(/partial/);
    expect(notes.join(' ')).toMatch(/not included/);
  });
});

describe('saved progress, resume and reset', () => {
  it('resumes where the user left off', () => {
    const saved = { ...initialState(), stage: 'later' as const, laterIndex: 3, answers: { age: 40 } };
    const s = hydrate(JSON.stringify(saved));
    expect(s.stage).toBe('later');
    expect(s.laterIndex).toBe(3);
    expect(s.answers.age).toBe(40);
  });
  it('a reload during fetching never leaves accounts stuck as pending', () => {
    const saved = {
      ...initialState(), stage: 'connect' as const, connectStep: 'verify' as const, selectedAccounts: ['a1', 'a2'],
      sessions: { a1: { accountId: 'a1', status: 'pending' as const, timestamp: '' } },
    };
    const s = hydrate(JSON.stringify(saved));
    expect(s.sessions.a1.status).toBe('failed');
    expect(s.sessions.a2.status).toBe('failed'); // never started → offered retry too
    expect(s.sessions.a1.error).toMatch(/interrupted/);
  });
  it('corrupt or old-version storage falls back to a clean start', () => {
    expect(hydrate('{not json').stage).toBe('welcome');
    expect(hydrate(JSON.stringify({ v: 1, stage: 'app' })).stage).toBe('welcome');
    expect(hydrate(null).stage).toBe('welcome');
  });
  it('reset (revoke/delete) clears answers, data and results but keeps the chosen language', () => {
    const busy = { ...initialState(), lang: 'hi' as const, stage: 'app' as const, answers: { age: 40 }, manual: [{ id: 'M', name: 'x', value: 1, broadClass: 'debt' as const }], chat: [userMsg('hi')] };
    const s = reducer(busy, { type: 'reset', keep: { lang: busy.lang } });
    expect(s.stage).toBe('welcome');
    expect(s.answers).toEqual({});
    expect(s.manual).toEqual([]);
    expect(s.chat).toEqual([]);
    expect(s.lang).toBe('hi');
    expect(STORAGE_KEY).toBe('ia.state.v2');
  });
});

describe('English / Hindi copy', () => {
  it('every key-screen string has both English and a distinct Hindi translation', () => {
    for (const [k, v] of Object.entries(S)) {
      expect(v.en.trim(), k).not.toBe('');
      expect(v.hi.trim(), k).not.toBe('');
      expect(v.hi, k).not.toBe(v.en);
    }
  });
  it('substitutes variables in both languages', () => {
    expect(tr('en', 'weFound', { a: 3, h: 14, v: '₹24.6 lakh' })).toBe('We found 3 accounts and 14 holdings worth ₹24.6 lakh.');
    expect(tr('hi', 'weFound', { a: 3, h: 14, v: '₹24.6 lakh' })).toContain('₹24.6 lakh');
  });
});

describe('tax: unverified rules are never silently applied', () => {
  const p = normalise(family.accounts, family.documents);
  const a = analyse(family.answers as Answers, p);
  it('gold ETF and REIT/InvIT get no sale-tax estimate and are excluded from the total', () => {
    for (const id of ['H-DM-ETF-GLD01', 'H-DM-REIT-OFC01', 'H-DM-INVIT-HWY01']) {
      expect(a.tax.perHolding[id].gainType).toBe('to-verify');
      expect(a.tax.perHolding[id].ifSoldTax).toBe(0);
      expect(a.tax.perHolding[id].verified).toBe(false);
    }
    expect(a.tax.notes.join(' ')).toMatch(/leaves out 4 holdings/); // gold ETF, REIT, InvIT + unrecognised security
  });
  it('unrecognised securities and manual entries get no assumed tax rule', () => {
    expect(a.tax.perHolding['H-OTHER-1']).toMatchObject({ gainType: 'to-verify', verified: false, chip: 'Type unknown · to verify' });
    const manual = normalise([], [], {}, [{ id: 'M-1', name: 'Shares in another app', value: 200000, broadClass: 'equity' }]);
    const t = buildTaxProfile({ grossAnnual: 1500000 }, manual);
    expect(t.perHolding['M-1'].gainType).toBe('to-verify');
    expect(t.perHolding['M-1'].verified).toBe(false);
  });
  it('debt funds bought before 1 April 2023 are flagged instead of slab-taxed', () => {
    const old = { ...family, accounts: family.accounts.map((acc) => (acc.type === 'MUTUAL_FUNDS' ? { ...acc, schemes: acc.schemes.map((sc) => ({ ...sc, firstPurchaseDate: '2021-06-01' })) } : acc)) };
    const t = buildTaxProfile(family.answers as Answers, normalise(old.accounts, old.documents));
    expect(t.perHolding['H-DM-MF-SDF01'].gainType).toBe('to-verify');
    expect(t.perHolding['H-DM-MF-SDF01'].chip).toBe('Rule to verify');
  });
  it('discloses when income is assumed rather than given', () => {
    const t = buildTaxProfile({ monthlyIncome: 100000 }, p);
    expect(t.incomeAssumed).toBe(true);
    expect(t.notes.join(' ')).toMatch(/assumed/);
  });
});

describe('normalisation edge cases', () => {
  it('a recognised security with no price is kept, valued at cost and clearly marked — no crash', () => {
    const noKaveriPrice = (id: string) => (id === 'DM-EQ-DEC01' ? undefined : priceById[id]);
    const port = normalise(family.accounts, family.documents, {}, [], undefined, noKaveriPrice);
    const dec = port.holdings.find((h) => h.securityId === 'DM-EQ-DEC01')!;
    expect(dec.currentValue).toBeCloseTo(300 * 288);
    expect(dec.priceApprox).toBe(true);
    expect(dec.unrealisedGain).toBeNull();
    expect(dec.note).toMatch(/No current price/);
  });
  it('classifying an unrecognised security clears its flag', () => {
    const port = normalise(family.accounts, family.documents, { 'H-OTHER-1': { broadClass: 'equity' } });
    const h = port.holdings.find((x) => x.holdingId === 'H-OTHER-1')!;
    expect(h.broadClass).toBe('equity');
    expect(h.qualityFlags).not.toContain('unmatched');
  });
});

describe('assistant numbers come from the engines', () => {
  const p = normalise(family.accounts, family.documents);
  const analysis = analyse(family.answers as Answers, p);
  const ctx = { portfolio: p, answers: family.answers as Answers, analysis };
  it('FD tax in chat equals the stacked per-holding figure shown in My money', () => {
    const fd = p.holdings.find((h) => h.instrumentType === 'Fixed deposit')!;
    const expected = Math.round(analysis.tax.perHolding[fd.holdingId].annualTax).toLocaleString('en-IN');
    expect(JSON.stringify(respond('tell me about FD', ctx))).toContain(`₹${expected}`);
  });
  it('tax answer quotes the engine marginal rate and labels rates as not independently verified', () => {
    const text = JSON.stringify(respond('how does tax affect me', ctx));
    expect(text).toContain(`${(analysis.tax.marginalRate * 100).toFixed(1)}%`);
    expect(text).toMatch(/not independently or legally verified/);
  });
  it('message ids stay unique across many messages', () => {
    const ids = Array.from({ length: 50 }, () => userMsg('x').id);
    expect(new Set(ids).size).toBe(50);
  });
});
