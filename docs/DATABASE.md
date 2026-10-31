# DATABASE.md

# Brightloop — Database Design

## 1. Overview

Brightloop uses **PostgreSQL** as its primary database and **Prisma ORM** for database access.

The database follows a relational model with foreign keys, unique constraints, and transactions to maintain data consistency.

### Database conventions

- Primary keys use UUIDs.
- Table and column names use consistent snake_case naming.
- All timestamps are stored using PostgreSQL `TIMESTAMP` with timezone (`timestamptz`).
- Monetary values use PostgreSQL `NUMERIC` and Prisma `Decimal`. Never use JavaScript floating-point arithmetic for financial calculations.
- Foreign keys maintain relationships between records.
- Important business operations must use database transactions.
- Soft deletion is not required for the MVP. Use status fields where records need to be deactivated.

---

## 2. Database Tables

Brightloop uses the following tables:

| Table | Purpose |
|---|---|
| `users` | Stores login accounts and user roles |
| `customers` | Stores customer and billing information |
| `products` | Stores products offered by the business |
| `product_variants` | Stores purchasable variants of products |
| `plans` | Defines subscription billing intervals |
| `taxes` | Stores tax configurations |
| `discounts` | Stores discount configurations |
| `subscriptions` | Stores customer subscription details |
| `subscription_lines` | Stores products and quantities included in a subscription |
| `subscription_events` | Tracks subscription status changes |
| `invoices` | Stores generated billing invoices |
| `invoice_lines` | Stores invoice item snapshots |
| `payments` | Stores payments made against invoices |

## 3. Table Definitions

### 3.1 users

Stores the login accounts of Admins, Internal Staff, and Customers.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR | User's name |
| `email` | VARCHAR | Login email; unique |
| `password_hash` | VARCHAR | Hashed password |
| `role` | ENUM | ADMIN, INTERNAL, CUSTOMER |
| `customer_id` | UUID, nullable | Links a customer login to a customer record |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Relationships:**
- A user may be linked to one customer record.
- Admin and Internal users do not need a `customer_id`.
- A customer account can access only the customer record linked to it.

**Constraints:**
- `email` must be unique.
- `customer_id` must be unique when present, for the MVP's one-login-per-customer model.

### 3.2 customers

Stores customer information used for subscriptions and invoices.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Customer or company name |
| `email` | VARCHAR | Customer contact email |
| `phone` | VARCHAR, nullable | Contact number |
| `billing_address` | TEXT, nullable | Billing address |
| `status` | ENUM | ACTIVE, INACTIVE |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Relationships:**
- One customer can have multiple subscriptions.
- One customer can have multiple invoices.
- A customer may have one linked login account in `users`.

### 3.3 products

Stores the products offered by the business.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Product name |
| `description` | TEXT, nullable | Product description |
| `status` | ENUM | ACTIVE, INACTIVE |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Relationships:**
- One product can have multiple product variants.

### 3.4 product_variants

Stores the purchasable versions or configurations of a product.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `product_id` | UUID | References `products.id` |
| `name` | VARCHAR | Variant name |
| `sku` | VARCHAR, nullable | Stock keeping unit; unique when provided |
| `default_price` | NUMERIC(12,2) | Suggested unit price |
| `status` | ENUM | ACTIVE, INACTIVE |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Important:** `default_price` is the current suggested price. When a variant is added to a subscription, its agreed price is stored separately in `subscription_lines`. Changing the product price must not change existing subscriptions.

### 3.5 plans

Defines how frequently a subscription is billed.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Plan name |
| `billing_interval` | ENUM | DAY, WEEK, MONTH, YEAR |
| `interval_count` | INTEGER | Number of intervals between billings |
| `minimum_quantity` | INTEGER | Minimum allowed subscription quantity |
| `status` | ENUM | ACTIVE, INACTIVE |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

Examples:

| Plan | billing_interval | interval_count |
|---|---|---:|
| Daily | DAY | 1 |
| Weekly | WEEK | 1 |
| Monthly | MONTH | 1 |
| Yearly | YEAR | 1 |

**Important:**
- The plan controls billing frequency.
- The subscription's line items determine the amount charged.
- `interval_count` allows the interval to be extended later without changing the database structure.

### 3.6 taxes

Stores reusable tax configurations.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Tax name |
| `rate` | NUMERIC(5,2) | Tax percentage |
| `is_active` | BOOLEAN | Whether the tax can be selected |
| `created_at` | TIMESTAMPTZ | Creation time |

Example: GST at 18%.

The selected tax rate is also copied into the subscription and invoice as a snapshot. Changing the tax configuration must not silently change previously agreed subscription rates or historical invoices.

### 3.7 discounts

Stores reusable percentage-based discount configurations.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Discount name |
| `percentage` | NUMERIC(5,2) | Discount percentage |
| `is_active` | BOOLEAN | Whether the discount can be selected |
| `created_at` | TIMESTAMPTZ | Creation time |

Example: Festival Discount at 10%.

The selected percentage is copied into the subscription and invoice snapshots so that historical billing calculations remain unchanged.

### 3.8 subscriptions

Stores the main subscription record for a customer.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `customer_id` | UUID | References `customers.id` |
| `plan_id` | UUID | References `plans.id` |
| `status` | ENUM | DRAFT, CONFIRMED, ACTIVE, CLOSED |
| `start_date` | TIMESTAMPTZ | Subscription start date |
| `next_billing_date` | TIMESTAMPTZ | Next scheduled billing date |
| `currency` | VARCHAR(3) | Currency code, e.g. INR |
| `tax_id` | UUID, nullable | References `taxes.id` |
| `tax_rate_snapshot` | NUMERIC(5,2), nullable | Tax rate agreed for this subscription |
| `discount_id` | UUID, nullable | References `discounts.id` |
| `discount_percentage` | NUMERIC(5,2) | Agreed discount percentage |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Relationships:**
- Each subscription belongs to one customer.
- Each subscription uses one plan.
- Each subscription can contain multiple subscription lines.
- Each subscription can generate multiple invoices.
- Each subscription can have multiple status-change events.

**Important:**
- The current status is stored in `status`.
- `next_billing_date` determines when the subscription becomes eligible for billing.
- Tax and discount snapshots preserve the agreed values.
- The billing implementation must preserve the original billing anchor when calculating subsequent dates, particularly for month-end subscriptions.

### 3.9 subscription_lines

Stores the products and quantities included in a subscription.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `subscription_id` | UUID | References `subscriptions.id` |
| `variant_id` | UUID | References `product_variants.id` |
| `description_snapshot` | VARCHAR | Product/variant description at subscription time |
| `quantity` | INTEGER | Number of units |
| `unit_price` | NUMERIC(12,2) | Agreed price per unit |
| `created_at` | TIMESTAMPTZ | Creation time |

**Example:**

A customer subscribes to:

| Variant | Quantity | Unit price |
|---|---:|---:|
| Cloud Storage Basic | 2 | ₹199 |
| Email Service | 5 | ₹99 |

These become two records in `subscription_lines`.

**Important:** The subscription line stores the agreed price, not the current product default price.

### 3.10 subscription_events

Maintains a history of subscription status changes.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `subscription_id` | UUID | References `subscriptions.id` |
| `event_type` | VARCHAR | Event description |
| `previous_status` | VARCHAR, nullable | Previous subscription status |
| `new_status` | VARCHAR, nullable | New subscription status |
| `actor_user_id` | UUID, nullable | User who performed the action |
| `metadata` | JSONB, nullable | Additional event information |
| `created_at` | TIMESTAMPTZ | Event time |

Example events:
- SUBSCRIPTION_CREATED
- SUBSCRIPTION_CONFIRMED
- SUBSCRIPTION_ACTIVATED
- SUBSCRIPTION_CLOSED

**Important:** The `subscriptions` table stores the current state. This table stores the history of changes.

### 3.11 invoices

Stores invoices generated for subscriptions.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `invoice_number` | VARCHAR | Unique invoice number |
| `subscription_id` | UUID | References `subscriptions.id` |
| `customer_id` | UUID | References `customers.id` |
| `period_start` | TIMESTAMPTZ | Start of billed period |
| `period_end` | TIMESTAMPTZ | End of billed period |
| `issue_date` | TIMESTAMPTZ | Invoice issue date |
| `due_date` | TIMESTAMPTZ | Payment due date |
| `status` | ENUM | DRAFT, CONFIRMED, PAID, CANCELLED |
| `currency` | VARCHAR(3) | Currency code |
| `subtotal` | NUMERIC(12,2) | Total before discount and tax |
| `discount_percentage` | NUMERIC(5,2) | Applied discount percentage |
| `discount_amount` | NUMERIC(12,2) | Calculated discount amount |
| `tax_name_snapshot` | VARCHAR, nullable | Tax name at billing time |
| `tax_rate` | NUMERIC(5,2) | Applied tax percentage |
| `tax_amount` | NUMERIC(12,2) | Calculated tax amount |
| `total_amount` | NUMERIC(12,2) | Final invoice amount |
| `created_at` | TIMESTAMPTZ | Creation time |

**Important:**
- An invoice belongs to one subscription and one customer.
- An invoice contains the historical billing details for a particular period.
- Invoice generation creates a DRAFT invoice.
- An Admin or authorized Internal user confirms the invoice before payment can be recorded.
- Invoice amounts must not change after confirmation.
- Invoice numbers must be generated using a database sequence or another concurrency-safe mechanism, not `COUNT + 1`.

**Billing period convention:**

Use a half-open interval:

`[period_start, period_end)`

The start is included and the end is excluded. This prevents overlapping billing periods.

**Idempotency constraint:**

A subscription must not have more than one invoice for the same billing period.

Add a unique constraint on:

`(subscription_id, period_start)`

### 3.12 invoice_lines

Stores the individual items included in an invoice.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `invoice_id` | UUID | References `invoices.id` |
| `description_snapshot` | VARCHAR | Item description at invoice generation |
| `quantity` | INTEGER | Billed quantity |
| `unit_price` | NUMERIC(12,2) | Billed unit price |
| `line_total` | NUMERIC(12,2) | Quantity multiplied by unit price |

**Important:**
- Invoice lines are copied from the subscription lines during billing.
- They preserve the item description, quantity, and price used at the time of billing.
- Changes to product names or subscription prices must not modify existing invoices.

### 3.13 payments

Stores payments received against invoices.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `invoice_id` | UUID | References `invoices.id` |
| `amount` | NUMERIC(12,2) | Amount received |
| `payment_method` | ENUM | CASH, BANK_TRANSFER, CARD, OTHER |
| `reference` | VARCHAR, nullable | Transaction/reference number |
| `paid_at` | TIMESTAMPTZ | Payment date |
| `recorded_by` | UUID | References `users.id` |
| `created_at` | TIMESTAMPTZ | Record creation time |

**Important:**
- One invoice can have multiple payments.
- Partial payments are supported.
- Payments can only be recorded against CONFIRMED invoices.
- The total recorded payments must never exceed the invoice total.
- For the MVP, manually recording a payment means it is treated as successful. Payment gateway integration and refunds are outside the scope.

The outstanding balance is calculated as:

`Outstanding Balance = Invoice Total - SUM(Payments)`

The balance should be derived from payment records rather than independently maintained in another column.

---

## 4. Relationships Overview

The main database relationships are:

| Parent table | Child table | Relationship |
|---|---|---|
| `customers` | `subscriptions` | One-to-many |
| `customers` | `invoices` | One-to-many |
| `customers` | `users` | One-to-one, optional |
| `products` | `product_variants` | One-to-many |
| `plans` | `subscriptions` | One-to-many |
| `subscriptions` | `subscription_lines` | One-to-many |
| `product_variants` | `subscription_lines` | One-to-many |
| `subscriptions` | `subscription_events` | One-to-many |
| `subscriptions` | `invoices` | One-to-many |
| `invoices` | `invoice_lines` | One-to-many |
| `invoices` | `payments` | One-to-many |
| `taxes` | `subscriptions` | One-to-many |
| `discounts` | `subscriptions` | One-to-many |
| `users` | `payments` | One-to-many |

### Simplified relationship flow

```text
users ─────────────── customers
                          |
                          |
                       subscriptions ───── plans
                          |
                  ┌───────┴────────┐
                  |                |
          subscription_lines  subscription_events
                  |
            product_variants
                  |
               products

subscriptions ───────── invoices
                          |
                   ┌──────┴──────┐
                   |             |
              invoice_lines   payments
```

---

## 5. How Application Actions Affect the Database

This section describes the database operations performed when users interact with Brightloop.

### 5.1 User Login

1. User submits email and password.
2. Backend searches `users` using the email.
3. Password hash is verified.
4. JWT is generated and stored in a secure HTTP-only cookie.

**Database operation:** SELECT from `users`.

Login does not create or update a database record.

### 5.2 Create Customer

When Admin or Internal Staff creates a customer:

1. Customer details are validated.
2. A new customer record is inserted.

**Database operation:**

`INSERT INTO customers`

### 5.3 Create Product and Variant

When a product is created:

1. Insert the product into `products`.
2. Add its purchasable variants to `product_variants`.

**Database operations:**

- `INSERT INTO products`
- `INSERT INTO product_variants`

Each variant references its parent product through `product_id`.

### 5.4 Create Plan

When a billing plan is created:

1. Store its name.
2. Store the billing interval.
3. Store the interval count and minimum quantity.

**Database operation:**

`INSERT INTO plans`

### 5.5 Configure Tax or Discount

When an Admin creates or updates a tax or discount:

- Tax configuration is stored in `taxes`.
- Discount configuration is stored in `discounts`.

**Database operations:**

- `INSERT` or `UPDATE taxes`
- `INSERT` or `UPDATE discounts`

Existing subscription and invoice snapshots remain unchanged.

### 5.6 Create Subscription

When a customer is subscribed to a plan:

1. Validate the customer.
2. Validate the selected plan.
3. Validate all selected product variants.
4. Check minimum quantity requirements.
5. Calculate and store the agreed unit prices.
6. Store selected tax and discount snapshots.
7. Create the subscription record.
8. Insert its subscription line items.
9. Record the creation event.

**Database operations:**

- `INSERT INTO subscriptions`
- `INSERT INTO subscription_lines`
- `INSERT INTO subscription_events`

These operations must run inside one database transaction. If any operation fails, all changes must roll back.

### 5.7 Activate Subscription

When an authorized user activates a confirmed subscription:

1. Update the subscription status.
2. Set or verify its next billing date.
3. Insert a status-change event.

**Database operations:**

- `UPDATE subscriptions`
- `INSERT INTO subscription_events`

Only ACTIVE subscriptions are eligible for invoice generation.

### 5.8 Run Billing

Billing is manually triggered by an Admin for the MVP.

The backend:

1. Finds ACTIVE subscriptions whose `next_billing_date` is due.
2. Processes each subscription in a database transaction.
3. Prevents concurrent billing of the same subscription.
4. Calculates the billing period and invoice amounts.
5. Creates an invoice in DRAFT status.
6. Copies subscription items into invoice lines.
7. Advances the subscription's next billing date.
8. Commits the transaction.

**Database operations:**

- `SELECT` due subscriptions.
- `INSERT INTO invoices`
- `INSERT INTO invoice_lines`
- `UPDATE subscriptions`

**Important safeguards:**

- Use the unique constraint `(subscription_id, period_start)` to prevent duplicate invoices.
- Use row locking or equivalent transaction-safe handling when processing a subscription.
- If invoice creation fails, the transaction must roll back, including the next billing date update.
- Each missed billing period must be handled separately if backfilling is supported.

### 5.9 Confirm Invoice

When an authorized user confirms a draft invoice:

1. Validate that the invoice is in DRAFT status.
2. Change its status to CONFIRMED.

**Database operation:**

`UPDATE invoices`

Only confirmed invoices can receive payments.

### 5.10 Record Payment

When Internal Staff records a payment:

1. Retrieve and lock the invoice.
2. Verify that its status is CONFIRMED.
3. Calculate the outstanding balance.
4. Reject the payment if it is greater than the balance.
5. Insert the payment record.
6. If the outstanding balance becomes zero, mark the invoice as PAID.

**Database operations:**

- `SELECT` invoice and its payment records.
- `INSERT INTO payments`
- `UPDATE invoices` when fully paid.

These operations must be transaction-safe to prevent concurrent payments from exceeding the invoice total.

**Example:**

For an invoice of ₹1,000:

| Action | Payment | Remaining balance | Invoice status |
|---|---:|---:|---|
| Invoice confirmed | — | ₹1,000 | CONFIRMED |
| First payment | ₹400 | ₹600 | CONFIRMED |
| Second payment | ₹300 | ₹300 | CONFIRMED |
| Final payment | ₹300 | ₹0 | PAID |

### 5.11 Close Subscription

When an authorized user closes a subscription:

1. Update the subscription status to CLOSED.
2. Insert a subscription event.

**Database operations:**

- `UPDATE subscriptions`
- `INSERT INTO subscription_events`

Closed subscriptions must not be included in future billing runs.

### 5.12 Dashboard

The dashboard displays information such as:

- Total customers.
- Active subscriptions.
- Draft and confirmed invoices.
- Paid invoice amounts.
- Outstanding invoice balances.
- Recent payments.

These values are calculated from existing tables using SQL queries and aggregations.

**No separate dashboard table is required for the MVP.**

---

## 6. Important Database Constraints

The following constraints must be implemented to protect data integrity.

| Table | Constraint | Reason |
|---|---|---|
| `users` | Unique `email` | Prevent duplicate accounts |
| `users` | Unique nullable `customer_id` | One customer login per customer |
| `product_variants` | Unique nullable `sku` | Prevent duplicate SKUs |
| `subscriptions` | Foreign keys to customer and plan | Prevent invalid references |
| `subscription_lines` | `quantity > 0` | Prevent invalid quantities |
| `invoices` | Unique `invoice_number` | Prevent duplicate invoice numbers |
| `invoices` | Unique `(subscription_id, period_start)` | Prevent duplicate billing |
| `invoice_lines` | `quantity > 0` | Prevent invalid invoice items |
| `payments` | `amount > 0` | Prevent zero or negative payments |
| `payments` | Foreign keys to invoice and user | Maintain payment references |

Additional business validations must be enforced in the backend:

- Payment amount cannot exceed the outstanding invoice balance.
- Only CONFIRMED invoices can receive payments.
- Only ACTIVE subscriptions can be billed.
- Only valid subscription state transitions are allowed.
- Confirmed invoice amounts and line items must not be modified.
- Tax and discount percentages must be within valid ranges.
- Monetary calculations must use exact decimal arithmetic.

---

## 7. Financial Calculation Rules

All financial calculations must be performed in the backend using decimal arithmetic.

Example:

A subscription contains:

| Item | Quantity | Unit price | Amount |
|---|---:|---:|---:|
| Cloud Storage Basic | 2 | ₹199 | ₹398 |
| Email Service | 5 | ₹99 | ₹495 |
| **Subtotal** | | | **₹893** |

Assume a 10% discount and 18% tax.

1. Subtotal = ₹893.00
2. Discount = ₹893 × 10% = ₹89.30
3. Taxable amount = ₹893 − ₹89.30 = ₹803.70
4. Tax = ₹803.70 × 18% = ₹144.666
5. Rounded tax = ₹144.67
6. Invoice total = ₹803.70 + ₹144.67 = **₹948.37**

Store the calculated values in the invoice record. Do not recalculate historical invoices using current product, tax, or discount configurations.

---

## 8. Implementation Notes for Prisma

- Define all primary keys as UUIDs.
- Define monetary fields using Prisma `Decimal` mapped to PostgreSQL `NUMERIC`.
- Define foreign-key relationships explicitly.
- Use Prisma transactions for subscription creation, billing, invoice confirmation where applicable, and payment recording.
- Add database-level unique constraints and indexes.
- Use database migrations to manage schema changes.
- Do not directly modify the production database schema without a migration.

### Recommended indexes

| Table | Index | Purpose |
|---|---|---|
| `users` | `email` unique | Login lookup |
| `subscriptions` | `(status, next_billing_date)` | Find subscriptions due for billing |
| `subscriptions` | `customer_id` | Customer subscription lookup |
| `invoices` | `invoice_number` unique | Invoice lookup |
| `invoices` | `(subscription_id, period_start)` unique | Billing idempotency |
| `invoices` | `(customer_id, status)` | Customer invoice lookup |
| `payments` | `invoice_id` | Calculate invoice balance |
| `subscription_events` | `(subscription_id, created_at)` | Subscription history |

---

## 9. MVP Scope Notes

To keep the database manageable during the hackathon:

- Use a single PostgreSQL database.
- Use a modular monolith; no separate databases or microservices.
- Do not introduce Redis or a message queue for the MVP.
- Billing is triggered manually by an Admin.
- Payments are manually recorded; no payment gateway integration.
- Discounts are percentage-based.
- Taxes are percentage-based.
- Do not implement refunds, payment reversals, or advanced payment reconciliation.
- Do not create a separate dashboard data store.
- Keep invoice and subscription history through snapshots and event records.

The database should support the complete core workflow:

**Customer → Product → Plan → Subscription → Invoice → Payment → Dashboard**

This is the primary workflow that must work end-to-end for the Brightloop hackathon demo.