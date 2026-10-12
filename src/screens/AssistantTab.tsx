import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EnglishOnly } from '../components/EnglishOnly';
import { ArrowLeft, ArrowRight, BookOpen, Bot, ChevronRight, Info, ScanLine, Send, Sparkles, X } from 'lucide-react';
import { incompleteNotes, useStore } from '../store';
import { tr, type SKey } from '../i18n';
import { AllocationBar, Chip, TaxChip } from '../components/kit';
import { cx } from '../components/ui';
import { lessonById } from '../data/instruments';
import { topics } from '../data/learn';
import { personaById } from '../engine/aa';
import type { AssistantAction, Block, ChatMessage } from '../engine/assistant';
import { fmtINR, fmtLakh } from '../lib/format';
import { DISCLAIMERS } from '../config/profile';

export function AssistantTab() {
  const { s } = useStore();
  return s.chatOpen ? <Chat /> : <Home />;
}

function Home() {
  const { s, set, d, openChat, openSheet } = useStore();
  const l = s.lang;
  const a = d.analysis;
  const p = d.portfolio;
  if (!a || !p) return <div className="p-6 text-slate-500">No portfolio yet.</div>;
  const adv = a.advice;
  const passed = topics.filter((t) => (s.learn.quizBest[t.id] ?? 0) >= 2).length;
  const name = s.mode === 'sample' ? personaById(s.personaId).displayName.split(' ')[0] : '';
  const incomplete = incompleteNotes(s, (id) => id).length;

  return (
    <div className="space-y-3 px-4 pb-6 pt-4">
      <div className="px-1">
        <div className="text-[13px] text-slate-500">{tr(l, 'hello')}{name ? `, ${name}` : ''} 👋</div>
        <div className="text-[12px] text-slate-400">{s.mode === 'sample' ? 'Sample persona · ' : ''}{tr(l, 'demo')} · {tr(l, a.risk.label as SKey)}</div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="text-[12.5px] font-medium text-slate-500">{tr(l, 'totalValue')}</div>
        <div className="mt-0.5 text-[32px] font-bold tracking-tight tabular text-slate-900">{fmtINR(p.totalValue)}</div>
        <div className="text-[12px] text-slate-400">≈ {fmtLakh(p.totalValue)} · {p.holdings.length} holdings{p.accountsCount ? ` · ${p.accountsCount} accounts` : ' · added manually'}</div>
        {incomplete > 0 && (
          <button onClick={() => set({ tab: 'money' })} className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-left text-[12px] font-medium text-amber-900 ring-1 ring-amber-200 cursor-pointer">
            ⚠ Incomplete: {incomplete} account{incomplete > 1 ? 's' : ''} missing or partial — see My money to retry.
          </button>
        )}
        {!s.simpleView && (
          <div className="mt-4">
            <AllocationBar current={a.suit.current} target={a.suit.target} />
            <p className="mt-1.5 text-[11px] text-slate-400">{tr(l, 'ticksNote')}</p>
          </div>
        )}
        <div className={cx('mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold',
          adv.verdict === 'fits' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900')}>
          <Sparkles className="h-3.5 w-3.5" /> {tr(l, `verdict.${adv.verdict}` as SKey)}
        </div>
      </div>

      {/* single advice card — expands into the chat in place */}
      <button onClick={() => openChat('advice')} className="advice-card group block w-full overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-[#0f3b36] p-5 text-left text-white shadow-lg cursor-pointer">
        <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-emerald-300"><Bot className="h-4 w-4" /> {s.simpleView ? tr(l, 'nextStep') : tr(l, 'forYou')}</div>
        <div className="mt-2 text-[18px] font-semibold leading-snug">{adv.headline}</div>
        {!s.simpleView && <p className="mt-1.5 text-[13px] leading-snug text-slate-300">{adv.why[0]}</p>}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-ink-900 transition group-hover:gap-2.5">
          {tr(l, 'talkItThrough')} <ArrowRight className="h-4 w-4" />
        </div>
      </button>

      <EnglishOnly />
      {!s.simpleView && (
        <>
          {adv.dataNote && (
            <button onClick={() => set({ tab: 'money' })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-100 cursor-pointer">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><ScanLine className="h-4 w-4" /></span>
              <span className="text-[13px] leading-snug text-slate-700">{adv.dataNote}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          )}
          <button onClick={() => openSheet({ type: 'library' })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-100 cursor-pointer">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><BookOpen className="h-4 w-4" /></span>
            <span className="flex-1">
              <span className="block text-[14px] font-semibold text-slate-900">{tr(l, 'lessons')}</span>
              <span className="block text-[12px] text-slate-500">{passed} of {topics.length} passed · bonds, G-Secs, funds, REITs, risk…</span>
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
          {!s.lifeChangeDismissed && (
            <div className="flex items-center gap-3 rounded-2xl bg-sky-50 p-3.5 text-[13px] text-sky-900 ring-1 ring-sky-100">
              <button onClick={() => set({ stage: 'intro', introIndex: 0 })} className="min-h-8 flex-1 py-1 text-left font-medium cursor-pointer">{tr(l, 'lifeChange')}</button>
              <button onClick={() => set({ lifeChangeDismissed: true })} aria-label="Dismiss" className="rounded-full p-1 hover:bg-sky-100 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
          )}
          <button onClick={() => openSheet({ type: 'disclaimer' })} className="w-full pt-1 text-center text-[11.5px] text-slate-400 underline cursor-pointer">{DISCLAIMERS.short}</button>
        </>
      )}
    </div>
  );
}

function Chat() {
  const { s, set, ask } = useStore();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [s.chat.length, typing]);

  const send = (t: string) => {
    if (!t.trim()) return;
    setText('');
    setTyping(true);
    ask(t);
    setTimeout(() => setTyping(false), 450);
  };

  const visible = typing ? s.chat.slice(0, -1) : s.chat;
  const last = visible[visible.length - 1];

  return (
    <div className="chat-expand flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-[#f7f8fb]/95 px-3 py-2 backdrop-blur">
        <button onClick={() => set({ chatOpen: false })} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-200/60 cursor-pointer" aria-label="Back to home"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-slate-900">Guided assistant</div>
          <div className="text-[11px] text-slate-500">Scripted from your numbers · no AI model</div>
        </div>
        <button onClick={() => set({ disclaimerSeen: false })} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200/60 cursor-pointer" aria-label="Show disclaimer"><Info className="h-[18px] w-[18px]" /></button>
      </div>

      <div className="flex-1 space-y-3 px-3 py-3">
        <EnglishOnly />
        {!s.disclaimerSeen && (
          <div className="rounded-2xl bg-amber-50 p-3.5 text-[12.5px] leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <ul className="list-disc space-y-1 pl-4">{DISCLAIMERS.full.map((x) => <li key={x}>{x}</li>)}</ul>
            <button onClick={() => set({ disclaimerSeen: true })} className="mt-2 rounded-full bg-amber-900 px-3 py-1 text-[12px] font-semibold text-white cursor-pointer">Got it</button>
          </div>
        )}
        {visible.map((m) => <Message key={m.id} m={m} />)}
        {typing && <div className="flex gap-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-100 w-16"><Dot d={0} /><Dot d={150} /><Dot d={300} /></div>}
        {!typing && last?.role === 'assistant' && last.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {last.chips.map((c) => <Chip key={c} onClick={() => send(c)} className="bg-emerald-50 text-emerald-900 ring-emerald-200 hover:bg-emerald-100">{c}</Chip>)}
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="sticky bottom-0 flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about your mix, tax, FDs, G-Secs…" className="min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-300" aria-label="Message" />
        <button type="submit" disabled={!text.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-ink-900 text-white disabled:opacity-30 cursor-pointer" aria-label="Send"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

const Dot = ({ d }: { d: number }) => <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />;

function Message({ m }: { m: ChatMessage }) {
  if (m.role === 'user') {
    return <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-ink-900 px-3.5 py-2.5 text-[14px] text-white fade-up">{(m.blocks[0] as { text: string }).text}</div>;
  }
  return (
    <div className="max-w-[94%] space-y-2 rounded-2xl rounded-bl-md bg-white p-3.5 ring-1 ring-slate-100 fade-up">
      {m.blocks.map((b, i) => <BlockView key={i} b={b} />)}
    </div>
  );
}

function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => (p.startsWith('**') ? <b key={i} className="font-semibold text-slate-900">{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}</>;
}

function BlockView({ b }: { b: Block }) {
  const { set, openSheet } = useStore();
  const act = (a: AssistantAction) => {
    if (a.type === 'open-grow') set({ calc: { mode: a.prefill.mode, amount: a.prefill.amount, years: a.prefill.years, ratePct: a.prefill.ratePct, afterTax: null, inflationAdjusted: false }, tab: 'grow', chatOpen: false });
    else if (a.type === 'open-topic') openSheet({ type: 'topic', id: a.topicId });
    else if (a.type === 'open-finding') openSheet({ type: 'finding', id: a.findingId });
    else set({ tab: a.tab, chatOpen: false });
  };
  switch (b.kind) {
    case 'text': return <p className="text-[14px] leading-relaxed text-slate-700"><Rich text={b.text} /></p>;
    case 'note': return <p className="rounded-xl bg-slate-50 px-3 py-2 text-[12.5px] leading-snug text-slate-600">{b.text}</p>;
    case 'stats':
      return (
        <div className="grid gap-1.5">
          {b.items.map((it) => (
            <div key={it.label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-[13px]">
              <span className="text-slate-600">{it.label}</span>
              <b className={cx('tabular text-right', it.tone === 'good' ? 'text-emerald-700' : it.tone === 'bad' ? 'text-rose-700' : it.tone === 'warn' ? 'text-amber-700' : 'text-slate-900')}>{it.value}</b>
            </div>
          ))}
        </div>
      );
    case 'mix':
      return (
        <div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
          <div className="flex justify-between text-[11px] font-semibold uppercase text-slate-400"><span>Asset</span><span>Now → suggested</span></div>
          {b.rows.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-[12.5px]"><span className="text-slate-700">{r.label}</span><span className="tabular font-semibold text-slate-900">{r.current.toFixed(0)}% → {r.target}%</span></div>
              <div className="relative mt-0.5 h-1.5 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-ink-900" style={{ width: `${Math.min(100, r.current)}%` }} />
                <div className="absolute -top-0.5 h-2.5 w-0.5 bg-emerald-500" style={{ left: `${r.target}%` }} />
              </div>
            </div>
          ))}
        </div>
      );
    case 'lesson': return <LessonCard id={b.lessonId} />;
    case 'action':
      return (
        <button onClick={() => act(b.action)} className="flex w-full items-center justify-between gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-white hover:bg-emerald-700 cursor-pointer">
          {b.label} <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      );
  }
}

export function LessonCard({ id, compact }: { id: string; compact?: boolean }): ReactNode {
  const { openSheet } = useStore();
  const l = lessonById[id];
  if (!l) return null;
  const rows: [string, string][] = [['What', l.what], ['Suits', l.suits], ['Risk', l.risk], ['Tax', l.tax]];
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13.5px] font-semibold text-slate-900">{l.name}</div>
        <TaxChip text={l.taxChip} verified={!l.verify} />
      </div>
      {!compact && (
        <dl className="mt-2 space-y-1">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[44px_1fr] gap-2 text-[12.5px] leading-snug"><dt className="font-semibold text-slate-400">{k}</dt><dd className="text-slate-700">{v}</dd></div>
          ))}
        </dl>
      )}
      {l.topicId && <button onClick={() => openSheet({ type: 'topic', id: l.topicId! })} className="mt-1 min-h-8 py-1.5 text-[12px] font-semibold text-violet-700 underline cursor-pointer">Full lesson & quiz</button>}
    </div>
  );
}
