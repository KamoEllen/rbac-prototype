import { Elysia } from 'elysia';
import { db } from '../../infrastructure/db/client';
import { sessions, users } from '../../infrastructure/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { User } from '../../infrastructure/db/schema';

export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ cookie, headers, set }) => {
    let sessionToken: string | undefined;
    if (cookie.session?.value && typeof cookie.session.value === 'string') {
      sessionToken = cookie.session.value;
    }
    if (!sessionToken && headers.authorization) {
      sessionToken = headers.authorization.replace('Bearer ', '');
    }

    if (!sessionToken) {
      set.status = 401;
      throw new Error('Unauthorized: No session');
    }
    const result = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.token, sessionToken),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!result[0]) {
      set.status = 401;
      throw new Error('Unauthorized: Invalid or expired session');
    }

    if (!result[0].user.verified) {
      set.status = 403;
      throw new Error('Forbidden: User not verified');
    }

    return {
      currentUser: result[0].user as User,
    };
  });