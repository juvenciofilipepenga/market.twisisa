// Fotos de produto vêm do Cloudinary em tamanho original. Pedimos já o formato (AVIF/WebP), a qualidade e a largura
// certas para cada ecrã; URLs de outros sítios passam sem mudanças.
const WIDTHS = [160, 320, 480, 640, 960, 1280];

function isCloudinary(url: string) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/");
}

export function cldUrl(url: string, width: number): string {
  if (!isCloudinary(url)) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

/** Atributos `src`/`srcSet`/`sizes` para um <img>. `maxWidth` é a maior largura CSS que a imagem chega a ocupar. */
export function responsiveImage(url: string, sizes: string, maxWidth: number) {
  if (!isCloudinary(url)) return { src: url };
  const fitting = WIDTHS.filter((w) => w <= maxWidth * 2);
  const widths = fitting.length > 0 ? fitting : [WIDTHS[0] as number];
  return {
    src: cldUrl(url, widths[widths.length - 1] as number),
    srcSet: widths.map((w) => `${cldUrl(url, w)} ${w}w`).join(", "),
    sizes
  };
}
