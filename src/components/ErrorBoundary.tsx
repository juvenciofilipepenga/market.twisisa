import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  // "page" ocupa o ecrã todo; "silent" esconde só a parte que falhou (ex.: o chat).
  mode?: "page" | "silent";
}
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.mode === "silent") return null;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
        <p className="text-sm font-semibold text-danger">Ocorreu um erro nesta página</p>
        <pre className="max-w-full overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-surface p-3 text-left text-xs text-ink-muted">{error.message}</pre>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white">
          Recarregar
        </button>
      </div>
    );
  }
}
