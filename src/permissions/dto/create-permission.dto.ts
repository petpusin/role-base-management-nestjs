import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PermissionAction } from '../permission.entity';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'articles',
    maxLength: 100,
    description: 'Resource name (e.g. users, posts)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  resource!: string;

  @ApiProperty({
    enum: PermissionAction,
    example: PermissionAction.READ,
    description: 'Action on the resource',
  })
  @IsEnum(PermissionAction)
  action!: PermissionAction;

  @ApiPropertyOptional({ example: 'Allows reading articles', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
