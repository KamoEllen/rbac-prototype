# SaaS RBAC Prototype - Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Decisions](#architecture--design-decisions)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [Database Schema](#database-schema)
7. [Authentication Flow](#authentication-flow)
8. [Permission System](#permission-system)
9. [API Documentation](#api-documentation)
10. [Frontend Architecture](#frontend-architecture)
11. [Trade-offs & Considerations](#trade-offs--considerations)
12. [Development Workflow](#development-workflow)
13. [Testing Guide](#testing-guide)
14. [Deployment Considerations](#deployment-considerations)

---

## Project Overview

### Purpose

This is a proof-of-concept multi-tenant SaaS application demonstrating Role-Based Access Control (RBAC) with granular permissions. The system allows organizations to manage users, teams, groups, and roles, while enforcing fine-grained access control across different modules (Vault, Financials, Reporting).

### Key Features

- Multi-tenant architecture with complete data isolation
- Hierarchical permission structure (Tenant → Team → Group → Role → User)
- Passwordless authentication using passwordless links
- Module-based permissions with CRUD-level granularity
- RESTful API with type-safe endpoints
- Modern, responsive single-page application frontend

### Business Context

Traditional RBAC systems often struggle with the complexity of modern SaaS applications where:
- Organizations need tenant-level data isolation
- Teams within organizations require different access levels
- Permission requirements change frequently
- Users may belong to multiple groups with cumulative permissions

This prototype addresses these challenges with a flexible, scalable architecture.

---

## Architecture & Design Decisions

### Architectural Pattern: Monorepo with Separated Concerns

**Decision:** Separate backend and frontend into distinct directories within a single repository.

**Rationale:**
- Simplifies development workflow and dependency management
- Maintains clear separation between API and UI concerns
- Easier to version and deploy independently if needed
- Single source of truth for type definitions

**Trade-offs:**
- Slightly larger repository size
- Need to run two development servers
- Consider: Could be split into microservices for production scale

### Backend Architecture: Layered Architecture

```
┌─────────────────────────────────────┐
│         API Layer (Routes)          │  HTTP endpoints, validation
├─────────────────────────────────────┤
│      Application Layer (Core)       │  Business logic, auth, permissions
├─────────────────────────────────────┤
│   Infrastructure Layer (Database)   │  Data access, schema, migrations
└─────────────────────────────────────┘
```

**Benefits:**
- Clear separation of concerns
- Easier testing (can mock layers)
- Business logic independent of HTTP framework
- Database implementation can be swapped

**Implementation Details:**

1. **API Layer** (`src/api/routes/`)
   - Handles HTTP requests/responses
   - Input validation using Elysia's type system
   - Route-specific middleware
   - Error handling and status codes

2. **Application Layer** (`src/core/`)
   - Pure business logic functions
   - Authentication mechanisms
   - Permission checking algorithms
   - No HTTP or database dependencies

3. **Infrastructure Layer** (`src/infrastructure/`)
   - Database schema definitions
   - Query builders using Drizzle ORM
   - Migration management
   - Database connection pooling

### Frontend Architecture: Context + Component Pattern

**Decision:** Use React Context for global state (auth) and local state for component-specific data.

**Rationale:**
- Context API sufficient for this scale (no Redux needed)
- Local state prevents unnecessary re-renders
- Clear data flow and predictable state updates
- No additional dependencies required

**Trade-offs:**
- Context causes re-renders of all consumers
- Considered: Could use Zustand or React Query for larger apps
- Performance: Acceptable for this prototype's scale

---

## Technology Stack

### Backend Stack

#### Bun Runtime (v1.0+)
**Released:** September 2023  
**Choice Rationale:**
- Drop-in Node.js replacement with significantly faster startup times
- Built-in TypeScript support (no compilation step needed)
- Integrated test runner and package manager
- Native performance benefits for I/O operations

**Trade-offs:**
- Newer ecosystem, fewer production deployments
- Some Node.js packages may have compatibility issues
- Considered: Node.js v20 LTS for more conservative choice

**Production Consideration:** For production, consider Node.js v20+ if ecosystem maturity is prioritized.

#### Elysia.js (v0.8+)
**Released:** 2023  
**Choice Rationale:**
- Built specifically for Bun runtime
- Type-safe API with excellent TypeScript inference
- Extremely fast (benchmarks show 3x faster than Express)
- Minimal boilerplate with functional patterns

**Trade-offs:**
- Young framework with smaller community
- Less third-party middleware available
- Considered: Fastify or Hono for more mature ecosystems

**Key Features Used:**
- Schema validation with TypeBox
- Context-based middleware
- Plugin system for modularity
- Built-in CORS and cookie handling

#### PostgreSQL (v14+)
**Released:** September 2021 (v14)  
**Choice Rationale:**
- Industry-standard relational database
- ACID compliance critical for RBAC data integrity
- JSON/JSONB support for flexible permission structures
- Mature ecosystem with excellent tooling

**Trade-offs:**
- More complex setup than SQLite
- Requires separate database server
- Considered: SQLite for simpler development, MongoDB for flexibility

**Why Not NoSQL:**
- RBAC requires complex relationships (users, groups, roles)
- Need for transactions and referential integrity
- Query complexity benefits from SQL joins

#### Drizzle ORM (v0.29+)
**Released:** 2023  
**Choice Rationale:**
- TypeScript-first with excellent type inference
- Lightweight (no runtime overhead)
- SQL-like syntax (easier to understand)
- Schema-driven migrations

**Trade-offs:**
- Newer than Prisma or TypeORM
- Smaller community and documentation
- Considered: Prisma for more features, TypeORM for maturity

**Comparison with Prisma:**
```typescript
// Drizzle (SQL-like, lighter)
await db.select().from(users).where(eq(users.id, userId));

// Prisma (ORM-style, heavier)
await prisma.user.findUnique({ where: { id: userId } });
```

#### Nanoid (v5+)
**Released:** 2023  
**Choice Rationale:**
- Generates secure, URL-safe unique IDs
- Smaller than UUID (21 characters vs 36)
- Cryptographically secure
- Used for session tokens and passwordless links

### Frontend Stack

#### React (v18.2)
**Released:** March 2022  
**Choice Rationale:**
- Industry standard for SPAs
- Mature ecosystem and tooling
- Concurrent rendering features
- Large community and resources

**Key Features Used:**
- Hooks (useState, useEffect, useContext)
- Context API for global state
- Functional components only
- React Router for navigation

#### TypeScript (v5.2+)
**Released:** 2023  
**Choice Rationale:**
- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Easier refactoring
- Self-documenting code

**Configuration:**
```json
{
  "strict": true,              // Enable all strict checks
  "noUnusedLocals": true,      // Catch unused variables
  "noImplicitReturns": true    // Ensure all code paths return
}
```

#### Vite (v5.0+)
**Released:** 2023  
**Choice Rationale:**
- Extremely fast development server (ESM-based)
- Hot Module Replacement (HMR) in milliseconds
- Optimized production builds
- Better than Create React App for modern development

**Trade-offs:**
- Different from traditional webpack setup
- Some older libraries may need configuration
- Considered: Next.js for SSR, but not needed for this SPA

#### React Router (v6.20)
**Released:** 2023  
**Choice Rationale:**
- Standard routing library for React
- Declarative routing pattern
- Code splitting support
- Protected routes implementation

#### Axios (v1.6+)
**Released:** 2023  
**Choice Rationale:**
- Promise-based HTTP client
- Interceptors for auth headers
- Better error handling than fetch
- Request/response transformation

**Comparison with Fetch:**
```javascript
// Axios: Automatic JSON parsing, error handling
const { data } = await axios.get('/api/users');

// Fetch: Manual handling required
const res = await fetch('/api/users');
if (!res.ok) throw new Error();
const data = await res.json();
```

#### Lucide React (v0.294)
**Released:** 2023  
**Choice Rationale:**
- Modern icon library (fork of Feather)
- Tree-shakeable (only import used icons)
- Consistent design language
- TypeScript support

---

## Project Structure

```
saas-rbac-prototype/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              # Session validation
│   │   │   │   └── permission.ts        # Permission checking
│   │   │   └── routes/
│   │   │       ├── auth.ts              # Authentication endpoints
│   │   │       ├── admin.ts             # User verification
│   │   │       ├── users.ts             # User CRUD
│   │   │       ├── teams.ts             # Team management
│   │   │       ├── groups.ts            # Group management
│   │   │       ├── roles.ts             # Role management
│   │   │       ├── vault.ts             # Vault module
│   │   │       ├── financials.ts        # Financial module
│   │   │       └── reporting.ts         # Reporting module
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── passwordless-link.ts link generation/validation
│   │   │   │   └── session.ts           # Session management
│   │   │   └── permissions/
│   │   │       └── checker.ts           # Permission calculation
│   │   ├── infrastructure/
│   │   │   └── db/
│   │   │       ├── client.ts            # Database connection
│   │   │       ├── schema.ts            # Drizzle schema definitions
│   │   │       ├── seed.ts              # Initial data population
│   │   │       └── migrations/          # Database migrations
│   │   └── index.ts                     # Server entry point
│   ├── drizzle.config.ts                # ORM configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx               # App layout with sidebar
│   │   ├── context/
│   │   │   └── AuthContext.tsx          # Global auth state
│   │   ├── lib/
│   │   │   └── api.ts                   # Axios configuration & types
│   │   ├── pages/
│   │   │   ├── Login.tsx                # Login page
│   │   │   ├── VerifyToken.tsx          # passwordless link verification
│   │   │   ├── Users.tsx                # User management
│   │   │   ├── Teams.tsx                # Team management
│   │   │   ├── Groups.tsx               # Group management
│   │   │   ├── Roles.tsx                # Role management
│   │   │   ├── Vault.tsx                # Vault secrets
│   │   │   ├── Financials.tsx           # Financial transactions
│   │   │   ├── Reporting.tsx            # Reports
│   │   │   └── Admin.tsx                # Admin functions
│   │   ├── App.tsx                      # Root component
│   │   ├── main.tsx                     # React entry point
│   │   └── index.css                    # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── README.md
```

### Directory Organization Philosophy

**Backend:**
- `api/`: All HTTP concerns (routes, middleware, validation)
- `core/`: Pure business logic (no HTTP or DB dependencies)
- `infrastructure/`: External dependencies (database, email, etc.)

**Frontend:**
- `components/`: Reusable UI components
- `context/`: Global state management
- `lib/`: Shared utilities and configurations
- `pages/`: Route-specific components

This structure follows **Clean Architecture** principles:
- Inner layers (core) don't depend on outer layers (api, infrastructure)
- Easy to test business logic in isolation
- Infrastructure can be swapped without affecting business logic

---

## Setup Instructions

### Prerequisites

Install the following software:

1. **PostgreSQL 14+**
   - Windows: Download from postgresql.org
   - macOS: `brew install postgresql@14`
   - Linux: `sudo apt-get install postgresql-14`

2. **Bun 1.0+**
   ```bash
   # Windows (PowerShell)
   powershell -c "irm bun.sh/install.ps1 | iex"
   
   # macOS/Linux
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Node.js 18+ & npm** (for frontend)
   - Download from nodejs.org
   - Verify: `node --version` and `npm --version`

### Database Setup

1. **Start PostgreSQL service:**
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # macOS
   brew services start postgresql@14
   
   # Linux
   sudo systemctl start postgresql
   ```

2. **Create database:**
   ```bash
   psql -U postgres
   ```
   
   In psql console:
   ```sql
   CREATE DATABASE saas_rbac;
   CREATE USER saas_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE saas_rbac TO saas_user;
   \q
   ```

3. **Configure environment variables:**
   
   Create `backend/.env`:
   ```env
   DATABASE_URL=postgresql://saas_user:your_secure_password@localhost:5432/saas_rbac
   PORT=3000
   NODE_ENV=development
   ```

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   bun install
   ```

2. **Generate and apply migrations:**
   ```bash
   # Generate migration files
   bun run db:generate
   
   # Apply migrations to database
   bun run db:push
   ```

3. **Seed initial data:**
   ```bash
   bun run db:seed
   ```
   
   This creates:
   - 1 tenant (Acme Corporation)
   - 2 teams (Engineering, Finance)
   - 4 roles (Admin, Vault Editor, Finance Viewer, Reporting Editor)
   - 2 groups (Engineering Admins, Finance Viewers)
   - 3 users (admin@acme.com, finance@acme.com, pending@acme.com)

4. **Start development server:**
   ```bash
   bun run dev
   ```
   
   Server runs at: http://localhost:3000

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Application runs at: http://localhost:5173

### Verify Setup

1. **Backend health check:**
   ```bash
   curl http://localhost:3000/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-08T12:00:00.000Z"
   }
   ```

2. **Frontend access:**
   - Navigate to http://localhost:5173
   - Should see login page

3. **Test login:**
   - Email: `admin@acme.com`
   - Check backend console for passwordless link token
   - Click "Verify Now" or paste token in URL

### Database Inspection

View data using Drizzle Studio:
```bash
cd backend
bun run db:studio
```

Opens at: https://local.drizzle.studio

---

## Database Schema

### Schema Design Philosophy

The schema implements a hierarchical multi-tenant RBAC system:

```
Tenant (Organization)
  └── Teams (Departments)
      ├── Groups (Role Collections)
      │   └── Roles (Permission Sets)
      └── Users (Individual Accounts)
```

### Entity Relationship Diagram

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│ Tenants  │───┬───│  Teams   │───┬───│  Users   │
└──────────┘   │   └──────────┘   │   └──────────┘
               │                   │
               │   ┌──────────┐   │   ┌──────────┐
               └───│  Groups  │───┴───│UserGroups│
                   └──────────┘       └──────────┘
                        │
                        │             ┌──────────┐
                        └─────────────│GroupRoles│
                                      └──────────┘
                                           │
                                      ┌──────────┐
                                      │  Roles   │
                                      └──────────┘
```

### Core Tables

#### tenants
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Top-level organization container for complete data isolation.

**Design Decision:** UUID primary keys for:
- Non-sequential, harder to guess
- Distributed system friendly
- No collision risk

#### teams
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Organizational units within a tenant (e.g., Engineering, Finance).

**Cascade Delete:** When tenant is deleted, all teams are automatically removed.

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Individual user accounts.

**Key Fields:**
- `verified`: Admin approval required before login
- `tenant_id`: Enforces tenant isolation
- `team_id`: Associates user with organizational unit

**Design Decision:** No password field (passwordless authentication).

#### roles
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Permission templates defining what actions are allowed.

**Permissions Structure:**
```json
{
  "vault": ["create", "read", "update", "delete"],
  "financials": ["read"],
  "reporting": ["create", "read", "update"]
}
```

**Design Decision:** JSONB for flexibility:
- Can add new modules without schema changes
- Efficient querying with PostgreSQL JSONB operators
- Trade-off: Less rigid than junction tables

#### groups
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Collections of users sharing the same roles.

**Why Groups?**
- Simplifies permission management (assign role once to group)
- Users can belong to multiple groups (cumulative permissions)
- Easier to manage than individual user-role assignments

#### user_groups (Junction Table)
```sql
CREATE TABLE user_groups (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);
```

**Purpose:** Many-to-many relationship between users and groups.

**Composite Primary Key:** Ensures a user can't be added to the same group twice.

#### group_roles (Junction Table)
```sql
CREATE TABLE group_roles (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (group_id, role_id)
);
```

**Purpose:** Many-to-many relationship between groups and roles.

### Authentication Tables

#### sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Active user sessions after successful authentication.

**Token:** Generated using nanoid (cryptographically secure, URL-safe).

**Expiration:** 24 hours by default, configurable per session.

#### passwordless_links
```sql
CREATE TABLE passwordless_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Temporary authentication links for passwordless login.

**Security Features:**
- Short expiration (15 minutes)
- Single-use tokens
- Secure token generation

### Module Tables

#### vault_secrets
```sql
CREATE TABLE vault_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Secure storage for API keys, passwords, and other secrets.

**Security Note:** In production, `value` should be encrypted at rest.

#### financial_transactions
```sql
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount TEXT NOT NULL,
  description TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Financial records requiring strict access control.

**Design Decision:** Amount stored as TEXT:
- Avoids floating-point precision issues
- Application handles parsing and formatting
- Consider: NUMERIC(19,4) for production

#### reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Business reports with team-level access control.

### Indexes

```sql
-- Improve query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_teams_tenant_id ON teams(tenant_id);
CREATE INDEX idx_groups_team_id ON groups(team_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_passwordless_links_token ON passwordless_links(token);
```

**Rationale:**
- Email lookups during login
- Tenant isolation queries
- Session validation
- passwordless link verification

---

## Authentication Flow

### passwordless Link Authentication

**Design Decision:** Passwordless authentication using passwordless links.

**Benefits:**
- Better UX (no password to remember)
- Reduced security risk (no password storage)
- Simpler implementation
- Mobile-friendly

**Trade-offs:**
- Requires email infrastructure
- Not suitable for offline scenarios
- User must have email access

### Flow Diagram

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │  1. Enter Email     │                     │                     │
 ├────────────────────>│                     │                     │
 │                     │  2. POST /auth/login│                     │
 │                     ├────────────────────>│                     │
 │                     │                     │  3. Check user      │
 │                     │                     ├────────────────────>│
 │                     │                     │<────────────────────┤
 │                     │                     │  4. Generate token  │
 │                     │                     │  5. Store passwordless link│
 │                     │                     ├────────────────────>│
 │                     │<────────────────────┤                     │
 │                     │  6. Return token    │                     │
 │<────────────────────┤                     │                     │
 │  7. Click link      │                     │                     │
 │  /verify?token=...  │                     │                     │
 ├────────────────────>│                     │                     │
 │                     │  8. POST /auth/verify                     │
 │                     ├────────────────────>│                     │
 │                     │                     │  9. Validate token  │
 │                     │                     ├────────────────────>│
 │                     │                     │<────────────────────┤
 │                     │                     │ 10. Create session  │
 │                     │                     ├────────────────────>│
 │                     │<────────────────────┤                     │
 │                     │ 11. Session token   │                     │
 │<────────────────────┤     + user data     │                     │
 │  12. Redirect       │                     │                     │
 │   to dashboard      │                     │                     │
```

### Implementation Details

#### 1. Passwordless Link Generation (`src/core/auth/passwordless-link.ts`)

```typescript
export async function generatePasswordlessLink(email: string): Promise<string> {
  // Generate secure token
  const token = nanoid(32); // 32 character URL-safe string
  
  // Set expiration (15 minutes)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  
  // Store in database
  await db.insert(passwordlessLinks).values({
    email,
    token,
    expiresAt,
    used: false,
  });
  
  return token;
}
```

**Security Considerations:**
- Token entropy: 32 characters = 2^160 possibilities
- Short expiration: 15 minutes limits attack window
- Single-use: Token invalidated after verification

#### 2. Token Verification (`src/core/auth/passwordless_links`)

```typescript
export async function verifyPasswordlessLink(token: string): Promise<string | null> {
  const [link] = await db
    .select()
    .from(passwordlessLinks)
    .where(eq(passwordlessLinks.token, token))
    .limit(1);
  
  if (!link) return null;
  if (link.used) return null;
  if (new Date() > link.expiresAt) return null;
  
  // Mark as used
  await db
    .update(passwordlessLinks)
    .set({ used: true })
    .where(eq(passwordlessLinks.token, token));
  
  return link.email;
}
```

**Validation Steps:**
1. Token exists in database
2. Token not already used
3. Token not expired
4. Mark token as used (prevent replay)

#### 3. Session Creation (`src/core/auth/session.ts`)

```typescript
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
```

**Session Management:**
- Long-lived (24 hours default)
- Sent as Authorization header
- Alternative: HTTP-only cookies (more secure but CSRF concerns)

#### 4. Authentication Middleware (`src/api/middleware/auth.ts`)

```typescript
export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ headers, set }) => {
    // Extract token from Authorization header
    let sessionToken = headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      set.status = 401;
      throw new Error('Unauthorized: No session');
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
      throw new Error('Unauthorized: Invalid session');
    }
    
    // Check user verification status
    if (!result[0].user.verified) {
      set.status = 403;
      throw new Error('Forbidden: User not verified');
    }
    
    // Inject user into request context
    return { currentUser: result[0].user };
  });
```

**Middleware Benefits:**
- Runs before all protected routes
- Adds `currentUser` to request context
- Centralizes authentication logic
- Consistent error handling

---

## Permission System

### Permission Model

**Design:** Attribute-Based Access Control (ABAC) with role aggregation.

**Structure:**
```
User → Groups → Roles → Permissions
```

**Permission Format:**
```typescript
{
  module: 'vault' | 'financials' | 'reporting',
  actions: ['create', 'read', 'update', 'delete']
}
```

### Permission Calculation Algorithm

**Location:** `src/core/permissions/checker.ts`

```typescript
export async function getUserPermissions(
  userId: string,
  teamId: string
): Promise<Permissions> {
  // 1. Get all groups user belongs to
  const userGroupsData = await db
    .select({ groupId: userGroups.groupId })
    .from(userGroups)
    .where(eq(userGroups.userId, userId));
  
  const groupIds = userGroupsData.map(ug => ug.groupId);
  
  // 2. Get all roles assigned to those groups
  const groupRolesData = await db
    .select({ 
      roleId: groupRoles.roleId,
      permissions: roles.permissions 
    })
    .from(groupRoles)
    .innerJoin(roles, eq(groupRoles.roleId, roles.id))
    .where(inArray(groupRoles.groupId, groupIds));
  
  // 3. Aggregate permissions (union of all roles)
  const aggregated: Permissions = {
    vault: [],
    financials: [],
    reporting: []
  };
  
  for (const role of groupRolesData) {
    for (const [module, actions] of Object.entries(role.permissions)) {
      const existing = new Set(aggregated[module]);
      for (const action of actions) {
        existing.add(action);
      }
      aggregated[module] = Array.from(existing);
    }
  }
  
  return aggregated;
}