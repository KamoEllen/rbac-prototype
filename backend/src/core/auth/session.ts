import { nanoid } from 'nanoid';
import { db } from '../../infrastructure/db/client';
import { sessions } from '../../infrastructure/db/schema';
import { eq } from 'drizzle-orm';

export async function createSession(
  userId: string,
  expiresInHours: number = 24
): Promise<string> {
  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);
  
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });
  
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}