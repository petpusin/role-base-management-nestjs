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
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const create_permission_dto_1 = require("./dto/create-permission.dto");
const permission_entity_1 = require("./permission.entity");
const permissions_service_1 = require("./permissions.service");
let PermissionsController = class PermissionsController {
    permissionsService;
    constructor(permissionsService) {
        this.permissionsService = permissionsService;
    }
    async create(dto) {
        return this.permissionsService.create(dto);
    }
    async findAll() {
        return this.permissionsService.findAll();
    }
    async findOne(id) {
        return this.permissionsService.findOne(id);
    }
    async remove(id) {
        return this.permissionsService.remove(id);
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, permissions_decorator_1.Permissions)('permissions:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new permission' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Permission created', type: permission_entity_1.Permission }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_permission_dto_1.CreatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, permissions_decorator_1.Permissions)('permissions:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List all permissions' }),
    (0, swagger_1.ApiOkResponse)({ description: 'List of permissions', type: [permission_entity_1.Permission] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, permissions_decorator_1.Permissions)('permissions:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a permission by ID' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Permission found', type: permission_entity_1.Permission }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Permission not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)('admin'),
    (0, permissions_decorator_1.Permissions)('permissions:delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a permission' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Permission deleted' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Permission not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "remove", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, swagger_1.ApiTags)('permissions'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid token' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Insufficient role or permission' }),
    (0, common_1.Controller)('permissions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService])
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map