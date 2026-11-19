# Keeping your shop safe

This app holds your orders and your customers' names, addresses and emails. Here is what already protects it, what to do before it goes online, and what to keep doing afterwards.

## Already built in (tested in `e2e/security.cjs`)

| Threat | What stops it |
| --- | --- |
| Someone opens your dashboard | **No password set:** the owner app only opens from this computer, and the npm scripts listen on `127.0.0.1` only. **`OWNER_PASSWORD` set:** sign-in is required for `/dashboard`, `/create` and `/api/admin`. |
| Password guessing | 5 wrong tries per 15 minutes per address, then a lockout. Each failure is slowed down, and comparisons are constant-time. |
| Stolen or forged sessions | Sessions are HMAC-signed cookies that expire after 7 days. They are `HttpOnly` (page scripts can't read them) and `SameSite=Strict`. Changing the password signs everyone out. |
| Another website acting as you (CSRF) | Every write checks the `Origin` header and the cookie is `SameSite=Strict`. |
| A shopper changing a price, total or discount | The server ignores prices sent by the browser. It recomputes everything (prices, stock, discount codes, A/B variants) from its own data. |
| Snooping on private data from the storefront | Shoppers' browsers only receive the public view. Orders, customers, the email list, loyalty balances, discount codes, email drafts and test results are never sent. |
| Junk or oversized requests | Every public input is validated (types, lengths, quantities 1–99, ratings 1–5, emails). Bodies are size-capped and public writes are rate-limited. |
| Clickjacking, injected scripts, sniffing | Strict Content-Security-Policy (no outside scripts, no framing), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS. The framework isn't advertised. |
| Spreadsheet formula injection | Customer-entered text in CSV exports is neutralised. |
| Lost work or a corrupt file | Atomic saves (write, then rename). Saves are queued, so they never interleave, and a stale save gets a conflict instead of overwriting newer data. A timestamped backup is written every 10 minutes, and the newest 50 are kept. |
| Leaked AI keys | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` live only in `.env.local` on the server. The AI route is owner-only, rate-limited (30 calls a minute) and never returns the keys. Set a monthly spend limit in each provider's console. |
| Card data theft | In the real version, card numbers go straight to Stripe's hosted page and never touch this server. (The demo checkout still posts test numbers to it — see below.) |

## Before you put it online

1. **Set a password.** Copy `.env.example` to `.env.local` and set `OWNER_PASSWORD` to a long passphrase (4+ random words). `npm run start:public` refuses to start without one. Optionally set a random `SESSION_SECRET`.
2. **HTTPS only.** Your host or reverse proxy must serve `https://`. The session cookie becomes `Secure` automatically over https.
3. **Real payments through Stripe Checkout** (hosted page). Remove the demo card form at the same time, so the server never sees card numbers.
4. **Back up off the machine.** Copy `data/` (or a Settings → Full backup file) somewhere else on a schedule. A backup on the same disk doesn't survive a dead disk.
5. **Lock down the server** if you self-host. Firewall everything except 443. Run the app as a normal user, not root. The `data/` folder is created owner-only (`700`).

## Accounts to lock down (this is where most real break-ins happen)

Turn on 2-factor authentication (an authenticator app, not SMS) and use unique passwords from a password manager for:

- your Stripe account (it controls payouts to your bank)
- your domain registrar (whoever controls the domain controls the shop)
- your hosting account
- your email (password resets for everything else go there)
- GitHub (the code)

## Keep doing

- Run `npm audit` and update dependencies (`npm update`) every month or so.
- Watch for orders or sign-ins you don't recognise.
- Never paste API keys or passwords into chat, code or commits. They belong in `.env.local`, which git ignores.

## Not covered yet (be honest with yourself)

- **One owner account.** There are no staff roles, no 2-factor login to the app itself, and no audit log.
- **Rate limits live in memory** and reset on restart. That's fine for one server, but not across several.
- **The demo checkout posts test card numbers to the server.** Stripe Checkout replaces this, and that change is required before taking real cards.
- **No automated security scanning.** Consider a professional review before handling real volume.
