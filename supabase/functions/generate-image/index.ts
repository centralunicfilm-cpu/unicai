import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Payload inválido ou muito grande. Tente remover a imagem de referência e reenviar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = String(payload.prompt ?? "").trim();
    const style = String(payload.style ?? "Cinematográfico");
    const ratio = String(payload.ratio ?? "16:9");
    const engine = String(payload.engine ?? "Nano Banana");
    const legacyReferenceImage = typeof payload.referenceImage === "string" && payload.referenceImage.trim().length > 0
      ? payload.referenceImage.trim()
      : null;
    const referenceImages = Array.isArray(payload.referenceImages)
      ? payload.referenceImages
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .map((value) => value.trim())
          .slice(0, 5)
      : legacyReferenceImage
        ? [legacyReferenceImage]
        : [];

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RUNWARE_API_KEY = Deno.env.get("RUNWARE_API_KEY");
    if (!RUNWARE_API_KEY) throw new Error("RUNWARE_API_KEY is not configured");

    const fullPrompt = `Generate a ${style} style image: ${prompt}. Aspect ratio ${ratio}. Professional production quality, cinematic lighting, ultra high resolution.`;

    const normalizedEngine = engine.toLowerCase();
    let model = "openai:gpt-image@2";
    if (normalizedEngine.includes("flux")) model = "runware:101@1";
    else if (normalizedEngine.includes("banana 2")) model = "google:4@3";
    else if (normalizedEngine.includes("banana")) model = "google:4@2";

    const task: Record<string, unknown> = {
      taskType: "imageInference",
      taskUUID: crypto.randomUUID(),
      model,
      positivePrompt: fullPrompt,
      width: ratio === "9:16" || ratio === "3:4" ? 768 : 1024,
      height: ratio === "16:9" || ratio === "4:3" ? 768 : 1024,
      outputFormat: "PNG",
      numberResults: 1,
    };
    if (referenceImages.length) task.inputs = referenceImages.map((image) => ({ image }));

    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RUNWARE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([task]),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erro no gateway de IA");
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.imageURL;
    if (!imageUrl) throw new Error(data.errors?.[0]?.message || "Nenhuma imagem foi gerada");
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error("Não foi possível baixar a imagem gerada");
    const bytes = new Uint8Array(await imageResponse.arrayBuffer());

    // Upload base64 to storage bucket
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const fileName = `generated/${crypto.randomUUID()}.png`;
    const { error: uploadErr } = await sb.storage
      .from("media")
      .upload(fileName, bytes, { contentType: "image/png", upsert: false });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      throw new Error("Erro ao salvar imagem no storage");
    }

    const { data: publicData } = sb.storage.from("media").getPublicUrl(fileName);

    return new Response(JSON.stringify({ imageUrl: publicData.publicUrl, model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
