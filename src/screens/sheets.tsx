import { useEffect, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, CheckCircle2, Code2, ExternalLink, FileText, GitCompareArrows, HelpCircle, Lightbulb,
  Printer, RotateCcw, ShieldAlert, ShieldCheck, Sparkles, Trash2, XCircle,
} from 'lucide-react';
import { useStore, type Sheet as SheetT } from '../store';
import { Sheet, Chip, PrimaryButton, TaxChip, AllocationBar } from '../components/kit';
import { ConfidenceMeter, cx, Pill, SeverityBadge } from '../components/ui';
import { CATEGORY_LABEL, RULES, SEVERITY_WEIGHT, type Finding } from '../engine/xray';
import { topicById, topics, resources, type Topic } from '../data/learn';
import { INSTRUMENT_LESSONS } from '../data/instruments';
import { ReconcileVisual, RiskLadder, SplitVisual, YieldExplorer } from '../components/widgets';
import { LessonCard } from './AssistantTab';
import { DemoControls } from './DemoPanel';
import { DISCLAIMERS, RETURN_ASSUMPTIONS } from '../config/profile';
import { TAX_META } from '../config/tax';
import { fmtDate, fmtINR, fmtLakh } from '../lib/format';
import { tr, type SKey } from '../i18n';
import { CLASS_LABEL } from '../engine/suitability';

/** Sheets stack in place; lower sheets stay mounted (hidden) so they keep their state. */
export function SheetHost() {
  const { s, closeSheet } = useStore();
  const open = s.sheets.length > 0;
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, closeSheet]);
  return (
    <>
      {s.sheets.map((sh, i) => (
        <div key={`${i}-${sh.type}`} className={i === s.sheets.length - 1 ? 'contents' : 'hidden'}>
          <SheetView sh={sh} onClose={closeSheet} />
        </div>
      ))}
    </>
  );
}

function SheetView({ sh, onClose }: { sh: SheetT; onClose: () => void }) {
  switch (sh.type) {
    case 'finding': return <FindingSheet id={sh.id} onClose={onClose} />;
    case 'topic': return <TopicSheet id={sh.id} onClose={onClose} />;
    case 'lesson': return <Sheet title="Lesson" onClose={onClose}><LessonCard id={sh.id} /></Sheet>;
    case 'holding-tax': return <HoldingTaxSheet id={sh.id} onClose={onClose} />;
    case 'settings': return <SettingsSheet onClose={onClose} />;
    case 'how': return <HowSheet onClose={onClose} />;
    case 'share': return <ShareSheet onClose={onClose} />;
    case 'library': return <LibrarySheet onClose={onClose} />;
    case 'demo': return <Sheet title="Demo controls" onClose={onClose}><DemoControls /></Sheet>;
    case 'disclaimer': return (
      <Sheet title="Important" onClose={onClose} tall={false}>
        <ul className="list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed text-slate-700">{DISCLAIMERS.full.map((d) => <li key={d}>{d}</li>)}</ul>
      </Sheet>
    );
  }
}

// ── X-Ray finding ──────────────────────────────────────────────────────
function FindingSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, set, d, openSheet } = useStore();
  const findings = d.portfolio?.xray.findings ?? [];
  const [current, setCurrent] = useState(id);
  const f = findings.find((x) => x.id === current) ?? findings[0];
  if (!f) return <Sheet title="Data checks" onClose={onClose}><p className="text-slate-500">No findings.</p></Sheet>;
  const done = s.reviewed.includes(f.id);
  const topic = topicById[f.learnTopicId];
  return (
    <Sheet title={<span className="flex items-center gap-2">Data check <span className="font-mono text-[11px] text-slate-400">{f.id}</span></span>} onClose={onClose}>
      <div className="thin-scroll -mx-5 mb-3 flex gap-1.5 overflow-x-auto px-5 pb-1">
        {findings.map((x) => (
          <button key={x.id} onClick={() => setCurrent(x.id)} className={cx('shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset cursor-pointer', x.id === f.id ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-slate-600 ring-slate-200')}>
            {s.reviewed.includes(x.id) && '✓ '}{CATEGORY_LABEL[x.category]}
          </button>
        ))}
      </div>
      <FindingBody f={f} />
      <button onClick={() => openSheet({ type: 'topic', id: topic.id })} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3.5 text-left text-white cursor-pointer">
        <BookOpen className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-violet-200">Understand this · {topic.minutes} min</span>
          <span className="block truncate font-semibold">{topic.title}</span>
        </span>
        <ArrowRight className="h-4 w-4" />
      </button>
      <div className="mt-3">
        <PrimaryButton variant={done ? 'light' : 'dark'} onClick={() => set((st) => ({ reviewed: done ? st.reviewed.filter((x) => x !== f.id) : [...st.reviewed, f.id] }))}>
          {done ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Reviewed — undo</> : <><Check className="h-4 w-4" /> Mark as reviewed</>}
        </PrimaryButton>
      </div>
    </Sheet>
  );
}

function FindingBody({ f }: { f: Finding }) {
  const [raw, setRaw] = useState(false);
  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-1.5"><SeverityBadge severity={f.severity} /><Pill>{CATEGORY_LABEL[f.category]}</Pill><Pill>Rule {f.ruleId}</Pill></div>
        <h2 className="mt-2 text-[17px] font-bold leading-snug text-slate-900">{f.title}</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-slate-600">{f.summary}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
          <ConfidenceMeter confidence={f.confidence} />
          {f.impact.valueAtStake > 1 && <span>{f.impact.label}: <b className="tabular text-slate-800">{fmtINR(f.impact.valueAtStake)}</b></span>}
        </div>
      </div>
      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900"><FileText className="h-4 w-4 text-slate-500" /> Evidence & where each value came from</h3>
          <button onClick={() => setRaw((v) => !v)} className="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-500 cursor-pointer"><Code2 className="h-3.5 w-3.5" /> {raw ? 'Hide' : 'Raw'}</button>
        </div>
        <div className="space-y-1.5">
          {f.evidence.map((e, i) => (
            <div key={i} className={cx('rounded-xl border border-slate-200 px-3 py-2', e.flag && 'hatch border-amber-300')}>
              <div className="flex justify-between gap-2 text-[11px] text-slate-500"><span className="truncate">{e.source}</span><span className="shrink-0">{e.asOf ? fmtDate(e.asOf) : ''}</span></div>
              <div className="text-[13px]"><span className="text-slate-500">{e.field}: </span><b className={e.flag ? 'text-amber-900' : 'text-slate-900'}>{e.value}</b></div>
              {raw && e.raw && <div className="mt-1 overflow-x-auto whitespace-nowrap rounded bg-ink-900 px-2 py-1 font-mono text-[10.5px] text-emerald-200 thin-scroll">{e.raw}</div>}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-900"><GitCompareArrows className="h-4 w-4 text-slate-500" /> How we reached this</h3>
        <ol className="space-y-1.5">
          {f.reasoning.map((r, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-700"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-900 text-[10.5px] font-bold text-white">{i + 1}</span>{r}</li>
          ))}
        </ol>
      </section>
      <section className="rounded-xl border border-slate-200 p-3">
        <h3 className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-900"><Lightbulb className="h-4 w-4 text-slate-500" /> Possible explanations</h3>
        {f.explanations.map((e, i) => (
          <p key={i} className="text-[13px] text-slate-700"><span className={cx('mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', e.likelihood === 'Likely' ? 'bg-emerald-50 text-emerald-700' : e.likelihood === 'Possible' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500')}>{e.likelihood}</span>{e.text}</p>
        ))}
      </section>
      <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <h3 className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-slate-900"><HelpCircle className="h-4 w-4 text-slate-500" /> Uncertainty</h3>
        <p className="text-[13px] leading-relaxed text-slate-700">{f.uncertainty}</p>
        <p className="mt-1 text-[12px] text-slate-500"><b>Why this confidence:</b> {f.confidenceNote}</p>
      </section>
      <section>
        <h3 className="mb-1 text-[13px] font-semibold text-slate-900">How to verify</h3>
        {f.nextSteps.map((x) => <p key={x} className="flex gap-2 text-[13px] text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{x}</p>)}
      </section>
    </div>
  );
}

// ── Lesson topic with quiz ─────────────────────────────────────────────
function TopicSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { set, d, openSheet } = useStore();
  const t = topicById[id];
  useEffect(() => { set((st) => (st.learn.visited.includes(id) ? {} : { learn: { ...st.learn, visited: [...st.learn.visited, id] } })); }, [id, set]);
  if (!t) return null;
  const linked = d.portfolio?.xray.findings.filter((f) => f.learnTopicId === id) ?? [];
  return (
    <Sheet title={t.title} onClose={onClose}>
      <div className={cx('rounded-2xl bg-gradient-to-br p-4 text-white', t.accent)}>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{t.category} · {t.minutes} min</div>
        <p className="mt-1 text-[14px]">{t.tagline}</p>
      </div>
      {linked.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-emerald-700">Seen in your data</div>
          {linked.map((f) => (
            <button key={f.id} onClick={() => openSheet({ type: 'finding', id: f.id })} className="flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-left text-[12.5px] text-slate-800 cursor-pointer"><SeverityBadge severity={f.severity} /> <span className="truncate">{f.title}</span></button>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-4">
        {t.sections.map((sec) => (
          <section key={sec.heading}>
            <h3 className="text-[15px] font-bold text-slate-900">{sec.heading}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-slate-700">{sec.body}</p>
            {sec.bullets && <ul className="mt-1 space-y-1">{sec.bullets.map((b) => <li key={b} className="flex gap-2 text-[13.5px] leading-relaxed text-slate-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />{b}</li>)}</ul>}
          </section>
        ))}
      </div>
      {t.widget && (
        <div className="mt-4 [&_.grid]:grid-cols-1">
          {t.widget === 'yield-explorer' && <YieldExplorer />}
          {t.widget === 'risk-ladder' && <RiskLadder />}
          {t.widget === 'split-visual' && <SplitVisual />}
          {t.widget === 'reconcile-visual' && <ReconcileVisual />}
        </div>
      )}
      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-amber-500" /> Key takeaways</div>
        {t.takeaways.map((x) => <p key={x} className="mt-1 flex gap-2 text-[13px] text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{x}</p>)}
      </div>
      <Quiz topic={t} />
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Official resources</div>
        <div className="mt-2 space-y-1.5">
          {t.resources.map((rid) => {
            const r = resources[rid];
            return (
              <a key={rid} href={r.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50">
                <span className="flex items-center gap-1 text-[13px] font-semibold text-slate-900">{r.title} <ExternalLink className="h-3 w-3 text-slate-400" /></span>
                <span className="block text-[11.5px] text-emerald-700">{r.publisher}</span>
              </a>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-slate-400">General education only — not investment, tax or legal advice.</p>
    </Sheet>
  );
}

function Quiz({ topic }: { topic: Topic }) {
  const { set } = useStore();
  const [answers, setAnswers] = useState<(number | null)[]>(topic.quiz.map(() => null));
  const [checked, setChecked] = useState(false);
  const score = answers.filter((a, i) => a === topic.quiz[i].answer).length;
  const submit = () => {
    setChecked(true);
    set((st) => ({ learn: { ...st.learn, quizBest: { ...st.learn.quizBest, [topic.id]: Math.max(score, st.learn.quizBest[topic.id] ?? 0) } } }));
  };
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
      <div className="text-[14px] font-semibold text-slate-900">Quick check</div>
      <div className="mt-3 space-y-4">
        {topic.quiz.map((q, qi) => (
          <div key={qi}>
            <div className="text-[13.5px] font-semibold text-slate-900">{qi + 1}. {q.q}</div>
            <div className="mt-1.5 grid gap-1.5">
              {q.options.map((o, oi) => {
                const picked = answers[qi] === oi;
                const correct = q.answer === oi;
                return (
                  <button key={oi} disabled={checked} onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                    className={cx('flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition',
                      !checked && (picked ? 'border-ink-900 bg-ink-900 text-white' : 'border-slate-200 cursor-pointer hover:border-slate-400'),
                      checked && correct && 'border-emerald-500 bg-emerald-50 text-emerald-900',
                      checked && picked && !correct && 'border-rose-400 bg-rose-50 text-rose-900',
                      checked && !picked && !correct && 'border-slate-200 text-slate-400')}>
                    {checked && correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                    {checked && picked && !correct && <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                    {o}
                  </button>
                );
              })}
            </div>
            {checked && <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[12.5px] text-slate-600"><b>Why:</b> {q.why}</p>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!checked ? (
          <PrimaryButton disabled={answers.some((a) => a == null)} onClick={submit}>Check answers</PrimaryButton>
        ) : (
          <>
            <span className={cx('rounded-lg px-3 py-2 text-[13px] font-semibold', score >= 2 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800')}>{score}/3 — {score === 3 ? 'Mastered!' : score >= 2 ? 'Passed' : 'Review and try again'}</span>
            <Chip onClick={() => { setAnswers(topic.quiz.map(() => null)); setChecked(false); }}><RotateCcw className="mr-1 inline h-3 w-3" />Try again</Chip>
          </>
        )}
      </div>
    </div>
  );
}

// ── tax detail for one holding ─────────────────────────────────────────
function HoldingTaxSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { d } = useStore();
  const h = d.portfolio?.holdings.find((x) => x.holdingId === id);
  const t = d.analysis?.tax.perHolding[id];
  const tax = d.analysis?.tax;
  if (!h || !t || !tax) return null;
  return (
    <Sheet title={`Tax · ${h.name}`} onClose={onClose} tall={false}>
      <TaxChip text={t.chip} verified={t.verified} />
      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-700">{t.detail}</p>
      <div className="mt-3 grid gap-1.5 text-[13px]">
        {t.annualTax > 0 && <Row k="Extra tax on its interest each year" v={fmtINR(t.annualTax)} />}
        {t.postTaxYield != null && <Row k="Yield after tax (approx.)" v={`${t.postTaxYield.toFixed(2)}%`} />}
        <Row k="If sold today (stacked with your other holdings)" v={t.gainType === 'unknown' ? 'Unknown — cost missing' : fmtINR(t.ifSoldTax)} />
        <Row k="Gain type" v={{ slab: 'Slab-rate gain', STCG: 'Short-term (<12 months)', LTCG: 'Long-term (≥12 months)', none: 'None', unknown: 'Unknown' }[t.gainType]} />
        <Row k="Your marginal rate" v={`${(tax.marginalRate * 100).toFixed(1)}%`} />
      </div>
      {!t.verified && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-900"><ShieldAlert className="mr-1 inline h-3.5 w-3.5" />This rule is marked “to verify” in our tax table. Treat as an estimate only.</p>}
      <p className="mt-3 text-[11px] text-slate-500">{TAX_META.disclaimer}</p>
      <p className="mt-1 text-[11px] text-slate-400">{TAX_META.financialYear} · {TAX_META.source} (stated date {fmtDate(TAX_META.lastVerified)}). Excludes {TAX_META.estimateOnly.join(', ')}.</p>
    </Sheet>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-600">{k}</span><b className="text-right tabular text-slate-900">{v}</b></div>;

// ── settings, revoke, how it works, share, library ─────────────────────
function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { s, set, reset, openSheet } = useStore();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="space-y-2">
        <Toggle label="Language" value={s.lang === 'hi' ? 'हिंदी' : 'English'} onClick={() => set({ lang: s.lang === 'hi' ? 'en' : 'hi' })} />
        <Toggle label="Simple view" value={s.simpleView ? 'On' : 'Off'} onClick={() => set({ simpleView: !s.simpleView })} />
        <Toggle label="Tax regime" value={s.answers.regime === 'old' ? 'Old' : 'New (default)'} onClick={() => set((st) => ({ answers: { ...st.answers, regime: st.answers.regime === 'old' ? 'new' : 'old' } }))} />
        <Toggle label="Re-check my profile" value="Start" onClick={() => set({ stage: 'intro', introIndex: 0, sheets: [] })} />
        <Toggle label="Share a one-page summary" value="Open" onClick={() => openSheet({ type: 'share' })} />
        <Toggle label="How this works" value="Open" onClick={() => openSheet({ type: 'how' })} />
        <Toggle label="Demo controls" value="Open" onClick={() => openSheet({ type: 'demo' })} />
      </div>
      <div className="mt-5 rounded-2xl border border-rose-200 p-4">
        <div className="text-[14px] font-semibold text-slate-900">Data access</div>
        <p className="mt-1 text-[12.5px] text-slate-500">Consent: {s.mode === 'sample' ? 'sample data (no consent needed)' : s.consent ? `${s.consent.id} · ${s.consent.status} · ${s.consent.duration}` : 'none'}</p>
        {!confirmRevoke ? (
          <PrimaryButton variant="light" className="mt-3 text-rose-700" onClick={() => setConfirmRevoke(true)}><Trash2 className="h-4 w-4" /> Revoke access & delete my data</PrimaryButton>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-[12.5px] text-rose-700">This revokes consent and deletes this session’s answers, fetched data and results from this browser.</p>
            <PrimaryButton className="bg-rose-600 hover:bg-rose-700" onClick={() => reset({ lang: s.lang })}>Yes, revoke and delete</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setConfirmRevoke(false)}>Cancel</PrimaryButton>
          </div>
        )}
      </div>
    </Sheet>
  );
}

const Toggle = ({ label, value, onClick }: { label: string; value: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-[14px] cursor-pointer hover:bg-slate-100">
    <span className="font-medium text-slate-800">{label}</span><span className="text-slate-500">{value} ›</span>
  </button>
);

function HowSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="How this works" onClose={onClose}>
      <div className="space-y-4 text-[13.5px] leading-relaxed text-slate-700">
        <p><b>Numbers come from engines; words come from the assistant.</b> Every figure is produced by fixed, unit-tested rules running in your browser. The assistant is scripted — it only narrates engine outputs and a reviewed lesson library. No AI model is used.</p>
        <ol className="space-y-1.5">
          {[
            ['Mock Account Aggregator', 'Simulates consent, one fetch session per account, and failures (fail / partial / timeout).'],
            ['Normalisation', 'Validates records, matches names/tickers to identifiers, merges the same security across accounts (weighted average cost), classifies into equity / debt / gold / cash.'],
            ['Data checks (X-Ray)', `${RULES.length} rules: duplicates, corporate actions, quantity conflicts, missing cost, stale prices, coupon-vs-yield labels, rounding.`],
            ['Risk engine', 'Ability (horizon, dependents, income stability, EMIs, emergency buffer, surplus) and willingness (scenario answers). The lower one wins.'],
            ['Suitability', 'Compares your mix with a target by profile and life stage: fits, too aggressive, too cautious, idle cash, too concentrated.'],
            ['Tax engine', `Stacking method on ${TAX_META.financialYear} rates: slab income pooled; equity gains at special rates with a shared ₹1.25 lakh exemption.`],
            ['Calculator', 'SIP and lump-sum formulas with a cautious / expected / optimistic range, inflation and after-tax toggles.'],
          ].map(([t, dsc], i) => (
            <li key={t} className="flex gap-2.5"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-900 text-[10.5px] font-bold text-white">{i + 1}</span><span><b>{t}.</b> {dsc}</span></li>
          ))}
        </ol>
        <div className="rounded-xl bg-slate-50 p-3 text-[12.5px]">
          <b>Data-integrity score</b> = 100 − Σ weight of open findings ({Object.entries(SEVERITY_WEIGHT).map(([k, v]) => `${k} ${v}`).join(', ')}).
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-[12.5px]">
          <b>Return assumptions</b> (cautious / expected / optimistic): {Object.entries(RETURN_ASSUMPTIONS).map(([k, v]) => `${k} ${v.cautious}/${v.expected}/${v.optimistic}%`).join(' · ')}.
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900 ring-1 ring-amber-200">
          <b>Tax assumptions.</b> {TAX_META.disclaimer} To verify before real use:
          <ul className="mt-1 list-disc space-y-0.5 pl-5">{TAX_META.toVerify.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-slate-600">{DISCLAIMERS.full.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </Sheet>
  );
}

function ShareSheet({ onClose }: { onClose: () => void }) {
  const { s, d } = useStore();
  const a = d.analysis;
  const p = d.portfolio;
  if (!a || !p) return null;
  return (
    <Sheet title="One-page summary" onClose={onClose}>
      <div id="share-print" className="rounded-2xl border border-slate-200 p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Investor Assistant · summary · {fmtDate(p.asOf)}</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
          <Row k="Risk profile" v={tr(s.lang, a.risk.label as SKey)} />
          <Row k="Total value" v={fmtLakh(p.totalValue)} />
        </div>
        <div className="mt-3"><AllocationBar current={a.suit.current} target={a.suit.target} height={10} /></div>
        <p className="mt-3 text-[14px] font-semibold text-slate-900">{a.advice.headline}</p>
        <ul className="mt-1 space-y-0.5 text-[12.5px] text-slate-700">{a.advice.suggestions.slice(0, 3).map((x) => <li key={x.text}>• {x.text}</li>)}</ul>
        <p className="mt-2 text-[12.5px] text-slate-600">Estimated tax on yearly interest: {fmtLakh(a.tax.annualInterestTax)} ({a.tax.regime} regime).</p>
        <p className="mt-3 text-[10.5px] leading-snug text-slate-400">{DISCLAIMERS.short} Demo data — fictional accounts.</p>
      </div>
      <PrimaryButton className="mt-3" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print or save as PDF</PrimaryButton>
    </Sheet>
  );
}

function LibrarySheet({ onClose }: { onClose: () => void }) {
  const { s, openSheet } = useStore();
  const passed = topics.filter((t) => (s.learn.quizBest[t.id] ?? 0) >= 2).length;
  return (
    <Sheet title="Lessons & quizzes" onClose={onClose}>
      <div className="flex items-center justify-between rounded-2xl bg-violet-50 px-4 py-3 text-[13px] text-violet-900">
        <span><b className="tabular">{passed}</b> of {topics.length} quizzes passed</span>
        <span><b className="tabular">{s.learn.visited.length}</b> opened</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {topics.map((t) => {
          const best = s.learn.quizBest[t.id];
          return (
            <button key={t.id} onClick={() => openSheet({ type: 'topic', id: t.id })} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left cursor-pointer hover:bg-slate-50">
              <span className={cx('h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br', t.accent)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-slate-900">{t.title}</span>
                <span className="block text-[11.5px] text-slate-500">{t.category} · {t.minutes} min</span>
              </span>
              {best != null && <span className={cx('text-[12px] font-semibold', best >= 2 ? 'text-emerald-700' : 'text-amber-700')}>{best}/3</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Instrument cards</div>
      <div className="mt-2 space-y-2">{INSTRUMENT_LESSONS.map((l) => <LessonCard key={l.id} id={l.id} />)}</div>
      <p className="mt-3 text-[11.5px] text-slate-400">Classes: {Object.values(CLASS_LABEL).join(', ')}. Tax chips marked * are “to verify”.</p>
    </Sheet>
  );
}
