import { FlaskConical, RotateCcw, UserRound } from 'lucide-react';
import { useStore } from '../store';
import { PERSONAS, personaById, type FailureMode } from '../engine/aa';
import { cx } from '../components/ui';
import { Mark } from '../components/Mark';

const MODES: { id: FailureMode; label: string }[] = [
  { id: 'none', label: 'OK' }, { id: 'fail', label: 'Fail' }, { id: 'partial', label: 'Partial' }, { id: 'timeout', label: 'Timeout' },
];

/** Demo controls (B4 failure simulation, personas, reset) — shown beside the phone on desktop and as a sheet on mobile. */
export function DemoControls() {
  const { s, set, reset, startSample } = useStore();
  const persona = personaById(s.mode === 'sample' ? s.personaId : 'family-stage');
  return (
    <div className="space-y-5 text-[13px]">
      <section>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Jump in with a sample persona</div>
        <div className="space-y-1.5">
          {PERSONAS.map((p) => (
            <button key={p.id} onClick={() => startSample(p.id)} className={cx('flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left ring-1 cursor-pointer', s.mode === 'sample' && s.personaId === p.id ? 'bg-emerald-50 ring-emerald-300' : 'bg-white ring-slate-200 hover:bg-slate-50')}>
              <UserRound className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="min-w-0"><span className="block font-semibold text-slate-900">{p.displayName}</span><span className="block truncate text-[11.5px] text-slate-500">{p.tagline}</span></span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Simulate account failures (Get started flow)</div>
        <p className="mb-2 text-[11.5px] text-slate-500">Applies on the next fetch. Retry always succeeds, so every error path ends with a next step.</p>
        <div className="space-y-1.5">
          {persona.accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
              <span className="min-w-0 truncate text-[12.5px] text-slate-700">{a.fip} <span className="text-slate-400">{a.maskedId}</span></span>
              <div className="flex shrink-0 rounded-full bg-slate-100 p-0.5">
                {MODES.map((m) => (
                  <button key={m.id} onClick={() => set((st) => ({ failureModes: { ...st.failureModes, [a.id]: m.id } }))}
                    className={cx('rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold cursor-pointer', (s.failureModes[a.id] ?? 'none') === m.id ? (m.id === 'none' ? 'bg-white text-emerald-700 shadow-sm' : 'bg-rose-600 text-white') : 'text-slate-500')}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <button onClick={() => reset({ lang: s.lang, failureModes: s.failureModes })} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-[13px] font-semibold text-white cursor-pointer">
        <RotateCcw className="h-3.5 w-3.5" /> Restart from welcome
      </button>
    </div>
  );
}

export function PresenterPanel() {
  return (
    <aside className="hidden w-[340px] shrink-0 lg:block">
      <div className="flex items-center gap-3">
        <Mark className="h-11 w-11 shadow-lg shadow-emerald-500/20" />
        <div>
          <div className="text-[18px] font-bold text-slate-900">Investor Assistant</div>
          <div className="text-[12.5px] text-slate-500">with Portfolio X-Ray · hackathon prototype</div>
        </div>
      </div>
      <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600">
        A mobile-first assistant that combines simulated Account Aggregator data, checks it with explainable X-Ray rules, profiles risk, and explains suitability and tax in plain language.
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[12px] leading-snug text-amber-900 ring-1 ring-amber-200">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
        Demo mode: fictional people, accounts and prices. No real accounts, no AI model, not investment advice.
      </div>
      <div className="mt-5 max-h-[calc(100vh-300px)] overflow-y-auto rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200 thin-scroll">
        <DemoControls />
      </div>
    </aside>
  );
}
