import { useEffect, useState } from "react";
import { Wifi, Server, MonitorSmartphone, Loader2, Copy, Check, RefreshCw, Power, Unplug } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  lanBridgeAvailable,
  lanConnect,
  lanDisconnect,
  lanState,
  subscribeLan,
  LAN_PORT,
  type LanHostInfo,
} from "@/lib/lanSync";

const LAST_HOST_KEY = "unicfilm.local.lan.host";

export default function Network() {
  const { user, profile } = useAuth();
  const bridge = lanBridgeAvailable();
  const [hostInfo, setHostInfo] = useState<LanHostInfo | null>(null);
  const [hostBusy, setHostBusy] = useState(false);
  const [conn, setConn] = useState(() => lanState());
  const [clientBusy, setClientBusy] = useState(false);
  const [hostIp, setHostIp] = useState(() => localStorage.getItem(LAST_HOST_KEY) || "");
  const [pin, setPin] = useState("");
  const [copied, setCopied] = useState(false);

  const refreshHost = async () => {
    if (!window.unicfilmLan) return;
    try {
      setHostInfo(await window.unicfilmLan.hostStatus());
    } catch {
      /* app ainda iniciando */
    }
  };

  useEffect(() => {
    void refreshHost();
    const off = subscribeLan(() => setConn(lanState()));
    const timer = window.setInterval(() => {
      void refreshHost();
    }, 5000);
    return () => {
      off();
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHostStart = async () => {
    if (!window.unicfilmLan) return;
    setHostBusy(true);
    try {
      const info = await window.unicfilmLan.hostStart();
      setHostInfo(info);
      toast.success(info.running ? "Modo anfitrião ligado!" : "Não foi possível ligar o anfitrião.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao ligar anfitrião.");
    } finally {
      setHostBusy(false);
    }
  };

  const handleHostStop = async () => {
    if (!window.unicfilmLan) return;
    setHostBusy(true);
    try {
      setHostInfo(await window.unicfilmLan.hostStop());
      toast.success("Modo anfitrião desligado.");
    } finally {
      setHostBusy(false);
    }
  };

  const handleRegenPin = async () => {
    if (!window.unicfilmLan) return;
    setHostInfo(await window.unicfilmLan.hostRegenPin());
    toast.success("Novo PIN gerado.");
  };

  const copyInvite = async () => {
    if (!hostInfo?.ip || !hostInfo?.pin) return;
    const text = `Anfitrião Unicfilm — IP: ${hostInfo.ip} Porta: ${hostInfo.port} PIN: ${hostInfo.pin}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(text);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setClientBusy(true);
    const error = await lanConnect(hostIp, pin, {
      id: user.id,
      name: profile?.full_name || user.email,
    });
    setClientBusy(false);
    setConn(lanState());
    if (error) {
      toast.error(error);
    } else {
      localStorage.setItem(LAST_HOST_KEY, hostIp.trim());
      toast.success("Conectado ao anfitrião!");
    }
  };

  const handleDisconnect = () => {
    lanDisconnect();
    setConn(lanState());
    toast.success("Desconectado.");
  };

  return (
    <ToolPageLayout icon={Wifi} title="REDE LOCAL" subtitle="Chat e galeria entre os Macs da mesma rede, sem internet" badge="REDE">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* STATUS */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl p-6 flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${conn.state === "on" ? "bg-green-500 animate-pulse" : hostInfo?.running ? "bg-orange animate-pulse" : "bg-white/20"}`} />
          <div>
            <p className="text-sm font-bold text-[hsl(var(--text-primary))] tracking-wide uppercase">
              {conn.state === "on"
                ? `Conectado ao anfitrião ${conn.ip}`
                : hostInfo?.running
                  ? "Este Mac é o anfitrião"
                  : "Modo individual (só este Mac)"}
            </p>
            <p className="text-xs text-[hsl(var(--text-dim))]">
              {conn.state === "on"
                ? `${conn.clients.length + 1} Macs na rede • chat e galeria sincronizados`
                : "Ative o anfitrião aqui ou conecte-se ao IP de outro Mac."}
            </p>
          </div>
        </div>

        {/* ANFITRIÃO */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-orange" />
            <h3 className="text-xs font-bold tracking-widest uppercase text-[hsl(var(--text-secondary))]">Mac anfitrião (recebe os outros)</h3>
          </div>

          {!bridge ? (
            <p className="text-xs text-[hsl(var(--text-dim))] leading-relaxed">
              O modo anfitrião só funciona no <strong>app instalado</strong> (.dmg). No navegador, este Mac pode apenas se conectar a um anfitrião abaixo.
            </p>
          ) : !hostInfo?.running ? (
            <button
              onClick={handleHostStart}
              disabled={hostBusy}
              className="w-full py-3.5 rounded-xl font-display text-lg tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {hostBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              LIGAR ANFITRIÃO NESTE MAC
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] p-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--text-dim))]">IP</p>
                  <p className="text-lg font-bold text-[hsl(var(--text-primary))]">{hostInfo.ip || "—"}</p>
                </div>
                <div className="rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] p-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--text-dim))]">Porta</p>
                  <p className="text-lg font-bold text-[hsl(var(--text-primary))]">{hostInfo.port}</p>
                </div>
                <div className="rounded-xl bg-[hsl(var(--background))] border border-orange/30 p-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--text-dim))]">PIN</p>
                  <p className="text-lg font-bold text-orange tracking-[0.2em]">{hostInfo.pin || "—"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={copyInvite} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:text-white transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "COPIADO!" : "COPIAR CONVITE"}
                </button>
                <button onClick={handleRegenPin} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" /> NOVO PIN
                </button>
                <button onClick={handleHostStop} disabled={hostBusy} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40">
                  <Power className="w-4 h-4" /> DESLIGAR
                </button>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--text-dim))] mb-2">
                  Macs conectados ({hostInfo.clients.length})
                </p>
                {hostInfo.clients.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--text-dim))]">Nenhum ainda. Passe o IP + PIN para a equipe.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {hostInfo.clients.map((c) => (
                      <span key={c.id} className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400">
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CLIENTE */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <MonitorSmartphone className="w-5 h-5 text-orange" />
            <h3 className="text-xs font-bold tracking-widest uppercase text-[hsl(var(--text-secondary))]">Conectar a um anfitrião</h3>
          </div>

          {conn.state === "on" ? (
            <div className="space-y-4">
              <p className="text-xs text-[hsl(var(--text-dim))]">
                Conectado a <strong className="text-[hsl(var(--text-primary))]">{conn.ip}:{LAN_PORT}</strong> • {conn.clients.length + 1} Macs na rede.
              </p>
              <button onClick={handleDisconnect} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:text-white transition-colors">
                <Unplug className="w-4 h-4" /> DESCONECTAR
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--text-dim))] mb-2">IP do anfitrião</label>
                  <input
                    value={hostIp}
                    onChange={(e) => setHostIp(e.target.value)}
                    placeholder="Ex: 192.168.0.10"
                    required
                    className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--text-dim))] mb-2">PIN</label>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="6 dígitos"
                    required
                    inputMode="numeric"
                    className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] focus:outline-none focus:border-orange transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={clientBusy || conn.state === "connecting"}
                className="w-full py-3.5 rounded-xl font-display text-lg tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {clientBusy || conn.state === "connecting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                CONECTAR
              </button>
              <p className="text-[10px] text-[hsl(var(--text-dim))] leading-relaxed">
                Os dois Macs precisam estar no mesmo Wi-Fi. Se desconectar, o app continua funcionando sozinho e tenta reconectar sozinho.
              </p>
            </form>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}
