import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import { financialTransactions } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { verifyTeamOwnership } from "../../core/permissions/checker";

export const financialsRoutes = new Elysia({ prefix: "/financials" })
  .use(authMiddleware)

  // GET / - Read permission
  .use(requirePermission("financials", "read"))
  .get(
    "/",
    async ({ currentUser, teamId }: any) => {
      // teamId and permission check done by middleware

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

  // GET /:transactionId - Read permission
  .get(
    "/:transactionId",
    async ({ params, currentUser, teamId }: any) => {
      const { transactionId } = params;

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

  // POST / - Create permission
  .use(requirePermission("financials", "create"))
  .post(
    "/",
    async ({ body, currentUser, teamId }: any) => {
      const { amount, description } = body;

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

  // PUT /:transactionId - Update permission
  .use(requirePermission("financials", "update"))
  .put(
    "/:transactionId",
    async ({ params, body, currentUser, teamId }: any) => {
      const { transactionId } = params;
      const { amount, description } = body;

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

  // DELETE /:transactionId - Delete permission
  .use(requirePermission("financials", "delete"))
  .delete(
    "/:transactionId",
    async ({ params, currentUser, teamId }: any) => {
      const { transactionId } = params;

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