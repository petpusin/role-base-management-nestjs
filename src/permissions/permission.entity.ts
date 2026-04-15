import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  ManyToMany,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Role } from '../roles/role.entity';

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

@Entity('permissions')
@Index(['resource', 'action'], { unique: true })
export class Permission extends BaseEntity {
  @ApiProperty({ example: 'articles', maxLength: 100 })
  @Column({ length: 100 })
  resource!: string;

  @ApiProperty({ enum: PermissionAction, example: PermissionAction.READ })
  @Column({ type: 'enum', enum: PermissionAction })
  action!: PermissionAction;

  @ApiPropertyOptional({ example: 'Allows reading articles', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'articles:read', maxLength: 150 })
  @Column({ length: 150, unique: true })
  slug!: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];

  @BeforeInsert()
  @BeforeUpdate()
  syncSlug(): void {
    this.slug = `${this.resource}:${this.action}`;
  }
}
