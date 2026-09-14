import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Video,
    Image as ImageIcon,
    Paintbrush,
    Mic,
    FileText,
    User,
    Settings,
    Clock,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    Zap,
    Download
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const studioItems = [
    { title: "Gerar Vídeo", href: "/video-gen", icon: Video, description: "Crie vídeos cinematográficos com IA" },
    { title: "Gerar Imagem", href: "/image-gen", icon: ImageIcon, description: "Gere imagens realistas e arte digital" },
    { title: "Gerar Thumbnail", href: "/thumbnail-gen", icon: Paintbrush, description: "Crie capas de alta performance" },
    { title: "Narração IA", href: "/narration", icon: Mic, description: "Vozes realistas com ElevenLabs" },
    { title: "Transcrição", href: "/transcription", icon: FileText, description: "Transforme áudio em texto" },
    { title: "Downloader", href: "/youtube-downloader", icon: Download, description: "Baixe vídeos de múltiplas plataformas" },
];

const toolItems = [
    { title: "Configurações", href: "/settings", icon: Settings },
    { title: "Histórico", href: "/history", icon: Clock },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, profile, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0D]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6">
            <div className="w-full relative flex items-center h-full">
                <div className="flex-1 flex justify-center">
                    <div className="hidden lg:flex items-center">
                        <NavigationMenu>
                            <NavigationMenuList className="gap-2 rounded-full border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl">
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="h-10 rounded-full px-6 text-xs font-bold tracking-[0.2em] uppercase text-white border border-white/20 bg-white/10 shadow-[0_0_28px_hsl(var(--foreground)/0.2)] hover:brightness-110 data-[state=open]:bg-white/15 data-[state=open]:border-white/30">
                                        Studio IA
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[#0B0B0D] border border-white/10 shadow-2xl rounded-2xl">
                                            {studioItems.map((item) => (
                                                <li key={item.href}>
                                                    <NavigationMenuLink asChild>
                                                        <Link
                                                            to={item.href}
                                                            className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all hover:bg-white/5 group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <item.icon className="w-4 h-4 text-orange group-hover:scale-110 transition-transform" />
                                                                <div className="text-sm font-bold leading-none text-white tracking-wide">{item.title}</div>
                                                            </div>
                                                            <p className="line-clamp-2 text-[10px] leading-snug text-white/40 mt-1 uppercase tracking-tighter">
                                                                {item.description}
                                                            </p>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                </li>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                <NavigationMenuItem>
                                    <Link
                                        to="/gallery"
                                        className="inline-flex h-10 items-center justify-center rounded-full px-5 text-xs font-bold tracking-[0.2em] uppercase text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        Galeria
                                    </Link>
                                </NavigationMenuItem>

                                <NavigationMenuItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white hover:bg-white/5 transition-all">
                                                Ferramentas
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="center"
                                            sideOffset={12}
                                            className="w-[220px] bg-[#0B0B0D] border border-white/10 shadow-2xl rounded-2xl p-3"
                                        >
                                            {toolItems.map((item) => (
                                                <DropdownMenuItem
                                                    key={item.href}
                                                    className="focus:bg-white/5 rounded-xl p-3 cursor-pointer"
                                                    asChild
                                                >
                                                    <Link to={item.href} className="flex items-center gap-3">
                                                        <item.icon className="w-4 h-4 text-white/40" />
                                                        <div className="text-xs font-bold text-white/80 uppercase tracking-widest">{item.title}</div>
                                                    </Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                </div>

                <div className="flex items-center gap-3 absolute right-0">
                    <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-white/5">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange/10 border border-orange/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
                            <span className="text-[10px] font-bold text-orange tracking-[0.2em] uppercase">PRO</span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 p-0 group overflow-visible">
                                <div className="w-full h-full rounded-full overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-full h-full object-cover rounded-full" alt="Avatar" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60 lowercase">
                                            {profile?.full_name?.[0] || user?.email?.[0] || "u"}
                                        </div>
                                    )}
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0B0B0D] rounded-full z-10" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 mt-3 bg-[#0B0B0D]/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl p-2" align="end">
                            <DropdownMenuLabel className="font-normal p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span className="text-orange font-bold uppercase">{profile?.full_name?.[0] || user?.email?.[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col space-y-1 overflow-hidden">
                                        <p className="text-xs font-bold leading-none truncate tracking-wide text-white uppercase italic">{profile?.full_name || user?.email?.split("@")[0]}</p>
                                        <p className="text-[9px] leading-none text-white/40 tracking-widest uppercase">Membro Premium</p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5 mx-2" />

                            <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer py-3 rounded-xl transition-all" asChild>
                                <Link to="/profile" className="flex items-center">
                                    <User className="mr-3 h-4 w-4 text-white/40" />
                                    <span className="text-xs font-bold tracking-widest uppercase">Perfil</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer py-3 rounded-xl transition-all" asChild>
                                <Link to="/my-plan" className="flex items-center">
                                    <Zap className="mr-3 h-4 w-4 text-orange" />
                                    <span className="text-xs font-bold tracking-widest uppercase">Meu Plano</span>
                                </Link>
                            </DropdownMenuItem>

                            {profile?.role === "admin_master" && (
                                <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer py-3 rounded-xl transition-all" asChild>
                                    <Link to="/admin" className="flex items-center">
                                        <LayoutDashboard className="mr-3 h-4 w-4 text-blue-400" />
                                        <span className="text-xs font-bold tracking-widest uppercase text-blue-400">Painel Admin</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-white/5 mx-2" />

                            <DropdownMenuItem
                                onClick={handleSignOut}
                                className="focus:bg-red-500/10 focus:text-red-500 text-red-500/70 cursor-pointer py-3 rounded-xl transition-all"
                            >
                                <LogOut className="mr-3 h-4 w-4" />
                                <span className="text-xs font-bold tracking-widest uppercase">Sair</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        className="lg:hidden p-0 h-10 w-10 text-white/70 hover:text-white hover:bg-white/5 border border-white/5 rounded-full"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {isOpen && (
                <div className="lg:hidden fixed inset-x-0 top-16 bg-[#0B0B0D] border-b border-white/10 p-6 flex flex-col gap-8 animate-in slide-in-from-top-4 duration-300 h-[calc(100vh-4rem)]">
                    <div className="space-y-6">
                        <p className="text-[10px] font-bold text-orange tracking-[0.4em] uppercase italic">Studio IA</p>
                        <div className="grid grid-cols-1 gap-4">
                            {studioItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-4 text-xs font-bold text-white/60 hover:text-white transition-all tracking-[0.2em] uppercase"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                                        <item.icon className="w-4 h-4 text-orange" />
                                    </div>
                                    {item.title}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <Link
                            to="/gallery"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold tracking-[0.2em] uppercase text-white/70"
                        >
                            Galeria Pública
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}

