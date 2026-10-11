import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BadgeIndianRupee, X } from 'lucide-react';
import { cx } from './ui';
import { amountInWords } from '../lib/format';
import type { Allocation, BroadKey } from '../config/profile';

export const CLASS_COLOR: Record<BroadKey | 'other', string> = {
  equity: '#2563eb', debt: '#10b981', gold: '#f59e0b', cash: '#94a3b8', other: '#c084fc',
};
export const CLASS_NAME: Record<BroadKey | 'other', string> = { equity: 'Equity', debt: 'Debt', gold: 'Gold', cash: 'Cash', other: 'Other' };

export function Chip({ children, onClick, active, className }: { children: ReactNode; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-inset transition cursor-pointer',
        active ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TaxChip({ text, verified = true, onClick }: { text: string; verified?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset cursor-pointer',
        verified ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-amber-50 text-amber-800 ring-amber-200')}
      title={verified ? 'Tax rule' : 'Tax rule marked “to verify” — estimate only'}
    >
      <BadgeIndianRupee className="h-3 w-3" /> {text}{!verified && ' *'}
    </button>
  );
}

const JARGON: Record<string, string> = {
  SIP: 'Systematic Investment Plan — investing a fixed amount every month, usually into a mutual fund.',
  XIRR: 'Your annualised return when money goes in and out at different times.',
  LTCG: 'Long-term capital gain — profit on an investment held for more than the set period (12 months for equity).',
  STCG: 'Short-term capital gain — profit on an investment sold before the long-term period.',
  NAV: 'Net Asset Value — the price of one unit of a mutual fund, published daily.',
  EMI: 'Equated Monthly Instalment — your fixed monthly loan repayment.',
  AA: 'Account Aggregator — an RBI-regulated framework for sharing financial data with your consent. Simulated in this demo.',
  CAS: 'Consolidated Account Statement — a statement of all your demat and mutual-fund holdings.',
  slab: 'Your income-tax slab rate — the rate applied to the next rupee of ordinary income.',
  YTM: 'Yield to maturity — the yearly return if you buy a bond today and hold it until it ends.',
  'marginal rate': 'The tax you pay on your next rupee of income, including cess.',
};

/** Underlined jargon term that explains itself on tap (A10). */
export function Term({ t, children }: { t: keyof typeof JARGON | string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <span ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen((o) => !o)} className="cursor-help underline decoration-dotted decoration-slate-400 underline-offset-2">
        {children ?? t}
      </button>
      {open && (
        <span className="absolute left-0 top-full z-40 mt-1 w-60 rounded-lg bg-ink-900 p-2.5 text-[12px] font-normal leading-snug text-slate-100 shadow-xl">
          <b className="text-white">{t}</b> — {JARGON[t] ?? ''}
        </span>
      )}
    </span>
  );
}

/** Bottom sheet that expands in place (no page change). */
export function Sheet({ title, onClose, children, tall = true }: { title: ReactNode; onClose: () => void; children: ReactNode; tall?: boolean }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cx('sheet-up relative flex flex-col rounded-t-3xl bg-white shadow-2xl', tall ? 'max-h-[92%]' : 'max-h-[70%]')}>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          <div className="min-w-0 text-[15px] font-bold text-slate-900">{title}</div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="h-5 w-5" /></button>
        </div>
        <div className="thin-scroll overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

/** Allocation as one bar (A6), with optional target markers. */
export function AllocationBar({ current, target, height = 12 }: { current: Allocation; target?: Allocation; height?: number }) {
  const keys = Object.keys(current) as BroadKey[];
  let acc = 0;
  return (
    <div>
      <div className="relative">
        <div className="flex overflow-hidden rounded-full" style={{ height }}>
          {keys.map((k) => current[k] > 0.2 && <div key={k} style={{ width: `${current[k]}%`, background: CLASS_COLOR[k] }} title={`${CLASS_NAME[k]} ${current[k].toFixed(0)}%`} />)}
        </div>
        {target && keys.slice(0, -1).map((k) => {
          acc += target[k];
          return <div key={k} className="absolute -top-1 w-0.5 rounded bg-ink-900" style={{ left: `${acc}%`, height: height + 8 }} title={`Target boundary after ${CLASS_NAME[k]}`} />;
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-slate-600">
        {keys.map((k) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: CLASS_COLOR[k] }} />
            {CLASS_NAME[k]} <b className="tabular font-semibold text-slate-800">{current[k].toFixed(0)}%</b>
            {target && <span className="text-slate-400">/ {target[k]}%</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Rupee amount input that shows the value in words as typed (A4). */
export function AmountInput({ value, onChange, placeholder, autoFocus }: { value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string; autoFocus?: boolean }) {
  const display = value != null ? value.toLocaleString('en-IN') : '';
  return (
    <div>
      <div className="flex items-center rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 focus-within:border-ink-900">
        <span className="mr-2 text-xl font-semibold text-slate-400">₹</span>
        <input
          inputMode="numeric"
          autoFocus={autoFocus}
          className="w-full bg-transparent text-xl font-semibold tabular text-slate-900 outline-none placeholder:text-slate-300"
          value={display}
          placeholder={placeholder ?? '0'}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '');
            onChange(digits ? Math.min(Number(digits), 99_99_99_999) : undefined);
          }}
        />
      </div>
      <div className="mt-1.5 h-5 pl-1 text-[13px] font-medium text-emerald-700">{value ? `₹${amountInWords(value)}` : ''}</div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 10, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label?: string }) {
  return (
    <div className="flex items-center gap-3" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer" aria-label="decrease">−</button>
      <span className="w-10 text-center text-2xl font-bold tabular text-slate-900">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer" aria-label="increase">+</button>
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('h-1.5 overflow-hidden rounded-full bg-slate-100', className)}>
      <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, className, variant = 'dark' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; variant?: 'dark' | 'light' | 'ghost' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed',
        variant === 'dark' && 'bg-ink-900 text-white shadow-lg shadow-ink-900/15 hover:bg-ink-800',
        variant === 'light' && 'bg-white text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        className,
      )}
    >
      {children}
    </button>
  );
}
