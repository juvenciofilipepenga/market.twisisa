// Guarda um ficheiro (Blob) no dispositivo. Ponto único: a factura usa isto e qualquer
// descarga futura também. O <a> tem de estar no documento para o clique funcionar em todos
// os navegadores, e o URL só se liberta depois de o navegador ter tempo de iniciar a descarga
// (libertar logo a seguir ao clique cancela-a nalguns navegadores).
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
