/**
 * Config for the risk, suitability and calculator engines (B6, B7, B9).
 * Weights and cut-offs live here so they can be tuned without code changes.
 */

export type LifeStage = 'starting' | 'building' | 'family' | 'peak' | 'pre-retirement' | 'retired';
export type RiskLabel = 'Conservative' | 'Moderate' | 'Aggressive';

export const LIFE_STAGES: LifeStage[] = ['starting', 'building', 'family', 'peak', 'pre-retirement', 'retired'];

export const RISK_CONFIG = {
  capacityWeights: { horizon: 0.25, dependents: 0.10, stability: 0.15, emi: 0.15, buffer: 0.20, surplus: 0.15 },
  /** score cut-offs: below `conservative` → Conservative; below `moderate` → Moderate; else Aggressive */
  cutoffs: { conservative: 40, moderate: 70 },
  retirementAge: 60,
  lifeStageAdjust: { starting: 5, building: 5, family: 0, peak: 0, 'pre-retirement': -10, retired: -15 } as Record<LifeStage, number>,
  /** months of expenses to keep as an emergency buffer, by life stage */
  bufferMonths: { starting: 4, building: 6, family: 6, peak: 6, 'pre-retirement': 9, retired: 12 } as Record<LifeStage, number>,
  variableIncomeExtraMonths: 3,
  tolerance: {
    fall20: { 'sell-all': 10, 'sell-some': 35, hold: 70, 'buy-more': 95, 'not-sure': 50 } as Record<string, number>,
    pickPortfolio: { A: 20, B: 55, C: 90, 'not-sure': 50 } as Record<string, number>,
    pastBehaviour: { sold: 15, held: 65, 'bought-more': 90, 'not-invested': 50, 'not-sure': 50 } as Record<string, number>,
  },
};

export type BroadKey = 'equity' | 'debt' | 'gold' | 'cash';
export type Allocation = Record<BroadKey, number>; // percentages summing to 100

export const TARGETS: Record<RiskLabel, Allocation> = {
  Conservative: { equity: 25, debt: 55, gold: 10, cash: 10 },
  Moderate: { equity: 50, debt: 35, gold: 10, cash: 5 },
  Aggressive: { equity: 70, debt: 20, gold: 5, cash: 5 },
};

/** equity shift (percentage points) by life stage; debt moves the opposite way */
export const LIFE_STAGE_EQUITY_SHIFT: Record<LifeStage, number> = {
  starting: 5, building: 5, family: 0, peak: 0, 'pre-retirement': -10, retired: -15,
};

export const SUITABILITY_CONFIG = {
  driftThreshold: 10,          // pp of equity drift before "too aggressive / too cautious"
  idleCashThreshold: 10,       // pp of cash above target (after the emergency buffer) before "idle cash"
  singleHoldingMax: 15,        // % of portfolio in one security
  singleSectorMax: 25,         // % of portfolio in direct stocks of one sector
  singleAccountMax: 60,        // % of portfolio in one account
};

export const RETURN_ASSUMPTIONS: Record<RiskLabel, { cautious: number; expected: number; optimistic: number }> = {
  Conservative: { cautious: 5, expected: 7, optimistic: 8.5 },
  Moderate: { cautious: 6, expected: 9, optimistic: 11 },
  Aggressive: { cautious: 7, expected: 11, optimistic: 13 },
};

export const CALC_DEFAULTS = { inflation: 5, milestone: 10000000 };

export const DISCLAIMERS = {
  short: 'Educational suitability insight on demo data — not personalised investment advice.',
  full: [
    'This prototype uses simulated Account Aggregator data. No real accounts are connected.',
    'Outputs are educational suitability insights, not personalised investment advice. The prototype is not a SEBI-registered adviser.',
    'Projections are illustrations based on assumed returns. Returns are not guaranteed and can be negative.',
    'Tax figures are estimates from a configurable table (FY 2026-27) using rates as stated in the design document. They have not been independently or legally verified, and some items are marked “to verify”. Check with a qualified professional.',
    'The assistant is scripted: its answers are assembled from fixed rules and a reviewed lesson library. No AI model is used.',
  ],
};
