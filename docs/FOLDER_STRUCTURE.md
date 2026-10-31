# Brightloop — Folder Structure and Development Rules

## 1. Purpose

This document defines the mandatory folder organization and code placement rules for Brightloop.

Every developer and AI coding agent must follow these conventions when creating, modifying, or extending the application.

The goal is to maintain:
- Clear separation between frontend and backend.
- Feature-based organization.
- Separation of HTTP handling, business logic, and database access.
- Consistent naming conventions.
- Independent development of modules by different team members.
- Minimal coupling between features.

**These rules are mandatory. Do not introduce alternative folder patterns without team approval.**

---

## 2. Monorepo Organization

Brightloop uses a single Git repository containing two independent applications.

```text
brightloop/
├── apps/
│   ├── backend/
│   └── frontend/
│
├── docs/
│
├── docker-compose.yml
├── package.json
├── AGENTS.md
└── README.md
```

### Rules

1. All backend application code must reside inside `apps/backend`.
2. All frontend application code must reside inside `apps/frontend`.
3. Shared project documentation belongs inside `docs`.
4. Do not mix frontend and backend source code.
5. Do not create another application or service without approval.
6. Do not create a shared package unless there is a genuine need for reusable code.

---

## 3. Backend Folder Structure

The backend follows a **modular monolith with layered architecture**.

```text
apps/backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   ├── config/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── plans/
│   │   ├── taxes/
│   │   ├── discounts/
│   │   ├── subscriptions/
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── dashboard/
│   │
│   ├── middleware/
│   │
│   ├── routes/
│   │
│   ├── lib/
│   │
│   ├── utils/
│   │
│   ├── types/
│   │
│   ├── app.ts
│   └── server.ts
│
└── tests/
```

### 3.1 Module organization

Every business feature must be organized inside its corresponding directory under `modules/`.

Example:

```text
modules/
└── customers/
    ├── customers.routes.ts
    ├── customers.controller.ts
    ├── customers.service.ts
    ├── customers.repository.ts
    ├── customers.validation.ts
    └── customers.types.ts
```

Create files only when the feature actually needs them. Do not create empty files simply to match the example.

### 3.2 Responsibilities of backend layers

| Layer | Responsibility | Must not do |
|---|---|---|
| Routes | Define endpoints and middleware | Contain business logic |
| Controller | Handle HTTP requests and responses | Directly query Prisma |
| Service | Implement business rules and workflows | Depend on Express request/response |
| Repository | Perform database operations through Prisma | Handle HTTP responses |
| Validation | Define Zod validation schemas | Perform business workflows |
| Types | Define module-specific TypeScript types | Duplicate existing shared types |

### 3.3 Mandatory request flow

All normal backend requests must follow this flow:

```text
Client Request
     ↓
Route
     ↓
Middleware
     ↓
Controller
     ↓
Service
     ↓
Repository
     ↓
Prisma ORM
     ↓
PostgreSQL
```

Do not bypass layers without a clear technical reason.

For example:
- Controllers must not contain Prisma queries.
- Routes must not contain database operations.
- Services must not send Express responses.
- Repositories must not implement HTTP status handling.

### 3.4 Backend shared directories

**config/**

Application configuration, environment validation, database configuration, and CORS configuration.

**middleware/**

Reusable Express middleware:
- Authentication.
- Role authorization.
- Request validation.
- Centralized error handling.
- Not-found handling.

**routes/**

Central API route registration. Individual module routes must be registered here.

**lib/**

Shared infrastructure clients and utilities:
- Prisma client.
- JWT utilities.
- Password hashing utilities.

**utils/**

Small, reusable application utilities:
- API response helpers.
- Application error classes.
- Async handler utilities.

**types/**

Global TypeScript declarations and Express request extensions only.

Do not place feature-specific types here.

---

## 4. Frontend Folder Structure

The frontend follows a **feature-based React architecture**.

```text
apps/frontend/
├── public/
│
└── src/
    ├── app/
    │
    ├── assets/
    │
    ├── components/
    │   ├── ui/
    │   └── common/
    │
    ├── layouts/
    │
    ├── features/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── customers/
    │   ├── products/
    │   ├── plans/
    │   ├── subscriptions/
    │   ├── invoices/
    │   └── payments/
    │
    ├── hooks/
    │
    ├── lib/
    │
    ├── services/
    │
    ├── types/
    │
    ├── styles/
    │
    └── main.tsx
```

### 4.1 Feature organization

Each frontend feature owns its pages, components, API functions, hooks, and types.

Example:

```text
features/
└── customers/
    ├── api/
    │   └── customers.api.ts
    │
    ├── components/
    │   ├── CustomerForm.tsx
    │   └── CustomerTable.tsx
    │
    ├── hooks/
    │   └── useCustomers.ts
    │
    ├── pages/
    │   ├── CustomersPage.tsx
    │   └── CustomerDetailsPage.tsx
    │
    └── types.ts
```

Create files only when required by the feature.

### 4.2 Responsibilities of frontend directories

| Directory | Responsibility |
|---|---|
| `app/` | Application setup, router, and providers |
| `assets/` | Images, icons, and static assets |
| `components/ui/` | Generic reusable UI components |
| `components/common/` | Shared application-level components |
| `layouts/` | Dashboard and authentication layouts |
| `features/` | Feature-specific UI, API, hooks, and types |
| `hooks/` | Genuinely shared React hooks |
| `lib/` | API client and shared utilities |
| `services/` | Cross-feature frontend services only |
| `types/` | Shared frontend types |
| `styles/` | Global styles and Tailwind configuration |

### 4.3 Frontend rules

1. Pages must compose components rather than contain all UI and business logic.
2. Feature-specific components must remain inside their feature.
3. Reusable generic UI components belong inside `components/ui`.
4. Feature-specific API calls must remain inside that feature's `api/` directory.
5. All backend communication must go through the shared API client.
6. API calls must not be written directly inside components.
7. Feature-specific hooks must remain inside their feature.
8. Shared hooks belong in the global `hooks/` directory.
9. Do not create unnecessary global components.
10. Do not import backend implementation files into the frontend.

---

## 5. Naming Conventions

Use consistent naming throughout the repository.

### Backend

| Item | Convention | Example |
|---|---|---|
| Directories | lowercase | `customers/` |
| Routes | feature.routes.ts | `customers.routes.ts` |
| Controllers | feature.controller.ts | `customers.controller.ts` |
| Services | feature.service.ts | `customers.service.ts` |
| Repositories | feature.repository.ts | `customers.repository.ts` |
| Validation | feature.validation.ts | `customers.validation.ts` |
| Types | feature.types.ts | `customers.types.ts` |
| Variables/functions | camelCase | `createCustomer` |
| Classes | PascalCase | `CustomerService` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |

### Frontend

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `CustomerTable.tsx` |
| Pages | PascalCase | `CustomersPage.tsx` |
| Hooks | use + camelCase | `useCustomers.ts` |
| API files | feature.api.ts | `customers.api.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Types | PascalCase | `Customer` |
| Directories | lowercase | `customers/` |

---

## 6. Module Boundaries and Dependencies

### Backend

- A module must own its business logic and database access.
- Other modules must not directly access another module's repository.
- If one module needs another module's functionality, expose a suitable service method or shared interface.
- Avoid circular dependencies.
- Keep shared utilities generic and minimal.

Example:

The billing workflow may need subscription information. It should use the subscription module's service or an explicitly agreed integration interface rather than directly importing its repository.

### Frontend

- A feature should primarily depend on its own components, hooks, and API functions.
- Shared UI components must not depend on individual business features.
- Avoid circular feature imports.
- Reuse shared components instead of duplicating generic UI.
- Keep feature-specific logic inside the relevant feature.

---

## 7. Database Ownership

Prisma schema and migrations are shared resources.

Rules:

1. `apps/backend/prisma/schema.prisma` is the source of truth for the database schema.
2. All developers must coordinate schema changes.
3. Do not independently create conflicting migrations.
4. Do not bypass Prisma by introducing another ORM.
5. Database queries belong in backend repositories.
6. Business workflows involving multiple writes must use transactions.
7. Financial calculations must use Prisma Decimal, not JavaScript floating-point arithmetic.
8. Follow `docs/DATABASE.md` for table definitions, relationships, and constraints.

---

## 8. File Creation Rules

- Do not create files before there is a genuine implementation need.
- Do not create empty placeholder files.
- Do not create unnecessary index files or barrel exports.
- Do not create duplicate utilities or types.
- Keep files focused on one responsibility.
- Avoid excessively large files; split code when responsibilities become distinct.
- Do not introduce additional architectural layers without a concrete reason.
- Follow the existing structure when extending a feature.

---

## 9. Rules for AI Coding Agents

Every AI agent working on Brightloop must:

1. Read `AGENTS.md` and this document before implementing features.
2. Inspect the existing repository structure before creating files.
3. Place every new file in its correct feature and architectural layer.
4. Reuse existing utilities and components where appropriate.
5. Never create an alternative folder pattern for convenience.
6. Never move files between modules without coordination.
7. Avoid modifying unrelated modules.
8. Avoid changing shared Prisma schema without informing the team.
9. Follow existing naming conventions.
10. Report any structural deviation and explain why it is necessary.

If a requested implementation does not fit the current structure, explain the issue before introducing a new architectural pattern.

---

## 10. Final Principle

**Organize code by business feature, separate responsibilities by architectural layer, and keep shared code minimal.**

The objective is not to create the maximum number of folders or files. It is to ensure that every file has a clear responsibility and a predictable location.