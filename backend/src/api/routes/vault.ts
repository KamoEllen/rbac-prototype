import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { vaultSecrets } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { verifyTeamOwnership } from "../../core/permissions/checker";

export const vaultRoutes = new Elysia({ prefix: "/vault" })
  .use(authMiddleware)

  // GET / - Read permission required
  .use(requirePermission("vault", "read"))
  .get(
    "/",
    async ({ currentUser, teamId }: any) => {
      // teamId injected by requirePermission middleware
      // Permission check already done

      const secrets = await db
        .select()
        .from(vaultSecrets)
        .where(eq(vaultSecrets.teamId, teamId));

      return secrets;
    },
    {
      query: t.Object({
        teamId: t.String(),
      }),
    }
  )

  // GET /:id - Read permission required
  .get(
    "/:id",
    async ({ params, currentUser, teamId }: any) => {
      // teamId injected by middleware, permission already checked
      const { id } = params;

      const [secret] = await db
        .select()
        .from(vaultSecrets)
        .where(eq(vaultSecrets.id, id))
        .limit(1);

      if (!secret) {
        throw new Error("Secret not found");
      }

      verifyTeamOwnership(secret.teamId, teamId);

      return secret;
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({ teamId: t.String() }),
    }
  )

  // POST / - Create permission required
  .use(requirePermission("vault", "create"))
  .post(
    "/",
    async ({ body, currentUser, teamId }: any) => {
      // teamId injected by middleware, permission already checked
      const { name, value } = body;

      const [secret] = await db
        .insert(vaultSecrets)
        .values({
          name,
          value,
          teamId,
          createdBy: currentUser.id,
        })
        .returning();

      return secret;
    },
    {
      body: t.Object({
        name: t.String(),
        value: t.String(),
        teamId: t.String(),
      }),
    }
  )

  // PUT /:id - Update permission required
  .use(requirePermission("vault", "update"))
  .put(
    "/:id",
    async ({ params, body, currentUser, teamId }: any) => {
      // teamId injected by middleware, permission already checked
      const { id } = params;
      const { name, value } = body;

      const [existing] = await db
        .select()
        .from(vaultSecrets)
        .where(eq(vaultSecrets.id, id))
        .limit(1);

      if (!existing) {
        throw new Error("Secret not found");
      }

      verifyTeamOwnership(existing.teamId, teamId);

      const [secret] = await db
        .update(vaultSecrets)
        .set({
          name,
          value,
          updatedAt: new Date(),
        })
        .where(eq(vaultSecrets.id, id))
        .returning();

      return secret;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.String(),
        value: t.String(),
        teamId: t.String(),
      }),
    }
  )

  // DELETE /:id - Delete permission required
  .use(requirePermission("vault", "delete"))
  .delete(
    "/:id",
    async ({ params, currentUser, teamId }: any) => {
      // teamId injected by middleware, permission already checked
      const { id } = params;

      const [existing] = await db
        .select()
        .from(vaultSecrets)
        .where(eq(vaultSecrets.id, id))
        .limit(1);

      if (!existing) {
        throw new Error("Secret not found");
      }

      verifyTeamOwnership(existing.teamId, teamId);

      await db.delete(vaultSecrets).where(eq(vaultSecrets.id, id));

      return { message: "Secret deleted successfully" };
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({ teamId: t.String() }),
    }
  );