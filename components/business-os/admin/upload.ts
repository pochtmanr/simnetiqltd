"use client";

import { businessPost, explainFinanceError } from "@/components/business-os/business-post";
import { MAX_FILE_BYTES, mimeFromName } from "@/lib/business-os/files/kinds";

export const UPLOAD_ERRORS: Record<string, string> = {
  mime_invalid: "This file type is not supported, or the file is not what its extension says.",
  document_too_large: "Files can be up to 50 MB.",
  checksum_invalid: "The upload arrived damaged. Try again.",
  folder_invalid: "Folder names use letters, numbers, spaces, dots, dashes and underscores.",
  tag_invalid: "Tags use lowercase letters, numbers and dashes, up to 12 per file.",
  document_linked: "This file is attached to a record. Detach it before deleting.",
  upload_incomplete: "The upload did not finish. Try again.",
  storage_quota_exceeded: "Storage is full (10 GB). Delete files before uploading more.",
};

export function explainUpload(payload: Record<string, unknown>): string {
  return (typeof payload.error === "string" && UPLOAD_ERRORS[payload.error]) || explainFinanceError(payload);
}

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** PUT with progress events; fetch cannot report upload progress. */
function putWithProgress(url: string, apikey: string | undefined, file: File, mime: string, onProgress: (fraction: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", mime);
    if (apikey) xhr.setRequestHeader("apikey", apikey);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}

export type UploadStage = { status: "uploading" | "verifying"; progress: number };

/** Hash, register, send the bytes straight to storage, then verify. Returns an error message, or null when stored. */
export async function uploadDocument(
  file: File,
  target: { folder: string; tags?: string[] },
  onStage: (stage: UploadStage) => void = () => {},
): Promise<string | null> {
  const mime = mimeFromName(file.name);
  if (!mime) return UPLOAD_ERRORS.mime_invalid;
  if (file.size < 1) return "The file is empty.";
  if (file.size > MAX_FILE_BYTES) return UPLOAD_ERRORS.document_too_large;
  const sha256 = await sha256Hex(file);
  onStage({ status: "uploading", progress: 0 });
  const started = await businessPost("/api/business-os/documents/upload-url", {
    fileName: file.name,
    size: file.size,
    sha256,
    folder: target.folder,
    ...(target.tags ? { tags: target.tags } : {}),
  });
  const result = started.payload.result as { documentId?: string; uploadUrl?: string; apikey?: string } | undefined;
  if (!started.ok || !result?.documentId || !result.uploadUrl) return explainUpload(started.payload);
  const sent = await putWithProgress(result.uploadUrl, result.apikey, file, mime, (progress) => onStage({ status: "uploading", progress }));
  if (!sent) {
    await businessPost("/api/business-os/documents/delete", { documentId: result.documentId });
    return UPLOAD_ERRORS.upload_incomplete;
  }
  onStage({ status: "verifying", progress: 1 });
  const done = await businessPost("/api/business-os/documents/complete", { documentId: result.documentId, fileName: file.name, sha256 });
  return done.ok ? null : explainUpload(done.payload);
}
