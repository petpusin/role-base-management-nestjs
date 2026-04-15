# RBAC API — NestJS

A production-grade **Role-Based Access Control** REST API built with NestJS 11, TypeORM, and PostgreSQL. Provides fine-grained access management through a three-tier guard pipeline: JWT authentication → role enforcement → permission enforcement with wildcard support.

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9+-F69220?logo=pnpm&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?logo=docker&logoColor=white)

Interactive API documentation is available at `/api/docs` (Swagger UI) once the server is running.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Docker](#docker)
- [Deploying to Google Cloud Run](#deploying-to-google-cloud-run)
- [API Endpoints](#api-endpoints)
- [Quality Control](#quality-control)

---

## Project Overview

This API manages three core domain entities and their relationships:

| Entity | Responsibility |
|---|---|
| **User** | Application accounts with `active / inactive / suspended` status |
| **Role** | Named groups (`admin`, `editor`, `user`) assigned to users |
| **Permission** | Granular `resource:action` slugs (e.g., `users:read`) assigned to roles |

**Permission actions:** `create` · `read` · `update` · `delete` · `manage`

The `manage` action acts as a wildcard — a role holding `users:manage` satisfies any `users:*` check without needing individual grants.

**Seeded baseline roles:**

| Role | Grants |
|---|---|
| `admin` | `users:manage`, `roles:manage`, `permissions:manage` |
| `editor` | `users:create/read/update`, `roles:read`, `permissions:read` |
| `user` | `users:read` |

---

## Architecture

### Module Structure

The project follows NestJS's feature-module pattern. Each domain is self-contained:

```
src/
├── app.module.ts           # Root — registers TypeORM, ConfigModule, global JwtAuthGuard
├── auth/                   # JWT strategy, guards, decorators, login endpoint
├── users/                  # User entity, CRUD service, controller
├── roles/                  # Role entity, CRUD service, controller
├── permissions/            # Permission entity, CRUD service, controller
├── common/entities/        # BaseEntity (UUID PK, soft-delete, timestamps)
└── database/               # TypeORM CLI DataSource, migration files
```

`AppModule` uses `autoLoadEntities: true` — entities are registered through each module's `TypeOrmModule.forFeature()` call, not listed centrally.

### Guard Pipeline

Every route is protected by default. The three guards execute in this order on every request:

```
Request
  │
  ▼
JwtAuthGuard (APP_GUARD — global)
  │  Verifies Bearer token. On success, calls JwtStrategy.validate()
  │  which does a live DB fetch (user + roles + permissions).
  │  Result is attached to request.user.
  │  Routes decorated with @Public() bypass this guard entirely.
  │
  ▼
RolesGuard (@UseGuards on controller/handler)
  │  Reads @Roles() metadata from the route.
  │  Checks request.user.roles[].name.
  │
  ▼
PermissionsGuard (@UseGuards on controller/handler)
     Reads @Permissions() metadata from the route.
     Resolves slugs from request.user.roles[].permissions[].slug.
     Wildcard: users:manage satisfies any users:* check.
```

> **Why a live DB fetch on every request?** `JwtStrategy.validate()` always reloads the user from the database, so role revocations and account suspensions take effect on the very next request — no token blocklist infrastructure needed.

### Key Decorators

| Decorator | Scope | Purpose |
|---|---|---|
| `@Public()` | Route / controller | Bypasses `JwtAuthGuard` entirely |
| `@Roles('admin', 'editor')` | Route / controller | Declares required role names |
| `@Permissions('users:read')` | Route / controller | Declares required permission slugs |
| `@CurrentUser()` | Handler parameter | Injects `request.user`; accepts an optional field key: `@CurrentUser('id')` |

---

## Getting Started

### Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- PostgreSQL ≥ 15

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=rbac_db

# Auth
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=1d

# TypeORM — leave both false in production
DB_SYNC=false
DB_LOGGING=false
```

> `DB_SYNC=false` is intentional. The schema is owned by migrations, not TypeORM's `synchronize`.

### 3. Run migrations and seed data

```bash
pnpm db:migrate
```

This runs two migrations in order:
1. `CreateSchema` — creates enums, tables, indexes, and foreign keys
2. `SeedRolesAndPermissions` — inserts the three baseline roles and 15 permissions using fixed UUIDs (`ON CONFLICT DO NOTHING` — safe to re-run)

```bash
pnpm db:migrate:revert   # roll back the last migration
pnpm db:migrate:show     # list applied / pending migrations
pnpm db:migrate:create   # scaffold a new blank migration file
```

### 4. Start the server

```bash
pnpm start:dev     # development — watch mode with hot reload
pnpm build && pnpm start:prod   # production
```

The API runs on `http://localhost:3000` (override with the `PORT` env var).  
Swagger UI: `http://localhost:3000/api/docs`

---

## Docker

The image uses a **5-stage multi-stage build** to keep the final layer as small as possible. Only compiled JavaScript and production `node_modules` are included — no TypeScript compiler, devDependencies, or source files.

### Build

```bash
# Always target linux/amd64 — Cloud Run and most CI runners use this architecture.
# Building on Apple Silicon (M-series) without --platform produces an arm64 image
# that crashes at runtime due to native module (bcrypt) ABI mismatch.
docker build --platform linux/amd64 -t role-base-management .
```

### Run locally

```bash
docker run --rm \
  --platform linux/amd64 \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=rbac_db \
  -e DB_SYNC=false \
  -e DB_LOGGING=false \
  -e JWT_SECRET=your-jwt-secret \
  role-base-management
```

> Use `-p 3001:3000` to avoid conflicting with a local dev server on port 3000.  
> Do not pass values with surrounding quotes — Docker `--env-file` does not strip them, unlike Node's `dotenv`.

---

## Deploying to Google Cloud Run

### Prerequisites

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
- A GCP project with billing enabled

### 1. Set variables

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-southeast1"
export REPO="my-docker-repo"
export IMAGE="role-base-management"
export SERVICE="role-base-management"
export IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE}:latest"
```

### 2. Enable required APIs

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### 3. Create Artifact Registry repository

> One-time setup. Skip if the repository already exists.

```bash
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker images for role-base-management"
```

### 4. Authenticate Docker with Artifact Registry

```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### 5. Build and push

```bash
docker build --platform linux/amd64 -t $IMAGE_URL . && \
docker push $IMAGE_URL
```

### 6. Store secrets in Secret Manager

```bash
echo -n "your-db-password" | gcloud secrets create DB_PASSWORD --data-file=-
echo -n "your-jwt-secret"  | gcloud secrets create JWT_SECRET  --data-file=-

# Grant the default compute service account access to both secrets
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in DB_PASSWORD JWT_SECRET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 7. Deploy

```bash
gcloud run deploy $SERVICE \
  --image $IMAGE_URL \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DB_HOST=your-db-host" \
  --set-env-vars "DB_PORT=5432" \
  --set-env-vars "DB_USERNAME=your-db-username" \
  --set-env-vars "DB_NAME=your-db-name" \
  --set-env-vars "DB_SYNC=false" \
  --set-env-vars "DB_LOGGING=false" \
  --set-secrets "DB_PASSWORD=DB_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest"
```

> Cloud Run injects `PORT` automatically. The app reads `process.env.PORT` at startup — no hardcoding required.

### 8. Verify

```bash
# Print the service URL
gcloud run services describe $SERVICE \
  --region $REGION \
  --format "value(status.url)"

# Stream logs
gcloud run services logs tail $SERVICE --region $REGION
```

### One-liner: build → push → deploy

```bash
docker build --platform linux/amd64 -t $IMAGE_URL . && \
docker push $IMAGE_URL && \
gcloud run deploy $SERVICE --image $IMAGE_URL --region $REGION \
  --platform managed --allow-unauthenticated --port 3000
```

### Common deployment errors

| Error | Cause | Fix |
|---|---|---|
| `failed to start and listen on port` | Container crashed before `listen()` — usually a missing env var or wrong DB credentials | Check logs: `gcloud run services logs read $SERVICE --region $REGION` |
| `invalid ELF header` on `bcrypt` | Image built for `arm64` running on `amd64` Cloud Run host | Rebuild with `--platform linux/amd64` |
| `getaddrinfo ENOTFOUND "host"` | `DB_HOST` value includes literal quote characters | Remove quotes from `.env` values — `docker --env-file` does not strip them |
| `No secret version specified` | Secret does not exist in Secret Manager yet | Run step 6 before deploying |

---

## API Endpoints

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Exchange credentials for a JWT |
| `GET` | `/auth/me` | Bearer | Return the authenticated user's profile |

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

### Users — `/users`

| Method | Path | Required Role | Required Permission |
|---|---|---|---|
| `POST` | `/users` | `admin` | `users:create` |
| `GET` | `/users` | `admin`, `editor` | `users:read` |
| `GET` | `/users/me` | any authenticated | — |
| `GET` | `/users/:id` | `admin`, `editor` | `users:read` |
| `PATCH` | `/users/:id` | `admin` | `users:update` |
| `DELETE` | `/users/:id` | `admin` | `users:delete` |

**Create / update body fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | create | max 100 chars |
| `email` | `string` | create | unique, max 255 chars |
| `password` | `string` | create | 8–72 chars; stored as bcrypt hash |
| `status` | `enum` | no | `active` · `inactive` · `suspended` |
| `roleIds` | `string[]` | no | array of role UUIDs |

---

### Roles — `/roles`

All role endpoints require the `admin` role.

| Method | Path | Required Permission |
|---|---|---|
| `POST` | `/roles` | `roles:create` |
| `GET` | `/roles` | `roles:read` |
| `GET` | `/roles/:id` | `roles:read` |
| `PATCH` | `/roles/:id` | `roles:update` |
| `DELETE` | `/roles/:id` | `roles:delete` |

**Body fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | create | unique, max 100 chars |
| `description` | `string` | no | max 255 chars |
| `isActive` | `boolean` | no | defaults to `true` |
| `permissionIds` | `string[]` | no | array of permission UUIDs |

---

### Permissions — `/permissions`

All permission endpoints require the `admin` role.

| Method | Path | Required Permission |
|---|---|---|
| `POST` | `/permissions` | `permissions:create` |
| `GET` | `/permissions` | `permissions:read` |
| `GET` | `/permissions/:id` | `permissions:read` |
| `DELETE` | `/permissions/:id` | `permissions:delete` |

**Body fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `resource` | `string` | yes | e.g., `articles`, max 100 chars |
| `action` | `enum` | yes | `create` · `read` · `update` · `delete` · `manage` |
| `description` | `string` | no | max 255 chars |

The `slug` field (`resource:action`) is auto-generated by a `@BeforeInsert` / `@BeforeUpdate` hook and is not accepted in request bodies.

---

### Common Response Conventions

| Scenario | Status |
|---|---|
| Successful creation | `201 Created` |
| Successful read / update | `200 OK` |
| Successful delete | `204 No Content` |
| Validation failure | `400 Bad Request` |
| Missing / invalid token | `401 Unauthorized` |
| Insufficient role or permission | `403 Forbidden` |
| Resource not found | `404 Not Found` |
| Duplicate unique field | `409 Conflict` |

**Error shape:**
```json
{
  "statusCode": 403,
  "message": "Access denied. Missing permissions: [users:delete]",
  "error": "Forbidden"
}
```

`DELETE` endpoints perform a **soft delete** — records are excluded from all queries but retained in the database via TypeORM's `softRemove`.

---

## Quality Control

### Linting

ESLint is configured with `typescript-eslint`'s `strictTypeChecked + stylisticTypeChecked` presets (`eslint.config.mjs`). Key enforced policies:

- **Zero tolerance on `any`** — `no-explicit-any`, `no-unsafe-argument`, `no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`, and `no-unsafe-return` are all `error`-level.
- **Explicit return types** — all public methods and module boundary functions must declare their return type.
- **No floating promises** — every `Promise` must be awaited or explicitly voided.
- **Type-only imports** — `import type { Foo }` is enforced whenever a symbol is used only as a type annotation.
- **Nullish coalescing** — `??` over `||`; optional chaining over manual null checks.

```bash
pnpm lint      # ESLint with auto-fix
pnpm format    # Prettier
```

### Type Checking

`tsconfig.json` enables the full strict suite:

```jsonc
{
  "strict": true,
  "noImplicitReturns": true,
  "noUncheckedIndexedAccess": true,
  "noFallthroughCasesInSwitch": true
}
```

```bash
pnpm build     # tsc + nest build — must exit with zero errors
```

### Testing

```bash
pnpm test                                         # all unit tests
pnpm test:watch                                   # watch mode
pnpm test:cov                                     # coverage report → coverage/
pnpm test:e2e                                     # end-to-end suite
pnpm test -- --testPathPattern=users.service      # single file
```

Jest uses `ts-jest` as the transformer. Test files follow the `*.spec.ts` convention and live alongside their source files.

### Zero-Warning Policy

The required gate before any merge is:

```bash
pnpm lint && pnpm build
```

Both commands must exit `0`. The codebase contains no `eslint-disable` comments, `@ts-ignore` suppressions, or `// TODO` placeholders that bypass type safety.
