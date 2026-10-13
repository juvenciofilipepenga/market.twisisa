import { api, ApiError } from "./api";

// A foto local fica POR CONTA: antes havia uma chave única e quem entrasse a seguir no mesmo aparelho via a foto do anterior.
const LEGACY_KEY = "twisisa.avatar"; // chave antiga, sem dono: apagada assim que se lê
const localKey = (userId: string) => `twisisa.avatar.${userId}`;

export function getLocalAvatar(userId: string | null | undefined): string | null {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
    return userId ? window.localStorage.getItem(localKey(userId)) : null;
  } catch { return null; }
}
function setLocalAvatar(userId: string, dataUrl: string | null) {
  if (!userId) return;
  try { if (dataUrl) window.localStorage.setItem(localKey(userId), dataUrl); else window.localStorage.removeItem(localKey(userId)); } catch { /* sem armazenamento */ }
}

/** Pede ao Cloudinary já o tamanho certo (2x para ecrãs densos), rosto centrado, formato e qualidade automáticos. */
export function avatarSrc(url: string | null | undefined, size: number): string | null {
  if (!url) return null;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/c_fill,g_face,w_${size * 2},h_${size * 2},f_auto,q_auto/`);
  }
  return url;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export interface SavedAvatar { url: string; where: "cloud" | "device" }

// Fluxo final: o backend assina (POST /uploads/sign), o browser envia a imagem ao Cloudinary, e o URL fica no utilizador
// (PATCH /users/me { avatarUrl }). Enquanto o backend ainda não tem estes endpoints (404/405/501), a foto fica só neste
// aparelho: o cliente vê o resultado e nada quebra. Qualquer outro erro sobe para quem chamou mostrar o aviso.
export async function saveAvatar(blob: Blob, token: string, userId: string): Promise<SavedAvatar> {
  let sig;
  try {
    sig = await api.uploads.sign(token, "avatars");
  } catch (err) {
    if (err instanceof ApiError && [404, 405, 501].includes(err.status)) {
      const url = await blobToDataUrl(blob);
      setLocalAvatar(userId, url);
      return { url, where: "device" };
    }
    throw err;
  }

  const form = new FormData();
  form.append("file", blob, "avatar.webp");
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  if (sig.publicId) form.append("public_id", sig.publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`cloudinary ${res.status}`);
  const data = (await res.json()) as { secure_url: string };
  await api.users.updateMe(token, { avatarUrl: data.secure_url });
  setLocalAvatar(userId, null);
  return { url: data.secure_url, where: "cloud" };
}

export async function removeAvatar(token: string, userId: string): Promise<void> {
  setLocalAvatar(userId, null);
  try {
    await api.users.updateMe(token, { avatarUrl: null });
  } catch (err) {
    // Backend ainda sem o campo: a foto local já foi apagada, não há mais nada a remover.
    if (!(err instanceof ApiError && (err.status === 400 || err.status === 404))) throw err;
  }
}
