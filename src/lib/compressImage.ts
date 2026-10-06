// Fotos de telemóvel passam facilmente dos 4,5 MB (limite do corpo de um pedido na Vercel) e o backend
// reduz tudo a 800 px de qualquer forma. Reduzimos aqui, antes de enviar: o envio fica rápido e não falha.
const MAX_SIDE = 1600;
const SKIP_BELOW_BYTES = 1_500_000;

export async function prepareImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SKIP_BELOW_BYTES) {
      bitmap.close();
      return file;
    }
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.fillStyle = "#fff"; // PNG com transparência não pode ficar preto em JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "imagem"}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // formato que o browser não descodifica: segue o original e o backend decide
  }
}
