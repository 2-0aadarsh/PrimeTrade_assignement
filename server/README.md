# PrimeTrade Backend Assignment

Scalable REST API built with Express.js, MongoDB, Redis, JWT auth, RBAC, OTP email verification, refresh token flow, sliding-window rate limiting, and soft delete lifecycle for tasks.

## Tech Stack

- Node.js + Express.js (ES Modules)
- MongoDB + Mongoose
- Redis (OTP, rate-limiting backend)
- JWT (access + refresh token flow)
- Nodemailer (OTP/reset emails)
- Swagger (`/api-docs`)

## Features Implemented

- Authentication:
  - Register
  - Login
  - Refresh token rotation (no cookies, body-based token exchange)
  - Logout
  - Get profile, update profile
  - Change password
  - Forgot/reset password
- Email verification with OTP:
  - OTP generated and hashed
  - Stored in Redis with TTL and attempt/cooldown controls
- Role-based access control:
  - `user` and `admin` roles
  - Admin-only endpoints for user/task summary and user management
- Task management:
  - CRUD endpoints
  - Owner-based access for users
  - Admin can access any task
  - Soft delete support
- Soft delete lifecycle:
  - Delete marks tasks as soft-deleted
  - Scheduled cleanup permanently deletes tasks older than 60 days
- Security and scalability:
  - Helmet, CORS, HPP
  - Sliding-window Redis rate limiter (global + auth-specific)
  - Structured request and error logs with request IDs

## API Base URL

`http://localhost:5000/api/v1`

## API Docs

- Swagger UI: `http://localhost:5000/api-docs`

## Key Endpoints

### Health
- `GET /health`

### Auth
- `POST /auth/register`
- `POST /auth/verify-email-otp`
- `POST /auth/resend-email-otp`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/me`
- `PATCH /auth/change-password`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Tasks
- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:taskId`
- `PATCH /tasks/:taskId`
- `DELETE /tasks/:taskId` (soft delete)

### Admin (admin only)
- `GET /admin/summary`
- `GET /admin/users`
- `PATCH /admin/users/:userId/status`
- `PATCH /admin/users/:userId/role`
- `POST /admin/users/:userId/force-logout`

## Refresh Token Flow (No Cookies)

1. Login returns:
   - `accessToken` (short-lived)
   - `refreshToken` (long-lived)
2. Use access token in `Authorization: Bearer <token>`.
3. On access token expiry, call `POST /auth/refresh-token` with current refresh token.
4. Save rotated `accessToken` and `refreshToken` from response.
5. Call `POST /auth/logout` with refresh token to invalidate session.

## Getting Started

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env`
   - set real values
3. Start development server:
   - `npm run dev`
4. Verify:
   - `GET http://localhost:5000/api/v1/health`
   - open `http://localhost:5000/api-docs`

## Notes for Evaluation

- API follows modular, scalable folder structure.
- Auth uses secure password hashing and token-based session flow.
- Redis is used for OTP and sliding-window rate limiting.
- Tasks use soft-delete with retention-based cleanup.
