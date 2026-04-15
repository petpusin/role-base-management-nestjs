import { CreatePermissionDto } from './dto/create-permission.dto';
import { Permission } from './permission.entity';
import { PermissionsService } from './permissions.service';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    create(dto: CreatePermissionDto): Promise<Permission>;
    findAll(): Promise<Permission[]>;
    findOne(id: string): Promise<Permission>;
    remove(id: string): Promise<void>;
}
