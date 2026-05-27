# Demo Credit Wallet Service

A TypeScript Node.js wallet MVP for the Demo Credit mobile lending assessment. Borrowers can receive loan disbursements and send repayments through a wallet backed by MySQL, with onboarding guarded by the Lendsqr Adjutor Karma blacklist.

## Table of Contents

- [Overview](#overview)
- [Design Goals](#design-goals)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [E-R Diagram](#e-r-diagram)
- [Authentication](#authentication)
- [Karma Blacklist Integration](#karma-blacklist-integration)
- [Wallet Operations](#wallet-operations)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Testing Strategy](#testing-strategy)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Trade-offs and Future Improvements](#trade-offs-and-future-improvements)

## Overview

Demo Credit needs wallet functionality so borrowers can:

1. Receive granted loans into a wallet
2. Send money for repayments
3. Transfer funds to other users when needed
4. Withdraw funds to external payout channels

This service implements the minimum viable wallet layer as a REST API using Node.js (LTS), TypeScript, Express, KnexJS, and MySQL.

## Design Goals

- **Correct money movement**: wallet updates and transfers run inside database transactions.
- **Safe onboarding**: users on the Adjutor Karma blacklist are rejected before account creation.
- **Simple auth for MVP**: faux bearer-token authentication without a full identity provider.
- **Auditability**: every fund, transfer, and withdrawal creates a transaction record.
- **Testability**: unit and API tests run against an in-memory SQLite database.

## Architecture

```text
Client
  |
  v
Express Routes
  |
  +--> Auth Middleware (Bearer token)
  |
  v
Controllers
  |
  v
Services
  |
  +--> User Service ----> Karma Service ----> Adjutor API
  |
  +--> Wallet Service --> Knex --> MySQL
```

### Layer Responsibilities

| Layer | Responsibility |
| --- | --- |
| Routes | HTTP routing and middleware composition |
| Controllers | Request parsing, response formatting |
| Validators | Input validation with Zod |
| Services | Business rules and database transactions |
| Middleware | Token auth and centralized error handling |
| Database | Persistent users, wallets, and transactions |

## Data Model

### `users`

Stores borrower identity and the faux access token issued at registration.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | Primary key |
| `name` | string | Full name |
| `email` | string | Unique |
| `phone` | string | Nigerian format, e.g. `+2348012345678` |
| `bvn` | string | 11-digit Bank Verification Number |
| `access_token` | string | Opaque bearer token |
| `created_at` / `updated_at` | timestamp | Audit timestamps |

### `wallets`

Each user gets exactly one wallet at onboarding.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | Primary key |
| `user_id` | integer | FK to `users.id` |
| `balance` | decimal(14,2) | Current wallet balance |
| `created_at` / `updated_at` | timestamp | Audit timestamps |

### `transactions`

Immutable ledger entries for wallet activity.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | Primary key |
| `wallet_id` | integer | FK to `wallets.id` |
| `type` | enum-like string | `fund`, `withdraw`, `transfer_in`, `transfer_out` |
| `amount` | decimal(14,2) | Transaction amount |
| `counterparty_wallet_id` | integer nullable | Other wallet involved in transfers |
| `created_at` / `updated_at` | timestamp | Audit timestamps |

## E-R Diagram

```mermaid
erDiagram
    users ||--|| wallets : "has one"
    wallets ||--o{ transactions : "ledger (wallet_id)"
    wallets ||--o| transactions : "transfer peer (counterparty_wallet_id)"

    users {
        int id PK
        string name
        string email UK
        string phone
        string bvn
        string access_token UK
        timestamp created_at
        timestamp updated_at
    }

    wallets {
        int id PK
        int user_id FK UK
        decimal balance
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        int id PK
        int wallet_id FK
        string type
        decimal amount
        string reference
        int counterparty_wallet_id FK "nullable"
        timestamp created_at
        timestamp updated_at
    }
```

Each borrower is a **user** with exactly **one wallet** (`user_id` is unique on `wallets`). Every fund, withdraw, or transfer writes one or more **transactions** against that wallet. Peer-to-peer transfers link the two sides via `counterparty_wallet_id` (set on `transfer_out` / `transfer_in` rows; null for fund and withdraw).

Relationship summary: **users (1) → (1) wallets → (many) transactions**, with `counterparty_wallet_id` pointing at the other wallet on transfers.

> Optional: export a PNG/SVG from [dbdesigner.net](https://dbdesigner.net) and save as `docs/er-diagram.png`, then add `![E-R Diagram](./docs/er-diagram.png)` above the Mermaid block.

## Authentication

This MVP uses a faux token model:

1. A user registers via `POST /api/users/register`.
2. The API generates a random 64-character hex token.
3. The token is returned once in the registration response.
4. Protected routes require:

```http
Authorization: Bearer <accessToken>
```

There is no password flow, refresh token, or token expiry in this MVP. That keeps the assessment focused on wallet behavior rather than identity management.

## Karma Blacklist Integration

Before creating a user, the service checks the following identities against Adjutor Karma:

- email
- phone
- BVN

### Adjutor Endpoint

```http
GET https://adjutor.lendsqr.com/v2/verification/karma/{identity}
Authorization: Bearer <ADJUTOR_API_KEY>
```

Reference: [Adjutor Karma Lookup docs](https://docs.adjutor.io/adjutor-api-endpoints/validation/karma-lookup)

### Decision Rules

| Adjutor response | Action |
| --- | --- |
| `status: success` with `data` | Treat as blacklisted; reject onboarding with `403` |
| `404` or not-found style message | Treat as clean; allow onboarding |
| Missing API key in local/test mode | Skip live lookup so development and tests can run offline |

If any submitted identity is blacklisted, onboarding fails and no user or wallet record is created.

## Wallet Operations

All balance changes happen inside Knex transactions.

### Fund

Credits the authenticated user's wallet and writes a `fund` transaction.

### Transfer

1. Resolve recipient by email.
2. Validate sender is not transferring to themselves.
3. Debit sender and credit recipient atomically.
4. Write matching `transfer_out` and `transfer_in` records.

### Withdraw

Debits the authenticated user's wallet when sufficient balance exists and writes a `withdraw` transaction.

## API Reference

Base URL: `http://localhost:3000`

### Health Check

```http
GET /health
```

### Register User

```http
POST /api/users/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+2348012345678",
  "bvn": "22212345678"
}
```

Success response:

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+2348012345678",
      "bvn": "22212345678"
    },
    "accessToken": "..."
  }
}
```

### Get Profile

```http
GET /api/users/me
Authorization: Bearer <accessToken>
```

### Fund Wallet

```http
POST /api/wallets/fund
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "amount": 5000
}
```

### Transfer Funds

```http
POST /api/wallets/transfer
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "recipientEmail": "recipient@example.com",
  "amount": 1500
}
```

### Withdraw Funds

```http
POST /api/wallets/withdraw
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "amount": 1000
}
```

### Get Balance

```http
GET /api/wallets/balance
Authorization: Bearer <accessToken>
```

### Get Transactions

```http
GET /api/wallets/transactions
Authorization: Bearer <accessToken>
```

## Error Handling

The API returns consistent JSON errors:

```json
{
  "success": false,
  "message": "Insufficient balance"
}
```

Common status codes:

| Code | Meaning |
| --- | --- |
| `400` | Validation failure or business rule violation |
| `401` | Missing or invalid bearer token |
| `403` | Identity found on Karma blacklist |
| `404` | User, wallet, or recipient not found |
| `409` | Duplicate user identity |
| `500` | Unexpected server error |

## Testing Strategy

Tests run with Jest and use SQLite in memory via Knex for fast isolated execution.

Coverage includes:

- Karma lookup behavior with mocked Adjutor responses
- User onboarding and blacklist rejection
- Wallet fund, transfer, withdraw, and ledger behavior
- HTTP integration flows with Supertest

Run tests:

```bash
npm test
```

## Setup

### Prerequisites

- Node.js LTS
- MySQL 8+
- Optional: Docker for local MySQL

### Install

```bash
npm install
cp .env.example .env
```

### Start MySQL (no Docker required)

Docker is **optional**. If `docker` is not installed, use a local MySQL server instead.

**Option A — MySQL already on Windows (recommended)**

1. Confirm the MySQL service is running (Services app → look for `MySQL` / `MySQL80`).
2. Set the correct credentials in `.env` (`DB_USER`, `DB_PASSWORD`). The default `root` / `root` only works if you configured MySQL that way during install.
3. Create the database and run migrations:

```bash
npm run db:create
npm run migrate
```

**Option B — Install MySQL without Docker**

1. Download [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) for Windows.
2. During setup, note the root password you choose.
3. Put that password in `.env` as `DB_PASSWORD`.
4. Run `npm run db:create` then `npm run migrate`.

**Option C — Docker (only if Docker Desktop is installed)**

```bash
docker compose up -d
npm run migrate
```

### Run Migrations

```bash
npm run migrate
```

### Start the API

```bash
npm run dev
```

The server starts on `http://localhost:3000`.

### Adjutor Setup

1. Sign up at [Adjutor](https://app.adjutor.io/login).
2. Create an app and copy the API key.
3. Add it to `.env` as `ADJUTOR_API_KEY`.

Without an API key, Karma checks are skipped for local development.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `root` |
| `DB_NAME` | MySQL database | `demo_credit_wallet` |
| `ADJUTOR_BASE_URL` | Adjutor API base URL | `https://adjutor.lendsqr.com/v2` |
| `ADJUTOR_API_KEY` | Adjutor bearer API key | empty |

## Trade-offs and Future Improvements

- Add password-based auth and token rotation.
- Persist Adjutor Karma check results for audit trails.
- Add idempotency keys for fund/transfer/withdraw requests.
- Introduce payout-provider integration for real withdrawals.
- Add pagination and filtering on transaction history.
- Use row-level locking or optimistic concurrency for high-volume transfers.

## Stack

- Node.js LTS
- TypeScript
- Express
- KnexJS
- MySQL
- Zod
- Jest
- Supertest
