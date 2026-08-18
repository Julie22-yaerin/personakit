import { lookup } from "dns/promises";
import { isIP } from "net";

/**
 * Server-side fetch of a founder-supplied URL (paste-a-link analytics) is
 * a real SSRF surface — without this guard a founder could point the app
 * at an internal service or cloud metadata endpoint. Each hop (including
 * redirects, which fetch's own `redirect: "follow"` would otherwise
 * resolve invisibly) is DNS-resolved and range-checked before it's
 * fetched. Residual risk: a DNS-rebinding attack between the lookup and
 * the connect is not pinned out — acceptable for this feature's blast
 * radius, but worth knowing if this pattern gets reused somewhere higher-stakes.
 */

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 5;

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast/reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:")) return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.slice(7);
    if (isIP(v4) === 4) return isPrivateIPv4(v4);
  }
  return false;
}

function isBlockedIP(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // unresolvable/unknown format -> block
}

async function assertHostIsPublic(hostname: string): Promise<void> {
  let address: string;
  try {
    address = (await lookup(hostname)).address;
  } catch {
    throw new Error("Couldn't resolve that host.");
  }
  if (isBlockedIP(address)) {
    throw new Error("That URL points to a private or internal address and can't be fetched.");
  }
}

/** Fetches a URL's text body, following redirects manually (re-validated per hop) with a size cap and timeout. */
export async function safeFetchText(rawUrl: string): Promise<string> {
  let current: URL;
  try {
    current = new URL(rawUrl);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    if (current.protocol !== "http:" && current.protocol !== "https:") {
      throw new Error("Only http/https links are supported.");
    }
    await assertHostIsPublic(current.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PersonaBot/1.0; +https://www.thelyceum.site)",
          Accept: "text/html,application/json;q=0.9,*/*;q=0.5",
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") throw new Error("That link took too long to respond.");
      throw new Error("Couldn't reach that link.");
    }
    clearTimeout(timeout);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("That link redirected without a destination.");
      current = new URL(location, current);
      continue;
    }
    if (!res.ok) throw new Error(`That link returned an error (HTTP ${res.status}).`);

    const contentType = res.headers.get("content-type") ?? "";
    if (!/text|html|json/i.test(contentType)) {
      throw new Error("That link isn't a webpage PERSONA can read.");
    }

    const reader = res.body?.getReader();
    if (!reader) return await res.text();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      chunks.push(value);
      if (received > MAX_BYTES) {
        await reader.cancel().catch(() => {});
        break;
      }
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
  }
  throw new Error("Too many redirects.");
}
