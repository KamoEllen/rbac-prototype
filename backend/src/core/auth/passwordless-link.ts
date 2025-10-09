/**
 * PASSWORDLESS AUTHENTICATION
 * 
 * Generates and validates one-time authentication tokens
 * delivered via email for passwordless login flow.
 */

import { nanoid } from 'nanoid';
import { db } from '../../infrastructure/db/client';
import { passwordlessLinks } from '../../infrastructure/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a secure one-time authentication token
 * 
 * @param email - User email address
 * @param expiresInMinutes - Token validity period (default: 15 minutes)
 * @returns Cryptographically secure token string
 */
export async function generatePasswordlessLink(
  email: string,
  expiresInMinutes: number = 15
): Promise<string> {
  // Generate 32-character URL-safe token (2^160 entropy)
  const token = nanoid(32);
  
  // Set expiration timestamp
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
  
  // Store token with constraints
  await db.insert(passwordlessLinks).values({
    email,
    token,
    expiresAt,
    used: false,
  });
  
  return token;
}

/**
 * Verify and consume a one-time authentication token
 * 
 * @param token - Token to verify
 * @returns User email if valid, null otherwise
 */
export async function verifyPasswordlessLink(token: string): Promise<string | null> {
  // Fetch unused token
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
  
  // Validate existence and expiration
  if (!link || link.expiresAt < new Date()) {
    return null;
  }
  
  // Mark as used (single-use enforcement)
  await db
    .update(passwordlessLinks)
    .set({ used: true })
    .where(eq(passwordlessLinks.id, link.id));
  
  return link.email;
}

/**
 * Clean up expired authentication tokens
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredLinks(): Promise<void> {
  await db
    .delete(passwordlessLinks)
    .where(eq(passwordlessLinks.expiresAt, new Date()));
}