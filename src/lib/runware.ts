// Acesso direto à Runware (sem Supabase).
// A key fica em VITE_RUNWARE_API_KEY no .env — mesma key que era usada na Edge Function.
export function getRunwareKey(): string | null {
  const key = import.meta.env.VITE_RUNWARE_API_KEY as string | undefined;
  return key && key.trim().length > 0 ? key.trim() : null;
}

function mapImageModel(engine: string): string {
  const e = engine.toLowerCase();
  if (e.includes("gpt") && e.includes("2.5")) return "openai:gpt-image@2.5-flare";
  if (e.includes("muse")) return "meta:muse@image";
  if (e.includes("flux")) return "runware:101@1";
  if (e.includes("banana 2") || e.includes("banana pro")) return "google:4@3";
  if (e.includes("banana")) return "google:4@2";
  return "openai:gpt-image@2";
}

const VIDEO_MODELS: Record<string, string> = {
  "MiniMax H3": "minimax:h3@0",
  "MiniMax H3 Fast": "minimax:h3@fast",
  "MiniMax H3 Max": "minimax:h3@max",
  "MiniMax H3 Max Turbo": "minimax:h3@max-turbo",
};

export async function generateImageDirect(args: {
  prompt: string;
  style?: string;
  ratio?: string;
  engine?: string;
  referenceImages?: string[];
}): Promise<{ imageUrl: string; model: string }> {
  const apiKey = getRunwareKey();
  if (!apiKey) throw new Error("VITE_RUNWARE_API_KEY não configurada no .env");

  const { prompt, style = "Cinematográfico", ratio = "16:9", engine = "Nano Banana" } = args;
  const referenceImages = (args.referenceImages ?? []).filter(Boolean).slice(0, 5);
  if (!prompt.trim()) throw new Error("Prompt obrigatório.");

  const model = mapImageModel(engine);
  const fullPrompt = `Generate a ${style} style image: ${prompt}. Aspect ratio ${ratio}. Professional production quality, cinematic lighting, ultra high resolution.`;

  // Modelos Google (Nano Banana) só aceitam dimensões específicas.
  let width = ratio === "9:16" || ratio === "3:4" ? 768 : 1024;
  let height = ratio === "16:9" || ratio === "4:3" ? 768 : 1024;
  if (model.startsWith("google:")) {
    if (ratio === "16:9") { width = 1376; height = 768; }
    else if (ratio === "9:16") { width = 768; height = 1376; }
    else if (ratio === "4:3") { width = 1200; height = 896; }
    else if (ratio === "3:4") { width = 896; height = 1200; }
    else { width = 1024; height = 1024; }
  }
  const task: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID: crypto.randomUUID(),
    model,
    positivePrompt: fullPrompt,
    width,
    height,
    outputFormat: "PNG",
    numberResults: 1,
  };
  if (referenceImages.length) {
    // Muse espera objeto { referenceImages }; as demais usam a lista [{ image }].
    task.inputs =
      model === "meta:muse@image"
        ? { referenceImages }
        : referenceImages.map((image) => ({ image }));
  }

  const response = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });

  if (response.status === 429) throw new Error("Limite de requisições excedido. Tente novamente em alguns segundos.");
  if (response.status === 402) throw new Error("Créditos insuficientes na Runware.");
  if (!response.ok) throw new Error("Erro no gateway de IA");

  const data = await response.json();
  const imageUrl = data.data?.[0]?.imageURL;
  if (!imageUrl) throw new Error(data.errors?.[0]?.message || "Nenhuma imagem foi gerada");
  return { imageUrl, model };
}

export async function generateVideoDirect(args: {
  prompt: string;
  engine?: string;
  duration?: number;
  referenceImage?: string | null;
}): Promise<{ videoUrl: string; model: string }> {
  const apiKey = getRunwareKey();
  if (!apiKey) throw new Error("VITE_RUNWARE_API_KEY não configurada no .env");

  const { prompt, engine = "MiniMax H3 Fast", duration = 5, referenceImage } = args;
  if (!prompt.trim()) throw new Error("Prompt obrigatório.");

  const task: Record<string, unknown> = {
    taskType: "videoInference",
    taskUUID: crypto.randomUUID(),
    model: VIDEO_MODELS[engine] ?? "minimax:h3@fast",
    positivePrompt: prompt,
    duration: Math.min(Math.max(Number(duration ?? 5), 5), 15),
    outputType: "URL",
    outputFormat: "MP4",
  };
  if (referenceImage) task.inputs = { frameImages: [{ frame: "first", input: referenceImage }] };

  const response = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.errors?.[0]?.message || "Erro no Runware");
  const videoUrl = data.data?.[0]?.videoURL;
  if (!videoUrl) throw new Error(data.errors?.[0]?.message || "Nenhum vídeo foi gerado");
  return { videoUrl, model: task.model as string };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem de referência."));
    reader.readAsDataURL(file);
  });
}

// ---- Histórico local (por usuário, neste Mac) ----
export interface LocalHistoryItem {
  id: string;
  url: string;
  prompt: string;
  engine: string;
  type: "image" | "video";
  createdAt: string;
}

export function loadLocalHistory(userId: string, type: "image" | "video"): LocalHistoryItem[] {
  try {
    const raw = localStorage.getItem(`unicfilm.local.history.${userId}.${type}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveLocalHistoryItem(userId: string, item: LocalHistoryItem) {
  const current = loadLocalHistory(userId, item.type);
  const next = [item, ...current].slice(0, 20);
  localStorage.setItem(`unicfilm.local.history.${userId}.${item.type}`, JSON.stringify(next));
}
