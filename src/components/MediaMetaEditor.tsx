import { useState, type FormEvent } from "react";
import { X, Save, Tag } from "lucide-react";
import { getMeta, setMeta } from "@/lib/mediaMeta";

interface MediaMetaEditorProps {
  metaKey: string;
  fallbackTitle: string;
  onClose: () => void;
  onSaved?: () => void;
}

// Modal para renomear e colocar #tags em qualquer imagem do site.
export default function MediaMetaEditor({ metaKey, fallbackTitle, onClose, onSaved }: MediaMetaEditorProps) {
  const current = getMeta(metaKey);
  const [title, setTitle] = useState(current.title || "");
  const [tags, setTags] = useState(current.tags.map((t) => `#${t}`).join(" "));

  const save = (e: FormEvent) => {
    e.preventDefault();
    setMeta(metaKey, {
      title,
      tags: tags.split(/[\s,]+/).filter(Boolean),
    });
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#141416] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-widest uppercase text-white">Editar imagem</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={fallbackTitle}
            maxLength={120}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Tags (separe com espaço)</label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 w-4 h-4 text-white/25" />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#palco #led #show"
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-orange text-white text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Salvar
        </button>
      </form>
    </div>
  );
}
