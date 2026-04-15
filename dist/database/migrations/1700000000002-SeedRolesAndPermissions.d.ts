import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class SeedRolesAndPermissions1700000000002 implements MigrationInterface {
    name: string;
    private readonly ROLES;
    private readonly PERMISSIONS;
    private readonly GRANTS;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
