# HMAC request signing

Algorithm: HMAC-SHA256. Signature encoding: lowercase hex, 64 characters. Uppercase hex is rejected with `bad_signature_encoding`. TLS is still required.

## Headers

| Header | Value |
|---|---|
| `X-BOS-Key-Id` | Key id bound to one `project_id` and one `environment` |
| `X-BOS-Timestamp` | Unix seconds, exactly 10 digits |
| `X-BOS-Nonce` | 16 to 128 characters from `A-Z a-z 0-9 _ -` |
| `X-BOS-Signature` | Lowercase hex HMAC |

Header names are matched case-insensitively. The signed timestamp string is the exact header value.

## Canonical string

UTF-8, four LF separators, no trailing newline, no CR:

```text
METHOD
request-target
timestamp
nonce
lowercase-hex-sha256-of-raw-body
```

`METHOD` is uppercase. `request-target` is the path plus query, without scheme or host. The path starts with `/api/business-os/v1`.

Query canonicalization, applied by the client before it sends the request:

1. Take decoded key/value pairs.
2. Sort by key, then by value, using ASCII/UTF-16 code unit order.
3. Percent-encode with uppercase hex. Encode every byte that is not `A-Z a-z 0-9 - . _ ~`.
4. Join with `&`.

The server verifies the raw request-target it received. It does not re-sort. A client that signs a different byte sequence will fail.

GET version 1 signs an empty body. SHA-256 of zero bytes is `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. A non-empty GET body is `400 unexpected_body` after the signature is checked, so a proxy cannot strip a signed body unnoticed.

The HMAC key is the raw secret bytes. The test vectors use the UTF-8 bytes of `test-secret-do-not-use-in-production`. That string is a fixture, not a deployed credential.

## Freshness, replay, rotation

Accept a timestamp when `abs(server_now - timestamp) <= 300` seconds, inclusive. `301` is `timestamp_out_of_range`.

After the key is active and the timestamp is fresh, store `(key_id, nonce)` for 600 seconds even if the signature is wrong. A second presentation is `nonce_replayed`. Clients retry with a new nonce every time, including after a timeout.

Unknown key id is `authentication_failed`. `status` other than `active` is `key_revoked`. Revoking one key does not revoke its replacement and does not affect checkout. More than one key may be active during rotation.

After a valid signature, the key's project and environment must match the deployment that received the call. Mismatches are `project_mismatch` and `environment_mismatch`. Simnetiq also rejects a signed body whose `project_id` or `environment` does not match the credential it used.

Compare signatures with a constant-time equality check.

## Vector

`hmac/vectors.json` stores the canonical UTF-8 string and the expected lowercase hex signature for each case. `get-health-empty-body` and `retry-fresh-nonce` differ only by nonce, and their signatures differ. `nonempty-body-changes-signature` hashes `{}` and must not reuse the empty-body digest.
