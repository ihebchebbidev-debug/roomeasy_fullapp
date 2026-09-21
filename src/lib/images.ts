const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(?:https?:|data:|blob:)/.test(path)) return path;
  const base = ((import.meta.env['VITE_API_BASE_URL'] as string | undefined)?.trim() || "https://api.roomeasy.fr")
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function prepareAvatar(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image under 8 MB.');

  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const scale = Math.min(1, 768 / side);
  const size = Math.max(1, Math.round(side * scale));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This image could not be processed.');
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  const dataUrl = canvas.toDataURL('image/webp', 0.84);
  if (Math.ceil((dataUrl.length * 3) / 4) > MAX_AVATAR_BYTES) {
    throw new Error('This image is still too large. Choose a smaller photo.');
  }
  return dataUrl;
}