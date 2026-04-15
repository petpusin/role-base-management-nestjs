import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the full RBAC schema from scratch.
 *
 * Execution order (dependency-safe):
 *   1. Enums
 *   2. permissions  (no FK deps)
 *   3. roles        (no FK deps)
 *   4. users        (no FK deps)
 *   5. role_permissions  (FK → roles, permissions)
 *   6. user_roles        (FK → users, roles)
 *
 * Down method drops in exact reverse order so a revert is safe.
 */
export class CreateSchema1700000000001 implements MigrationInterface {
  name = 'CreateSchema1700000000001';

  // ─── UP ───────────────────────────────────────────────────────────────────

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      CREATE TYPE "permission_action_enum" AS ENUM (
        'create', 'read', 'update', 'delete', 'manage'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM (
        'active', 'inactive', 'suspended'
      )
    `);

    // 2. permissions
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ,
        "resource"    VARCHAR(100)  NOT NULL,
        "action"      "permission_action_enum" NOT NULL,
        "description" VARCHAR(255),
        "slug"        VARCHAR(150)  NOT NULL,
        CONSTRAINT "pk_permissions"             PRIMARY KEY ("id"),
        CONSTRAINT "uq_permissions_slug"        UNIQUE ("slug"),
        CONSTRAINT "uq_permissions_resource_action" UNIQUE ("resource", "action")
      )
    `);

    // 3. roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ,
        "name"        VARCHAR(100) NOT NULL,
        "description" VARCHAR(255),
        "is_active"   BOOLEAN      NOT NULL DEFAULT true,
        CONSTRAINT "pk_roles"      PRIMARY KEY ("id"),
        CONSTRAINT "uq_roles_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_roles_name" ON "roles" ("name")
    `);

    // 4. users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
        "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "deleted_at"    TIMESTAMPTZ,
        "name"          VARCHAR(100) NOT NULL,
        "email"         VARCHAR(255) NOT NULL,
        "password_hash" VARCHAR      NOT NULL,
        "status"        "user_status_enum" NOT NULL DEFAULT 'active',
        "last_login_at" TIMESTAMPTZ,
        CONSTRAINT "pk_users"       PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users" ("email")
    `);

    // 5. role_permissions junction
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id"       UUID NOT NULL,
        "permission_id" UUID NOT NULL,
        CONSTRAINT "pk_role_permissions"
          PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "fk_role_permissions_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_role_permissions_permission"
          FOREIGN KEY ("permission_id")
          REFERENCES "permissions" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_role_permissions_role_id"
        ON "role_permissions" ("role_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_role_permissions_permission_id"
        ON "role_permissions" ("permission_id")
    `);

    // 6. user_roles junction
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" UUID NOT NULL,
        "role_id" UUID NOT NULL,
        CONSTRAINT "pk_user_roles"
          PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "fk_user_roles_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_user_roles_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_user_id" ON "user_roles" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_role_id" ON "user_roles" ("role_id")
    `);
  }

  // ─── DOWN (exact reverse) ─────────────────────────────────────────────────

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "permission_action_enum"`);
  }
}
