/**
 * Starting points for new notes. Titles carry the date so repeated notes
 * (meetings, weekly reviews) never collide; the editor makes them unique if
 * one already exists.
 */

export type NoteTemplate = {
  id: string;
  label: string;
  description: string;
  folder: string;
  title: (day: string) => string;
  body: (day: string) => string;
};

/** `YYYY-MM-DD` in the viewer's local time zone: the title of the daily note. */
export function dayStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const DAILY_FOLDER = "Daily";

export function dailyBody(day: string): string {
  return `#daily\n\n**${day}**\n\n## Focus today\n- [ ] \n\n## Notes\n\n\n## Done\n- \n`;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "meeting",
    label: "Meeting notes",
    description: "Who was there, what was decided, who does what next.",
    folder: "Meetings",
    title: (day) => `Meeting ${day}`,
    body: (day) =>
      `#meeting\n\n**Date:** ${day}\n**With:** \n**Goal:** \n\n## Agenda\n- \n\n## Notes\n\n\n## Decisions\n- \n\n## Action items\n- [ ] Who · what · by when\n`,
  },
  {
    id: "decision",
    label: "Decision record",
    description: "Write down a decision with its context and the options you rejected, so nobody has to ask why later.",
    folder: "Decisions",
    title: (day) => `Decision ${day}`,
    body: (day) =>
      `#decision\n\n**Date:** ${day}\n**Status:** proposed / decided / replaced\n\n## Context\nWhat problem are we solving and why now?\n\n## Options\n1. \n2. \n\n## Decision\n\n\n## Consequences\nWhat changes, what it costs, when we review it.\n`,
  },
  {
    id: "contact",
    label: "Client or contact",
    description: "One note per person or company: details, history and open threads. Link it from meetings with [[ ]].",
    folder: "People",
    title: () => "New contact",
    body: () => `#contact\n\n**Company:** \n**Role:** \n**Email:** \n**Phone:** \n\n## How we know them\n\n\n## History\n- \n\n## Open threads\n- [ ] \n`,
  },
  {
    id: "project",
    label: "Project brief",
    description: "Goal, scope, budget and milestones for a project, in one page.",
    folder: "Projects",
    title: () => "New project",
    body: () =>
      `#project\n\n## Goal\nWhat does done look like?\n\n## Scope\n- In: \n- Out: \n\n## Budget and costs\n\n\n## Milestones\n- [ ] \n\n## Risks\n- \n\n## Related\n- \n`,
  },
  {
    id: "weekly",
    label: "Weekly review",
    description: "Look back at the week: numbers, wins, problems, and next week's priorities.",
    folder: "Reviews",
    title: (day) => `Week of ${day}`,
    body: () => `#review\n\n## Numbers\n- Revenue: \n- Costs: \n\n## Wins\n- \n\n## Problems\n- \n\n## Next week\n- [ ] \n- [ ] \n- [ ] \n`,
  },
];

/** `title`, or `title 2`, `title 3`… whichever is free among `keys` (lower-cased note keys). */
export function uniqueTitle(title: string, keys: Set<string>): string {
  const base = title.trim().replace(/\s+/g, " ");
  if (!keys.has(base.toLowerCase())) return base;
  for (let index = 2; ; index += 1) {
    const candidate = `${base} ${index}`;
    if (!keys.has(candidate.toLowerCase())) return candidate;
  }
}
