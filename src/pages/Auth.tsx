import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Film, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "@/assets/unicfilm-logo.png";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const { localSignIn, localSignUp, localResetPassword, hasLocalAccount } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "login") {
      const error = await localSignIn(email, password);
      if (error) setMessage({ type: "error", text: error });
    } else if (mode === "signup") {
      const error = await localSignUp(name, email, password);
      if (error) setMessage({ type: "error", text: error });
    } else {
      // Redefinição local — sem e-mail, sem confirmação. Basta informar e-mail + nova senha.
      const error = await localResetPassword(email, password);
      if (error) setMessage({ type: "error", text: error });
      else {
        setMessage({ type: "success", text: "Senha atualizada! Volte e entre com a nova senha." });
        setPassword("");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4">
      {/* Background film strip decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2 film-strip opacity-20" />
        <div className="absolute bottom-0 left-0 w-full h-2 film-strip opacity-20" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Unicfilm" className="h-20 object-contain mb-4" />
          <p className="text-xs text-[hsl(var(--text-dim))] tracking-[0.3em] uppercase">Studio Tools • Uso interno</p>
        </div>

        {/* Card */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl p-8">
          <h2 className="font-display text-3xl text-[hsl(var(--text-primary))] tracking-widest text-center mb-1">
            {mode === "login" ? "ENTRAR" : mode === "signup" ? "CADASTRAR" : "NOVA SENHA"}
          </h2>
          <p className="text-xs text-[hsl(var(--text-dim))] text-center tracking-wide mb-6">
            {mode === "login"
              ? "Acesse sua conta neste Mac"
              : mode === "signup"
                ? "Crie sua conta neste Mac (máx. 5)"
                : "Defina uma nova senha — sem e-mail de confirmação"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--text-dim))]" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--text-dim))]" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors"
              />
            </div>

            {mode !== "forgot" ? (
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--text-dim))]" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-[hsl(var(--text-dim))] hover:text-orange transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--text-dim))]" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-[hsl(var(--text-dim))] hover:text-orange transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "error" ? "bg-destructive/10 border border-destructive/30 text-destructive" : "bg-orange/10 border border-orange/30 text-orange"}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-display text-lg tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              {mode === "login" ? "ENTRAR" : mode === "signup" ? "CADASTRAR" : "SALVAR NOVA SENHA"}
            </button>
          </form>

          {/* Toggle links */}
          <div className="mt-5 flex flex-col gap-2 text-center">
            {mode === "login" && (
              <>
                <button onClick={() => { setMode("forgot"); setMessage(null); }} className="text-xs text-[hsl(var(--text-dim))] hover:text-orange transition-colors">
                  Esqueceu a senha? Redefinir neste Mac
                </button>
                <button onClick={() => { setMode("signup"); setMessage(null); }} className="mt-1 w-full py-3 rounded-xl border border-orange/40 bg-orange/10 text-sm font-bold tracking-widest uppercase text-orange hover:bg-orange hover:text-white transition-all">
                  Criar conta • Primeiro acesso neste Mac
                </button>
              </>
            )}
            {mode !== "login" && (
              <button onClick={() => { setMode("login"); setMessage(null); }} className="text-xs text-[hsl(var(--text-secondary))] hover:text-orange transition-colors">
                Já tem conta? <span className="text-orange">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
