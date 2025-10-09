import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { users, sessions } from "../../infrastructure/db/schema";
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

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .get("/users/unverified", async ({ cookie }: any) => {
    await getCurrentUser(cookie); 
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
      .where(eq(users.verified, false));
    return unverified;
  })

  .post(
    "/users/:id/verify",
    async ({ params, cookie, set }: any) => {
      await getCurrentUser(cookie);
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, params.id))
        .limit(1);
      if (!existingUser) {
        set.status = 404;
        throw new Error("User not found");
      }
      if (existingUser.verified)
        return { message: "User already verified", user: existingUser };
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
    async ({ params, cookie, set }: any) => {
      await getCurrentUser(cookie);
      const [user] = await db
        .update(users)
        .set({ verified: false })
        .where(eq(users.id, params.id))
        .returning();
      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }
      return { message: "User unverified", user };
    },
    { params: t.Object({ id: t.String() }) }
  );
