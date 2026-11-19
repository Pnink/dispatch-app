"use client";
/**
 * Getting product photos ready in the browser before upload:
 * - shrink to at most 1600px (fast pages, cheap AI calls)
 * - re-encode, which also strips hidden metadata such as the GPS location phones store in photos
 * - read a brand colour from the photo
 */

export type PreparedPhoto = { blob: Blob; url: string; name: string; accent: string };

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // the decoded image stays usable after the URL is released
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

const toBlob = (c: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, type, q));

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!/^image\/(jpeg|png|webp|gif|heic|heif|avif)$/.test(file.type) && !/\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name))
    throw new Error(`${file.name} isn't a photo.`);
  const img = await loadImage(file).catch(() => {
    throw new Error(`Couldn't open ${file.name}. Try a JPG or PNG.`);
  });
  const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const blob = (await toBlob(c, "image/webp", 0.86)) ?? (await toBlob(c, "image/jpeg", 0.88));
  if (!blob) throw new Error(`Couldn't process ${file.name}.`);
  return { blob, url: URL.createObjectURL(blob), name: file.name, accent: accentFrom(ctx, c.width, c.height) };
}

/** The most colourful common tone in the photo, darkened until white text on it is readable (WCAG AA). */
function accentFrom(ctx: CanvasRenderingContext2D, w: number, h: number): string {
  const small = document.createElement("canvas");
  small.width = 48;
  small.height = 48;
  const s = small.getContext("2d")!;
  s.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, 48, 48);
  const px = s.getImageData(0, 0, 48, 48).data;
  const buckets = new Map<string, { n: number; r: number; g: number; b: number; sat: number }>();
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (max > 245 && min > 235) continue; // skip white backgrounds
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0, sat: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    e.sat += sat;
    buckets.set(key, e);
  }
  let best = { score: -1, r: 60, g: 90, b: 80 };
  for (const e of buckets.values()) {
    const score = e.n * (0.3 + e.sat / e.n);
    if (score > best.score) best = { score, r: e.r / e.n, g: e.g / e.n, b: e.b / e.n };
  }
  let [r, g, b] = [best.r, best.g, best.b];
  for (let k = 0; k < 20 && contrastWithWhite(r, g, b) < 4.6; k++) [r, g, b] = [r * 0.88, g * 0.88, b * 0.88];
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function contrastWithWhite(r: number, g: number, b: number) {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return 1.05 / (L + 0.05);
}

export async function uploadPhoto(blob: Blob): Promise<string> {
  const r = await fetch("/api/admin/media", { method: "POST", headers: { "content-type": blob.type || "application/octet-stream" }, body: blob });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Upload failed.");
  return d.id as string;
}
