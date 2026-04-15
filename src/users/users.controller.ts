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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { RequestUser } from '../auth/interfaces/request-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@ApiForbiddenResponse({ description: 'Insufficient role or permission' })
@Controller('users')
@UseGuards(RolesGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @Permissions('users:create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created', type: User })
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles('admin', 'editor')
  @Permissions('users:read')
  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ description: 'List of users', type: [User] })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current authenticated user' })
  getProfile(@CurrentUser() user: RequestUser): RequestUser {
    return user;
  }

  @Get(':id')
  @Roles('admin', 'editor')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiOkResponse({ description: 'User found', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({ description: 'User updated', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @Permissions('users:delete')
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiNoContentResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
