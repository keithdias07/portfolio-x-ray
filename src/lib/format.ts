const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 });

export const fmtINR = (v: number) => inr0.format(Math.round(v));
export const fmtINR2 = (v: number) => inr2.format(v);
export const fmtNum = (v: number) => num.format(v);
export const fmtPct = (v: number, digits = 2) => `${v >= 0 ? '' : '−'}${Math.abs(v).toFixed(digits)}%`;
export const fmtSignedINR = (v: number) => {
  const a = Math.abs(v);
  const body = a > 0 && a < 10 ? inr2.format(a) : inr0.format(Math.round(a));
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${body}`;
};

/** Compact Indian notation: ₹12.4 L, ₹1.2 Cr */
export function fmtCompactINR(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)} L`;
  if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(1)} K`;
  return `${sign}₹${a.toFixed(0)}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + 'T00:00:00').getTime();
  const b = new Date(toIso + 'T00:00:00').getTime();
  return Math.round((b - a) / 86_400_000);
}
