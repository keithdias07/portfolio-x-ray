/**
 * Mock Account Aggregator (B4).
 * Keeps the real AA shape — consent request → approval → one fetch session per account →
 * data returned — so a real provider could replace it behind the same interface.
 * Nothing here talks to a network; data comes from the persona JSON files.
 */
import family from '../personas/family-stage.json';
import young from '../personas/young-starter.json';
import retiree from '../personas/pre-retiree.json';
import { AS_OF } from '../data/securities';

// ── raw payload shapes (deliberately different per account type) ─────────
export interface RawDematHolding {
  isin?: string; symbol?: string; name: string; qty: number; avgPrice: number | null;
  firstBuyDate: string | null; remark?: string; reportedYieldPct?: number; lastPrice?: number;
}
export interface RawDemat { id: string; type: 'DEMAT' | 'BOND_DEMAT'; fip: string; maskedId: string; asOf: string; holdings: RawDematHolding[]; trades?: { isin: string; date: string; side: 'BUY' | 'SELL'; qty: number; price: number }[] }
export interface RawMF { id: string; type: 'MUTUAL_FUNDS'; fip: string; maskedId: string; asOf: string; schemes: { schemeName: string; units: number; costValue: number | null; firstPurchaseDate: string | null }[] }
export interface RawDeposit { id: string; type: 'DEPOSIT'; fip: string; maskedId: string; asOf: string; balance: number; summary: { avgMonthlySalaryCredit: number; monthlySipDebits: number; monthlyEmiDebits: number; avgMonthlySpend: number } }
export interface RawTermDeposit { id: string; type: 'TERM_DEPOSIT'; fip: string; maskedId: string; asOf: string; principal: number; ratePct: number; startDate: string; maturityDate: string }
export type RawAccount = RawDemat | RawMF | RawDeposit | RawTermDeposit;

export interface RawManualImport { id: string; type: 'MANUAL_IMPORT'; name: string; asOf: string; rows: { name: string; isin?: string; account: string; qty: number; avgPrice: number | null }[] }
export interface RawCAS { id: string; type: 'CAS'; name: string; asOf: string; lines: { account: string; isin: string; name: string; qty: number }[] }
export type RawDocument = RawManualImport | RawCAS;

export interface PersonaAnswers {
  lifeStage: string; age: number; dependents: number; goals: string[]; incomeType: string; grossAnnual: number;
  monthlyIncome: number; monthlyExpenses: number; monthlyEmi: number; emergencyMonths: number; insurance: string[];
  fall20: string; pickPortfolio: string; pastBehaviour: string;
}
export interface Persona {
  id: string; displayName: string; tagline: string; answers: PersonaAnswers;
  accounts: RawAccount[]; documents: RawDocument[];
}

export const PERSONAS: Persona[] = [young, family, retiree] as unknown as Persona[];
export const personaById = (id: string) => PERSONAS.find((p) => p.id === id) ?? PERSONAS[1];

// ── consent ─────────────────────────────────────────────────────────────
export type ConsentStatus = 'pending' | 'approved' | 'rejected' | 'revoked' | 'expired';
export interface Consent {
  id: string;
  purpose: string;
  dataTypes: string[];
  dateRange: { from: string; to: string };
  frequency: string;
  duration: string;
  status: ConsentStatus;
  createdAt: string;
}

export const DATA_TYPES = [
  { id: 'holdings', label: 'Investment holdings', detail: 'Shares, ETFs, bonds, mutual funds' },
  { id: 'balances', label: 'Bank balances', detail: 'Savings and fixed deposits' },
  { id: 'transactions', label: 'Transaction summary', detail: 'Monthly salary, SIP and EMI totals — not individual payees' },
] as const;

export function createConsent(dataTypes: string[]): Consent {
  return {
    id: `CNS-${dataTypes.length}${dataTypes.join('').length}-DEMO`,
    purpose: 'Portfolio overview and educational suitability insight',
    dataTypes,
    dateRange: { from: '2025-10-01', to: AS_OF },
    frequency: 'On request (when you tap refresh)',
    duration: '6 months, revocable any time',
    status: 'pending',
    createdAt: AS_OF,
  };
}

export const approveConsent = (c: Consent): Consent => ({ ...c, status: 'approved' });
export const revokeConsent = (c: Consent): Consent => ({ ...c, status: 'revoked' });

// ── accounts & fetch sessions ──────────────────────────────────────────
export interface AccountSummary { id: string; fip: string; type: RawAccount['type']; maskedId: string; label: string; dataType: string }

const TYPE_LABEL: Record<RawAccount['type'], string> = {
  DEMAT: 'Demat account', BOND_DEMAT: 'Bond demat account', MUTUAL_FUNDS: 'Mutual fund folio', DEPOSIT: 'Savings account', TERM_DEPOSIT: 'Fixed deposit',
};

export function listAccounts(p: Persona, dataTypes: string[]): AccountSummary[] {
  return p.accounts
    .map((a) => ({
      id: a.id, fip: a.fip, type: a.type, maskedId: a.maskedId, label: TYPE_LABEL[a.type],
      dataType: a.type === 'DEPOSIT' || a.type === 'TERM_DEPOSIT' ? 'balances' : 'holdings',
    }))
    .filter((a) => dataTypes.includes(a.dataType));
}

export type FailureMode = 'none' | 'fail' | 'partial' | 'timeout';
export type FetchStatus = 'pending' | 'ready' | 'failed';
export interface FetchSession {
  accountId: string;
  status: FetchStatus;
  timestamp: string;
  partial?: boolean;
  error?: string;
  data?: RawAccount;
}

/** Synchronous core used by tests and by the async wrapper. */
export function fetchAccountSync(p: Persona, accountId: string, mode: FailureMode = 'none'): FetchSession {
  const acc = p.accounts.find((a) => a.id === accountId);
  const ts = `${AS_OF}T10:00:00+05:30`;
  if (!acc) return { accountId, status: 'failed', timestamp: ts, error: 'Account not found' };
  if (mode === 'fail') return { accountId, status: 'failed', timestamp: ts, error: `${acc.fip} didn’t respond. This happens sometimes with institutions’ servers.` };
  if (mode === 'timeout') return { accountId, status: 'failed', timestamp: ts, error: `${acc.fip} took too long to respond (timed out).` };
  if (mode === 'partial') {
    if (acc.type === 'DEMAT' || acc.type === 'BOND_DEMAT') {
      const half = Math.ceil(acc.holdings.length / 2);
      return { accountId, status: 'ready', timestamp: ts, partial: true, data: { ...acc, holdings: acc.holdings.slice(0, half) } };
    }
    if (acc.type === 'MUTUAL_FUNDS') {
      return { accountId, status: 'ready', timestamp: ts, partial: true, data: { ...acc, schemes: acc.schemes.slice(0, Math.ceil(acc.schemes.length / 2)) } };
    }
  }
  return { accountId, status: 'ready', timestamp: ts, data: acc };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Async fetch with a realistic delay; timeouts take longer before failing. */
export async function fetchAccount(p: Persona, accountId: string, mode: FailureMode = 'none', delayMs = 700): Promise<FetchSession> {
  await wait(mode === 'timeout' ? delayMs * 3 : delayMs);
  return fetchAccountSync(p, accountId, mode);
}

/** Mock OTP: any 6-digit code is accepted in demo mode. */
export const verifyOtp = (code: string) => /^\d{6}$/.test(code);
