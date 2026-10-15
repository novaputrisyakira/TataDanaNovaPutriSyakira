/**
 * Edge-compatible token and session signing utilities using standard Web Crypto API.
 * This module has ZERO dependencies on Node.js built-ins, making it 100% safe for Next.js Edge Middleware.
 */

export interface SessionData {
  userId: string;
  role: "admin" | "user";
  status: "approved" | "pending" | "rejected";
  verificationStatus?: "approved" | "pending" | "rejected";
  expiresAt: number;
}

export const SESSION_COOKIE_NAME = "tatadana_session";
export const ADMIN_COOKIE_NAME = "tatadana_admin_auth";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const SESSION_SECRET = process.env.SESSION_SECRET || "tatadana-fintech-secure-session-key-2026-v1";

// Universal Base64URL encoding/decoding compatible with Node.js & Edge Runtime
export function bytesToBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToBytes(b64url: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64url, "base64url"));
  }
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export function strToBase64Url(str: string): string {
  const enc = new TextEncoder();
  return bytesToBase64Url(enc.encode(str));
}

export function base64UrlToStr(b64url: string): string {
  const dec = new TextDecoder();
  return dec.decode(base64UrlToBytes(b64url));
}

export async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export async function createSignedSessionToken(data: {
  userId: string;
  role: "admin" | "user";
  status: "approved" | "pending" | "rejected";
  expiresAt: number;
}): Promise<string> {
  const enc = new TextEncoder();
  const payloadB64 = strToBase64Url(JSON.stringify(data));
  const key = await getHmacKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifies a signed session token. Returns parsed payload if signature is authentic and unexpired.
 */
export async function verifySignedSessionToken(token: string): Promise<{
  userId: string;
  role: "admin" | "user";
  status: "approved" | "pending" | "rejected";
  expiresAt: number;
} | null> {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  try {
    const enc = new TextEncoder();
    const key = await getHmacKey();
    const sigArr = base64UrlToBytes(sigB64);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigArr as unknown as BufferSource,
      enc.encode(payloadB64) as unknown as BufferSource
    );
    if (!isValid) return null;

    const payloadJson = base64UrlToStr(payloadB64);
    const data = JSON.parse(payloadJson);
    if (!data || typeof data.expiresAt !== "number" || Date.now() > data.expiresAt) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
