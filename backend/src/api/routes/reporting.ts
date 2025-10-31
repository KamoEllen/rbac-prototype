import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { reports } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { verifyTeamOwnership } from "../../core/permissions/checker";

export const reportingRoutes = new Elysia({ prefix: "/reporting" })
  .use(authMiddleware)

  // GET / - Read permission
  .use(requirePermission("reporting", "read"))
  .get(
    "/",
    async ({ currentUser, teamId }: any) => {
      // teamId and permission check done by middleware

      const allReports = await db
        .select()
        .from(reports)
        .where(eq(reports.teamId, teamId));

      return allReports;
    },
    {
      query: t.Object({
        teamId: t.String(),
      }),
    }
  )

  // GET /:reportId - Read permission
  .get(
    "/:reportId",
    async ({ params, currentUser, teamId }: any) => {
      const { reportId } = params;

      const [report] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (!report) {
        throw new Error("Report not found");
      }

      verifyTeamOwnership(report.teamId, teamId);

      return report;
    },
    {
      params: t.Object({ reportId: t.String() }),
      query: t.Object({ teamId: t.String() }),
    }
  )

  // POST / - Create permission
  .use(requirePermission("reporting", "create"))
  .post(
    "/",
    async ({ body, currentUser, teamId }: any) => {
      const { title, content } = body;

      const [report] = await db
        .insert(reports)
        .values({
          title,
          content,
          teamId,
          createdBy: currentUser.id,
        })
        .returning();

      return report;
    },
    {
      body: t.Object({
        title: t.String(),
        content: t.String(),
        teamId: t.String(),
      }),
    }
  )

  // PUT /:reportId - Update permission
  .use(requirePermission("reporting", "update"))
  .put(
    "/:reportId",
    async ({ params, body, currentUser, teamId }: any) => {
      const { reportId } = params;
      const { title, content } = body;

      const [existing] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (!existing) {
        throw new Error("Report not found");
      }

      verifyTeamOwnership(existing.teamId, teamId);

      const [report] = await db
        .update(reports)
        .set({
          title,
          content,
          updatedAt: new Date(),
        })
        .where(eq(reports.id, reportId))
        .returning();

      return report;
    },
    {
      params: t.Object({ reportId: t.String() }),
      body: t.Object({
        title: t.String(),
        content: t.String(),
        teamId: t.String(),
      }),
    }
  )

  // DELETE /:reportId - Delete permission
  .use(requirePermission("reporting", "delete"))
  .delete(
    "/:reportId",
    async ({ params, currentUser, teamId }: any) => {
      const { reportId } = params;

      const [existing] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (!existing) {
        throw new Error("Report not found");
      }

      verifyTeamOwnership(existing.teamId, teamId);

      await db.delete(reports).where(eq(reports.id, reportId));

      return { message: "Report deleted successfully" };
    },
    {
      params: t.Object({ reportId: t.String() }),
      query: t.Object({ teamId: t.String() }),
    }
  );