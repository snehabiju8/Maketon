# Brightloop — AI Agent Instructions

## 1. Project Context

Brightloop is a subscription management and billing system.

Before implementing any feature, read:

- `docs/PRD.md` — Product requirements and MVP scope.
- `docs/ARCHITECTURE.md` — System architecture and technology stack.
- `docs/DATABASE.md` — Database schema and relationships.
- `docs/API_SPEC.md` — API contracts and conventions.

Follow these documents as the source of truth.

## 2. Technology Stack

Use only the agreed project stack:

- Frontend: React, TypeScript, Tailwind CSS.
- Backend: Node.js, Express.js, TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- Validation: Zod.
- Testing: Vitest and Supertest.
- Local environment: Docker Compose.

Do not introduce additional frameworks, libraries, databases, or infrastructure without team approval.

## 3. Development Rules

1. Use TypeScript throughout the application.
2. Follow the existing folder structure and coding conventions.
3. Keep the backend as a modular monolith.
4. Keep controllers, services, routes, and validation schemas organized by module.
5. Keep frontend code organized by feature.
6. Reuse existing components, utilities, and middleware.
7. Avoid unnecessary abstractions and overengineering.
8. Write readable, maintainable code.
9. Do not duplicate existing functionality.
10. Do not implement features outside the agreed MVP.

## 4. Database Rules

1. Use Prisma for database operations.
2. Follow the shared Prisma schema.
3. Do not independently redesign or modify shared database models.
4. Discuss schema changes with the team before implementing them.
5. Use Prisma migrations for schema changes.
6. Maintain proper foreign keys and database constraints.
7. Use Prisma Decimal or an equivalent exact representation for monetary values.
8. Never use JavaScript floating-point arithmetic for financial calculations.
9. Preserve historical invoice and payment records.

## 5. Backend Rules

1. Validate incoming requests using Zod.
2. Keep business logic inside service modules.
3. Keep controllers focused on handling requests and responses.
4. Use centralized error handling.
5. Follow the endpoint contracts in `docs/API_SPEC.md`.
6. Never trust client-provided prices, taxes, discounts, invoice totals, or outstanding balances.
7. Calculate all financial values on the backend.
8. Enforce authentication and role-based authorization.
9. Verify customer ownership before returning customer-specific data.
10. Use database transactions for operations involving related financial records.

## 6. Frontend Rules

1. Use reusable React components.
2. Keep API calls separate from UI components where practical.
3. Follow the agreed API response formats.
4. Handle loading, error, empty, and success states.
5. Use consistent layouts, forms, tables, and navigation.
6. Do not implement business calculations independently when the backend is responsible for them.
7. Do not rely on frontend restrictions as a replacement for backend authorization.

## 7. Security Rules

1. Store passwords using secure password hashing.
2. Use HTTP-only cookies for authentication tokens.
3. Apply appropriate cookie security settings and CSRF protection.
4. Never expose secrets or credentials in source code.
5. Never commit `.env` files.
6. Use `.env.example` for documenting required environment variables.
7. Enforce authorization on the backend.
8. Never expose another customer's data.

## 8. Team Collaboration Rules

The project has four members with separate module ownership.

- Member 1: Backend foundation and authentication.
- Member 2: Customers, products, plans, taxes, and discounts.
- Member 3: Subscription management.
- Member 4: Billing, invoices, payments, and dashboard.

Each agent must:

1. Work primarily within its assigned module.
2. Avoid modifying another member's module without coordination.
3. Follow the shared database schema and API contracts.
4. Communicate required interface or schema changes before implementing them.
5. Avoid overwriting shared configuration or migration files.
6. Keep changes small and focused.
7. Integrate changes through feature branches and pull requests.

## 9. Testing and Completion

Before marking a task complete:

1. Run TypeScript checks.
2. Run relevant tests.
3. Verify the affected API or UI workflow.
4. Fix errors introduced by the changes.
5. Report any incomplete functionality or known limitations.

Prioritize testing these core workflows:

- Authentication and authorization.
- Customer and product creation.
- Subscription creation and activation.
- Invoice generation.
- Duplicate billing prevention.
- Payment recording and partial payments.
- Outstanding balance calculation.
- Customer data isolation.

## 10. Important Instructions

- Do not invent business rules.
- Do not silently change shared API contracts.
- Do not independently modify the shared database schema.
- Do not introduce unnecessary dependencies.
- Do not implement deferred features without approval.
- Do not claim a feature is complete without verifying it.
- If documentation is unclear or contradictory, ask the team before making assumptions.

**Primary objective:** Build a working, integrated Brightloop MVP within the six-hour hackathon. Prioritize the complete customer-to-subscription-to-invoice-to-payment workflow over optional features and unnecessary complexity.