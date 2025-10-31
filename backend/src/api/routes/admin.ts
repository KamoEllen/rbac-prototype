import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { users, userGroups, groups } from "../../infrastructure/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

// Middleware to check if user is admin
const requireAdmin = new Elysia({ name: 'require-admin' })
  .use(authMiddleware)
  .derive(async ({ currentUser, set }) => {
    // Check if user belongs to an admin group
    // In the seed data, "Engineering Admins" is the admin group
    const adminGroups = await db
      .select()
      .from(userGroups)
      .innerJoin(groups, eq(userGroups.groupId, groups.id))
      .where(
        and(
          eq(userGroups.userId, currentUser.id),
          eq(groups.name, 'Engineering Admins') // From seed.ts
        )
      )
      .limit(1);

    if (adminGroups.length === 0) {
      set.status = 403;
      throw new Error('Forbidden: Admin access required');
    }

    return {};
  });

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(requireAdmin) // Now properly protected!
  
  .get("/users/unverified", async ({ currentUser }: any) => {
    // currentUser comes from authMiddleware
    // Admin check already done by requireAdmin middleware
    
    const unverified = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        tenantId: users.tenantId,
        teamId: users.teamId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.verified, false),
          eq(users.tenantId, currentUser.tenantId) // Tenant isolation
        )
      );
    
    return unverified;
  })

  .post(
    "/users/:id/verify",
    async ({ params, currentUser, set }: any) => {
      // No need to call getCurrentUser - currentUser injected by middleware
      
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, params.id),
            eq(users.tenantId, currentUser.tenantId) // Security: only verify users in same tenant
          )
        )
        .limit(1);
        
      if (!existingUser) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      if (existingUser.verified) {
        return { message: "User already verified", user: existingUser };
      }
      
      const [verifiedUser] = await db
        .update(users)
        .set({ verified: true })
        .where(eq(users.id, params.id))
        .returning();
        
      return { message: "User verified successfully", user: verifiedUser };
    },
    { params: t.Object({ id: t.String() }) }
  )

  .post(
    "/users/:id/unverify",
    async ({ params, currentUser, set }: any) => {
      // currentUser from middleware
      
      const [user] = await db
        .update(users)
        .set({ verified: false })
        .where(
          and(
            eq(users.id, params.id),
            eq(users.tenantId, currentUser.tenantId) // Security check
          )
        )
        .returning();
        
      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      return { message: "User unverified", user };
    },
    { params: t.Object({ id: t.String() }) }
  );