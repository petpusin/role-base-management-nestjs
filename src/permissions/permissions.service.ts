import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const slug = `${dto.resource}:${dto.action}`;
    const existing = await this.permissionRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Permission '${slug}' already exists`);
    }

    const permission = this.permissionRepo.create({
      resource: dto.resource,
      action: dto.action,
      description: dto.description ?? null,
      slug,
    });
    return this.permissionRepo.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepo.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepo.findOne({ where: { id } });
    if (!permission) throw new NotFoundException(`Permission ${id} not found`);
    return permission;
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepo.softRemove(permission);
  }
}
