import { Repository } from 'typeorm';
import { Permission } from '../permissions/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';
export declare class RolesService {
    private readonly roleRepo;
    private readonly permissionRepo;
    constructor(roleRepo: Repository<Role>, permissionRepo: Repository<Permission>);
    create(dto: CreateRoleDto): Promise<Role>;
    findAll(): Promise<Role[]>;
    findOne(id: string): Promise<Role>;
    update(id: string, dto: UpdateRoleDto): Promise<Role>;
    remove(id: string): Promise<void>;
}
