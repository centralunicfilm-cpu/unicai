// Geração de IA via relay Cloudflare — a chave Runware mora no Worker (segredo),
// nunca no app. Exige o código da equipe (salvo no primeiro uso).

import { savedCloudHost, savedCloudSecret, DEFAULT_CLOUD_HOST } from "./cloudSync";

function relayBase(): string {
  const host = (savedCloudHost() || DEFAULT_CLOUD_HOST).trim();
  return `https://${host}`;
}

export function cloudAIReady(): boolean {
  return savedCloudSecret().length > 0;
}

async function postAI(path: string, body: Record<string, unknown>): Promise<any> {
  const secret = savedCloudSecret();
  if (!secret) throw new Error("NO_CODE");
  const resp = await fetch(`${relayBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, secret }),
  });
  const data = await resp.json().catch(() => ({}));
  if (resp.status === 401) throw new Error("WRONG_CODE");
  if (!resp.ok || (data as any).error) {
    throw new Error((data as any).error || "Falha na geração. Tente de novo.");
  }
  return data;
}

export async function generateImageViaCloud(args: {
  prompt: string;
  style?: string;
  ratio?: string;
  engine?: string;
  referenceImages?: string[];
}): Promise<{ imageUrl: string; model: string }> {
  const data = await postAI("/ai-image", args);
  if (!data.imageUrl) throw new Error("Nenhuma imagem foi gerada.");
  return { imageUrl: data.imageUrl, model: data.model || "" };
}

export async function generateVideoViaCloud(args: {
  prompt: string;
  engine?: string;
  duration?: number;
  referenceImage?: string | null;
}): Promise<{ videoUrl: string; model: string }> {
  const data = await postAI("/ai-video", args);
  if (!data.videoUrl) throw new Error("Nenhum vídeo foi gerado.");
  return { videoUrl: data.videoUrl, model: data.model || "" };
}
