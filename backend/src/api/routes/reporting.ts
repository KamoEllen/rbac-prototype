import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { reports } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import {
  checkPermission,
  verifyTeamOwnership,
} from "../../core/permissions/checker";

export const reportingRoutes = new Elysia({ prefix: "/reporting" })
  .use(authMiddleware)

  .get(
    "/",
    async (context: any) => {
      const { query, currentUser } = context;
      const { teamId } = query;

      const canRead = await checkPermission(
        currentUser.id,
        teamId,
        "reporting",
        "read"
      );

      if (!canRead) {
        throw new Error("Forbidden: Missing reporting:read permission");
      }

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
  .get(
    "/:reportId",
    async (context: any) => {
      const { params, query, currentUser } = context;
      const { reportId } = params;
      const { teamId } = query;

      const canRead = await checkPermission(
        currentUser.id,
        teamId,
        "reporting",
        "read"
      );

      if (!canRead) {
        throw new Error("Forbidden: Missing reporting:read permission");
      }

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

  .post(
    "/",
    async (context: any) => {
      const { body, currentUser } = context;
      const { title, content, teamId } = body;

      const canCreate = await checkPermission(
        currentUser.id,
        teamId,
        "reporting",
        "create"
      );

      if (!canCreate) {
        throw new Error("Forbidden: Missing reporting:create permission");
      }

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

  .put(
    "/:reportId",
    async (context: any) => {
      const { params, body, currentUser } = context;
      const { reportId } = params;
      const { title, content, teamId } = body;

      const canUpdate = await checkPermission(
        currentUser.id,
        teamId,
        "reporting",
        "update"
      );

      if (!canUpdate) {
        throw new Error("Forbidden: Missing reporting:update permission");
      }

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

  .delete(
    "/:reportId",
    async (context: any) => {
      const { params, query, currentUser } = context;
      const { reportId } = params;
      const { teamId } = query;

      const canDelete = await checkPermission(
        currentUser.id,
        teamId,
        "reporting",
        "delete"
      );

      if (!canDelete) {
        throw new Error("Forbidden: Missing reporting:delete permission");
      }

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
