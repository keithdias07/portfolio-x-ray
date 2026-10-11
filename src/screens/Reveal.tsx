import { ArrowRight, HeartHandshake, RotateCcw } from 'lucide-react';
import { useStore } from '../store';
import { tr, type SKey } from '../i18n';
import { PrimaryButton } from '../components/kit';
import { cx } from '../components/ui';

const TONE = { Conservative: 'from-sky-500 to-indigo-600', Moderate: 'from-emerald-500 to-teal-600', Aggressive: 'from-orange-500 to-rose-600' } as const;

export function Reveal() {
  const { s, set, d } = useStore();
  const a = d.analysis;
  const l = s.lang;
  if (!a) return <div className="p-6 text-slate-500">Loading…</div>;
  const r = a.risk;

  const Bar = ({ label, score, lbl, limiting }: { label: string; score: number; lbl: string; limiting: boolean }) => (
    <div className={cx('rounded-2xl bg-white p-4 ring-1', limiting ? 'ring-amber-300' : 'ring-slate-100')}>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="font-semibold text-slate-600">{tr(l, lbl as SKey)}{limiting && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold uppercase text-amber-800">{l === 'hi' ? 'यही तय करता है' : 'Decides'}</span>}</span>
      </div>
      <div className="relative mt-2.5 h-2.5 rounded-full bg-gradient-to-r from-sky-200 via-emerald-200 to-rose-200">
        <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink-900 shadow transition-all duration-700" style={{ left: `${score}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10.5px] text-slate-400"><span>{tr(l, 'Conservative')}</span><span>{tr(l, 'Moderate')}</span><span>{tr(l, 'Aggressive')}</span></div>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-6">
      <div className="text-[12px] font-bold uppercase tracking-wider text-slate-500">{tr(l, 'yourProfile')}</div>
      <div className={cx('reveal-pop mt-3 rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl', TONE[r.label])}>
        <div className="text-[34px] font-extrabold tracking-tight">{tr(l, r.label)}</div>
        <p className="mt-1 text-[15px] text-white/90">{tr(l, `meaning${r.label}` as SKey)}</p>
      </div>
      <div className="mt-4 space-y-2.5">
        <Bar label={tr(l, 'ability')} score={r.capacityScore} lbl={r.capacityLabel} limiting={r.limiting === 'capacity'} />
        <Bar label={tr(l, 'willingness')} score={r.toleranceScore} lbl={r.toleranceLabel} limiting={r.limiting === 'tolerance'} />
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-slate-700">{r.transparency}</p>
      {r.limiting !== 'none' && (
        <div className="mt-3 flex gap-2.5 rounded-2xl bg-amber-50 p-4 text-[13.5px] leading-relaxed text-amber-900 ring-1 ring-amber-200">
          <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0" />
          {tr(l, r.limiting === 'capacity' ? 'mismatchCapacity' : 'mismatchTolerance')}
        </div>
      )}
      <ul className="mt-3 space-y-1.5">
        {r.reasons.map((x) => <li key={x} className="text-[13px] text-slate-600">• {x}</li>)}
      </ul>
      <div className="mt-auto space-y-2 pt-8">
        <PrimaryButton onClick={() => set({ stage: 'app', tab: 'assistant', chatOpen: false })}>{tr(l, 'seeMeaning')} <ArrowRight className="h-4 w-4" /></PrimaryButton>
        <PrimaryButton variant="ghost" onClick={() => set({ stage: 'intro', introIndex: 0 })}><RotateCcw className="h-4 w-4" /> {tr(l, 'retake')}</PrimaryButton>
      </div>
    </div>
  );
}
