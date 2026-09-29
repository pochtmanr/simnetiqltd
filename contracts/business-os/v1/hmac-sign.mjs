import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const TEST_SECRET = "test-secret-do-not-use-in-production";
const SKEW_SECONDS = 300;
const NONCE_RETENTION_SECONDS = 600;

export function sha256Hex(body) {
  return createHash("sha256").update(body ?? Buffer.alloc(0)).digest("hex");
}

export function canonicalQuery(pairs) {
  const encode = (value) =>
    encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return [...pairs]
    .sort((left, right) => (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : left[1] < right[1] ? -1 : left[1] > right[1] ? 1 : 0))
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join("&");
}

export function requestTarget(path, pairs = []) {
  const query = canonicalQuery(pairs);
  return query ? `${path}?${query}` : path;
}

export function canonicalString({ method, requestTarget: target, timestamp, nonce, body }) {
  return [String(method).toUpperCase(), target, String(timestamp), String(nonce), sha256Hex(body)].join("\n");
}

export function signHex(secret, canonical) {
  return createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
}

export function assessTimestamp(now, timestamp, skewSeconds = SKEW_SECONDS) {
  if (!/^[0-9]{10}$/.test(String(timestamp))) return "timestamp_out_of_range";
  return Math.abs(now - Number(timestamp)) <= skewSeconds ? "fresh" : "timestamp_out_of_range";
}

export function createVerifier({ keys, now, skewSeconds = SKEW_SECONDS, nonceRetentionSeconds = NONCE_RETENTION_SECONDS }) {
  const keyById = new Map(keys.map((key) => [key.keyId, key]));
  const spent = new Map();

  return {
    verify(request) {
      const { keyId, timestamp, nonce, signature, method, path, query, body, projectId, environment } = request;
      if (!keyId || !timestamp || !nonce || !signature) return "missing_auth_headers";
      if (!/^[0-9a-f]{64}$/.test(signature)) return "bad_signature_encoding";
      if (!/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) return "missing_auth_headers";
      if (assessTimestamp(now(), timestamp, skewSeconds) !== "fresh") return "timestamp_out_of_range";
      const key = keyById.get(keyId);
      if (!key) return "authentication_failed";
      if (key.status !== "active") return "key_revoked";

      const current = now();
      for (const [id, seenAt] of spent) {
        if (current - seenAt > nonceRetentionSeconds) spent.delete(id);
      }
      const nonceId = `${keyId}\n${nonce}`;
      if (spent.has(nonceId)) return "nonce_replayed";
      spent.set(nonceId, current);

      const canonical = canonicalString({
        method,
        requestTarget: requestTarget(path, query ?? []),
        timestamp,
        nonce,
        body: body ?? Buffer.alloc(0),
      });
      const expected = Buffer.from(signHex(key.secret, canonical), "utf8");
      const actual = Buffer.from(signature, "utf8");
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return "invalid_signature";
      if (key.projectId !== projectId) return "project_mismatch";
      if (key.environment !== environment) return "environment_mismatch";
      return "ok";
    },
  };
}
