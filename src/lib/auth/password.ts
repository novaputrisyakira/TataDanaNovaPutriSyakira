import crypto from "crypto";

/**
 * Hashes a plain-text password using PBKDF2 with SHA-512 and a random salt.
 * Result format: salt:derivedKeyHex
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Verifies a plain-text password against a stored hashed password.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  try {
    const parts = storedHash.split(":");
    if (parts.length === 2) {
      const [salt, key] = parts;
      const keyBuffer = Buffer.from(key, "hex");
      const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512");
      return crypto.timingSafeEqual(keyBuffer, derivedKey);
    }
    // Fallback for simple SHA-256 if applicable
    const sha = crypto.createHash("sha256").update(password).digest("hex");
    return sha === storedHash;
  } catch {
    return false;
  }
}
