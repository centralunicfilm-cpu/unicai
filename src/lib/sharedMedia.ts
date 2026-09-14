export const TEAM_CHAT_PREFIX = "__UNICFILM_TEAM__\n";
export const PUBLIC_GALLERY_PREFIX = "__UNICFILM_PUBLIC__\n";

export function teamChatContent(prompt: string) {
  return `${TEAM_CHAT_PREFIX}${prompt.trim()}`;
}

export function publicGalleryContent(prompt: string) {
  return `${PUBLIC_GALLERY_PREFIX}${prompt.trim()}`;
}

export function isTeamChatContent(content: string | null | undefined) {
  return Boolean(content?.startsWith(TEAM_CHAT_PREFIX));
}

export function isPublicGalleryContent(content: string | null | undefined) {
  return Boolean(content?.startsWith(PUBLIC_GALLERY_PREFIX));
}

export function isGalleryEligibleContent(content: string | null | undefined) {
  const value = content || "";
  return value.startsWith(PUBLIC_GALLERY_PREFIX) || value.trimStart().startsWith("🎨 ");
}

export function visibleSharedContent(content: string | null | undefined) {
  return (content || "")
    .replace(TEAM_CHAT_PREFIX, "")
    .replace(PUBLIC_GALLERY_PREFIX, "")
    .trim();
}

export async function downloadOriginalMedia(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Falha ao obter o arquivo original.");
    const originalBlob = await response.blob();
    const objectUrl = URL.createObjectURL(originalBlob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  }
}
