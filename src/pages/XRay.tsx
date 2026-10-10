import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, Code2, FileText, GitCompareArrows, HelpCircle, Lightbulb,
  ListChecks, Loader2, RefreshCw, ScanLine, SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../state';
import { PageHeader } from '../components/Layout';
import { Button, Card, ConfidenceMeter, cx, Pill, SeverityBadge, sevDot } from '../components/ui';
import { CATEGORY_LABEL, RULES, type Finding, type Severity } from '../engine/xray';
import { AS_OF, instrumentById, sources } from '../data/portfolio';
import { topicById } from '../data/learn';
import { fmtDate, fmtINR } from '../lib/format';

let scannedThisSession = false;

export function XRay({ findingId }: { findingId?: string }) {
  const { xray, reviewed, go } = useApp();
  const [scanStep, setScanStep] = useState(scannedThisSession ? RULES.length : 0);
  const scanning = scanStep < RULES.length;
  const [sevFilter, setSevFilter] = useState<Severity | 'All'>('All');
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!scanning) { scannedThisSession = true; return; }
    const t = setTimeout(() => setScanStep((s) => s + 1), 260);
    return () => clearTimeout(t);
  }, [scanStep, scanning]);

  const list = useMemo(
    () => xray.findings.filter((f) => sevFilter === 'All' || f.severity === sevFilter),
    [xray.findings, sevFilter],
  );
  const selected = xray.findings.find((f) => f.id === findingId) ?? list[0];

  return (
    <>
      <PageHeader
        eyebrow="Portfolio X-Ray"
        title="Explainable data-integrity findings"
        subtitle={`${RULES.length} fixed rules checked ${xray.positions.length} positions from ${sources.length} synthetic sources. Every finding shows its evidence, the source of each value, its reasoning and what remains uncertain.`}
        right={
          <Button variant="secondary" onClick={() => setScanStep(0)} disabled={scanning}>
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Re-run rules
          </Button>
        }
      />

      {scanning ? (
        <Card className="p-8">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center gap-3">
              <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-ink-900">
                <ScanLine className="h-6 w-6 text-emerald-400" />
                <span className="absolute inset-0 animate-ping rounded-2xl bg-emerald-400/20" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Running X-Ray rules…</div>
                <div className="text-sm text-slate-500">Deterministic checks running locally in your browser</div>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {RULES.map((r, i) => (
                <div key={r.id} className={cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition', i < scanStep ? 'text-slate-700' : i === scanStep ? 'bg-emerald-50 text-slate-900' : 'text-slate-400')}>
                  {i < scanStep ? <Check className="h-4 w-4 text-emerald-600" /> : i === scanStep ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                  <span className="font-mono text-xs text-slate-400">{r.id}</span> {r.name}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary strip */}
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {(['High', 'Medium', 'Low', 'Info'] as const).map((s) => {
              const n = xray.findings.filter((f) => f.severity === s).length;
              const active = sevFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setSevFilter(active ? 'All' : s)}
                  className={cx('rounded-xl border bg-white p-3 text-left transition cursor-pointer', active ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300')}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><span className={cx('h-2 w-2 rounded-full', sevDot[s])} /> {s} severity</div>
                  <div className="mt-1 text-2xl font-bold tabular text-slate-900">{n}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                <span>{list.length} finding{list.length === 1 ? '' : 's'}{sevFilter !== 'All' ? ` · ${sevFilter}` : ''}</span>
                <button onClick={() => setShowRules((v) => !v)} className="inline-flex items-center gap-1 font-medium hover:text-slate-800 cursor-pointer">
                  <ListChecks className="h-3.5 w-3.5" /> Rules run <ChevronDown className={cx('h-3 w-3 transition', showRules && 'rotate-180')} />
                </button>
              </div>
              {showRules && (
                <Card className="p-3">
                  <ul className="space-y-2 text-[12.5px]">
                    {RULES.map((r) => (
                      <li key={r.id} className="flex gap-2">
                        <span className="font-mono text-[11px] text-slate-400">{r.id}</span>
                        <span><b className="font-semibold text-slate-800">{r.name}.</b> <span className="text-slate-500">{r.description}</span></span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {list.map((f) => {
                const active = selected?.id === f.id;
                const done = reviewed.has(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => go({ page: 'xray', findingId: f.id })}
                    className={cx(
                      'group w-full rounded-xl border bg-white p-3.5 text-left transition cursor-pointer',
                      active ? 'border-slate-900 shadow-md ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
                      done && !active && 'opacity-60',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={f.severity} />
                      <Pill>{CATEGORY_LABEL[f.category]}</Pill>
                      {done && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />}
                    </div>
                    <div className="mt-2 text-[14px] font-semibold leading-snug text-slate-900">{f.title}</div>
                    <div className="mt-1 flex items-center justify-between text-[12px] text-slate-500">
                      <span>{f.impact.label}</span>
                      {f.impact.valueAtStake > 1 && <span className="font-semibold tabular text-slate-700">{fmtINR(f.impact.valueAtStake)}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {selected && <FindingDetail finding={selected} autoScroll={!!findingId} />}
          </div>
        </>
      )}
    </>
  );
}

function FindingDetail({ finding: f, autoScroll }: { finding: Finding; autoScroll: boolean }) {
  const { reviewed, toggleReviewed, go, progress } = useApp();
  const [showRaw, setShowRaw] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // on single-column layouts the detail sits below the list — bring it into view
  useEffect(() => {
    if (autoScroll && window.innerWidth < 1280) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [f.id, autoScroll]);
  const topic = topicById[f.learnTopicId];
  const inst = instrumentById[f.instrumentId];
  const done = reviewed.has(f.id);
  const learned = (progress.quizBest[topic.id] ?? 0) >= 2;

  return (
    <Card className="fade-up overflow-hidden scroll-mt-28" key={f.id} ref={ref}>
      <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{f.id}</span>
          <SeverityBadge severity={f.severity} />
          <Pill>{CATEGORY_LABEL[f.category]}</Pill>
          <Pill>Rule {f.ruleId} · {f.ruleName}</Pill>
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{f.title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{f.summary}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-[11.5px] font-medium text-slate-500">Instrument</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">{inst.name}</div>
            <div className="text-[11.5px] text-slate-500">{f.accountId}</div>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-[11.5px] font-medium text-slate-500">{f.impact.label}</div>
            <div className="mt-0.5 text-sm font-semibold tabular text-slate-900">{f.impact.valueAtStake > 1 ? fmtINR(f.impact.valueAtStake) : f.impact.valueAtStake > 0 ? '< ₹1' : 'No value impact'}</div>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-[11.5px] font-medium text-slate-500">Rule confidence</div>
            <div className="mt-1"><ConfidenceMeter confidence={f.confidence} /></div>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-5">
        {/* Evidence */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><FileText className="h-4 w-4 text-slate-500" /> Evidence &amp; value sources</h3>
            <button onClick={() => setShowRaw((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer">
              <Code2 className="h-3.5 w-3.5" /> {showRaw ? 'Hide' : 'Show'} raw lines
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 thin-scroll">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Source</th><th className="px-3 py-2">Field</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">As of</th>
                </tr>
              </thead>
              <tbody>
                {f.evidence.map((e, i) => (
                  <tr key={i} className={cx('border-t border-slate-100 align-top', e.flag && 'hatch')}>
                    <td className="px-3 py-2 text-slate-700">
                      {e.source}
                      {showRaw && e.raw && <div className="mt-1 rounded bg-ink-900 px-2 py-1 font-mono text-[10.5px] text-emerald-200">{e.raw}</div>}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{e.field}</td>
                    <td className={cx('px-3 py-2 font-medium', e.flag ? 'text-amber-900' : 'text-slate-900')}>{e.value}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-500">{e.asOf ? fmtDate(e.asOf) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-[11.5px] text-slate-500"><span className="hatch inline-block h-2.5 w-4 rounded-sm align-middle ring-1 ring-amber-300" /> Highlighted rows are the values in conflict.</p>
        </section>

        {/* Reasoning */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900"><GitCompareArrows className="h-4 w-4 text-slate-500" /> How X-Ray reached this</h3>
          <ol className="space-y-2">
            {f.reasoning.map((r, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-slate-700">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white">{i + 1}</span>
                {r}
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900"><Lightbulb className="h-4 w-4 text-slate-500" /> Possible explanations</h3>
            <ul className="space-y-2">
              {f.explanations.map((e, i) => (
                <li key={i} className="text-[13.5px] text-slate-700">
                  <span className={cx('mr-1.5 rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase',
                    e.likelihood === 'Likely' ? 'bg-emerald-50 text-emerald-700' : e.likelihood === 'Possible' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500')}>{e.likelihood}</span>
                  {e.text}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900"><HelpCircle className="h-4 w-4 text-slate-500" /> Uncertainty</h3>
            <p className="text-[13.5px] leading-relaxed text-slate-700">{f.uncertainty}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500"><b className="font-semibold">Why this confidence:</b> {f.confidenceNote}</p>
          </section>
        </div>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Suggested verification steps</h3>
          <ul className="space-y-1.5">
            {f.nextSteps.map((s, i) => (
              <li key={i} className="flex gap-2 text-[13.5px] text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {s}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] text-slate-500">Steps are general information about checking your records, not investment advice.</p>
        </section>

        {/* Learn link */}
        <button
          onClick={() => go({ page: 'topic', topicId: topic.id })}
          className="group flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-left text-white shadow-lg shadow-indigo-600/20 transition hover:shadow-xl cursor-pointer"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15"><BookOpen className="h-5 w-5" /></div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-200">Understand this finding · {topic.minutes} min</div>
            <div className="font-semibold">{topic.title}</div>
            <div className="truncate text-[13px] text-violet-100">{topic.tagline}</div>
          </div>
          {learned && <span className="ml-auto shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">Passed ✓</span>}
          <ArrowRight className={cx('h-5 w-5 shrink-0 transition group-hover:translate-x-0.5', !learned && 'ml-auto')} />
        </button>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button variant={done ? 'secondary' : 'primary'} onClick={() => toggleReviewed(f.id)}>
            {done ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Reviewed — undo</> : <><Check className="h-4 w-4" /> Mark as reviewed</>}
          </Button>
          {f.scenarios.length > 1 && (
            <Button variant="secondary" onClick={() => go({ page: 'simulator', findingId: f.id })}>
              <SlidersHorizontal className="h-4 w-4" /> Simulate interpretations
            </Button>
          )}
          <span className="ml-auto self-center text-[11.5px] text-slate-400">Data as of {fmtDate(AS_OF)} · synthetic</span>
        </div>
      </div>
    </Card>
  );
}
