
# Backend Architecture & Codebase Guide

This backend powers a **dog owner ↔ dog trainer marketplace** built on **Node.js, TypeScript, MongoDB, and Mongoose**.

The architecture is designed to be:

* **Scalable**
* **Role-aware (owner / trainer / admin / future roles)**
* **Audit-safe**
* **Easy to reason about**
* **Production-ready**

This document explains **what each folder does, why it exists, and what lives inside it**.

---

## High-level architecture principles

1. **Separation of concerns**

   * HTTP, business logic, database access, and utilities are isolated
2. **Enums live in code**

   * No “magic strings”
3. **Auditability**

   * Sensitive actions are traceable
4. **Mongo-friendly**

   * Reference-based modeling, not deep embedding
5. **Future-proof**

   * Supports admin flows, payments, growth

---

## Project structure overview

```txt
src/
├── app.ts
├── server.ts
├── config/
├── database/
├── constants/
├── models/
├── repositories/
├── services/
├── controllers/
├── routes/
├── middlewares/
├── validators/
├── utils/
├── types/
└── jobs/
```

---

## Entry point

### `server.ts`

**What it has**

* Starts the HTTP server
* Calls `app.listen`

**Why**

* Keeps environment-specific boot logic isolated

---

### `app.ts`

**What it has**

* Express app
* Middleware registration
* Route mounting
* Global error handler

**Why**

* Testable without starting a server
* Clean startup flow

---

## Configuration layer

### `config/`

```txt
config/
├── env.ts
├── database.ts
├── stripe.ts
├── logger.ts
```

**Purpose**
Centralized configuration and environment handling.

**Why this exists**

* Prevents `process.env` usage scattered across code
* Makes config validation explicit

**What each file does**

* `env.ts` → Loads and validates environment variables
* `database.ts` → MongoDB connection options
* `stripe.ts` → Stripe client initialization
* `logger.ts` → Logging configuration (Winston / Pino)

---

## Database bootstrap

### `database/`

```txt
database/
├── connect.ts
├── indexes.ts
```

**Purpose**
MongoDB connection and index initialization.

**Why**

* Keeps database setup separate from app logic
* Ensures indexes are created safely

---

## Constants (ENUM SOURCE OF TRUTH)

### `constants/`

```txt
constants/
├── role.constants.ts
├── user.constants.ts
├── booking.constants.ts
├── audit.constants.ts
├── dog.constants.ts
├── payment.constants.ts
```

**Purpose**
Defines **all enums and controlled vocabularies** used across the app.

**Why**

* Prevents invalid values
* Backend and frontend stay in sync
* Safer refactors

**Examples**

* Booking status
* Audit actions
* User status
* Dog size
* Payment status

---

## Models (Mongoose schemas only)

### `models/`

```txt
models/
├── user/
│   ├── User.model.ts
│   ├── Role.model.ts
│   └── UserRole.model.ts
│
├── profiles/
│   ├── DogTrainer.model.ts
│   └── DogOwner.model.ts
│
├── trainer/
│   ├── TrainerService.model.ts
│   ├── TrainerCertification.model.ts
│   └── TrainerAvailability.model.ts
│
├── dogs/
│   ├── Dog.model.ts
│   └── DogPhoto.model.ts
│
├── booking/
│   ├── Booking.model.ts
│   └── Review.model.ts
│
├── payment/
│   ├── Payment.model.ts
│   └── Payout.model.ts
│
├── system/
│   ├── Location.model.ts
│   ├── Notification.model.ts
│   └── AuditLog.model.ts
```

**Purpose**
Define database structure only.

**Rules**

* No business logic
* No Express imports
* Only schema, indexes, hooks

**Why**

* Predictable data layer
* Easier testing and migration

---

## Repositories (DB access layer)

### `repositories/`

```txt
repositories/
├── user.repository.ts
├── trainer.repository.ts
├── owner.repository.ts
├── booking.repository.ts
├── review.repository.ts
├── payment.repository.ts
├── audit.repository.ts
```

**Purpose**
Encapsulates **all database queries**.

**Why**

* Controllers and services don’t talk directly to Mongoose
* Central place to optimize queries
* Easy mocking in tests

---

## Services (business logic)

### `services/`

```txt
services/
├── auth/
│   ├── AuthService.ts
│   └── PasswordService.ts
│
├── user/
│   └── UserService.ts
│
├── trainer/
│   └── TrainerService.ts
│
├── booking/
│   └── BookingService.ts
│
├── payment/
│   └── PaymentService.ts
│
├── audit/
│   └── AuditService.ts
│
├── notification/
│   └── NotificationService.ts
```

**Purpose**
All **application rules and workflows** live here.

**Examples**

* Booking validation
* Role checks
* Payment handling
* Audit logging triggers

**Why**

* Keeps controllers thin
* Business rules stay reusable

---

## Controllers (HTTP layer)

### `controllers/`

```txt
controllers/
├── auth.controller.ts
├── user.controller.ts
├── trainer.controller.ts
├── booking.controller.ts
├── review.controller.ts
├── payment.controller.ts
└── admin.controller.ts
```

**Purpose**
Handle HTTP requests and responses.

**Responsibilities**

* Parse request
* Call service
* Send response

**What they should NOT do**

* Database queries
* Business logic

---

## Routes (API surface)

### `routes/`

```txt
routes/
├── index.ts
├── auth.routes.ts
├── user.routes.ts
├── trainer.routes.ts
├── booking.routes.ts
├── review.routes.ts
├── payment.routes.ts
└── admin.routes.ts
```

**Purpose**
Defines API endpoints and attaches middleware.

**Why**

* Clean routing
* Easy versioning later

---

## Middlewares

### `middlewares/`

```txt
middlewares/
├── auth.middleware.ts
├── role.middleware.ts
├── audit.middleware.ts
├── error.middleware.ts
├── rateLimit.middleware.ts
```

**Purpose**
Cross-cutting concerns.

**Examples**

* Authentication
* Role authorization
* Automatic audit logging
* Global error handling

---

## Validators

### `validators/`

```txt
validators/
├── auth.validator.ts
├── booking.validator.ts
├── trainer.validator.ts
├── review.validator.ts
```

**Purpose**
Validate request payloads using Zod / Joi / Yup.

**Why**

* Fail fast
* Prevent invalid data from entering services

---

## Utils

### `utils/`

```txt
utils/
├── date.util.ts
├── geo.util.ts
├── token.util.ts
├── pagination.util.ts
```

**Purpose**
Pure helper functions with no side effects.

---

## Types

### `types/`

```txt
types/
├── api.types.ts
├── pagination.types.ts
├── jwt.types.ts
```

**Purpose**
Shared TypeScript types across the backend.

---

## Background jobs

### `jobs/`

```txt
jobs/
├── notification.job.ts
├── payout.job.ts
├── cleanup.job.ts
```

**Purpose**
Async and scheduled work.

**Examples**

* Sending notifications
* Processing payouts
* Cleanup tasks

---

