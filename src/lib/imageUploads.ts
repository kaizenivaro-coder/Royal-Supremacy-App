export const MAX_LOCAL_IMAGE_BYTES = 2 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export type LocalImageUploadMeta = {
  type: string;
  size: number;
};

export function validateLocalImageUpload(file: LocalImageUploadMeta) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return "Upload a PNG, JPG, WebP, or GIF image.";
  }

  if (file.size > MAX_LOCAL_IMAGE_BYTES) {
    return "Use an image smaller than 2 MB for this local MVP.";
  }

  return undefined;
}
