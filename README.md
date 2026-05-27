# Inventory Ledger API

A RESTful inventory tracking API built with Node.js, Express, and SQLite.

## Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: SQLite (via `better-sqlite3`)
- **Testing**: Jest + Supertest
- **Frontend**: Vanilla HTML/CSS/JS

---

## Installation

```bash
npm install
```

---

## Running the App

```bash
npm start
```

The server starts at `http://localhost:3000`.
The frontend is served from the `/public` folder at the root URL.

For development with auto-reload:

```bash
npm run dev
```

---

## Running Tests

```bash
npm test
```

Tests use an in-memory SQLite database and are fully isolated — no production data is affected.

---

## API Overview

### POST /entries

Create a new stock entry.

**Body:**
```json
{
  "warehouse_id": "WH-01",
  "category": "Electronics",
  "item_name": "USB Hub",
  "week_number": 10,
  "quantity": 50,
  "unit": "units",
  "recorded_by": "Alice"
}
```

**Responses:**
- `201` — Entry created
- `400` — Validation error
- `409` — Duplicate entry

---

### GET /entries

List all entries with optional filters.

**Query params:** `category`, `warehouse_id`, `week_number`, `min_quantity`

**Response:**
```json
{ "count": 1, "entries": [...] }
```

---

### GET /summary

Aggregated totals grouped by category and week.

**Response:**
```json
{
  "summary": [
    { "category": "Electronics", "week_number": 10, "total_quantity": 50, "entry_count": 1 }
  ]
}
```

---

### DELETE /entries/:id

Delete an entry by ID.

- `200` — Deleted
- `404` — Not found

---

## Validation Rules

| Field | Rules |
|---|---|
| `warehouse_id` | Required, 2–20 chars, A-Z 0-9 hyphens only |
| `category` | One of: Electronics, Textiles, Chemicals, Furniture, Pharma |
| `item_name` | Required, 1–100 chars |
| `week_number` | Integer, 1–52 |
| `quantity` | Integer, >= 0 |
| `unit` | One of: units, kg, litres |
| `recorded_by` | Required, 1–80 chars |

---

## Assumptions

- `week_number` follows ISO week convention (1–52).
- `quantity` of 0 is valid (item tracked but out of stock).
- Duplicate = same `(warehouse_id, category, item_name, week_number)` combination.
- `created_at` is auto-generated in UTC ISO 8601 format.
- All query filters are optional and combinable.
