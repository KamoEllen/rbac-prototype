

**Category:** Backend
**Status:** Prototype / Update required (email integration and updating tenant creation)

---

## **Table of Contents**

1. [Quick Start Guide](#quick-start-guide)
2. [Project Overview](#project-overview)
3. [Architecture & Design Decisions](#architecture--design-decisions)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Setup Instructions](#setup-instructions)
7. [Database Schema](#database-schema)
8. [Authentication Flow](#authentication-flow)
9. [Permission System](#permission-system)
10. [API Documentation](#api-documentation)
11. [Frontend Architecture](#frontend-architecture)
12. [Trade-offs & Considerations](#trade-offs--considerations)
13. [Development Workflow](#development-workflow)
14. [Testing Guide](#testing-guide)
15. [Deployment Considerations](#deployment-considerations)

---

## **Quick Start Guide**

Get the application running in ~5 minutes.

### Prerequisites

* PostgreSQL 14+
* Bun 1.0+
* Node.js 18+ & npm (for frontend)

### Steps

1. **Clone Repository & Create DB**

```bash
git clone https://github.com/KamoEllen/rbac-prototype
cd saas-rbac-prototype
psql -U postgres -c "CREATE DATABASE saas_rbac;"
```

2. **Setup Backend**

```bash
cd backend
cat > .env << EOF
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/saas_rbac
PORT=3000
NODE_ENV=development
EOF

bun install
bun run db:push
bun run db:seed
bun run dev
```

Backend runs at: `http://localhost:3000`

3. **Setup Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

4. **Test Login**

* Email: `admin@acme.com` (full access)
* Click "Send Authentication Link", check backend for token, verify

5. **Optional DB Reset**

```bash
cd backend
psql -U postgres -c "DROP DATABASE saas_rbac;"
psql -U postgres -c "CREATE DATABASE saas_rbac;"
bun run db:push
bun run db:seed
```

---

## **Project Overview**

**Purpose:** Multi-tenant RBAC system for SaaS applications with fine-grained permissions.

**Key Features:**

* Multi-tenant isolation
* Hierarchical permissions: Tenant → Team → Group → Role → User
* Passwordless authentication
* Module-level CRUD permissions (Vault, Financials, Reporting)
* RESTful API with TypeScript type-safety

**Business Context:** Traditional RBAC struggles in modern SaaS where tenants, teams, and dynamic permissions need flexibility. This prototype demonstrates a scalable architecture.

---

## **Architecture & Design Decisions**

### **Backend Architecture (Layered)**

```mermaid
graph TD
A[API Layer (Routes)] --> B[Application Layer (Core)]
B --> C[Infrastructure Layer (Database)]
C --> D[(PostgreSQL)]
```

* API Layer: HTTP endpoints, validation, middleware
* Application Layer: Pure business logic, auth, permissions
* Infrastructure Layer: DB access via Drizzle ORM

**Frontend Architecture (Context + Component)**

```mermaid
graph TD
App --> AuthContext
App --> Pages
Pages --> Dashboard
Dashboard --> ModuleA
Dashboard --> ModuleB
```

**Decision:** React Context sufficient for global state; local state for components.

**Trade-offs:** Slight re-render overhead; could use Zustand/React Query for larger apps.

---

## **Technology Stack**

| Layer         | Tool / Version          | Purpose                   |
| ------------- | ----------------------- | ------------------------- |
| Backend       | Bun 1.0+                | Runtime                   |
| API Framework | Elysia.js 0.8+          | Type-safe API             |
| Database      | PostgreSQL 14+          | Relational DB             |
| ORM           | Drizzle ORM 0.29+       | TypeScript-first ORM      |
| Auth          | Nanoid 5+               | Token generation          |
| Frontend      | React 18.2 + TypeScript | SPA UI & state management |
| HTTP Client   | Axios 1.6+              | API requests              |
| Testing       | Jest / Supertest        | Unit & integration tests  |

---

## **Project Structure**

```text
saas-rbac-prototype/
├── backend/
│   ├── src/
│   │   ├── api/             # Routes & middleware
│   │   ├── core/            # Auth & permission logic
│   │   └── infrastructure/  # DB, migrations, seeds
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
└── README.md
```

---

## **Setup Instructions**

* See **Quick Start Guide** above
* Backend: `bun run dev`
* Frontend: `npm run dev`

---

## **Database Schema**

### **ER Diagram**

```mermaid
erDiagram
TENANTS ||--o{ TEAMS : contains
TEAMS ||--o{ USERS : has
TEAMS ||--o{ GROUPS : has
GROUPS ||--o{ USER_GROUPS : contains
GROUPS ||--o{ GROUP_ROLES : links_to
ROLES ||--o{ GROUP_ROLES : linked_to
PERMISSIONS ||--o{ ROLES : assigned_to
```

**Core Tables:** tenants, teams, users, roles, groups, user_groups, group_roles
**Auth Tables:** sessions, passwordless_links
**Module Tables:** vault_secrets, financial_transactions, reports

---

## **Authentication Flow**

```mermaid
sequenceDiagram
User->>Frontend: Enter email
Frontend->>Backend: POST /auth/login
Backend->>DB: Create passwordless token
Backend-->>User: Send login link
User->>Frontend: Click link
Frontend->>Backend: POST /auth/verify
Backend->>DB: Validate token
Backend->>DB: Create session
Backend-->>User: Return JWT
User->>Frontend: Redirect to dashboard
```

* Tokens generated via Nanoid, expire in 15 minutes
* Single-use, stored in `passwordless_links`

---

## **Permission System**

* ABAC model with role aggregation: `User → Groups → Roles → Permissions`
* Permission format example:

```json
{
  "vault": ["create","read","update","delete"],
  "financials": ["read"],
  "reporting": ["create","read","update"]
}
```

* Aggregation algorithm unions permissions across all user roles.

---

## **API Documentation (Backend)**

| Endpoint     | Method   | Description                     |
| ------------ | -------- | ------------------------------- |
| /auth/login  | POST     | Request passwordless link       |
| /auth/verify | POST     | Verify token and create session |
| /users       | GET      | List users                      |
| /users       | POST     | Create user                     |
| /groups      | GET      | List groups                     |
| /roles       | GET      | List roles                      |
| /vault       | GET/POST | Vault secrets                   |
| /financials  | GET/POST | Financial transactions          |
| /reporting   | GET/POST | Reports                         |

---

## **Frontend Architecture**

* React SPA with pages for login, dashboard, modules
* Context API handles global auth state
* Components: reusable UI for modules
* Navigation: Login → Dashboard → Module → Action

---

## **Trade-offs & Considerations**

* Monorepo simplifies dev but larger repo size
* Passwordless auth requires email access
* Drizzle ORM lightweight but smaller ecosystem
* Context API fine for prototype scale

---

## **Development Workflow**

* `bun run dev` for backend
* `npm run dev` for frontend
* Feature branches → Pull Requests → Merge

---

## **Testing Guide**

* Jest for unit tests
* Supertest for API integration
* Run via: `bun test`

---

## **Deployment Considerations**

* Environment variables: `DATABASE_URL`, `PORT`, `NODE_ENV`
* Production DB: Postgres with SSL
* Sessions: JWT in headers; can switch to HTTP-only cookies
* Use CI/CD for migrations, tests, and deployment

