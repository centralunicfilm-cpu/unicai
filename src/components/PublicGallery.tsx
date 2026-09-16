import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, MessageSquare, User, Wand2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import creation3 from "@/assets/gallery/creation_3.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { downloadOriginalMedia, isGalleryEligibleContent, visibleSharedContent } from "@/lib/sharedMedia";

interface GalleryCard {
    id?: string;
    user_id?: string;
    user: string;
    image: string;
    prompt: string;
    type: string;
    avatar_url?: string | null;
}

const collaborativeData: GalleryCard[] = [
    {
        user: "Damaceno",
        image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
        prompt: "A cinematic, high-tech camera flying through a neon-lit cyberpunk city at night, ultra realistic, 8k, orange accents, drone perspective.",
        type: "Vídeo"
    },
    {
        user: "Jonathan",
        image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80",
        prompt: "Abstract 3D visualization of neural networks, glowing orange and blue filaments, digital art, sleek aesthetic, high-tech background.",
        type: "Imagem"
    },
    {
        user: "Vinicius",
        image: creation3,
        prompt: "A professional film set in an old library, modern lighting gear, contrast between classic architecture and hi-tech equipment, cinematic atmosphere.",
        type: "Vídeo"
    },
    {
        user: "Catatau",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
        prompt: "Futuristic sound waves visualizer, liquid metal textures, orange glowing highlights, extremely detailed 3D render.",
        type: "Imagem"
    },
    {
        user: "Juliana",
        image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
        prompt: "A sleek, minimalist editing suite with ultra-wide screens showing complex video timelines, soft ambient orange lighting, premium look.",
        type: "Vídeo"
    }
];

export default function PublicGallery() {
    const { user, profile } = useAuth();
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: 'start',
        dragFree: true
    });
    const [selectedItem, setSelectedItem] = useState<GalleryCard | null>(null);
    const [publishedItems, setPublishedItems] = useState<GalleryCard[]>([]);
    const [isHovered, setIsHovered] = useState(false);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const profileBelongsToCard = useCallback((cardName: string) => {
        if (!user || !profile?.avatar_url) return false;
        const normalizedCardName = cardName.trim().toLocaleLowerCase("pt-BR");
        const normalizedProfileName = (profile.full_name || "").trim().toLocaleLowerCase("pt-BR");
        return normalizedProfileName === normalizedCardName || normalizedProfileName.split(/\s+/).includes(normalizedCardName);
    }, [user, profile?.avatar_url, profile?.full_name]);

    const renderAvatar = (item: GalleryCard, size: "small" | "large") => {
        const avatarSize = size === "large" ? "w-12 h-12" : "w-7 h-7";
        const iconSize = size === "large" ? "w-6 h-6" : "w-4 h-4";
        const currentAvatar = item.user_id === user?.id || profileBelongsToCard(item.user) ? profile?.avatar_url : null;
        const avatarUrl = currentAvatar || item.avatar_url;

        return (
            <div className={`${avatarSize} shrink-0 rounded-full overflow-hidden bg-orange/20 flex items-center justify-center border border-orange/30`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={`Foto de ${item.user}`} className="w-full h-full object-cover" />
                ) : (
                    <User className={`${iconSize} text-orange`} />
                )}
            </div>
        );
    };

    useEffect(() => {
        let active = true;

        const toGalleryCard = (message: any): GalleryCard | null => {
            if (!message?.media_url || !isGalleryEligibleContent(message.content)) return null;
            return {
                id: message.id,
                user_id: message.user_id,
                user: message.full_name || "Membro",
                image: message.media_url,
                prompt: visibleSharedContent(message.content),
                type: message.media_type === "video" ? "Vídeo" : "Imagem",
                avatar_url: message.avatar_url || null,
            };
        };

        supabase
            .from("messages")
            .select("id,user_id,full_name,avatar_url,content,media_url,media_type,created_at")
            .not("media_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(100)
            .then(({ data }) => {
                if (!active) return;
                setPublishedItems((data || []).flatMap((message) => {
                    const card = toGalleryCard(message);
                    return card ? [card] : [];
                }));
            });

        const channel = supabase
            .channel("dashboard_public_gallery")
            .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
                if (!active) return;
                const card = toGalleryCard(payload.new);
                if (card) setPublishedItems((current) => [card, ...current.filter((item) => item.id !== card.id)].slice(0, 12));
            })
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel);
        };
    }, []);

    const galleryItems = [...publishedItems, ...collaborativeData, ...collaborativeData];

    useEffect(() => {
        if (!emblaApi || isHovered) return;

        const intervalId = setInterval(() => {
            emblaApi.scrollNext();
        }, 3000);

        return () => clearInterval(intervalId);
    }, [emblaApi, isHovered]);

    return (
        <div className="w-full py-10 space-y-6 animate-fade-in" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div className="flex items-center justify-between px-4 md:px-0">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange animate-pulse" />
                    <h3 className="text-xl md:text-2xl font-display tracking-[0.25em] uppercase text-white drop-shadow-[0_0_15px_rgba(242,142,56,0.3)]">
                        Galeria Geral
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={scrollPrev}
                        className="p-2 rounded-full border border-[hsl(var(--border))] hover:border-orange/50 hover:bg-orange/5 text-[hsl(var(--text-dim))] hover:text-orange transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="p-2 rounded-full border border-[hsl(var(--border))] hover:border-orange/50 hover:bg-orange/5 text-[hsl(var(--text-dim))] hover:text-orange transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden cursor-grab active:cursor-grabbing pb-8" ref={emblaRef}>
                <div className="flex px-[1px]">
                    {galleryItems.map((item, index) => (
                        <div
                            key={`${item.user}-${index}`}
                            className="flex-[0_0_260px] sm:flex-[0_0_300px] min-w-0 pl-6"
                        >
                            <div
                                onClick={() => setSelectedItem(item)}
                                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--surface))] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] cursor-pointer"
                            >
                                <img
                                    src={item.image}
                                    alt={`Creation by ${item.user}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-center gap-2">
                                        {renderAvatar(item, "small")}
                                        <span className="text-xs font-bold text-white tracking-widest uppercase">{item.user}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-orange/80 font-bold tracking-[0.2em] uppercase">{item.type}</span>
                                        <div className="px-2 py-0.5 rounded-full bg-white/10 text-[8px] text-white/60 tracking-tighter uppercase backdrop-blur-md">Clique p/ Prompt</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="sm:max-w-[550px] bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border))] text-[hsl(var(--text-primary))] rounded-3xl p-6 overflow-hidden !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            {selectedItem && renderAvatar(selectedItem, "large")}
                            <div>
                                <h2 className="text-xl font-display tracking-[0.15em] uppercase text-white">Criação de {selectedItem?.user}</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-orange font-bold tracking-[0.3em] uppercase">{selectedItem?.type}</span>
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="text-[9px] text-[hsl(var(--text-dim))] tracking-widest uppercase">Unicfilm Community</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                            <img src={selectedItem?.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>

                        {selectedItem && (
                            <button
                                type="button"
                                onClick={() => downloadOriginalMedia(
                                    selectedItem.image,
                                    selectedItem.type === "Vídeo" ? "unicfilm-video.mp4" : "unicfilm-image.png",
                                )}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-orange/90"
                            >
                                <Download className="h-4 w-4" /> DOWNLOAD ORIGINAL
                            </button>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-orange">
                                <Wand2 className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-[0.3em] uppercase">Prompt de Criação</span>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange/20 to-orange/5 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
                                <div className="relative p-5 rounded-xl bg-black/60 border border-white/10 text-sm text-[hsl(var(--text-secondary))] italic leading-relaxed backdrop-blur-xl">
                                    "{selectedItem?.prompt}"
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
