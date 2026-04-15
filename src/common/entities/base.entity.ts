import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @ApiProperty({
    format: 'uuid',
    example: 'd3c1e6a0-1234-4abc-8def-000000000001',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ApiPropertyOptional({ example: null, nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
