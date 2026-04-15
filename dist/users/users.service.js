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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../roles/role.entity");
const user_entity_1 = require("./user.entity");
let UsersService = class UsersService {
    userRepo;
    roleRepo;
    constructor(userRepo, roleRepo) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }
    async create(dto) {
        const existing = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existing)
            throw new common_1.ConflictException(`Email '${dto.email}' is already in use`);
        const roles = dto.roleIds?.length
            ? await this.roleRepo.findBy({ id: (0, typeorm_2.In)(dto.roleIds) })
            : [];
        const user = this.userRepo.create({
            name: dto.name,
            email: dto.email,
            passwordHash: dto.password,
            status: dto.status,
            roles,
        });
        return this.userRepo.save(user);
    }
    async findAll() {
        return this.userRepo.find({
            relations: { roles: { permissions: true } },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: { roles: { permissions: true } },
        });
        if (!user)
            throw new common_1.NotFoundException(`User ${id} not found`);
        return user;
    }
    async findByEmail(email) {
        return this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoinAndSelect('role.permissions', 'permission')
            .where('user.email = :email', { email })
            .getOne();
    }
    async update(id, dto) {
        const user = await this.findOne(id);
        if (dto.roleIds !== undefined) {
            user.roles = dto.roleIds.length
                ? await this.roleRepo.findBy({ id: (0, typeorm_2.In)(dto.roleIds) })
                : [];
        }
        Object.assign(user, dto);
        return this.userRepo.save(user);
    }
    async remove(id) {
        const user = await this.findOne(id);
        await this.userRepo.softRemove(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map