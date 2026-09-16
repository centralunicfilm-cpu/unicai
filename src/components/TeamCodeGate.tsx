import { useState, type FormEvent } from "react";
import { Cloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cloudConnect, cloudState, savedCloudHost, DEFAULT_CLOUD_HOST } from "@/lib/cloudSync";

// Porta de entrada única: pede o código da equipe uma vez e libera
// chat online + geração via nuvem (sem chave local).
export default function TeamCodeGate({ compact }: { compact?: boolean }) {
  const { user, profile } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Já liberado? Não mostra nada.
  if (done || cloudState().state === "on") return null;
  try {
    if (localStorage.getItem("unicfilm.local.cloud.secret")) return null;
  } catch {
    /* ignora */
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || busy || !code.trim()) return;
    setBusy(true);
    const error = await cloudConnect(savedCloudHost() || DEFAULT_CLOUD_HOST, code.trim(), {
      id: user.id,
      name: profile?.full_name || user.email || "Usuário",
    });
    setBusy(false);
    if (error) toast.error(error);
    else {
      setCode("");
      setDone(true);
      toast.success("Nuvem liberada! Geração + chat online ativos.");
    }
  };

  return (
    <form
      onSubmit={submit}
      className={
        compact
          ? "flex gap-2 items-center rounded-xl border border-orange/30 bg-orange/5 px-3 py-2"
          : "rounded-2xl border border-orange/30 bg-orange/5 p-4 space-y-3"
      }
    >
      <div className="flex items-center gap-2 text-orange">
        <Cloud className="w-4 h-4 shrink-0" />
        <p className="text-[11px] font-bold tracking-wide uppercase">
          Geração online — digite o código da equipe (só na 1ª vez)
        </p>
      </div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código da equipe"
          autoComplete="off"
          type="password"
          className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-orange transition-all"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="px-4 py-2.5 rounded-xl bg-orange text-white text-[10px] font-bold tracking-widest uppercase hover:brightness-110 transition-all disabled:opacity-40 shrink-0 flex items-center gap-2"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Liberar
        </button>
      </div>
    </form>
  );
}
