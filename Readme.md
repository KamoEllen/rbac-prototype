**Status:**  Update required (email integration, tenant creation updates)

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [Database Schema](#database-schema)
7. [Authentication Flow](#authentication-flow)
8. [Permission System](#permission-system)
9. [API Documentation](#api-documentation)
10. [Frontend Architecture](#frontend-architecture)
11. [Development Workflow](#development-workflow)
12. [Testing Guide](#testing-guide)
13. [Deployment Considerations](#deployment-considerations)

---

## Quick Start Guide

Run the application in ~5 minutes.

### Prerequisites

* PostgreSQL 14+
* Bun 1.0+
* Node.js 18+ & npm

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

## Project Overview

**Purpose:** Multi-tenant RBAC system for SaaS apps with fine-grained permissions.

**Key Features:**

* Multi-tenant isolation
* Hierarchical permissions: Tenant → Team → Group → Role → User
* Passwordless authentication
* Module-level CRUD permissions (Vault, Financials, Reporting)
* RESTful API with TypeScript type-safety

**Business Context:** Traditional RBAC systems struggle in modern SaaS. This prototype demonstrates a scalable architecture with code-level traceability.

---

## Technology Stack

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

## Project Structure

```text
saas-rbac-prototype/
├── backend/
│   ├── src/
│   │   ├── api/             # Routes & middleware
│   │   ├── core/            # Auth & permission logic
│   │   └── infrastructure/  # DB access, migrations, seeds
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
└── README.md
```

---

## High-Level Visual 

![rbac Prototype Diagram](https://github.com/KamoEllen/rbac-prototype/blob/main/diagram.png)


## Database Schema

**ER Diagram:** 

**Core Tables:** tenants, teams, users, roles, groups, user_groups, group_roles
**Auth Tables:** sessions, passwordless_links
**Module Tables:** vault_secrets, financial_transactions, reports

---

## Authentication Flow

* Passwordless login using JWTs
* Single-use tokens stored in `passwordless_links` (expires in 15 minutes)
* Frontend receives token → API verifies → JWT returned → Dashboard access

---

## Permission System

* ABAC with role aggregation: `User → Groups → Roles → Permissions`
* Example permission format:

```json
{
  "vault": ["create","read","update","delete"],
  "financials": ["read"],
  "reporting": ["create","read","update"]
}
```

* Aggregation unions permissions across all roles

---

## API Documentation (Backend)

| Endpoint     | Method   | Description                   |
| ------------ | -------- | ----------------------------- |
| /auth/login  | POST     | Request passwordless link     |
| /auth/verify | POST     | Verify token & create session |
| /users       | GET      | List users                    |
| /users       | POST     | Create user                   |
| /groups      | GET      | List groups                   |
| /roles       | GET      | List roles                    |
| /vault       | GET/POST | Vault secrets                 |
| /financials  | GET/POST | Financial transactions        |
| /reporting   | GET/POST | Reports                       |

---

## Frontend Architecture

* React SPA with login, dashboard, module pages
* Context API handles global auth state
* Components: reusable UI for modules
* Navigation: Login → Dashboard → Module → Action

---

## Development Workflow

* `bun run dev` for backend
* `npm run dev` for frontend
* Feature branches → Pull Requests → Merge

---

## Testing Guide

* Jest for unit tests
* Supertest for API integration
* Run via: `bun test`

---

## Deployment Considerations

* Environment variables: `DATABASE_URL`, `PORT`, `NODE_ENV`
* Production DB: Postgres with SSL
* Sessions: JWT in headers (can switch to HTTP-only cookies)
* CI/CD pipelines for migrations, tests, and deployment
