import { nanoid } from 'nanoid';
import { db } from '../../infrastructure/db/client';
import { passwordlessLinks } from '../../infrastructure/db/schema';
import { eq, and } from 'drizzle-orm';

export async function generatePasswordlessLink(
  email: string,
  expiresInMinutes: number = 15
): Promise<string> {

  const token = nanoid(32);
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  await db.insert(passwordlessLinks).values({
    email,
    token,
    expiresAt,
    used: false,
  });
  
  return token;
}

export async function verifyPasswordlessLink(token: string): Promise<string | null> {
  const [link] = await db
    .select()
    .from(passwordlessLinks)
    .where(
      and(
        eq(passwordlessLinks.token, token),
        eq(passwordlessLinks.used, false)
      )
    )
    .limit(1);
  
  if (!link || link.expiresAt < new Date()) {
    return null;
  }
  
  await db
    .update(passwordlessLinks)
    .set({ used: true })
    .where(eq(passwordlessLinks.id, link.id));
  
  return link.email;
}

export async function cleanupExpiredLinks(): Promise<void> {
  await db
    .delete(passwordlessLinks)
    .where(eq(passwordlessLinks.expiresAt, new Date()));
}
