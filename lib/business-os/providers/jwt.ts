import { createSign } from "node:crypto";

const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

/** Env vars often carry a PEM with literal "\n"; restore the line breaks. */
export function pemFromEnv(raw: string): string {
  return raw.includes("\\n") ? raw.replaceAll("\\n", "\n") : raw;
}

/** A compact RS256 JWT, signed with Node crypto. Used for Revolut client assertions and Google service accounts. */
export function signRs256(payload: Record<string, unknown>, privateKeyPem: string, header: Record<string, unknown> = {}): string {
  const input = `${part({ alg: "RS256", typ: "JWT", ...header })}.${part(payload)}`;
  const signature = createSign("RSA-SHA256").update(input).end().sign(pemFromEnv(privateKeyPem));
  return `${input}.${signature.toString("base64url")}`;
}
