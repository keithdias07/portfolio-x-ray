import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, Check, CheckCircle2, ChevronDown, Eye, FileText, KeyRound, Landmark, Loader2, Lock, PenLine, Plus, RotateCcw, ShieldCheck, SkipForward, X, XCircle } from 'lucide-react';
import { useStore } from '../store';
import { tr } from '../i18n';
import { api } from '../engine/pipeline';
import { DATA_TYPES, PERSONAS, personaById, verifyOtp, type AccountSummary } from '../engine/aa';
import { AmountInput, Chip, PrimaryButton, ProgressBar } from '../components/kit';
import { cx, SeverityBadge } from '../components/ui';
import { fmtDate, fmtINR, fmtLakh } from '../lib/format';
import type { BroadClass } from '../data/securities';
import type { QualityPrompt } from '../engine/normalise';

const STEPS = ['why', 'consent', 'choose', 'verify', 'check', 'confirm'] as const;

export function Connect() {
  const { s } = useStore();
  const i = STEPS.indexOf(s.connectStep as (typeof STEPS)[number]);
  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-4">
      {i >= 0 && (
        <>
          <div className="flex items-center justify-between text-[12px] font-medium text-slate-500">
            <span>{tr(s.lang, 'connectTitle')}</span><span>{i + 1} / {STEPS.length}</span>
          </div>
          <ProgressBar value={(i + 1) / STEPS.length} className="mt-1.5" />
        </>
      )}
      {s.connectStep === 'why' && <Why />}
      {s.connectStep === 'consent' && <ConsentStep />}
      {s.connectStep === 'choose' && <Choose />}
      {s.connectStep === 'verify' && <Verify />}
      {s.connectStep === 'check' && <DataCheck />}
      {s.connectStep === 'confirm' && <Confirm />}
      {s.connectStep === 'declined' && <Declined />}
      {s.connectStep === 'manual' && <Manual />}
    </div>
  );
}

function Why() {
  const { s, set } = useStore();
  const l = s.lang;
  return (
    <>
      <h1 className="mt-6 text-[22px] font-bold text-slate-900">{tr(l, 'whyTitle')}</h1>
      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-emerald-700"><Eye className="h-4 w-4" /> {tr(l, 'weRead')}</div>
        <ul className="mt-2 space-y-1.5 text-[14px] text-slate-700">
          {(['weRead1', 'weRead2', 'weRead3'] as const).map((k) => <li key={k} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {tr(l, k)}</li>)}
        </ul>
      </div>
      <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-rose-700"><Lock className="h-4 w-4" /> {tr(l, 'weDont')}</div>
        <ul className="mt-2 space-y-1.5 text-[14px] text-slate-700">
          {(['weDont1', 'weDont2'] as const).map((k) => <li key={k} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /> {tr(l, k)}</li>)}
        </ul>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[13px] text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> {tr(l, 'revokeAny')}</p>
      <div className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-900 ring-1 ring-amber-200 mt-3">
        Demo mode: this simulates the RBI Account Aggregator consent pattern. No real institution is contacted.
      </div>
      <div className="mt-auto space-y-2 pt-8">
        <PrimaryButton onClick={() => set({ connectStep: 'consent' })}>{tr(l, 'continue')}</PrimaryButton>
        <PrimaryButton variant="ghost" onClick={() => set({ connectStep: 'declined' })}>{tr(l, 'ratherNot')}</PrimaryButton>
      </div>
    </>
  );
}

function ConsentStep() {
  const { s, set } = useStore();
  const l = s.lang;
  const preview = api.aa.consent(s.dataTypes);
  const toggle = (id: string) => set({ dataTypes: s.dataTypes.includes(id) ? s.dataTypes.filter((x) => x !== id) : [...s.dataTypes, id] });
  return (
    <>
      <h1 className="mt-6 text-[22px] font-bold text-slate-900">{tr(l, 'consentTitle')}</h1>
      <div className="mt-4 divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-100">
        {DATA_TYPES.map((t) => (
          <label key={t.id} className="flex cursor-pointer items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-slate-900">{t.label}</div>
              <div className="text-[12.5px] text-slate-500">{t.detail}</div>
            </div>
            <input type="checkbox" checked={s.dataTypes.includes(t.id)} onChange={() => toggle(t.id)} className="h-5 w-5 accent-emerald-600" />
          </label>
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
        {[
          ['Purpose', preview.purpose], ['Date range', `${fmtDate(preview.dateRange.from)} – ${fmtDate(preview.dateRange.to)}`],
          ['How often', preview.frequency], ['Valid for', preview.duration],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white p-3 ring-1 ring-slate-100"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-800">{v}</dd></div>
        ))}
      </dl>
      {!s.dataTypes.includes('holdings') && !s.dataTypes.includes('balances') && <p className="mt-2 text-[12.5px] text-rose-600">Choose at least holdings or balances.</p>}
      <div className="mt-auto space-y-2 pt-8">
        <PrimaryButton disabled={!s.dataTypes.includes('holdings') && !s.dataTypes.includes('balances')} onClick={() => {
          const consent = api.aa.consent(s.dataTypes);
          const accounts = api.aa.accounts(personaById(s.personaId), s.dataTypes);
          set({ consent, connectStep: 'choose', selectedAccounts: accounts.map((a) => a.id), includeDocs: personaById(s.personaId).documents.map((d) => d.id) });
        }}>{tr(l, 'approve')}</PrimaryButton>
        <PrimaryButton variant="ghost" onClick={() => set({ connectStep: 'declined', consent: s.consent ? { ...s.consent, status: 'rejected' } : null })}>{tr(l, 'decline')}</PrimaryButton>
      </div>
    </>
  );
}

const ICON: Record<string, typeof Building2> = { DEMAT: Building2, BOND_DEMAT: Landmark, MUTUAL_FUNDS: FileText, DEPOSIT: Landmark, TERM_DEPOSIT: Landmark };

function Choose() {
  const { s, set } = useStore();
  const persona = personaById(s.personaId);
  const accounts = api.aa.accounts(persona, s.dataTypes);
  const toggle = (id: string) => set({ selectedAccounts: s.selectedAccounts.includes(id) ? s.selectedAccounts.filter((x) => x !== id) : [...s.selectedAccounts, id] });
  const toggleDoc = (id: string) => set({ includeDocs: s.includeDocs.includes(id) ? s.includeDocs.filter((x) => x !== id) : [...s.includeDocs, id] });
  return (
    <>
      <h1 className="mt-6 text-[22px] font-bold text-slate-900">{tr(s.lang, 'chooseTitle')}</h1>
      <p className="mt-1 text-[13.5px] text-slate-500">Found linked to your mobile number (simulated). Most people have two or three brokers — tick all to see the full picture.</p>
      <div className="mt-4 space-y-2">
        {accounts.map((a) => <AccountRow key={a.id} a={a} on={s.selectedAccounts.includes(a.id)} onToggle={() => toggle(a.id)} />)}
      </div>
      {persona.documents.length > 0 && (
        <>
          <div className="mt-5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Already with us</div>
          <div className="mt-2 space-y-2">
            {persona.documents.map((d) => (
              <label key={d.id} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-slate-100">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><FileText className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-slate-900">{d.name}</span>
                  <span className="block text-[12px] text-slate-500">{d.type === 'CAS' ? `Used to cross-check quantities · ${fmtDate(d.asOf)}` : `Imported earlier · ${fmtDate(d.asOf)}`}</span>
                </span>
                <input type="checkbox" checked={s.includeDocs.includes(d.id)} onChange={() => toggleDoc(d.id)} className="h-5 w-5 accent-emerald-600" />
              </label>
            ))}
          </div>
        </>
      )}
      <div className="mt-auto pt-8">
        <PrimaryButton disabled={!s.selectedAccounts.length} onClick={() => set({ connectStep: 'verify', sessions: {}, skippedAccounts: [] })}>{tr(s.lang, 'continue')} ({s.selectedAccounts.length})</PrimaryButton>
      </div>
    </>
  );
}

function AccountRow({ a, on, onToggle }: { a: AccountSummary; on: boolean; onToggle: () => void }) {
  const Icon = ICON[a.type] ?? Building2;
  return (
    <label className={cx('flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 transition', on ? 'ring-emerald-300' : 'ring-slate-100')}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-slate-900">{a.fip}</span>
        <span className="block text-[12px] text-slate-500">{a.label} · {a.maskedId}</span>
      </span>
      <input type="checkbox" checked={on} onChange={onToggle} className="h-5 w-5 accent-emerald-600" />
    </label>
  );
}

function Verify() {
  const { s, set } = useStore();
  const persona = personaById(s.personaId);
  const accounts = api.aa.accounts(persona, s.dataTypes).filter((a) => s.selectedAccounts.includes(a.id));
  const fips = [...new Set(accounts.map((a) => a.fip))];
  const [otps, setOtps] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'otp' | 'fetch'>(Object.keys(s.sessions).length ? 'fetch' : 'otp');
  const allOtp = fips.every((f) => verifyOtp(otps[f] ?? ''));

  const fetchOne = async (id: string, retry = false) => {
    const mode = retry ? 'none' : s.failureModes[id] ?? 'none';
    set((st) => ({ sessions: { ...st.sessions, [id]: { accountId: id, status: 'pending', timestamp: '' } }, skippedAccounts: st.skippedAccounts.filter((x) => x !== id) }));
    const res = await api.aa.fetch(persona, id, mode);
    set((st) => ({ sessions: { ...st.sessions, [id]: res } }));
  };
  const start = () => { setPhase('fetch'); accounts.forEach((a, i) => setTimeout(() => fetchOne(a.id), i * 250)); };

  const sessions = accounts.map((a) => ({ a, sess: s.sessions[a.id] }));
  const pending = sessions.some((x) => !x.sess || x.sess.status === 'pending');
  const unresolved = sessions.filter((x) => x.sess?.status === 'failed' && !s.skippedAccounts.includes(x.a.id));
  const ready = sessions.filter((x) => x.sess?.status === 'ready').length;

  if (phase === 'otp') {
    return (
      <>
        <h1 className="mt-6 text-[22px] font-bold text-slate-900">{tr(s.lang, 'verifyTitle')}</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Each institution sends a one-time password. <b>Demo:</b> any 6 digits work.</p>
        <div className="mt-4 space-y-2">
          {fips.map((f) => (
            <label key={f} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-slate-100">
              <KeyRound className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="min-w-0 flex-1 text-[14px] font-semibold text-slate-900">{f}</span>
              <input inputMode="numeric" maxLength={6} value={otps[f] ?? ''} onChange={(e) => setOtps((o) => ({ ...o, [f]: e.target.value.replace(/\D/g, '') }))}
                className={cx('w-28 rounded-xl border-2 px-2 py-1.5 text-center font-mono text-[15px] tracking-[.3em] outline-none', verifyOtp(otps[f] ?? '') ? 'border-emerald-400' : 'border-slate-200 focus:border-ink-900')} placeholder="••••••" aria-label={`OTP for ${f}`} />
            </label>
          ))}
        </div>
        <button onClick={() => setOtps(Object.fromEntries(fips.map((f) => [f, '123456'])))} className="mt-2 self-start text-[13px] font-semibold text-emerald-700 underline cursor-pointer">Fill demo OTPs</button>
        <div className="mt-auto pt-8"><PrimaryButton disabled={!allOtp} onClick={start}>Verify & fetch</PrimaryButton></div>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-6 text-[22px] font-bold text-slate-900">{tr(s.lang, 'verifyTitle')}</h1>
      <div className="mt-4 space-y-2">
        {sessions.map(({ a, sess }) => {
          const skipped = s.skippedAccounts.includes(a.id);
          return (
            <div key={a.id} className={cx('rounded-2xl bg-white p-3.5 ring-1', sess?.status === 'failed' && !skipped ? 'ring-rose-200' : 'ring-slate-100')}>
              <div className="flex items-center gap-3">
                <span className="w-5">
                  {!sess || sess.status === 'pending' ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : sess.status === 'ready' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : skipped ? <SkipForward className="h-5 w-5 text-slate-400" /> : <XCircle className="h-5 w-5 text-rose-500" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-slate-900">{a.fip}</span>
                  <span className="block text-[12px] text-slate-500">{a.label} · {a.maskedId}</span>
                </span>
                <span className={cx('text-[12px] font-semibold', !sess || sess.status === 'pending' ? 'text-slate-400' : sess.status === 'ready' ? 'text-emerald-700' : 'text-rose-600')}>
                  {!sess || sess.status === 'pending' ? 'Fetching…' : sess.status === 'ready' ? (sess.partial ? 'Partial' : 'Fetched') : skipped ? 'Skipped' : 'Failed'}
                </span>
              </div>
              {sess?.partial && <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-900">Only part of this account’s data came back. We’ll use what we have and mark it in My money.</p>}
              {sess?.status === 'failed' && !skipped && (
                <div className="mt-2">
                  <p className="text-[12.5px] text-rose-700">{sess.error}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip onClick={() => fetchOne(a.id, true)}><RotateCcw className="mr-1 inline h-3 w-3" />Retry</Chip>
                    <Chip onClick={() => set((st) => ({ skippedAccounts: [...st.skippedAccounts, a.id] }))}>Continue without it</Chip>
                    <Chip onClick={() => set((st) => ({ skippedAccounts: [...st.skippedAccounts, a.id], connectStep: 'manual' }))}><PenLine className="mr-1 inline h-3 w-3" />Add manually</Chip>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-auto pt-8">
        <PrimaryButton disabled={pending || unresolved.length > 0 || (ready === 0 && !s.manual.length)} onClick={() => set({ connectStep: 'check' })}>
          {pending ? 'Fetching…' : unresolved.length ? 'Choose what to do with the failed account' : tr(s.lang, 'continue')}
        </PrimaryButton>
      </div>
    </>
  );
}

function DataCheck() {
  const { s, set, d } = useStore();
  const p = d.portfolio;
  const [step, setStep] = useState(0);
  const lines = useMemo(() => {
    if (!p) return [];
    const recCount = p.xray.positions.reduce((n, x) => n + 1 + x.duplicates.length, 0) + p.holdings.filter((h) => !h.securityId).length;
    const merged = p.holdings.filter((h) => h.sourceAccounts.length > 1);
    const dup = p.xray.findings.filter((f) => f.category === 'duplicate').length;
    const unmatched = p.holdings.filter((h) => h.qualityFlags.includes('unmatched')).length;
    const stale = p.holdings.filter((h) => h.priceApprox).length;
    const classes = new Set(p.holdings.map((h) => h.broadClass)).size;
    return [
      { t: 'Reading holdings', d: `${recCount} records from ${p.accountsCount} accounts${p.rejected.length ? ` · ${p.rejected.length} malformed record skipped` : ''}` },
      { t: 'Matching names to identifiers', d: `Tickers like STERLINGMOT → Sterling Motors Ltd${unmatched ? ` · ${unmatched} not recognised, kept as Other` : ''}` },
      { t: 'Merging duplicates across accounts', d: `${merged.length ? `${merged.map((m) => m.name).join(', ')} combined from ${merged[0].sourceAccounts.length} accounts` : 'No cross-account holdings'}${dup ? ` · ${dup} double-counted import removed` : ''}` },
      { t: 'Organising by asset type', d: `${p.holdings.length} holdings in ${classes} asset classes` },
      { t: 'Adding latest prices', d: `Demo price file${stale ? ` · ${stale} price${stale > 1 ? 's are' : ' is'} old or from a statement, marked approximate` : ''}` },
      { t: 'Running data checks (X-Ray, 7 rules)', d: `${p.xray.findings.length} finding${p.xray.findings.length === 1 ? '' : 's'} — explained on the next screen` },
    ];
  }, [p]);

  useEffect(() => {
    if (step >= lines.length) return;
    const t = setTimeout(() => setStep((x) => x + 1), 650);
    return () => clearTimeout(t);
  }, [step, lines.length]);

  return (
    <>
      <h1 className="mt-6 text-[22px] font-bold text-slate-900">{tr(s.lang, 'checkTitle')}</h1>
      <p className="mt-1 text-[13.5px] text-slate-500">We show our work so you can trust the numbers.</p>
      <ol className="mt-5 space-y-3">
        {lines.map((l, i) => (
          <li key={l.t} className={cx('flex gap-3 transition-opacity', i > step && 'opacity-30')}>
            <span className="mt-0.5">{i < step ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : i === step ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> : <span className="block h-5 w-5 rounded-full border-2 border-slate-200" />}</span>
            <span>
              <span className="block text-[14.5px] font-semibold text-slate-900">{l.t}</span>
              {i < step && <span className="block text-[12.5px] text-slate-500 fade-up">{l.d}</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-auto pt-8"><PrimaryButton disabled={step < lines.length} onClick={() => set({ connectStep: 'confirm' })}>{tr(s.lang, 'continue')}</PrimaryButton></div>
    </>
  );
}

function Confirm() {
  const { s, set, d, openSheet } = useStore();
  const p = d.portfolio;
  const [editing, setEditing] = useState(false);
  if (!p) return null;
  const partial = Object.values(s.sessions).filter((x) => x.partial).length;
  const asked = p.prompts.filter((q) => q.ask);
  const handled = p.prompts.filter((q) => !q.ask);

  return (
    <>
      <h1 className="mt-6 text-[22px] font-bold text-slate-900">{tr(s.lang, 'confirmTitle')}</h1>
      <div className="mt-4 rounded-3xl bg-ink-900 p-5 text-white">
        <p className="text-[17px] font-semibold leading-snug">{tr(s.lang, 'weFound', { a: p.accountsCount + (s.manual.length ? 1 : 0), h: p.holdings.length, v: fmtLakh(p.totalValue) })}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
          {(['equity', 'debt', 'gold', 'cash', 'other'] as const).filter((k) => p.byClass[k] > 0).map((k) => (
            <div key={k} className="rounded-xl bg-white/10 px-3 py-2"><span className="text-slate-300 capitalize">{k}</span><div className="font-semibold tabular">{fmtLakh(p.byClass[k])}</div></div>
          ))}
        </div>
        {p.naiveTotal - p.totalValue > 1 && <p className="mt-3 text-[12px] text-amber-200">A simple sum of every statement would show {fmtLakh(p.naiveTotal)}. We {fixes(p)} — tap Edit to see the evidence.</p>}
      </div>
      {(partial > 0 || s.skippedAccounts.length > 0 || p.rejected.length > 0) && (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-[12.5px] text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle className="mb-1 h-4 w-4" />
          {s.skippedAccounts.length > 0 && <div>{s.skippedAccounts.length} account skipped — you can retry later from My money.</div>}
          {partial > 0 && <div>{partial} account returned partial data.</div>}
          {p.rejected.map((r, i) => <div key={i}>Skipped a malformed record from {r.account}: {r.reason}.</div>)}
        </div>
      )}

      {editing && (
        <div className="mt-4 space-y-3 fade-up">
          {Object.keys(s.overrides).length > 0 && (
            <div className="rounded-2xl bg-emerald-50 p-3 text-[12.5px] text-emerald-900 ring-1 ring-emerald-200">
              <div className="font-semibold">Your edits</div>
              {Object.entries(s.overrides).map(([hid, o]) => {
                const h = p.holdings.find((x) => x.holdingId === hid);
                const bits = [o.avgCost != null && `price ${fmtINR(o.avgCost)}`, o.purchaseDate && `bought ${fmtDate(o.purchaseDate)}`, o.broadClass && `classed as ${o.broadClass}`].filter(Boolean);
                return bits.length ? <div key={hid}><Check className="mr-1 inline h-3.5 w-3.5" />{h?.name}: {bits.join(', ')}</div> : null;
              })}
            </div>
          )}
          {asked.length > 0 && <div className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Worth a quick check</div>}
          {asked.map((q) => <PromptRow key={q.id} q={q} />)}
          {handled.length > 0 && <HandledList items={handled} openFinding={(id) => openSheet({ type: 'finding', id })} />}
        </div>
      )}

      <div className="mt-auto space-y-2 pt-8">
        <PrimaryButton onClick={() => set({ stage: 'later', laterIndex: 0, confirmed: true })}>{tr(s.lang, 'looksRight')}</PrimaryButton>
        {!editing && <PrimaryButton variant="light" onClick={() => setEditing(true)}><PenLine className="h-4 w-4" /> {tr(s.lang, 'edit')} ({p.prompts.length})</PrimaryButton>}
        <button onClick={() => set({ connectStep: 'manual' })} className="w-full py-1 text-[13px] font-medium text-slate-500 underline cursor-pointer">Add a missing holding manually</button>
      </div>
    </>
  );
}

function fixes(p: { xray: { findings: { category: string }[] } }) {
  const parts: string[] = [];
  if (p.xray.findings.some((f) => f.category === 'duplicate')) parts.push('removed a double-counted holding');
  if (p.xray.findings.some((f) => f.category === 'corporate-action')) parts.push('applied a stock split one source missed');
  return parts.length ? parts.join(' and ') : 'reconciled the sources';
}

function HandledList({ items, openFinding }: { items: QualityPrompt[]; openFinding: (id: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-100">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-slate-700 cursor-pointer">
        Handled for you ({items.length}) <ChevronDown className={cx('h-4 w-4 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {items.map((q) => (
            <li key={q.id} className="px-4 py-3">
              <div className="text-[13.5px] font-semibold text-slate-900">{q.title}</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{q.detail}</div>
              {q.findingId && <button onClick={() => openFinding(q.findingId!)} className="mt-1 text-[12.5px] font-semibold text-emerald-700 underline cursor-pointer">See the evidence</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PromptRow({ q }: { q: QualityPrompt }) {
  const { s, set, d, openSheet } = useStore();
  const h = d.portfolio?.holdings.find((x) => x.holdingId === q.holdingId);
  const [val, setVal] = useState<number | undefined>(undefined);
  const [date, setDate] = useState('');
  const sev = q.findingId ? d.portfolio?.xray.findings.find((f) => f.id === q.findingId)?.severity : undefined;
  const field = q.kind === 'missing-cost' ? 'avgCost' : q.kind === 'missing-date' ? 'purchaseDate' : q.kind === 'unmatched' ? 'broadClass' : null;
  const savedField = field != null && s.overrides[q.holdingId]?.[field as 'avgCost'] != null;
  const saveOverride = (o: Record<string, unknown>) => set((st) => ({ overrides: { ...st.overrides, [q.holdingId]: { ...st.overrides[q.holdingId], ...o } } }));
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <div className="flex items-start gap-2">
        {sev && <SeverityBadge severity={sev} />}
        <div className="text-[14px] font-semibold text-slate-900">{q.title}</div>
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-slate-500">{q.detail}</p>
      {q.kind === 'missing-cost' && h && (
        <div className="mt-3">
          <AmountInput value={val} onChange={setVal} placeholder="Average price per share" />
          <div className="flex gap-2">
            <PrimaryButton className="py-2.5 text-[13.5px]" disabled={!val} onClick={() => saveOverride({ avgCost: val })}>Save price</PrimaryButton>
            <PrimaryButton variant="light" className="py-2.5 text-[13.5px]" onClick={() => saveOverride({})}>Skip — show gains as unknown</PrimaryButton>
          </div>
        </div>
      )}
      {q.kind === 'missing-date' && (
        <div className="mt-3 flex gap-2">
          <input type="date" value={date} max={d.portfolio?.asOf} onChange={(e) => setDate(e.target.value)} className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-ink-900" aria-label="Purchase date" />
          <PrimaryButton className="w-auto px-4 py-2 text-[13.5px]" disabled={!date} onClick={() => saveOverride({ purchaseDate: date })}>Save</PrimaryButton>
        </div>
      )}
      {q.kind === 'unmatched' && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(['equity', 'debt', 'gold', 'cash'] as BroadClass[]).map((c) => <Chip key={c} onClick={() => saveOverride({ broadClass: c })}>{c}</Chip>)}
        </div>
      )}
      {q.findingId && <button onClick={() => openSheet({ type: 'finding', id: q.findingId! })} className="mt-2 text-[12.5px] font-semibold text-emerald-700 underline cursor-pointer">See the evidence</button>}
      {savedField && <p className="mt-2 text-[12px] font-medium text-emerald-700"><Check className="mr-1 inline h-3.5 w-3.5" />Saved — numbers updated.</p>}
    </div>
  );
}

function Declined() {
  const { s, set, startSample } = useStore();
  return (
    <>
      <h1 className="mt-8 text-[22px] font-bold text-slate-900">No problem.</h1>
      <p className="mt-2 text-[14.5px] text-slate-600">You can still get a picture of your money. Choose how you’d like to continue:</p>
      <div className="mt-6 space-y-2.5">
        <PrimaryButton variant="light" onClick={() => set({ connectStep: 'manual', mode: 'manual' })}><PenLine className="h-4 w-4" /> Add holdings manually</PrimaryButton>
        <PrimaryButton variant="light" onClick={() => startSample(s.personaId === 'family-stage' ? 'family-stage' : PERSONAS[1].id)}>{tr(s.lang, 'trySample')}</PrimaryButton>
        <PrimaryButton variant="ghost" onClick={() => set({ connectStep: 'consent' })}>Review consent again</PrimaryButton>
      </div>
    </>
  );
}

function Manual() {
  const { s, set } = useStore();
  const [name, setName] = useState('');
  const [value, setValue] = useState<number | undefined>();
  const [cls, setCls] = useState<BroadClass>('equity');
  const add = () => {
    if (!name || !value) return;
    set((st) => ({ manual: [...st.manual, { id: `M-${st.manual.length + 1}`, name, value, broadClass: cls }] }));
    setName(''); setValue(undefined);
  };
  const hasFetched = Object.values(s.sessions).some((x) => x.status === 'ready');
  return (
    <>
      <h1 className="mt-6 text-[22px] font-bold text-slate-900">Add a holding</h1>
      <p className="mt-1 text-[13.5px] text-slate-500">A rough value is fine — you can refine it later.</p>
      <label className="mt-4 block">
        <span className="text-[13px] font-medium text-slate-600">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PPF account, Broker B shares" className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-[15px] outline-none focus:border-ink-900" />
      </label>
      <div className="mt-3">
        <span className="text-[13px] font-medium text-slate-600">Type</span>
        <div className="mt-1 flex flex-wrap gap-1.5">{(['equity', 'debt', 'gold', 'cash'] as BroadClass[]).map((c) => <Chip key={c} active={cls === c} onClick={() => setCls(c)}>{c}</Chip>)}</div>
      </div>
      <div className="mt-3"><span className="text-[13px] font-medium text-slate-600">Current value</span><div className="mt-1"><AmountInput value={value} onChange={setValue} /></div></div>
      <PrimaryButton variant="light" disabled={!name || !value} onClick={add}><Plus className="h-4 w-4" /> Add</PrimaryButton>
      {s.manual.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {s.manual.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[13.5px] ring-1 ring-slate-100">
              <span>{m.name} <span className="text-slate-400">· {m.broadClass}</span></span><b className="tabular">{fmtINR(m.value)}</b>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-8">
        <PrimaryButton disabled={!s.manual.length && !hasFetched} onClick={() => set(hasFetched ? { connectStep: 'confirm' } : { stage: 'later', laterIndex: 0, confirmed: true, mode: 'manual' })}>{tr(s.lang, 'continue')}</PrimaryButton>
      </div>
    </>
  );
}
