import { explainFinanceError } from "@/components/business-os/business-post";

export type SaveResult = { title: string; updatedAt: string; tags: string[]; links: string[]; relinked: number };

export const NOTE_ERRORS: Record<string, string> = {
  note_title_taken: "Another note already has this title.",
  title_invalid: "Titles cannot be empty or contain [ ] | # ^ \\ / or :",
  folder_invalid: "Folder names use letters, numbers, spaces, dots, dashes and underscores.",
  note_too_large: "Notes can be up to 200,000 characters.",
  note_missing: "This note was deleted.",
};

export function explain(payload: Record<string, unknown>): string {
  return (typeof payload.error === "string" && NOTE_ERRORS[payload.error]) || explainFinanceError(payload);
}
