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
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permission_entity_1 = require("../../permissions/permission.entity");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const guard_meta_utils_1 = require("./guard-meta.utils");
let PermissionsGuard = class PermissionsGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredSlugs = (0, guard_meta_utils_1.getMetadata)(this.reflector, permissions_decorator_1.PERMISSIONS_KEY, context);
        if (!requiredSlugs?.length)
            return true;
        const { user } = context.switchToHttp().getRequest();
        const grantedSlugs = new Set(user.roles.flatMap((role) => role.permissions.map((p) => p.slug)));
        const missing = requiredSlugs.filter((required) => !this.isSatisfied(required, grantedSlugs));
        if (missing.length > 0) {
            throw new common_1.ForbiddenException(`Access denied. Missing permissions: [${missing.join(', ')}]`);
        }
        return true;
    }
    isSatisfied(required, granted) {
        if (granted.has(required))
            return true;
        const colonIdx = required.indexOf(':');
        if (colonIdx === -1)
            return false;
        const resource = required.slice(0, colonIdx);
        return granted.has(`${resource}:${permission_entity_1.PermissionAction.MANAGE}`);
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map