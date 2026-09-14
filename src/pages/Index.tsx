import logo from "@/assets/unicfilm-logo.png";
import ToolCard from "@/components/ToolCard";
import {
  Image,
  Video,
  Sparkles,
  Youtube,
  Scissors,
  FileText,
  Mic,
  Film,
  Music,
  ArrowDown,
  Paintbrush,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PublicGallery from "@/components/PublicGallery";

const tools = [
  { icon: Image, title: "Gerar Imagem", description: "Crie imagens profissionais com IA para pôsteres e materiais visuais.", badge: "IA", path: "/image-gen" },
  { icon: Video, title: "Gerar Vídeo", description: "Transforme textos e ideias em vídeos cinematográficos com IA.", badge: "IA", path: "/video-gen" },
  { icon: Paintbrush, title: "Gerar Thumbnail", description: "Gere thumbnails de alto impacto que maximizam o CTR.", badge: "IA", path: "/thumbnail-gen" },
  { icon: Youtube, title: "Baixar do YouTube", description: "Baixe vídeos e áudios do YouTube em alta qualidade.", path: "/youtube-downloader" },
  { icon: Music, title: "Limpeza de Áudio", description: "Remova ruídos e limpe seu áudio com processamento inteligente.", path: "/audio-cleaner" },
  { icon: Mic, title: "Narração com IA", description: "Gere narrações profissionais com vozes realistas via ElevenLabs.", badge: "ElevenLabs", path: "/narration" },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0B0D] text-white">

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center px-6">

        {/* Glow central - Reposicionado para não cortar */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[1200px] aspect-square pointer-events-none opacity-70"
          style={{
            background:
              "radial-gradient(circle at center, rgba(242,142,56,0.12) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 pt-16 pb-10 md:pt-24 md:pb-16 max-w-[800px] w-full">

          {/* LOGO */}
          <img
            src={logo}
            alt="Unicfilm"
            className="logo-float w-32 sm:w-40 md:w-52 lg:w-60 object-contain"
            style={{
              filter: "drop-shadow(0 0 40px rgba(242,142,56,0.25))",
            }}
          />
          {/* STUDIO GRANDE */}
          <h2 className="mt-4 w-full text-center text-5xl font-extralight uppercase tracking-[0.18em] sm:text-6xl md:mt-6 md:text-7xl lg:text-8xl font-sans">
            Studio
          </h2>

          {/* BOTÃO */}
          <button
            onClick={() =>
              document
                .getElementById("tools-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="mt-6 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl text-sm tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_40px_hsl(var(--orange)/0.4)] flex items-center gap-2"
          >
            Explorar Ferramentas
            <ArrowDown className="w-4 h-4" />
          </button>

          {/* BEM-VINDO — Integrado ao fluxo central */}
          {user && (
            <div className="mt-8 transition-opacity duration-500 animate-fade-in opacity-40 hover:opacity-100">
              <p className="text-sm font-light tracking-wide">
                Bem-vindo,{" "}
                <span className="text-primary font-medium">
                  {user.email?.split("@")[0]}
                </span>
              </p>
            </div>
          )}
        </div>

      </section>

      {/* PUBLIC GALLERY */}
      <section className="px-6 md:px-10 max-w-[1400px] mx-auto overflow-hidden">
        <PublicGallery />
      </section>

      {/* TOOLS */}
      <section
        id="tools-section"
        className="px-6 md:px-10 py-10 max-w-[1200px] mx-auto"
      >
        <div className="h-px bg-neutral-800 mb-16 opacity-60" />

        <h2 className="text-3xl md:text-4xl tracking-wide mb-12">
          SUAS FERRAMENTAS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {tools.map((tool, i) => (
            <ToolCard key={tool.path} {...tool} delay={i * 60} />
          ))}
        </div>
      </section>
    </div>
  );
}
