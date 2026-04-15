import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the three baseline roles and the full permission matrix.
 *
 * ─── Roles ────────────────────────────────────────────────────────────────
 *  admin   – unrestricted: holds `manage` on every resource
 *  editor  – content work: CRUD on users, read-only on roles/permissions
 *  user    – self-service only: read own profile (users:read)
 *
 * ─── Permission matrix ────────────────────────────────────────────────────
 *  Resources × Actions = 15 permissions
 *  Resources : users | roles | permissions
 *  Actions   : create | read | update | delete | manage
 *
 * ─── Idempotency ─────────────────────────────────────────────────────────
 *  Every INSERT uses ON CONFLICT DO NOTHING so re-running is safe.
 *  Fixed UUIDs guarantee the FKs in role_permissions stay stable across
 *  environments (dev → staging → prod).
 *
 * ─── Down ────────────────────────────────────────────────────────────────
 *  Deletes only the rows inserted here, identified by their fixed UUIDs.
 *  Does NOT truncate the tables — safe to run beside hand-crafted data.
 */
export class SeedRolesAndPermissions1700000000002 implements MigrationInterface {
  name = 'SeedRolesAndPermissions1700000000002';

  // ── Fixed UUIDs — never change these after first deployment ──────────────

  private readonly ROLES = {
    admin: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    editor: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    user: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  } as const;

  private readonly PERMISSIONS: Record<string, string> = {
    // users
    'users:create': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
    'users:read': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
    'users:update': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
    'users:delete': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04',
    'users:manage': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b05',
    // roles
    'roles:create': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b06',
    'roles:read': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b07',
    'roles:update': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b08',
    'roles:delete': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b09',
    'roles:manage': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10',
    // permissions
    'permissions:create': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    'permissions:read': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
    'permissions:update': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
    'permissions:delete': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14',
    'permissions:manage': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
  };

  // ── Role → Permission grants ──────────────────────────────────────────────

  private readonly GRANTS: Record<keyof typeof this.ROLES, string[]> = {
    admin: [
      // manage wildcard covers all actions per resource in PermissionsGuard
      'users:manage',
      'roles:manage',
      'permissions:manage',
    ],
    editor: [
      'users:create',
      'users:read',
      'users:update',
      'roles:read',
      'permissions:read',
    ],
    user: ['users:read'],
  };

  // ─── UP ───────────────────────────────────────────────────────────────────

  async up(queryRunner: QueryRunner): Promise<void> {
    const now = new Date().toISOString();

    // 1. Roles ---------------------------------------------------------------
    await queryRunner.query(
      `
      INSERT INTO "roles" ("id", "name", "description", "is_active", "created_at", "updated_at")
      VALUES
        ($1, 'admin',  'Full system access — can manage all resources',         true, $4, $4),
        ($2, 'editor', 'Content manager — CRUD on users, read-only on RBAC',   true, $4, $4),
        ($3, 'user',   'Standard account — read-only access to own profile',    true, $4, $4)
      ON CONFLICT ("id") DO NOTHING
    `,
      [this.ROLES.admin, this.ROLES.editor, this.ROLES.user, now],
    );

    // 2. Permissions ---------------------------------------------------------
    //    Build a multi-row INSERT from the PERMISSIONS map.
    const permRows = Object.entries(this.PERMISSIONS).map(([slug, id]) => {
      const [resource, action] = slug.split(':');
      return { id, resource, action, slug };
    });

    for (const p of permRows) {
      await queryRunner.query(
        `
        INSERT INTO "permissions"
          ("id", "resource", "action", "slug", "created_at", "updated_at")
        VALUES ($1, $2, $3::permission_action_enum, $4, $5, $5)
        ON CONFLICT ("id") DO NOTHING
      `,
        [p.id, p.resource, p.action, p.slug, now],
      );
    }

    // 3. role_permissions grants ---------------------------------------------
    for (const [roleName, slugs] of Object.entries(this.GRANTS)) {
      const roleId = this.ROLES[roleName as keyof typeof this.ROLES];

      for (const slug of slugs) {
        const permId = this.PERMISSIONS[slug];
        await queryRunner.query(
          `
          INSERT INTO "role_permissions" ("role_id", "permission_id")
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
          [roleId, permId],
        );
      }
    }
  }

  // ─── DOWN (targeted delete — does not touch user-created data) ────────────

  async down(queryRunner: QueryRunner): Promise<void> {
    const roleIds = Object.values(this.ROLES);
    const permIds = Object.values(this.PERMISSIONS);

    // Remove grants first (FK child)
    await queryRunner.query(
      `
      DELETE FROM "role_permissions"
      WHERE "role_id" = ANY($1::uuid[])
    `,
      [roleIds],
    );

    // Remove permissions seeded here
    await queryRunner.query(
      `
      DELETE FROM "permissions"
      WHERE "id" = ANY($1::uuid[])
    `,
      [permIds],
    );

    // Remove roles seeded here
    await queryRunner.query(
      `
      DELETE FROM "roles"
      WHERE "id" = ANY($1::uuid[])
    `,
      [roleIds],
    );
  }
}
