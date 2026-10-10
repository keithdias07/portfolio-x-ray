import { forwardRef, type ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import type { Confidence, Severity } from '../engine/xray';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export const Card = forwardRef<HTMLDivElement, { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>>(
  function Card({ children, className, ...rest }, ref) {
    return (
      <div ref={ref} className={cx('rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.08)]', className)} {...rest}>
        {children}
      </div>
    );
  },
);

export function CardHeader({ title, subtitle, right, icon }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

const sevStyle: Record<Severity, string> = {
  High: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Medium: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  Low: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Info: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};
export const sevDot: Record<Severity, string> = {
  High: 'bg-rose-500', Medium: 'bg-amber-500', Low: 'bg-sky-500', Info: 'bg-slate-400',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', sevStyle[severity])}>
      <span className={cx('h-1.5 w-1.5 rounded-full', sevDot[severity])} />
      {severity}
    </span>
  );
}

export function ConfidenceMeter({ confidence }: { confidence: Confidence }) {
  const n = confidence === 'High' ? 3 : confidence === 'Medium' ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600" title={`Rule confidence: ${confidence}`}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cx('h-3 w-1.5 rounded-sm', i <= n ? 'bg-emerald-500' : 'bg-slate-200')} />
        ))}
      </span>
      {confidence} confidence
    </span>
  );
}

export function SyntheticBadge({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-500/30', className)}>
      <FlaskConical className="h-3 w-3" /> Synthetic data
    </span>
  );
}

export function SimulationBadge({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-800 ring-1 ring-inset ring-violet-500/30', className)}>
      Hypothetical simulation
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600', className)}>{children}</span>;
}

export function ProgressRing({ value, size = 64, stroke = 7, color = '#10b981', track = '#e2e8f0', children }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function scoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#f43f5e';
}

export function Button({ children, variant = 'primary', className, ...rest }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
    secondary: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }[variant];
  return (
    <button className={cx('inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50 cursor-pointer', styles, className)} {...rest}>
      {children}
    </button>
  );
}
