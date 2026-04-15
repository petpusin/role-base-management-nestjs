import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../permissions/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({ where: { name: dto.name } });
    if (existing)
      throw new ConflictException(`Role '${dto.name}' already exists`);

    const permissions = dto.permissionIds?.length
      ? await this.permissionRepo.findBy({ id: In(dto.permissionIds) })
      : [];

    const role = this.roleRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      isActive: dto.isActive,
      permissions,
    });
    return this.roleRepo.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({
      relations: { permissions: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (dto.permissionIds !== undefined) {
      role.permissions = dto.permissionIds.length
        ? await this.permissionRepo.findBy({ id: In(dto.permissionIds) })
        : [];
    }

    Object.assign(role, dto);
    return this.roleRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepo.softRemove(role);
  }
}
