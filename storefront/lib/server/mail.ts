/**
 * Customer emails (receipts, tracking). Optional: set RESEND_API_KEY and MAIL_FROM (e.g. "Juniper <orders@yourshop.com>",
 * on a domain you've verified with Resend — resend.com, free for 3,000 emails a month). Without them nothing is sent
 * and the owner app offers a ready-to-copy message instead. MAIL_FAKE=1 is the test double.
 */
import "server-only";

export const mailEnabled = () => process.env.MAIL_FAKE === "1" || (!!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM);

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (process.env.MAIL_FAKE === "1") return true;
  if (!mailEnabled()) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject: subject.slice(0, 200), text: text.slice(0, 20_000) }),
      cache: "no-store",
    });
    if (!r.ok) console.error("Email failed", r.status);
    return r.ok;
  } catch {
    return false;
  }
}
