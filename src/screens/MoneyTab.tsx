import { useState } from 'react';
import { EnglishOnly } from '../components/EnglishOnly';
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2, MessageCircle, RefreshCw, ScanLine } from 'lucide-react';
import { incompleteNotes, staleStandIns, useStore } from '../store';
import { tr } from '../i18n';
import { AllocationBar, CLASS_COLOR, CLASS_NAME, TaxChip, Term } from '../components/kit';
import { cx, ProgressRing, scoreColor, SeverityBadge } from '../components/ui';
import { integrityScore } from '../engine/xray';
import { personaById } from '../engine/aa';
import { api } from '../engine/pipeline';
import { fmtDate, fmtINR, fmtLakh } from '../lib/format';
import type { BroadClass } from '../data/securities';
import type { CanonicalHolding } from '../engine/normalise';

const ORDER: BroadClass[] = ['equity', 'debt', 'gold', 'cash', 'other'];

export function MoneyTab() {
  const { s, set, d, openSheet } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const p = d.portfolio;
  const a = d.analysis;
  if (!p || !a) return <div className="p-6 text-slate-500">No portfolio yet.</div>;
  const { score, open } = integrityScore(p.xray.findings, new Set(s.reviewed));
  const persona = personaById(s.personaId);
  const label = (id: string) => { const acc = persona.accounts.find((x) => x.id === id); return acc ? `${acc.fip} ${acc.maskedId}` : id; };
  const incomplete = incompleteNotes(s, label);
  const standIns = staleStandIns(s);

  // B13: refresh re-fetches every selected account; a manual retry ignores the simulated failure switch
  const refresh = async () => {
    setRefreshing(true);
    if (s.mode === 'connect') {
      const ids = s.selectedAccounts;
      const results = await Promise.all(ids.map((id) => api.aa.fetch(persona, id, 'none')));
      set({ sessions: Object.fromEntries(results.map((r) => [r.accountId, r])), skippedAccounts: [] });
    } else {
      await new Promise((r) => setTimeout(r, 900));
    }
    setRefreshing(false);
  };

  return (
    <div className="space-y-3 px-4 pb-6 pt-4">
      <EnglishOnly />
      <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12.5px] font-medium text-slate-500">{tr(s.lang, 'tabMoney')}</div>
            <div className="text-[28px] font-bold tracking-tight tabular text-slate-900">{fmtINR(p.totalValue)}</div>
            <div className="text-[11.5px] text-slate-400">Prices as of {fmtDate(p.asOf)} · demo data</div>
          </div>
          <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60 cursor-pointer">
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
          </button>
        </div>
        {!s.simpleView && <div className="mt-4"><AllocationBar current={a.suit.current} /></div>}
      </div>

      {incomplete.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-[12.5px] text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            {incomplete.map((x) => <div key={x}>{x}</div>)}
            <button onClick={refresh} className="mt-1 font-semibold underline cursor-pointer">Retry now</button>
          </div>
        </div>
      )}

      {standIns.map((m) => (
        <div key={m.id} className="rounded-2xl bg-amber-50 p-3.5 text-[12.5px] text-amber-900 ring-1 ring-amber-200">
          <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>You added “{m.name}” ({fmtINR(m.value)}) while {m.standInFor!.map(label).join(', ')} {m.standInFor!.length > 1 ? 'were' : 'was'} missing. That account is now included, so this may be counted twice.</span>
          </div>
          <div className="mt-2 flex gap-2 pl-6">
            <button onClick={() => set((st) => ({ manual: st.manual.filter((x) => x.id !== m.id) }))} className="rounded-full bg-amber-900 px-3 py-1 font-semibold text-white cursor-pointer">Remove manual entry</button>
            <button onClick={() => set((st) => ({ manual: st.manual.map((x) => (x.id === m.id ? { ...x, standInFor: undefined } : x)) }))} className="rounded-full px-3 py-1 font-semibold text-amber-900 ring-1 ring-amber-300 cursor-pointer">Keep both</button>
          </div>
        </div>
      ))}

      {!s.simpleView && (
        <button onClick={() => openSheet({ type: 'finding', id: p.xray.findings[0]?.id ?? '' })} disabled={!p.xray.findings.length}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-100 cursor-pointer disabled:cursor-default">
          <ProgressRing value={score / 100} size={46} stroke={5} color={scoreColor(score)}><span className="text-[12px] font-bold tabular">{score}</span></ProgressRing>
          <span className="flex-1">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900"><ScanLine className="h-4 w-4 text-emerald-600" /> Data checks (X-Ray)</span>
            <span className="block text-[12px] text-slate-500">{p.xray.findings.length ? `${open} of ${p.xray.findings.length} findings open · tap to see evidence` : 'All sources agree — nothing to fix'}</span>
          </span>
          {p.xray.findings.length > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
        </button>
      )}

      {!s.simpleView && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-semibold text-slate-900">Tax at a glance</div>
            <div className="flex rounded-full bg-slate-100 p-0.5 text-[11.5px] font-semibold">
              {(['new', 'old'] as const).map((r) => (
                <button key={r} onClick={() => set((st) => ({ answers: { ...st.answers, regime: r } }))} className={cx('rounded-full px-2.5 py-1 cursor-pointer', a.tax.regime === r ? 'bg-white shadow-sm' : 'text-slate-500')}>{r === 'new' ? 'New regime' : 'Old regime'}</button>
              ))}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Stat label={<Term t="marginal rate">Marginal rate</Term>} value={`${(a.tax.marginalRate * 100).toFixed(1)}%`} />
            <Stat label="Tax on interest / yr" value={fmtLakh(a.tax.annualInterestTax)} />
            <Stat label="If sold all today" value={fmtLakh(a.tax.sellAllTax)} />
          </div>
          {a.tax.notes.map((n) => <p key={n} className="mt-2 text-[12px] leading-snug text-slate-600">• {n}</p>)}
          <p className={cx('mt-2 text-[11px]', a.tax.stale ? 'text-amber-700' : 'text-slate-400')}>
            {a.tax.stale && <AlertTriangle className="mr-1 inline h-3 w-3" />}{a.tax.meta.financialYear} rates as stated in the design doc ({fmtDate(a.tax.meta.lastVerified)}) · not independently verified · estimate only
          </p>
        </div>
      )}

      {ORDER.map((cls) => {
        const hs = p.holdings.filter((h) => h.broadClass === cls);
        if (!hs.length) return null;
        const total = hs.reduce((x, h) => x + h.currentValue, 0);
        return (
          <section key={cls} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-slate-900"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CLASS_COLOR[cls] }} /> {CLASS_NAME[cls]}</span>
              <span className="text-[13px] font-semibold tabular text-slate-700">{fmtLakh(total)}</span>
            </div>
            <ul className="divide-y divide-slate-100">{hs.map((h) => <HoldingRow key={h.holdingId} h={h} />)}</ul>
          </section>
        );
      })}

      <button onClick={() => openSheet({ type: 'settings' })} className="w-full pt-1 text-center text-[12px] text-slate-500 underline cursor-pointer">Manage data access & revoke</button>
    </div>
  );
}

function Stat({ label, value }: { label: React.ReactNode; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-2 py-2"><div className="text-[10.5px] text-slate-500">{label}</div><div className="text-[14px] font-semibold tabular text-slate-900">{value}</div></div>;
}

function HoldingRow({ h }: { h: CanonicalHolding }) {
  const { s, d, openChat, openSheet } = useStore();
  const t = d.analysis!.tax.perHolding[h.holdingId];
  const finding = h.xrayFindingIds.map((id) => d.portfolio!.xray.findings.find((f) => f.id === id)!).filter((f) => f && f.category !== 'rounding' && !(f.category === 'missing-cost' && !h.qualityFlags.includes('missing-cost')));
  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-slate-900">{h.name}</div>
          <div className="truncate text-[11px] text-slate-400">{h.instrumentType} · {h.sourceAccounts.map((a) => a.label).join(' + ')}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[14px] font-semibold tabular text-slate-900">{fmtINR(h.currentValue)}{h.priceApprox && <span title={`Price from ${fmtDate(h.priceDate)} — approximate`} className="text-amber-600">≈</span>}</div>
          {h.broadClass !== 'cash' && h.instrumentType !== 'Fixed deposit' && (
            <div className={cx('text-[11.5px] tabular', h.unrealisedGain == null ? 'text-slate-400' : h.unrealisedGain >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
              {h.unrealisedGain == null ? 'Gain unknown' : `${h.unrealisedGain >= 0 ? '+' : '−'}${fmtINR(Math.abs(h.unrealisedGain))}`}
            </div>
          )}
        </div>
      </div>
      {h.note && <p className="mt-1 text-[11.5px] leading-snug text-amber-800">{h.note}</p>}
      {!s.simpleView && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {t && <TaxChip text={t.chip} verified={t.verified} onClick={() => openSheet({ type: 'holding-tax', id: h.holdingId })} />}
          {h.priceApprox && !h.note && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">Price from {fmtDate(h.priceDate)}</span>}
          {h.purchaseDateEstimated && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">Date estimated</span>}
          {h.qualityFlags.includes('unmatched') && <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-700">Unrecognised · kept as Other</span>}
          {finding.map((f) => (
            <button key={f.id} onClick={() => openSheet({ type: 'finding', id: f.id })} className="cursor-pointer" title={f.title}>
              {s.reviewed.includes(f.id) ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Reviewed</span> : <SeverityBadge severity={f.severity} />}
            </button>
          ))}
          <button onClick={() => openChat({ holdingId: h.holdingId })} className="ml-auto inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
            <MessageCircle className="h-3.5 w-3.5" /> Explain this
          </button>
        </div>
      )}
    </li>
  );
}
