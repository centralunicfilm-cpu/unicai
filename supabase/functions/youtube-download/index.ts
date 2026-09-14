import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAPIDAPI_HOST = "youtube-mp3-audio-video-downloader.p.rapidapi.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, quality } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RAPID_API_KEY = Deno.env.get("RAPID_API_KEY");
    if (!RAPID_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RAPID_API_KEY não configurada." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isAudioOnly = quality === "audio";

    // ROUTING LOGIC:
    // 1. YouTube + Audio -> Use the old dedicated audio API
    // 2. Anything else (Video OR other platforms) -> Use the new versatile API

    let downloadUrl = "";
    let contentType = isAudioOnly ? "audio/mpeg" : "video/mp4";
    let ext = isAudioOnly ? "mp3" : "mp4";

    if (isYoutube && isAudioOnly) {
      // OLD API: youtube-mp3-audio-video-downloader.p.rapidapi.com
      const rapidHeaders = {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPID_API_KEY,
      };

      const videoId = extractVideoId(url);
      if (!videoId) throw new Error("ID do YouTube não encontrado.");

      const endpoint = `https://youtube-mp3-audio-video-downloader.p.rapidapi.com/download-mp3/${videoId}`;
      console.log(`Using OLD API for YouTube MP3: ${endpoint}`);

      const dlRes = await fetch(endpoint, { method: "GET", headers: rapidHeaders });
      if (!dlRes.ok) throw new Error(`Erro na API de Áudio (${dlRes.status})`);

      return new Response(dlRes.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${videoId}.${ext}"`,
        },
      });
    } else {
      // NEW API: instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com
      const NEW_API_HOST = "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com";
      const endpoint = `https://${NEW_API_HOST}/get-info-rapidapi?url=${encodeURIComponent(url)}`;
      console.log(`Using NEW API for Video/Other: ${endpoint}`);

      const infoHeaders = {
        "x-rapidapi-host": NEW_API_HOST,
        "x-rapidapi-key": RAPID_API_KEY,
      };

      const infoRes = await fetch(endpoint, { method: "GET", headers: infoHeaders });
      const rawText = await infoRes.text();
      console.log("Raw API response status:", infoRes.status, "body length:", rawText.length);
      
      if (!infoRes.ok) throw new Error(`Erro ao buscar info do vídeo (${infoRes.status}): ${rawText.substring(0, 200)}`);

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error("Failed to parse JSON. Raw response:", rawText.substring(0, 500));
        throw new Error("A API retornou uma resposta inválida. Tente novamente.");
      }
      console.log("New API info found. Parsing URL...");

      // 1. YouTube specific logic: Look into 'medias' array for the requested quality
      if (isYoutube && Array.isArray(data.medias)) {
        console.log(`Searching for quality: ${quality} in YouTube medias array. Items: ${data.medias.length}`);

        // Filter out definitely audio-only formats
        const videoMedias = data.medias.filter((m: any) =>
          m.extension !== "mp3" &&
          m.extension !== "m4a" &&
          (m.type === "video" || m.type === "mixed" || !m.type)
        );

        // Heuristic to check for "combined/merged" streams (Video + Audio)
        const isCombined = (m: any) =>
          (m.audioAvailable === true && m.videoAvailable === true) ||
          (m.audio_available === true && m.video_available === true) ||
          (m.hasAudio === true || m.has_audio === true) ||
          (m.merged === true) ||
          (m.type === "mixed") ||
          (m.is_video_only === false && m.is_audio_only === false);

        // Strategy A: Find exact match for quality that is combined
        let match = videoMedias.find((m: any) =>
          String(m.quality).includes(quality) && isCombined(m)
        );

        // Strategy B: If no combined exact match, pick the LARGEST file for that quality
        // (Assuming merged file > video-only or audio-only)
        if (!match) {
          const sameQuality = videoMedias.filter((m: any) => String(m.quality).includes(quality));
          if (sameQuality.length > 0) {
            match = sameQuality.sort((a: any, b: any) => (parseInt(b.size) || 0) - (parseInt(a.size) || 0))[0];
          }
        }

        // Strategy C: Fallback to best available combined stream if any
        if (!match) {
          match = videoMedias
            .filter(isCombined)
            .sort((a: any, b: any) => (parseInt(b.quality || 0) - parseInt(a.quality || 0)))[0];
        }

        // Strategy D: Last ditch - any match for quality
        if (!match) {
          match = videoMedias.find((m: any) => String(m.quality).includes(quality));
        }

        if (match) {
          downloadUrl = match.url;
          console.log(`Resolved URL: ${downloadUrl} (Quality: ${match.quality})`);
        }
      }

      // 2. Generic fallbacks and other platforms
      if (!downloadUrl) {
        if (data.url) downloadUrl = data.url;
        else if (data.download_url) downloadUrl = data.download_url;
        else if (Array.isArray(data.medias) && data.medias[0]?.url) downloadUrl = data.medias[0].url;
        else if (data.data?.url) downloadUrl = data.data.url;
        else if (data.links && data.links[0]?.url) downloadUrl = data.links[0].url;
        else if (data.media && data.media[0]?.url) downloadUrl = data.media[0].url;
      }

      if (!downloadUrl) {
        console.error("Could not find download URL in response:", data);
        return new Response(JSON.stringify({ error: "Não foi possível encontrar o link de download na resposta da API.", details: data }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Resolved Download URL: ${downloadUrl}`);

      // Fetch the actual file and stream it
      const fileRes = await fetch(downloadUrl);
      if (!fileRes.ok) throw new Error("Falha ao buscar o arquivo final para streaming.");

      return new Response(fileRes.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="download_${Date.now()}.${ext}"`,
        },
      });
    }
  } catch (e) {
    console.error("Download error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractVideoId(url: string): string | null {
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}
