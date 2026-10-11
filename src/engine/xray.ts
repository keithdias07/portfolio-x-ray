/**
 * Portfolio X-Ray rules engine.
 *
 * Deterministic, rule-based checks over the synthetic source records. No machine learning,
 * no network calls: the same input always produces the same findings, and every finding
 * carries the evidence and reasoning steps that produced it.
 */
import {
  AS_OF, PRICE_SOURCE, corporateActions, instrumentById, priceById,
  type CorporateAction, type DataSource, type Instrument, type PriceQuote, type SourceRecord, type Trade,
} from '../data/securities';
import { daysBetween, fmtDate, fmtINR, fmtINR2, fmtNum } from '../lib/format';
import { yearsBetween, yieldToMaturity } from '../lib/bond';

export type Severity = 'High' | 'Medium' | 'Low' | 'Info';
export type Confidence = 'High' | 'Medium' | 'Low';
export type Category =
  | 'duplicate'
  | 'corporate-action'
  | 'quantity-conflict'
  | 'missing-cost'
  | 'stale-price'
  | 'yield-label'
  | 'rounding';

export interface Evidence {
  source: string;        // human-readable source name
  sourceId?: string;
  field: string;
  value: string;
  asOf?: string;
  raw?: string;
  flag?: boolean;        // highlighted as the conflicting value
}

export interface Scenario {
  id: string;
  label: string;
  /** change in total portfolio value vs the X-Ray reconciled estimate (₹) */
  delta: number;
  description: string;
}

export interface Explanation {
  text: string;
  likelihood: 'Likely' | 'Possible' | 'Less likely';
}

export interface Finding {
  id: string;
  ruleId: string;
  ruleName: string;
  category: Category;
  severity: Severity;
  confidence: Confidence;
  confidenceNote: string;
  title: string;
  summary: string;
  instrumentId: string;
  accountId: string;
  evidence: Evidence[];
  reasoning: string[];
  explanations: Explanation[];
  uncertainty: string;
  nextSteps: string[];
  impact: { valueAtStake: number; label: string };
  scenarios: Scenario[];
  learnTopicId: string;
}

export interface Position {
  key: string;
  instrument: Instrument;
  accountId: string;
  quantity: number;            // reconciled estimate
  reportedQuantity: number;    // as reported by the primary source
  purchaseDate: string | null;
  primary: SourceRecord;
  duplicates: SourceRecord[];
  reference?: SourceRecord;    // CAS line
  price: number;
  priceDate: string;
  value: number;
  costPerUnit: number | null;
  costValue: number | null;
  unrealized: number | null;
  findingIds: string[];
}

export interface XRayResult {
  asOf: string;
  positions: Position[];
  findings: Finding[];
  totals: {
    reconciled: number;
    naive: number;
    cost: number;              // cost of positions with known cost
    valueWithKnownCost: number;
    unrealized: number;
    valueWithoutCost: number;
  };
}

export const RULES = [
  { id: 'R1', name: 'Duplicate-position check', category: 'duplicate', description: 'Same demo identifier and same account reported by more than one holdings source.' },
  { id: 'R2', name: 'Corporate-action adjustment check', category: 'corporate-action', description: 'Quantity × split/bonus factor matches the depository quantity after the ex-date, so a source has not applied the action.' },
  { id: 'R3', name: 'Quantity reconciliation', category: 'quantity-conflict', description: 'Holdings-source quantity differs from the depository statement; trades after the statement date are checked as an explanation.' },
  { id: 'R4', name: 'Cost-basis completeness', category: 'missing-cost', description: 'Average acquisition cost is missing, so gains and tax lots cannot be computed.' },
  { id: 'R5', name: 'Price freshness', category: 'stale-price', description: 'Latest available price is more than 7 calendar days older than the portfolio date.' },
  { id: 'R6', name: 'Yield-label consistency', category: 'yield-label', description: '"Yield" shown for a bond equals its coupon although the bond trades away from face value.' },
  { id: 'R7', name: 'Fractional-unit tolerance', category: 'rounding', description: 'Mutual-fund unit difference within 0.01 units — treated as rounding, not an error.' },
] as const;

export const STALE_DAYS = 7;
export const MF_UNIT_TOLERANCE = 0.01;
/** price-uncertainty band for stale quotes: 0.1% per stale day, capped at 5% */
export const staleBand = (days: number) => Math.min(0.05, 0.001 * days);

const approxEq = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;
export interface XRayInput {
  sources: DataSource[];
  records: SourceRecord[];
  trades: Trade[];
  actions?: CorporateAction[];
  /** price lookup; callers must only pass records whose instrument has a quote */
  priceOf?: (id: string) => PriceQuote | undefined;
  asOf?: string;
}

export function runXRay(input: XRayInput): XRayResult {
  const { records, trades } = input;
  const actions = input.actions ?? corporateActions;
  const asOf = input.asOf ?? AS_OF;
  const sourceById = Object.fromEntries(input.sources.map((s) => [s.id, s])) as Record<string, DataSource>;
  const srcName = (id: string) => sourceById[id]?.shortName ?? id;
  const priceOf = input.priceOf ?? ((id: string) => priceById[id]);
  const findings: Finding[] = [];
  const positions: Position[] = [];
  let fid = 0;
  const nextId = () => `XR-${String(++fid).padStart(3, '0')}`;

  const holding = records.filter((r) => sourceById[r.sourceId]?.role === 'holding');
  const reference = records.filter((r) => sourceById[r.sourceId]?.role === 'reference');

  // group holdings by instrument + account
  const groups = new Map<string, SourceRecord[]>();
  for (const r of holding) {
    const k = `${r.instrumentId}|${r.accountId}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  for (const [key, recs] of groups) {
    const sorted = [...recs].sort((a, b) => {
      const sa = sourceById[a.sourceId], sb = sourceById[b.sourceId];
      return sa.priority - sb.priority || sb.asOf.localeCompare(sa.asOf);
    });
    const primary = sorted[0];
    const duplicates = sorted.slice(1);
    const inst = instrumentById[primary.instrumentId];
    const pq = priceOf(inst.id)!;
    const ref = reference.find((r) => r.instrumentId === primary.instrumentId && r.accountId === primary.accountId);
    const primarySrc = sourceById[primary.sourceId];
    const refSrc = ref ? sourceById[ref.sourceId] : undefined;
    const price = pq.price;
    const findingIds: string[] = [];
    let quantity = primary.quantity;
    let costPerUnit = primary.avgCost;

    const priceEvidence: Evidence = { source: PRICE_SOURCE, field: 'Price', value: fmtINR2(price), asOf: pq.priceDate };

    // ── R1 duplicates ────────────────────────────────────────────────
    if (duplicates.length) {
      const dupQty = duplicates.reduce((s, d) => s + d.quantity, 0);
      const over = dupQty * price;
      const id = nextId();
      findingIds.push(id);
      findings.push({
        id, ruleId: 'R1', ruleName: 'Duplicate-position check', category: 'duplicate',
        severity: 'High', confidence: 'High',
        confidenceNote: 'Same demo identifier, same demat account and identical quantity in both sources. Name differences are cosmetic.',
        title: `${inst.name} may be counted twice for the same demat account`,
        summary: `${srcName(primary.sourceId)} and ${duplicates.map((d) => srcName(d.sourceId)).join(', ')} both report ${fmtNum(primary.quantity)} ${inst.unit} in ${primary.accountId}. Adding them together would double-count ${fmtINR(over)}.`,
        instrumentId: inst.id, accountId: primary.accountId,
        evidence: [
          ...sorted.map((r) => ({
            source: sourceById[r.sourceId].name, sourceId: r.sourceId, field: `Holding in ${r.accountId}`,
            value: `${fmtNum(r.quantity)} ${inst.unit} — “${r.nameAsReported}”`, asOf: sourceById[r.sourceId].asOf, raw: r.raw, flag: r !== primary,
          })),
          ...(ref ? [{ source: refSrc!.name, sourceId: ref.sourceId, field: `Depository balance in ${ref.accountId}`, value: `${fmtNum(ref.quantity)} ${inst.unit}`, asOf: refSrc!.asOf, raw: ref.raw }] : []),
          priceEvidence,
        ],
        reasoning: [
          `Grouped all holdings records by demo identifier ${inst.id} and account ${primary.accountId}.`,
          `Found ${sorted.length} records from different sources for the same group.`,
          ref
            ? `The depository statement shows ${fmtNum(ref.quantity)} ${inst.unit} in this account — matching one record, not the sum (${fmtNum(primary.quantity + dupQty)}).`
            : 'No depository line was available to confirm which total is correct.',
          `Kept the higher-priority source (${srcName(primary.sourceId)}) and excluded the ${srcName(duplicates[0].sourceId)} record from the total.`,
        ],
        explanations: [
          { text: 'The same demat account was imported twice — once from the broker and once from a manually imported tracker export.', likelihood: 'Likely' },
          { text: 'You genuinely hold the shares in two accounts, but one export shows the wrong account number.', likelihood: 'Less likely' },
        ],
        uncertainty: ref && approxEq(ref.quantity, primary.quantity)
          ? 'Low. The depository balance supports counting the shares once. A wrong account label in the manual export cannot be fully ruled out.'
          : 'Medium. No independent depository balance confirms which interpretation is correct.',
        nextSteps: [
          'Remove or tag the manual CSV import for this account so it is not counted again.',
          'Check the latest depository statement (CAS) for the total balance across all your demat accounts.',
        ],
        impact: { valueAtStake: over, label: 'Possible overstatement if double-counted' },
        scenarios: [
          { id: 'once', label: 'Count once (X-Ray estimate)', delta: 0, description: `Use ${srcName(primary.sourceId)} only — matches the depository balance.` },
          { id: 'twice', label: 'Count both records (naive sum)', delta: over, description: `Treat the ${srcName(duplicates[0].sourceId)} record as a separate holding.` },
        ],
        learnTopicId: 'statements-reconciliation',
      });
    }

    // ── R2 corporate actions / R3 quantity / R7 rounding ─────────────
    if (ref) {
      const ca = actions.find(
        (a) => a.instrumentId === inst.id && a.exDate <= asOf && refSrc!.asOf >= a.exDate &&
          approxEq(primary.quantity * a.factor, ref.quantity, 1e-6) && !approxEq(primary.quantity, ref.quantity),
      );
      const diff = primary.quantity - ref.quantity;

      if (ca) {
        quantity = primary.quantity * ca.factor;
        if (costPerUnit != null) costPerUnit = costPerUnit / ca.factor;
        const under = (quantity - primary.quantity) * price;
        const id = nextId();
        findingIds.push(id);
        findings.push({
          id, ruleId: 'R2', ruleName: 'Corporate-action adjustment check', category: 'corporate-action',
          severity: 'High', confidence: 'High',
          confidenceNote: `${fmtNum(primary.quantity)} × ${ca.factor} = ${fmtNum(ref.quantity)} exactly matches the depository balance after the ex-date. The post-split price is already in the price file.`,
          title: `${inst.name}: ${ca.type} may not be reflected in ${srcName(primary.sourceId)}`,
          summary: `A 1:${ca.factor} ${ca.type} went ex on ${fmtDate(ca.exDate)}. ${srcName(primary.sourceId)} still shows ${fmtNum(primary.quantity)} shares, but the depository shows ${fmtNum(ref.quantity)}. If you value the old quantity at the new price, it understates the holding by ${fmtINR(under)}.`,
          instrumentId: inst.id, accountId: primary.accountId,
          evidence: [
            { source: primarySrc.name, sourceId: primary.sourceId, field: 'Quantity', value: `${fmtNum(primary.quantity)} shares`, asOf: primarySrc.asOf, raw: primary.raw, flag: true },
            { source: primarySrc.name, sourceId: primary.sourceId, field: 'Average cost', value: primary.avgCost != null ? fmtINR2(primary.avgCost) : '—', asOf: primarySrc.asOf, flag: true },
            { source: refSrc!.name, sourceId: ref.sourceId, field: 'Depository balance', value: `${fmtNum(ref.quantity)} shares`, asOf: refSrc!.asOf, raw: ref.raw },
            { source: 'Demo corporate-action calendar (synthetic)', field: `${ca.type[0].toUpperCase()}${ca.type.slice(1)} (ex-date)`, value: ca.description, asOf: ca.exDate },
            priceEvidence,
          ],
          reasoning: [
            `${srcName(primary.sourceId)} quantity (${fmtNum(primary.quantity)}) differs from the depository balance (${fmtNum(ref.quantity)}).`,
            `A ${ca.type} with factor ×${ca.factor} has an ex-date of ${fmtDate(ca.exDate)}, which falls before both statement dates.`,
            `${fmtNum(primary.quantity)} × ${ca.factor} = ${fmtNum(primary.quantity * ca.factor)}, which exactly matches the depository balance.`,
            `The price file already reflects the post-${ca.type} price (${fmtINR2(price)}), so valuing the old quantity at the new price halves the apparent value.`,
            `Reconciled estimate: ${fmtNum(quantity)} shares at an adjusted average cost of ${costPerUnit != null ? fmtINR2(costPerUnit) : '—'}.`,
          ],
          explanations: [
            { text: `${srcName(primary.sourceId)} has not yet updated its records for the ${ca.type} (a common lag).`, likelihood: 'Likely' },
            { text: 'Some shares were sold after the split and the depository statement is out of date.', likelihood: 'Less likely' },
          ],
          uncertainty: 'Low. The exact multiplicative match is strong evidence. Sales between 30 Sep and 8 Oct cannot be excluded without a trade log from this broker.',
          nextSteps: [
            'Confirm the share count in your demat account.',
            'Ask the broker to update the holding and adjust the average cost per share for the split.',
          ],
          impact: { valueAtStake: under, label: 'Understatement if the old quantity is used' },
          scenarios: [
            { id: 'adjusted', label: `Apply ${ca.type} (${fmtNum(quantity)} shares)`, delta: 0, description: 'Quantity adjusted to match the depository balance.' },
            { id: 'as-reported', label: `Trust ${srcName(primary.sourceId)} as reported (${fmtNum(primary.quantity)})`, delta: -under, description: 'Use the unadjusted quantity at the post-split price.' },
          ],
          learnTopicId: 'corporate-actions',
        });
      } else if (!approxEq(diff, 0)) {
        const isMF = inst.assetClass === 'Mutual Fund';
        if (isMF && Math.abs(diff) <= MF_UNIT_TOLERANCE) {
          const id = nextId();
          findingIds.push(id);
          const d = Math.abs(diff) * price;
          findings.push({
            id, ruleId: 'R7', ruleName: 'Fractional-unit tolerance', category: 'rounding',
            severity: 'Info', confidence: 'High',
            confidenceNote: `The difference of ${fmtNum(Math.abs(diff))} units is within the ${MF_UNIT_TOLERANCE}-unit tolerance.`,
            title: `${inst.name}: tiny unit difference (rounding)`,
            summary: `The registrar statement shows ${fmtNum(primary.quantity)} units and the CAS shows ${fmtNum(ref.quantity)}. The ${fmtNum(Math.abs(diff))}-unit gap (≈${fmtINR2(d)}) is almost certainly rounding, so no action is needed.`,
            instrumentId: inst.id, accountId: primary.accountId,
            evidence: [
              { source: primarySrc.name, sourceId: primary.sourceId, field: 'Units', value: fmtNum(primary.quantity), asOf: primarySrc.asOf, raw: primary.raw },
              { source: refSrc!.name, sourceId: ref.sourceId, field: 'Units', value: ref.quantity.toFixed(3), asOf: refSrc!.asOf, raw: ref.raw, flag: true },
              { source: PRICE_SOURCE, field: 'NAV', value: fmtINR2(price), asOf: pq.priceDate },
            ],
            reasoning: [
              `Unit difference = ${fmtNum(primary.quantity)} − ${ref.quantity.toFixed(3)} = ${fmtNum(diff)}.`,
              `Mutual-fund units are often shown to 3 decimals and rounded differently by different statements.`,
              `|difference| ≤ ${MF_UNIT_TOLERANCE} units, so it is classified as informational.`,
            ],
            explanations: [
              { text: 'Different rounding or truncation of fractional units between statements.', likelihood: 'Likely' },
              { text: 'A very small transaction (e.g. stamp-duty adjustment) between statement dates.', likelihood: 'Possible' },
            ],
            uncertainty: 'Negligible value at stake. This finding is shown to demonstrate that X-Ray tolerates benign differences instead of raising false alarms.',
            nextSteps: ['No action needed.'],
            impact: { valueAtStake: d, label: 'Negligible' },
            scenarios: [
              { id: 'rta', label: 'Registrar units (X-Ray estimate)', delta: 0, description: 'Most recent statement.' },
              { id: 'cas', label: 'CAS units', delta: -diff * price, description: 'Month-end depository-style statement.' },
            ],
            learnTopicId: 'mutual-funds',
          });
        } else {
          // look for trades after the reference date that explain the gap
          const after = trades.filter(
            (t) => t.instrumentId === inst.id && t.accountId === primary.accountId && t.date > refSrc!.asOf && t.date <= primarySrc.asOf,
          );
          const net = after.reduce((s, t) => s + (t.side === 'BUY' ? t.quantity : -t.quantity), 0);
          const explained = after.length > 0 && approxEq(net, diff);
          const atStake = Math.abs(diff) * price;
          const id = nextId();
          findingIds.push(id);
          findings.push({
            id, ruleId: 'R3', ruleName: 'Quantity reconciliation', category: 'quantity-conflict',
            severity: explained ? 'Low' : 'High',
            confidence: explained ? 'High' : 'Medium',
            confidenceNote: explained
              ? `A trade log entry of net ${net > 0 ? '+' : ''}${fmtNum(net)} after the CAS date exactly explains the gap.`
              : 'No trade, corporate action or rounding rule explains the gap.',
            title: explained
              ? `${inst.name}: quantities differ — explained by a recent trade`
              : `${inst.name}: quantities don’t match and no trade explains it yet`,
            summary: explained
              ? `${srcName(primary.sourceId)} shows ${fmtNum(primary.quantity)} shares and the ${fmtDate(refSrc!.asOf)} CAS shows ${fmtNum(ref.quantity)}. A purchase of ${fmtNum(net)} on ${fmtDate(after[0].date)} happened after the CAS date, so this is most likely a timing difference.`
              : `${srcName(primary.sourceId)} shows ${fmtNum(primary.quantity)} but the depository shows ${fmtNum(ref.quantity)}. No recorded trade explains the difference.`,
            instrumentId: inst.id, accountId: primary.accountId,
            evidence: [
              { source: primarySrc.name, sourceId: primary.sourceId, field: 'Quantity', value: `${fmtNum(primary.quantity)} shares`, asOf: primarySrc.asOf, raw: primary.raw, flag: true },
              { source: refSrc!.name, sourceId: ref.sourceId, field: 'Depository balance', value: `${fmtNum(ref.quantity)} shares`, asOf: refSrc!.asOf, raw: ref.raw, flag: true },
              ...after.map((t) => ({
                source: `${sourceById[t.sourceId].name} – trade log`, sourceId: t.sourceId, field: `${t.side} trade`,
                value: `${fmtNum(t.quantity)} @ ${fmtINR2(t.price)}`, asOf: t.date,
              })),
              priceEvidence,
            ],
            reasoning: [
              `Difference = ${fmtNum(primary.quantity)} − ${fmtNum(ref.quantity)} = ${diff > 0 ? '+' : ''}${fmtNum(diff)} shares.`,
              'No split or bonus applies to this instrument in the period.',
              `The CAS is dated ${fmtDate(refSrc!.asOf)}. The broker statement is dated ${fmtDate(primarySrc.asOf)}.`,
              after.length
                ? `Trades between those dates: net ${net > 0 ? '+' : ''}${fmtNum(net)} shares. ${explained ? 'This exactly matches the difference.' : 'This does not match the difference.'}`
                : 'No trades were found between those dates.',
              explained
                ? `Using the more recent broker quantity (${fmtNum(primary.quantity)}) as the X-Ray estimate.`
                : `Using the broker quantity as the provisional estimate. The depository quantity is shown as an alternative scenario.`,
            ],
            explanations: explained
              ? [
                  { text: 'Timing: the purchase settled after the month-end CAS was generated.', likelihood: 'Likely' },
                  { text: 'The purchase failed to settle (rare) and the broker view is optimistic.', likelihood: 'Less likely' },
                ]
              : [
                  { text: 'Missing trade or transfer record in the data received.', likelihood: 'Possible' },
                  { text: 'Shares pledged or under a pending transfer.', likelihood: 'Possible' },
                  { text: 'Data-entry error in one source.', likelihood: 'Possible' },
                ],
            uncertainty: explained
              ? 'Low. The next CAS (October) should show the matching balance. Until then, the extra shares are confirmed only by the broker.'
              : 'High. Value could differ by the full amount at stake until the conflict is resolved with the depository.',
            nextSteps: explained
              ? ['Check the next monthly CAS. The balance should read ' + fmtNum(primary.quantity) + '.', 'Keep the contract note for the trade as evidence.']
              : ['Download a fresh CAS and compare.', 'Contact the broker / depository participant with both statements.'],
            impact: { valueAtStake: atStake, label: explained ? 'Explained timing difference' : 'Unexplained difference' },
            scenarios: [
              { id: 'primary', label: `${srcName(primary.sourceId)} (${fmtNum(primary.quantity)}) — X-Ray estimate`, delta: 0, description: 'More recent statement, includes the later trade.' },
              { id: 'reference', label: `CAS month-end (${fmtNum(ref.quantity)})`, delta: -diff * price, description: 'Older depository-style statement.' },
            ],
            learnTopicId: 'statements-reconciliation',
          });
        }
      }
    }

    // ── R4 missing cost basis ────────────────────────────────────────
    if (primary.avgCost == null) {
      const mv = quantity * price;
      const id = nextId();
      findingIds.push(id);
      findings.push({
        id, ruleId: 'R4', ruleName: 'Cost-basis completeness', category: 'missing-cost',
        severity: 'Medium', confidence: 'High',
        confidenceNote: 'The field is empty in the only holdings source for this position, and the CAS has no cost data.',
        title: `${inst.name}: cost basis missing`,
        summary: `${srcName(primary.sourceId)} has no purchase cost for ${fmtNum(quantity)} shares (${fmtINR(mv)} market value). Gain/loss, returns and capital-gains estimates can't be calculated for this position.`,
        instrumentId: inst.id, accountId: primary.accountId,
        evidence: [
          { source: primarySrc.name, sourceId: primary.sourceId, field: 'Average cost', value: 'Not provided', asOf: primarySrc.asOf, raw: primary.raw, flag: true },
          ...(primary.note ? [{ source: primarySrc.name, sourceId: primary.sourceId, field: 'Remark', value: primary.note, asOf: primarySrc.asOf }] : []),
          ...(ref ? [{ source: refSrc!.name, sourceId: ref.sourceId, field: 'Depository balance', value: `${fmtNum(ref.quantity)} shares (no cost data)`, asOf: refSrc!.asOf, raw: ref.raw }] : []),
          priceEvidence,
        ],
        reasoning: [
          'Checked every holdings source for an average cost on this position. None has one.',
          primary.note ? `The source notes: “${primary.note}”. Shares received by off-market transfer often arrive without cost data.` : 'No remark explains the missing value.',
          `Excluded ${fmtINR(mv)} from portfolio gain/loss totals rather than assuming a cost of zero (which would overstate gains).`,
        ],
        explanations: [
          { text: 'Shares were received through an off-market transfer or gift, so the broker never recorded a purchase price.', likelihood: 'Likely' },
          { text: 'Shares were bought through another broker and later moved to this account.', likelihood: 'Possible' },
        ],
        uncertainty: 'The market value is reliable. Only the gain/loss is unknown, and it could be anywhere from a large gain to a loss.',
        nextSteps: [
          'Find the original contract note or transfer documentation.',
          'For gifted shares, the original holder’s cost and holding date may matter for tax. Check with a qualified tax professional.',
        ],
        impact: { valueAtStake: mv, label: 'Market value without known cost' },
        scenarios: [],
        learnTopicId: 'cost-basis',
      });
    }

    // ── R5 stale price ───────────────────────────────────────────────
    const staleDays = daysBetween(pq.priceDate, asOf);
    if (staleDays > STALE_DAYS) {
      const mv = quantity * price;
      const band = staleBand(staleDays);
      const id = nextId();
      findingIds.push(id);
      findings.push({
        id, ruleId: 'R5', ruleName: 'Price freshness', category: 'stale-price',
        severity: 'Medium', confidence: 'Medium',
        confidenceNote: 'The price is definitely old. How far the real value has moved since then is uncertain.',
        title: `${inst.name}: price is ${staleDays} days old`,
        summary: `The last available price (${fmtINR2(price)}) is from ${fmtDate(pq.priceDate)}. The bond seems to trade rarely, so its value of ${fmtINR(mv)} has an uncertainty band of about ±${(band * 100).toFixed(1)}%.`,
        instrumentId: inst.id, accountId: primary.accountId,
        evidence: [
          { source: PRICE_SOURCE, field: 'Last traded price', value: fmtINR2(price), asOf: pq.priceDate, flag: true },
          { source: 'Portfolio valuation date', field: 'As of', value: fmtDate(asOf), asOf },
          { source: primarySrc.name, sourceId: primary.sourceId, field: 'Holding in statement', value: `${fmtNum(primary.quantity)} ${inst.unit} (statement shows no newer price)`, asOf: primarySrc.asOf, raw: primary.raw },
        ],
        reasoning: [
          `Price age = ${staleDays} calendar days (threshold: ${STALE_DAYS}).`,
          'Thin trading is common for corporate bonds, so the last trade may not reflect current yields or credit conditions.',
          `Uncertainty band = 0.1% per stale day, capped at 5% → ±${(band * 100).toFixed(1)}%. This is a simple heuristic, not a valuation model.`,
        ],
        explanations: [
          { text: 'The bond trades rarely on the exchange (low secondary-market liquidity).', likelihood: 'Likely' },
          { text: 'The price feed failed to update for this instrument.', likelihood: 'Possible' },
        ],
        uncertainty: `The true value could reasonably be ${fmtINR(mv * (1 - band))} – ${fmtINR(mv * (1 + band))}. You might get a different price if you tried to sell.`,
        nextSteps: [
          'Check recent quotes or the bond platform’s indicative price.',
          'Keep liquidity in mind: you may not be able to sell quickly at the last traded price.',
        ],
        impact: { valueAtStake: mv * band, label: `±${(band * 100).toFixed(1)}% valuation band` },
        scenarios: [
          { id: 'last', label: 'Last traded price (X-Ray estimate)', delta: 0, description: `Value at ${fmtINR2(price)}.` },
          { id: 'low', label: `Low end (−${(band * 100).toFixed(1)}%)`, delta: -mv * band, description: 'If yields rose or credit spread widened since the last trade.' },
          { id: 'high', label: `High end (+${(band * 100).toFixed(1)}%)`, delta: mv * band, description: 'If yields fell since the last trade.' },
        ],
        learnTopicId: 'investment-risk',
      });
    }

    // ── R6 yield label ───────────────────────────────────────────────
    if (inst.bond && primary.reportedYieldPct != null) {
      const b = inst.bond;
      const terms = { face: b.face, couponRate: b.couponRate, frequency: b.frequency, yearsToMaturity: yearsBetween(asOf, b.maturity) };
      const ytm = yieldToMaturity(terms, price) * 100;
      const coupon = b.couponRate * 100;
      const awayFromPar = Math.abs(price - b.face) / b.face > 0.01;
      if (approxEq(primary.reportedYieldPct, coupon, 0.01) && awayFromPar && Math.abs(ytm - primary.reportedYieldPct) > 0.25) {
        const id = nextId();
        findingIds.push(id);
        const cy = ((b.face * b.couponRate) / price) * 100;
        findings.push({
          id, ruleId: 'R6', ruleName: 'Yield-label consistency', category: 'yield-label',
          severity: 'Medium', confidence: 'Medium',
          confidenceNote: `The reported “yield” equals the coupon exactly, while the price is ${((Math.abs(b.face - price) / b.face) * 100).toFixed(1)}% ${price < b.face ? 'below' : 'above'} face value. The platform probably meant coupon. Our yield to maturity uses simplified maths.`,
          title: `${inst.name}: “yield” shown looks like the coupon rate`,
          summary: `The bond platform shows a yield of ${primary.reportedYieldPct.toFixed(2)}%. That is exactly the coupon rate. At today’s price of ${fmtINR2(price)}, the approximate yield to maturity is ${ytm.toFixed(2)}% and the current yield is ${cy.toFixed(2)}%.`,
          instrumentId: inst.id, accountId: primary.accountId,
          evidence: [
            { source: primarySrc.name, sourceId: primary.sourceId, field: 'Reported “Yield”', value: `${primary.reportedYieldPct.toFixed(2)}%`, asOf: primarySrc.asOf, raw: primary.raw, flag: true },
            { source: 'Instrument terms (synthetic)', field: 'Coupon rate', value: `${coupon.toFixed(2)}% p.a., paid ${b.frequency === 1 ? 'annually' : 'semi-annually'}`, },
            { source: 'Instrument terms (synthetic)', field: 'Face value / maturity', value: `${fmtINR(b.face)} · ${fmtDate(b.maturity)}` },
            priceEvidence,
            { source: 'X-Ray calculation', field: 'Approx. yield to maturity', value: `${ytm.toFixed(2)}%` },
          ],
          reasoning: [
            `Coupon = ${coupon.toFixed(2)}% of face value (${fmtINR(b.face)}), so ${fmtINR2(b.face * b.couponRate)} of interest per year per unit.`,
            `The bond trades at ${fmtINR2(price)}, ${(((b.face - price) / b.face) * 100).toFixed(1)}% below face value.`,
            `Buying below face value means a buyer earns the coupon plus a gain at maturity, so the yield must be above the coupon.`,
            `Solving for yield to maturity (simplified, whole coupon periods): ≈ ${ytm.toFixed(2)}%.`,
            `The reported ${primary.reportedYieldPct.toFixed(2)}% equals the coupon to 2 decimals, so the label most likely shows the coupon rate, not the yield.`,
          ],
          explanations: [
            { text: 'The platform field labelled “Yield” actually shows the coupon rate.', likelihood: 'Likely' },
            { text: 'The platform shows yield at the time you bought, when the bond traded near face value.', likelihood: 'Possible' },
          ],
          uncertainty: 'No value is at stake. Only the label may be misleading. Our yield to maturity ignores accrued interest and exact day counts, so it may differ from an official figure by a few basis points.',
          nextSteps: [
            'When comparing bonds, compare yield to maturity, not coupon rates.',
            'Ask the platform what its “Yield” field means.',
          ],
          impact: { valueAtStake: 0, label: `Return understated by ~${(ytm - coupon).toFixed(2)} pp` },
          scenarios: [],
          learnTopicId: 'coupon-vs-yield',
        });
      }
    }

    const costValue = costPerUnit != null ? costPerUnit * quantity : null;
    const value = quantity * price;
    positions.push({
      key, instrument: inst, accountId: primary.accountId, quantity, reportedQuantity: primary.quantity, purchaseDate: primary.purchaseDate ?? null,
      primary, duplicates, reference: ref, price, priceDate: pq.priceDate, value,
      costPerUnit, costValue, unrealized: costValue != null ? value - costValue : null, findingIds,
    });
  }

  const reconciled = positions.reduce((s, p) => s + p.value, 0);
  const naive = holding.reduce((s, r) => s + r.quantity * priceOf(r.instrumentId)!.price, 0);
  const withCost = positions.filter((p) => p.costValue != null);
  const cost = withCost.reduce((s, p) => s + p.costValue!, 0);
  const valueWithKnownCost = withCost.reduce((s, p) => s + p.value, 0);

  const sevOrder: Record<Severity, number> = { High: 0, Medium: 1, Low: 2, Info: 3 };
  findings.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || b.impact.valueAtStake - a.impact.valueAtStake);
  // renumber so IDs follow display order (XR-001 = most severe)
  const rename = new Map<string, string>();
  findings.forEach((f, i) => {
    const id = `XR-${String(i + 1).padStart(3, '0')}`;
    rename.set(f.id, id);
    f.id = id;
  });
  for (const p of positions) p.findingIds = p.findingIds.map((id) => rename.get(id)!);

  return {
    asOf,
    positions: positions.sort((a, b) => b.value - a.value),
    findings,
    totals: {
      reconciled, naive, cost, valueWithKnownCost,
      unrealized: valueWithKnownCost - cost,
      valueWithoutCost: reconciled - valueWithKnownCost,
    },
  };
}

// ── Integrity score ────────────────────────────────────────────────────
export const SEVERITY_WEIGHT: Record<Severity, number> = { High: 12, Medium: 6, Low: 3, Info: 1 };

export function integrityScore(findings: Finding[], reviewed: ReadonlySet<string> = new Set()) {
  const open = findings.filter((f) => !reviewed.has(f.id));
  const penalty = open.reduce((s, f) => s + SEVERITY_WEIGHT[f.severity], 0);
  return { score: Math.max(0, 100 - penalty), penalty, open: open.length };
}

export const CATEGORY_LABEL: Record<Category, string> = {
  duplicate: 'Duplicate holding',
  'corporate-action': 'Corporate action',
  'quantity-conflict': 'Quantity conflict',
  'missing-cost': 'Missing cost basis',
  'stale-price': 'Stale price',
  'yield-label': 'Coupon vs yield',
  rounding: 'Rounding',
};
