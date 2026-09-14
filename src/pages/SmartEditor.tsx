import { useState, useRef } from "react";
import { Film, Upload, Loader2, Download, CheckCircle, Scissors, Smartphone, FastForward } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const features = [
  { icon: FastForward, label: "Remoção de Pausas", desc: "Remove silêncios e pausas automaticamente", key: "pauses" },
  { icon: Scissors, label: "Corte Inteligente", desc: "Identifica e corta partes desnecessárias", key: "smart" },
  { icon: Smartphone, label: "Versão Vertical (9:16)", desc: "Gera versão para Reels e TikTok automaticamente", key: "vertical" },
];

export default function SmartEditor() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState({ pauses: true, smart: true, vertical: true });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setDone(false); setProgress(0); }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    // Simulate processing steps
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress(i);
    }
    setDone(true);
    setLoading(false);
    toast.info("Editor Inteligente pronto — integre sua solução de processamento de vídeo para ativar corte automático.");
    if (user) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        tool_type: "Editor",
        tool_name: "Editor Inteligente",
        input_summary: file.name,
      });
    }
  };

  const toggle = (key: string) => setSelected((s) => ({ ...s, [key]: !s[key as keyof typeof s] }));

  return (
    <ToolPageLayout icon={Film} title="EDITOR INTELIGENTE" subtitle="Edição automatizada com IA — corte, otimize e converta vídeos" badge="PÓS-PRODUÇÃO">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        <div className="space-y-5 animate-fade-in-up">
          {/* Upload */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Upload de Vídeo</label>
            <div
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${file ? "border-orange/50 bg-orange/5" : "border-[hsl(var(--border))] hover:border-orange/40 hover:bg-[hsl(var(--surface))]"}`}
            >
              <input ref={inputRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
              <Upload className={`w-8 h-8 mx-auto mb-2 ${file ? "text-orange" : "text-[hsl(var(--text-dim))]"}`} />
              {file ? (
                <>
                  <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{file.name}</p>
                  <p className="text-xs text-[hsl(var(--text-dim))] mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <p className="text-sm text-[hsl(var(--text-secondary))]">MP4, MOV, AVI — até 2GB</p>
              )}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Edições Automáticas</label>
            <div className="space-y-2">
              {features.map(({ icon: Icon, label, desc, key }) => (
                <button key={key} onClick={() => toggle(key)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all btn-glow text-left ${selected[key as keyof typeof selected] ? "border-orange/50 bg-orange/5" : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]"}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${selected[key as keyof typeof selected] ? "text-orange" : "text-[hsl(var(--text-dim))]"}`} />
                  <div>
                    <p className={`text-sm font-medium ${selected[key as keyof typeof selected] ? "text-orange" : "text-[hsl(var(--text-secondary))]"}`}>{label}</p>
                    <p className="text-xs text-[hsl(var(--text-dim))]">{desc}</p>
                  </div>
                  <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 ${selected[key as keyof typeof selected] ? "bg-orange border-orange" : "border-[hsl(var(--border))]"}`} />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={!file || loading}
            className="w-full py-4 rounded-xl font-display text-xl tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />EDITANDO...</> : done ? <><CheckCircle className="w-5 h-5" />CONCLUÍDO</> : <><Film className="w-5 h-5" />EDITAR VÍDEO</>}
          </button>
        </div>

        <div className="animate-fade-in-up space-y-4" style={{ animationDelay: "100ms" }}>
          <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] uppercase">Status do Processamento</label>
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-6 min-h-64 flex flex-col justify-center gap-4">
            {loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--text-secondary))]">Processando vídeo...</span>
                  <span className="text-orange font-semibold">{progress}%</span>
                </div>
                <div className="h-2 bg-[hsl(var(--background))] rounded-full overflow-hidden">
                  <div className="h-full bg-orange rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                {["Analisando pausas...", "Aplicando cortes inteligentes...", "Gerando versão vertical..."].map((step, i) => (
                  <div key={step} className={`flex items-center gap-2 text-xs transition-all ${progress > i * 33 ? "text-orange" : "text-[hsl(var(--text-dim))]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${progress > i * 33 ? "bg-orange" : "bg-[hsl(var(--border))]"}`} />
                    {step}
                  </div>
                ))}
              </div>
            )}
            {done && (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-orange mx-auto" />
                <p className="text-sm text-[hsl(var(--text-primary))] font-medium">Vídeo processado com sucesso!</p>
                <div className="space-y-2">
                  <a href="#" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange text-[hsl(var(--primary-foreground))] text-sm btn-glow">
                    <Download className="w-4 h-4" /> Baixar Versão Editada
                  </a>
                  {selected.vertical && (
                    <a href="#" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] text-sm hover:border-orange hover:text-orange transition-all btn-glow">
                      <Smartphone className="w-4 h-4" /> Baixar Versão Vertical (9:16)
                    </a>
                  )}
                </div>
              </div>
            )}
            {!loading && !done && (
              <div className="text-center text-[hsl(var(--text-dim))]">
                <Film className="w-14 h-14 opacity-15 mx-auto mb-3" />
                <p className="text-sm">Selecione um vídeo para começar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
