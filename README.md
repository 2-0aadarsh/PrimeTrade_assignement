# PrimeTrade — Backend Developer Intern Assignment

**REST API + Role-Based Access + Task CRUD · React (Vite) demo UI**

This repository fulfills the **PrimeTrade.ai Backend Developer (Intern)** take-home: a **scalable REST API** with **authentication, JWT sessions, and user vs admin roles**, plus a **React frontend** to register, log in, use a protected dashboard, and perform **full CRUD** on a secondary entity (**tasks**). It is structured as a **monorepo** (`server/` + `client/`).

---

## Table of contents

- [About this project](#about-this-project)
- [Assignment requirements coverage](#assignment-requirements-coverage)
- [Features](#features)
  - [Backend (primary)](#backend-primary)
  - [Frontend (supportive)](#frontend-supportive)
  - [Security & scalability](#security--scalability)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [UI screenshots](#ui-screenshots)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API documentation](#api-documentation)
- [Scalability & deployment notes](#scalability--deployment-notes)
- [Deliverables checklist](#deliverables-checklist)
- [License](#license)

---

## About this project

**Goal (per assignment brief):** Design a **secure, scalable backend** with **REST APIs**, **JWT authentication**, **role-based access (user / admin)**, **CRUD for a secondary entity**, **API versioning**, **validation & error handling**, **database schema**, and **API docs (Swagger or Postman)**. Include a **basic React UI** to **register / log in**, open a **JWT-protected dashboard**, run **CRUD on the entity**, and surface **success / error messages** from the API.

**What this repo delivers:** A production-style **Express (ESM)** API backed by **MongoDB** and **Redis** (OTP + rate limiting), **Swagger** at `/api-docs`, and a **Vite + React** SPA with auth flows, task management, admin panel, account settings, and consistent UI feedback (alerts, modals, toasts).

---

## Assignment requirements coverage

| Requirement (brief) | Implementation |
|---------------------|----------------|
| User **registration & login**, **password hashing**, **JWT** | `bcrypt` hashing; **access JWT** + **refresh token** rotation; login / register / logout |
| **Role-based access** (user vs **admin**) | `user` / `admin` on User model; `protect` + `authorize` middleware; admin-only routes |
| **CRUD** on a secondary entity | **Tasks**: create, list (filters/pagination), read one, update, **soft delete** |
| **API versioning**, **errors**, **validation** | Routes under **`/api/v1`**; centralized error handler; per-route validators |
| **API documentation** (Swagger / Postman) | **Swagger UI** — see [API documentation](#api-documentation) |
| **Database schema** (Postgres / MySQL / **MongoDB**) | **MongoDB** + Mongoose models (`User`, `Task`) |
| **React** (or Next / vanilla) UI | **React 19 + Vite** SPA |
| Register & log in, **protected dashboard**, **CRUD**, **API messages** | Full flows + `AlertMessage`, modals, **toast** notifications |
| **Secure JWT handling** | Bearer access token; refresh endpoint; logout invalidation patterns |
| **Input validation** | Server-side validators; password complexity rules |
| **Scalable structure** | Modular `routes` / `controllers` / `models` / `middlewares` |
| **Optional: Redis, logging, Docker** | **Redis** (OTP, rate limits); **structured logging**; Docker not bundled (optional extension) |

---

## Features

### Backend (primary)

- **Authentication**
  - Register, login, logout  
  - **Email verification** via **6-digit OTP** (stored hashed in Redis, TTL, cooldown, attempt limits)  
  - **Refresh token** flow (body-based, no cookies)  
  - **Forgot / reset password** (reset token in Redis)  
  - **Profile** update (`PATCH /auth/me`), **change password**  
- **Authorization**
  - **JWT** on protected routes; **admin-only** namespace for summary, users, management actions  
- **Tasks (secondary entity)**
  - Full **CRUD**; **owner** scoping for normal users; **admin** sees all / filters by owner  
  - **Soft delete** + scheduled cleanup of old deleted tasks  
- **Cross-cutting**
  - **Helmet**, **HPP**, JSON body limits  
  - **Sliding-window rate limiting** (global + stricter on auth routes)  
  - **CORS**: localhost dev origins + **`CORS_ORIGINS`** for deployed frontends  

### Frontend (supportive)

- **Auth:** registration, OTP verification, login, forgot / reset password  
- **Protected areas:** dashboard (overview), **tasks** (search, filters, pagination, create/edit modal, delete confirm)  
- **Admin (role admin):** system summary, user list, enable/disable account, change role, invalidate sessions  
- **Account:** display name, email note, change password (re-login flow)  
- **UX:** dark theme, responsive shell, **inline errors**, **success alerts**, **toasts** for key actions  

### Security & scalability

- Passwords **never** returned from API; **hashed** at rest  
- Access token short-lived; refresh rotated on use where applicable  
- Validation on inputs; consistent **HTTP status codes** and JSON error shape  
- **Redis** for shared rate-limit / OTP state (fits horizontal scale-out behind a load balancer)  
- **Request logging** with correlation-style context  

---

## Tech stack

| Layer | Choices |
|-------|---------|
| API | Node.js, **Express 5**, ES modules |
| Auth | **JWT** (access), opaque **refresh** token (hashed server-side) |
| Data | **MongoDB** + **Mongoose** |
| Cache / limits | **Redis** (ioredis) |
| Email | **Nodemailer** (OTP & reset) |
| Docs | **Swagger** (`swagger-jsdoc`, `swagger-ui-express`) |
| UI | **React**, **React Router**, **Vite**, **Axios** (interceptors + refresh retry) |

---

## Repository structure

```text
├── client/                 # React (Vite) SPA
│   ├── src/
│   │   ├── pages/          # Dashboard, Tasks, Admin, Auth, Account, …
│   │   ├── components/     # Layout, UI, modals
│   │   ├── services/       # API client (axios), auth, tasks, admin
│   │   └── …
│   └── .env                # local only — VITE_API_BASE_URL (not committed)
├── server/
│   ├── src/
│   │   ├── routes/         # auth, tasks, admin
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── docs/           # Swagger setup
│   │   └── …
│   ├── .env.example
│   └── README.md           # Deep dive: endpoints, refresh flow, env list
├── docs/
│   └── screenshots/        # Add UI images for this README (see below)
└── README.md                 # You are here
```

---

## UI screenshots

Add your captures under **`docs/screenshots/`** and keep paths in sync with the lines below. GitHub renders images from the repo.

**Suggested set (rename files to match what you commit):**

| Screen | Suggested filename | What to show |
|--------|-------------------|--------------|
| Overview / dashboard | `overview.png` | Logged-in dashboard, stats, recent tasks |
| Tasks | `tasks.png` | List, filters, table, actions |
| Task modal | `task-modal.png` | Create / edit task form |
| Admin | `admin.png` | Summary cards + user management table |
| Account | `account.png` | Profile + change password |
| Auth | `login.png` | Login or registration flow |

**Markdown examples (uncomment when files exist):**

```markdown
![Overview](docs/screenshots/overview.png)
![Tasks](docs/screenshots/tasks.png)
![Admin panel](docs/screenshots/admin.png)
```

**GitHub tip:** You can paste images while editing `README.md` on github.com; move uploaded assets into `docs/screenshots/` if you want a tidy tree.

---

## Getting started

### Prerequisites

- **Node.js** 18+  
- **MongoDB** (local or Atlas)  
- **Redis** (recommended; OTP + rate limits degrade gracefully if Redis is down — check server logs)

### 1. Backend

```bash
cd server
npm install
cp .env.example .env    # Windows: copy .env.example .env
# Edit .env — secrets, MONGO_URI, Redis, mail, JWT, …
npm run dev
```

- Health: `GET http://localhost:5000/api/v1/health`  
- API base: `http://localhost:5000/api/v1`  
- Swagger: `http://localhost:5000/api-docs`  

### 2. Frontend

```bash
cd client
npm install
```

Create **`client/.env`** (gitignored):

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api/v1
```

```bash
npm run dev
```

Open **`http://localhost:5173`**.  
For **production builds** (e.g. Netlify), set **`VITE_API_BASE_URL`** to your public API URL including **`/api/v1`**.

### 3. CORS (deployed UI + API)

Set **`CORS_ORIGINS`** on the server to your frontend origin(s), e.g. `https://your-app.netlify.app`.  
Local **`http://localhost`**, **`127.0.0.1`**, **`[::1]`** (any port) are allowed for development — see `server/src/server.js`.

---

## Environment variables

| Area | Notes |
|------|--------|
| **Server** | Copy **`server/.env.example`** → `.env`. Covers MongoDB, JWT, Redis, email, rate limits, OTP/reset TTLs, **`CORS_ORIGINS`**, etc. |
| **Client** | **`VITE_API_BASE_URL`** — must match your API base (**…/api/v1**). Set in Netlify / Vercel env for production builds. |

---

## API documentation

- **Swagger UI:** `GET /api-docs` on the same host as the API (e.g. `http://localhost:5000/api-docs`).  
- OpenAPI spec is generated from JSDoc-style definitions in **`server/src/docs/swagger.js`**.  
- A **Postman collection** is optional for this assignment if Swagger is provided; you can export from Swagger or maintain a collection separately.

Full endpoint list and refresh-token sequence: **[server/README.md](server/README.md)**.

---

## Scalability & deployment notes

**Short note (assignment deliverable):**

- **Stateless API:** JWT access checks + refresh body; no server-side session store required for basic scaling.  
- **Redis:** Shared store for **OTP**, **password-reset tokens**, and **sliding-window rate limits** — multiple Node instances can share one Redis cluster behind a load balancer.  
- **MongoDB:** Atlas or replica sets for durability and read scaling; tasks use indexes on owner / soft-delete flags.  
- **Next steps if traffic grows:** separate **read replicas**, **queue** for email, **horizontal pod/instance** count with same env + Redis + DB string, optional **CDN** for static frontend, **API gateway** if splitting services later.  
- **Docker:** Not included by default; you can add a `Dockerfile` per app and `docker-compose` for Mongo + Redis + API for demos.

---

## Deliverables checklist

| Deliverable | Status |
|-------------|--------|
| GitHub repo with **README** (this file) | Included |
| **Working** auth + task **CRUD** APIs | Yes — run server + see Swagger |
| **Basic frontend** wired to APIs | Yes — `client/` |
| **API documentation** | **Swagger** at `/api-docs` |
| **Scalability note** | [Section above](#scalability--deployment-notes) |

---

## License

Submitted as part of the **PrimeTrade.ai** hiring process. Use and redistribution per team / author policy.
