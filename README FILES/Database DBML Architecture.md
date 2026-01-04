
# 🐶 Dog Training Platform – Database Schema

This document describes the **core database schema** for a dog training platform connecting **dog owners** and **dog trainers**, including bookings, payments, reviews, notifications, and audit logging.

---

## 📌 Conventions Used

* **UUID** for all primary and foreign keys
* **Soft states** instead of hard deletes where applicable
* **Timestamps** (`created_at`, `updated_at`) for traceability
* Stripe-ready payment modeling
* Geo-ready location storage

---

## 1️⃣ Users & Roles

### `users`

Stores authentication and basic user identity.

| Column     | Type      | Notes            |           |          |
| ---------- | --------- | ---------------- | --------- | -------- |
| id         | uuid      | Primary key      |           |          |
| email      | varchar   | Unique, required |           |          |
| password   | varchar   | Hashed           |           |          |
| first_name | varchar   | Required         |           |          |
| last_name  | varchar   | Required         |           |          |
| phone      | varchar   | Optional         |           |          |
| status     | varchar   | `active          | suspended | deleted` |
| created_at | timestamp |                  |           |          |
| updated_at | timestamp |                  |           |          |

---

### `roles`

Defines platform roles.

| Column | Type    | Notes       |         |       |         |
| ------ | ------- | ----------- | ------- | ----- | ------- |
| id     | uuid    | Primary key |         |       |         |
| name   | varchar | `owner      | trainer | admin | future` |

---

### `user_roles`

Many-to-many mapping between users and roles.

| Column  | Type |
| ------- | ---- |
| user_id | uuid |
| role_id | uuid |

**Constraints**

* `(user_id, role_id)` must be unique

---

## 2️⃣ Profiles

### `dog_trainers`

Trainer-specific profile data.

| Column              | Type          |
| ------------------- | ------------- |
| id                  | uuid          |
| user_id             | uuid (unique) |
| years_of_experience | int           |
| bio                 | text          |
| is_verified         | boolean       |
| average_rating      | float         |
| total_reviews       | int           |
| created_at          | timestamp     |
| updated_at          | timestamp     |

---

### `dog_owners`

Owner-specific profile data.

| Column     | Type          |
| ---------- | ------------- |
| id         | uuid          |
| user_id    | uuid (unique) |
| created_at | timestamp     |
| updated_at | timestamp     |

---

## 3️⃣ Locations (Geo-Ready)

### `locations`

Stores physical location data for users.

| Column    | Type    |
| --------- | ------- |
| id        | uuid    |
| user_id   | uuid    |
| address   | varchar |
| city      | varchar |
| state     | varchar |
| zip_code  | varchar |
| latitude  | float   |
| longitude | float   |

---

## 4️⃣ Trainer Business Data

### `trainer_services`

Services offered by trainers.

| Column           | Type      |
| ---------------- | --------- |
| id               | uuid      |
| trainer_id       | uuid      |
| name             | varchar   |
| description      | text      |
| duration_minutes | int       |
| price            | float     |
| is_active        | boolean   |
| created_at       | timestamp |
| updated_at       | timestamp |

---

### `trainer_certifications`

Professional certifications for trainers.

| Column     | Type      |
| ---------- | --------- |
| id         | uuid      |
| trainer_id | uuid      |
| name       | varchar   |
| issued_by  | varchar   |
| issued_at  | date      |
| created_at | timestamp |
| updated_at | timestamp |

---

### `trainer_availability`

Weekly availability slots.

| Column      | Type      |
| ----------- | --------- |
| id          | uuid      |
| trainer_id  | uuid      |
| day_of_week | int (0–6) |
| start_time  | time      |
| end_time    | time      |
| created_at  | timestamp |
| updated_at  | timestamp |

---

## 5️⃣ Dogs

### `dogs`

Dogs owned by users.

| Column     | Type      |
| ---------- | --------- |
| id         | uuid      |
| owner_id   | uuid      |
| name       | varchar   |
| breed      | varchar   |
| age        | int       |
| size       | varchar   |
| notes      | text      |
| created_at | timestamp |
| updated_at | timestamp |

---

### `dog_photos`

Stores dog images.

| Column     | Type      |
| ---------- | --------- |
| id         | uuid      |
| dog_id     | uuid      |
| photo_url  | varchar   |
| created_at | timestamp |

---

## 6️⃣ Bookings (Core System)

### `bookings`

Central scheduling entity.

| Column              | Type      | Notes    |          |           |            |
| ------------------- | --------- | -------- | -------- | --------- | ---------- |
| id                  | uuid      |          |          |           |            |
| trainer_id          | uuid      |          |          |           |            |
| owner_id            | uuid      |          |          |           |            |
| dog_id              | uuid      |          |          |           |            |
| service_id          | uuid      | Optional |          |           |            |
| start_time          | timestamp |          |          |           |            |
| end_time            | timestamp |          |          |           |            |
| price_snapshot      | float     |          |          |           |            |
| status              | varchar   | `pending | accepted | cancelled | completed` |
| cancellation_reason | text      |          |          |           |            |
| created_at          | timestamp |          |          |           |            |

---

## 7️⃣ Reviews

### `reviews`

One review per completed booking.

| Column     | Type          |
| ---------- | ------------- |
| id         | uuid          |
| booking_id | uuid (unique) |
| trainer_id | uuid          |
| owner_id   | uuid          |
| rating     | int (1–5)     |
| comment    | text          |
| created_at | timestamp     |

---

## 8️⃣ Payments & Payouts (Stripe-Ready)

### `payments`

Customer payments.

| Column     | Type               |      |        |            |
| ---------- | ------------------ | ---- | ------ | ---------- |
| id         | uuid               |      |        |            |
| booking_id | uuid               |      |        |            |
| amount     | float              |      |        |            |
| currency   | varchar            |      |        |            |
| provider   | varchar (`stripe`) |      |        |            |
| status     | varchar (`pending  | paid | failed | refunded`) |
| created_at | timestamp          |      |        |            |

---

### `payouts`

Trainer payouts.

| Column       | Type              |             |
| ------------ | ----------------- | ----------- |
| id           | uuid              |             |
| trainer_id   | uuid              |             |
| amount       | float             |             |
| status       | varchar (`pending | processed`) |
| processed_at | timestamp         |             |

---

## 9️⃣ Notifications & Audit Logs

### `notifications`

User notifications.

| Column     | Type      |
| ---------- | --------- |
| id         | uuid      |
| user_id    | uuid      |
| type       | varchar   |
| message    | text      |
| is_read    | boolean   |
| created_at | timestamp |

---

### `audit_logs`

System-wide activity tracking.

| Column        | Type      |
| ------------- | --------- |
| id            | uuid      |
| actor_user_id | uuid      |
| action        | varchar   |
| entity        | varchar   |
| entity_id     | uuid      |
| created_at    | timestamp |

---

## 🔗 Relationships Summary

* `users ↔ roles` → `user_roles`
* `users → dog_trainers / dog_owners`
* `users → locations`
* `dog_trainers → services / certifications / availability`
* `dog_owners → dogs → dog_photos`
* `bookings → payments → reviews`
* `users → notifications`
* `users → audit_logs`

---

## ✅ Design Notes

* Designed for **scalability**, **auditability**, and **clear ownership**
* Stripe-compatible without tight coupling
* Supports multi-role users
* Ready for mobile + web clients

---
