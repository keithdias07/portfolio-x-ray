import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { runXRay, type XRayResult } from './engine/xray';

// ── tiny hash router ──────────────────────────────────────────────────
export type Route =
  | { page: 'overview' }
  | { page: 'xray'; findingId?: string }
  | { page: 'simulator'; findingId?: string }
  | { page: 'learn' }
  | { page: 'topic'; topicId: string }
  | { page: 'methodology' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'xray': return { page: 'xray', findingId: parts[1] };
    case 'simulator': return { page: 'simulator', findingId: parts[1] };
    case 'learn': return parts[1] ? { page: 'topic', topicId: parts[1] } : { page: 'learn' };
    case 'methodology': return { page: 'methodology' };
    default: return { page: 'overview' };
  }
}

export function href(r: Route): string {
  switch (r.page) {
    case 'xray': return `#/xray${r.findingId ? '/' + r.findingId : ''}`;
    case 'simulator': return `#/simulator${r.findingId ? '/' + r.findingId : ''}`;
    case 'topic': return `#/learn/${r.topicId}`;
    default: return `#/${r.page}`;
  }
}

// ── safe localStorage ─────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

export interface Progress {
  visited: string[];
  quizBest: Record<string, number>;
}

interface AppState {
  route: Route;
  go: (r: Route) => void;
  xray: XRayResult;
  reviewed: Set<string>;
  toggleReviewed: (id: string) => void;
  progress: Progress;
  markVisited: (topicId: string) => void;
  recordQuiz: (topicId: string, score: number) => void;
  resetDemo: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const xray = useMemo(() => runXRay(), []);
  const [reviewed, setReviewed] = useState<Set<string>>(() => new Set(load<string[]>('pxr.reviewed', [])));
  const [progress, setProgress] = useState<Progress>(() => load<Progress>('pxr.progress', { visited: [], quizBest: {} }));

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => save('pxr.reviewed', [...reviewed]), [reviewed]);
  useEffect(() => save('pxr.progress', progress), [progress]);

  const go = useCallback((r: Route) => { window.location.hash = href(r); }, []);
  const toggleReviewed = useCallback((id: string) => {
    setReviewed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);
  const markVisited = useCallback((topicId: string) => {
    setProgress((p) => (p.visited.includes(topicId) ? p : { ...p, visited: [...p.visited, topicId] }));
  }, []);
  const recordQuiz = useCallback((topicId: string, score: number) => {
    setProgress((p) => ({ ...p, quizBest: { ...p.quizBest, [topicId]: Math.max(score, p.quizBest[topicId] ?? 0) } }));
  }, []);
  const resetDemo = useCallback(() => {
    setReviewed(new Set());
    setProgress({ visited: [], quizBest: {} });
  }, []);

  const value = useMemo(
    () => ({ route, go, xray, reviewed, toggleReviewed, progress, markVisited, recordQuiz, resetDemo }),
    [route, go, xray, reviewed, toggleReviewed, progress, markVisited, recordQuiz, resetDemo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}

export const PASS_MARK = 2; // of 3 questions
