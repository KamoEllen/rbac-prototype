import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { vaultSecrets } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import {
  checkPermission,
  verifyTeamOwnership,
} from "../../core/permissions/checker";

export const vaultRoutes = new Elysia({ prefix: "/vault" })
  .use(authMiddleware)

  .get(
    "/",
    async ({ query, currentUser }: any) => {
      const { teamId } = query;

      const canRead = await checkPermission(
        currentUser.id,
        teamId,
        "vault",
        "read"
      );

      if (!canRead) {
        throw new Error("Forbidden: Missing vault:read permission");
      }

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

  .get(
    "/:id",
    async ({ params, query, currentUser }: any) => {
      const { id } = params;
      const { teamId } = query;

      const canRead = await checkPermission(
        currentUser.id,
        teamId,
        "vault",
        "read"
      );

      if (!canRead) {
        throw new Error("Forbidden: Missing vault:read permission");
      }

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
  .post(
    "/",
    async ({ body, currentUser }: any) => {
      const { name, value, teamId } = body;

      const canCreate = await checkPermission(
        currentUser.id,
        teamId,
        "vault",
        "create"
      );

      if (!canCreate) {
        throw new Error("Forbidden: Missing vault:create permission");
      }

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

  .put(
    "/:id",
    async ({ params, body, currentUser }: any) => {
      const { id } = params;
      const { name, value, teamId } = body;

      const canUpdate = await checkPermission(
        currentUser.id,
        teamId,
        "vault",
        "update"
      );

      if (!canUpdate) {
        throw new Error("Forbidden: Missing vault:update permission");
      }

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

  .delete(
    "/:id",
    async ({ params, query, currentUser }: any) => {
      const { id } = params;
      const { teamId } = query;

      const canDelete = await checkPermission(
        currentUser.id,
        teamId,
        "vault",
        "delete"
      );

      if (!canDelete) {
        throw new Error("Forbidden: Missing vault:delete permission");
      }

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
