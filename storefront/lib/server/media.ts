/**
 * Product photos, saved in DATA_DIR/uploads/<random id>.<ext>.
 * Only real JPEG / PNG / WebP / GIF files are accepted (checked by their first bytes, not the name);
 * SVG and anything else is refused so an "image" can never carry a script.
 */
import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DIR = path.join(path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data")), "uploads");
export const MAX_BYTES = 10 * 1024 * 1024;
const ID = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as const;
type Ext = keyof typeof TYPES;

export function sniff(buf: Buffer): Ext | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a") return "gif";
  return null;
}

export async function saveMedia(buf: Buffer): Promise<string | null> {
  const ext = sniff(buf);
  if (!ext || buf.length > MAX_BYTES) return null;
  await fs.mkdir(DIR, { recursive: true, mode: 0o700 });
  const id = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(DIR, id), buf, { mode: 0o600 });
  return id;
}

export async function readMedia(id: string): Promise<{ buf: Buffer; type: string } | null> {
  if (!ID.test(id)) return null; // also blocks ../ path tricks
  try {
    const buf = await fs.readFile(path.join(DIR, id));
    return { buf, type: TYPES[id.split(".").pop() as Ext] };
  } catch {
    return null;
  }
}

export const isMediaId = (id: unknown): id is string => typeof id === "string" && ID.test(id);
