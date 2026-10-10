import type { ReactNode } from 'react';
import { BookOpen, FileSearch, FlaskConical, LayoutDashboard, ScanLine, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useApp, type Route, PASS_MARK } from '../state';
import { topics } from '../data/learn';
import { integrityScore } from '../engine/xray';
import { fmtDate } from '../lib/format';
import { cx, ProgressRing, scoreColor } from './ui';

const NAV: { label: string; route: Route; icon: typeof LayoutDashboard; match: Route['page'][] }[] = [
  { label: 'Overview', route: { page: 'overview' }, icon: LayoutDashboard, match: ['overview'] },
  { label: 'Portfolio X-Ray', route: { page: 'xray' }, icon: ScanLine, match: ['xray'] },
  { label: 'Impact Simulator', route: { page: 'simulator' }, icon: SlidersHorizontal, match: ['simulator'] },
  { label: 'Learn & Explore', route: { page: 'learn' }, icon: BookOpen, match: ['learn', 'topic'] },
  { label: 'Methodology', route: { page: 'methodology' }, icon: FileSearch, match: ['methodology'] },
];

export function Logo({ dark = true }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20">
        <ScanLine className="h-5 w-5 text-ink-900" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className={cx('text-[15px] font-bold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>Portfolio X-Ray</div>
        <div className={cx('text-[11px] font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>Investment integrity · India</div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { route, go, xray, reviewed, progress, resetDemo } = useApp();
  const { score, open } = integrityScore(xray.findings, reviewed);
  const completed = topics.filter((t) => (progress.quizBest[t.id] ?? 0) >= PASS_MARK).length;

  return (
    <div className="min-h-full lg:pl-64">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink-900 px-4 py-5 lg:flex">
        <Logo />
        <nav className="mt-8 space-y-1">
          {NAV.map((n) => {
            const active = n.match.includes(route.page);
            const Icon = n.icon;
            return (
              <a
                key={n.label}
                href={`#/${n.route.page}`}
                onClick={(e) => { e.preventDefault(); go(n.route); }}
                className={cx(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                )}
              >
                <Icon className={cx('h-4 w-4', active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300')} />
                {n.label}
                {n.route.page === 'xray' && open > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500/15 px-1.5 text-[11px] font-semibold text-rose-300">{open}</span>
                )}
              </a>
            );
          })}
        </nav>

        <div className="mt-8 space-y-3">
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <ProgressRing value={score / 100} size={44} stroke={5} color={scoreColor(score)} track="rgba(255,255,255,.1)">
                <span className="text-xs font-bold text-white tabular">{score}</span>
              </ProgressRing>
              <div>
                <div className="text-xs font-semibold text-slate-200">Data-integrity score</div>
                <div className="text-[11px] text-slate-400">{open} open finding{open === 1 ? '' : 's'}</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <ProgressRing value={completed / topics.length} size={44} stroke={5} color="#a78bfa" track="rgba(255,255,255,.1)">
                <span className="text-xs font-bold text-white tabular">{completed}</span>
              </ProgressRing>
              <div>
                <div className="text-xs font-semibold text-slate-200">Learning progress</div>
                <div className="text-[11px] text-slate-400">{completed} of {topics.length} topics passed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-[11.5px] leading-relaxed text-amber-100/90">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-300">
              <FlaskConical className="h-3.5 w-3.5" /> Demo prototype
            </div>
            All accounts, holdings and prices are <b>synthetic</b>. No real accounts are connected and no AI model is used. This is not investment advice.
          </div>
          <button onClick={resetDemo} className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300 cursor-pointer">
            <RotateCcw className="h-3 w-3" /> Reset demo progress
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-900 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">Synthetic</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 thin-scroll">
          {NAV.map((n) => {
            const active = n.match.includes(route.page);
            return (
              <button
                key={n.label}
                onClick={() => go(n.route)}
                className={cx('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer', active ? 'bg-white/15 text-white' : 'text-slate-400')}
              >
                {n.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Synthetic data ribbon */}
      <div className="border-b border-amber-200 bg-amber-50/80 px-4 py-1.5 text-center text-[12px] text-amber-900 lg:px-8">
        <b>Synthetic demo data</b> · fictional instruments and accounts · portfolio date {fmtDate(xray.asOf)} · rule-based analysis, not investment advice
      </div>

      <main className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-[15px] text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
