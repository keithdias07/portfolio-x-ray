/**
 * Single client store (B12): session, answers, consent, fetch sessions, edits, results, language,
 * simple view, chat and calculator state. Persisted to localStorage on every change so onboarding
 * can resume anywhere (A10). Portfolio and analysis are derived, never stored.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { personaById, type Consent, type FailureMode, type FetchSession, type RawAccount } from './engine/aa';
import { normalise, type CanonicalPortfolio, type ManualEntry, type Overrides } from './engine/normalise';
import { analyse, type Analysis } from './engine/pipeline';
import { explainHolding, respond, seedFromAdvice, userMsg, type ChatMessage } from './engine/assistant';
import type { Answers } from './engine/types';
import type { Lang } from './i18n';
import type { AfterTaxInstrument, CalcMode } from './engine/calc';

export type Stage = 'welcome' | 'intro' | 'connect' | 'later' | 'reveal' | 'app';
export type ConnectStep = 'why' | 'consent' | 'choose' | 'verify' | 'check' | 'confirm' | 'declined' | 'manual';
export type Tab = 'assistant' | 'grow' | 'money';
export type Sheet =
  | { type: 'finding'; id: string }
  | { type: 'topic'; id: string }
  | { type: 'lesson'; id: string }
  | { type: 'holding-tax'; id: string }
  | { type: 'settings' }
  | { type: 'how' }
  | { type: 'share' }
  | { type: 'library' }
  | { type: 'demo' }
  | { type: 'disclaimer' };

export interface CalcState { mode: CalcMode; amount: number; years: number; ratePct: number; afterTax: AfterTaxInstrument | null; inflationAdjusted: boolean }

export interface State {
  v: 2;
  sessionId: string;
  lang: Lang;
  simpleView: boolean;
  stage: Stage;
  mode: 'connect' | 'sample' | 'manual' | null;
  personaId: string;
  answers: Answers;
  introIndex: number;
  laterIndex: number;
  consent: Consent | null;
  connectStep: ConnectStep;
  dataTypes: string[];
  selectedAccounts: string[];
  includeDocs: string[];
  sessions: Record<string, FetchSession>;
  failureModes: Record<string, FailureMode>;
  skippedAccounts: string[];
  overrides: Overrides;
  manual: ManualEntry[];
  confirmed: boolean;
  reviewed: string[];
  tab: Tab;
  chat: ChatMessage[];
  chatOpen: boolean;
  disclaimerSeen: boolean;
  calc: CalcState | null;
  learn: { visited: string[]; quizBest: Record<string, number> };
  sheets: Sheet[];
  lifeChangeDismissed: boolean;
}

const KEY = 'ia.state.v2';

export const initialState = (): State => ({
  v: 2, sessionId: `S-${Date.now().toString(36).toUpperCase()}`, lang: 'en', simpleView: false, stage: 'welcome', mode: null,
  personaId: 'family-stage', answers: {}, introIndex: 0, laterIndex: 0, consent: null, connectStep: 'why',
  dataTypes: ['holdings', 'balances', 'transactions'], selectedAccounts: [], includeDocs: [], sessions: {}, failureModes: {}, skippedAccounts: [],
  overrides: {}, manual: [], confirmed: false, reviewed: [], tab: 'assistant', chat: [], chatOpen: false, disclaimerSeen: false,
  calc: null, learn: { visited: [], quizBest: {} }, sheets: [], lifeChangeDismissed: false,
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.v === 2) return { ...initialState(), ...s, sheets: [] };
    }
  } catch { /* storage unavailable */ }
  return initialState();
}

type Patch = Partial<State> | ((s: State) => Partial<State>);
type Action = { type: 'patch'; patch: Patch } | { type: 'reset'; keep?: Partial<State> };

function reducer(s: State, a: Action): State {
  if (a.type === 'reset') return { ...initialState(), ...a.keep };
  const p = typeof a.patch === 'function' ? a.patch(s) : a.patch;
  return { ...s, ...p };
}

export interface Derived {
  rawAccounts: RawAccount[];
  portfolio: CanonicalPortfolio | null;
  analysis: Analysis | null;
}

interface Store {
  s: State;
  set: (p: Patch) => void;
  reset: (keep?: Partial<State>) => void;
  d: Derived;
  openSheet: (sh: Sheet) => void;
  closeSheet: () => void;
  setAnswer: (k: keyof Answers, v: unknown) => void;
  startSample: (personaId: string) => void;
  openChat: (seed?: 'advice' | { holdingId: string }) => void;
  ask: (text: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...s, sheets: [] })); } catch { /* ignore */ }
  }, [s]);

  useEffect(() => { document.documentElement.lang = s.lang === 'hi' ? 'hi' : 'en'; }, [s.lang]);

  const persona = personaById(s.personaId);

  const rawAccounts = useMemo<RawAccount[]>(() => {
    if (s.mode === 'sample') return persona.accounts;
    return Object.values(s.sessions).filter((x) => x.status === 'ready' && x.data && !s.skippedAccounts.includes(x.accountId)).map((x) => x.data!);
  }, [s.mode, s.sessions, s.skippedAccounts, persona]);

  const portfolio = useMemo(() => {
    if (s.mode === 'sample') return normalise(persona.accounts, persona.documents, s.overrides, s.manual);
    if (!rawAccounts.length && !s.manual.length) return null;
    return normalise(rawAccounts, persona.documents.filter((d) => s.includeDocs.includes(d.id)), s.overrides, s.manual);
  }, [s.mode, persona, rawAccounts, s.includeDocs, s.overrides, s.manual]);

  const analysis = useMemo(() => (portfolio ? analyse(s.answers, portfolio) : null), [s.answers, portfolio]);

  const set = useCallback((patch: Patch) => dispatch({ type: 'patch', patch }), []);
  const reset = useCallback((keep?: Partial<State>) => dispatch({ type: 'reset', keep }), []);
  const openSheet = useCallback((sh: Sheet) => set((st) => ({ sheets: [...st.sheets, sh] })), [set]);
  const closeSheet = useCallback(() => set((st) => ({ sheets: st.sheets.slice(0, -1) })), [set]);
  const setAnswer = useCallback((k: keyof Answers, v: unknown) => set((st) => ({ answers: { ...st.answers, [k]: v } })), [set]);

  const startSample = useCallback((personaId: string) => {
    const p = personaById(personaId);
    set({ mode: 'sample', personaId, answers: { ...(p.answers as Answers), regime: 'new' }, stage: 'reveal', confirmed: true, chat: [], chatOpen: false, overrides: {}, manual: [], reviewed: [] });
  }, [set]);

  const ctxFor = useCallback(() => (portfolio && analysis ? { answers: s.answers, portfolio, analysis } : null), [portfolio, analysis, s.answers]);

  const openChat = useCallback((seed?: 'advice' | { holdingId: string }) => {
    const c = ctxFor();
    if (!c) return;
    set((st) => {
      // the conversation always starts from the advice card (B10 handoff); later opens continue it
      let chat = st.chat.length ? st.chat : [seedFromAdvice(c)];
      if (seed && seed !== 'advice') {
        const name = c.portfolio.holdings.find((h) => h.holdingId === seed.holdingId)?.name ?? 'this holding';
        chat = [...chat, userMsg(`Explain ${name}`), explainHolding(c, seed.holdingId)];
      }
      return { chat, chatOpen: true, tab: 'assistant', sheets: [] };
    });
  }, [ctxFor, set]);

  const ask = useCallback((text: string) => {
    const c = ctxFor();
    if (!c || !text.trim()) return;
    let reply: ChatMessage;
    try {
      reply = respond(text, c);
    } catch {
      // B13: assistant tool failure → safe message and a lesson card
      reply = { id: `err${Date.now()}`, role: 'assistant', blocks: [{ kind: 'text', text: 'Something went wrong working that out. Here’s a lesson that may help while I recover.' }, { kind: 'lesson', lessonId: 'equity-fund' }], chips: ['What are my options?'] };
    }
    set((st) => ({ chat: [...st.chat, userMsg(text), reply] }));
  }, [ctxFor, set]);

  const value = useMemo<Store>(() => ({
    s, set, reset, d: { rawAccounts, portfolio, analysis }, openSheet, closeSheet, setAnswer, startSample, openChat, ask,
  }), [s, set, reset, rawAccounts, portfolio, analysis, openSheet, closeSheet, setAnswer, startSample, openChat, ask]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}

export function useT() {
  const { s } = useStore();
  return s.lang;
}
