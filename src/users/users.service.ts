import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../roles/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException(`Email '${dto.email}' is already in use`);

    const roles = dto.roleIds?.length
      ? await this.roleRepo.findBy({ id: In(dto.roleIds) })
      : [];

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: dto.password, // @BeforeInsert hashes it
      status: dto.status,
      roles,
    });

    return this.userRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: { roles: { permissions: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { roles: { permissions: true } },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.roleIds !== undefined) {
      user.roles = dto.roleIds.length
        ? await this.roleRepo.findBy({ id: In(dto.roleIds) })
        : [];
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.softRemove(user);
  }
}
