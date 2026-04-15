"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedRolesAndPermissions1700000000002 = void 0;
class SeedRolesAndPermissions1700000000002 {
    name = 'SeedRolesAndPermissions1700000000002';
    ROLES = {
        admin: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        editor: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        user: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    };
    PERMISSIONS = {
        'users:create': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
        'users:read': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
        'users:update': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
        'users:delete': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04',
        'users:manage': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b05',
        'roles:create': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b06',
        'roles:read': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b07',
        'roles:update': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b08',
        'roles:delete': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b09',
        'roles:manage': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b10',
        'permissions:create': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
        'permissions:read': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
        'permissions:update': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
        'permissions:delete': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14',
        'permissions:manage': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
    };
    GRANTS = {
        admin: [
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
    async up(queryRunner) {
        const now = new Date().toISOString();
        await queryRunner.query(`
      INSERT INTO "roles" ("id", "name", "description", "is_active", "created_at", "updated_at")
      VALUES
        ($1, 'admin',  'Full system access — can manage all resources',         true, $4, $4),
        ($2, 'editor', 'Content manager — CRUD on users, read-only on RBAC',   true, $4, $4),
        ($3, 'user',   'Standard account — read-only access to own profile',    true, $4, $4)
      ON CONFLICT ("id") DO NOTHING
    `, [this.ROLES.admin, this.ROLES.editor, this.ROLES.user, now]);
        const permRows = Object.entries(this.PERMISSIONS).map(([slug, id]) => {
            const [resource, action] = slug.split(':');
            return { id, resource, action, slug };
        });
        for (const p of permRows) {
            await queryRunner.query(`
        INSERT INTO "permissions"
          ("id", "resource", "action", "slug", "created_at", "updated_at")
        VALUES ($1, $2, $3::permission_action_enum, $4, $5, $5)
        ON CONFLICT ("id") DO NOTHING
      `, [p.id, p.resource, p.action, p.slug, now]);
        }
        for (const [roleName, slugs] of Object.entries(this.GRANTS)) {
            const roleId = this.ROLES[roleName];
            for (const slug of slugs) {
                const permId = this.PERMISSIONS[slug];
                await queryRunner.query(`
          INSERT INTO "role_permissions" ("role_id", "permission_id")
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [roleId, permId]);
            }
        }
    }
    async down(queryRunner) {
        const roleIds = Object.values(this.ROLES);
        const permIds = Object.values(this.PERMISSIONS);
        await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "role_id" = ANY($1::uuid[])
    `, [roleIds]);
        await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "id" = ANY($1::uuid[])
    `, [permIds]);
        await queryRunner.query(`
      DELETE FROM "roles"
      WHERE "id" = ANY($1::uuid[])
    `, [roleIds]);
    }
}
exports.SeedRolesAndPermissions1700000000002 = SeedRolesAndPermissions1700000000002;
//# sourceMappingURL=1700000000002-SeedRolesAndPermissions.js.map