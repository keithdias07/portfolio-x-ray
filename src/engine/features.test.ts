import { describe, expect, it } from 'vitest';
import { personaById } from './aa';
import { normalise } from './normalise';
import { analyse } from './pipeline';
import { computeRisk } from './risk';
import { assessSuitability } from './suitability';
import { breakdown, investedAt } from './calc';
import { respond } from './assistant';
import { WHY_IT_MATTERS, runXRay } from './xray';
import { INTRO, LATER, QUESTIONS, optionsFor } from '../config/questions';
import { GOVT_VS_OTHER_BONDS, INSTRUMENT_LESSONS, REIT_VS_INVIT, lessonById } from '../data/instruments';
import { resources, topicById, topics } from '../data/learn';
import { PASS_MARK, passedCount, recordBest, scoreQuiz } from '../lib/learning';
import type { Answers } from './types';

const family = personaById('family-stage');
const familyPortfolio = normalise(family.accounts, family.documents);

describe('A · questionnaire covers the CA checklist', () => {
  const ids = QUESTIONS.map((q) => q.id);
  it('asks for every required input', () => {
    for (const id of ['lifeStage', 'age', 'goals', 'horizon', 'incomeType', 'grossAnnual', 'monthlyIncome', 'monthlyExpenses', 'monthlyEmi', 'emergencyMonths', 'incomeNeed', 'insurance', 'experience', 'fall20', 'pickPortfolio', 'pastBehaviour']) {
      expect(ids, id).toContain(id);
    }
  });
  it('every question has English and Hindi text, a why-we-ask line and a Not-sure default', () => {
    for (const q of QUESTIONS) {
      expect(q.text.en && q.text.hi && q.why.en && q.why.hi, q.id).toBeTruthy();
      expect(q.text.hi).not.toBe(q.text.en);
      expect('notSure' in q, q.id).toBe(true);
      for (const o of optionsFor(q, { lifeStage: 'family' })) expect(o.label.hi, `${q.id}:${o.value}`).toBeTruthy();
    }
  });
  it('keeps one question per screen and a manageable length', () => {
    expect(INTRO.length + LATER.length).toBeLessThanOrEqual(16);
    expect(INTRO.map((q) => q.id)).toEqual(['lifeStage', 'age', 'goals', 'horizon', 'incomeType', 'grossAnnual']);
  });
});

describe('C · risk profiling with horizon and experience', () => {
  const base: Answers = { lifeStage: 'building', age: 30, dependents: 0, incomeType: 'salaried', monthlyIncome: 100000, monthlyExpenses: 40000, monthlyEmi: 0, fall20: 'buy-more', pickPortfolio: 'C', pastBehaviour: 'bought-more' };
  it('never describes the same factor as both helping and limiting', () => {
    const r = computeRisk({ ...base, age: 25, monthlyEmi: 0 }, 600000);
    const helps = r.reasons.filter((x) => x.includes('helps')).map((x) => x.split(' — ')[0]);
    const limits = r.reasons.filter((x) => x.includes('limits')).map((x) => x.split(' — ')[0]);
    expect(helps).toHaveLength(1);
    expect(limits.some((l) => helps.includes(l))).toBe(false);
    expect(limits).not.toContain('Steady salary');
  });
  it('caps the horizon at when the money is needed', () => {
    expect(computeRisk({ ...base, horizon: '<3' }, 300000).horizonYears).toBe(2);
    expect(computeRisk({ ...base, horizon: '10+' }, 300000).horizonYears).toBe(30);
    expect(computeRisk({ ...base, horizon: '<3' }, 300000).capacityScore).toBeLessThan(computeRisk({ ...base, horizon: '10+' }, 300000).capacityScore);
  });
  it('a first-time investor’s willingness is capped at Moderate, with an explanation', () => {
    const r = computeRisk({ ...base, experience: 'none' }, 300000);
    expect(r.beginnerCap).toBe(true);
    expect(r.toleranceLabel).toBe('Moderate');
    expect(r.reasons.join(' ')).toMatch(/haven’t invested before/);
    expect(computeRisk({ ...base, experience: '<2' }, 300000).toleranceLabel).toBe('Aggressive');
  });
  it('the final profile is still the lower of capacity and willingness', () => {
    const r = computeRisk({ ...base, experience: 'none' }, 300000);
    const order = ['Conservative', 'Moderate', 'Aggressive'];
    expect(order.indexOf(r.label)).toBe(Math.min(order.indexOf(r.capacityLabel), order.indexOf(r.toleranceLabel)));
  });
});

describe('C · suitability: liquidity, obligations, horizon, income need and sectors', () => {
  it('an emergency-buffer shortfall is flagged first', () => {
    const s = assessSuitability(familyPortfolio, 'Moderate', 'family', 900000, { liquidCash: 200000, bufferMonths: 6, monthlyExpenses: 150000 });
    expect(s.primary.kind).toBe('buffer-short');
    expect(s.primary.text).toMatch(/months of expenses/);
  });
  it('money needed within 3 years held mostly in equity is flagged', () => {
    const s = assessSuitability(familyPortfolio, 'Moderate', 'family', 0, { horizon: '<3' });
    expect(s.verdicts.some((v) => v.kind === 'short-horizon')).toBe(true);
  });
  it('relying on regular income with little debt or cash is flagged', () => {
    const s = assessSuitability(familyPortfolio, 'Moderate', 'family', 0, { incomeNeed: 'yes' });
    expect(s.verdicts.some((v) => v.kind === 'needs-income')).toBe(true);
    expect(assessSuitability(familyPortfolio, 'Moderate', 'family', 0, { incomeNeed: 'no' }).verdicts.some((v) => v.kind === 'needs-income')).toBe(false);
  });
  it('flags sector concentration in direct stocks', () => {
    const p = personaById('pre-retiree');
    // make Meridian (Banking) dominate the direct-stock holdings
    const accounts = p.accounts.map((a) => (a.type === 'DEMAT' ? { ...a, holdings: a.holdings.map((h) => (h.isin === 'DM-EQ-MER01' ? { ...h, qty: 1200 } : h)) } : a));
    const s = assessSuitability(normalise(accounts, []), 'Conservative', 'pre-retirement', 0);
    expect(s.verdicts.some((v) => v.kind === 'concentrated' && /Banking stocks/.test(v.text))).toBe(true);
  });
  it('the pre-retiree persona surfaces horizon and income-need findings with clear advice', () => {
    const p = personaById('pre-retiree');
    const a = analyse(p.answers as Answers, normalise(p.accounts, p.documents));
    expect(a.suit.verdicts.map((v) => v.kind)).toEqual(expect.arrayContaining(['too-aggressive', 'short-horizon', 'needs-income']));
    expect(a.advice.headline.length).toBeGreaterThan(10);
  });
});

describe('B · every X-Ray finding explains why it may matter', () => {
  it('has a why-it-matters line for every category, worded as a possibility', () => {
    const x = runXRay({ sources: [], records: [], trades: [] });
    expect(x.findings).toEqual([]);
    for (const f of familyPortfolio.xray.findings) {
      expect(f.whyItMatters).toBe(WHY_IT_MATTERS[f.category]);
      expect(f.evidence.length).toBeGreaterThan(0);
      expect(f.nextSteps.length).toBeGreaterThan(0);
    }
    for (const text of Object.values(WHY_IT_MATTERS)) expect(text).not.toMatch(/fraud|proves|definitely/i);
  });
});

describe('D · Explore investments catalogue', () => {
  const required = ['fd', 'gsec', 'bond', 'equity-fund', 'debt-fund', 'stock', 'gold', 'ppf', 'nps', 'reit', 'invit'];
  it('covers every instrument the CA listed', () => {
    for (const id of required) expect(lessonById[id], id).toBeDefined();
  });
  it('every card has what / earn / risks / pros / cons / liquidity / tax / who-might-consider', () => {
    for (const l of INSTRUMENT_LESSONS) {
      for (const k of ['what', 'earn', 'risk', 'liquidity', 'tax', 'suits', 'oneLiner', 'taxChip'] as const) expect(l[k], `${l.id}.${k}`).toBeTruthy();
      expect(l.pros.length, l.id).toBeGreaterThanOrEqual(2);
      expect(l.cons.length, l.id).toBeGreaterThanOrEqual(2);
    }
  });
  it('unverified tax treatments are flagged, never silently presented as certain', () => {
    for (const id of ['gold', 'reit', 'invit', 'ppf', 'nps']) {
      expect(lessonById[id].verify, id).toBe(true);
      expect(lessonById[id].tax, id).toMatch(/to verify/);
    }
  });
  it('links only to official domains (each checked to respond during development)', () => {
    const allowed = ['rbiretaildirect.org.in', 'www.rbi.org.in', 'investor.sebi.gov.in', 'www.sebi.gov.in', 'www.amfiindia.com', 'npstrust.org.in', 'www.nsiindia.gov.in', 'www.indiapost.gov.in', 'www.incometax.gov.in'];
    for (const l of INSTRUMENT_LESSONS) for (const link of l.links) expect(allowed, `${l.id}: ${link.url}`).toContain(new URL(link.url).host);
  });
  it('explains REIT vs InvIT and Government Securities vs other bonds', () => {
    expect(REIT_VS_INVIT.length).toBeGreaterThanOrEqual(5);
    expect(REIT_VS_INVIT.find((r) => r.aspect === 'What it owns')!.invit).toMatch(/road|power|pipeline/i);
    const names = GOVT_VS_OTHER_BONDS.map((b) => b.name).join(' ');
    expect(names).toMatch(/Treasury Bills/);
    expect(names).toMatch(/Corporate bonds/);
  });
});

describe('G · Learn & Explore lessons and quizzes', () => {
  it('has 15 lessons including basics, liquidity, tax basics and common mistakes — basics first', () => {
    expect(topics).toHaveLength(15);
    for (const id of ['investing-basics', 'emergency-liquidity', 'tax-basics', 'mistakes', 'investment-risk', 'reits', 'invits', 'gsecs', 'bonds-basics', 'mutual-funds']) expect(topicById[id], id).toBeDefined();
    expect(topics.slice(0, 4).every((t) => t.category === 'Basics')).toBe(true);
  });
  it('every lesson has an example, sections, a valid 3-question quiz and real resources', () => {
    for (const t of topics) {
      expect(t.example.length, t.id).toBeGreaterThan(30);
      expect(t.sections.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.quiz, t.id).toHaveLength(3);
      for (const q of t.quiz) {
        expect(q.answer, t.id).toBeGreaterThanOrEqual(0);
        expect(q.answer, t.id).toBeLessThan(q.options.length);
        expect(q.why.length, t.id).toBeGreaterThan(10);
      }
      for (const r of t.resources) expect(resources[r], `${t.id}:${r}`).toBeDefined();
      for (const i of t.instruments ?? []) expect(lessonById[i], `${t.id}→${i}`).toBeDefined();
    }
  });
  it('the tax lesson discloses that rates are not independently verified', () => {
    expect(JSON.stringify(topicById['tax-basics'])).toMatch(/not been independently or legally verified/);
  });
  it('X-Ray findings link to existing lessons', () => {
    for (const f of familyPortfolio.xray.findings) expect(topicById[f.learnTopicId], f.learnTopicId).toBeDefined();
  });
  it('scores quizzes, counts passes and keeps the best score', () => {
    const t = topicById['tax-basics'];
    expect(scoreQuiz(t.quiz, t.quiz.map((q) => q.answer))).toBe(3);
    expect(scoreQuiz(t.quiz, [null, null, null])).toBe(0);
    const best = recordBest(recordBest({}, t.id, 3), t.id, 1);
    expect(best[t.id]).toBe(3);
    expect(passedCount(topics, { [t.id]: PASS_MARK, mistakes: 1 })).toBe(1);
  });
});

describe('E · Grow breakdown separates capital, growth, tax and today’s money', () => {
  const base = { mode: 'sip' as const, amount: 10000, years: 15, ratePct: 9, inflationPct: 5, marginalRate: 0.26 };
  it('invested + growth = value before tax; tax only when after-tax is on', () => {
    const b = breakdown(base);
    expect(b.invested).toBe(investedAt(base, 15));
    expect(b.invested + b.growth).toBeCloseTo(b.valueBeforeTax, 6);
    expect(b.tax).toBeNull();
    expect(b.todayMoney).toBeLessThan(b.valueBeforeTax);
  });
  it('estimates tax for equity funds, FDs and debt funds', () => {
    for (const inst of ['equity-fund', 'fd', 'debt-fund'] as const) {
      const b = breakdown({ ...base, afterTax: inst });
      expect(b.tax!, inst).toBeGreaterThan(0);
      expect(b.valueAfterTax! + b.tax!, inst).toBeCloseTo(b.valueBeforeTax, 4);
    }
  });
  it('never estimates tax for to-verify instruments', () => {
    const b = breakdown({ ...base, afterTax: 'to-verify' });
    expect(b.tax).toBeNull();
    expect(b.valueAfterTax).toBeNull();
  });
});

describe('H · assistant: instruments, literacy, lessons and safety', () => {
  const ctx = { portfolio: familyPortfolio, answers: family.answers as Answers, analysis: analyse(family.answers as Answers, familyPortfolio) };
  const json = (q: string) => JSON.stringify(respond(q, ctx));
  it('explains REITs, InvITs and direct stocks from the catalogue', () => {
    expect(json('what is a REIT?')).toMatch(/"lessonId":"reit"/);
    expect(json('tell me about InvITs')).toMatch(/"lessonId":"invit"/);
    expect(json('how do direct stocks work')).toMatch(/"lessonId":"stock"/);
  });
  it('answers literacy questions and links the right lesson', () => {
    expect(json('what is compounding?')).toMatch(/"topicId":"investing-basics"/);
    expect(json('why does diversification matter')).toMatch(/"topicId":"investment-risk"/);
    expect(json('what does liquidity mean')).toMatch(/"topicId":"emergency-liquidity"/);
    expect(json('how do I spot a scam')).toMatch(/"topicId":"mistakes"/);
    expect(json('How does tax affect me?')).toMatch(/"topicId":"tax-basics"/);
  });
  it('opens Explore investments and still refuses stock tips', () => {
    expect(json('what can I invest in?')).toMatch(/"tab":"learn"/);
    expect(json('which stock should I buy')).toMatch(/don’t give tips/);
  });
});
