import { Component, type ReactNode } from "react";
import { TriangleAlert, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Captura quebras de renderização e mostra tela de recuperação em vez de tela preta.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("App crash capturado:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center">
              <TriangleAlert className="w-7 h-7 text-orange" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide uppercase">Algo quebrou</h1>
              <p className="text-xs text-white/40 mt-1">O app encontrou um erro e parou para não travar tudo.</p>
            </div>
            <p className="text-[11px] text-left text-white/50 bg-black/40 border border-white/10 rounded-xl p-3 break-words max-h-32 overflow-y-auto">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase text-white bg-orange flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
