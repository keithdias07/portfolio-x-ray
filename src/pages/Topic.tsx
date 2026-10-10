import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ExternalLink, RotateCcw, ScanLine, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { useApp, PASS_MARK } from '../state';
import { resources, topicById, topics, type Topic } from '../data/learn';
import { Button, Card, cx, SeverityBadge } from '../components/ui';
import { ReconcileVisual, RiskLadder, SplitVisual, YieldExplorer } from '../components/widgets';

export function TopicPage({ topicId }: { topicId: string }) {
  const { go, markVisited, xray, progress } = useApp();
  const topic = topicById[topicId];
  useEffect(() => { if (topic) markVisited(topic.id); }, [topic, markVisited]);

  if (!topic) {
    return <Card className="p-8 text-center">Topic not found. <button className="font-semibold underline cursor-pointer" onClick={() => go({ page: 'learn' })}>Back to Learn</button></Card>;
  }
  const idx = topics.findIndex((t) => t.id === topic.id);
  const prev = topics[idx - 1];
  const next = topics[idx + 1];
  const linked = xray.findings.filter((f) => f.learnTopicId === topic.id);
  const best = progress.quizBest[topic.id];

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => go({ page: 'learn' })} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> All topics
      </button>

      <div className={cx('relative overflow-hidden rounded-3xl bg-gradient-to-br p-7 text-white shadow-xl md:p-9', topic.accent)}>
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/80">{topic.category} · {topic.level}</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{topic.title}</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-white/85">{topic.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/85">
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {topic.minutes} min read</span>
            <span>·</span>
            <span>{topic.quiz.length}-question check</span>
            {best != null && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">Best score {best}/3</span>}
          </div>
        </div>
      </div>

      {linked.length > 0 && (
        <Card className="mt-5 border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><ScanLine className="h-4 w-4" /> Seen in your X-Ray</div>
          <div className="mt-2 space-y-1.5">
            {linked.map((f) => (
              <button key={f.id} onClick={() => go({ page: 'xray', findingId: f.id })} className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-[13.5px] ring-1 ring-emerald-100 hover:ring-emerald-300 cursor-pointer">
                <SeverityBadge severity={f.severity} /> <span className="text-slate-800">{f.title}</span> <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 space-y-6">
        {topic.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-bold text-slate-900">{s.heading}</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{s.body}</p>
            {s.bullets && (
              <ul className="mt-2 space-y-1.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" /> {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {topic.widget && (
        <div className="mt-7">
          {topic.widget === 'yield-explorer' && <YieldExplorer />}
          {topic.widget === 'risk-ladder' && <RiskLadder />}
          {topic.widget === 'split-visual' && <SplitVisual />}
          {topic.widget === 'reconcile-visual' && <ReconcileVisual />}
        </div>
      )}

      <Card className="mt-7 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-amber-500" /> Key takeaways</div>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {topic.takeaways.map((t) => (
            <li key={t} className="flex gap-2 rounded-lg bg-slate-50 p-2.5 text-[13.5px] text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {t}</li>
          ))}
        </ul>
      </Card>

      <Quiz topic={topic} />

      <Card className="mt-7 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Official resources</div>
        <p className="text-[12.5px] text-slate-500">Rules change. Check these official sources for current details.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {topic.resources.map((id) => {
            const r = resources[id];
            return (
              <a key={id} href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50">
                <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-900">{r.title} <ExternalLink className="h-3 w-3 text-slate-400" /></div>
                <div className="text-[11.5px] font-medium text-emerald-700">{r.publisher}</div>
                <div className="mt-1 text-[12px] text-slate-500">{r.description}</div>
              </a>
            );
          })}
        </div>
      </Card>

      <p className="mt-5 text-center text-[11.5px] text-slate-400">General education only. This is not investment, tax or legal advice, and this prototype is not a SEBI-registered adviser.</p>

      <div className="mt-6 flex items-center justify-between gap-3">
        {prev ? <Button variant="secondary" onClick={() => go({ page: 'topic', topicId: prev.id })}><ArrowLeft className="h-4 w-4" /> {prev.title}</Button> : <span />}
        {next ? <Button onClick={() => go({ page: 'topic', topicId: next.id })}>{next.title} <ArrowRight className="h-4 w-4" /></Button> : <Button onClick={() => go({ page: 'learn' })}>Back to all topics</Button>}
      </div>
    </div>
  );
}

function Quiz({ topic }: { topic: Topic }) {
  const { recordQuiz } = useApp();
  const [answers, setAnswers] = useState<(number | null)[]>(topic.quiz.map(() => null));
  const [checked, setChecked] = useState(false);
  const score = answers.filter((a, i) => a === topic.quiz[i].answer).length;
  const complete = answers.every((a) => a != null);

  const submit = () => { setChecked(true); recordQuiz(topic.id, score); };
  const reset = () => { setAnswers(topic.quiz.map(() => null)); setChecked(false); };

  return (
    <Card className="mt-7 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="text-sm font-semibold text-slate-900">Quick check</div>
        <div className="flex gap-1">
          {topic.quiz.map((_, i) => (
            <span key={i} className={cx('h-1.5 w-8 rounded-full',
              checked ? (answers[i] === topic.quiz[i].answer ? 'bg-emerald-500' : 'bg-rose-400') : answers[i] != null ? 'bg-slate-700' : 'bg-slate-200')} />
          ))}
        </div>
      </div>
      <div className="space-y-6 p-5">
        {topic.quiz.map((q, qi) => (
          <div key={qi}>
            <div className="text-[15px] font-semibold text-slate-900">{qi + 1}. {q.q}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const picked = answers[qi] === oi;
                const correct = q.answer === oi;
                return (
                  <button
                    key={oi}
                    disabled={checked}
                    onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                    className={cx(
                      'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[14px] transition',
                      !checked && (picked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-400 cursor-pointer'),
                      checked && correct && 'border-emerald-500 bg-emerald-50 text-emerald-900',
                      checked && picked && !correct && 'border-rose-400 bg-rose-50 text-rose-900',
                      checked && !picked && !correct && 'border-slate-200 text-slate-400',
                    )}
                  >
                    {checked && correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                    {checked && picked && !correct && <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                    {o}
                  </button>
                );
              })}
            </div>
            {checked && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-600"><b>Why:</b> {q.why}</p>}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          {!checked ? (
            <Button onClick={submit} disabled={!complete}>Check answers</Button>
          ) : (
            <>
              <div className={cx('rounded-lg px-3 py-2 text-sm font-semibold', score >= PASS_MARK ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800')}>
                {score}/{topic.quiz.length} — {score === 3 ? 'Mastered! 🎉' : score >= PASS_MARK ? 'Passed' : 'Review the lesson and try again'}
              </div>
              <Button variant="secondary" onClick={reset}><RotateCcw className="h-4 w-4" /> Try again</Button>
            </>
          )}
          {!complete && !checked && <span className="text-[12.5px] text-slate-500">Answer all {topic.quiz.length} questions</span>}
        </div>
      </div>
    </Card>
  );
}
