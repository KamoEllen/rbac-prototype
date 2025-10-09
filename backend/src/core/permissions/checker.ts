import { db } from '../../infrastructure/db/client';
import { userGroups, groups, groupRoles, roles } from '../../infrastructure/db/schema';
import { eq, and } from 'drizzle-orm';

export type Module = 'vault' | 'financials' | 'reporting';
export type Action = 'create' | 'read' | 'update' | 'delete';
export type PermissionMap = Record<Module, Action[]>;

export async function checkPermission(
  userId: string,
  teamId: string,
  module: Module,
  action: Action
): Promise<boolean> {
  const userRoles = await db
    .select({
      permissions: roles.permissions,
    })
    .from(userGroups)
    .innerJoin(groups, eq(userGroups.groupId, groups.id))
    .innerJoin(groupRoles, eq(groups.id, groupRoles.groupId))
    .innerJoin(roles, eq(groupRoles.roleId, roles.id))
    .where(
      and(
        eq(userGroups.userId, userId),
        eq(groups.teamId, teamId)
      )
    );

  for (const role of userRoles) {
    const perms = role.permissions as PermissionMap;
    if (perms[module]?.includes(action)) {
      return true;
    }
  }

  return false;
}

export async function getUserPermissions(
  userId: string,
  teamId: string
): Promise<PermissionMap> {
  const userRoles = await db
    .select({
      permissions: roles.permissions,
    })
    .from(userGroups)
    .innerJoin(groups, eq(userGroups.groupId, groups.id))
    .innerJoin(groupRoles, eq(groups.id, groupRoles.groupId))
    .innerJoin(roles, eq(groupRoles.roleId, roles.id))
    .where(
      and(
        eq(userGroups.userId, userId),
        eq(groups.teamId, teamId)
      )
    );

  const merged: Record<Module, Set<Action>> = {
    vault: new Set(),
    financials: new Set(),
    reporting: new Set(),
  };

  for (const role of userRoles) {
    const perms = role.permissions as PermissionMap;
    for (const [module, actions] of Object.entries(perms)) {
      actions.forEach((action) => merged[module as Module].add(action as Action));
    }
  }

  return {
    vault: Array.from(merged.vault),
    financials: Array.from(merged.financials),
    reporting: Array.from(merged.reporting),
  };
}

export async function hasModuleAccess(
  userId: string,
  teamId: string,
  module: Module
): Promise<boolean> {
  const userRoles = await db
    .select({
      permissions: roles.permissions,
    })
    .from(userGroups)
    .innerJoin(groups, eq(userGroups.groupId, groups.id))
    .innerJoin(groupRoles, eq(groups.id, groupRoles.groupId))
    .innerJoin(roles, eq(groupRoles.roleId, roles.id))
    .where(
      and(
        eq(userGroups.userId, userId),
        eq(groups.teamId, teamId)
      )
    );

  for (const role of userRoles) {
    const perms = role.permissions as PermissionMap;
    if (perms[module]?.length > 0) {
      return true;
    }
  }

  return false;
}

export function verifyTeamOwnership(
  resourceTeamId: string,
  requestedTeamId: string
): void {
  if (resourceTeamId !== requestedTeamId) {
    throw new Error('Forbidden: Resource belongs to different team');
  }
}