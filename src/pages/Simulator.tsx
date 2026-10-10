import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertOctagon, ArrowRight, Info, RotateCcw, TrendingDown } from 'lucide-react';
import { useApp } from '../state';
import { PageHeader } from '../components/Layout';
import { Button, Card, CardHeader, cx, SeverityBadge, SimulationBadge } from '../components/ui';
import { CATEGORY_LABEL, type Position } from '../engine/xray';
import type { AssetClass } from '../data/portfolio';
import { modifiedDuration, yearsBetween, yieldToMaturity } from '../lib/bond';
import { ASSET_COLORS } from '../lib/colors';
import { fmtCompactINR, fmtINR, fmtPct, fmtSignedINR } from '../lib/format';

export function Simulator({ focusId }: { focusId?: string }) {
  return (
    <>
      <PageHeader
        eyebrow="Impact simulator"
        title="What could change — and what couldn’t"
        subtitle="Two separate hypothetical tools. Data-interpretation scenarios show how the reported value depends on which source is right. Market what-ifs show sensitivity to simple, made-up market moves. Neither is a forecast or a real financial outcome."
      />
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-[13.5px] text-violet-900">
        <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <b>Simulation, not reality.</b> Changing a scenario here only changes the numbers on screen. It doesn’t change what you own, predict prices or recommend any action. All inputs are synthetic.
        </div>
      </div>
      <InterpretationScenarios focusId={focusId} />
      <MarketWhatIf />
    </>
  );
}

// ── A. data-interpretation scenarios ─────────────────────────────────────
function InterpretationScenarios({ focusId }: { focusId?: string }) {
  const { xray, go } = useApp();
  const items = xray.findings.filter((f) => f.scenarios.length > 1);
  const initial = () => Object.fromEntries(items.map((f) => [f.id, f.scenarios[0].id]));
  const [choice, setChoice] = useState<Record<string, string>>(initial);
  const focusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusId) focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId]);

  const base = xray.totals.reconciled;
  const deltas = items.map((f) => ({ f, delta: f.scenarios.find((s) => s.id === choice[f.id])!.delta }));
  const scenarioTotal = base + deltas.reduce((s, d) => s + d.delta, 0);
  const min = base + items.reduce((s, f) => s + Math.min(...f.scenarios.map((x) => x.delta)), 0);
  const max = base + items.reduce((s, f) => s + Math.max(...f.scenarios.map((x) => x.delta)), 0);
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;

  const markers = [
    { label: 'Naive tracker sum', value: xray.totals.naive, color: '#f59e0b' },
    { label: 'X-Ray estimate', value: base, color: '#0f172a' },
    { label: 'Your scenario', value: scenarioTotal, color: '#7c3aed' },
  ];

  return (
    <Card className="mb-5">
      <CardHeader
        title="A · Data-interpretation scenarios"
        subtitle="Choose which interpretation you believe for each finding. The total updates instantly."
        right={<div className="flex items-center gap-2"><SimulationBadge /><Button variant="ghost" onClick={() => setChoice(initial())}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button></div>}
      />
      <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          {items.map((f) => {
            const focused = f.id === focusId;
            return (
              <div key={f.id} ref={focused ? focusRef : undefined} className={cx('rounded-xl border p-4 transition', focused ? 'border-violet-400 ring-2 ring-violet-200' : 'border-slate-200')}>
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={f.severity} />
                  <span className="text-[12px] font-medium text-slate-500">{CATEGORY_LABEL[f.category]}</span>
                  <button onClick={() => go({ page: 'xray', findingId: f.id })} className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer">
                    Evidence <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1.5 text-sm font-semibold text-slate-900">{f.title}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {f.scenarios.map((s) => {
                    const on = choice[f.id] === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setChoice((c) => ({ ...c, [f.id]: s.id }))}
                        className={cx('rounded-lg border px-3 py-2 text-left transition cursor-pointer', on ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-600' : 'border-slate-200 hover:border-slate-300')}
                      >
                        <div className="text-[13px] font-semibold text-slate-900">{s.label}</div>
                        <div className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{s.description}</div>
                        <div className={cx('mt-1 text-[12px] font-semibold tabular', s.delta > 0 ? 'text-emerald-700' : s.delta < 0 ? 'text-rose-700' : 'text-slate-500')}>
                          {s.delta === 0 ? 'Baseline' : fmtSignedINR(s.delta)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-2xl bg-ink-900 p-5 text-white">
            <div className="text-sm text-slate-400">Reported value under your scenario</div>
            <div className="mt-1 text-3xl font-bold tabular">{fmtINR(scenarioTotal)}</div>
            <div className={cx('mt-1 text-sm font-medium tabular', scenarioTotal - base >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
              {fmtSignedINR(scenarioTotal - base)} vs X-Ray estimate
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-[11px] text-slate-400"><span>{fmtCompactINR(min)}</span><span>Plausible range</span><span>{fmtCompactINR(max)}</span></div>
              <div className="relative h-3 rounded-full bg-gradient-to-r from-rose-400/40 via-slate-400/40 to-emerald-400/40">
                {markers.map((m) => (
                  <div key={m.label} className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-900 transition-all duration-500" style={{ left: pos(m.value), background: m.color === '#0f172a' ? '#fff' : m.color }} title={m.label} />
                ))}
              </div>
              <div className="mt-4 space-y-1.5 text-[12.5px]">
                {markers.map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color === '#0f172a' ? '#fff' : m.color }} />
                    <span className="text-slate-300">{m.label}</span>
                    <span className="ml-auto font-semibold tabular">{fmtINR(m.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-[13px] font-semibold text-slate-900">Contribution by finding</div>
            <div className="mt-2 h-44">
              <ResponsiveContainer>
                <BarChart data={deltas.map((d) => ({ name: d.f.id, delta: Math.round(d.delta) }))} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" tickFormatter={(v) => fmtCompactINR(v)} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <ReferenceLine x={0} stroke="#94a3b8" />
                  <Tooltip formatter={(v: number) => fmtSignedINR(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="delta" radius={4} isAnimationActive>
                    {deltas.map((d) => <Cell key={d.f.id} fill={d.delta >= 0 ? '#10b981' : '#f43f5e'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-500">
              The range shows how much the <i>reported</i> value depends on data quality. Your actual holdings are the same in every scenario. Only the record of them differs.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── B. market what-if ─────────────────────────────────────────────────────
interface Shock { rateBps: number; equityPct: number; goldPct: number; realEstatePct: number }
const PRESETS: { label: string; shock: Shock }[] = [
  { label: 'No change', shock: { rateBps: 0, equityPct: 0, goldPct: 0, realEstatePct: 0 } },
  { label: 'Rates +100 bps', shock: { rateBps: 100, equityPct: 0, goldPct: 0, realEstatePct: 0 } },
  { label: 'Rates −100 bps', shock: { rateBps: -100, equityPct: 0, goldPct: 0, realEstatePct: 0 } },
  { label: 'Equity correction', shock: { rateBps: 0, equityPct: -15, goldPct: 5, realEstatePct: -5 } },
  { label: 'Stress mix', shock: { rateBps: 150, equityPct: -20, goldPct: 8, realEstatePct: -10 } },
];

const SHORT: Record<AssetClass, string> = {
  Equity: 'Equity', ETF: 'ETF', 'Mutual Fund': 'MF', 'Government Security': 'G-Sec', 'Corporate Bond': 'Corp bond', REIT: 'REIT', InvIT: 'InvIT',
};

function durationFor(p: Position, asOf: string): number | null {
  const b = p.instrument.bond;
  if (b) {
    const t = { face: b.face, couponRate: b.couponRate, frequency: b.frequency, yearsToMaturity: yearsBetween(asOf, b.maturity) };
    return modifiedDuration(t, yieldToMaturity(t, p.price));
  }
  return p.instrument.fundDuration ?? null;
}

function MarketWhatIf() {
  const { xray } = useApp();
  const [shock, setShock] = useState<Shock>(PRESETS[1].shock);

  const rows = useMemo(() => xray.positions.map((p) => {
    const ac = p.instrument.assetClass;
    const dur = durationFor(p, xray.asOf);
    let pct = 0;
    let driver = '';
    if (dur != null) { pct = -dur * (shock.rateBps / 10000) * 100; driver = `Rates · duration ${dur.toFixed(2)}`; }
    else if (p.instrument.id === 'DM-ETF-GLD01') { pct = shock.goldPct; driver = 'Gold'; }
    else if (ac === 'REIT' || ac === 'InvIT') { pct = shock.realEstatePct; driver = 'REIT/InvIT'; }
    else { pct = shock.equityPct; driver = 'Equity'; }
    return { p, pct, driver, delta: (p.value * pct) / 100 };
  }), [xray, shock]);

  const total = rows.reduce((s, r) => s + r.delta, 0);
  const byClass = useMemo(() => {
    const m = new Map<AssetClass, number>();
    rows.forEach((r) => m.set(r.p.instrument.assetClass, (m.get(r.p.instrument.assetClass) ?? 0) + r.delta));
    return [...m.entries()].map(([name, delta]) => ({ name, short: SHORT[name], delta: Math.round(delta) }));
  }, [rows]);

  const slider = (key: keyof Shock, label: string, min: number, max: number, step: number, unit: string) => (
    <label className="block">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={cx('rounded-md px-1.5 py-0.5 font-semibold tabular', shock[key] === 0 ? 'bg-slate-100 text-slate-600' : shock[key] > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
          {shock[key] > 0 ? '+' : ''}{shock[key]}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={shock[key]} onChange={(e) => setShock((s) => ({ ...s, [key]: Number(e.target.value) }))} className="mt-2 w-full" />
    </label>
  );

  return (
    <Card>
      <CardHeader
        title="B · Hypothetical market what-if"
        subtitle="Simplified sensitivity: bonds and debt funds use modified duration, everything else moves one-for-one with its slider."
        icon={<TrendingDown className="h-4 w-4" />}
        right={<SimulationBadge />}
      />
      <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((pr) => (
              <button key={pr.label} onClick={() => setShock(pr.shock)}
                className={cx('rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset transition cursor-pointer',
                  JSON.stringify(pr.shock) === JSON.stringify(shock) ? 'bg-slate-900 text-white ring-slate-900' : 'text-slate-600 ring-slate-200 hover:bg-slate-50')}>
                {pr.label}
              </button>
            ))}
          </div>
          {slider('rateBps', 'Interest-rate change', -200, 200, 25, ' bps')}
          {slider('equityPct', 'Equity market move', -30, 30, 1, '%')}
          {slider('goldPct', 'Gold price move', -20, 20, 1, '%')}
          {slider('realEstatePct', 'REIT / InvIT unit price move', -20, 20, 1, '%')}
          <div className="flex gap-2 rounded-lg bg-slate-50 p-3 text-[11.5px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Linear approximations that ignore convexity, credit spreads, correlation and liquidity. The sliders are independent assumptions you choose. They don’t predict how markets move together.
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-ink-900 p-4 text-white">
              <div className="text-[12px] text-slate-400">Hypothetical change</div>
              <div className={cx('mt-1 text-2xl font-bold tabular', total >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{fmtSignedINR(total)}</div>
              <div className="text-[12px] text-slate-400">{fmtPct((total / xray.totals.reconciled) * 100)} of portfolio</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-[12px] text-slate-500">Starting value (X-Ray)</div>
              <div className="mt-1 text-xl font-bold tabular text-slate-900">{fmtINR(xray.totals.reconciled)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-[12px] text-slate-500">Hypothetical value</div>
              <div className="mt-1 text-xl font-bold tabular text-slate-900">{fmtINR(xray.totals.reconciled + total)}</div>
            </div>
          </div>

          <div className="mt-4 h-56 rounded-xl border border-slate-200 p-3">
            <ResponsiveContainer>
              <BarChart data={byClass} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="short" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tickFormatter={(v) => fmtCompactINR(v)} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={64} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Tooltip formatter={(v: number) => fmtSignedINR(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="delta" radius={[4, 4, 4, 4]}>
                  {byClass.map((b) => <Cell key={b.name} fill={ASSET_COLORS[b.name]} fillOpacity={b.delta >= 0 ? 1 : 0.75} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 thin-scroll">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Holding</th><th className="px-3 py-2">Driver</th><th className="px-3 py-2 text-right">Move</th><th className="px-3 py-2 text-right">Hypothetical Δ</th>
                </tr>
              </thead>
              <tbody>
                {[...rows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).map((r) => (
                  <tr key={r.p.key} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-800">{r.p.instrument.name}</td>
                    <td className="px-3 py-2 text-slate-500">{r.driver}</td>
                    <td className="px-3 py-2 text-right tabular text-slate-600">{fmtPct(r.pct)}</td>
                    <td className={cx('px-3 py-2 text-right font-semibold tabular', r.delta > 0 ? 'text-emerald-700' : r.delta < 0 ? 'text-rose-700' : 'text-slate-400')}>{fmtSignedINR(r.delta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}
