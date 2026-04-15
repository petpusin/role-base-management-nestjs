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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.PermissionAction = void 0;
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../common/entities/base.entity");
const role_entity_1 = require("../roles/role.entity");
var PermissionAction;
(function (PermissionAction) {
    PermissionAction["CREATE"] = "create";
    PermissionAction["READ"] = "read";
    PermissionAction["UPDATE"] = "update";
    PermissionAction["DELETE"] = "delete";
    PermissionAction["MANAGE"] = "manage";
})(PermissionAction || (exports.PermissionAction = PermissionAction = {}));
let Permission = class Permission extends base_entity_1.BaseEntity {
    resource;
    action;
    description;
    slug;
    roles;
    syncSlug() {
        this.slug = `${this.resource}:${this.action}`;
    }
};
exports.Permission = Permission;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'articles', maxLength: 100 }),
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Permission.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PermissionAction, example: PermissionAction.READ }),
    (0, typeorm_1.Column)({ type: 'enum', enum: PermissionAction }),
    __metadata("design:type", String)
], Permission.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Allows reading articles', nullable: true }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Permission.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'articles:read', maxLength: 150 }),
    (0, typeorm_1.Column)({ length: 150, unique: true }),
    __metadata("design:type", String)
], Permission.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => role_entity_1.Role, (role) => role.permissions),
    __metadata("design:type", Array)
], Permission.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Permission.prototype, "syncSlug", null);
exports.Permission = Permission = __decorate([
    (0, typeorm_1.Entity)('permissions'),
    (0, typeorm_1.Index)(['resource', 'action'], { unique: true })
], Permission);
//# sourceMappingURL=permission.entity.js.map