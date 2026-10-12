import type { LifeStage } from '../config/profile';

/** Everything the user tells us (or confirms) during onboarding. All optional: "Not sure" is allowed. */
export interface Answers {
  lifeStage?: LifeStage | 'not-sure';
  age?: number;
  dependents?: number;
  goals?: string[];
  /** when most of the money may be needed: '<3' | '3-5' | '5-10' | '10+' | 'not-sure' */
  horizon?: string;
  /** need for regular income from investments: 'no' | 'some' | 'yes' | 'not-sure' */
  incomeNeed?: string;
  /** investing experience: 'none' | '<2' | '2-5' | '5+' | 'not-sure' */
  experience?: string;
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
