export type ProjectStatus = "released" | "development" | "paused";

export const PROJECT_STATUS = {
  argus: "development",
  physics: "released",
  doppler: "released",
  smscode: "released",
  visapassage: "development",
  greenflagged: "development",
  delivery: "paused",
  creator: "paused",
} as const satisfies Record<string, ProjectStatus>;
