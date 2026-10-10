import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { currentYield, priceFromYield, yieldToMaturity } from '../lib/bond';
import { fmtINR, fmtINR2 } from '../lib/format';
import { cx } from './ui';

// ── Coupon vs yield explorer ────────────────────────────────────────────
export function YieldExplorer() {
  const [price, setPrice] = useState(968);
  const [coupon, setCoupon] = useState(7.95);
  const [years, setYears] = useState(5);
  const face = 1000;
  const terms = { face, couponRate: coupon / 100, yearsToMaturity: years, frequency: 1 };
  const ytm = yieldToMaturity(terms, price) * 100;
  const cy = currentYield(terms, price) * 100;

  const curve = useMemo(() => {
    const pts = [];
    for (let y = 3; y <= 14.001; y += 0.25) pts.push({ y: +y.toFixed(2), price: +priceFromYield(terms, y / 100).toFixed(2) });
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon, years]);

  const state = Math.abs(price - face) < 1 ? 'par' : price < face ? 'discount' : 'premium';
  const bars = [
    { label: 'Coupon rate', value: coupon, color: 'bg-slate-400', note: `${fmtINR2((face * coupon) / 100)}/yr on ₹1,000 face` },
    { label: 'Current yield', value: cy, color: 'bg-sky-500', note: 'coupon ÷ today’s price' },
    { label: 'Yield to maturity', value: ytm, color: 'bg-violet-600', note: 'coupons + gain/loss to maturity' },
  ];
  const maxV = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/70 to-white p-5">
      <div className="text-sm font-semibold text-violet-900">Interactive: coupon vs yield explorer</div>
      <p className="text-[12.5px] text-violet-800/70">Starts at the demo Housing Finance bond from your X-Ray (₹968, 7.95% coupon). Annual coupons, simplified maths.</p>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          {[
            { label: 'Market price (face ₹1,000)', v: price, set: setPrice, min: 850, max: 1150, step: 1, fmt: fmtINR(price) },
            { label: 'Coupon rate', v: coupon, set: setCoupon, min: 5, max: 11, step: 0.05, fmt: `${coupon.toFixed(2)}%` },
            { label: 'Years to maturity', v: years, set: setYears, min: 1, max: 15, step: 1, fmt: `${years} yrs` },
          ].map((s) => (
            <label key={s.label} className="block">
              <div className="flex justify-between text-[13px]"><span className="font-medium text-slate-700">{s.label}</span><span className="font-semibold tabular text-slate-900">{s.fmt}</span></div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.v} onChange={(e) => s.set(Number(e.target.value))} className="mt-1.5 w-full" />
            </label>
          ))}
          <div className="space-y-2.5 pt-1">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-[12.5px]"><span className="text-slate-600">{b.label} <span className="text-slate-400">· {b.note}</span></span><span className="font-bold tabular text-slate-900">{b.value.toFixed(2)}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100"><div className={cx('h-2 rounded-full transition-all duration-300', b.color)} style={{ width: `${(b.value / maxV) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className={cx('rounded-lg px-3 py-2 text-[13px]', state === 'discount' ? 'bg-emerald-50 text-emerald-900' : state === 'premium' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-700')}>
            {state === 'discount' && <>Trading at a <b>discount</b>: YTM &gt; current yield &gt; coupon. You also gain {fmtINR(face - price)} per unit at maturity.</>}
            {state === 'premium' && <>Trading at a <b>premium</b>: YTM &lt; current yield &lt; coupon. You lose {fmtINR(price - face)} per unit by maturity.</>}
            {state === 'par' && <>Trading at <b>par</b>: coupon ≈ current yield ≈ YTM.</>}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={curve} margin={{ top: 10, right: 12, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="#ede9fe" />
              <XAxis dataKey="y" type="number" domain={[3, 14]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Yield to maturity', position: 'insideBottom', offset: -6, fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={['auto', 'auto']} tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11, fill: '#64748b' }} width={56} />
              <Tooltip formatter={(v: number) => fmtINR2(v)} labelFormatter={(l) => `Yield ${l}%`} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <ReferenceLine y={face} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Face ₹1,000', fontSize: 10, fill: '#64748b', position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="price" stroke="#7c3aed" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              {ytm >= 3 && ytm <= 14 && <ReferenceDot x={+ytm.toFixed(2)} y={price} r={6} fill="#7c3aed" stroke="#fff" strokeWidth={2} />}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-center text-[11.5px] text-slate-500">The price–yield see-saw: higher yield ⇒ lower price</p>
        </div>
      </div>
    </div>
  );
}

// ── Risk ladder ─────────────────────────────────────────────────────────
const RISKS = ['Market', 'Interest rate', 'Credit', 'Liquidity'] as const;
const LADDER: { name: string; levels: number[]; note: string }[] = [
  { name: 'Treasury Bill', levels: [0, 1, 0, 0], note: 'Short maturity, sovereign issuer. Minimal rate and credit risk.' },
  { name: 'Long-dated G-Sec', levels: [0, 3, 0, 1], note: 'Sovereign credit, but long duration makes prices sensitive to rate changes.' },
  { name: 'Corporate bond / NCD', levels: [0, 2, 2, 3], note: 'Adds issuer credit risk. Many trade rarely, which brings liquidity risk.' },
  { name: 'Debt mutual fund', levels: [0, 2, 1, 1], note: 'Depends on the fund’s duration and credit quality. Check the riskometer.' },
  { name: 'Index ETF (equity)', levels: [3, 0, 0, 1], note: 'Full equity-market risk, diversified across companies.' },
  { name: 'REIT / InvIT', levels: [2, 2, 1, 2], note: 'Property/infrastructure cash flows, leverage and rate sensitivity.' },
  { name: 'Single stock', levels: [3, 0, 1, 1], note: 'Market risk plus company-specific (concentration) risk.' },
];

export function RiskLadder() {
  const [sel, setSel] = useState(2);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-900">Interactive: what kind of risk does each asset carry?</div>
      <p className="text-[12.5px] text-slate-500">These are general, simplified comparisons. Individual products vary. Tap a row.</p>
      <div className="mt-3 overflow-x-auto thin-scroll">
        <table className="w-full min-w-[480px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="py-2">Asset</th>{RISKS.map((r) => <th key={r} className="py-2 text-center">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {LADDER.map((row, i) => (
              <tr key={row.name} onClick={() => setSel(i)} className={cx('cursor-pointer border-t border-slate-100', sel === i && 'bg-slate-50')}>
                <td className="py-2 pr-2 font-medium text-slate-800">{row.name}</td>
                {row.levels.map((l, j) => (
                  <td key={j} className="py-2">
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3].map((k) => <span key={k} className={cx('h-2.5 w-2.5 rounded-sm', k <= l ? ['bg-emerald-400', 'bg-amber-400', 'bg-rose-500'][l - 1] : 'bg-slate-100')} />)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700"><b>{LADDER[sel].name}:</b> {LADDER[sel].note}</div>
    </div>
  );
}

// ── Split visual ─────────────────────────────────────────────────────────
export function SplitVisual() {
  const [view, setView] = useState<'before' | 'after' | 'broken'>('after');
  const cfg = {
    before: { qty: 80, price: 2480, label: 'Before split (21 Sep)', tone: 'text-slate-900', note: 'Face value ₹10' },
    after: { qty: 160, price: 1240, label: 'After 1:2 split — correct', tone: 'text-emerald-700', note: 'Face value ₹5. Same total value.' },
    broken: { qty: 80, price: 1240, label: 'Broken record (Demo Broker B)', tone: 'text-rose-700', note: 'New price × old quantity, so the holding looks halved.' },
  }[view];
  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50/60 to-white p-5">
      <div className="text-sm font-semibold text-orange-900">Interactive: the Sterling Motors split from your X-Ray</div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(['before', 'after', 'broken'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={cx('rounded-full px-3 py-1 text-[12.5px] font-medium ring-1 ring-inset cursor-pointer', view === v ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200')}>
            {v === 'before' ? 'Before' : v === 'after' ? 'After (correct)' : 'After (broken record)'}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-6">
        <div className="flex max-w-[260px] flex-wrap gap-1">
          {Array.from({ length: cfg.qty / 10 }).map((_, i) => (
            <span key={i} className={cx('h-6 w-6 rounded-md transition-all', view === 'broken' ? 'bg-rose-300' : 'bg-orange-400')} title="10 shares" />
          ))}
        </div>
        <div>
          <div className="text-[12px] text-slate-500">{cfg.label}</div>
          <div className="font-mono text-sm text-slate-700">{cfg.qty} shares × {fmtINR(cfg.price)}</div>
          <div className={cx('text-2xl font-bold tabular', cfg.tone)}>{fmtINR(cfg.qty * cfg.price)}</div>
          <div className="text-[12px] text-slate-500">{cfg.note}</div>
        </div>
      </div>
      <p className="mt-3 text-[11.5px] text-slate-500">Each block = 10 shares. Prices are synthetic.</p>
    </div>
  );
}

// ── Reconciliation timeline ──────────────────────────────────────────────
export function ReconcileVisual() {
  const steps = [
    { date: '30 Sep', title: 'Month-end CAS', value: '120 shares', tone: 'bg-emerald-500' },
    { date: '06 Oct', title: 'You buy 30 (Broker A)', value: '+30', tone: 'bg-sky-500' },
    { date: '07 Oct', title: 'Settles T+1 into demat', value: '150 in demat', tone: 'bg-sky-500' },
    { date: '09 Oct', title: 'Broker A statement', value: '150 shares', tone: 'bg-slate-900' },
  ];
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white p-5">
      <div className="text-sm font-semibold text-emerald-900">Why 120 ≠ 150 isn’t an error: Aurora Infotech timeline</div>
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        {steps.map((s, i) => (
          <div key={i} className="relative">
            {i < steps.length - 1 && <div className="absolute left-4 top-4 hidden h-0.5 w-full bg-slate-200 sm:block" />}
            <div className={cx('relative grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white', s.tone)}>{i + 1}</div>
            <div className="mt-2 text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">{s.date}</div>
            <div className="text-[13.5px] font-semibold text-slate-900">{s.title}</div>
            <div className="text-[13px] tabular text-slate-600">{s.value}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-slate-500">Settlement shown as T+1 (next business day). The CAS was generated before the trade, so it couldn’t include it. All dates and quantities are synthetic.</p>
    </div>
  );
}
