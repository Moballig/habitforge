/** Client-side photo compression before sending to the vision action. */

const ATTEMPTS: Array<{ maxDim: number; quality: number }> = [
  { maxDim: 768, quality: 0.7 },
  { maxDim: 512, quality: 0.5 },
  { maxDim: 384, quality: 0.4 },
];

/** Max base64 chars accepted by `ai.analyzePhoto` per image. */
export const MAX_IMAGE_BASE64 = 400_000;

/**
 * Downscale + re-encode a photo as base64 JPEG (no data: prefix).
 * Tries progressively smaller settings until under the payload cap.
 */
export async function compressImage(file: File | Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    for (const { maxDim, quality } of ATTEMPTS) {
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable in this browser");
      ctx.drawImage(bitmap, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      if (base64.length > 0 && base64.length <= MAX_IMAGE_BASE64) {
        return base64;
      }
    }
    throw new Error("Photo is too large even after compression");
  } finally {
    bitmap.close();
  }
}
