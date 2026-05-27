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

