import { NavLink, useLocation } from "react-router-dom";
import {
  Image,
  Video,
  Youtube,
  Scissors,
  Sparkles,
  FileText,
  Mic,
  LayoutDashboard,
  ChevronRight,
  Zap,
  Music,
  Film,
  User,
  Clock,
  Settings,
  ExternalLink,
  MessageSquare,
  Menu,
  X,
  Paintbrush,
} from "lucide-react";
import logo from "@/assets/unicfilm-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const tools = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", group: "GERAL" },
  { path: "/image-gen", icon: Image, label: "Gerar Imagem", group: "CRIAÇÃO IA" },
  { path: "/video-gen", icon: Video, label: "Gerar Vídeo", group: "CRIAÇÃO IA" },
  { path: "/thumbnail-gen", icon: Paintbrush, label: "Gerar Thumbnail", group: "CRIAÇÃO IA" },
  { path: "/narration", icon: Mic, label: "Narração com IA", group: "PRODUÇÃO" },
  { path: "/audio-cleaner", icon: Music, label: "Limpeza de Áudio", group: "PRODUÇÃO" },
  { path: "/transcription", icon: FileText, label: "Transcrição de Áudio", group: "PRODUÇÃO" },
  { path: "/youtube-downloader", icon: Youtube, label: "Baixar do YouTube", group: "FERRAMENTAS" },
  { path: "/my-space", icon: User, label: "Meu Espaço", group: "MEMBROS" },
  { path: "/history", icon: Clock, label: "Histórico", group: "MEMBROS" },
  { path: "/settings", icon: Settings, label: "Configurações", group: "MEMBROS" },
];

const externalLinks = [
  { href: "https://app.envato.com/", icon: ExternalLink, label: "Envato Elements" },
  { href: "https://chatgpt.com/", icon: MessageSquare, label: "ChatGPT" },
  { href: "https://gemini.google.com/", icon: Sparkles, label: "Google Gemini" },
];

const groups = ["GERAL", "PRÉ-PRODUÇÃO", "PRODUÇÃO", "PÓS-PRODUÇÃO", "CRIAÇÃO IA", "FERRAMENTAS", "MEMBROS"];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <img src={logo} alt="Unicfilm" className="h-9 object-contain" />
      </div>

      {/* Live badge */}
      <div className="flex items-center gap-2 px-5 py-3 bg-primary/5">
        <span className="w-2 h-2 rounded-full bg-primary pulse-dot" />
        <span className="text-xs text-muted-foreground tracking-wide">Sistema ativo</span>
        <Zap className="w-3 h-3 text-primary ml-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {groups.map((group) => {
          const items = tools.filter((t) => t.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="px-3 mb-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/60">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(({ path, icon: Icon, label }) => {
                  const isActive = location.pathname === path;
                  return (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium group nav-item ${isActive ? "nav-active" : "text-muted-foreground"
                        }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary"
                          }`}
                      />
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary opacity-70" />}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* External Links */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/60">ACESSO RÁPIDO</p>
          <div className="space-y-0.5">
            {externalLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium group nav-item text-muted-foreground"
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                <span className="flex-1">{label}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* User + Footer */}
      <div className="border-t border-border px-4 py-3">
        {user && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
            </div>
            <button onClick={signOut} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
              Sair
            </button>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground/50 text-center tracking-wider">
          © 2025 UNICFILM • v2.0
        </p>
      </div>
    </>
  );
}

export default function Sidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-foreground shadow-card"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Overlay */}
        {open && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-250"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Drawer */}
        <aside
          className={`fixed top-0 left-0 z-50 w-72 h-full bg-background border-r border-border flex flex-col transition-transform duration-250 ${open ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>
      </>
    );
  }

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col flex-shrink-0">
      <SidebarContent />
    </aside>
  );
}
