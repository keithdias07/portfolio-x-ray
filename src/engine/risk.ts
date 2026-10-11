/**
 * Risk engine (B6): capacity (ability) and tolerance (willingness) scores, final profile = the lower.
 * Deterministic and config-driven (src/config/profile.ts).
 */
import { RISK_CONFIG, type LifeStage, type RiskLabel } from '../config/profile';
import type { Answers } from './types';
import { fmtLakh } from '../lib/format';

export interface RiskFactor { key: string; label: string; score: number; note: string }

export interface RiskResult {
  label: RiskLabel;
  capacityScore: number;
  toleranceScore: number;
  capacityLabel: RiskLabel;
  toleranceLabel: RiskLabel;
  limiting: 'capacity' | 'tolerance' | 'none';
  horizonYears: number;
  bufferMonths: number;
  bufferTarget: number;
  bufferCoverMonths: number;
  capacityFactors: RiskFactor[];
  toleranceFactors: RiskFactor[];
  transparency: string;
  reasons: string[];
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
export const labelFor = (score: number): RiskLabel =>
  score < RISK_CONFIG.cutoffs.conservative ? 'Conservative' : score < RISK_CONFIG.cutoffs.moderate ? 'Moderate' : 'Aggressive';

export const STAGE_LABEL: Record<LifeStage, string> = {
  starting: 'just starting out', building: 'building up', family: 'family stage', peak: 'peak earning',
  'pre-retirement': 'pre-retirement', retired: 'retired',
};

export function stageOf(a: Answers): LifeStage {
  return a.lifeStage && a.lifeStage !== 'not-sure' ? a.lifeStage : 'building';
}

export function bufferMonthsFor(a: Answers): number {
  const base = RISK_CONFIG.bufferMonths[stageOf(a)];
  return base + (a.incomeType === 'variable' ? RISK_CONFIG.variableIncomeExtraMonths : 0);
}

/** liquidCash = savings balances + fixed deposits that can be broken in an emergency */
export function computeRisk(a: Answers, liquidCash: number): RiskResult {
  const stage = stageOf(a);
  const age = a.age ?? 35;
  const horizonYears = stage === 'retired' ? 5 : Math.max(1, RISK_CONFIG.retirementAge - age);
  const income = a.monthlyIncome ?? 0;
  const expenses = a.monthlyExpenses ?? income * 0.6;
  const emi = a.monthlyEmi ?? 0;
  const deps = a.dependents ?? 1;
  const bufferMonths = bufferMonthsFor(a);
  const bufferTarget = expenses * bufferMonths;
  const bufferCoverMonths = expenses > 0 ? liquidCash / expenses : 0;
  const emiRatio = income > 0 ? emi / income : 0;
  const surplusRatio = income > 0 ? (income - expenses - emi) / income : 0;

  const cap: RiskFactor[] = [
    { key: 'horizon', label: 'Time horizon', score: clamp((horizonYears / 25) * 100), note: `About ${horizonYears} years to ${stage === 'retired' ? 'your main goals' : 'retirement'}` },
    { key: 'dependents', label: 'Dependents', score: [100, 75, 55][deps] ?? 40, note: deps === 0 ? 'No one depends on your income' : `${deps} ${deps === 1 ? 'person depends' : 'people depend'} on your income` },
    { key: 'stability', label: 'Income stability', score: a.incomeType === 'salaried' ? 80 : a.incomeType === 'variable' ? 45 : 60, note: a.incomeType === 'variable' ? 'Variable income' : a.incomeType === 'salaried' ? 'Steady salary' : 'Income type not given' },
    { key: 'emi', label: 'EMI burden', score: emiRatio < 0.1 ? 100 : emiRatio < 0.25 ? 75 : emiRatio < 0.4 ? 45 : 20, note: emi > 0 ? `EMIs take ${Math.round(emiRatio * 100)}% of your take-home pay` : 'No EMIs' },
    { key: 'buffer', label: 'Emergency buffer', score: clamp(bufferTarget > 0 ? (liquidCash / bufferTarget) * 100 : 50), note: `Cash covers ${bufferCoverMonths.toFixed(1)} months of expenses (suggested ${bufferMonths})` },
    { key: 'surplus', label: 'Monthly surplus', score: clamp((surplusRatio / 0.3) * 100), note: surplusRatio > 0 ? `About ${fmtLakh(income - expenses - emi)} left each month` : 'Little or nothing left each month' },
  ];
  const w = RISK_CONFIG.capacityWeights;
  const weighted = cap.reduce((s, f) => s + f.score * w[f.key as keyof typeof w], 0);
  const capacityScore = Math.round(clamp(weighted + RISK_CONFIG.lifeStageAdjust[stage]));

  const t = RISK_CONFIG.tolerance;
  const tol: RiskFactor[] = [
    { key: 'fall20', label: 'If investments fell 20%', score: t.fall20[a.fall20 ?? 'not-sure'] ?? 50, note: ({ 'sell-all': 'You’d sell everything', 'sell-some': 'You’d sell some', hold: 'You’d hold steady', 'buy-more': 'You’d buy more', 'not-sure': 'Not sure' } as Record<string, string>)[a.fall20 ?? 'not-sure'] },
    { key: 'pick', label: 'Preferred range of outcomes', score: t.pickPortfolio[a.pickPortfolio ?? 'not-sure'] ?? 50, note: ({ A: 'Prefers small swings', B: 'Accepts moderate swings', C: 'Accepts large swings for higher growth', 'not-sure': 'Not sure' } as Record<string, string>)[a.pickPortfolio ?? 'not-sure'] },
    { key: 'past', label: 'Past behaviour in a fall', score: t.pastBehaviour[a.pastBehaviour ?? 'not-sure'] ?? 50, note: ({ sold: 'Sold during a past fall', held: 'Held during a past fall', 'bought-more': 'Bought more in a past fall', 'not-invested': 'Wasn’t invested then', 'not-sure': 'Not sure' } as Record<string, string>)[a.pastBehaviour ?? 'not-sure'] },
  ];
  const toleranceScore = Math.round(tol.reduce((s, f) => s + f.score, 0) / tol.length);

  const capacityLabel = labelFor(capacityScore);
  const toleranceLabel = labelFor(toleranceScore);
  const finalScore = Math.min(capacityScore, toleranceScore);
  const label = labelFor(finalScore);
  const limiting = capacityLabel === toleranceLabel ? 'none' : capacityScore < toleranceScore ? 'capacity' : 'tolerance';

  const weakest = [...cap].sort((x, y) => x.score - y.score).slice(0, 2);
  const strongest = [...cap].sort((x, y) => y.score - x.score)[0];
  const reasons = [
    `${strongest.note} — this helps your ability to take risk.`,
    ...weakest.map((f) => `${f.note} — this limits how much risk you can carry.`),
  ];

  return {
    label, capacityScore, toleranceScore, capacityLabel, toleranceLabel, limiting, horizonYears,
    bufferMonths, bufferTarget, bufferCoverMonths, capacityFactors: cap, toleranceFactors: tol, reasons,
    transparency: `Based on your stage (${STAGE_LABEL[stage]}, about ${horizonYears} years to ${stage === 'retired' ? 'your goals' : 'retirement'}), your capacity is ${capacityLabel.toLowerCase()}.`,
  };
}
