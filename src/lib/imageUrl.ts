/**
 * Asks known photo hosts for a right-sized, compressed copy instead of the
 * full original. Unknown hosts get the original URL back untouched.
 */
export function sizedImage(url: string | undefined, width: number): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "70");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    }
    if (parsed.hostname === "picsum.photos") {
      // /seed/<id>/<w>/<h> or /<w>/<h> — keep the aspect ratio.
      const match = parsed.pathname.match(/^(.*)\/(\d+)\/(\d+)$/);
      if (match) {
        const [, prefix, w, h] = match;
        const height = Math.round((width * Number(h)) / Number(w));
        parsed.pathname = `${prefix}/${width}/${height}`;
        return parsed.toString();
      }
    }
  } catch {
    // Relative or malformed URL — fall through.
  }
  return url;
}

/** srcSet for hosts that support resizing; empty when they don't. */
export function sizedSrcSet(url: string | undefined, widths: number[]): string | undefined {
  if (!url) return undefined;
  const first = sizedImage(url, widths[0] ?? 640);
  if (first === url) return undefined;
  return widths.map((w) => `${sizedImage(url, w)} ${w}w`).join(", ");
}
