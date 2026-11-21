/** Work out the carrier and a tracking link from a tracking number. */
export function trackingInfo(raw: string, carrier?: string): { number: string; carrier: string; url: string } {
  const number = raw.replace(/\s+/g, "").toUpperCase().slice(0, 40);
  const n = encodeURIComponent(number);
  const pick = (carrier || "").toLowerCase();
  const guess =
    pick ||
    (/^1Z[0-9A-Z]{16}$/.test(number) ? "ups" : /^(94|93|92|95|9[0-9])\d{20,24}$/.test(number) || /^[A-Z]{2}\d{9}US$/.test(number) ? "usps" : /^\d{12}$|^\d{15}$/.test(number) ? "fedex" : /^\d{10}$/.test(number) ? "dhl" : "other");
  const links: Record<string, [string, string]> = {
    ups: ["UPS", `https://www.ups.com/track?tracknum=${n}`],
    usps: ["USPS", `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`],
    fedex: ["FedEx", `https://www.fedex.com/fedextrack/?trknbr=${n}`],
    dhl: ["DHL", `https://www.dhl.com/global-en/home/tracking/tracking-express.html?tracking-id=${n}`],
    // works for almost any carrier worldwide, incl. China/ePacket/YunExpress numbers from suppliers
    other: ["Carrier", `https://t.17track.net/en#nums=${n}`],
  };
  const [name, url] = links[guess] ?? links.other;
  return { number, carrier: name, url };
}

export const validTracking = (raw: string) => /^[A-Za-z0-9 -]{6,40}$/.test(raw.trim());
