import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import common from "@/contracts/business-os/v1/schemas/common.json";
import responses from "@/contracts/business-os/v1/schemas/responses.json";

const SCHEMA_BY_ENDPOINT: Record<string, string> = {
  capabilities: "capabilities",
  "finance/records": "recordsPage",
  overview: "overview",
  "finance/summary": "financeSummary",
  "finance/daily": "financeDaily",
  "finance/balances": "financeBalances",
  "finance/reconciliation": "financeReconciliation",
  "subscriptions/summary": "subscriptionsSummary",
  "operations/daily": "operationsDaily",
};

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(common);
ajv.addSchema(responses);

const validators = new Map<string, ReturnType<typeof ajv.compile>>();

export function schemaForEndpoint(endpoint: string): string | null {
  if (endpoint.startsWith("analytics/")) return "analyticsReport";
  return SCHEMA_BY_ENDPOINT[endpoint] ?? null;
}

export function validateContract(def: string, data: unknown): boolean {
  let validate = validators.get(def);
  if (!validate) {
    validate = ajv.compile({ $ref: `${responses.$id}#/$defs/${def}` });
    validators.set(def, validate);
  }
  return validate(data) === true;
}

export type Capabilities = {
  contract_version: string;
  project_id: string;
  environment: string;
  formula_versions: string[];
  supported_bases: string[];
  limits: { max_page_size: number; max_range_days: number };
  datasets: {
    finance: boolean;
    subscriptions: boolean;
    operations: boolean;
    analytics: Record<string, boolean>;
  };
};

const BASIS_ORDER = ["purchase", "earned_management", "settled_cash", "sms_legacy"] as const;
const ANALYTICS = [
  "ga4_overview_daily",
  "ga4_breakdown",
  "ga4_period_unique_users",
  "gsc_daily_totals",
  "gsc_dimension_rows",
  "vercel_daily",
];

export function preferredBasis(supported: string[]): string | null {
  return BASIS_ORDER.find((basis) => supported.includes(basis)) ?? null;
}

export function datasetsFromCapabilities(capabilities: Capabilities): string[] {
  const datasets: string[] = [];
  if (capabilities.datasets.finance) {
    datasets.push(
      "finance/records",
      "overview",
      "finance/summary",
      "finance/daily",
      "finance/balances",
      "finance/reconciliation",
    );
  }
  if (capabilities.datasets.subscriptions) datasets.push("subscriptions/summary");
  if (capabilities.datasets.operations) datasets.push("operations/daily");
  for (const report of ANALYTICS) {
    if (capabilities.datasets.analytics[report]) datasets.push(`analytics/${report}`);
  }
  return datasets;
}

export function pageLimit(capabilities: Capabilities): number {
  return Math.min(100, capabilities.limits.max_page_size, 500);
}
