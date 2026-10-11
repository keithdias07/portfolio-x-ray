/**
 * Orchestrates the engines in B2 order (8 → 11). Also exposes a client-side facade whose shape
 * mirrors the API surface in B11, so a thin backend could replace it later without UI changes.
 */
import { computeRisk, stageOf, type RiskResult } from './risk';
import { assessSuitability, type Suitability } from './suitability';
import { buildTaxProfile, type TaxProfile } from './tax';
import { buildAdvice, type Advice } from './advice';
import { normalise, type CanonicalPortfolio, type ManualEntry, type Overrides } from './normalise';
import { createConsent, approveConsent, fetchAccount, listAccounts, revokeConsent, type FailureMode, type Persona, type RawAccount } from './aa';
import type { Answers } from './types';

export interface Analysis { risk: RiskResult; suit: Suitability; tax: TaxProfile; advice: Advice }

export function liquidCash(p: CanonicalPortfolio): number {
  return p.holdings.filter((h) => h.broadClass === 'cash' || h.instrumentType === 'Fixed deposit').reduce((s, h) => s + h.currentValue, 0);
}

export function analyse(answers: Answers, p: CanonicalPortfolio): Analysis {
  const risk = computeRisk(answers, liquidCash(p));
  const suit = assessSuitability(p, risk.label, stageOf(answers), risk.bufferTarget);
  const tax = buildTaxProfile(answers, p);
  const advice = buildAdvice(answers, risk, suit, tax, p);
  return { risk, suit, tax, advice };
}

/** B11-shaped facade (no network: every call runs locally). */
export const api = {
  aa: {
    consent: (dataTypes: string[]) => approveConsent(createConsent(dataTypes)),
    accounts: listAccounts,
    fetch: (p: Persona, accountId: string, mode: FailureMode) => fetchAccount(p, accountId, mode),
    revoke: revokeConsent,
  },
  portfolio: {
    normalise: (accounts: RawAccount[], p: Persona, includeDocs: string[], overrides: Overrides, manual: ManualEntry[]) =>
      normalise(accounts, p.documents.filter((d) => includeDocs.includes(d.id)), overrides, manual),
  },
  analyse,
};
