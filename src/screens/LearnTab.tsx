import { ArrowRight, BookOpen, CheckCircle2, Compass, GitCompareArrows, Info, Landmark, ScanLine } from 'lucide-react';
import { useStore } from '../store';
import { tr } from '../i18n';
import { topics } from '../data/learn';
import { INSTRUMENT_GROUPS, INSTRUMENT_LESSONS } from '../data/instruments';
import { TaxChip } from '../components/kit';
import { cx, ProgressRing, SeverityBadge } from '../components/ui';
import { EnglishOnly } from '../components/EnglishOnly';
import { PASS_MARK } from '../lib/learning';

/** Learn & Explore — the financial-literacy USP: instrument catalogue + lessons & quizzes. */
export function LearnTab() {
  const { s, d, openSheet } = useStore();
  const l = s.lang;
  const passed = topics.filter((t) => (s.learn.quizBest[t.id] ?? 0) >= PASS_MARK).length;
  const findings = d.portfolio?.xray.findings ?? [];
  const linked = topics.filter((t) => findings.some((f) => f.learnTopicId === t.id));

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <EnglishOnly />
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white">
        <ProgressRing value={passed / topics.length} size={64} stroke={7} color="#fff" track="rgba(255,255,255,.25)">
          <span className="text-[14px] font-bold tabular">{passed}/{topics.length}</span>
        </ProgressRing>
        <div className="min-w-0">
          <div className="text-[18px] font-bold">{tr(l, 'learnTitle')}</div>
          <div className="text-[12.5px] text-violet-100">Short lessons, worked examples and quick quizzes. {passed} of {topics.length} quizzes passed · {s.learn.visited.length} opened.</div>
        </div>
      </div>

      {linked.length > 0 && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-900"><ScanLine className="h-4 w-4 text-emerald-600" /> Understand your data checks</div>
          <p className="mt-0.5 text-[12px] text-slate-500">Lessons that explain the potential discrepancies X-Ray found in your accounts.</p>
          <div className="mt-2 space-y-1.5">
            {linked.map((t) => {
              const f = findings.find((x) => x.learnTopicId === t.id)!;
              return (
                <button key={t.id} onClick={() => openSheet({ type: 'topic', id: t.id })} className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100">
                  <SeverityBadge severity={f.severity} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">{t.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-1.5 px-1 text-[15px] font-bold text-slate-900"><Compass className="h-4 w-4 text-emerald-600" /> {tr(l, 'exploreTitle')}</div>
        <p className="mt-0.5 px-1 text-[12px] text-slate-500">What each option is, how it can earn, its risks, liquidity and tax. Educational only — not every option suits everyone, and the prototype does not show live prices or buy anything for you.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => openSheet({ type: 'compare', id: 'reit-invit' })} className="flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-left text-[12.5px] font-semibold text-amber-900 ring-1 ring-amber-200 cursor-pointer">
            <GitCompareArrows className="h-4 w-4 shrink-0" /> REITs vs InvITs
          </button>
          <button onClick={() => openSheet({ type: 'compare', id: 'govt-bonds' })} className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-left text-[12.5px] font-semibold text-emerald-900 ring-1 ring-emerald-200 cursor-pointer">
            <Landmark className="h-4 w-4 shrink-0" /> G-Secs vs other bonds
          </button>
        </div>
        {INSTRUMENT_GROUPS.map((g) => (
          <div key={g} className="mt-3">
            <div className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{g}</div>
            <div className="mt-1.5 space-y-1.5">
              {INSTRUMENT_LESSONS.filter((x) => x.group === g).map((x) => (
                <button key={x.id} onClick={() => openSheet({ type: 'lesson', id: x.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-100 cursor-pointer hover:ring-slate-300">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-slate-900">{x.name}</span>
                    <span className="block text-[12px] text-slate-500">{x.oneLiner}</span>
                  </span>
                  <span className="shrink-0"><TaxChip text={x.taxChip} verified={!x.verify} /></span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center gap-1.5 px-1 text-[15px] font-bold text-slate-900"><BookOpen className="h-4 w-4 text-violet-600" /> {tr(l, 'lessons')}</div>
        <div className="mt-2 space-y-1.5">
          {topics.map((t) => {
            const best = s.learn.quizBest[t.id];
            return (
              <button key={t.id} onClick={() => openSheet({ type: 'topic', id: t.id })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-100 cursor-pointer hover:ring-slate-300">
                <span className={cx('h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br', t.accent)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-slate-900">{t.title}</span>
                  <span className="block text-[11.5px] text-slate-500">{t.category} · {t.minutes} min</span>
                </span>
                {best != null ? (
                  <span className={cx('shrink-0 text-[12px] font-semibold', best >= PASS_MARK ? 'text-emerald-700' : 'text-amber-700')}>{best >= PASS_MARK && <CheckCircle2 className="mr-0.5 inline h-3.5 w-3.5" />}{best}/3</span>
                ) : <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </section>

      <p className="flex gap-1.5 px-1 text-[11px] leading-snug text-slate-400"><Info className="mt-0.5 h-3 w-3 shrink-0" /> General education, informed by input from a chartered accountant during development (not an endorsement). Not personalised investment, tax or legal advice.</p>
    </div>
  );
}
