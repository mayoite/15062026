import type { PlannerIdentityId } from "./plannerIdentity";

export type PlannerAccessContext = "guest" | "authenticated" | "admin";

export type PlannerActionKey =
  | "view"
  | "select"
  | "mutate"
  | "persist"
  | "import"
  | "export"
  | "publish"
  | "share";

export interface PlannerActionPermissionSet {
  allowedActions: readonly PlannerActionKey[];
  blockedActions: readonly PlannerActionKey[];
}

export interface PlannerActionPermissionMatrix {
  guest: PlannerActionPermissionSet;
  authenticated: PlannerActionPermissionSet;
  admin: PlannerActionPermissionSet;
}

export const PLANNER_GUEST_BLOCKED_ACTIONS: readonly PlannerActionKey[] = [
  "persist",
  "import",
  "export",
  "publish",
  "share",
] as const;

const ALL_PLANNER_ACTIONS: readonly PlannerActionKey[] = [
  "view",
  "select",
  "mutate",
  "persist",
  "import",
  "export",
  "publish",
  "share",
] as const;

function buildGuestPermissions(): PlannerActionPermissionSet {
  return {
    allowedActions: ["view", "select"] as const,
    blockedActions: PLANNER_GUEST_BLOCKED_ACTIONS,
  };
}

function buildAuthenticatedPermissions(): PlannerActionPermissionSet {
  return {
    allowedActions: ALL_PLANNER_ACTIONS,
    blockedActions: [] as const,
  };
}

function buildAdminPermissions(): PlannerActionPermissionSet {
  return {
    allowedActions: ALL_PLANNER_ACTIONS,
    blockedActions: [] as const,
  };
}

export const PLANNER_ACTION_PERMISSION_MATRIX: Record<
  PlannerIdentityId,
  PlannerActionPermissionMatrix
> = {
  oando: {
    guest: buildGuestPermissions(),
    authenticated: buildAuthenticatedPermissions(),
    admin: buildAdminPermissions(),
  },
  buddy: {
    guest: buildGuestPermissions(),
    authenticated: buildAuthenticatedPermissions(),
    admin: buildAdminPermissions(),
  },
  oofpl: {
    guest: buildGuestPermissions(),
    authenticated: buildAuthenticatedPermissions(),
    admin: buildAdminPermissions(),
  },
};

export function getPlannerActionPermissions(
  plannerId: PlannerIdentityId,
  context: PlannerAccessContext,
): PlannerActionPermissionSet {
  return PLANNER_ACTION_PERMISSION_MATRIX[plannerId][context];
}

export function plannerActionIsBlocked(
  plannerId: PlannerIdentityId,
  context: PlannerAccessContext,
  action: PlannerActionKey,
): boolean {
  return getPlannerActionPermissions(plannerId, context).blockedActions.includes(action);
}
