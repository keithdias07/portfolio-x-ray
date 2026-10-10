import { useState } from 'react';
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, ExternalLink, ScanLine, ShieldCheck, Target } from 'lucide-react';
import { useApp, PASS_MARK } from '../state';
import { PageHeader } from '../components/Layout';
import { Card, cx, ProgressRing, SeverityBadge } from '../components/ui';
import { resources, topics, type Topic } from '../data/learn';

const CATS = ['All', 'Fixed income', 'Funds & trusts', 'Risk', 'Portfolio hygiene'] as const;

export function Learn() {
  const { progress, xray, reviewed, go } = useApp();
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const passed = topics.filter((t) => (progress.quizBest[t.id] ?? 0) >= PASS_MARK).length;
  const mastered = topics.filter((t) => (progress.quizBest[t.id] ?? 0) === 3).length;
  const started = topics.filter((t) => progress.visited.includes(t.id)).length;

  // topics linked to findings, in finding priority order
  const recommended: { topic: Topic; findings: typeof xray.findings }[] = [];
  for (const f of xray.findings) {
    const t = topics.find((x) => x.id === f.learnTopicId)!;
    const existing = recommended.find((r) => r.topic.id === t.id);
    if (existing) existing.findings.push(f); else recommended.push({ topic: t, findings: [f] });
  }

  const shown = topics.filter((t) => cat === 'All' || t.category === cat);

  return (
    <>
      <PageHeader
        eyebrow="Learn & Explore"
        title="Understand what’s in your portfolio"
        subtitle="Short, practical lessons on Indian fixed income, funds, trusts and investment risk. Each one links to official sources such as SEBI and RBI and ends with a 3-question check."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.6fr]">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800" />
          <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-5 text-white">
            <ProgressRing value={passed / topics.length} size={104} stroke={10} color="#fff" track="rgba(255,255,255,.2)">
              <div className="text-center">
                <div className="text-2xl font-bold tabular">{Math.round((passed / topics.length) * 100)}%</div>
                <div className="text-[10px] text-violet-200">complete</div>
              </div>
            </ProgressRing>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-violet-200" /> <b className="tabular">{started}</b> of {topics.length} topics opened</div>
              <div className="flex items-center gap-2"><Target className="h-4 w-4 text-violet-200" /> <b className="tabular">{passed}</b> quizzes passed ({PASS_MARK}/3+)</div>
              <div className="flex items-center gap-2"><Award className="h-4 w-4 text-violet-200" /> <b className="tabular">{mastered}</b> mastered (3/3)</div>
            </div>
          </div>
          <p className="relative mt-4 text-[12.5px] text-violet-100">Progress is saved only in this browser.</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ScanLine className="h-4 w-4 text-emerald-600" /> Recommended from your X-Ray</div>
          <p className="mt-0.5 text-[13px] text-slate-500">Each finding is linked to the lesson that explains it.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recommended.slice(0, 6).map(({ topic, findings }) => {
              const done = (progress.quizBest[topic.id] ?? 0) >= PASS_MARK;
              const openF = findings.filter((f) => !reviewed.has(f.id));
              return (
                <button key={topic.id} onClick={() => go({ page: 'topic', topicId: topic.id })}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-slate-300 hover:shadow-sm cursor-pointer">
                  <span className={cx('h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br', topic.accent)} />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-slate-900">{topic.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <SeverityBadge severity={findings[0].severity} />
                      <span className="text-[11.5px] text-slate-500">{findings.length} finding{findings.length > 1 ? 's' : ''}{openF.length === 0 ? ' · reviewed' : ''}</span>
                    </div>
                  </div>
                  {done ? <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-600" /> : <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 mb-3 flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={cx('rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-inset transition cursor-pointer', cat === c ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((t) => {
          const best = progress.quizBest[t.id];
          const visited = progress.visited.includes(t.id);
          const linked = xray.findings.filter((f) => f.learnTopicId === t.id).length;
          return (
            <button key={t.id} onClick={() => go({ page: 'topic', topicId: t.id })}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
              <div className={cx('relative h-20 bg-gradient-to-br p-4', t.accent)}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{t.category}</div>
                {linked > 0 && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-800">In your X-Ray</span>}
              </div>
              <div className="p-4">
                <div className="font-semibold text-slate-900">{t.title}</div>
                <div className="mt-1 text-[13px] leading-snug text-slate-500">{t.tagline}</div>
                <div className="mt-3 flex items-center gap-3 text-[12px] text-slate-500">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t.minutes} min</span>
                  <span>{t.level}</span>
                  <span className="ml-auto">
                    {best != null && best >= PASS_MARK ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {best}/3</span>
                    ) : best != null ? (
                      <span className="font-semibold text-amber-700">Retry · {best}/3</span>
                    ) : visited ? (
                      <span className="font-medium text-sky-700">In progress</span>
                    ) : null}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Official sources library</div>
        <p className="mt-0.5 text-[13px] text-slate-500">Links go to the official home pages of regulators and market institutions. Use their investor-education sections for current rules.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(resources).map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
              className="group rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50">
              <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-900">{r.title} <ExternalLink className="h-3 w-3 text-slate-400" /></div>
              <div className="text-[11.5px] font-medium text-emerald-700">{r.publisher}</div>
              <div className="mt-1 text-[12px] leading-snug text-slate-500">{r.description}</div>
            </a>
          ))}
        </div>
      </Card>
    </>
  );
}
