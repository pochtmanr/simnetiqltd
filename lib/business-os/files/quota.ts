/** Org-wide hard cap for stored document bytes (10 GiB). */
export const STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024;

export function formatQuotaBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export type StorageUsage = {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  fileCount: number;
};

export function usageFromSum(usedBytes: number, fileCount: number): StorageUsage {
  const used = Math.max(0, Math.floor(usedBytes));
  return {
    usedBytes: used,
    quotaBytes: STORAGE_QUOTA_BYTES,
    remainingBytes: Math.max(0, STORAGE_QUOTA_BYTES - used),
    fileCount,
  };
}

export function wouldExceedQuota(usedBytes: number, incomingBytes: number): boolean {
  return usedBytes + incomingBytes > STORAGE_QUOTA_BYTES;
}
