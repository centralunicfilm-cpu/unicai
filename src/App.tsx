import { useLayoutEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";
import HiTechBackground from "@/components/HiTechBackground";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ImageGen from "./pages/ImageGen";
import VideoGen from "./pages/VideoGen";
import ThumbnailGen from "./pages/ThumbnailGen";
import ScriptWriter from "./pages/ScriptWriter";
import YoutubeDownloader from "./pages/YoutubeDownloader";
import BgRemover from "./pages/BgRemover";
import Transcription from "./pages/Transcription";
import Narration from "./pages/Narration";
import AudioCleaner from "./pages/AudioCleaner";
import SmartEditor from "./pages/SmartEditor";
import MySpace from "./pages/MySpace";
import AccountSettings from "./pages/AccountSettings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminPanel from "./pages/AdminPanel";
import UserProfile from "./pages/UserProfile";
import MyPlan from "./pages/MyPlan";
import PublicGalleryPage from "./pages/PublicGalleryPage";
import Network from "./pages/Network";
import Prompts from "./pages/Prompts";
import Inspiration from "./pages/Inspiration";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-orange/5 animate-pulse blur-[100px]" />
        <div className="relative w-12 h-12 border-2 border-orange/20 border-t-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  if (profile?.status === "blocked") {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-2xl font-bold text-red-500 tracking-widest uppercase">Conta Bloqueada</h1>
          <p className="text-white/40 text-sm">Seu acesso foi suspenso por um administrador. Por favor, entre em contato com o suporte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background w-full relative overflow-hidden">
      <HiTechBackground />
      <Navbar />
      <main className="flex-1 flex flex-col pt-16 overflow-hidden min-w-0 relative z-10">
        <Routes key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/gallery" element={<PublicGalleryPage />} />
          <Route path="/gallery/:filter" element={<PublicGalleryPage />} />
          <Route path="/image-gen" element={<ImageGen />} />
          <Route path="/video-gen" element={<VideoGen />} />
          <Route path="/thumbnail-gen" element={<ThumbnailGen />} />
          <Route path="/youtube-downloader" element={<YoutubeDownloader />} />
          <Route path="/transcription" element={<Transcription />} />
          <Route path="/narration" element={<Narration />} />
          <Route path="/audio-cleaner" element={<AudioCleaner />} />
          <Route path="/my-space" element={<MySpace />} />
          <Route path="/history" element={<MySpace />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/my-plan" element={<MyPlan />} />
          <Route path="/settings" element={<AccountSettings />} />
          <Route path="/rede" element={<Network />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/inspiracao" element={<Inspiration />} />

          {profile?.role === "admin_master" && <Route path="/admin" element={<AdminPanel />} />}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <FloatingChat />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
