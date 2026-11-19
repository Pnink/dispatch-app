import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isLocalHost, isLoopbackIp, ownerAccess } from "@/lib/server/auth";

/** Guards the owner app (/dashboard, /create) and the admin API. Storefronts and the public API stay open. */
export async function middleware(req: NextRequest) {
  // "On this computer" means: the Host is local AND every address in the forwarding chain is local.
  // Next.js fills x-forwarded-for with the real socket address; any proxy in front appends the visitor's
  // real address, so proxied traffic always counts as remote and needs the password.
  const host = (req.headers.get("host") || "").trim();
  const hostname = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  const chain = (req.headers.get("x-forwarded-for") || "").split(",").map((x) => x.trim()).filter(Boolean);
  const local = isLocalHost(hostname.toLowerCase()) && chain.every(isLoopbackIp) && !req.headers.has("forwarded");
  const access = await ownerAccess(local, req.cookies.get(SESSION_COOKIE)?.value);
  if (access === "ok") return NextResponse.next();

  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (access === "blocked") {
    const msg = "The owner app is locked: set OWNER_PASSWORD before opening it from another address.";
    return isApi ? NextResponse.json({ error: msg }, { status: 403 }) : new NextResponse(msg, { status: 403, headers: { "content-type": "text/plain" } });
  }
  if (isApi) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const login = new URL("/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/dashboard/:path*", "/create/:path*", "/api/admin/:path*"] };
