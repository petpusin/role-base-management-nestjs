import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../common/entities/base.entity';
import { Role } from '../roles/role.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ example: 'Jane Doe', maxLength: 100 })
  @Column({ length: 100 })
  name!: string;

  @ApiProperty({ example: 'jane@example.com', maxLength: 255 })
  @Column({ length: 255, unique: true })
  @Index()
  email!: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @ApiPropertyOptional({ example: null, nullable: true })
  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @ManyToMany(() => Role, (role) => role.users, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }

  async validatePassword(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.passwordHash);
  }
}
