# Brightloop Subscription Management System
## Minimum Viable Product – Product Requirements Document

**Project:** Brightloop Subscription Management System  
**Build constraint:** Six-hour hackathon  
**Frontend:** React + TypeScript  
**Backend:** Express.js + TypeScript  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Primary objective:** Demonstrate a reliable subscription-to-invoice-to-payment workflow.

---

## 1. Overview

Brightloop Software sells products and services through subscriptions but currently manages its operations using spreadsheets and manual processes. This leads to missed renewals, manually prepared invoices, payment-tracking difficulties and limited visibility into recurring revenue.

Brightloop is a centralized subscription management platform that helps administrators and staff manage customers, products, subscription plans, subscriptions, invoices and payments.

The system automatically generates invoices for due subscriptions, calculates applicable taxes and discounts, prevents duplicate billing and provides a dashboard showing important financial information.

Customers can log in to view their subscriptions, invoices and payment history.

**One-line pitch:** A centralized platform to manage subscriptions, automate recurring invoices and track business revenue.

## 2. Goals and Non-goals

### 2.1 Goals

- Manage customers, products and subscription plans from one platform.
- Create and manage subscriptions with recurring billing intervals.
- Automatically generate invoices for due subscriptions.
- Apply configured taxes and eligible discounts during invoice generation.
- Prevent duplicate invoices for the same subscription billing period.
- Record payments and calculate outstanding balances.
- Provide a dashboard showing subscriptions, invoiced revenue, payments and overdue invoices.
- Enforce role-based access for Admin, Internal Staff and Customers.
- Allow customers to view their own subscriptions and invoices.

### 2.2 Non-goals for the MVP

The following features are excluded from the initial implementation:

- Payment gateway integration and automatic payment collection.
- Multi-currency support.
- Multi-tenant organization support.
- Proration for mid-cycle subscription changes.
- Automated dunning and payment reminder sequences.
- Mobile applications.
- Advanced quotation management and reusable quotation templates.
- Automated email delivery.
- Subscription pause, resume and renewal workflows.
- Advanced financial forecasting and accounting integrations.

## 3. Users and Roles

| Role | Responsibilities | Permissions |
|---|---|---|
| Admin | Manages the entire platform | Manage staff, products, plans, taxes, discounts, subscriptions, invoices, payments and dashboard |
| Internal Staff | Handles customer and subscription operations | View customers and catalog; create and manage subscriptions; manage invoices and record payments; view dashboard |
| Customer | Uses the self-service portal | View only their own subscriptions, invoices and payment history |

**Access rules:**

- Only Admin can create Internal Staff accounts.
- Customers can register themselves.
- Every protected API endpoint must enforce authentication and role permissions.
- Customer data must always be restricted to the authenticated customer's account.

## 4. MVP Scope and Priorities

### P0 – Essential functionality

These features must work for the core demo:

1. Customer registration and login.
2. Admin and Internal Staff authentication.
3. Role-based access control.
4. Product and product variant management.
5. Subscription plan management.
6. Percentage-based tax configuration.
7. Subscription creation and management.
8. Subscription lifecycle and status transitions.
9. Automatic invoice generation through an Admin-triggered billing run.
10. Duplicate invoice prevention.
11. Invoice confirmation and cancellation.
12. Manual payment recording and outstanding balance calculation.
13. Finance dashboard with basic filters.
14. Customer portal with subscription and invoice views.

### P1 – If time permits

- Daily scheduled billing execution.
- Password reset functionality.
- Print-friendly invoice page.
- Fixed-amount discounts.
- Subscription-level discounts with usage limits.
- Basic quotation creation.
- Invoice email simulation.

### P2 – Future enhancements

- Pause and resume subscriptions.
- Subscription renewal and early termination.
- Customer-initiated cancellation.
- Payment gateway integration.
- Automated payment reminders.
- Advanced reporting and analytics.
- MRR and ARR reporting.

**MVP completion rule:** Do not start P1 features until the complete P0 workflow works from subscription creation through invoice generation and payment recording.

## 5. Functional Requirements

### 5.1 Authentication and Account Management

- **FR-A1:** Customers can register using their name, email and password.
- **FR-A2:** Email addresses must be unique, case-insensitively.
- **FR-A3:** Passwords must contain at least 9 characters, including uppercase, lowercase and a special character.
- **FR-A4:** Users can log in and log out securely.
- **FR-A5:** Passwords must be hashed before storage.
- **FR-A6:** Admin can create Internal Staff accounts.
- **FR-A7:** Each customer account must have an associated customer profile containing name, company, address and phone number.
- **FR-A8:** Protected routes must enforce authentication and role-based authorization.

**MVP authentication approach:** Use JWT-based authentication with secure, HTTP-only cookies. Password reset and email verification are deferred.

**Acceptance criteria:**
- Duplicate registration attempts are rejected.
- Invalid credentials cannot authenticate.
- Customers cannot access Admin or Staff endpoints.
- A customer cannot access another customer's records.

### 5.2 Product and Variant Management

- **FR-P1:** Admin can create products with name, type, sales price, cost price, notes and applicable tax.
- **FR-P2:** A product can contain multiple variants based on attributes.
- **FR-P3:** Each variant can have an additional price.
- **FR-P4:** Effective unit price is calculated as:

  `Effective Unit Price = Product Sales Price + Variant Extra Price`

- **FR-P5:** Admin can create, edit and deactivate products.
- **FR-P6:** Internal Staff can view products but cannot modify the catalog.

**Example:**

A product called ERP Software has a sales price of ₹2,000.

| Variant | Additional price | Effective price |
|---|---:|---:|
| Standard | ₹0 | ₹2,000 |
| Odoo | ₹560 | ₹2,560 |
| Enterprise | ₹1,000 | ₹3,000 |

The selected variant determines the product's price when a subscription is created.

Products referenced by existing subscriptions or invoices should be deactivated rather than physically deleted.

### 5.3 Subscription Plans

- **FR-PL1:** Admin can create plans with a name, billing interval, minimum quantity and availability dates.
- **FR-PL2:** Supported billing intervals are Daily, Weekly, Monthly and Yearly.
- **FR-PL3:** A plan can be selected only within its configured availability period.
- **FR-PL4:** Subscription quantity must satisfy the plan's minimum quantity.
- **FR-PL5:** Admin can activate or deactivate plans.

**Pricing clarification:** The MVP uses subscription product lines to calculate recurring charges. The plan determines the billing frequency and minimum quantity; it does not introduce an additional recurring fee. If Brightloop later requires a separate plan fee, that should be introduced as an explicit charge type.

### 5.4 Subscriptions

- **FR-S1:** Admin or Internal Staff can create subscriptions for existing customers.
- **FR-S2:** Each subscription must have a unique auto-generated subscription number.
- **FR-S3:** A subscription must contain a customer, plan, start date, optional expiry date and payment terms.
- **FR-S4:** Subscription lines must contain product, selected variant, quantity, unit price and applicable tax.
- **FR-S5:** Unit prices and tax selections are captured when the subscription is created. Changes to the product catalog must not silently change an existing subscription's agreed price.
- **FR-S6:** Subscription status must follow the defined lifecycle.
- **FR-S7:** Authorized Admin or Staff users can activate a confirmed subscription.
- **FR-S8:** Activation initializes the next billing date using the subscription start date.
- **FR-S9:** Users can view subscription details, status, line items and billing dates.
- **FR-S10:** Subscription status changes must be recorded with the user and timestamp.

**MVP subscription lifecycle:**

`Draft → Confirmed → Active → Closed`

Quotation is deferred because quotation templates and quotation expiry are not essential to the core billing workflow.

**Example:**

A customer subscribes to ERP Software (Odoo variant) for 3 units under a monthly plan.

- Unit price: ₹2,560
- Quantity: 3
- Monthly recurring subtotal: ₹7,680

Once activated, the subscription becomes eligible for billing.

### 5.5 Taxes

- **FR-T1:** Admin can create and manage percentage-based taxes.
- **FR-T2:** Each product can have a default tax.
- **FR-T3:** Subscription lines inherit the product's tax by default.
- **FR-T4:** Tax is calculated automatically during invoice generation.
- **FR-T5:** The applied tax name and rate must be stored with the invoice line so historical invoices remain unchanged when tax configuration changes.

**MVP limitation:** Fixed-amount taxes and complex compound tax calculations are deferred.

**Example:**

A subscription line has a taxable amount of ₹7,680 and an applicable tax rate of 18%.

Tax = ₹7,680 × 18% = ₹1,382.40.

### 5.6 Discounts

- **FR-D1:** Admin can create percentage-based discounts.
- **FR-D2:** A discount can have a name, percentage value, start date and end date.
- **FR-D3:** A discount can be associated with a subscription.
- **FR-D4:** An eligible discount is applied automatically during invoice generation.
- **FR-D5:** Discounts cannot reduce an invoice line below zero.
- **FR-D6:** Applied discount details must be stored with the invoice.

**MVP limitation:** Apply at most one subscription-level discount per invoice. Product-specific discounts, usage limits, minimum purchase conditions and complex discount stacking are deferred.

### 5.7 Invoice Generation and Management

- **FR-I1:** Invoices must be generated from active subscriptions. Users must not manually enter invoice totals or create arbitrary recurring invoices.
- **FR-I2:** The Admin can initiate a billing run through a `Run Billing` action.
- **FR-I3:** The billing process identifies active subscriptions whose next billing date is due.
- **FR-I4:** One invoice must be generated for each subscription billing period.
- **FR-I5:** The invoice must contain customer details, subscription details, billing period, line items, taxes, discounts and totals.
- **FR-I6:** The invoice must have a unique auto-generated invoice number.
- **FR-I7:** The invoice due date must be calculated using the configured payment terms.
- **FR-I8:** The next billing date must advance only after the corresponding invoice has been successfully created.
- **FR-I9:** A unique database constraint must prevent duplicate invoices for the same subscription and billing period.
- **FR-I10:** If billing is executed multiple times, existing invoices must not be duplicated.
- **FR-I11:** If a billing run is interrupted, subsequent runs must be able to process remaining due periods.
- **FR-I12:** Invoice status must follow the defined invoice lifecycle.
- **FR-I13:** Admin and Staff can confirm or cancel eligible invoices.
- **FR-I14:** A cancelled invoice must not accept payments.

**MVP billing execution:** Billing is initiated manually by Admin. Daily scheduled execution can be added after the core billing operation is reliable.

**Billing period example:**

A monthly subscription starts on 1 October.

| Billing period | Invoice |
|---|---|
| 1 Oct – 31 Oct | Invoice 1 |
| 1 Nov – 30 Nov | Invoice 2 |
| 1 Dec – 31 Dec | Invoice 3 |

If the billing process is not executed in November, the next billing run must generate the missed invoice without duplicating the October invoice.

**Historical invoice requirement:** An invoice must preserve the exact product description, quantity, unit price, discount, tax rate and calculated amounts used when it was generated. Later catalog changes must not modify it.

### 5.8 Payments

- **FR-PY1:** Admin and Internal Staff can record payments against confirmed invoices.
- **FR-PY2:** Each payment must contain amount, payment method, payment date and optional note.
- **FR-PY3:** Supported methods include Cash, Bank Transfer, Card and UPI.
- **FR-PY4:** Multiple partial payments are allowed.
- **FR-PY5:** The system must calculate outstanding balance automatically.

  `Outstanding = Invoice Total - Sum of Successful Recorded Payments`

- **FR-PY6:** Payments cannot exceed the outstanding balance.
- **FR-PY7:** Payments cannot be recorded against Draft or Cancelled invoices.
- **FR-PY8:** An invoice becomes Paid when its outstanding balance reaches zero.
- **FR-PY9:** An invoice with an outstanding balance remains Confirmed.
- **FR-PY10:** Users can view payment history for an invoice.

**Example:**

Invoice total = ₹10,000.

| Payment | Amount | Outstanding |
|---|---:|---:|
| Initial payment | ₹3,000 | ₹7,000 |
| Second payment | ₹4,000 | ₹3,000 |
| Final payment | ₹3,000 | ₹0 |

The invoice status changes to Paid only after the final payment.

**MVP limitation:** Refunds, payment reversals and automatic payment collection are deferred.

### 5.9 Finance Dashboard

The dashboard must provide a high-level view of subscription and payment activity.

**Summary metrics:**

- Total active subscriptions.
- Total invoiced amount for the selected date range.
- Total payments received for the selected date range.
- Total outstanding amount.
- Number and amount of overdue invoices.

**Basic filters:**

- Date range.
- Invoice status.
- Customer.

**Definitions:**

- **Invoiced amount:** Sum of invoice totals issued during the selected period.
- **Payments received:** Sum of recorded payments during the selected period.
- **Outstanding amount:** Sum of unpaid balances across eligible invoices.
- **Overdue invoice:** A confirmed invoice with a positive outstanding balance and a due date before the current date.

MRR and ARR can be introduced as future reporting features.

### 5.10 Customer Portal

- **FR-CP1:** Customers can log in to the self-service portal.
- **FR-CP2:** Customers can view their own subscriptions and current status.
- **FR-CP3:** Customers can view their own invoices and invoice details.
- **FR-CP4:** Customers can view payment history.
- **FR-CP5:** Customers cannot access other customers' records or administrative functionality.

## 6. Business Rules and Calculations

### 6.1 Subscription Line Pricing

1. Unit price = Product sales price + Variant extra price.
2. Line gross = Unit price × Quantity.
3. Line discount = Eligible percentage discount, if applicable.
4. Taxable amount = Line gross − Line discount.
5. Tax amount = Taxable amount × Tax rate.
6. Line total = Taxable amount + Tax amount.

### 6.2 Invoice Totals

- Subtotal = Sum of line gross amounts.
- Discount total = Sum of applicable discounts.
- Tax total = Sum of calculated line taxes.
- Grand total = Subtotal − Discount total + Tax total.
- Outstanding = Grand total − Payments received.

### 6.3 Money and Rounding

- Store monetary values using PostgreSQL `NUMERIC` or integer minor units.
- Use Prisma `Decimal` or a safe decimal arithmetic library for calculations.
- Do not use JavaScript floating-point arithmetic for financial calculations.
- Apply a consistent rounding rule to tax and discount calculations.
- Store calculated invoice totals rather than recalculating old invoices from current product data.

### 6.4 Billing Period Calculation

- Daily: Advance by one day.
- Weekly: Advance by seven days.
- Monthly: Advance by one calendar month.
- Yearly: Advance by one calendar year.

For monthly and yearly billing, calendar arithmetic must handle month-end and leap-year dates correctly.

For example, advancing one month from 31 January should follow a consistent month-end rule rather than accidentally rolling into March.

The system must use one defined business timezone for billing dates. Period boundaries should be stored consistently and must not change because of server timezone differences.

### 6.5 Invoice and Subscription Expiry

- A subscription can be billed only while Active and eligible for the billing period.
- If an expiry date is configured, the system must not generate billing periods that begin after the expiry date.
- The last billable period and auto-close behaviour must be explicitly determined before implementation.
- For the MVP, subscriptions are closed manually. Automatic closure at expiry is deferred.

## 7. State Machines

### 7.1 Subscription Lifecycle

`Draft → Confirmed → Active → Closed`

Rules:

- Draft subscriptions can be edited or confirmed.
- Confirmed subscriptions can be activated.
- Active subscriptions can be closed by an authorized user.
- Closed subscriptions cannot be billed.
- Invalid transitions return HTTP 409 Conflict.

### 7.2 Invoice Lifecycle

`Draft → Confirmed → Paid`

Additional transition:

`Draft / Confirmed → Cancelled`

Rules:

- Draft invoices cannot receive payments.
- Confirmed invoices can receive partial or full payments.
- Confirmed invoices become Paid automatically when the outstanding balance reaches zero.
- An invoice cannot be cancelled after payments have been recorded in the MVP.
- Invalid transitions return HTTP 409 Conflict.

**Important:** Partial payment is represented by a Confirmed invoice with an outstanding balance. It is not a separate invoice status.

## 8. Data Model

The following tables represent the proposed MVP data model.

| Table | Important columns |
|---|---|
| users | id, email, password_hash, role, name, created_at |
| customers | id, user_id, name, company, address, phone |
| products | id, name, type, sales_price, cost_price, notes, tax_id, is_active |
| product_variants | id, product_id, attribute, value, extra_price |
| plans | id, name, billing_period, min_quantity, valid_from, valid_to, is_active |
| taxes | id, name, rate, is_active |
| discounts | id, name, percentage, start_date, end_date, is_active |
| subscriptions | id, number, customer_id, plan_id, status, start_date, expiry_date, payment_term_days, next_billing_date |
| subscription_lines | id, subscription_id, product_id, variant_id, description, quantity, unit_price, tax_rate |
| subscription_events | id, subscription_id, from_status, to_status, changed_by, created_at |
| invoices | id, number, subscription_id, customer_id, status, period_start, period_end, issue_date, due_date, subtotal, discount_total, tax_total, total |
| invoice_lines | id, invoice_id, description, quantity, unit_price, discount_amount, tax_name, tax_rate, tax_amount, line_total |
| payments | id, invoice_id, method, amount, paid_on, note, recorded_by |

**Design notes:**

- `subscription_lines` preserve the agreed subscription pricing.
- `invoice_lines` preserve the historical invoice calculations.
- Subscription and invoice records should not depend on the current product price after creation.
- A customer profile should be linked to its corresponding user account.
- Products, plans and taxes referenced by existing records should generally be deactivated instead of deleted.

### 8.1 Important Constraints and Indexes

- Unique, case-insensitive user email.
- Unique subscription number.
- Unique invoice number.
- Unique `(subscription_id, period_start)` on invoices.
- Index on `subscriptions(status, next_billing_date)`.
- Index on `subscriptions(customer_id)`.
- Index on `invoices(status, due_date)`.
- Index on `invoices(customer_id)`.
- Index on `payments(invoice_id)`.

Database constraints must enforce important business rules wherever practical.

## 9. API Surface

All endpoints return JSON and use consistent error responses. Protected endpoints require authentication and authorization.

| Module | Endpoint examples |
|---|---|
| Authentication | POST `/auth/register`, POST `/auth/login`, POST `/auth/logout` |
| Users | POST `/users/staff`, GET `/users` |
| Products | GET `/products`, POST `/products`, PATCH `/products/:id`, POST `/products/:id/variants` |
| Plans | GET `/plans`, POST `/plans`, PATCH `/plans/:id` |
| Taxes | GET `/taxes`, POST `/taxes`, PATCH `/taxes/:id` |
| Discounts | GET `/discounts`, POST `/discounts`, PATCH `/discounts/:id` |
| Customers | GET `/customers`, GET `/customers/:id` |
| Subscriptions | GET `/subscriptions`, POST `/subscriptions`, GET `/subscriptions/:id`, PATCH `/subscriptions/:id`, POST `/subscriptions/:id/transition` |
| Invoices | GET `/invoices`, GET `/invoices/:id`, POST `/invoices/run-billing`, POST `/invoices/:id/confirm`, POST `/invoices/:id/cancel` |
| Payments | POST `/invoices/:id/payments`, GET `/payments` |
| Dashboard | GET `/dashboard/summary`, GET `/dashboard/overdue` |
| Customer portal | GET `/portal/subscriptions`, GET `/portal/invoices`, GET `/portal/payments` |

List endpoints must support server-side pagination and relevant filters.

The billing endpoint must be restricted to Admin users.

## 10. Non-functional Requirements

### 10.1 Security

- Hash passwords using bcrypt or Argon2.
- Use secure HTTP-only cookies for authentication.
- Validate all incoming request data on the server.
- Enforce role-based authorization.
- Scope customer queries to the authenticated customer's ID.
- Avoid exposing password hashes, reset tokens or internal secrets.
- Protect cookie-authenticated state-changing requests against CSRF.

### 10.2 Data Consistency

- Use database transactions for invoice generation.
- Update the next billing date only when invoice creation succeeds.
- Prevent duplicate billing through database uniqueness constraints.
- Prevent payment amounts from exceeding outstanding balances, including concurrent requests.
- Preserve historical invoice values.
- Ensure discount usage updates and invoice creation happen atomically if usage limits are implemented.

### 10.3 Performance

- Use server-side pagination.
- Add indexes to frequently filtered and joined columns.
- Calculate dashboard aggregates using SQL rather than loading all records into application memory.
- Seed at least 5,000 subscriptions for a basic performance test if time permits.
- Target page and API responses below two seconds under the agreed demo test conditions.

### 10.4 Reliability and Observability

- Billing execution should return a summary containing invoices created, already-billed periods skipped and failures.
- Log billing errors with subscription and billing-period identifiers.
- Failed billing operations must be safe to retry.
- Do not report an invoice as successfully generated unless the database transaction commits.

## 11. Frontend Screens

1. Login and customer registration.
2. Admin dashboard.
3. Product and variant management.
4. Subscription plan management.
5. Tax and discount management.
6. Customer list and details.
7. Subscription list and details.
8. Subscription creation form.
9. Invoice list and details.
10. Payment recording form.
11. Customer portal with subscriptions, invoices and payments.

Use reusable table, form, modal and status-badge components to reduce development time.

## 12. Acceptance Criteria and Demo Flow

The MVP is considered successful when the following workflow can be demonstrated end to end.

1. A customer registers and logs in.
2. An Admin logs in and creates a product with a variant.
3. The Admin creates a monthly subscription plan and configures a percentage tax.
4. Staff creates a subscription for the customer with the selected product variant and quantity.
5. The subscription is confirmed and activated.
6. Admin triggers the billing run.
7. The system creates an invoice with the correct product price, tax and total.
8. Admin triggers the billing run again. No duplicate invoice is created for the same period.
9. Staff confirms the invoice and records a partial payment.
10. The outstanding amount is updated correctly.
11. Staff records the remaining payment. The invoice automatically becomes Paid.
12. The dashboard reflects the subscription, invoiced amount and payment.
13. The customer logs in and views only their own subscription and invoice.
14. An unauthorized request to another customer's data is rejected.

## 13. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope exceeds six hours | Implement only P0 features and use seeded demo data |
| Billing produces duplicate invoices | Add a database unique constraint and transaction-safe creation |
| Incorrect financial calculations | Implement and test a separate pricing calculation function |
| Product changes affect old invoices | Store invoice-line snapshots |
| Concurrent payment requests exceed balance | Validate and update payment balances transactionally |
| Dashboard queries become slow | Use indexed SQL aggregates and pagination |
| UI takes too much time | Use reusable forms, tables and a component library |
| Database setup consumes time | Create schema, migrations and seed data at the beginning |

## 14. Six-hour Implementation Plan

| Time | Deliverable |
|---|---|
| 0:00–0:45 | Project setup, PostgreSQL schema, migrations, seed data, authentication and role middleware |
| 0:45–1:30 | Products, variants, plans and taxes |
| 1:30–2:30 | Subscription creation, pricing calculations and status transitions |
| 2:30–3:45 | Invoice generation, billing idempotency, tax calculation and payment recording |
| 3:45–4:30 | Dashboard queries and backend integration |
| 4:30–5:30 | React screens for Admin, Staff and Customer |
| 5:30–6:00 | Integration testing, demo data, bug fixes and video rehearsal |

**Implementation priority:** A working backend billing flow is more important than completing every screen. If time becomes limited, simplify the frontend rather than compromising invoice correctness or access control.

---

## 15. Future Enhancements

After the MVP, Brightloop can be extended with:

- Scheduled background billing.
- Retry and failure handling for background jobs.
- Quotation generation and reusable templates.
- Subscription pause, resume and renewal.
- Automatic expiry and closure.
- Product-specific discounts and discount usage limits.
- Customer email notifications.
- Payment gateway integration.
- Payment reminders and dunning.
- Invoice PDF generation.
- MRR, ARR and revenue trend analytics.
- Redis caching and more advanced performance optimization.

These enhancements should be introduced incrementally without compromising the correctness of the core subscription and billing workflow.