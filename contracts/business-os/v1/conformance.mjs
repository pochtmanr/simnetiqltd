import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { canonicalize, contentHash } from "./canonical.mjs";
import {
  assessTimestamp,
  canonicalString,
  createVerifier,
  requestTarget,
  signHex,
  TEST_SECRET,
} from "./hmac-sign.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const SCHEMA_BASE = "https://simnetiq.store/contracts/business-os/v1/schemas";
const ENDPOINTS = [
  "/capabilities",
  "/overview",
  "/finance/summary",
  "/finance/daily",
  "/finance/records",
  "/finance/balances",
  "/finance/reconciliation",
  "/subscriptions/summary",
  "/operations/daily",
  "/analytics/report",
  "/health",
];
const METRIC_NAMES = [
  "gross_customer_sales",
  "refunded_principal",
  "sales_tax",
  "store_and_processor_fees",
  "net_sales",
  "net_proceeds",
  "direct_costs",
  "contribution_profit",
  "operating_expenses",
  "operating_profit",
  "net_profit",
];
const STOCK_NAMES = new Set([
  "coins_outstanding",
  "paid_access_accounts",
  "active_contracts",
  "active_customers",
]);
const SMS_ONLY = new Set([
  "coins_bought",
  "coins_spent",
  "coins_refunded",
  "sms_delivered",
  "sms_attempted",
  "coins_outstanding",
]);
const DOPPLER_ONLY = new Set([
  "new_contracts",
  "renewal_failures",
  "chargeback_events",
  "paid_access_accounts",
  "active_contracts",
  "active_customers",
]);
const PROHIBITED_KEYS = new Set([
  "email",
  "phone",
  "msisdn",
  "sms_body",
  "password",
  "private_key",
  "authorization",
  "api_key",
  "secret",
  "customer_email",
]);
const REQUIRED_CASES = [
  "money-gbp-actual",
  "money-null-unavailable",
  "crypto-btc",
  "capabilities-doppler",
  "capabilities-smscode",
  "overview-partial-coverage",
  "finance-summary-missing-fx-tax",
  "finance-daily-partial-bucket",
  "finance-records-sale-refund-reversal",
  "finance-records-fee-alias",
  "finance-records-void-correction",
  "finance-records-sms-legacy-refund",
  "finance-records-duplicate-aliases",
  "finance-balances",
  "finance-reconciliation-legacy",
  "subscriptions-doppler",
  "subscriptions-smscode-unsupported",
  "operations-smscode",
  "operations-doppler",
  "analytics-ga4-period-uniques",
  "analytics-ga4-daily-page",
  "analytics-gsc-dimension-rows",
  "analytics-gsc-daily",
  "analytics-vercel-unavailable",
  "analytics-unsupported-dataset",
  "health-degraded",
  "cursor-payload",
  "snapshot-bundle",
  "error-unsupported-basis",
  "error-cursor-expired",
  "error-rate-limited",
  "reject-money-float",
  "reject-money-unavailable-zero",
  "reject-money-null-without-reason",
  "reject-money-negative",
  "reject-money-crypto-as-fiat",
  "reject-money-excess-scale",
  "reject-missing-provenance",
  "reject-unsupported-basis",
  "reject-inconsistent-identity",
  "reject-duplicate-primary-sales",
  "reject-duplicate-fee-components",
  "reject-sms-legacy-as-gross",
  "reject-transfer-as-revenue",
  "reject-daily-balance",
  "reject-balance-additive",
  "reject-uniques-summed",
  "reject-gsc-rows-as-total",
  "reject-unavailable-zeros",
  "reject-smscode-zero-mrr",
  "reject-fabricated-tax-zero",
];
const REQUIRED_VECTORS = [
  "get-health-empty-body",
  "get-overview-canonical-query",
  "nonempty-body-changes-signature",
  "retry-fresh-nonce",
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function walk(value, visit) {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visit));
    return;
  }
  if (value && typeof value === "object") {
    visit(value);
    for (const child of Object.values(value)) walk(child, visit);
  }
}

function prohibitedKeys(value, path = "$") {
  const found = [];
  if (Array.isArray(value)) {
    value.forEach((item, i) => found.push(...prohibitedKeys(item, `${path}[${i}]`)));
    return found;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (PROHIBITED_KEYS.has(key.toLowerCase())) found.push(`${path}.${key}`);
      found.push(...prohibitedKeys(child, `${path}.${key}`));
    }
  }
  return found;
}

function scaleOf(amount) {
  const fraction = amount.split(".")[1];
  return fraction ? fraction.length : 0;
}

function decimalsEqual(left, right) {
  const scale = Math.max(scaleOf(left), scaleOf(right));
  const toInt = (value) => {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole + fraction.padEnd(scale, "0"));
  };
  return toInt(left) === toInt(right);
}

function loadSchemas() {
  const dir = join(root, "schemas");
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    // Conditional required/pattern keywords live on if/then branches whose properties
    // are declared on the parent object. Ajv's extra lints reject that valid draft 2020-12 shape.
    strictRequired: false,
    strictTypes: false,
    allowUnionTypes: true,
    validateSchema: true,
  });
  addFormats(ajv);
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".json"))) {
    ajv.addSchema(readJson(join(dir, name)));
  }
  return ajv;
}

function moneyProblems(value, exponents) {
  const problems = [];
  walk(value, (node) => {
    if (!("amount" in node) || !("quality" in node)) return;
    if (typeof node.amount !== "string") return;
    if (typeof node.currency === "string") {
      if (!Object.prototype.hasOwnProperty.call(exponents, node.currency)) {
        problems.push("unknown_currency_exponent");
        return;
      }
      if (scaleOf(node.amount) > exponents[node.currency]) {
        problems.push("excess_scale");
      }
    }
    if (typeof node.asset === "string" && Object.prototype.hasOwnProperty.call(exponents, node.asset)) {
      problems.push(`fiat_code_used_as_asset:${node.asset}`);
    }
    if (typeof node.asset === "string" && scaleOf(node.amount) > 18) {
      problems.push("crypto_scale");
    }
  });
  return problems;
}

function ratioProblems(value) {
  const problems = [];
  walk(value, (node) => {
    if (typeof node.ctr === "string") {
      const ctr = Number(node.ctr);
      if (!(ctr >= 0 && ctr <= 1)) problems.push("ctr_out_of_range");
    }
    if (typeof node.position === "string" && !(Number(node.position) > 0)) {
      problems.push("position_not_positive");
    }
  });
  return problems;
}

function recordSetProblems(records) {
  const problems = [];
  const seen = new Map();
  const postings = new Map();
  const economic = new Map();
  for (const record of records) {
    const identity = `${record.project_id}|${record.environment}|${record.record_id}|${record.revision}`;
    if (seen.has(identity)) problems.push("inconsistent_identity");
    seen.set(identity, record);
    if (contentHash(record) !== record.content_hash) {
      problems.push(`content_hash_mismatch:${record.record_id}:${contentHash(record)}`);
    }
    if (record.quality !== record.original_amount?.quality) problems.push("quality_mismatch");
    if (record.revision > 1 && record.supersedes_revision !== record.revision - 1) {
      problems.push("revision_gap");
    }
    const role = record.posting_role ?? "primary";
    if (role !== "alias") {
      const economicKey = `${record.economic_transaction_id}|${record.record_type}`;
      const previous = economic.get(economicKey);
      if (previous && previous.record_id !== record.record_id) problems.push("duplicate_economic_primary");
      economic.set(economicKey, record);
    }
    collectPosting(postings, record.component_id, role, record.original_amount, problems);
    for (const component of record.components ?? []) {
      collectPosting(postings, component.component_id, component.posting_role, component.amount, problems);
    }
  }
  for (const group of postings.values()) {
    const primaries = group.filter((item) => item.role === "primary");
    if (primaries.length !== 1) problems.push("component_posting");
    const primary = primaries[0];
    if (!primary) continue;
    for (const alias of group.filter((item) => item.role === "alias")) {
      if (alias.amount.currency !== primary.amount.currency || alias.amount.asset !== primary.amount.asset) {
        problems.push("component_currency_mismatch");
      } else if (
        typeof alias.amount.amount === "string" &&
        typeof primary.amount.amount === "string" &&
        !decimalsEqual(alias.amount.amount, primary.amount.amount)
      ) {
        problems.push("component_amount_mismatch");
      }
    }
  }
  return problems;
}

function collectPosting(postings, componentId, role, amount, problems) {
  if (!componentId) return;
  if (role !== "primary" && role !== "alias") problems.push("component_posting");
  const group = postings.get(componentId) ?? [];
  group.push({ role, amount });
  postings.set(componentId, group);
}

function operationsProblems(document) {
  const problems = [];
  const allowed = document.project_id === "smscode" ? SMS_ONLY : DOPPLER_ONLY;
  for (const bucket of document.buckets ?? []) {
    for (const flow of bucket.flows ?? []) {
      if (STOCK_NAMES.has(flow.name)) problems.push("stock_in_flows");
      if (!allowed.has(flow.name)) problems.push("project_operation_mismatch");
    }
    for (const stock of bucket.stocks ?? []) {
      if (!STOCK_NAMES.has(stock.name)) problems.push("unknown_stock");
      if (!allowed.has(stock.name)) problems.push("project_operation_mismatch");
    }
  }
  return problems;
}

function dailyProblems(document) {
  const problems = [];
  for (const bucket of document.buckets ?? []) {
    const from = Date.parse(bucket.bounds.from);
    const to = Date.parse(bucket.bounds.to);
    if (!(from < to)) problems.push("bucket_bounds");
    if (bucket.partial) {
      const coveredFrom = Date.parse(bucket.covered_from);
      const coveredTo = Date.parse(bucket.covered_to);
      if (!(coveredFrom >= from && coveredTo <= to && coveredTo - coveredFrom < to - from)) {
        problems.push("partial_bucket_not_subset");
      }
    }
  }
  return problems;
}

function summaryProblems(document) {
  const problems = [];
  const missing = new Set(document.coverage?.missing ?? []);
  if (missing.has("sales_tax") && document.metrics?.sales_tax?.amount !== null) {
    problems.push("fabricated_tax");
  }
  if (missing.has("processor_fees") && document.metrics?.store_and_processor_fees?.amount !== null) {
    problems.push("fabricated_fee");
  }
  for (const subtotal of document.native_currency_subtotals ?? []) {
    for (const metric of Object.values(subtotal.metrics ?? {})) {
      if (metric.currency !== subtotal.currency) problems.push("subtotal_currency_mismatch");
    }
  }
  return problems;
}

function periodProblems(value) {
  const problems = [];
  walk(value, (node) => {
    if (typeof node.from !== "string" || typeof node.to !== "string") return;
    if (!node.from.endsWith("Z") || !node.to.endsWith("Z")) return;
    const from = Date.parse(node.from);
    const to = Date.parse(node.to);
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    if (from >= to) problems.push("invalid_interval");
    if (to - from > 366 * 24 * 60 * 60 * 1000) problems.push("interval_too_large");
  });
  return problems;
}

function snapshotProblems(bundle) {
  const problems = [];
  for (const part of bundle.parts) {
    if (part.document.snapshot_id !== bundle.snapshot_id) problems.push("snapshot_mismatch");
    if (part.document.data_as_of !== bundle.data_as_of) problems.push("cutoff_mismatch");
  }
  return problems;
}

function invariantProblems(entry, document, exponents) {
  const problems = [
    ...prohibitedKeys(document).map(() => "prohibited_field"),
    ...moneyProblems(document, exponents),
    ...ratioProblems(document),
    ...periodProblems(document),
  ];
  if (entry.schema?.endsWith("/financeRecord") || document.record_type) {
    problems.push(...recordSetProblems([document]));
  }
  if (document.records) problems.push(...recordSetProblems(document.records));
  if (document.buckets && document.balances_included === false) problems.push(...dailyProblems(document));
  if (document.buckets && document.flows === undefined && document.buckets[0]?.flows) {
    problems.push(...operationsProblems(document));
  }
  if (document.metrics && document.coverage) problems.push(...summaryProblems(document));
  if (document.parts) problems.push(...snapshotProblems(document));
  if (typeof document.wire_base64url === "string" && document.payload) {
    const decoded = JSON.parse(Buffer.from(document.wire_base64url, "base64url").toString("utf8"));
    if (canonicalize(decoded) !== canonicalize(document.payload)) problems.push("cursor_wire_mismatch");
  }
  return [...new Set(problems)];
}

function assertOpenApi(openapi) {
  if (openapi.openapi !== "3.1.0") fail("OpenAPI version is not 3.1.0");
  const paths = Object.keys(openapi.paths ?? {}).sort();
  const expected = [...ENDPOINTS].sort();
  if (paths.join() !== expected.join()) {
    fail(`OpenAPI paths ${paths.join(", ")} do not match the eleven frozen endpoints`);
  }
  for (const path of ENDPOINTS) {
    const operation = openapi.paths[path]?.get;
    if (!operation) {
      fail(`${path} is missing GET`);
      continue;
    }
    for (const status of ["200", "400", "403", "410", "422", "429", "503"]) {
      if (!operation.responses?.[status]) fail(`${path} is missing ${status}`);
    }
    if (!operation.responses?.["429"]?.headers?.["Retry-After"]) {
      fail(`${path} 429 is missing Retry-After`);
    }
    if (operation.responses?.["200"]?.headers?.["Cache-Control"]?.schema?.const !== "private, no-store") {
      fail(`${path} 200 Cache-Control is not private, no-store`);
    }
  }
  const scheme = openapi.components?.securitySchemes?.businessOsHmac;
  if (scheme?.name !== "X-BOS-Signature") fail("HMAC security scheme is not X-BOS-Signature");
}

function assertGates(gates) {
  for (const gate of gates.gates ?? []) {
    if (gate.confirmed_value !== null) fail(`${gate.name} has a confirmed value in the frozen contract`);
    if (gate.name === "VAT_RATES" && gate.proposed !== undefined) fail("VAT_RATES must not propose a rate");
  }
  const serialized = JSON.stringify(gates);
  if (/-----BEGIN|private_key|sk_live|service_role/i.test(serialized)) {
    fail("configuration gates contain secret-shaped material");
  }
}

function assertManifest(manifest) {
  const files = {};
  const walkDir = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === "manifest.json" || name === "redacted-real") continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        walkDir(path);
        continue;
      }
      const rel = relative(root, path).split("\\").join("/");
      files[rel] = createHash("sha256").update(readFileSync(path)).digest("hex");
    }
  };
  walkDir(root);
  const expected = Object.keys(files).sort();
  const actual = Object.keys(manifest.files ?? {}).sort();
  if (expected.join() !== actual.join()) {
    fail(`manifest file list mismatch: missing ${expected.filter((f) => !actual.includes(f)).join(", ")}`);
  }
  for (const file of expected) {
    if (manifest.files[file] !== files[file]) fail(`manifest hash mismatch for ${file}`);
  }
}

function assertVectors(vectors) {
  const byId = new Map(vectors.vectors.map((vector) => [vector.id, vector]));
  for (const id of REQUIRED_VECTORS) {
    if (!byId.has(id)) fail(`missing HMAC vector ${id}`);
  }
  const health = byId.get("get-health-empty-body");
  const retry = byId.get("retry-fresh-nonce");
  const body = byId.get("nonempty-body-changes-signature");
  if (health && retry && health.signature_hex === retry.signature_hex) {
    fail("fresh-nonce retry reused the original signature");
  }
  if (health && body && health.body_sha256 === body.body_sha256) {
    fail("non-empty body vector reused the empty-body hash");
  }
  for (const vector of vectors.vectors) {
    const target = requestTarget(vector.path, vector.query ?? []);
    if (target !== vector.request_target) fail(`${vector.id} request target mismatch: ${target}`);
    const bodyBytes = Buffer.from(vector.body_utf8 ?? "", "utf8");
    const canonical = canonicalString({
      method: vector.method,
      requestTarget: vector.request_target,
      timestamp: vector.timestamp,
      nonce: vector.nonce,
      body: bodyBytes,
    });
    if (canonical !== vector.canonical_utf8) fail(`${vector.id} canonical bytes mismatch`);
    if ((canonical.match(/\n/g) ?? []).length !== 4) fail(`${vector.id} does not use four LF separators`);
    const signature = signHex(vector.secret_utf8, canonical);
    if (signature !== vector.signature_hex) {
      fail(`${vector.id} signature mismatch: expected ${vector.signature_hex} got ${signature}`);
    }
  }
  const emptyHash = createHash("sha256").update(Buffer.alloc(0)).digest("hex");
  if (health?.body_sha256 !== emptyHash) fail("empty GET body hash is not SHA-256 of zero bytes");

  const now = 1759017600;
  if (assessTimestamp(now, "1759017900") !== "fresh") fail("300s skew must be fresh");
  if (assessTimestamp(now, "1759017901") !== "timestamp_out_of_range") fail("301s skew must be rejected");
  if (assessTimestamp(now, "1759017300") !== "fresh") fail("300s past skew must be fresh");
  if (assessTimestamp(now, "1759017299") !== "timestamp_out_of_range") fail("301s past skew must be rejected");

  const verifier = createVerifier({
    now: () => now,
    keys: [
      {
        keyId: "bos_test_doppler_production_v1",
        secret: TEST_SECRET,
        projectId: "doppler",
        environment: "production",
        status: "active",
      },
      {
        keyId: "bos_test_retired",
        secret: "retired-secret-do-not-use",
        projectId: "doppler",
        environment: "production",
        status: "revoked",
      },
    ],
  });
  const base = {
    method: "GET",
    path: "/api/business-os/v1/health",
    query: [],
    timestamp: String(now),
    body: Buffer.alloc(0),
    projectId: "doppler",
    environment: "production",
    keyId: "bos_test_doppler_production_v1",
  };
  const signed = (overrides) => {
    const request = { ...base, ...overrides };
    const canonical = canonicalString({
      method: request.method,
      requestTarget: requestTarget(request.path, request.query),
      timestamp: request.timestamp,
      nonce: request.nonce,
      body: request.body,
    });
    return { ...request, signature: signHex(TEST_SECRET, canonical) };
  };
  const first = verifier.verify(signed({ nonce: "nonce-replay-00001" }));
  if (first !== "ok") fail(`valid signature rejected: ${first}`);
  if (verifier.verify(signed({ nonce: "nonce-replay-00001" })) !== "nonce_replayed") {
    fail("successful nonce was accepted twice");
  }
  const bad = verifier.verify({
    ...signed({ nonce: "nonce-failed-00001" }),
    signature: "00".repeat(32),
  });
  if (bad !== "invalid_signature") fail(`bad signature returned ${bad}`);
  if (verifier.verify(signed({ nonce: "nonce-failed-00001" })) !== "nonce_replayed") {
    fail("nonce from a failed signature was reusable");
  }
  if (verifier.verify(signed({ nonce: "nonce-fresh-000002" })) !== "ok") {
    fail("fresh nonce after a failure was rejected");
  }
  const upper = signed({ nonce: "nonce-upper-000001" });
  if (verifier.verify({ ...upper, signature: upper.signature.toUpperCase() }) !== "bad_signature_encoding") {
    fail("uppercase signature was accepted");
  }
  if (verifier.verify({ ...signed({ nonce: "nonce-revoke-00001" }), keyId: "bos_test_retired" }) !== "key_revoked") {
    fail("revoked key was accepted");
  }
  if (verifier.verify({ ...signed({ nonce: "nonce-project-0001" }), projectId: "smscode" }) !== "project_mismatch") {
    fail("cross-project credential was accepted");
  }
  if (
    verifier.verify({ ...signed({ nonce: "nonce-env-00000001" }), environment: "staging" }) !==
    "environment_mismatch"
  ) {
    fail("cross-environment credential was accepted");
  }
}

function compileSchema(ajv, schema) {
  const ref = schema.startsWith("https://") ? schema : `${SCHEMA_BASE}/${schema}`;
  try {
    return ajv.compile({ $ref: ref });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    return null;
  }
}

function main() {
  const required = [
    "schemas/common.json",
    "schemas/responses.json",
    "openapi.json",
    "fixtures/corpus.json",
    "hmac/vectors.json",
    "configuration-gates.json",
    "currency-exponents.json",
    "manifest.json",
    "canonical.mjs",
    "hmac-sign.mjs",
  ];
  for (const file of required) {
    if (!existsSync(join(root, file))) fail(`missing ${file}`);
  }
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }

  const ajv = loadSchemas();
  const corpus = readJson(join(root, "fixtures/corpus.json"));
  const exponents = readJson(join(root, "currency-exponents.json")).exponents;
  const ids = new Set(corpus.cases.map((entry) => entry.id));
  for (const id of REQUIRED_CASES) {
    if (!ids.has(id)) fail(`missing corpus case ${id}`);
  }

  for (const entry of corpus.cases) {
    const document = readJson(join(root, entry.file));
    const validate = compileSchema(ajv, entry.schema);
    if (!validate) {
      fail(`${entry.id} schema not found: ${entry.schema}`);
      continue;
    }
    let schemaOk = validate(document);
    if (Array.isArray(document.parts)) {
      for (const part of document.parts) {
        const partValidate = compileSchema(ajv, part.schema);
        if (!partValidate) {
          fail(`${entry.id} part schema not found: ${part.schema}`);
          schemaOk = false;
          continue;
        }
        if (!partValidate(part.document)) {
          schemaOk = false;
          if (entry.expect === "accept") {
            fail(`${entry.id} part schema rejected: ${ajv.errorsText(partValidate.errors)}`);
          }
        } else if (entry.expect === "accept") {
          const partProblems = invariantProblems({ schema: part.schema }, part.document, exponents);
          if (partProblems.length > 0) {
            fail(`${entry.id} part invariant failed: ${partProblems.join(", ")}`);
          }
        }
      }
    }
    const problems = invariantProblems(entry, document, exponents);
    if (entry.expect === "accept") {
      if (!schemaOk && validate.errors) fail(`${entry.id} schema rejected: ${ajv.errorsText(validate.errors)}`);
      if (problems.length > 0) fail(`${entry.id} invariant failed: ${problems.join(", ")}`);
      continue;
    }
    if (entry.via === "schema") {
      if (schemaOk) fail(`${entry.id} was expected to fail schema validation`);
      continue;
    }
    if (!schemaOk) fail(`${entry.id} schema rejected before invariant ${entry.code}: ${ajv.errorsText(validate.errors)}`);
    if (!problems.includes(entry.code)) {
      fail(`${entry.id} expected invariant ${entry.code} but got ${problems.join(", ") || "none"}`);
    }
  }

  assertOpenApi(readJson(join(root, "openapi.json")));
  assertGates(readJson(join(root, "configuration-gates.json")));
  assertVectors(readJson(join(root, "hmac/vectors.json")));
  assertManifest(readJson(join(root, "manifest.json")));

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log(`contract conformance: ${corpus.cases.length} cases, ${REQUIRED_VECTORS.length} HMAC vectors, manifest ok`);
}

main();
