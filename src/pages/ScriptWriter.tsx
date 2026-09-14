import { useState } from "react";
import { FileText, Loader2, Copy, Download, Wand2 } from "lucide-react";
import ToolPageLayout from "@/components/ToolPageLayout";

const scriptTypes = ["Curta-Metragem", "Comercial", "YouTube", "Podcast", "Institucional", "Roteiro de Ação", "Documentário"];

export default function ScriptWriter() {
  const [concept, setConcept] = useState("");
  const [scriptType, setScriptType] = useState("YouTube");
  const [duration, setDuration] = useState("5 minutos");
  const [tone, setTone] = useState("Profissional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  const durations = ["1 minuto", "3 minutos", "5 minutos", "10 minutos", "15 minutos", "30 minutos"];
  const tones = ["Profissional", "Dinâmico", "Emocional", "Humorístico", "Épico", "Informativo"];

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    setLoading(true);
    setError(null);
    setResult("");

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Você é um roteirista profissional especializado em produção audiovisual. Crie roteiros detalhados, criativos e cinematográficos. Use formatação profissional de roteiro. Responda sempre em português do Brasil.`,
            },
            {
              role: "user",
              content: `Crie um roteiro de ${scriptType} com tom ${tone} e duração aproximada de ${duration} sobre: ${concept}. Inclua cenas, falas, descrições de câmera e transições.`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar roteiro");
      const data = await response.json();
      setResult(data.choices?.[0]?.message?.content || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout
      icon={FileText}
      title="ROTEIRO COM IA"
      subtitle="Escreva roteiros e scripts criativos com Inteligência Artificial"
      badge="IA"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Conceito / Ideia</label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ex: Uma produtora que usa IA para revolucionar o cinema, mostrando o dia a dia da equipe..."
              rows={4}
              className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-4 py-3 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-dim))] resize-none input-glow focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Tipo de Roteiro</label>
            <div className="flex flex-wrap gap-2">
              {scriptTypes.map((t) => (
                <button key={t} onClick={() => setScriptType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all btn-glow ${scriptType === t ? "bg-orange text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-[hsl(var(--border))] hover:border-orange hover:text-orange"}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Duração</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--text-primary))] focus:outline-none input-glow">
                {durations.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] mb-2 uppercase">Tom</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--text-primary))] focus:outline-none input-glow">
                {tones.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !concept.trim()}
            className="w-full py-4 rounded-xl font-display text-xl tracking-widest text-[hsl(var(--primary-foreground))] bg-orange btn-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />ESCREVENDO...</> : <><Wand2 className="w-5 h-5" />GERAR ROTEIRO</>}
          </button>

          {error && <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">{error}</div>}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold tracking-wider text-[hsl(var(--text-secondary))] uppercase">Roteiro Gerado</label>
            {result && (
              <button onClick={() => navigator.clipboard.writeText(result)} className="flex items-center gap-1.5 text-xs text-orange hover:text-orange-glow btn-glow px-3 py-1 rounded-lg border border-[hsl(var(--orange)/0.3)]">
                <Copy className="w-3 h-3" />Copiar
              </button>
            )}
          </div>
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 min-h-80 max-h-[500px] overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-orange/30 border-t-orange animate-spin" />
                <p className="text-sm text-[hsl(var(--text-secondary))]">Escrevendo seu roteiro...</p>
              </div>
            )}
            {result && !loading && (
              <pre className="text-sm text-[hsl(var(--text-primary))] whitespace-pre-wrap font-body leading-relaxed">{result}</pre>
            )}
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-[hsl(var(--text-dim))]">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm">Seu roteiro aparecerá aqui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
