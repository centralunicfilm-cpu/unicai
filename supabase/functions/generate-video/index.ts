import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const models: Record<string, string> = {
  "MiniMax H3": "minimax:h3@0",
  "MiniMax H3 Fast": "minimax:h3@fast",
  "MiniMax H3 Max": "minimax:h3@max",
  "MiniMax H3 Max Turbo": "minimax:h3@max-turbo",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) throw new Error("Prompt obrigatório.");
    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) throw new Error("RUNWARE_API_KEY is not configured");
    const engine = String(body.engine ?? "MiniMax H3 Fast");
    const task: Record<string, unknown> = {
      taskType: "videoInference",
      taskUUID: crypto.randomUUID(),
      model: models[engine] ?? "minimax:h3@fast",
      positivePrompt: prompt,
      duration: Math.min(Math.max(Number(body.duration ?? 5), 5), 15),
      outputType: "URL",
      outputFormat: "MP4",
    };
    if (body.referenceImage) task.inputs = { frameImages: [{ frame: "first", input: body.referenceImage }] };
    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify([task]),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.[0]?.message || "Erro no Runware");
    const videoUrl = data.data?.[0]?.videoURL;
    if (!videoUrl) throw new Error(data.errors?.[0]?.message || "Nenhum vídeo foi gerado");
    return new Response(JSON.stringify({ videoUrl, model: task.model }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
