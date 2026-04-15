"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
(0, dotenv_1.config)();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'rbac_db',
    entities: ['../**/*.entity.ts'],
    migrations: ['../database/migrations/*.ts'],
    synchronize: false,
    logging: ['migration'],
    ssl: { rejectUnauthorized: false },
});
exports.default = AppDataSource;
//# sourceMappingURL=data-source.js.map