import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'jane@example.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'securepass123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'UUIDs of roles to assign',
    example: ['d3c1e6a0-1234-4abc-8def-000000000001'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];
}
