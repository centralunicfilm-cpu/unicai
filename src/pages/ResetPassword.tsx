import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Mail, Loader2, Film } from "lucide-react";
import logo from "@/assets/unicfilm-logo.png";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const { localResetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const error = await localResetPassword(email, password);
    if (error) setMessage({ type: "error", text: error });
    else {
      setMessage({ type: "success", text: "Senha atualizada com sucesso! Faça login." });
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Unicfilm" className="h-20 object-contain mb-4" />
        </div>
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl p-8">
          <h2 className="font-display text-3xl text-[hsl(var(--text-primary))] tracking-widest text-center mb-1">NOVA SENHA</h2>
          <p className="text-xs text-[hsl(var(--text-dim))] text-center tracking-wide mb-6">Redefinição local — sem e-mail de confirmação</p>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--text-dim))]" />
              <input
                type="email"
                placeholder="E-mail da conta neste Mac"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--text-dim))]" />
              <input
                type="password"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors"
              />
            </div>
            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "error" ? "bg-destructive/10 border border-destructive/30 text-destructive" : "bg-orange/10 border border-orange/30 text-orange"}`}>
                {message.text}
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-display text-lg tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              ATUALIZAR SENHA
            </button>
          </form>
          <div className="mt-5 text-center">
            <Link to="/" className="text-xs text-[hsl(var(--text-secondary))] hover:text-orange transition-colors">
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
