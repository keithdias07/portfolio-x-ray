import { Component, type ReactNode } from 'react';

/** Never a dead end: if a screen fails to render, offer a way back instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-100">
          <div className="text-lg font-bold text-slate-900">Something went wrong on this screen</div>
          <p className="mt-2 text-[14px] text-slate-600">Your answers are saved. You can try again, or start over with a clean demo.</p>
          <div className="mt-5 space-y-2">
            <button onClick={() => this.setState({ failed: false })} className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white cursor-pointer">Try again</button>
            <button
              onClick={() => { try { localStorage.removeItem('ia.state.v2'); } catch { /* ignore */ } location.reload(); }}
              className="w-full rounded-2xl py-3 font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    );
  }
}
