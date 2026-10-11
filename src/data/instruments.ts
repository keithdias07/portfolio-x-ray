/**
 * Instrument lesson library (A7, B10 "content library"): written once and reviewed, not generated.
 * Four short lines per instrument: what it is, who it suits, the main risk, the tax angle.
 * General education only. Items marked verify:true depend on limits/rules to confirm officially.
 */
import { LIBRARY_TAX } from '../config/tax';

export interface InstrumentLesson {
  id: string;
  name: string;
  what: string;
  suits: string;
  risk: string;
  tax: string;
  taxChip: string;
  verify: boolean;
  topicId?: string;        // deeper lesson in Learn & Explore
  officialUrl?: string;
  broad: 'equity' | 'debt' | 'gold' | 'cash';
}

export const INSTRUMENT_LESSONS: InstrumentLesson[] = [
  {
    id: 'fd', name: 'Fixed deposits (FDs)', broad: 'debt',
    what: 'You lend money to a bank for a fixed period at a fixed interest rate.',
    suits: 'Money you need on a known date in the next 1–3 years, or an emergency fund top-up.',
    risk: 'Low, but interest often trails inflation after tax, and breaking early costs a penalty.',
    tax: 'Interest is added to your income and taxed at your slab rate every year, even if you don’t withdraw it.',
    taxChip: LIBRARY_TAX.fd.chip, verify: !LIBRARY_TAX.fd.verified,
  },
  {
    id: 'gsec', name: 'G-Secs & T-Bills (RBI Retail Direct)', broad: 'debt', topicId: 'gsecs', officialUrl: 'https://rbiretaildirect.org.in/',
    what: 'Loans to the Government of India. T-Bills last up to a year; dated G-Secs pay interest twice a year.',
    suits: 'Safety-first savers who want sovereign backing and can hold to maturity.',
    risk: 'Practically no default risk, but prices of long bonds fall when interest rates rise.',
    tax: 'Interest is taxed at your slab rate.',
    taxChip: LIBRARY_TAX.gsec.chip, verify: !LIBRARY_TAX.gsec.verified,
  },
  {
    id: 'bond', name: 'Corporate bonds', broad: 'debt', topicId: 'bonds-basics',
    what: 'Loans to companies that pay a fixed coupon and return your money at maturity.',
    suits: 'Investors wanting higher income than FDs who understand credit ratings.',
    risk: 'Credit risk (the company may not pay) and liquidity risk (hard to sell before maturity).',
    tax: 'Interest is taxed at your slab rate.',
    taxChip: LIBRARY_TAX.bond.chip, verify: !LIBRARY_TAX.bond.verified,
  },
  {
    id: 'debt-fund', name: 'Debt mutual funds', broad: 'debt', topicId: 'mutual-funds',
    what: 'Funds that hold many bonds and money-market instruments, run by a professional manager.',
    suits: 'Parking money for months to a few years with easy withdrawals.',
    risk: 'Interest-rate and credit risk depend on the fund — check its category and riskometer.',
    tax: 'For units bought on or after 1 April 2023, gains are taxed at your slab rate when you redeem — no yearly tax while invested.',
    taxChip: LIBRARY_TAX['debt-fund'].chip, verify: !LIBRARY_TAX['debt-fund'].verified,
  },
  {
    id: 'equity-fund', name: 'Equity mutual funds & index funds', broad: 'equity', topicId: 'mutual-funds',
    what: 'Funds that invest in many company shares; index funds simply track an index at low cost.',
    suits: 'Long-term goals 5+ years away, ideally via a monthly SIP.',
    risk: 'Market risk: values can fall 20–40% in bad years. Time and diversification help, but nothing is guaranteed.',
    tax: 'Gains are taxed at 20% if sold within a year; after a year, 12.5% on gains above ₹1.25 lakh a year.',
    taxChip: LIBRARY_TAX['equity-fund'].chip, verify: !LIBRARY_TAX['equity-fund'].verified,
  },
  {
    id: 'gold', name: 'Gold (ETFs, gold funds, SGBs)', broad: 'gold', topicId: 'etfs',
    what: 'Exposure to gold prices without storing physical gold.',
    suits: 'A small share (often 5–10%) to diversify; gold tends to behave differently from shares.',
    risk: 'Gold prices can stay flat or fall for years, and pay no regular income (except SGB interest).',
    tax: 'Tax treatment of gold ETFs and Sovereign Gold Bonds is marked “to verify” in our tax table.',
    taxChip: LIBRARY_TAX.gold.chip, verify: !LIBRARY_TAX.gold.verified,
  },
  {
    id: 'ppf', name: 'Public Provident Fund (PPF)', broad: 'debt',
    what: 'A government-backed savings scheme with a 15-year term; the rate is set by the government each quarter.',
    suits: 'Long-term, safety-first savers — especially under the old tax regime.',
    risk: 'Very low credit risk, but money is locked in for long periods (limited withdrawals).',
    tax: 'Generally tax-free interest and maturity; deposit limits and deductions are marked “to verify”.',
    taxChip: LIBRARY_TAX.ppf.chip, verify: !LIBRARY_TAX.ppf.verified,
  },
  {
    id: 'nps', name: 'National Pension System (NPS)', broad: 'equity',
    what: 'A retirement account regulated by PFRDA that invests in a mix of equity, bonds and G-Secs you choose.',
    suits: 'Retirement saving for people who want a disciplined, low-cost, locked-in route.',
    risk: 'Market-linked returns; most money is locked until 60 and part must buy an annuity.',
    tax: 'Some contributions and withdrawals get tax benefits; the rules are marked “to verify”.',
    taxChip: LIBRARY_TAX.nps.chip, verify: !LIBRARY_TAX.nps.verified,
  },
];

export const lessonById = Object.fromEntries(INSTRUMENT_LESSONS.map((l) => [l.id, l])) as Record<string, InstrumentLesson>;
