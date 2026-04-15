# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm start:dev          # watch mode
pnpm build              # compile via NestJS CLI (tsc + nest)
pnpm lint               # ESLint with --fix (runs automatically)
pnpm format             # Prettier

# Testing
pnpm test               # unit tests (Jest)
pnpm test:watch         # watch mode
pnpm test:cov           # coverage report
pnpm test:e2e           # end-to-end (test/jest-e2e.json config)
# Run a single test file:
pnpm test -- --testPathPattern=users.service

# Database (TypeORM CLI via ts-node, reads .env for credentials)
pnpm db:migrate         # run all pending migrations
pnpm db:migrate:revert  # roll back the last migration
pnpm db:migrate:show    # list applied / pending migrations
pnpm db:migrate:create  # scaffold a blank migration file
```

Required environment variables (create `.env` in project root):
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_NAME=rbac_db
JWT_SECRET=
JWT_EXPIRES_IN=1d   # optional, defaults to 1d
DB_SYNC=false       # never true in production — migrations own the schema
DB_LOGGING=false
```

## Architecture

### Guard pipeline (global-first)

Every route is protected by default. The execution order on every request:

1. **`JwtAuthGuard`** — registered as `APP_GUARD` in `AppModule`, so it wraps the entire app. Routes decorated with `@Public()` are skipped. On success it calls `JwtStrategy.validate()`, which does a **live DB fetch** (user + roles + permissions) and attaches the full object to `request.user`.
2. **`RolesGuard`** — applied per-controller/route via `@UseGuards(RolesGuard, PermissionsGuard)`. Checks `request.user.roles[].name` against the `@Roles()` decorator.
3. **`PermissionsGuard`** — checks `request.user.roles[].permissions[].slug` against `@Permissions()`. Supports a wildcard: `users:manage` satisfies any `users:*` check.

The consequence is that **`JwtStrategy.validate()` always runs a DB query**, keeping role/permission revocations effective immediately.

### Feature module layout

Each domain owns its entity, service, controller, DTOs, and module file:

```
src/
  auth/           # JWT strategy, guards, decorators, AuthService/Controller
  users/          # User entity, UsersService (owns password hashing logic)
  roles/          # Role entity, RolesService
  permissions/    # Permission entity, PermissionsService
  common/         # BaseEntity (id, createdAt, updatedAt, deletedAt)
  database/       # data-source.ts (CLI only), migrations/
```

`AppModule` uses `autoLoadEntities: true` — never list entities manually.

### Entity design notes

- **`BaseEntity`** (`src/common/entities/base.entity.ts`): all entities extend it; provides UUID primary key and soft-delete via `deletedAt`.
- **`passwordHash`** is selected out by default (`select: false`). Use `UsersService.findByEmail()` which adds `.addSelect('user.passwordHash')` via query builder for login flows.
- **`@BeforeInsert` / `@BeforeUpdate`** on `User` hashes `passwordHash` when it doesn't start with `$2b$`. Pass the plain-text password into `passwordHash` and the hook handles bcrypt (rounds: 12).
- Column decorators on `string | null` and `Date | null` properties **must** include an explicit `type:` (e.g., `type: 'varchar'`, `type: 'timestamptz'`). `reflect-metadata` collapses union types to `Object`, which PostgreSQL rejects at runtime.
- All entity and DTO properties use `!` (definite assignment assertion) because TypeORM/class-validator manage initialisation — TypeScript's `strictPropertyInitialization` would otherwise error.

### DTO patterns

- DTOs use `class-validator` + `class-transformer` (enforced by `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`).
- `UpdateUserDto` / `UpdateRoleDto` are `PartialType` of their create counterparts (`@nestjs/mapped-types`).
- Do **not** spread a DTO class instance into a `repo.create({...dto})` call — the `no-misused-spread` ESLint rule forbids it. Map properties explicitly.

### Migrations

- `src/database/data-source.ts` is only for the TypeORM CLI; the NestJS runtime uses `TypeOrmModule.forRootAsync()` in `AppModule`.
- `synchronize` is always `false`. Schema changes go through migration files in `src/database/migrations/`.
- Seed data uses fixed UUIDs and `ON CONFLICT DO NOTHING` so migrations are idempotent.

### Swagger

Docs are served at `/api/docs` (Swagger UI with `persistAuthorization: true`). Setup is in `src/main.ts`. Bearer token scheme name is `'access-token'` — match this when adding `@ApiBearerAuth()` to new controllers.

## TypeScript & ESLint strictness

- `strict: true` + `noUncheckedIndexedAccess: true` + `noImplicitReturns: true` are all active.
- ESLint uses `tseslint.configs.strictTypeChecked + stylisticTypeChecked` (flat config, `eslint.config.mjs`).
- `any` is banned in all forms (`no-explicit-any`, `no-unsafe-*`). Type request objects explicitly: `getRequest<{ user: RequestUser }>()`.
- `consistent-type-imports` is enforced — use `import type { Foo }` for types that are only referenced as type annotations.
- All public methods and module boundary functions require explicit return types.
- Always run `pnpm lint && pnpm build` before considering any task complete.
