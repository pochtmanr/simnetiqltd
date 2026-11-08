import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM sealing for provider refresh tokens. The key is 32 random bytes,
 * base64, in BUSINESS_OS_TOKEN_KEY. The provider name is bound as associated
 * data, so a token sealed for one provider cannot be replayed as another's.
 * Format: v1.<iv>.<tag>.<ciphertext>, each base64url.
 */

export class TokenKeyError extends Error {
  readonly code = "token_key_invalid";
  constructor() {
    super("token_key_invalid");
  }
}

export function tokenKey(raw: string | undefined | null = process.env.BUSINESS_OS_TOKEN_KEY): Buffer {
  const key = Buffer.from((raw ?? "").trim(), "base64");
  if (key.length !== 32) throw new TokenKeyError();
  return key;
}

export function seal(plain: string, provider: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(provider));
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

/** Throws when the value was tampered with, sealed for another provider, or sealed with another key. */
export function unseal(sealed: string, provider: string, key: Buffer): string {
  const [version, iv, tag, body] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !body) throw new Error("sealed_invalid");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(provider));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}
