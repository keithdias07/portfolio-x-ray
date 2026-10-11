/**
 * Normalisation pipeline (B5): raw AA payloads + documents → one canonical portfolio
 * and a data-quality report. The X-Ray rules engine runs inside step 7 (quality checks).
 */
import {
  AS_OF, PRICE_SOURCE, instrumentById, priceById, resolveSecurity,
  type BroadClass, type DataSource, type InstrumentType, type SourceRecord, type TaxRule, type Trade,
} from '../data/securities';
import { runXRay, type Finding, type XRayResult } from './xray';
import type { RawAccount, RawDocument } from './aa';
import { daysBetween } from '../lib/format';

export const SAVINGS_RATE = 0.0275; // assumed savings-account interest (demo)

export interface SourceAccountRef { label: string; accountId: string; quantity: number }

export type QualityFlag = 'missing-cost' | 'missing-date' | 'stale-price' | 'unmatched' | 'duplicate' | 'corporate-action' | 'quantity-conflict' | 'yield-label' | 'rounding';

export interface CanonicalHolding {
  holdingId: string;
  securityId: string | null;
  name: string;
  instrumentType: InstrumentType;
  broadClass: BroadClass;
  taxRule: TaxRule;
  quantity: number;
  avgCost: number | null;
  costEstimated: boolean;
  purchaseDate: string | null;
  purchaseDateEstimated: boolean;
  currentPrice: number;
  priceDate: string;
  priceApprox: boolean;
  currentValue: number;
  unrealisedGain: number | null;
  holdingMonths: number | null;
  holdingPeriodBucket: '< 1 yr' | '1–3 yrs' | '3+ yrs' | 'Unknown';
  annualInterest: number;          // slab-taxed recurring income (coupons, FD, savings)
  sourceAccounts: SourceAccountRef[];
  qualityFlags: QualityFlag[];
  xrayFindingIds: string[];
  note?: string;
}

export interface QualityPrompt {
  id: string;
  kind: 'missing-cost' | 'missing-date' | 'unmatched' | 'xray';
  holdingId: string;
  title: string;
  detail: string;
  /** ask only when it matters (B5/B13); otherwise skip with an estimate */
  ask: boolean;
  findingId?: string;
}

export interface RejectedRecord { account: string; reason: string; raw: string }

export interface BankSummary { balance: number; salaryCredit: number; sipDebits: number; emiDebits: number; spend: number }

export interface CanonicalPortfolio {
  asOf: string;
  holdings: CanonicalHolding[];
  totalValue: number;
  byClass: Record<BroadClass, number>;
  accountsCount: number;
  accountValues: { label: string; value: number }[];
  bank: BankSummary | null;
  xray: XRayResult;
  prompts: QualityPrompt[];
  rejected: RejectedRecord[];
  naiveTotal: number;
}

export interface Overrides { [holdingId: string]: { avgCost?: number; purchaseDate?: string; broadClass?: BroadClass } }

export interface ManualEntry { id: string; name: string; value: number; broadClass: BroadClass }

const KIND: Record<string, DataSource['kind']> = { DEMAT: 'broker', BOND_DEMAT: 'bond-platform', MUTUAL_FUNDS: 'rta' };

const monthsBetween = (a: string, b: string) => Math.floor(daysBetween(a, b) / 30.44);
const bucket = (m: number | null): CanonicalHolding['holdingPeriodBucket'] => (m == null ? 'Unknown' : m < 12 ? '< 1 yr' : m < 36 ? '1–3 yrs' : '3+ yrs');

export function normalise(
  accounts: RawAccount[],
  documents: RawDocument[],
  overrides: Overrides = {},
  manual: ManualEntry[] = [],
  asOf: string = AS_OF,
): CanonicalPortfolio {
  const sources: DataSource[] = [];
  const records: SourceRecord[] = [];
  const trades: Trade[] = [];
  const rejected: RejectedRecord[] = [];
  const unmatched: CanonicalHolding[] = [];
  const cash: CanonicalHolding[] = [];
  let bank: BankSummary | null = null;
  let rid = 0;
  const valid = (q: unknown) => typeof q === 'number' && Number.isFinite(q) && q > 0;

  for (const a of accounts) {
    if (a.type === 'DEMAT' || a.type === 'BOND_DEMAT') {
      sources.push({ id: a.id, name: `${a.fip} – ${a.type === 'BOND_DEMAT' ? 'bond ' : ''}holdings`, shortName: a.fip.replace('Demo ', ''), kind: KIND[a.type], asOf: a.asOf, description: `${a.fip} ${a.maskedId} via Account Aggregator (simulated)`, role: 'holding', priority: 1 });
      for (const h of a.holdings) {
        const raw = `${h.name} | ${h.isin ?? h.symbol ?? '—'} | QTY ${h.qty} | AVG ${h.avgPrice ?? '—'}`;
        if (!valid(h.qty)) { rejected.push({ account: a.maskedId, reason: 'Quantity missing or not a positive number', raw }); continue; }
        const id = resolveSecurity({ id: h.isin, name: h.name, symbol: h.symbol });
        if (!id) {
          const price = h.lastPrice ?? h.avgPrice ?? 0;
          unmatched.push({
            holdingId: `H-OTHER-${unmatched.length + 1}`, securityId: null, name: h.name, instrumentType: 'Other', broadClass: 'other', taxRule: 'equity',
            quantity: h.qty, avgCost: h.avgPrice, costEstimated: false, purchaseDate: h.firstBuyDate, purchaseDateEstimated: false,
            currentPrice: price, priceDate: a.asOf, priceApprox: true, currentValue: h.qty * price,
            unrealisedGain: h.avgPrice != null ? h.qty * (price - h.avgPrice) : null, holdingMonths: h.firstBuyDate ? monthsBetween(h.firstBuyDate, asOf) : null,
            holdingPeriodBucket: bucket(h.firstBuyDate ? monthsBetween(h.firstBuyDate, asOf) : null), annualInterest: 0,
            sourceAccounts: [{ label: `${a.fip} ${a.maskedId}`, accountId: a.maskedId, quantity: h.qty }], qualityFlags: ['unmatched'], xrayFindingIds: [],
            note: `“${h.name}” could not be matched to a known security, so it is kept as Other and valued at the price in the statement.`,
          });
          continue;
        }
        records.push({ id: `r${++rid}`, sourceId: a.id, instrumentId: id, nameAsReported: h.name, accountId: a.maskedId, quantity: h.qty, avgCost: h.avgPrice, purchaseDate: h.firstBuyDate, reportedYieldPct: h.reportedYieldPct, note: h.remark, raw });
      }
      for (const t of a.trades ?? []) {
        const id = resolveSecurity({ id: t.isin });
        if (id) trades.push({ id: `t${trades.length + 1}`, sourceId: a.id, instrumentId: id, accountId: a.maskedId, date: t.date, side: t.side, quantity: t.qty, price: t.price });
      }
    } else if (a.type === 'MUTUAL_FUNDS') {
      sources.push({ id: a.id, name: `${a.fip} – mutual fund statement`, shortName: 'MF RTA', kind: 'rta', asOf: a.asOf, description: `${a.maskedId} via Account Aggregator (simulated)`, role: 'holding', priority: 1 });
      for (const s of a.schemes) {
        const raw = `${s.schemeName} | Units ${s.units} | Cost ${s.costValue ?? '—'}`;
        if (!valid(s.units)) { rejected.push({ account: a.maskedId, reason: 'Units missing or not a positive number', raw }); continue; }
        const id = resolveSecurity({ name: s.schemeName });
        if (!id) { rejected.push({ account: a.maskedId, reason: 'Scheme not recognised', raw }); continue; }
        records.push({ id: `r${++rid}`, sourceId: a.id, instrumentId: id, nameAsReported: s.schemeName, accountId: a.maskedId, quantity: s.units, avgCost: s.costValue != null ? +(s.costValue / s.units).toFixed(4) : null, purchaseDate: s.firstPurchaseDate, raw });
      }
    } else if (a.type === 'DEPOSIT') {
      bank = { balance: a.balance, salaryCredit: a.summary.avgMonthlySalaryCredit, sipDebits: a.summary.monthlySipDebits, emiDebits: a.summary.monthlyEmiDebits, spend: a.summary.avgMonthlySpend };
      cash.push(cashHolding(`H-SB-${a.id}`, `Savings · ${a.fip}`, 'Savings account', 'cash', 'savings', a.balance, a.balance * SAVINGS_RATE, `${a.fip} ${a.maskedId}`, a.maskedId, a.asOf, null));
    } else if (a.type === 'TERM_DEPOSIT') {
      cash.push(cashHolding(`H-FD-${a.id}`, `Fixed deposit ${a.ratePct}% · ${a.fip}`, 'Fixed deposit', 'debt', 'slab', a.principal, a.principal * a.ratePct / 100, `${a.fip} ${a.maskedId}`, a.maskedId, a.asOf, a.startDate));
    }
  }

  for (const d of documents) {
    if (d.type === 'MANUAL_IMPORT') {
      sources.push({ id: d.id, name: d.name, shortName: 'Tracker CSV', kind: 'manual', asOf: d.asOf, description: 'Spreadsheet imported manually earlier', role: 'holding', priority: 3 });
      for (const row of d.rows) {
        const id = resolveSecurity({ id: row.isin, name: row.name });
        const raw = `"${row.name}","${row.isin ?? ''}","${row.account}",${row.qty},${row.avgPrice ?? ''}`;
        if (!id || !valid(row.qty)) { rejected.push({ account: d.name, reason: !id ? 'Security not recognised' : 'Invalid quantity', raw }); continue; }
        records.push({ id: `r${++rid}`, sourceId: d.id, instrumentId: id, nameAsReported: row.name, accountId: row.account, quantity: row.qty, avgCost: row.avgPrice, raw });
      }
    } else {
      sources.push({ id: d.id, name: d.name, shortName: 'CAS', kind: 'depository', asOf: d.asOf, description: 'Month-end depository statement used to cross-check', role: 'reference', priority: 0 });
      for (const l of d.lines) {
        const id = resolveSecurity({ id: l.isin, name: l.name });
        if (id) records.push({ id: `c${++rid}`, sourceId: d.id, instrumentId: id, nameAsReported: l.name, accountId: l.account, quantity: l.qty, avgCost: null, raw: `${l.name}  ${l.isin}  ${l.qty.toFixed(3)}` });
      }
    }
  }

  const xray = runXRay({ sources, records, trades, asOf });
  const findingsById = Object.fromEntries(xray.findings.map((f) => [f.id, f])) as Record<string, Finding>;

  // merge reconciled positions across accounts (B5 step 4)
  const bySec = new Map<string, typeof xray.positions>();
  for (const p of xray.positions) {
    if (!bySec.has(p.instrument.id)) bySec.set(p.instrument.id, []);
    bySec.get(p.instrument.id)!.push(p);
  }
  const securities: CanonicalHolding[] = [];
  for (const [secId, ps] of bySec) {
    const inst = instrumentById[secId];
    const pq = priceById[secId];
    const quantity = ps.reduce((s, p) => s + p.quantity, 0);
    const allCost = ps.every((p) => p.costPerUnit != null);
    const avgCost = allCost ? ps.reduce((s, p) => s + p.costPerUnit! * p.quantity, 0) / quantity : null;
    const dates = ps.map((p) => p.purchaseDate).filter(Boolean) as string[];
    const purchaseDate = dates.length ? dates.sort()[0] : null;
    const findingIds = ps.flatMap((p) => p.findingIds);
    const flags = new Set<QualityFlag>(findingIds.map((id) => findingsById[id].category as QualityFlag));
    if (!purchaseDate) flags.add('missing-date');
    const value = quantity * pq.price;
    const annualInterest = inst.bond ? quantity * inst.bond.face * inst.bond.couponRate : 0;
    securities.push({
      holdingId: `H-${secId}`, securityId: secId, name: inst.name, instrumentType: inst.instrumentType, broadClass: inst.broadClass, taxRule: inst.taxRule,
      quantity, avgCost, costEstimated: false, purchaseDate, purchaseDateEstimated: false,
      currentPrice: pq.price, priceDate: pq.priceDate, priceApprox: daysBetween(pq.priceDate, asOf) > 7, currentValue: value,
      unrealisedGain: avgCost != null ? value - avgCost * quantity : null,
      holdingMonths: purchaseDate ? monthsBetween(purchaseDate, asOf) : null, holdingPeriodBucket: bucket(purchaseDate ? monthsBetween(purchaseDate, asOf) : null),
      annualInterest,
      sourceAccounts: ps.map((p) => ({ label: `${sourceLabel(sources, p.primary.sourceId)} ${p.accountId}`, accountId: p.accountId, quantity: p.quantity })),
      qualityFlags: [...flags], xrayFindingIds: findingIds,
    });
  }

  const manualHoldings: CanonicalHolding[] = manual.map((m) => cashHolding(m.id, m.name, 'Manual entry', m.broadClass, m.broadClass === 'equity' ? 'equity' : 'slab', m.value, 0, 'Added manually', 'Manual', asOf, null));

  let holdings = [...securities, ...unmatched, ...cash, ...manualHoldings];

  // apply user edits and estimates (A3 step 6 / B13)
  holdings = holdings.map((h) => {
    const o = overrides[h.holdingId] ?? {};
    let next = { ...h };
    if (o.broadClass) next = { ...next, broadClass: o.broadClass, qualityFlags: next.qualityFlags.filter((f) => f !== 'unmatched') };
    if (o.avgCost != null) {
      next = { ...next, avgCost: o.avgCost, unrealisedGain: next.currentValue - o.avgCost * next.quantity, qualityFlags: next.qualityFlags.filter((f) => f !== 'missing-cost') };
    }
    if (o.purchaseDate) {
      const m = monthsBetween(o.purchaseDate, asOf);
      next = { ...next, purchaseDate: o.purchaseDate, holdingMonths: m, holdingPeriodBucket: bucket(m), qualityFlags: next.qualityFlags.filter((f) => f !== 'missing-date') };
    } else if (!next.purchaseDate && next.broadClass !== 'cash' && next.instrumentType !== 'Other' && next.instrumentType !== 'Manual entry') {
      // estimate: assume held over a year, with a visible note
      next = { ...next, purchaseDateEstimated: true, holdingMonths: 13, holdingPeriodBucket: '1–3 yrs' };
    }
    return next;
  });

  holdings.sort((a, b) => b.currentValue - a.currentValue);
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const byClass: Record<BroadClass, number> = { equity: 0, debt: 0, gold: 0, cash: 0, other: 0 };
  holdings.forEach((h) => { byClass[h.broadClass] += h.currentValue; });

  const accMap = new Map<string, number>();
  // investment accounts only — bank balances, deposits and manual entries aren't "one account" risk
  holdings
    .filter((h) => !['Savings account', 'Fixed deposit', 'Manual entry'].includes(h.instrumentType))
    .forEach((h) => h.sourceAccounts.forEach((s) => accMap.set(s.label, (accMap.get(s.label) ?? 0) + (h.currentValue * s.quantity) / h.quantity)));

  // quality prompts — ask only when it matters (B5 step 8, B13)
  const prompts: QualityPrompt[] = [];
  for (const h of holdings) {
    const share = totalValue ? h.currentValue / totalValue : 0;
    if (h.qualityFlags.includes('missing-cost')) {
      prompts.push({ id: `P-cost-${h.holdingId}`, kind: 'missing-cost', holdingId: h.holdingId, title: `Purchase price for ${h.name}`, detail: 'Needed to estimate gains and tax when you sell. You can skip — we’ll show gains as unknown.', ask: h.taxRule === 'equity' || h.taxRule === 'slab' });
    }
    if (h.qualityFlags.includes('missing-date')) {
      prompts.push({ id: `P-date-${h.holdingId}`, kind: 'missing-date', holdingId: h.holdingId, title: `Purchase date for ${h.name}`, detail: share > 0.05 ? 'This is a large holding, so the date changes the tax estimate (under or over 1 year).' : 'We’ve assumed it’s been held over a year. Add the date for a more accurate estimate.', ask: share > 0.05 });
    }
    if (h.qualityFlags.includes('unmatched')) {
      prompts.push({ id: `P-unm-${h.holdingId}`, kind: 'unmatched', holdingId: h.holdingId, title: `We couldn’t identify “${h.name}”`, detail: share > 0.02 ? 'It’s a material share of your portfolio. Tell us what type of investment it is.' : 'It’s small (under 2% of your portfolio), so we’ve kept it as Other.', ask: share > 0.02 });
    }
  }
  for (const f of xray.findings.filter((x) => x.category !== 'missing-cost' && x.category !== 'rounding')) {
    const h = holdings.find((x) => x.xrayFindingIds.includes(f.id));
    prompts.push({ id: `P-x-${f.id}`, kind: 'xray', holdingId: h?.holdingId ?? '', title: f.title, detail: f.summary, ask: f.severity === 'High', findingId: f.id });
  }

  return {
    asOf, holdings, totalValue, byClass,
    accountsCount: accounts.length,
    accountValues: [...accMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    bank, xray, prompts, rejected,
    naiveTotal: xray.totals.naive + cash.reduce((s, c) => s + c.currentValue, 0) + unmatched.reduce((s, u) => s + u.currentValue, 0) + manualHoldings.reduce((s, m) => s + m.currentValue, 0),
  };
}

function sourceLabel(sources: DataSource[], id: string) {
  const s = sources.find((x) => x.id === id);
  return s ? s.shortName : id;
}

function cashHolding(holdingId: string, name: string, type: InstrumentType, broadClass: BroadClass, taxRule: TaxRule, value: number, annualInterest: number, label: string, accountId: string, asOf: string, start: string | null): CanonicalHolding {
  const m = start ? monthsBetween(start, AS_OF) : null;
  return {
    holdingId, securityId: null, name, instrumentType: type, broadClass, taxRule, quantity: 1, avgCost: value, costEstimated: false,
    purchaseDate: start, purchaseDateEstimated: false, currentPrice: value, priceDate: asOf, priceApprox: false, currentValue: value,
    unrealisedGain: 0, holdingMonths: m, holdingPeriodBucket: bucket(m), annualInterest,
    sourceAccounts: [{ label, accountId, quantity: 1 }], qualityFlags: [], xrayFindingIds: [],
  };
}

export const PRICE_NOTE = PRICE_SOURCE;
