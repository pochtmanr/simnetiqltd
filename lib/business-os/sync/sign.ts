import { randomBytes } from "node:crypto";
import { canonicalString, requestTarget, signHex } from "@/contracts/business-os/v1/hmac-sign.mjs";

export const API_PREFIX = "/api/business-os/v1/";

export function freshNonce(): string {
  return randomBytes(24).toString("base64url");
}

export function unixTimestamp(now = Date.now()): string {
  const timestamp = String(Math.floor(now / 1000));
  if (!/^[0-9]{10}$/.test(timestamp)) throw new Error("timestamp_out_of_range");
  return timestamp;
}

export function signGet(input: {
  secret: string;
  keyId: string;
  path: string;
  query: [string, string][];
  now?: number;
  nonce?: string;
}): { urlPath: string; headers: Record<string, string>; nonce: string } {
  if (!input.path.startsWith(API_PREFIX)) throw new Error("path_not_allowlisted");
  const nonce = input.nonce ?? freshNonce();
  const timestamp = unixTimestamp(input.now);
  const urlPath = requestTarget(input.path, input.query);
  const canonical = canonicalString({
    method: "GET",
    requestTarget: urlPath,
    timestamp,
    nonce,
    body: Buffer.alloc(0),
  });
  return {
    urlPath,
    nonce,
    headers: {
      "X-BOS-Key-Id": input.keyId,
      "X-BOS-Timestamp": timestamp,
      "X-BOS-Nonce": nonce,
      "X-BOS-Signature": signHex(input.secret, canonical),
    },
  };
}
