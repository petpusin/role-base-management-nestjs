import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// Load .env before anything else so the CLI picks up DB credentials
config();

/**
 * Standalone DataSource used exclusively by the TypeORM CLI.
 * The NestJS app uses TypeOrmModule.forRootAsync() in AppModule — this file
 * is only imported via the npm migration scripts below.
 *
 * Scripts (package.json):
 *   db:migrate        – run all pending migrations
 *   db:migrate:revert – roll back the last migration
 *   db:migrate:show   – list applied / pending migrations
 *   db:migrate:create – scaffold a blank migration file
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'rbac_db',

  // Point at compiled TS source files so the CLI works without a build step
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],

  synchronize: false, // never true — migrations own the schema
  logging: ['migration'],
  ssl: { rejectUnauthorized: false },
});

export default AppDataSource;
