/**
 * File rules for the Business OS data folder. Pure and dependency-free so the
 * browser, the routes and the tests share one definition. The database repeats
 * the type list and size cap in `business_os.document_mime_allowed`.
 */

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** Text extracted from a file is capped before it is stored. */
export const MAX_EXTRACTED_CHARS = 500_000;

const BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const ACCEPTED_EXTENSIONS = Object.keys(BY_EXTENSION).map((ext) => `.${ext}`);

const TEXT_MIMES = new Set(["text/plain", "text/markdown", "text/csv"]);

export type FileKind = "pdf" | "image" | "text" | "sheet" | "doc";

/** The stored type comes from the extension; the bytes are then checked against it. */
export function mimeFromName(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return null;
  return BY_EXTENSION[name.slice(dot + 1).toLowerCase()] ?? null;
}

export function kindOf(mime: string | null): FileKind | null {
  if (!mime) return null;
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (TEXT_MIMES.has(mime)) return "text";
  if (mime.includes("spreadsheetml")) return "sheet";
  if (mime.includes("wordprocessingml")) return "doc";
  return null;
}

export function isTextMime(mime: string): boolean {
  return TEXT_MIMES.has(mime);
}

/** File name without its extension, trimmed to the 160-character title limit. */
export function titleFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).trim();
  return (base || name).slice(0, 160);
}

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,59}$/;

/**
 * Normalizes a folder path ("Finance / 2026/" → "Finance/2026"). Returns null
 * when it cannot be stored. The empty string is the root.
 */
export function normalizeFolder(input: string): string | null {
  const parts = input
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 6) return null;
  for (const part of parts) {
    if (!SEGMENT.test(part) || part.includes("..") || part.endsWith(" ")) return null;
  }
  const folder = parts.join("/");
  return folder.length <= 200 ? folder : null;
}

/** Comma-separated tags to the stored form; null if any tag is invalid or there are more than 12. */
export function parseTags(input: string | string[]): string[] | null {
  const raw = Array.isArray(input) ? input : input.split(",");
  const tags = [...new Set(raw.map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean))];
  if (tags.length > 12) return null;
  return tags.every((tag) => /^[a-z0-9][a-z0-9-]{0,31}$/.test(tag)) ? tags : null;
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

/** Valid UTF-8 without NUL bytes. A leading BOM is fine. */
function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/** True when the bytes really are the type the extension claims. */
export function bytesMatchMime(mime: string, bytes: Uint8Array): boolean {
  switch (mime) {
    case "application/pdf":
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/webp":
      return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]); // zip container
    default:
      return isTextMime(mime) && looksLikeText(bytes);
  }
}

/** Searchable text for the types that are text already; other types wait for AI extraction. */
export function extractText(mime: string, bytes: Uint8Array): string | null {
  if (!isTextMime(mime)) return null;
  const text = new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
  return text.slice(0, MAX_EXTRACTED_CHARS);
}

export function formatBytes(size: number | null): string {
  if (size === null || !Number.isFinite(size)) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
