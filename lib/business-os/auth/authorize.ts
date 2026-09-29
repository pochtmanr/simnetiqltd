import "server-only";

export type Role = "owner" | "admin" | "read_only";
export type Assurance = "aal1" | "aal2";

export class BusinessOsError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}

export function assertStepUp(assurance: Assurance): void {
  if (assurance !== "aal2") throw new BusinessOsError("step_up_required", 403);
}

export function assertOwner(role: Role): void {
  if (role !== "owner") throw new BusinessOsError("forbidden", 403);
}

export function assertFinanceWriter(role: Role): void {
  if (role === "read_only") throw new BusinessOsError("forbidden", 403);
}

export function isRole(value: string): value is Role {
  return value === "owner" || value === "admin" || value === "read_only";
}

export type IdentityProject = {
  slug: string;
  name: string;
  state: string;
  reportingEnabled: boolean;
};

export type IdentityProfile = {
  userId: string;
  organizationId: string;
  organizationSlug: string;
  role: Role;
  assurance: Assurance;
  telegramLinked: boolean;
  sessionId: string;
  projects: IdentityProject[];
};

export function profileFromMembership(input: {
  userId: string;
  organizationId: string;
  organizationSlug: string;
  role: string;
  revokedAt: string | null;
  assurance: Assurance;
  telegramLinked: boolean;
  sessionId: string;
  projects: IdentityProject[];
} | null): IdentityProfile | null {
  if (!input || input.revokedAt) return null;
  if (!isRole(input.role)) return null;
  return {
    userId: input.userId,
    organizationId: input.organizationId,
    organizationSlug: input.organizationSlug,
    role: input.role,
    assurance: input.assurance,
    telegramLinked: input.telegramLinked,
    sessionId: input.sessionId,
    projects: input.projects,
  };
}

export function assuranceFromAccessToken(accessToken: string): Assurance {
  const part = accessToken.split(".")[1];
  if (!part) return "aal1";
  try {
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as { aal?: unknown };
    return payload.aal === "aal2" ? "aal2" : "aal1";
  } catch {
    return "aal1";
  }
}

export function safeNextPath(value: string | null): "/admin" | "/tg" {
  return value === "/tg" ? "/tg" : "/admin";
}
