import { useEffect } from 'react';
import { ArrowLeft, Bot, Eye, EyeOff, Settings, Sprout, Wallet } from 'lucide-react';
import { useStore, type Tab } from './store';
import { tr } from './i18n';
import { cx } from './components/ui';
import { Welcome } from './screens/Welcome';
import { QuestionFlow } from './screens/Questions';
import { Connect } from './screens/Connect';
import { Reveal } from './screens/Reveal';
import { AssistantTab } from './screens/AssistantTab';
import { GrowTab } from './screens/GrowTab';
import { MoneyTab } from './screens/MoneyTab';
import { SheetHost } from './screens/sheets';
import { PresenterPanel } from './screens/DemoPanel';
import { Mark } from './components/Mark';

function TopBar() {
  const { s, set, openSheet } = useStore();
  const lang = s.lang;
  const canBack = s.stage !== 'welcome' && s.stage !== 'app';
  const goBack = () => {
    if (s.stage === 'intro') return s.introIndex > 0 ? set({ introIndex: s.introIndex - 1 }) : set({ stage: 'welcome' });
    if (s.stage === 'connect') {
      const order = ['why', 'consent', 'choose', 'verify', 'check', 'confirm'] as const;
      const i = order.indexOf(s.connectStep as (typeof order)[number]);
      if (s.connectStep === 'declined' || s.connectStep === 'manual') return set({ connectStep: 'why' });
      if (i > 0 && s.connectStep !== 'check') return set({ connectStep: order[i - 1] });
      return set({ stage: 'intro', introIndex: 4 });
    }
    if (s.stage === 'later') return s.laterIndex > 0 ? set({ laterIndex: s.laterIndex - 1 }) : set(s.mode === 'sample' ? { stage: 'welcome' } : { stage: 'connect', connectStep: 'confirm' });
    if (s.stage === 'reveal') return s.mode === 'sample' ? set({ stage: 'welcome' }) : set({ stage: 'later' });
  };
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 bg-white/90 px-3 py-2.5 backdrop-blur">
      {canBack ? (
        <button onClick={goBack} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label={tr(lang, 'back')}><ArrowLeft className="h-5 w-5" /></button>
      ) : <Mark className="h-8 w-8" />}
      <div className="min-w-0 flex-1">
        {s.stage !== 'app' && <div className="truncate text-[14px] font-bold text-slate-900">{tr(lang, 'appName')}</div>}
      </div>
      <button onClick={() => openSheet({ type: 'demo' })} className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-300 cursor-pointer" title="Demo controls">
        {tr(lang, 'demo')}
      </button>
      <div className="flex rounded-full bg-slate-100 p-0.5 text-[12px] font-semibold" role="group" aria-label="Language">
        {(['en', 'hi'] as const).map((l) => (
          <button key={l} onClick={() => set({ lang: l })} className={cx('rounded-full px-2 py-0.5 cursor-pointer', s.lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>{l === 'en' ? 'EN' : 'हिं'}</button>
        ))}
      </div>
      {s.stage === 'app' && (
        <>
          <button onClick={() => set({ simpleView: !s.simpleView })} className={cx('rounded-full p-1.5 cursor-pointer', s.simpleView ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100')} title={tr(lang, 'simpleView')} aria-pressed={s.simpleView}>
            {s.simpleView ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
          <button onClick={() => openSheet({ type: 'settings' })} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Settings"><Settings className="h-[18px] w-[18px]" /></button>
        </>
      )}
    </div>
  );
}

const TABS: { id: Tab; icon: typeof Bot; key: 'tabAssistant' | 'tabGrow' | 'tabMoney' }[] = [
  { id: 'assistant', icon: Bot, key: 'tabAssistant' },
  { id: 'grow', icon: Sprout, key: 'tabGrow' },
  { id: 'money', icon: Wallet, key: 'tabMoney' },
];

function TabBar() {
  const { s, set } = useStore();
  return (
    <nav className="grid grid-cols-3 border-t border-slate-100 bg-white px-2 pb-2 pt-1.5">
      {TABS.map((t) => {
        const on = s.tab === t.id;
        const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => set({ tab: t.id, chatOpen: t.id === 'assistant' ? s.chatOpen : false })} className={cx('flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11.5px] font-semibold cursor-pointer', on ? 'text-ink-900' : 'text-slate-400')} aria-current={on}>
            <span className={cx('grid h-7 w-12 place-items-center rounded-full transition', on && 'bg-emerald-100')}><Icon className="h-[18px] w-[18px]" /></span>
            {tr(s.lang, t.key)}
          </button>
        );
      })}
    </nav>
  );
}

function Screen() {
  const { s } = useStore();
  switch (s.stage) {
    case 'welcome': return <Welcome />;
    case 'intro': return <QuestionFlow group="intro" />;
    case 'connect': return <Connect />;
    case 'later': return <QuestionFlow group="later" />;
    case 'reveal': return <Reveal />;
    default:
      return s.tab === 'grow' ? <GrowTab /> : s.tab === 'money' ? <MoneyTab /> : <AssistantTab />;
  }
}

export function App() {
  const { s } = useStore();
  const screenKey = s.stage === 'app' ? `app-${s.tab}-${s.chatOpen}` : `${s.stage}-${s.connectStep}-${s.introIndex}-${s.laterIndex}`;
  // each in-place screen change starts at the top (the chat scrolls itself to the latest message)
  useEffect(() => { document.getElementById('screen')?.scrollTo({ top: 0 }); }, [screenKey]);
  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_#e6f6f1,_#eef2f7_55%)] lg:flex lg:items-center lg:justify-center lg:gap-10 lg:p-6">
      <PresenterPanel />
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden bg-[#f7f8fb] lg:h-[860px] lg:max-h-[calc(100vh-48px)] lg:rounded-[2.2rem] lg:border-[10px] lg:border-ink-900 lg:shadow-2xl">
        <TopBar />
        <main className="thin-scroll relative flex-1 overflow-y-auto overflow-x-hidden" id="screen">
          <div key={screenKey} className="screen-in min-h-full">
            <Screen />
          </div>
        </main>
        {s.stage === 'app' && <TabBar />}
        <SheetHost />
      </div>
    </div>
  );
}
