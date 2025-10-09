import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { financialTransactions } from "../../infrastructure/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import {
  checkPermission,
  verifyTeamOwnership,
} from "../../core/permissions/checker";

export const financialsRoutes = new Elysia({ prefix: "/financials" })
  .use(authMiddleware)
  .get(
    "/",
    async (context: any) => {
      const { query, currentUser } = context;
      const { teamId } = query;

      const canRead = await checkPermission(
        currentUser.id,
        teamId,
        "financials",
        "read"
      );

      if (!canRead) {
        throw new Error("Forbidden: Missing financials:read permission");
      }

      const transactions = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.teamId, teamId));

      return transactions;
    },
    {
      query: t.Object({
        teamId: t.String(),
      }),
    }
  )
  .get(
    "/:transactionId",
    async (context: any) => {
      const { params, query, currentUser } = context;
      const { transactionId } = params;
      const { teamId } = query;

      const canRead = await checkPermission(
        currentUser.id,
        teamId,
        "financials",
        "read"
      );

      if (!canRead) {
        throw new Error("Forbidden: Missing financials:read permission");
      }

      const [transaction] = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.id, transactionId))
        .limit(1);

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      verifyTeamOwnership(transaction.teamId, teamId);

      return transaction;
    },
    {
      params: t.Object({ transactionId: t.String() }),
      query: t.Object({ teamId: t.String() }),
    }
  )
  .post(
    "/",
    async (context: any) => {
      const { body, currentUser } = context;
      const { amount, description, teamId } = body;

      const canCreate = await checkPermission(
        currentUser.id,
        teamId,
        "financials",
        "create"
      );

      if (!canCreate) {
        throw new Error("Forbidden: Missing financials:create permission");
      }

      const [transaction] = await db
        .insert(financialTransactions)
        .values({
          amount,
          description,
          teamId,
          createdBy: currentUser.id,
        })
        .returning();

      return transaction;
    },
    {
      body: t.Object({
        amount: t.String(),
        description: t.String(),
        teamId: t.String(),
      }),
    }
  )
  .put(
    "/:transactionId",
    async (context: any) => {
      const { params, body, currentUser } = context;
      const { transactionId } = params;
      const { amount, description, teamId } = body;

      const canUpdate = await checkPermission(
        currentUser.id,
        teamId,
        "financials",
        "update"
      );

      if (!canUpdate) {
        throw new Error("Forbidden: Missing financials:update permission");
      }

      const [existing] = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.id, transactionId))
        .limit(1);

      if (!existing) {
        throw new Error("Transaction not found");
      }

      verifyTeamOwnership(existing.teamId, teamId);

      const [transaction] = await db
        .update(financialTransactions)
        .set({
          amount,
          description,
          updatedAt: new Date(),
        })
        .where(eq(financialTransactions.id, transactionId))
        .returning();

      return transaction;
    },
    {
      params: t.Object({ transactionId: t.String() }),
      body: t.Object({
        amount: t.String(),
        description: t.String(),
        teamId: t.String(),
      }),
    }
  )

  .delete(
    "/:transactionId",
    async (context: any) => {
      const { params, query, currentUser } = context;
      const { transactionId } = params;
      const { teamId } = query;

      const canDelete = await checkPermission(
        currentUser.id,
        teamId,
        "financials",
        "delete"
      );

      if (!canDelete) {
        throw new Error("Forbidden: Missing financials:delete permission");
      }

      const [existing] = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.id, transactionId))
        .limit(1);

      if (!existing) {
        throw new Error("Transaction not found");
      }

      verifyTeamOwnership(existing.teamId, teamId);

      await db
        .delete(financialTransactions)
        .where(eq(financialTransactions.id, transactionId));

      return { message: "Transaction deleted successfully" };
    },
    {
      params: t.Object({ transactionId: t.String() }),
      query: t.Object({ teamId: t.String() }),
    }
  );
