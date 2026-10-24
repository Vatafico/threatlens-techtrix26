import type { ExtractedEntities, ExtractedUrl, IdentityClaim } from '../types';

// Known URL shorteners (common subset). Reserved example domain kept separate.
export const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'rebrand.ly',
  'cutt.ly',
  'shorte.st',
  'rb.gy',
  'tiny.cc',
  's.id',
  'lnkd.in',
  'wa.me',
]);

// Well-known brands that are frequently impersonated. Lowercased canonical names.
export const BRAND_ALIASES: Record<string, string[]> = {
  sbi: ['sbi', 'state bank of india', 'state bank', 'sbi bank'],
  hdfc: ['hdfc', 'hdfc bank'],
  icici: ['icici', 'icici bank'],
  axis: ['axis bank', 'axis'],
  kotak: ['kotak', 'kotak bank'],
  paytm: ['paytm', 'paytm payments'],
  phonepe: ['phonepe', 'phone pe'],
  gpay: ['gpay', 'google pay', 'google pay india'],
  amazon: ['amazon', 'amazon.in', 'amazon shopping'],
  flipkart: ['flipkart', 'flipkart shopping'],
  fedex: ['fedex', 'federal express'],
  dhl: ['dhl', 'dhl express'],
  bluedart: ['bluedart', 'blue dart'],
  delhivery: ['delhivery', 'delhivery courier'],
  ups: ['ups', 'ups courier', 'united parcel service'],
  irctc: ['irctc', 'indian railway', 'indian railways'],
  aadhaar: ['aadhaar', 'aadhar', 'uidai'],
  income_tax: ['income tax', 'income tax department', 'incometaxindia', 'income tax india'],
  rbi: ['rbi', 'reserve bank of india'],
  gst: ['gst', 'goods and services tax', 'gst portal'],
  sbi_life: ['sbi life', 'sbi life insurance'],
  lic: ['lic', 'life insurance corporation'],
  microsoft: ['microsoft', 'microsoft 365', 'office 365', 'outlook', 'outlook.com'],
  google: ['google', 'google account', 'gmail', 'google workspace'],
  apple: ['apple', 'apple id', 'icloud'],
  meta: ['facebook', 'instagram', 'whatsapp', 'whatsapp team', 'meta'],
  netflix: ['netflix'],
  swiggy: ['swiggy'],
  zomato: ['zomato'],
  delhivery_post: ['india post', 'india post payments'],
  paypal: ['paypal', 'paypal.com'],
};

// Canonical brand domains used to check claimed-brand vs extracted-domain mismatch.
export const BRAND_DOMAINS: Record<string, string[]> = {
  sbi: ['sbibank', 'sbi', 'sbi.co.in', 'onlinesbi.sbi'],
  hdfc: ['hdfcbank', 'hdfcbank.com', 'hdfcbank.co.in', 'hdfc'],
  icici: ['icicibank', 'icicibank.com', 'icici'],
  axis: ['axisbank', 'axisbank.com', 'axis'],
  kotak: ['kotak', 'kotak.com', 'kotakbank', 'kotak811'],
  paytm: ['paytm', 'paytmbank', 'paytm.com'],
  phonepe: ['phonepe', 'phonepe.com'],
  gpay: ['pay.google.com', 'google', 'google.com'],
  amazon: ['amazon', 'amazon.in', 'amazon.com'],
  flipkart: ['flipkart', 'flipkart.com'],
  fedex: ['fedex', 'fedex.com'],
  dhl: ['dhl', 'dhl.com'],
  bluedart: ['bluedart', 'bluedart.com'],
  delhivery: ['delhivery', 'delhivery.com'],
  ups: ['ups', 'ups.com'],
  irctc: ['irctc', 'irctc.co.in', 'irctc.com'],
  aadhaar: ['uidai', 'uidai.gov.in', 'aadhaar'],
  income_tax: ['incometaxindia', 'incometaxindia.gov.in', 'incometax'],
  rbi: ['rbi', 'rbi.org.in'],
  gst: ['gst', 'gst.gov.in', 'gst.gov'],
  lic: ['lic', 'licindia', 'licindia.in'],
  microsoft: ['microsoft', 'microsoft.com', 'office.com', 'outlook', 'outlook.com', 'live.com'],
  google: ['google', 'google.com', 'gmail', 'gmail.com'],
  apple: ['apple', 'apple.com', 'icloud', 'icloud.com'],
  meta: ['facebook', 'facebook.com', 'instagram', 'instagram.com', 'whatsapp', 'whatsapp.com', 'meta', 'meta.com'],
  netflix: ['netflix', 'netflix.com'],
  paypal: ['paypal', 'paypal.com'],
};

function isIpHost(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || /^[0-9a-f:]+$/i.test(host);
}

function makeUrl(raw: ExtractedUrl): ExtractedUrl {
  let parsed: URL | undefined;
  let host: string | undefined;
  try {
    // Add a scheme only for parsing bare domains; the original text remains inert.
    const candidate = /^\/\//.test(raw.raw)
      ? `https:${raw.raw}`
      : /^(?:https?:)?\/\//i.test(raw.raw)
        ? raw.raw
        : `http://${raw.raw}`;
    parsed = new URL(candidate);
    host = parsed.hostname.toLowerCase();
  } catch {
    // Not a valid absolute URL/domain; leave undefined.
  }
  return {
    ...raw,
    parsed,
    host,
    isIpHost: host ? isIpHost(host) : false,
    isPunycode: host ? host.includes('xn--') : false,
    hasUserinfo: parsed ? parsed.username.length > 0 || parsed.password.length > 0 : false,
    port: parsed && parsed.port ? parsed.port : undefined,
    isShortener: host ? URL_SHORTENERS.has(host) : false,
  };
}

// Accept explicit URLs, www links, and bare domains with alphabetic or punycode
// TLDs. Requiring a letter-based TLD prevents currency like "Rs.250" being
// misidentified as a domain.
const URL_REGEX = /(?:https?:\/\/|\/\/|www\.)[^\s<>"']+|(?:\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,}|xn--[a-z0-9-]{2,})(?::\d{1,5})?(?:\/[^\s<>"']*)?)/gi;

export function extractUrls(text: string): ExtractedUrl[] {
  const matches = text.matchAll(URL_REGEX);
  const out: ExtractedUrl[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    const raw = m[0].replace(/[.,!?;:)\]}]+$/, '');
    if (raw.length < 4) continue;

    // Defensive guard for currency-like fragments. The TLD rule above should
    // already reject these, but keeping this check prevents a future regex
    // change from turning amounts such as "Rs.250" into extracted links.
    const currencyLike = /^(?:rs\.?\s*\d+(?:[,.]\d+)*|inr\s*\d+(?:[,.]\d+)*|₹\s*\d+(?:[,.]\d+)*)$/i.test(raw);
    const precedingText = text.slice(Math.max(0, (m.index ?? 0) - 8), m.index ?? 0);
    const amountAfterCurrency = /(?:\brs\.?\s*|\binr\s*|₹\s*)$/i.test(precedingText) && /^\d+(?:[,.]\d+)*$/.test(raw);
    if (currencyLike || amountAfterCurrency) continue;

    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(makeUrl({ raw }));
  }
  return out;
}

function extractDomains(urls: ExtractedUrl[]): string[] {
  const domains: string[] = [];
  const seen = new Set<string>();
  for (const u of urls) {
    if (!u.host) {
      // try to derive a domain from the raw text by taking first dot-segment
      const m = u.raw.match(/([a-z0-9\-]+\.[a-z.]{2,})/i);
      if (m && !seen.has(m[1].toLowerCase())) {
        seen.add(m[1].toLowerCase());
        domains.push(m[1].toLowerCase());
      }
      continue;
    }
    // registrable domain: last two labels (naive but fine for evidence)
    const parts = u.host.split('.');
    const reg = parts.slice(-2).join('.');
    if (reg && !seen.has(reg)) {
      seen.add(reg);
      domains.push(reg);
    }
  }
  return domains;
}

function extractIdentities(text: string): IdentityClaim[] {
  const lower = text.toLowerCase();
  const out: IdentityClaim[] = [];
  const seen = new Set<string>();
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    for (const alias of aliases) {
      const pattern = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // word-ish boundary for multiword aliases; simple for single tokens
      const re = new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, 'i');
      if (re.test(lower)) {
        const key = `${canonical}:${alias}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ raw: alias, brand: canonical, match: alias });
        break;
      }
    }
  }
  return out;
}

export function extractEntities(text: string): ExtractedEntities {
  const urls = extractUrls(text);
  const domains = extractDomains(urls);
  const identities = extractIdentities(text);
  return { urls, domains, identities };
}
