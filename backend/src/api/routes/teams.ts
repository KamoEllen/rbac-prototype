import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { teams, users, sessions } from "../../infrastructure/db/schema";
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

export const teamRoutes = new Elysia({ prefix: "/teams" })
  .get("/", async ({ cookie }: any) => {
    const currentUser = await getCurrentUser(cookie);
    const allTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.tenantId, currentUser.tenantId));
    const teamsWithCounts = await Promise.all(
      allTeams.map(async (team) => {
        const userCount = await db
          .select()
          .from(users)
          .where(eq(users.teamId, team.id));
        return { ...team, userCount: userCount.length };
      })
    );
    return teamsWithCounts;
  })

  .get(
    "/:teamId",
    async ({ params, cookie, set }: any) => {
      const currentUser = await getCurrentUser(cookie);
      const [team] = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.id, params.teamId),
            eq(teams.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
      if (!team) {
        set.status = 404;
        throw new Error("Team not found");
      }
      const members = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          verified: users.verified,
        })
        .from(users)
        .where(eq(users.teamId, params.teamId));
      return { ...team, members, memberCount: members.length };
    },
    { params: t.Object({ teamId: t.String() }) }
  )

  .post(
    "/",
    async ({ body, cookie }: any) => {
      const currentUser = await getCurrentUser(cookie);
      const [team] = await db
        .insert(teams)
        .values({ name: body.name, tenantId: currentUser.tenantId })
        .returning();
      return { message: "Team created successfully", team };
    },
    { body: t.Object({ name: t.String({ minLength: 1 }) }) }
  )

  .put(
    "/:teamId",
    async ({ params, body, cookie, set }: any) => {
      const currentUser = await getCurrentUser(cookie);
      const [existingTeam] = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.id, params.teamId),
            eq(teams.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
      if (!existingTeam) {
        set.status = 404;
        throw new Error("Team not found");
      }
      const [updatedTeam] = await db
        .update(teams)
        .set({ name: body.name })
        .where(eq(teams.id, params.teamId))
        .returning();
      return { message: "Team updated successfully", team: updatedTeam };
    },
    {
      params: t.Object({ teamId: t.String() }),
      body: t.Object({ name: t.String({ minLength: 1 }) }),
    }
  )

  .delete(
    "/:teamId",
    async ({ params, cookie, set }: any) => {
      const currentUser = await getCurrentUser(cookie);
      if (params.teamId === currentUser.teamId) {
        set.status = 400;
        throw new Error("Cannot delete your own team");
      }
      const [team] = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.id, params.teamId),
            eq(teams.tenantId, currentUser.tenantId)
          )
        )
        .limit(1);
      if (!team) {
        set.status = 404;
        throw new Error("Team not found");
      }
      const teamUsers = await db
        .select()
        .from(users)
        .where(eq(users.teamId, params.teamId));
      if (teamUsers.length > 0) {
        set.status = 400;
        throw new Error("Cannot delete team with existing users");
      }
      await db.delete(teams).where(eq(teams.id, params.teamId));
      return { message: "Team deleted successfully" };
    },
    { params: t.Object({ teamId: t.String() }) }
  );
