/**
 * Suitability engine (B7): compares the canonical portfolio with a target allocation looked up
 * by risk profile and life stage. Produces verdicts with severity, gaps and a direction of change.
 */
import { LIFE_STAGE_EQUITY_SHIFT, SUITABILITY_CONFIG, TARGETS, type Allocation, type BroadKey, type LifeStage, type RiskLabel } from '../config/profile';
import type { CanonicalPortfolio } from './normalise';
import type { InstrumentType } from '../data/securities';

export type VerdictKind = 'fits' | 'too-aggressive' | 'too-cautious' | 'idle-cash' | 'concentrated';
export interface Verdict { kind: VerdictKind; severity: 'High' | 'Medium' | 'Low'; text: string; holdingId?: string }
export interface Gap { assetClass: BroadKey; current: number; target: number; drift: number; amount: number }

export interface Suitability {
  target: Allocation;
  current: Allocation;
  gaps: Gap[];
  verdicts: Verdict[];
  primary: Verdict;
  idleCash: number;
  investable: number;
}

export const CLASS_LABEL: Record<BroadKey, string> = { equity: 'Equity', debt: 'Debt', gold: 'Gold', cash: 'Cash' };

export function targetAllocation(label: RiskLabel, stage: LifeStage): Allocation {
  const base = TARGETS[label];
  const shift = LIFE_STAGE_EQUITY_SHIFT[stage];
  const equity = Math.max(10, Math.min(85, base.equity + shift));
  const debt = Math.max(5, base.debt - (equity - base.equity));
  const rest = 100 - equity - debt - base.gold;
  return { equity, debt, gold: base.gold, cash: rest };
}

const SEV_ORDER = { High: 0, Medium: 1, Low: 2 } as const;
const SINGLE_ISSUER: InstrumentType[] = ['Direct stock', 'Corporate bond', 'REIT', 'InvIT', 'Other'];
// when idle cash and "too cautious" both fire, the excess cash is the cause — lead with it
const KIND_ORDER: VerdictKind[] = ['too-aggressive', 'idle-cash', 'too-cautious', 'concentrated', 'fits'];

export function assessSuitability(p: CanonicalPortfolio, label: RiskLabel, stage: LifeStage, bufferTarget: number): Suitability {
  const c = SUITABILITY_CONFIG;
  const investable = p.totalValue - p.byClass.other;
  const pct = (v: number) => (investable > 0 ? (v / investable) * 100 : 0);
  const current: Allocation = { equity: pct(p.byClass.equity), debt: pct(p.byClass.debt), gold: pct(p.byClass.gold), cash: pct(p.byClass.cash) };
  const target = targetAllocation(label, stage);
  const gaps: Gap[] = (Object.keys(target) as BroadKey[]).map((k) => ({
    assetClass: k, current: current[k], target: target[k], drift: current[k] - target[k], amount: ((current[k] - target[k]) / 100) * investable,
  }));

  const verdicts: Verdict[] = [];
  const eq = gaps.find((g) => g.assetClass === 'equity')!;
  if (eq.drift > c.driftThreshold) verdicts.push({ kind: 'too-aggressive', severity: eq.drift > 20 ? 'High' : 'Medium', text: `Equity is ${eq.current.toFixed(0)}% against a suggested ${eq.target}% for a ${label.toLowerCase()} profile.` });
  if (eq.drift < -c.driftThreshold) verdicts.push({ kind: 'too-cautious', severity: eq.drift < -20 ? 'High' : 'Medium', text: `Equity is ${eq.current.toFixed(0)}% against a suggested ${eq.target}% for a ${label.toLowerCase()} profile.` });

  const cashGap = gaps.find((g) => g.assetClass === 'cash')!;
  const idleCash = Math.max(0, p.byClass.cash - Math.max(bufferTarget, (target.cash / 100) * investable));
  if (cashGap.drift > c.idleCashThreshold && idleCash > 0) {
    verdicts.push({ kind: 'idle-cash', severity: cashGap.drift > 25 ? 'High' : 'Medium', text: `Cash is ${cashGap.current.toFixed(0)}% of your money; about ₹${Math.round(idleCash).toLocaleString('en-IN')} sits beyond your emergency buffer.` });
  }

  for (const h of p.holdings) {
    // diversified funds/ETFs, deposits and cash aren't single-issuer risk
    if (!SINGLE_ISSUER.includes(h.instrumentType)) continue;
    const share = pct(h.currentValue);
    if (share > c.singleHoldingMax) {
      verdicts.push({ kind: 'concentrated', severity: share > 25 ? 'High' : 'Medium', text: `${h.name} is ${share.toFixed(0)}% of your portfolio.`, holdingId: h.holdingId });
    }
  }
  for (const a of p.accountValues) {
    const share = pct(a.value);
    if (share > c.singleAccountMax) verdicts.push({ kind: 'concentrated', severity: 'Low', text: `${share.toFixed(0)}% of your portfolio is in one account (${a.label}).` });
  }

  verdicts.sort((x, y) => SEV_ORDER[x.severity] - SEV_ORDER[y.severity] || KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind));
  const primary: Verdict = verdicts[0] ?? { kind: 'fits', severity: 'Low', text: `Your mix is within ${c.driftThreshold} points of the suggested allocation.` };
  return { target, current, gaps, verdicts, primary, idleCash, investable };
}
