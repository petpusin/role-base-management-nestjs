import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Permission } from './permission.entity';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@ApiForbiddenResponse({ description: 'Insufficient role or permission' })
@Controller('permissions')
@UseGuards(RolesGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('admin')
  @Permissions('permissions:create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiCreatedResponse({ description: 'Permission created', type: Permission })
  async create(@Body() dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionsService.create(dto);
  }

  @Get()
  @Roles('admin')
  @Permissions('permissions:read')
  @ApiOperation({ summary: 'List all permissions' })
  @ApiOkResponse({ description: 'List of permissions', type: [Permission] })
  async findAll(): Promise<Permission[]> {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @Permissions('permissions:read')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiOkResponse({ description: 'Permission found', type: Permission })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Permission> {
    return this.permissionsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @Permissions('permissions:delete')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiNoContentResponse({ description: 'Permission deleted' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.permissionsService.remove(id);
  }
}
