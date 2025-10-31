import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import {
  users,
  userGroups,
  groups,
} from "../../infrastructure/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authMiddleware) // Apply to all routes
  
  .get(
    "/",
    async ({ query, currentUser }: any) => {
      // currentUser injected by middleware - no need for getCurrentUser
      const { teamId } = query;
      
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          verified: users.verified,
          tenantId: users.tenantId,
          teamId: users.teamId,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.tenantId, currentUser.tenantId));
        
      return teamId ? allUsers.filter((u) => u.teamId === teamId) : allUsers;
    },
    { query: t.Object({ teamId: t.Optional(t.String()) }) }
  )

  .get(
    "/:userId",
    async ({ params, currentUser, set }: any) => {
      // currentUser from middleware
      
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, params.userId),
            eq(users.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
        
      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      const userGroupsData = await db
        .select({
          groupId: groups.id,
          groupName: groups.name,
          teamId: groups.teamId,
        })
        .from(userGroups)
        .innerJoin(groups, eq(userGroups.groupId, groups.id))
        .where(eq(userGroups.userId, params.userId));
        
      return { ...user, groups: userGroupsData };
    },
    { params: t.Object({ userId: t.String() }) }
  )

  .put(
    "/:userId",
    async ({ params, body, currentUser, set }: any) => {
      // currentUser from middleware
      
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, params.userId),
            eq(users.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
        
      if (!existingUser) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({ name: body.name, email: body.email })
        .where(eq(users.id, params.userId))
        .returning();
        
      return { message: "User updated successfully", user: updatedUser };
    },
    {
      params: t.Object({ userId: t.String() }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
      }),
    }
  )

  .post(
    "/:userId/groups/:groupId",
    async ({ params, currentUser, set }: any) => {
      // currentUser from middleware
      
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, params.userId),
            eq(users.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
        
      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, params.groupId))
        .limit(1);
        
      if (!group) {
        set.status = 404;
        throw new Error("Group not found");
      }
      
      const existing = await db
        .select()
        .from(userGroups)
        .where(
          and(
            eq(userGroups.userId, params.userId),
            eq(userGroups.groupId, params.groupId)
          )
        )
        .limit(1);
        
      if (existing[0]) {
        return { message: "User already in this group" };
      }
      
      await db
        .insert(userGroups)
        .values({ userId: params.userId, groupId: params.groupId });
        
      return { message: "User added to group successfully" };
    },
    { params: t.Object({ userId: t.String(), groupId: t.String() }) }
  )

  .delete(
    "/:userId/groups/:groupId",
    async ({ params, currentUser, set }: any) => {
      // currentUser from middleware
      
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, params.userId),
            eq(users.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
        
      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      await db
        .delete(userGroups)
        .where(
          and(
            eq(userGroups.userId, params.userId),
            eq(userGroups.groupId, params.groupId)
          )
        );
        
      return { message: "User removed from group successfully" };
    },
    { params: t.Object({ userId: t.String(), groupId: t.String() }) }
  )

  .delete(
    "/:userId",
    async ({ params, currentUser, set }: any) => {
      // currentUser from middleware
      
      if (params.userId === currentUser.id) {
        set.status = 400;
        throw new Error("Cannot delete your own account");
      }
      
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, params.userId),
            eq(users.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
        
      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      await db.delete(users).where(eq(users.id, params.userId));
      
      return { message: "User deleted successfully" };
    },
    { params: t.Object({ userId: t.String() }) }
  );