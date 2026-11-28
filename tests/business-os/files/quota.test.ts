import assert from "node:assert/strict";
import test from "node:test";
import { companyCopyFields, COMPANY_PROFILE, companyFullAddress } from "@/lib/business-os/company/profile";
import { formatQuotaBytes, STORAGE_QUOTA_BYTES, usageFromSum, wouldExceedQuota } from "@/lib/business-os/files/quota";

test("quota is exactly 10 GiB", () => {
  assert.equal(STORAGE_QUOTA_BYTES, 10 * 1024 * 1024 * 1024);
});

test("usageFromSum clamps remaining at zero when over quota", () => {
  const usage = usageFromSum(STORAGE_QUOTA_BYTES + 100, 3);
  assert.equal(usage.usedBytes, STORAGE_QUOTA_BYTES + 100);
  assert.equal(usage.remainingBytes, 0);
  assert.equal(usage.fileCount, 3);
});

test("wouldExceedQuota blocks the upload that crosses the cap", () => {
  assert.equal(wouldExceedQuota(STORAGE_QUOTA_BYTES - 10, 10), false);
  assert.equal(wouldExceedQuota(STORAGE_QUOTA_BYTES - 10, 11), true);
});

test("formatQuotaBytes shows GB for large values", () => {
  assert.match(formatQuotaBytes(STORAGE_QUOTA_BYTES), /10\.00 GB/);
});

test("company profile matches public Simnetiq facts", () => {
  assert.equal(COMPANY_PROFILE.legalName, "Simnetiq Ltd");
  assert.equal(COMPANY_PROFILE.companyNumber, "16861177");
  assert.match(companyFullAddress(), /2 Frederick Street/);
  const fields = companyCopyFields();
  assert.ok(fields.some((field) => field.id === "legalName" && field.value === "Simnetiq Ltd"));
  assert.ok(fields.some((field) => field.id === "fullAddress"));
});
