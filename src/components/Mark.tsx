import { Sprout } from 'lucide-react';
import { cx } from './ui';

export function Mark({ className }: { className?: string }) {
  return (
    <div className={cx('grid place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-ink-900', className)}>
      <Sprout className="h-[55%] w-[55%]" strokeWidth={2.5} />
    </div>
  );
}
