/**
 * Advice builder (B2 step 11): assembles one structured advice object from the engines.
 * The home card and the assistant both narrate this object; neither invents numbers.
 */
import { RETURN_ASSUMPTIONS, type BroadKey } from '../config/profile';
import type { CanonicalPortfolio } from './normalise';
import { SAVINGS_RATE } from './normalise';
import type { RiskResult } from './risk';
import type { Suitability, VerdictKind } from './suitability';
import { CLASS_LABEL } from './suitability';
import type { TaxProfile } from './tax';
import { lumpFV } from './calc';
import type { Answers } from './types';
import { fmtLakh } from '../lib/format';

export interface Suggestion { direction: 'increase' | 'reduce'; assetClass: BroadKey; amount: number; text: string; lessonIds: string[] }

export interface Advice {
  id: string;
  verdict: VerdictKind;
  severity: 'High' | 'Medium' | 'Low';
  verdictLine: string;
  headline: string;
  why: string[];
  suggestions: Suggestion[];
  taxLine?: string;
  doNothing: string;
  calcPrefill: { mode: 'sip' | 'lumpsum'; amount: number; years: number; ratePct: number };
  dataNote?: string;
}

export const VERDICT_LINE: Record<VerdictKind, string> = {
  fits: 'Your mix fits your profile',
  'too-cautious': 'A bit too cautious for your goals',
  'too-aggressive': 'More risk than your profile can carry',
  'idle-cash': 'Too much money sitting idle',
  concentrated: 'Too much riding on one holding',
};

const LESSONS_FOR: Record<BroadKey, string[]> = {
  equity: ['equity-fund', 'nps'],
  debt: ['debt-fund', 'gsec', 'fd', 'ppf'],
  gold: ['gold'],
  cash: ['fd', 'debt-fund'],
};

export function buildAdvice(a: Answers, risk: RiskResult, suit: Suitability, tax: TaxProfile, p: CanonicalPortfolio): Advice {
  const v = suit.primary;
  const ret = RETURN_ASSUMPTIONS[risk.label];
  const horizon = Math.min(risk.horizonYears, 15);
  const surplus = Math.max(0, (a.monthlyIncome ?? 0) - (a.monthlyExpenses ?? 0) - (a.monthlyEmi ?? 0));

  const suggestions: Suggestion[] = suit.gaps
    .filter((g) => Math.abs(g.drift) >= 5)
    .sort((x, y) => Math.abs(y.drift) - Math.abs(x.drift))
    .map((g) => ({
      direction: g.drift < 0 ? 'increase' : 'reduce',
      assetClass: g.assetClass,
      amount: Math.abs(g.amount),
      text: `${g.drift < 0 ? 'Increase' : 'Reduce'} ${CLASS_LABEL[g.assetClass].toLowerCase()} by about ${fmtLakh(Math.abs(g.amount))} (${g.current.toFixed(0)}% → ${g.target}%)`,
      lessonIds: g.drift < 0 ? LESSONS_FOR[g.assetClass] : [],
    }));

  let headline = '';
  let doNothing = '';
  let taxLine: string | undefined;
  let calcPrefill: Advice['calcPrefill'] = { mode: 'sip', amount: Math.max(1000, Math.round(surplus * 0.5 / 500) * 500), years: horizon, ratePct: ret.expected };
  const mPct = (tax.marginalRate * 100).toFixed(1);

  switch (v.kind) {
    case 'idle-cash': {
      const idle = suit.idleCash;
      const grown = lumpFV(idle, ret.expected, 10);
      const parked = lumpFV(idle, SAVINGS_RATE * 100, 10);
      headline = `${fmtLakh(idle)} is sitting idle beyond your emergency fund`;
      doNothing = `If it stays in savings at about ${(SAVINGS_RATE * 100).toFixed(2)}%, ${fmtLakh(idle)} could be about ${fmtLakh(parked)} in 10 years. At the ${ret.expected}% assumed for your ${risk.label.toLowerCase()} profile it could be about ${fmtLakh(grown)} — not guaranteed.`;
      taxLine = `Savings interest is taxed at your ${mPct}% marginal rate, so idle cash earns even less after tax.`;
      calcPrefill = { mode: 'lumpsum', amount: Math.round(idle / 1000) * 1000, years: 10, ratePct: ret.expected };
      break;
    }
    case 'too-cautious': {
      const eq = suit.gaps.find((g) => g.assetClass === 'equity')!;
      headline = 'Your money may grow slower than your goals need';
      doNothing = `Staying at ${eq.current.toFixed(0)}% equity keeps swings small, but over ${horizon} years a mostly-debt mix may not keep pace with inflation and your goals.`;
      const fd = p.holdings.find((h) => h.instrumentType === 'Fixed deposit');
      if (fd && tax.marginalRate > 0.2) taxLine = `At your ${mPct}% marginal rate, FD interest is taxed every year — that changes how FDs compare with equity funds for long goals.`;
      break;
    }
    case 'too-aggressive': {
      const eq = suit.gaps.find((g) => g.assetClass === 'equity')!;
      const fall = eq.current / 100 * suit.investable * 0.3;
      headline = 'Your portfolio takes more risk than your profile can carry';
      doNothing = `If markets fell 30%, your equity (${eq.current.toFixed(0)}% of your money) could drop by about ${fmtLakh(fall)}${risk.horizonYears <= 7 ? ` — just ${risk.horizonYears} years before you need it` : ', and a fall that size is harder to sit through than most people expect'}.`;
      taxLine = 'Selling equity held over a year: gains up to ₹1.25 lakh a year are exempt, so spreading sales across financial years can reduce tax.';
      calcPrefill = { mode: 'lumpsum', amount: Math.round(suit.investable / 1000) * 1000, years: Math.max(3, horizon), ratePct: ret.expected };
      break;
    }
    case 'concentrated': {
      const h = p.holdings.find((x) => x.holdingId === v.holdingId);
      headline = h ? `${h.name} is ${((h.currentValue / suit.investable) * 100).toFixed(0)}% of your money` : 'Too much is in one place';
      doNothing = h ? `If ${h.name} fell 40% — not unusual for a single company — you’d lose about ${fmtLakh(h.currentValue * 0.4)}.` : 'A problem in one place could hit your whole portfolio.';
      if (h && h.unrealisedGain && h.unrealisedGain > 0) taxLine = `Trimming it would realise gains; long-term equity gains up to ₹1.25 lakh a year are exempt, so staggering sales can reduce tax.`;
      break;
    }
    default:
      headline = 'Your mix fits your profile — keep it steady';
      doNothing = 'Doing nothing is reasonable here. Review once a year or after a big life change.';
  }

  const high = p.xray.findings.filter((f) => f.severity === 'High').length;
  return {
    id: `ADV-${v.kind}`,
    verdict: v.kind,
    severity: v.severity,
    verdictLine: VERDICT_LINE[v.kind],
    headline,
    why: [v.text, ...risk.reasons.slice(0, 1)],
    suggestions,
    taxLine,
    doNothing,
    calcPrefill,
    dataNote: high > 0 ? `${high} data issue${high > 1 ? 's' : ''} found while combining your accounts — fixed in these numbers, details in My money.` : undefined,
  };
}
