import { useMemo } from 'react';
import { EnglishOnly } from '../components/EnglishOnly';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Flag, Info, Rocket } from 'lucide-react';
import { useStore, type CalcState } from '../store';
import { tr } from '../i18n';
import { CALC_DEFAULTS, RETURN_ASSUMPTIONS } from '../config/profile';
import { milestoneYear, range, series, valueAt, type AfterTaxInstrument } from '../engine/calc';
import { Chip, Term } from '../components/kit';
import { cx } from '../components/ui';
import { amountInWords, fmtINR, fmtLakh } from '../lib/format';

const AFTER_TAX: { id: AfterTaxInstrument; label: string }[] = [
  { id: 'equity-fund', label: 'Equity fund' }, { id: 'fd', label: 'FD' }, { id: 'debt-fund', label: 'Debt fund' },
];

export function GrowTab() {
  const { s, set, d } = useStore();
  const a = d.analysis;
  const label = a?.risk.label ?? 'Moderate';
  const assumptions = RETURN_ASSUMPTIONS[label];
  const prefill = a?.advice.calcPrefill;
  const c: CalcState = s.calc ?? { mode: prefill?.mode ?? 'sip', amount: prefill?.amount ?? 10000, years: prefill?.years ?? 15, ratePct: prefill?.ratePct ?? assumptions.expected, afterTax: null, inflationAdjusted: false };
  const update = (p: Partial<CalcState>) => set({ calc: { ...c, ...p } });
  const marginal = a?.tax.marginalRate ?? 0.3;
  const age = s.answers.age ?? 35;

  const input = { mode: c.mode, amount: c.amount, years: c.years, ratePct: c.ratePct, inflationAdjusted: c.inflationAdjusted, inflationPct: CALC_DEFAULTS.inflation, afterTax: c.afterTax, marginalRate: marginal };
  const data = useMemo(() => series(input), [JSON.stringify(input)]); // eslint-disable-line react-hooks/exhaustive-deps
  const spread = { cautious: c.ratePct - (assumptions.expected - assumptions.cautious), expected: c.ratePct, optimistic: c.ratePct + (assumptions.optimistic - assumptions.expected) };
  const r = range(input, spread);
  const final = data[data.length - 1];
  const milestone = milestoneYear({ ...input, years: 50 }, CALC_DEFAULTS.milestone, 50);
  const earlier = valueAt({ ...input, years: c.years + 5 }, c.years + 5);

  const amountMax = c.mode === 'sip' ? 200000 : 10000000;
  const amountStep = c.mode === 'sip' ? 500 : 10000;

  return (
    <div className="space-y-3 px-4 pb-6 pt-4">
      <EnglishOnly />
      <div className="flex rounded-full bg-white p-1 ring-1 ring-slate-100">
        {(['sip', 'lumpsum'] as const).map((m) => (
          <button key={m} onClick={() => update({ mode: m, amount: m === 'sip' ? 10000 : 500000 })} className={cx('flex-1 rounded-full py-2 text-[13.5px] font-semibold cursor-pointer', c.mode === m ? 'bg-ink-900 text-white' : 'text-slate-600')}>
            {m === 'sip' ? 'Monthly SIP' : 'Lump sum'}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-ink-900 p-5 text-white">
        <div className="text-[12.5px] text-slate-400">Could grow to (expected, {c.inflationAdjusted ? "in today’s money" : 'in future rupees'}{c.afterTax ? ', after tax' : ''})</div>
        <div className="mt-1 text-[34px] font-bold tracking-tight tabular">{fmtLakh(r.expected)}</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {([['Cautious', r.cautious, spread.cautious], ['Expected', r.expected, spread.expected], ['Optimistic', r.optimistic, spread.optimistic]] as const).map(([k, v, rate]) => (
            <div key={k} className={cx('rounded-xl px-2 py-2', k === 'Expected' ? 'bg-emerald-500/20 ring-1 ring-emerald-400/40' : 'bg-white/5')}>
              <div className="text-[10.5px] uppercase tracking-wide text-slate-400">{k} · {rate.toFixed(1)}%</div>
              <div className="text-[14px] font-semibold tabular">{fmtLakh(v)}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11.5px] text-slate-400"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>Illustration using assumed returns for a {label.toLowerCase()} profile. Returns are not guaranteed and can be negative.{c.mode === 'sip' && <> What’s a <Term t="SIP">SIP</Term>?</>}</span></p>
      </div>

      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-100">
        <div className="flex items-center justify-between text-[12px]">
          <span className="inline-flex items-center gap-1.5 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm bg-slate-400" /> You put in <b className="tabular text-slate-900">{fmtLakh(final.invested)}</b></span>
          <span className="inline-flex items-center gap-1.5 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Compounding added <b className="tabular text-slate-900">{fmtLakh(final.growth)}</b></span>
        </div>
        <div className="mt-2 h-52">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(y) => `${y}y`} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={shortTick} tick={{ fontSize: 10, fill: '#64748b' }} width={44} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number, n) => [fmtINR(v), n === 'invested' ? 'You put in' : 'Compounding added']} labelFormatter={(y) => `Year ${y} · age ${age + Number(y)}`} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="invested" stackId="1" stroke="#94a3b8" fill="#cbd5e1" isAnimationActive={false} />
              <Area type="monotone" dataKey="growth" stackId="1" stroke="#059669" fill="#34d399" fillOpacity={0.7} isAnimationActive={false} />
              {milestone != null && milestone <= c.years && <ReferenceLine x={milestone} stroke="#0b1220" strokeDasharray="4 3" label={{ value: `₹1 crore · age ${age + milestone}`, position: 'insideTopLeft', fontSize: 10, fill: '#0b1220' }} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-4 ring-1 ring-slate-100">
        <Slider label={c.mode === 'sip' ? 'Monthly amount' : 'Amount'} value={c.amount} min={c.mode === 'sip' ? 500 : 10000} max={amountMax} step={amountStep} display={`${fmtINR(c.amount)} · ${amountInWords(c.amount)}`} onChange={(v) => update({ amount: v })} />
        <Slider label="Years" value={c.years} min={1} max={40} step={1} display={`${c.years} yrs · till age ${age + c.years}`} onChange={(v) => update({ years: v })} />
        <Slider label="Expected return (per year)" value={c.ratePct} min={3} max={15} step={0.5} display={`${c.ratePct}%`} onChange={(v) => update({ ratePct: v })} />
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Chip active={c.inflationAdjusted} onClick={() => update({ inflationAdjusted: !c.inflationAdjusted })}>Inflation-adjusted ({CALC_DEFAULTS.inflation}%)</Chip>
          <Chip active={!!c.afterTax} onClick={() => update({ afterTax: c.afterTax ? null : 'equity-fund' })}>After tax</Chip>
        </div>
        {c.afterTax && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] text-slate-500">Taxed as:</span>
            {AFTER_TAX.map((t) => <Chip key={t.id} active={c.afterTax === t.id} onClick={() => update({ afterTax: t.id })} className="py-1 text-[12px]">{t.label}</Chip>)}
            <p className="w-full text-[11.5px] text-slate-500">{c.afterTax === 'equity-fund' ? '12.5% on gains above ₹1.25 lakh at the end (simplified).' : c.afterTax === 'fd' ? <>Interest taxed every year at your <Term t="marginal rate" /> ({(marginal * 100).toFixed(1)}%).</> : <>Gains taxed at your <Term t="slab">slab</Term> rate on redemption.</>}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-3.5 ring-1 ring-slate-100">
          <Flag className="h-4 w-4 text-emerald-600" />
          <div className="mt-1 text-[12px] text-slate-500">Milestone</div>
          <div className="text-[13.5px] font-semibold text-slate-900">{milestone != null ? `₹1 crore at age ${age + milestone}` : 'Not within 50 years'}</div>
        </div>
        <div className="rounded-2xl bg-white p-3.5 ring-1 ring-slate-100">
          <Rocket className="h-4 w-4 text-violet-600" />
          <div className="mt-1 text-[12px] text-slate-500">Start 5 years earlier</div>
          <div className="text-[13.5px] font-semibold text-slate-900">{fmtLakh(earlier)} <span className="font-normal text-slate-500">vs {fmtLakh(r.expected)}</span></div>
        </div>
      </div>
      {s.calc && <button onClick={() => set({ calc: null })} className="min-h-8 w-full py-2 text-center text-[12px] text-slate-400 underline cursor-pointer">Reset to my profile’s numbers</button>}
      <p className="text-center text-[11px] text-slate-400">{tr(s.lang, 'demo')} · hypothetical illustration, not a forecast</p>
    </div>
  );
}

const shortTick = (v: number) => (v >= 1e7 ? `₹${+(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${+(v / 1e5).toFixed(0)}L` : v >= 1e3 ? `₹${+(v / 1e3).toFixed(0)}K` : `₹${v}`);

function Slider({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-[13px]"><span className="font-medium text-slate-700">{label}</span><span className="font-semibold tabular text-slate-900">{display}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full" aria-label={label} />
    </label>
  );
}
