// Fotos de telemóvel têm 3 a 12 MB. Reduzimos no próprio telemóvel ANTES de enviar: o envio é muito mais rápido, não esbarra
// no limite de 4,5 MB que a Vercel impõe aos pedidos, e a página do produto carrega mais depressa.
const MAX_SIDE = 1600;

export async function compressImage(file: File, maxSide = MAX_SIDE, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("NOT_IMAGE");
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // O navegador não consegue ler a imagem (ex.: HEIC). Só deixamos passar formatos que o servidor aceita.
    if (/^image\/(jpeg|png|webp)$/.test(file.type) && file.size <= 3_000_000) return file;
    throw new Error("DECODE_FAILED");
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 900_000 && file.type === "image/jpeg") { bitmap.close?.(); return file; }
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close?.(); return file; }
  ctx.fillStyle = "#fff"; // PNG com transparência passa a fundo branco ao converter para JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
  const out = new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  return out.size < file.size || file.type !== "image/jpeg" ? out : file;
}
