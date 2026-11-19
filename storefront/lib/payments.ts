/**
 * Mocked payment processor. No network. Mirrors common test-card rules:
 *   4242 4242 4242 4242  -> success
 *   4000 0000 0000 0002  -> declined
 *   4000 0000 0000 9995  -> insufficient funds
 * Wallet methods ("apple" / "google" / "paypal") always succeed.
 */
export type CardInput =
  | { method: "card"; number: string; expiry: string; cvc: string }
  | { method: "apple" | "google" | "paypal" };

export type ChargeResult = { ok: true; label: string } | { ok: false; error: string };

export function luhn(num: string) {
  const d = num.replace(/\D/g, "");
  if (d.length < 12) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function brand(num: string) {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "Card";
}

export async function chargeCard(card: CardInput, amountCents: number): Promise<ChargeResult> {
  await new Promise((r) => setTimeout(r, 900));
  if (amountCents <= 0) return { ok: false, error: "Nothing to charge." };
  if (card.method !== "card") {
    const names = { apple: "Apple Pay", google: "Google Pay", paypal: "PayPal" } as const;
    return { ok: true, label: names[card.method] };
  }
  const d = card.number.replace(/\D/g, "");
  if (!luhn(d)) return { ok: false, error: "That card number doesn't look right." };
  if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.expiry)) return { ok: false, error: "Enter the expiry as MM/YY." };
  const [mm, yy] = card.expiry.split("/").map((x) => Number(x.trim()));
  const exp = new Date(2000 + yy, mm, 1);
  if (mm < 1 || mm > 12 || exp < new Date()) return { ok: false, error: "This card has expired." };
  if (!/^\d{3,4}$/.test(card.cvc)) return { ok: false, error: "Enter the 3 or 4 digit security code." };
  if (d === "4000000000000002") return { ok: false, error: "Your card was declined. Try another card." };
  if (d === "4000000000009995") return { ok: false, error: "Your card has insufficient funds." };
  return { ok: true, label: `${brand(d)} •••• ${d.slice(-4)}` };
}
