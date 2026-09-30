import { api, ApiError } from "./api";

const LOCAL_KEY = "twisisa.avatar";

export function getLocalAvatar(): string | null {
  try { return window.localStorage.getItem(LOCAL_KEY); } catch { return null; }
}
function setLocalAvatar(dataUrl: string | null) {
  try { if (dataUrl) window.localStorage.setItem(LOCAL_KEY, dataUrl); else window.localStorage.removeItem(LOCAL_KEY); } catch { /* sem armazenamento */ }
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
export async function saveAvatar(blob: Blob, token: string): Promise<SavedAvatar> {
  let sig;
  try {
    sig = await api.uploads.sign(token, "avatars");
  } catch (err) {
    if (err instanceof ApiError && [404, 405, 501].includes(err.status)) {
      const url = await blobToDataUrl(blob);
      setLocalAvatar(url);
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
  setLocalAvatar(null);
  return { url: data.secure_url, where: "cloud" };
}

export async function removeAvatar(token: string): Promise<void> {
  setLocalAvatar(null);
  try {
    await api.users.updateMe(token, { avatarUrl: null });
  } catch (err) {
    // Backend ainda sem o campo: a foto local já foi apagada, não há mais nada a remover.
    if (!(err instanceof ApiError && (err.status === 400 || err.status === 404))) throw err;
  }
}
