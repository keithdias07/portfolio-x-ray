import { Languages } from 'lucide-react';
import { useStore } from '../store';
import { tr } from '../i18n';
import { cx } from './ui';

/** Shown only in Hindi mode, on screens whose main content is not translated yet. */
export function EnglishOnly({ className }: { className?: string }) {
  const { s } = useStore();
  if (s.lang !== 'hi') return null;
  return (
    <p className={cx('flex items-start gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-[12px] leading-snug text-sky-900 ring-1 ring-sky-100', className)}>
      <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {tr('hi', 'englishOnly')} <span className="text-sky-700">({tr('en', 'englishOnly')})</span>
    </p>
  );
}
