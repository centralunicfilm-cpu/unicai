import { forwardRef, Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { MessageSquare, X, Send, Image as ImageIcon, Video, Paperclip, Maximize2, Minimize2, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadOriginalMedia } from "@/lib/sharedMedia";
import { resolveChat, sendChatMessage, subscribeChat, type ResolvedChatMessage } from "@/lib/localChat";
import { forwardChatToHost, lanState, subscribeLan } from "@/lib/lanSync";
import { fileToDataUrl } from "@/lib/runware";

interface Message {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    content: string;
    media_url?: string | null;
    media_type?: "image" | "video" | null;
    created_at: string;
}

const GroupChatIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 64 64"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path
            d="M12 8h40a6 6 0 0 1 6 6v25a6 6 0 0 1-6 6H36l-9 8v-8H12a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Z"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="32" cy="22" r="4.5" stroke="currentColor" strokeWidth="3" />
        <circle cx="19" cy="25" r="3.5" stroke="currentColor" strokeWidth="2.7" opacity="0.75" />
        <circle cx="45" cy="25" r="3.5" stroke="currentColor" strokeWidth="2.7" opacity="0.75" />
        <path d="M23.5 39c.7-6 3.5-9 8.5-9s7.8 3 8.5 9" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M12.5 38c.5-4.7 2.7-7 6.5-7 2.1 0 3.7.7 4.8 2" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" opacity="0.75" />
        <path d="M40.2 33c1.1-1.3 2.7-2 4.8-2 3.8 0 6 2.3 6.5 7" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" opacity="0.75" />
    </svg>
);

function dayKey(dateIso: string) {
    const date = new Date(dateIso);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDayLabel(dateIso: string) {
    const target = new Date(dateIso);
    const now = new Date();

    const isToday =
        target.getDate() === now.getDate() &&
        target.getMonth() === now.getMonth() &&
        target.getFullYear() === now.getFullYear();

    if (isToday) return "Hoje";

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        target.getDate() === yesterday.getDate() &&
        target.getMonth() === yesterday.getMonth() &&
        target.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Ontem";

    return target.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function playIncomingMessageSound() {
    try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const now = audioContext.currentTime;
        const gain = audioContext.createGain();
        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

        [660, 880].forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(frequency, now + index * 0.09);
            oscillator.connect(gain);
            oscillator.start(now + index * 0.09);
            oscillator.stop(now + 0.2 + index * 0.09);
        });

        window.setTimeout(() => void audioContext.close(), 500);
    } catch {
        // O navegador pode bloquear áudio antes da primeira interação do usuário.
    }
}

const FloatingChat = forwardRef<HTMLDivElement>(function FloatingChat(_props, ref) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: "image" | "video"; prompt: string } | null>(null);
    const [lanInfo, setLanInfo] = useState(() => lanState());
    const knownIdsRef = useRef<Set<string>>(new Set());
    const { user, profile } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentNameRef = useRef<string>("Usuário");
    const currentAvatarRef = useRef<string>("");
    const isOpenRef = useRef(false);
    const isMinimizedRef = useRef(false);

    const sortedMessages = useMemo(
        () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        [messages],
    );

    const scrollToBottom = () => {
        window.setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 80);
    };

    useEffect(() => {
        if (!user) return;
        currentNameRef.current = profile?.full_name || user.email?.split("@")[0] || "Usuário";
        currentAvatarRef.current = profile?.avatar_url || "";
    }, [user?.id, user?.email, profile?.full_name, profile?.avatar_url]);

    useEffect(() => {
        isOpenRef.current = isOpen;
        isMinimizedRef.current = isMinimized;
        if (isOpen && !isMinimized) setUnreadCount(0);
    }, [isOpen, isMinimized]);

    const toUiMessage = (item: ResolvedChatMessage): Message => ({
        id: item.id,
        user_id: item.userId,
        full_name: item.fullName,
        avatar_url: null,
        content: item.content,
        media_url: item.displayUrl ?? item.mediaUrl,
        media_type: item.mediaType,
        created_at: item.createdAt,
    });

    useEffect(() => {
        if (!user) {
            setMessages([]);
            setOnlineUsers([]);
            setLoadingMessages(false);
            knownIdsRef.current = new Set();
            return;
        }

        let isMounted = true;
        const myId = user.id;

        const load = async () => {
            try {
                const items = await resolveChat();
                if (!isMounted) return;
                const known = knownIdsRef.current;
                const fresh = items.filter((item) => !known.has(item.id));
                for (const item of fresh) {
                    known.add(item.id);
                    if (item.userId !== myId) {
                        playIncomingMessageSound();
                        if (!isOpenRef.current || isMinimizedRef.current) {
                            setUnreadCount((current) => current + 1);
                        }
                    }
                }
                setMessages(items.map(toUiMessage));
                if (fresh.length > 0) scrollToBottom();
            } catch (error) {
                console.error("Error loading chat:", error);
            }
        };

        const initial = async () => {
            setLoadingMessages(true);
            try {
                const items = await resolveChat();
                if (!isMounted) return;
                knownIdsRef.current = new Set(items.map((item) => item.id));
                setMessages(items.map(toUiMessage));
                scrollToBottom();
            } catch (error) {
                console.error("Error loading chat:", error);
            } finally {
                if (isMounted) setLoadingMessages(false);
            }
        };

        void initial();
        setOnlineUsers(
            lanState().clients.map((client) => ({ user_id: client.id, full_name: client.name })),
        );
        const offChat = subscribeChat(() => void load());
        const offLan = subscribeLan(() => {
            if (!isMounted) return;
            const info = lanState();
            setLanInfo(info);
            setOnlineUsers(info.clients.map((client) => ({ user_id: client.id, full_name: client.name })));
            void load();
        });

        return () => {
            isMounted = false;
            offChat();
            offLan();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        if (isOpen && !isMinimized) scrollToBottom();
    }, [isOpen, isMinimized, sortedMessages]);

    const persistMessage = async (content: string, mediaUrl?: string, mediaType?: "image" | "video") => {
        if (!user) throw new Error("Usuário não autenticado");

        const name = profile?.full_name || user.email?.split("@")[0] || "Usuário";
        const inserted = await sendChatMessage({
            userId: user.id,
            fullName: name,
            content,
            sourceUrl: mediaUrl ?? null,
            mediaType: mediaType ?? null,
        });
        // Espalha para os outros Macs quando conectado ao anfitrião.
        forwardChatToHost(inserted);
        knownIdsRef.current.add(inserted.id);
        return toUiMessage({ ...inserted, displayUrl: mediaUrl ?? inserted.mediaUrl });
    };

    const handleSendMessage = async (e?: FormEvent, mediaUrl?: string, mediaType?: "image" | "video") => {
        if (e) e.preventDefault();
        if (!user || sendingMessage) return;

        const typedContent = newMessage.trim();
        if (!typedContent && !mediaUrl) return;

        setSendingMessage(true);
        try {
            console.log("Saving msg...");
            const inserted = await persistMessage(typedContent, mediaUrl, mediaType);
            console.log("Saved!", inserted);
            setNewMessage("");
            setMessages((prev) => (prev.some((item) => item.id === inserted.id) ? prev : [...prev, inserted]));
            scrollToBottom();
        } catch (error: any) {
            console.error("Error sending message:", error);
            toast.error(error?.message || "Erro ao enviar mensagem");
        } finally {
            setSendingMessage(false);
        }
    };

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
            toast.error("Apenas imagens e vídeos são permitidos");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Máximo 20MB.");
            return;
        }

        setUploading(true);

        try {
            // Modo local: converte para data URL e guarda neste Mac (IndexedDB).
            const dataUrl = await fileToDataUrl(file);
            const resolvedMediaType: "image" | "video" = isVideo ? "video" : "image";

            await handleSendMessage(undefined, dataUrl, resolvedMediaType);
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error?.message || "Erro no upload do arquivo");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (!user) return null;

    return (
        <div ref={ref} className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4 pointer-events-none">
            {isOpen && (
                <div
                    className={cn(
                        "w-80 md:w-[400px] bg-[#0B0B0D]/95 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-[0_20px_80px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-500 pointer-events-auto",
                        isMinimized ? "h-20" : "h-[600px]",
                    )}
                >
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 shrink-0 rounded-full bg-orange/10 flex items-center justify-center border border-orange/40 overflow-hidden shadow-[0_0_18px_rgba(242,142,56,0.12)]">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} className="h-full w-full object-cover" alt="Foto do perfil" />
                                ) : (
                                    <span className="text-sm font-semibold uppercase text-orange">
                                        {(profile?.full_name || user.email || "U").charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="truncate text-[15px] font-medium leading-tight text-white">
                                    {profile?.full_name || user.email?.split("@")[0] || "Usuário"}
                                </h4>
                                <p className="mt-1 text-[10px] font-normal tracking-[0.08em] text-white/40">
                                    {lanInfo.state === "on"
                                        ? `Rede • ${lanInfo.clients.length + 1} online`
                                        : "Chat geral • neste Mac"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMinimized((prev) => !prev)} className="p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all">
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto scrollbar-hide space-y-4">
                                {loadingMessages && (
                                    <div className="flex justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-orange/30 border-t-orange rounded-full animate-spin" />
                                    </div>
                                )}

                                {!loadingMessages && sortedMessages.length === 0 && (
                                    <div className="text-center py-12">
                                        <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-3" />
                                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Nenhuma mensagem ainda</p>
                                        <p className="text-[9px] text-white/10 mt-1">Seja o primeiro a enviar!</p>
                                    </div>
                                )}

                                {!loadingMessages &&
                                    sortedMessages.map((msg, index) => {
                                        const isMine = msg.user_id === user.id;
                                        const showDateDivider = index === 0 || dayKey(msg.created_at) !== dayKey(sortedMessages[index - 1].created_at);

                                        return (
                                            <Fragment key={msg.id}>
                                                {showDateDivider && (
                                                    <div className="flex justify-center py-2">
                                                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">
                                                            {formatDayLabel(msg.created_at)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={cn("flex flex-col gap-2 max-w-[88%]", isMine ? "ml-auto items-end" : "mr-auto items-start")}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
                                                            {msg.avatar_url ? (
                                                                <img src={msg.avatar_url} className="w-full h-full object-cover" alt={msg.full_name} />
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-white/50 uppercase">{(msg.full_name || "U").charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.16em]">{msg.full_name || "Usuário"}</span>
                                                        <span className="text-[8px] text-white/20 uppercase tracking-[0.1em]">
                                                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={cn(
                                                            "px-5 py-3.5 rounded-[24px] text-xs leading-relaxed shadow-2xl transition-all",
                                                            isMine
                                                                ? "bg-orange text-white rounded-tr-none shadow-orange/10"
                                                                : "bg-white/5 text-white/80 border border-white/5 rounded-tl-none",
                                                        )}
                                                    >
                                                        {msg.content && <p>{msg.content}</p>}
                                                        {msg.media_url && (
                                                            <div
                                                                className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => setSelectedMedia({
                                                                    url: msg.media_url!,
                                                                    type: msg.media_type as "image" | "video",
                                                                    prompt: msg.content,
                                                                })}
                                                            >
                                                                {msg.media_type === "video" ? (
                                                                    <video src={msg.media_url} className="w-full aspect-video pointer-events-none" />
                                                                ) : (
                                                                    <img src={msg.media_url} className="w-full" alt="Arquivo compartilhado" loading="lazy" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Fragment>
                                        );
                                    })}

                                {(uploading || sendingMessage) && (
                                    <div className="flex justify-end">
                                        <div className="bg-orange/10 border border-orange/20 px-4 py-2 rounded-full animate-pulse flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange animate-bounce" />
                                            <span className="text-[8px] font-bold text-orange uppercase tracking-widest">Processando...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                                <form onSubmit={handleSendMessage} className="flex gap-3">
                                    <div className="flex-1 relative group">
                                        <input
                                            value={newMessage}
                                            onChange={(event) => setNewMessage(event.target.value)}
                                            placeholder="Falar com a equipe..."
                                            className="w-full bg-[#0B0B0D] border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-orange/50 transition-all pr-12"
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" && !event.shiftKey) {
                                                    event.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading || sendingMessage}
                                                className="p-2 text-white/20 hover:text-orange transition-colors disabled:opacity-50"
                                            >
                                                <Paperclip className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="w-12 h-12 rounded-2xl bg-orange hover:bg-orange/80 text-white shrink-0 shadow-xl shadow-orange/20 active:scale-95 transition-transform"
                                        disabled={sendingMessage || uploading || !newMessage.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>

                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />

                                <div className="mt-4 flex items-center justify-between px-1">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            type="button"
                                            disabled={uploading || sendingMessage}
                                            className="p-1 text-white/10 hover:text-white hover:scale-110 transition-all disabled:opacity-50"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            type="button"
                                            disabled={uploading || sendingMessage}
                                            className="p-1 text-white/10 hover:text-white hover:scale-110 transition-all disabled:opacity-50"
                                        >
                                            <Video className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-20">
                                        <div className="w-1 h-1 rounded-full bg-white animate-ping" />
                                        <span className="text-[7px] text-white uppercase tracking-[0.3em] font-bold italic">Unicfilm Creative Hub</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <button
                aria-label="Abrir chat geral da equipe"
                title="Chat geral da equipe"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setIsMinimized(false);
                    if (!isOpen || isMinimized) setUnreadCount(0);
                }}
                className={cn(
                    "w-[78px] h-[78px] rounded-[27px] border border-orange/35 bg-[#171719] text-orange flex items-center justify-center shadow-[0_14px_36px_-12px_rgba(242,142,56,0.38)] transition-all duration-500 hover:scale-110 hover:border-orange/70 hover:bg-[#1D1917] active:scale-95 group relative pointer-events-auto",
                    isOpen && !isMinimized ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
                )}
            >
                <GroupChatIcon className="w-12 h-12 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-white text-orange text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-orange animate-bounce">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                )}
            </button>

            {/* Media Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center pointer-events-auto p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setSelectedMedia(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex max-h-[92vh] max-w-[92vw] flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
                        {selectedMedia.type === "video" ? (
                            <video src={selectedMedia.url} className="max-w-[90vw] max-h-[72vh] rounded-2xl shadow-2xl" controls autoPlay />
                        ) : (
                            <img src={selectedMedia.url} className="max-w-[90vw] max-h-[72vh] object-contain rounded-2xl shadow-2xl" alt="Mídia Ampliada" />
                        )}
                        <div className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:flex-row sm:items-center">
                            <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/70">{selectedMedia.prompt || "Material compartilhado pela equipe"}</p>
                            <button
                                type="button"
                                onClick={() => downloadOriginalMedia(
                                    selectedMedia.url,
                                    selectedMedia.type === "video" ? "unicfilm-video.mp4" : "unicfilm-image.png",
                                )}
                                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-orange/90"
                            >
                                <Download className="h-4 w-4" /> DOWNLOAD
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default FloatingChat;
