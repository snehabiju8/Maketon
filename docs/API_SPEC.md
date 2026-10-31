# Brightloop – API Specification

**Document:** API Specification  
**Project:** Brightloop Subscription Management System  
**Version:** 1.0  
**Base URL:** `/api/v1`  
**Protocol:** HTTP/1.1 (JSON)  

---

## 1. Overview & Conventions

All endpoints accept and return `application/json` payloads unless otherwise specified.

### 1.1 Response Envelope Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "errors": { ... }
}
```

### 1.2 Common HTTP Status Codes

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request / VALIDATION_ERROR`: Malformed input or validation failure.
- `401 Unauthorized / UNAUTHENTICATED`: Missing or invalid authentication token.
- `403 Forbidden / FORBIDDEN`: Insufficient permissions for the requested action.
- `404 Not Found / NOT_FOUND`: Resource with the specified identifier does not exist.
- `409 Conflict / CONFLICT`: Resource duplicate or conflicting state.
- `500 Internal Server Error`: Unexpected server-side failure.

---

## 2. Taxes Module

Base Path: `/api/v1/taxes`

The Taxes module manages regional and regulatory tax rules applicable to subscriptions and invoices. Rates are stored in PostgreSQL as `Decimal(5, 2)` (precision 5, scale 2) allowing exact non-negative percentage rates up to `999.99%` without floating-point rounding errors.

### 2.1 List Taxes

Retrieves all configured tax rates, sorted descending by creation date (`createdAt DESC`).

- **Method:** `GET`
- **Path:** `/api/v1/taxes`
- **Query Parameters:**
  - `isActive` *(optional, boolean | "true" | "false")*: Filter taxes by active status.

#### Request Example
```http
GET /api/v1/taxes?isActive=true HTTP/1.1
Host: localhost:5000
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Taxes retrieved successfully",
  "data": [
    {
      "id": "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "GST 18%",
      "rate": "18.00",
      "isActive": true,
      "createdAt": "2026-10-31T10:00:00.000Z"
    },
    {
      "id": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      "name": "GST 5%",
      "rate": "5.00",
      "isActive": true,
      "createdAt": "2026-10-31T09:30:00.000Z"
    }
  ]
}
```

#### Error Responses
- **400 Bad Request** (`code: "VALIDATION_ERROR"`):
  - Invalid query parameter value (e.g. `?isActive=invalid`).

---

### 2.2 Create Tax

Creates a new tax rate rule.

- **Method:** `POST`
- **Path:** `/api/v1/taxes`
- **Request Headers:**
  - `Content-Type: application/json`

#### Request Fields
| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `name` | string | Yes | 1–255 characters, non-blank | Descriptive name (e.g., `"GST 18%"`). |
| `rate` | number \| string | Yes | `>= 0.00`, `<= 999.99`, max 2 decimal places | Tax percentage rate. |
| `isActive` | boolean | No | Default: `true` | Whether the tax rule is active. |

#### Request Example
```json
{
  "name": "GST 18%",
  "rate": 18.00,
  "isActive": true
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Tax created successfully",
  "data": {
    "id": "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "GST 18%",
    "rate": "18.00",
    "isActive": true,
    "createdAt": "2026-10-31T10:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (`code: "VALIDATION_ERROR"`):
  - Missing required `name` or `rate`.
  - Blank/whitespace-only `name`.
  - Negative `rate` (`rate < 0`).
  - Rate exceeding `999.99%`.
  - Rate with more than 2 decimal places (e.g., `18.125`).
  - Non-numeric string rate (e.g., `"eighteen"`).
  - Invalid `isActive` type.

---

### 2.3 Get Tax by ID

Retrieves a single tax rate rule by its unique identifier.

- **Method:** `GET`
- **Path:** `/api/v1/taxes/:id`
- **Path Parameters:**
  - `id` *(UUID, required)*: The unique ID of the tax record.

#### Request Example
```http
GET /api/v1/taxes/c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 HTTP/1.1
Host: localhost:5000
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Tax retrieved successfully",
  "data": {
    "id": "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "GST 18%",
    "rate": "18.00",
    "isActive": true,
    "createdAt": "2026-10-31T10:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (`code: "VALIDATION_ERROR"`):
  - Invalid UUID format in URL path.
- **404 Not Found** (`code: "NOT_FOUND"`):
  - Tax record with the specified ID does not exist.

---

### 2.4 Update Tax (Partial)

Partially updates fields of an existing tax rule. Omitted fields remain unchanged.

- **Method:** `PATCH`
- **Path:** `/api/v1/taxes/:id`
- **Path Parameters:**
  - `id` *(UUID, required)*: The unique ID of the tax record.
- **Request Headers:**
  - `Content-Type: application/json`

#### Request Fields
At least one field must be supplied:

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `name` | string | Optional | 1–255 characters, non-blank | Updated tax name. |
| `rate` | number \| string | Optional | `>= 0.00`, `<= 999.99`, max 2 decimals | Updated tax rate percentage. |
| `isActive` | boolean | Optional | Boolean | Updated active state. |

#### Request Example
```json
{
  "rate": 12.00,
  "isActive": false
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Tax updated successfully",
  "data": {
    "id": "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "GST 18%",
    "rate": "12.00",
    "isActive": false,
    "createdAt": "2026-10-31T10:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (`code: "VALIDATION_ERROR"`):
  - Empty update payload (`{}`).
  - Blank/empty `name`.
  - Negative `rate` or rate `> 999.99%`.
  - Rate with `> 2` decimal places.
  - Invalid `isActive` boolean value.
  - Invalid UUID format in URL path.
- **404 Not Found** (`code: "NOT_FOUND"`):
  - Tax record with specified ID not found.
