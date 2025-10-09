import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { roles, groupRoles } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

export const roleRoutes = new Elysia({ prefix: "/roles" })
  .use(authMiddleware)
  .get("/", async () => {
    const allRoles = await db.select().from(roles);

    const rolesWithUsage = await Promise.all(
      allRoles.map(async (role) => {
        const usage = await db
          .select()
          .from(groupRoles)
          .where(eq(groupRoles.roleId, role.id));

        return {
          ...role,
          groupCount: usage.length,
        };
      })
    );

    return rolesWithUsage;
  })

  .get(
    "/:roleId",
    async (context: any) => {
      const { params, set } = context;
      const { roleId } = params;

      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (!role) {
        set.status = 404;
        throw new Error("Role not found");
      }

      const groupsData = await db
        .select()
        .from(groupRoles)
        .where(eq(groupRoles.roleId, roleId));

      return {
        ...role,
        groupCount: groupsData.length,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  .post(
    "/",
    async (context: any) => {
      const { body } = context;
      const { name, description, permissions } = body;

      const validModules = ["vault", "financials", "reporting"];
      const validActions = ["create", "read", "update", "delete"];

      for (const [module, actions] of Object.entries(permissions)) {
        if (!validModules.includes(module)) {
          throw new Error(`Invalid module: ${module}`);
        }

        if (!Array.isArray(actions)) {
          throw new Error(`Permissions for ${module} must be an array`);
        }

        for (const action of actions as string[]) {
          if (!validActions.includes(action)) {
            throw new Error(`Invalid action: ${action}`);
          }
        }
      }

      const [role] = await db
        .insert(roles)
        .values({
          name,
          description,
          permissions,
        })
        .returning();

      return {
        message: "Role created successfully",
        role,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        permissions: t.Object({
          vault: t.Array(t.String()),
          financials: t.Array(t.String()),
          reporting: t.Array(t.String()),
        }),
      }),
    }
  )

  .put(
    "/:roleId",
    async (context: any) => {
      const { params, body, set } = context;
      const { roleId } = params;
      const { name, description, permissions } = body;

      const [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (!existingRole) {
        set.status = 404;
        throw new Error("Role not found");
      }
      if (permissions) {
        const validModules = ["vault", "financials", "reporting"];
        const validActions = ["create", "read", "update", "delete"];

        for (const [module, actions] of Object.entries(permissions)) {
          if (!validModules.includes(module)) {
            throw new Error(`Invalid module: ${module}`);
          }

          for (const action of actions as string[]) {
            if (!validActions.includes(action)) {
              throw new Error(`Invalid action: ${action}`);
            }
          }
        }
      }

      const [updatedRole] = await db
        .update(roles)
        .set({ name, description, permissions })
        .where(eq(roles.id, roleId))
        .returning();

      return {
        message: "Role updated successfully",
        role: updatedRole,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        permissions: t.Optional(
          t.Object({
            vault: t.Array(t.String()),
            financials: t.Array(t.String()),
            reporting: t.Array(t.String()),
          })
        ),
      }),
    }
  )

  .delete(
    "/:roleId",
    async (context: any) => {
      const { params, set } = context;
      const { roleId } = params;

      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (!role) {
        set.status = 404;
        throw new Error("Role not found");
      }

      const usage = await db
        .select()
        .from(groupRoles)
        .where(eq(groupRoles.roleId, roleId));

      if (usage.length > 0) {
        set.status = 400;
        throw new Error(
          `Cannot delete role that is assigned to ${usage.length} group(s). Remove from groups first.`
        );
      }

      await db.delete(roles).where(eq(roles.id, roleId));

      return {
        message: "Role deleted successfully",
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
