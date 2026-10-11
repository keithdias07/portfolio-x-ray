import { useState } from 'react';
import { ArrowRight, Clock, Lock, ShieldCheck, UserRound } from 'lucide-react';
import { useStore } from '../store';
import { tr } from '../i18n';
import { PERSONAS } from '../engine/aa';
import { PrimaryButton } from '../components/kit';
import { Mark } from '../components/Mark';

export function Welcome() {
  const { s, set, startSample } = useStore();
  const [picking, setPicking] = useState(false);
  const lang = s.lang;
  const resumable = s.introIndex > 0 || Object.keys(s.answers).length > 0;

  if (picking) {
    return (
      <div className="px-5 py-6">
        <h1 className="text-xl font-bold text-slate-900">{tr(lang, 'pickPersona')}</h1>
        <p className="mt-1 text-[14px] text-slate-500">{tr(lang, 'pickPersonaSub')}</p>
        <div className="mt-5 space-y-3">
          {PERSONAS.map((p) => (
            <button key={p.id} onClick={() => startSample(p.id)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md cursor-pointer">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600"><UserRound className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{p.displayName}</span>
                <span className="block text-[13px] text-slate-500">{p.tagline}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
        <PrimaryButton variant="ghost" className="mt-4" onClick={() => setPicking(false)}>{tr(lang, 'back')}</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-8">
      <Mark className="h-14 w-14 shadow-lg shadow-emerald-500/25" />
      <h1 className="mt-6 text-[28px] font-bold leading-tight tracking-tight text-slate-900">{tr(lang, 'welcomeTitle')}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{tr(lang, 'welcomeSub')}</p>
      <ul className="mt-6 space-y-3">
        {[
          { icon: Clock, k: 'reassure1' as const },
          { icon: Lock, k: 'reassure2' as const },
          { icon: ShieldCheck, k: 'reassure3' as const },
        ].map(({ icon: Icon, k }) => (
          <li key={k} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 text-[14px] font-medium text-slate-800 ring-1 ring-slate-100">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="h-[18px] w-[18px]" /></span>
            {tr(lang, k)}
          </li>
        ))}
      </ul>
      <div className="mt-auto space-y-2.5 pt-8">
        <PrimaryButton onClick={() => set({ stage: 'intro', mode: 'connect', personaId: 'family-stage' })}>
          {resumable && s.mode === 'connect' ? `${tr(lang, 'continue')} →` : tr(lang, 'getStarted')}
        </PrimaryButton>
        <PrimaryButton variant="light" onClick={() => setPicking(true)}>{tr(lang, 'trySample')}</PrimaryButton>
        <p className="pt-2 text-center text-[11.5px] leading-snug text-slate-400">{tr(lang, 'demoNote')}</p>
      </div>
    </div>
  );
}
