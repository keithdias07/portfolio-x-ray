import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, ArrowRight, Clock, Database, Layers, ScanLine, Sparkles, X } from 'lucide-react';
import { useApp } from '../state';
import { PageHeader } from '../components/Layout';
import { Button, Card, CardHeader, cx, Pill, ProgressRing, scoreColor, SeverityBadge, sevDot, SyntheticBadge } from '../components/ui';
import { integrityScore, type Position } from '../engine/xray';
import { records, sourceById, sources, PRICE_SOURCE, type AssetClass } from '../data/portfolio';
import { ASSET_COLORS } from '../lib/colors';
import { daysBetween, fmtCompactINR, fmtDate, fmtINR, fmtINR2, fmtNum, fmtPct, fmtSignedINR } from '../lib/format';

export function Overview() {
  const { xray, reviewed, go } = useApp();
  const { totals, positions, findings } = xray;
  const { score, open } = integrityScore(findings, reviewed);
  const [selected, setSelected] = useState<Position | null>(null);
  const gap = totals.naive - totals.reconciled;

  const allocation = useMemo(() => {
    const m = new Map<AssetClass, number>();
    for (const p of positions) m.set(p.instrument.assetClass, (m.get(p.instrument.assetClass) ?? 0) + p.value);
    return [...m.entries()].map(([name, value]) => ({ name, value, pct: (value / totals.reconciled) * 100 })).sort((a, b) => b.value - a.value);
  }, [positions, totals.reconciled]);

  const findingById = Object.fromEntries(findings.map((f) => [f.id, f]));

  return (
    <>
      <PageHeader
        eyebrow="Unified portfolio"
        title="Good morning, Demo Investor"
        subtitle="One view of 14 positions from 6 synthetic statements, checked against each other before anything is added up."
        right={<Button onClick={() => go({ page: 'xray' })}><ScanLine className="h-4 w-4" /> Open X-Ray</Button>}
      />

      {/* Hero metrics */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="relative overflow-hidden xl:col-span-2">
          <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-[#0d2a2a]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative grid grid-cols-1 gap-6 p-6 text-white md:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                X-Ray reconciled value <SyntheticBadge />
              </div>
              <div className="mt-2 text-4xl font-bold tracking-tight tabular md:text-5xl">{fmtINR(totals.reconciled)}</div>
              <div className="mt-2 text-sm text-slate-400">as of {fmtDate(xray.asOf)} · {positions.length} positions · {sources.length} sources</div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <div className="text-slate-400">Unrealised gain/loss*</div>
                  <div className={cx('font-semibold tabular', totals.unrealized >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                    {fmtSignedINR(totals.unrealized)} <span className="text-slate-400 font-normal">({fmtPct((totals.unrealized / totals.cost) * 100)})</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Value without cost basis</div>
                  <div className="font-semibold tabular text-amber-300">{fmtINR(totals.valueWithoutCost)}</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">*Only positions with a known cost basis. Missing costs are never treated as zero.</p>
            </div>
            <div className="rounded-xl bg-white/[.06] p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-300"><AlertTriangle className="h-4 w-4" /> What a naive tracker would show</div>
              <div className="mt-2 text-2xl font-bold tabular text-white">{fmtINR(totals.naive)}</div>
              <div className="mt-1 text-sm text-slate-300">
                That is <b className="text-amber-300">{fmtSignedINR(gap)}</b> different from the X-Ray estimate, because it simply adds up every statement line.
              </div>
              <div className="mt-3 space-y-1.5 text-[12.5px] text-slate-300">
                {findings.filter((f) => f.category === 'duplicate' || f.category === 'corporate-action').map((f) => (
                  <button key={f.id} onClick={() => go({ page: 'xray', findingId: f.id })} className="flex w-full items-center gap-2 text-left hover:text-white cursor-pointer">
                    <span className={cx('h-1.5 w-1.5 rounded-full', sevDot[f.severity])} />
                    <span className="truncate">{f.title}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Data-integrity score</div>
            <button onClick={() => go({ page: 'methodology' })} className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer">How is this scored?</button>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <ProgressRing value={score / 100} size={112} stroke={11} color={scoreColor(score)}>
              <div className="text-center">
                <div className="text-3xl font-bold tabular text-slate-900">{score}</div>
                <div className="text-[11px] text-slate-500">/ 100</div>
              </div>
            </ProgressRing>
            <div className="space-y-1.5 text-sm">
              {(['High', 'Medium', 'Low', 'Info'] as const).map((s) => {
                const n = findings.filter((f) => f.severity === s && !reviewed.has(f.id)).length;
                return (
                  <div key={s} className="flex items-center gap-2 text-slate-600">
                    <span className={cx('h-2 w-2 rounded-full', sevDot[s])} /> {s}
                    <span className="ml-auto pl-4 font-semibold tabular text-slate-900">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
            {open === 0
              ? 'All findings reviewed. Your synthetic portfolio data is internally consistent.'
              : `${open} open finding${open === 1 ? '' : 's'}. Review them in X-Ray to see the evidence, and mark each as reviewed when you’re satisfied.`}
          </p>
          <Button className="mt-auto w-full" variant="secondary" onClick={() => go({ page: 'xray' })}>Review findings <ArrowRight className="h-4 w-4" /></Button>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Allocation */}
        <Card>
          <CardHeader title="Asset allocation" subtitle="Using X-Ray reconciled values" icon={<Layers className="h-4 w-4" />} />
          <div className="h-48 px-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} strokeWidth={0}>
                  {allocation.map((a) => <Cell key={a.name} fill={ASSET_COLORS[a.name]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtINR(v)} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 px-5 pb-5">
            {allocation.map((a) => (
              <div key={a.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ASSET_COLORS[a.name] }} />
                <span className="text-slate-700">{a.name}</span>
                <span className="ml-auto tabular text-slate-500">{fmtCompactINR(a.value)}</span>
                <span className="w-12 text-right font-semibold tabular text-slate-900">{a.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Sources */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Connected data sources"
            subtitle="Simulated statement files. Nothing is fetched from real institutions."
            icon={<Database className="h-4 w-4" />}
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {sources.map((s) => {
              const n = records.filter((r) => r.sourceId === s.id).length;
              const age = daysBetween(s.asOf, xray.asOf);
              return (
                <div key={s.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{s.shortName}</div>
                    <Pill className={s.role === 'reference' ? 'bg-emerald-50 text-emerald-700' : ''}>{s.role === 'reference' ? 'Reconciliation reference' : s.kind.replace('-', ' ')}</Pill>
                  </div>
                  <div className="mt-1 text-[12.5px] leading-snug text-slate-500">{s.description}</div>
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-slate-500">
                    <span className="tabular">{n} record{n === 1 ? '' : 's'}</span>
                    <span className={cx('inline-flex items-center gap-1', age > 3 && 'text-amber-700')}>
                      <Clock className="h-3 w-3" /> {fmtDate(s.asOf)}{age > 0 ? ` (${age}d old)` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Holdings */}
      <Card className="mt-4">
        <CardHeader
          title="Holdings"
          subtitle="Click any row to see where each value came from."
          right={<span className="hidden text-xs text-slate-500 sm:block">Prices: {PRICE_SOURCE}</span>}
        />
        <div className="mt-3 overflow-x-auto thin-scroll">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5">Instrument</th>
                <th className="px-3 py-2.5">Account</th>
                <th className="px-3 py-2.5 text-right">Quantity</th>
                <th className="px-3 py-2.5 text-right">Price</th>
                <th className="px-3 py-2.5 text-right">Value</th>
                <th className="px-3 py-2.5 text-right">Gain/loss</th>
                <th className="px-3 py-2.5">Sources</th>
                <th className="px-5 py-2.5">X-Ray</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const stale = daysBetween(p.priceDate, xray.asOf) > 7;
                const fs = p.findingIds.map((id) => findingById[id]);
                return (
                  <tr key={p.key} onClick={() => setSelected(p)} className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-1 rounded-full" style={{ background: ASSET_COLORS[p.instrument.assetClass] }} />
                        <div>
                          <div className="font-medium text-slate-900">{p.instrument.name}</div>
                          <div className="text-[12px] text-slate-500">{p.instrument.assetClass} · <span className="font-mono text-[11px]">{p.instrument.id}</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{p.accountId}</td>
                    <td className="px-3 py-3 text-right tabular">
                      {fmtNum(p.quantity)}
                      {p.quantity !== p.reportedQuantity && <div className="text-[11px] text-amber-700">reported {fmtNum(p.reportedQuantity)}</div>}
                    </td>
                    <td className="px-3 py-3 text-right tabular">
                      {fmtINR2(p.price)}
                      {stale && <div className="text-[11px] text-amber-700">{fmtDate(p.priceDate)}</div>}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular text-slate-900">{fmtINR(p.value)}</td>
                    <td className={cx('px-3 py-3 text-right tabular', p.unrealized == null ? 'text-slate-400' : p.unrealized >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                      {p.unrealized == null ? 'Unknown' : fmtSignedINR(p.unrealized)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {[p.primary, ...p.duplicates, ...(p.reference ? [p.reference] : [])].map((r) => (
                          <Pill key={r.id} className={r.sourceId === 'CAS' ? 'bg-emerald-50 text-emerald-700' : ''}>{sourceById[r.sourceId].shortName}</Pill>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {fs.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700"><Sparkles className="h-3.5 w-3.5" /> Consistent</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">{fs.map((f) => <SeverityBadge key={f.id} severity={f.severity} />)}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && <ProvenanceDrawer position={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ProvenanceDrawer({ position: p, onClose }: { position: Position; onClose: () => void }) {
  const { xray, go } = useApp();
  const fs = xray.findings.filter((f) => p.findingIds.includes(f.id));
  const recs = [p.primary, ...p.duplicates, ...(p.reference ? [p.reference] : [])];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="slide-in relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value provenance</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{p.instrument.name}</div>
            <div className="text-sm text-slate-500">{p.instrument.assetClass} · {p.instrument.sector} · {p.accountId}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">X-Ray value</div>
            <div className="text-2xl font-bold tabular text-slate-900">{fmtINR(p.value)}</div>
            <div className="mt-1 font-mono text-[12.5px] text-slate-600">{fmtNum(p.quantity)} {p.instrument.unit} × {fmtINR2(p.price)}</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[12.5px]">
              <div><div className="text-slate-500">Quantity from</div><div className="font-medium text-slate-800">{sourceById[p.primary.sourceId].shortName}{p.quantity !== p.reportedQuantity ? ' (adjusted)' : ''}</div></div>
              <div><div className="text-slate-500">Price from</div><div className="font-medium text-slate-800">{PRICE_SOURCE} · {fmtDate(p.priceDate)}</div></div>
              <div><div className="text-slate-500">Avg cost / unit</div><div className="font-medium text-slate-800">{p.costPerUnit != null ? fmtINR2(p.costPerUnit) : 'Missing'}</div></div>
              <div><div className="text-slate-500">Gain/loss</div><div className="font-medium text-slate-800">{p.unrealized != null ? fmtSignedINR(p.unrealized) : 'Cannot compute'}</div></div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-900">Records from each source</div>
            <div className="space-y-2">
              {recs.map((r) => {
                const s = sourceById[r.sourceId];
                return (
                  <div key={r.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-900">{s.name}</div>
                      <span className="text-[11px] text-slate-500">{fmtDate(s.asOf)}</span>
                    </div>
                    <div className="mt-1 text-[12.5px] text-slate-600">
                      {fmtNum(r.quantity)} {p.instrument.unit} · cost {r.avgCost != null ? fmtINR2(r.avgCost) : '—'} · as “{r.nameAsReported}”
                    </div>
                    <div className="mt-2 overflow-x-auto rounded-md bg-ink-900 px-2.5 py-1.5 font-mono text-[11px] text-emerald-200 thin-scroll whitespace-nowrap">{r.raw}</div>
                    {r === p.reference && <div className="mt-1.5 text-[11px] font-medium text-emerald-700">Used as reconciliation reference only — not added to totals</div>}
                    {p.duplicates.includes(r) && <div className="mt-1.5 text-[11px] font-medium text-rose-700">Excluded from totals — duplicate of the {sourceById[p.primary.sourceId].shortName} record</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {fs.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-900">X-Ray findings</div>
              <div className="space-y-2">
                {fs.map((f) => (
                  <button key={f.id} onClick={() => go({ page: 'xray', findingId: f.id })} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-slate-300 hover:bg-slate-50 cursor-pointer">
                    <SeverityBadge severity={f.severity} />
                    <span className="text-sm text-slate-800">{f.title}</span>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
