import { CheckCircle2, CircleDashed, FlaskConical, Scale, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Card, CardHeader } from '../components/ui';
import { MF_UNIT_TOLERANCE, RULES, SEVERITY_WEIGHT, STALE_DAYS } from '../engine/xray';

const REAL = [
  'Deterministic rule engine (7 rules) running in your browser. The same data always gives the same findings.',
  'Evidence tables, reasoning steps and uncertainty notes generated from the rules and the data.',
  'Bond maths: yield to maturity (bisection), current yield and modified duration (simplified).',
  'Interpretation and market what-if simulators that recalculate in real time.',
  'Learning progress and reviewed findings saved in this browser (localStorage).',
];
const NOT_REAL = [
  'No real broker, depository, RTA, exchange or Account Aggregator connection. All six “sources” are hand-written synthetic files.',
  'No AI or machine-learning model. Findings come from transparent if-then rules.',
  'No live prices. One synthetic end-of-day price file is used.',
  'No login, backend or storage of personal data.',
  'No investment, tax or legal advice, and no recommendations to buy or sell.',
];

export function Methodology() {
  return (
    <>
      <PageHeader
        eyebrow="Methodology & disclosures"
        title="How Portfolio X-Ray works"
        subtitle="Built to be transparent: here is exactly what this prototype does, what it doesn’t do, and how every number is produced."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="What’s real in this prototype" icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
          <ul className="space-y-2 p-5 text-[14px] text-slate-700">{REAL.map((r) => <li key={r} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {r}</li>)}</ul>
        </Card>
        <Card>
          <CardHeader title="What’s simulated or out of scope" icon={<FlaskConical className="h-4 w-4 text-amber-600" />} />
          <ul className="space-y-2 p-5 text-[14px] text-slate-700">{NOT_REAL.map((r) => <li key={r} className="flex gap-2"><CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> {r}</li>)}</ul>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Reconciliation pipeline" subtitle="Applied to every position, in this order" />
        <ol className="grid gap-3 p-5 md:grid-cols-5">
          {[
            ['Ingest', 'Load records from the 5 holdings sources and the CAS reference.'],
            ['Group', 'Group records by demo identifier and account.'],
            ['De-duplicate', 'Keep one record per group by source priority (broker/platform/RTA ahead of manual imports).'],
            ['Reconcile', 'Compare with the CAS. Check corporate actions, then later trades, then rounding tolerance.'],
            ['Value', 'Reconciled quantity × price-file price. Missing costs are excluded from gain/loss, never set to zero.'],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-bold text-emerald-700">STEP {i + 1}</div>
              <div className="text-sm font-semibold text-slate-900">{t}</div>
              <div className="mt-1 text-[12.5px] text-slate-600">{d}</div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Rules" subtitle={`Thresholds: price stale after ${STALE_DAYS} days · MF unit tolerance ${MF_UNIT_TOLERANCE} units · stale-price band 0.1%/day (max 5%)`} />
        <div className="overflow-x-auto p-5 pt-3 thin-scroll">
          <table className="w-full min-w-[560px] text-[13.5px]">
            <tbody>
              {RULES.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-mono text-xs text-slate-400">{r.id}</td>
                  <td className="py-2 pr-3 font-semibold text-slate-900">{r.name}</td>
                  <td className="py-2 text-slate-600">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Data-integrity score" icon={<Scale className="h-4 w-4" />} />
          <div className="p-5 pt-3 text-[14px] text-slate-700">
            <div className="rounded-lg bg-ink-900 px-3 py-2 font-mono text-[13px] text-emerald-200">score = max(0, 100 − Σ weight(severity) of open findings)</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(SEVERITY_WEIGHT).map(([s, w]) => <span key={s} className="rounded-md bg-slate-100 px-2 py-1 text-[12.5px]"><b>{s}</b> = {w}</span>)}
            </div>
            <p className="mt-3 text-[13px] text-slate-500">Findings you mark as reviewed stop counting. The score measures how consistent the <i>data</i> is. It says nothing about investment quality or risk.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Severity & confidence" />
          <div className="space-y-2 p-5 pt-3 text-[13.5px] text-slate-700">
            <p><b>Severity</b> reflects the possible effect on reported value or understanding. <b>High</b>: can shift totals by a large amount. <b>Medium</b>: affects gain/loss, valuation accuracy or comparison. <b>Low</b>: explained difference. <b>Info</b>: benign.</p>
            <p><b>Confidence</b> reflects how strongly the evidence supports the rule’s explanation. For example, an exact multiplicative match to a split is High.</p>
          </div>
        </Card>
      </div>

      <Card className="mt-4 border-rose-200">
        <CardHeader title="Important disclaimers" icon={<ShieldAlert className="h-4 w-4 text-rose-600" />} />
        <div className="space-y-2 p-5 pt-3 text-[13.5px] leading-relaxed text-slate-700">
          <p>This is a hackathon prototype for demonstration and education. All instruments, identifiers (prefixed “DM-”), accounts, prices and statements are fictional. Any resemblance to real entities is coincidental.</p>
          <p>Nothing here is investment, tax or legal advice. The prototype and its authors are not SEBI-registered investment advisers or research analysts. Simulations are hypothetical illustrations, not forecasts or real financial outcomes.</p>
          <p>A production version would need consent-based data access (for example through RBI’s Account Aggregator framework), security review, regulatory assessment and validation against real statement formats. None of this exists in this prototype.</p>
        </div>
      </Card>
    </>
  );
}
