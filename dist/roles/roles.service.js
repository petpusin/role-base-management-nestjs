"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permission_entity_1 = require("../permissions/permission.entity");
const role_entity_1 = require("./role.entity");
let RolesService = class RolesService {
    roleRepo;
    permissionRepo;
    constructor(roleRepo, permissionRepo) {
        this.roleRepo = roleRepo;
        this.permissionRepo = permissionRepo;
    }
    async create(dto) {
        const existing = await this.roleRepo.findOne({ where: { name: dto.name } });
        if (existing)
            throw new common_1.ConflictException(`Role '${dto.name}' already exists`);
        const permissions = dto.permissionIds?.length
            ? await this.permissionRepo.findBy({ id: (0, typeorm_2.In)(dto.permissionIds) })
            : [];
        const role = this.roleRepo.create({
            name: dto.name,
            description: dto.description ?? null,
            isActive: dto.isActive,
            permissions,
        });
        return this.roleRepo.save(role);
    }
    async findAll() {
        return this.roleRepo.find({
            relations: { permissions: true },
            order: { name: 'ASC' },
        });
    }
    async findOne(id) {
        const role = await this.roleRepo.findOne({
            where: { id },
            relations: { permissions: true },
        });
        if (!role)
            throw new common_1.NotFoundException(`Role ${id} not found`);
        return role;
    }
    async update(id, dto) {
        const role = await this.findOne(id);
        if (dto.permissionIds !== undefined) {
            role.permissions = dto.permissionIds.length
                ? await this.permissionRepo.findBy({ id: (0, typeorm_2.In)(dto.permissionIds) })
                : [];
        }
        Object.assign(role, dto);
        return this.roleRepo.save(role);
    }
    async remove(id) {
        const role = await this.findOne(id);
        await this.roleRepo.softRemove(role);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map