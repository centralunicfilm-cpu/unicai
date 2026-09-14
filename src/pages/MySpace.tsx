import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ToolPageLayout from "@/components/ToolPageLayout";
import { LayoutDashboard, FileText, Mic, Video, Image, Youtube, Scissors, Download, Clock, Filter } from "lucide-react";

const toolIcons: Record<string, any> = {
  "Roteiro": FileText,
  "Narração": Mic,
  "Vídeo": Video,
  "Imagem": Image,
  "YouTube": Youtube,
  "Fundo": Scissors,
  "Transcrição": Mic,
  "Thumbnail": Image,
  "Áudio": Mic,
  "Editor": Video,
};

const toolColors: Record<string, string> = {
  "Roteiro": "text-blue-400",
  "Narração": "text-purple-400",
  "Vídeo": "text-green-400",
  "Imagem": "text-yellow-400",
  "YouTube": "text-red-400",
  "Fundo": "text-pink-400",
  "Transcrição": "text-cyan-400",
  "Thumbnail": "text-orange",
  "Áudio": "text-purple-400",
  "Editor": "text-green-400",
};

export default function MySpace() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [profile, setProfile] = useState<any>(null);

  const toolTypes = ["Todos", "Roteiro", "Narração", "Imagem", "Vídeo", "Thumbnail", "YouTube", "Fundo", "Transcrição", "Áudio", "Editor"];

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("activity_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]).then(([logsRes, profileRes]) => {
      if (logsRes.data) setLogs(logsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      setLoading(false);
    });
  }, [user]);

  const filtered = filter === "Todos" ? logs : logs.filter((l) => l.tool_type === filter);

  const stats = [
    { label: "Roteiros", value: logs.filter((l) => l.tool_type === "Roteiro").length, icon: FileText },
    { label: "Áudios", value: logs.filter((l) => ["Narração", "Áudio", "Transcrição"].includes(l.tool_type)).length, icon: Mic },
    { label: "Vídeos", value: logs.filter((l) => ["Vídeo", "Editor"].includes(l.tool_type)).length, icon: Video },
    { label: "Imagens", value: logs.filter((l) => ["Imagem", "Thumbnail"].includes(l.tool_type)).length, icon: Image },
  ];

  return (
    <ToolPageLayout icon={LayoutDashboard} title="MEU ESPAÇO" subtitle={`Bem-vindo, ${profile?.full_name || user?.email?.split("@")[0] || "Editor"} — seu painel pessoal`} badge="PESSOAL">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-5xl">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[hsl(var(--orange)/0.1)] flex items-center justify-center">
              <Icon className="w-4 h-4 text-orange" />
            </div>
            <div>
              <p className="font-display text-2xl text-orange leading-none">{value}</p>
              <p className="text-xs text-[hsl(var(--text-dim))] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Filter className="w-4 h-4 text-[hsl(var(--text-dim))] self-center" />
        {toolTypes.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-glow ${filter === t ? "bg-orange text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-[hsl(var(--border))] hover:border-orange hover:text-orange"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="max-w-5xl space-y-2">
        {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-orange/30 border-t-orange rounded-full animate-spin" /></div>}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--text-dim))]">
            <Clock className="w-12 h-12 opacity-20 mb-3" />
            <p className="text-sm">Nenhum registro encontrado</p>
          </div>
        )}
        {!loading && filtered.map((log) => {
          const Icon = toolIcons[log.tool_type] || FileText;
          const color = toolColors[log.tool_type] || "text-orange";
          return (
            <div key={log.id} className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-5 py-3.5 flex items-center gap-4 hover:border-[hsl(var(--orange)/0.3)] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--background))] flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-orange tracking-wide">{log.tool_type}</span>
                  <span className="text-xs text-[hsl(var(--text-dim))]">•</span>
                  <span className="text-xs text-[hsl(var(--text-dim))]">{log.tool_name}</span>
                </div>
                {log.input_summary && <p className="text-sm text-[hsl(var(--text-secondary))] truncate mt-0.5">{log.input_summary}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {log.output_url && (
                  <a href={log.output_url} download={log.file_name || "arquivo"} className="flex items-center gap-1 text-xs text-orange hover:text-orange-glow btn-glow px-2 py-1 rounded-lg border border-[hsl(var(--orange)/0.3)]">
                    <Download className="w-3 h-3" />
                  </a>
                )}
                <span className="text-xs text-[hsl(var(--text-dim))]">
                  {new Date(log.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ToolPageLayout>
  );
}
