/**
 * Owner authentication. Works in middleware (edge) and route handlers (Node): Web Crypto only.
 *
 * Rules:
 * - OWNER_PASSWORD set   -> the owner app and admin API need a signed session cookie (from /login).
 * - OWNER_PASSWORD unset -> allowed only when the app is opened on this computer (localhost),
 *                           directly (not through a proxy). The npm scripts also bind to 127.0.0.1,
 *                           so without a password the app isn't reachable from the network at all.
 */
export const SESSION_COOKIE = "owner_session";
export const SESSION_DAYS = 7;

const enc = new TextEncoder();
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export const passwordConfigured = () => !!process.env.OWNER_PASSWORD;
export const isLocalHost = (hostname: string) => LOCAL_HOSTS.has(hostname);
export const isLoopbackIp = (ip: string) => ip === "::1" || ip === "127.0.0.1" || ip.startsWith("127.") || ip === "::ffff:127.0.0.1";

function b64url(buf: ArrayBuffer) {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function key() {
  const secret = process.env.SESSION_SECRET || `tillery-session:${process.env.OWNER_PASSWORD ?? ""}`;
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(data: string) {
  return b64url(await crypto.subtle.sign("HMAC", await key(), enc.encode(data)));
}

/** Constant-time string comparison (compares HMACs, so lengths never leak). */
async function safeEqual(a: string, b: string) {
  const [x, y] = await Promise.all([sign(`cmp:${a}`), sign(`cmp:${b}`)]);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.min(x.length, y.length); i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(attempt: string) {
  const pw = process.env.OWNER_PASSWORD;
  return !!pw && (await safeEqual(attempt, pw));
}

export async function createSession() {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = `v1.${expires}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySession(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  return safeEqual(parts[2], await sign(`v1.${expires}`));
}

/** Is this request allowed into the owner app / admin API? */
export async function ownerAccess(fromThisComputer: boolean, cookie: string | undefined): Promise<"ok" | "login" | "blocked"> {
  if (passwordConfigured()) return (await verifySession(cookie)) ? "ok" : "login";
  return fromThisComputer ? "ok" : "blocked";
}
