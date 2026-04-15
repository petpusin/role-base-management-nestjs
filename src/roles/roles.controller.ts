import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@ApiForbiddenResponse({ description: 'Insufficient role or permission' })
@Controller('roles')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles('admin')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('roles:create')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiCreatedResponse({ description: 'Role created', type: Role })
  async create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(dto);
  }

  @Get()
  @Permissions('roles:read')
  @ApiOperation({ summary: 'List all roles' })
  @ApiOkResponse({ description: 'List of roles', type: [Role] })
  async findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Permissions('roles:read')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiOkResponse({ description: 'Role found', type: Role })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('roles:update')
  @ApiOperation({ summary: 'Update a role' })
  @ApiOkResponse({ description: 'Role updated', type: Role })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<Role> {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('roles:delete')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiNoContentResponse({ description: 'Role deleted' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.rolesService.remove(id);
  }
}
