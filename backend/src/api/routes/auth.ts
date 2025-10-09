/**
 * AUTHENTICATION ROUTES
 * 
 * Handles user registration, passwordless authentication via email,
 * and session management.
 */

import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/db/client";
import {
  users,
  tenants,
  teams,
  sessions,
} from "../../infrastructure/db/schema";
import { 
  generatePasswordlessLink, 
  verifyPasswordlessLink 
} from "../../core/auth/passwordless-link";
import { createSession } from "../../core/auth/session";
import { getUserPermissions } from "../../core/permissions/checker";
import { eq, and, gt } from "drizzle-orm";

export const authRoutes = new Elysia({ prefix: "/auth" })

  // ============================================
  // REGISTER NEW USER
  // ============================================
  .post(
    "/register",
    async ({ body, set }: any) => {
      const { email, name, tenantName, teamName } = body;
      
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
        
      if (existingUser[0]) {
        set.status = 409;
        throw new Error("User with this email already exists");
      }
      
      // Create tenant
      const [tenant] = await db
        .insert(tenants)
        .values({ name: tenantName })
        .returning();
        
      if (!tenant) throw new Error("Failed to create tenant");

      // Create team
      const [team] = await db
        .insert(teams)
        .values({ name: teamName, tenantId: tenant.id })
        .returning();
        
      if (!team) throw new Error("Failed to create team");

      // Create user (unverified)
      const [user] = await db
        .insert(users)
        .values({
          email,
          name,
          verified: false,
          tenantId: tenant.id,
          teamId: team.id,
        })
        .returning();
        
      if (!user) throw new Error("Failed to create user");

      return {
        message: "Registration successful. Awaiting admin verification.",
        userId: user.id,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        name: t.String({ minLength: 1 }),
        tenantName: t.String({ minLength: 1 }),
        teamName: t.String({ minLength: 1 }),
      }),
    }
  )

  // ============================================
  // SEND PASSWORDLESS AUTHENTICATION LINK
  // ============================================
  .post(
    "/login",
    async ({ body, set }: any) => {
      const { email } = body;
      
      // Check user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
        
      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      // Check if user is verified
      if (!user.verified) {
        set.status = 403;
        throw new Error("Account not verified. Please contact your administrator.");
      }
      
      // Generate passwordless authentication token
      const token = await generatePasswordlessLink(email);
      
      // In development: log the authentication link
      const authLink = `http://localhost:5173/auth/verify?token=${token}`;
      console.log(`\n🔗 Passwordless Authentication Link: ${authLink}\n`);
      
      return {
        message: "Authentication link sent to your email",
        // In development mode, return the link for easy testing
        ...(process.env.NODE_ENV !== "production" && { 
          authLink,
          token 
        })
      };
    },
    {
      body: t.Object({ email: t.String({ format: "email" }) }),
    }
  )

  // ============================================
  // VERIFY PASSWORDLESS TOKEN & CREATE SESSION
  // ============================================
  .post(
    "/verify",
    async ({ body, cookie, set }: any) => {
      const { token } = body;
      
      // Verify passwordless authentication token
      const email = await verifyPasswordlessLink(token);
      
      if (!email) {
        set.status = 401;
        throw new Error("Invalid or expired authentication token");
      }
      
      // Get user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
        
      if (!user) {
        set.status = 404;
        throw new Error("User not found");
      }
      
      // Double-check verification status
      if (!user.verified) {
        set.status = 403;
        throw new Error("Account not verified");
      }
      
      // Create session
      const sessionToken = await createSession(user.id);

      // Set HTTP-only cookie
      cookie.session.value = sessionToken;
      cookie.session.httpOnly = true;
      cookie.session.secure = process.env.NODE_ENV === "production";
      cookie.session.sameSite = "lax";
      cookie.session.maxAge = 86400; // 24 hours
      cookie.session.path = "/";

      // Get user permissions
      const permissions = await getUserPermissions(user.id, user.teamId);
      
      return { 
        message: "Authentication successful", 
        user, 
        permissions, 
        sessionToken 
      };
    },
    {
      body: t.Object({ token: t.String() }),
    }
  )

  // ============================================
  // GET CURRENT USER (Protected)
  // ============================================
  .get("/me", async ({ cookie, set }: any) => {
    const sessionToken = cookie.session?.value;
    
    if (!sessionToken) {
      set.status = 401;
      throw new Error("Unauthorized: No session");
    }

    // Validate session
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
      throw new Error("Invalid or expired session");
    }
    
    const user = result[0].user;
    const permissions = await getUserPermissions(user.id, user.teamId);
    
    return { user, permissions };
  })

  // ============================================
  // LOGOUT (Protected)
  // ============================================
  .post("/logout", async ({ cookie }: any) => {
    if (cookie.session?.value) {
      // Delete session from database
      await db
        .delete(sessions)
        .where(eq(sessions.token, cookie.session.value));
      
      // Clear cookie
      cookie.session.remove();
    }
    
    return { message: "Logged out successfully" };
  });

export const protectedAuthRoutes = authRoutes;