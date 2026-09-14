import React, { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, User, Wand2, Play, Maximize2, Download } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryItem {
    id: string;
    user: string;
    url: string;
    prompt: string;
    type: 'video' | 'image' | 'audio' | 'thumbnail';
    timestamp: string;
}

interface ComponentGalleryProps {
    title: string;
    items: GalleryItem[];
    type: 'video' | 'image' | 'audio' | 'thumbnail';
}

export default function ComponentGallery({ title, items, type }: ComponentGalleryProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: 'start',
        dragFree: true
    });
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    if (items.length === 0) return null;

    return (
        <div className="w-full mt-16 pt-16 border-t border-white/5 space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-orange rounded-full" />
                    <h3 className="text-sm font-bold tracking-[0.4em] uppercase text-white/50 italic">
                        {title}
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={scrollPrev}
                        className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:border-orange/50 hover:bg-orange/5 text-white/40 hover:text-orange transition-all active:scale-90"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:border-orange/50 hover:bg-orange/5 text-white/40 hover:text-orange transition-all active:scale-90"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
                <div className="flex px-[1px] gap-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex-[0_0_280px] sm:flex-[0_0_320px] min-w-0"
                        >
                            <div
                                onClick={() => setSelectedItem(item)}
                                className="group relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-[#0B0B0D] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_60px_-15px_rgba(242,142,56,0.2)] cursor-pointer"
                            >
                                {type === 'video' ? (
                                    <div className="w-full h-full relative">
                                        <img
                                            src={item.url}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-orange/80 group-hover:border-orange transition-all">
                                                <Play className="w-5 h-5 text-white fill-current ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={item.url}
                                        alt="Creation"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                                {/* Content Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                                <User className="w-3.5 h-3.5 text-white/70" />
                                            </div>
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{item.user}</span>
                                        </div>
                                        <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{item.timestamp}</span>
                                    </div>
                                    <p className="text-[10px] text-white/60 italic line-clamp-1 group-hover:text-white/90 transition-colors">
                                        "{item.prompt}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="sm:max-w-[700px] bg-[#0B0B0D]/95 border-white/10 backdrop-blur-2xl rounded-3xl p-0 overflow-hidden !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 shadow-[0_0_100px_-20px_rgba(242,142,56,0.3)]">
                    <div className="flex flex-col">
                        <div className="relative aspect-video bg-black group">
                            {type === 'video' ? (
                                <video src={selectedItem?.url} controls className="w-full h-full" autoPlay />
                            ) : (
                                <img src={selectedItem?.url} className="w-full h-full object-contain" />
                            )}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-white hover:text-orange transition-colors">
                                    <Download className="w-4 h-4" />
                                </button>
                                <button className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-white hover:text-orange transition-colors">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center border border-orange/20">
                                        <User className="w-6 h-6 text-orange" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-display tracking-widest uppercase text-white">{selectedItem?.user}</h4>
                                        <span className="text-[10px] text-orange/60 font-bold tracking-[0.3em] uppercase">{type} Generation</span>
                                    </div>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-white/60 tracking-widest">VERIFICADO</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-orange">
                                    <Wand2 className="w-4 h-4" />
                                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Prompt Original</span>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/80 italic leading-relaxed font-light">
                                    "{selectedItem?.prompt}"
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 py-4 rounded-2xl bg-orange text-white font-bold tracking-[0.2em] uppercase text-xs shadow-lg shadow-orange/20 transition-transform active:scale-95">
                                    Utilizar este Estilo
                                </button>
                                <button className="px-6 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
