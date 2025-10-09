import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import {
  groups,
  groupRoles,
  roles,
  teams,
  userGroups,
  users,
  sessions,
} from "../../infrastructure/db/schema";
import { eq, and, gt } from "drizzle-orm";

async function getCurrentUser(cookie: any) {
  const sessionToken = cookie.session?.value;
  if (!sessionToken) throw new Error("Unauthorized");
  const result = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.token, sessionToken), gt(sessions.expiresAt, new Date()))
    )
    .limit(1);
  if (!result[0]) throw new Error("Invalid session");
  return result[0].user;
}

export const groupRoutes = new Elysia({ prefix: "/groups" })
  .get(
    "/",
    async ({ query, cookie }: any) => {
      const currentUser = await getCurrentUser(cookie);
      const tenantTeams = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.tenantId, currentUser.tenantId));
      const teamIds = tenantTeams.map((t) => t.id);
      let allGroups = await db.select().from(groups);
      allGroups = allGroups.filter((g) => teamIds.includes(g.teamId));
      if (query.teamId)
        allGroups = allGroups.filter((g) => g.teamId === query.teamId);
      const groupsWithDetails = await Promise.all(
        allGroups.map(async (group) => {
          const rolesData = await db
            .select({ roleId: groupRoles.roleId })
            .from(groupRoles)
            .where(eq(groupRoles.groupId, group.id));
          const membersData = await db
            .select({ userId: userGroups.userId })
            .from(userGroups)
            .where(eq(userGroups.groupId, group.id));
          return {
            ...group,
            roleCount: rolesData.length,
            memberCount: membersData.length,
          };
        })
      );
      return groupsWithDetails;
    },
    { query: t.Object({ teamId: t.Optional(t.String()) }) }
  )

  .get(
    "/:groupId",
    async ({ params, set }: any) => {
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, params.groupId))
        .limit(1);
      if (!group) {
        set.status = 404;
        throw new Error("Group not found");
      }
      const rolesData = await db
        .select({
          roleId: roles.id,
          roleName: roles.name,
          roleDescription: roles.description,
          permissions: roles.permissions,
        })
        .from(groupRoles)
        .innerJoin(roles, eq(groupRoles.roleId, roles.id))
        .where(eq(groupRoles.groupId, params.groupId));
      const membersData = await db
        .select({
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        })
        .from(userGroups)
        .innerJoin(users, eq(userGroups.userId, users.id))
        .where(eq(userGroups.groupId, params.groupId));
      return { ...group, roles: rolesData, members: membersData };
    },
    { params: t.Object({ groupId: t.String() }) }
  )

  .post(
    "/",
    async ({ body, cookie, set }: any) => {
      const currentUser = await getCurrentUser(cookie);
      const [team] = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.id, body.teamId),
            eq(teams.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
      if (!team) {
        set.status = 404;
        throw new Error("Team not found");
      }
      const [group] = await db
        .insert(groups)
        .values({
          name: body.name,
          description: body.description,
          teamId: body.teamId,
        })
        .returning();
      return { message: "Group created successfully", group };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        teamId: t.String(),
      }),
    }
  )

  .put(
    "/:groupId",
    async ({ params, body, set }: any) => {
      const [existingGroup] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, params.groupId))
        .limit(1);
      if (!existingGroup) {
        set.status = 404;
        throw new Error("Group not found");
      }
      const [updatedGroup] = await db
        .update(groups)
        .set({ name: body.name, description: body.description })
        .where(eq(groups.id, params.groupId))
        .returning();
      return { message: "Group updated successfully", group: updatedGroup };
    },
    {
      params: t.Object({ groupId: t.String() }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/:groupId/roles/:roleId",
    async ({ params, set }: any) => {
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, params.groupId))
        .limit(1);
      if (!group) {
        set.status = 404;
        throw new Error("Group not found");
      }
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, params.roleId))
        .limit(1);
      if (!role) {
        set.status = 404;
        throw new Error("Role not found");
      }
      const existing = await db
        .select()
        .from(groupRoles)
        .where(
          and(
            eq(groupRoles.groupId, params.groupId),
            eq(groupRoles.roleId, params.roleId)
          )
        )
        .limit(1);
      if (existing[0])
        return { message: "Role already assigned to this group" };
      await db
        .insert(groupRoles)
        .values({ groupId: params.groupId, roleId: params.roleId });
      return { message: "Role assigned to group successfully" };
    },
    { params: t.Object({ groupId: t.String(), roleId: t.String() }) }
  )

  .delete(
    "/:groupId/roles/:roleId",
    async ({ params }: any) => {
      await db
        .delete(groupRoles)
        .where(
          and(
            eq(groupRoles.groupId, params.groupId),
            eq(groupRoles.roleId, params.roleId)
          )
        );
      return { message: "Role removed from group successfully" };
    },
    { params: t.Object({ groupId: t.String(), roleId: t.String() }) }
  )

  .delete(
    "/:groupId",
    async ({ params, set }: any) => {
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, params.groupId))
        .limit(1);
      if (!group) {
        set.status = 404;
        throw new Error("Group not found");
      }
      await db.delete(groups).where(eq(groups.id, params.groupId));
      return { message: "Group deleted successfully" };
    },
    { params: t.Object({ groupId: t.String() }) }
  );
