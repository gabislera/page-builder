/**
 * Otimização de imagens no navegador, antes do envio: reduz para no máximo
 * MAX_SIDE no maior lado e converte para WebP. Respeita a orientação da
 * câmera (EXIF), descarta os metadados (incluindo localização) e mantém a
 * transparência. SVG e GIF (pode ser animado) passam sem mudança.
 */

const MAX_SIDE = 2400;
const QUALITY = 0.82;
const OPTIMIZABLE = /^image\/(jpeg|png|webp|avif)$/;

export type OptimizeResult = {
  file: File;
  /** Tamanho antes, em bytes. */
  before: number;
  /** true se a imagem enviada é a versão otimizada. */
  optimized: boolean;
  width?: number;
  height?: number;
};

async function encode(bitmap: ImageBitmap, width: number, height: number): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.convertToBlob({ type: "image/webp", quality: QUALITY });
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
}

export async function optimizeImage(file: File): Promise<OptimizeResult> {
  const keep: OptimizeResult = { file, before: file.size, optimized: false };
  if (!OPTIMIZABLE.test(file.type) || typeof createImageBitmap === "undefined") return keep;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return keep; // formato que o navegador não decodifica
  }
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const blob = await encode(bitmap, width, height);
    // navegador sem WebP devolve PNG: nesse caso não vale a troca
    if (!blob || blob.type !== "image/webp") return keep;
    if (blob.size >= file.size && scale === 1) return { ...keep, width, height };
    const name = `${file.name.replace(/\.[^.]+$/, "") || "imagem"}.webp`;
    return {
      file: new File([blob], name, { type: "image/webp" }),
      before: file.size,
      optimized: true,
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}

/** "4,2 MB", "310 KB". */
export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("pt-BR")} KB`;
}
