import type { LifeStage } from '../config/profile';

/** Everything the user tells us (or confirms) during onboarding. All optional: "Not sure" is allowed. */
export interface Answers {
  lifeStage?: LifeStage | 'not-sure';
  age?: number;
  dependents?: number;
  goals?: string[];
  incomeType?: 'salaried' | 'variable' | 'not-sure';
  grossAnnual?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  monthlyEmi?: number;
  emergencyMonths?: number;
  insurance?: string[];
  fall20?: string;
  pickPortfolio?: string;
  pastBehaviour?: string;
  regime?: 'new' | 'old';
  oldDeductions?: number;
}
