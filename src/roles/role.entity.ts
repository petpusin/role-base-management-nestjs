import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Permission } from '../permissions/permission.entity';
import { User } from '../users/user.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @ApiProperty({ example: 'editor', maxLength: 100 })
  @Column({ length: 100, unique: true })
  @Index()
  name!: string;

  @ApiPropertyOptional({ example: 'Can read and edit content', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: ['insert', 'update'],
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions!: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];
}
