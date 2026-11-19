import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_DAYS, checkPassword, createSession, passwordConfigured } from "@/lib/server/auth";
import { body, json, rateLimit, sameOrigin } from "@/lib/server/http";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Bad origin." }, 403);
  if (!passwordConfigured()) return json({ error: "No password is set. The owner app only opens on this computer." }, 400);
  // 5 wrong guesses per 15 minutes per address, then wait
  if (!rateLimit("login", req, 5, 15 * 60_000)) return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  const b = await body<{ password?: string }>(req, 2_000);
  if (!b?.password || !(await checkPassword(b.password))) {
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return json({ error: "Wrong password." }, 401);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return res;
}

/** Lets the owner app know whether to show "Sign out". Reveals nothing else. */
export async function GET() {
  return json({ passwordConfigured: passwordConfigured() });
}
