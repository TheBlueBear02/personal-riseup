export const SITE_ACCESS_COOKIE = "site_access";
export const SITE_ACCESS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const TOKEN_MESSAGE = "site-access";

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** HMAC-SHA256(SITE_PASSWORD, "site-access") as hex. Null if password unset. */
export async function createAccessToken(): Promise<string | null> {
  const password = process.env.SITE_PASSWORD?.trim();
  if (!password) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(TOKEN_MESSAGE),
  );
  return toHex(signature);
}

export async function verifyAccessToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const expected = await createAccessToken();
  if (!expected) return false;
  return timingSafeEqualHex(token, expected);
}

/** Timing-safe password check. Server-only (login action). */
export function passwordsMatch(submitted: string, expected: string): boolean {
  const a = new TextEncoder().encode(submitted);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i]! ^ b[i]!;
  }
  return mismatch === 0;
}

export function siteAccessCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    maxAge: SITE_ACCESS_MAX_AGE,
  };
}
