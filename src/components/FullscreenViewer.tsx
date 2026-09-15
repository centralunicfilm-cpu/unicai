import { useEffect } from "react";
import { X, Download } from "lucide-react";
import { downloadOriginalMedia } from "@/lib/sharedMedia";

interface FullscreenViewerProps {
  url: string;
  type: "image" | "video";
  fileName?: string;
  onClose: () => void;
}

export default function FullscreenViewer({ url, type, fileName, onClose }: FullscreenViewerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {fileName && (
          <button
            type="button"
            onClick={() => downloadOriginalMedia(url, fileName)}
            className="p-3 rounded-xl bg-white/10 hover:bg-orange text-white transition-colors"
            aria-label="Baixar"
            title="Baixar"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Fechar (Esc)"
          title="Fechar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {type === "video" ? (
          <video
            src={url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
          />
        ) : (
          <img
            src={url}
            alt="Visualização em tela cheia"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
