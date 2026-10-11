import { useEffect, useState } from 'react';
import { ChevronDown, Database, Heart, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { pick, tr } from '../i18n';
import { INTRO, LATER, optionsFor, type Question } from '../config/questions';
import { AmountInput, Chip, PrimaryButton, ProgressBar, Stepper } from '../components/kit';
import { cx } from '../components/ui';
import { bufferMonthsFor } from '../engine/risk';
import { fmtINR, fmtLakh } from '../lib/format';
import type { Answers } from '../engine/types';

export function QuestionFlow({ group }: { group: 'intro' | 'later' }) {
  const { s, set, setAnswer, d } = useStore();
  const list = group === 'intro' ? INTRO : LATER;
  const index = Math.min(group === 'intro' ? s.introIndex : s.laterIndex, list.length - 1);
  const q = list[index];
  const lang = s.lang;
  const [whyOpen, setWhyOpen] = useState(false);
  const bank = d.portfolio?.bank ?? null;
  const prefillValue = q.prefill && bank ? bank[q.prefill] : undefined;

  // Prefill rule (A4): show values from fetched data as confirmable, never ask from scratch
  useEffect(() => {
    if (q.prefill && s.answers[q.id] === undefined && prefillValue !== undefined) setAnswer(q.id, prefillValue);
  }, [q, prefillValue, s.answers, setAnswer]);

  const go = (delta: number) => {
    const nextIndex = index + delta;
    if (nextIndex >= list.length) {
      if (group === 'intro') set(s.mode === 'sample' ? { stage: 'later', laterIndex: 0 } : { stage: 'connect', connectStep: 'why' });
      else set({ stage: 'reveal' });
      return;
    }
    set(group === 'intro' ? { introIndex: nextIndex } : { laterIndex: nextIndex });
    setWhyOpen(false);
  };

  const value = s.answers[q.id];
  const answered = q.type === 'age-deps' ? s.answers.age != null : q.type === 'multi' ? Array.isArray(value) && value.length > 0 : value !== undefined && value !== '';
  const total = INTRO.length + LATER.length;
  const done = (group === 'intro' ? 0 : INTRO.length) + index;
  const minutesLeft = Math.max(1, Math.ceil(((total - done) * 20) / 60) + (group === 'intro' && s.mode !== 'sample' ? 2 : 0));

  const notSure = () => {
    if (q.type === 'age-deps') { setAnswer('age', 35); setAnswer('dependents', 1); }
    else setAnswer(q.id, q.notSure);
    go(1);
  };

  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-4">
      <div className="flex items-center justify-between text-[12px] font-medium text-slate-500">
        <span>{done + 1} / {total}</span>
        <span>{tr(lang, 'minLeft', { n: minutesLeft })}</span>
      </div>
      <ProgressBar value={(done + 1) / total} className="mt-1.5" />

      <h1 className="mt-6 text-[22px] font-bold leading-snug text-slate-900">{pick(lang, q.text)}</h1>

      <button onClick={() => setWhyOpen((o) => !o)} className="mt-2 inline-flex items-center gap-1 self-start text-[13px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer" aria-expanded={whyOpen}>
        {tr(lang, 'whyAsk')} <ChevronDown className={cx('h-3.5 w-3.5 transition', whyOpen && 'rotate-180')} />
      </button>
      {whyOpen && <p className="mt-1 rounded-xl bg-slate-100 px-3 py-2 text-[13px] leading-relaxed text-slate-600">{pick(lang, q.why)}</p>}

      <div className="mt-5">
        <Body q={q} answers={s.answers} setAnswer={setAnswer} onPick={() => (q.type === 'single' || q.type === 'scenario') && setTimeout(() => go(1), 180)} prefillValue={prefillValue} />
      </div>

      {q.examples && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {q.examples.map((e, i) => (
            <span key={i} className="rounded-full bg-sky-50 px-2.5 py-1 text-[12px] text-sky-800 ring-1 ring-sky-100">{pick(lang, e)}</span>
          ))}
        </div>
      )}

      {q.sensitive && (
        <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-slate-500"><Heart className="h-3.5 w-3.5 text-rose-400" /> {tr(lang, 'noRightWrong')}</p>
      )}

      <div className="mt-auto space-y-2 pt-8">
        <PrimaryButton onClick={() => go(1)} disabled={!answered}>{tr(lang, 'next')}</PrimaryButton>
        <PrimaryButton variant="ghost" onClick={notSure}>{tr(lang, 'notSure')}</PrimaryButton>
      </div>
    </div>
  );
}

function Body({ q, answers, setAnswer, onPick, prefillValue }: { q: Question; answers: Answers; setAnswer: (k: keyof Answers, v: unknown) => void; onPick: () => void; prefillValue?: number }) {
  const { s } = useStore();
  const lang = s.lang;
  const value = answers[q.id];

  if (q.type === 'single' || q.type === 'scenario') {
    return (
      <div className={cx('grid gap-2.5', q.type === 'scenario' && q.id === 'pickPortfolio' ? 'grid-cols-1' : 'grid-cols-1')}>
        {optionsFor(q, answers).map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} onClick={() => { setAnswer(q.id, o.value); onPick(); }}
              className={cx('rounded-2xl border-2 px-4 py-3.5 text-left transition cursor-pointer', on ? 'border-ink-900 bg-ink-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300')}>
              <div className="text-[15px] font-semibold">{pick(lang, o.label)}</div>
              {o.detail && <div className={cx('mt-0.5 text-[13px]', on ? 'text-slate-300' : 'text-slate-500')}>{pick(lang, o.detail)}</div>}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === 'multi') {
    const arr = (Array.isArray(value) ? value : []) as string[];
    const toggle = (v: string) => {
      if (v === 'none') return setAnswer(q.id, arr.includes('none') ? [] : ['none']);
      const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr.filter((x) => x !== 'none'), v];
      setAnswer(q.id, next);
    };
    return (
      <div className="flex flex-wrap gap-2">
        {optionsFor(q, answers).map((o) => <Chip key={o.value} active={arr.includes(o.value)} onClick={() => toggle(o.value)} className="px-4 py-2.5 text-[14px]">{pick(lang, o.label)}</Chip>)}
      </div>
    );
  }

  if (q.type === 'age-deps') {
    return (
      <div className="space-y-5">
        <label className="block">
          <span className="text-[13px] font-medium text-slate-600">{lang === 'hi' ? 'उम्र (वर्ष)' : 'Age (years)'}</span>
          <input inputMode="numeric" value={answers.age ?? ''} onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, '')); setAnswer('age', n ? Math.min(n, 100) : undefined); }}
            className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-xl font-semibold tabular outline-none focus:border-ink-900" placeholder="34" />
        </label>
        <div>
          <span className="text-[13px] font-medium text-slate-600">{lang === 'hi' ? 'आश्रित' : 'Dependents'}</span>
          <div className="mt-1"><Stepper value={answers.dependents ?? 0} onChange={(v) => setAnswer('dependents', v)} max={8} label="dependents" /></div>
        </div>
      </div>
    );
  }

  if (q.type === 'months') {
    const suggested = bufferMonthsFor(answers);
    const exp = answers.monthlyExpenses ?? 0;
    const months = (value as number | undefined) ?? suggested;
    const surplus = (answers.monthlyIncome ?? 0) - exp - (answers.monthlyEmi ?? 0);
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-emerald-50 p-4 text-[14px] text-emerald-900 ring-1 ring-emerald-100">
          <Sparkles className="mb-1 h-4 w-4" />
          {lang === 'hi'
            ? `इस पड़ाव पर ज़्यादातर लोग ${suggested} महीनों का खर्च रखते हैं। आपके लिए, लगभग ${fmtLakh(exp * suggested)}।`
            : `Most people at your stage keep ${suggested} months of expenses. For you, about ${fmtLakh(exp * suggested)}.`}
        </div>
        <Stepper value={months} onChange={(v) => setAnswer('emergencyMonths', v)} min={1} max={24} label="months" />
        {value === undefined && <button onClick={() => setAnswer('emergencyMonths', suggested)} className="text-[13px] font-semibold text-emerald-700 underline cursor-pointer">{lang === 'hi' ? 'सुझाव इस्तेमाल करें' : `Use ${suggested} months`}</button>}
        {answers.monthlyIncome != null && (
          <p className="text-[13px] text-slate-600">{lang === 'hi' ? 'हर महीने बचने वाला पैसा' : 'Free monthly surplus'}: <b className="tabular">{fmtINR(Math.max(0, surplus))}</b> <span className="text-slate-400">({lang === 'hi' ? 'आय − खर्च − EMI' : 'income − expenses − EMIs'})</span></p>
        )}
      </div>
    );
  }

  // amount
  return (
    <div>
      <AmountInput value={value as number | undefined} onChange={(v) => setAnswer(q.id, v)} autoFocus />
      {prefillValue !== undefined && (
        <p className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
          <Database className="h-3.5 w-3.5 text-emerald-600" />
          {lang === 'hi' ? 'आपके बैंक डेटा से भरा गया — पुष्टि करें या बदलें' : 'Prefilled from your bank data — confirm or edit'} ({fmtINR(prefillValue)}/mo)
        </p>
      )}
    </div>
  );
}
