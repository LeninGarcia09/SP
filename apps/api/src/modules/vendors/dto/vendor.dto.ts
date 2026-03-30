import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { VendorStatus } from '@telnub/shared';

export class CreateVendorDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsEmail()
  @MaxLength(200)
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  addressLine1?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ enum: VendorStatus, default: VendorStatus.ACTIVE })
  @IsEnum(VendorStatus)
  @IsOptional()
  status?: VendorStatus;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsEmail()
  @MaxLength(200)
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  addressLine1?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ enum: VendorStatus })
  @IsEnum(VendorStatus)
  @IsOptional()
  status?: VendorStatus;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
