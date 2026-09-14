import { useState, useRef } from "react";
import { Music, Upload, Loader2, Download, CheckCircle } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AudioCleaner() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setDone(false); }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    // VocalRemover.org API requires a paid plan. This UI is ready for integration.
    // When VOCALREMOVER_API_KEY is available, implement the edge function call here.
    await new Promise((r) => setTimeout(r, 2500));
    setDone(true);
    setLoading(false);
    toast.info("Integração com VocalRemover.org pronta — conecte sua chave de API nas configurações.");
    if (user) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        tool_type: "Áudio",
        tool_name: "Limpeza de Áudio",
        input_summary: file.name,
      });
    }
  };

  return (
    <ToolPageLayout icon={Music} title="LIMPEZA DE ÁUDIO" subtitle="Remova ruídos e limpe seu áudio com processamento inteligente" badge="PRODUÇÃO">
      <div className="max-w-xl space-y-6 animate-fade-in-up">
        {/* Upload zone */}
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${file ? "border-orange/50 bg-orange/5" : "border-[hsl(var(--border))] hover:border-orange/40 hover:bg-[hsl(var(--surface))]"}`}
        >
          <input ref={inputRef} type="file" accept="audio/*,video/*" onChange={handleFile} className="hidden" />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? "text-orange" : "text-[hsl(var(--text-dim))]"}`} />
          {file ? (
            <>
              <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{file.name}</p>
              <p className="text-xs text-[hsl(var(--text-dim))] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <p className="text-sm text-[hsl(var(--text-secondary))]">Arraste ou clique para enviar um arquivo de áudio/vídeo</p>
              <p className="text-xs text-[hsl(var(--text-dim))] mt-1">MP3, WAV, MP4, MOV — até 100MB</p>
            </>
          )}
        </div>

        {/* Options */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 space-y-3">
          <p className="text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] uppercase">Tipo de Limpeza</p>
          {[
            { label: "Remoção de Ruído de Fundo", desc: "Elimina sons ambientes indesejados" },
            { label: "Separação Vocal", desc: "Isola a voz da música de fundo" },
            { label: "Normalização de Volume", desc: "Equaliza os níveis de áudio" },
          ].map(({ label, desc }) => (
            <label key={label} className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="mt-0.5 accent-orange" />
              <div>
                <p className="text-sm text-[hsl(var(--text-primary))] group-hover:text-orange transition-colors">{label}</p>
                <p className="text-xs text-[hsl(var(--text-dim))]">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="w-full py-4 rounded-xl font-display text-xl tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />PROCESSANDO...</> : done ? <><CheckCircle className="w-5 h-5" />PROCESSADO</> : <><Music className="w-5 h-5" />LIMPAR ÁUDIO</>}
        </button>

        {done && (
          <div className="bg-[hsl(var(--surface))] border border-orange/30 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--text-primary))]">áudio-limpo.mp3</p>
              <p className="text-xs text-[hsl(var(--text-dim))]">Pronto para download</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange text-[hsl(var(--primary-foreground))] text-sm btn-glow">
              <Download className="w-4 h-4" /> Baixar
            </button>
          </div>
        )}

        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-4 py-3">
          <p className="text-xs text-[hsl(var(--text-dim))]">⚡ Integração via <span className="text-orange font-semibold">VocalRemover.org API</span> — Configure sua chave de API para ativar</p>
        </div>
      </div>
    </ToolPageLayout>
  );
}
